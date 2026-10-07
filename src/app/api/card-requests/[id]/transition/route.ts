import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import { sendNotification } from "@/lib/notifications";
import { nextCardStatus, type CardEvent } from "@/lib/cardWorkflow";
import { generateCardPdf } from "@/lib/generateCardPdf";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";

const TransitionSchema = z.object({
  event: z.enum([
    "SUBMIT", "ADMIN_APPROVE", "ADMIN_REQUEST_CHANGES", "RESUBMIT",
    "CANDIDATE_APPROVE", "CANDIDATE_REQUEST_CHANGES", "RESEND_TO_CANDIDATE", "FINALIZE",
  ]),
  comment: z.string().optional(),
});

// Events an Org Admin (or Super Admin) must trigger — everything else is
// available to whoever submitted the request, or — for the CANDIDATE_*
// events — arrives from the token-based public route, not this one.
const ADMIN_ONLY_EVENTS: CardEvent[] = ["ADMIN_APPROVE", "ADMIN_REQUEST_CHANGES", "FINALIZE"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { event, comment } = parsed.data;

  if (ADMIN_ONLY_EVENTS.includes(event)) {
    const allowed = await hasEffectivePermission({ id: userId, role }, "approve-card");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden — only an Org Admin or elevated user can do that" }, { status: 403 });
    }
  }

  const cardRequest = await db.cardRequest.findUnique({ where: { id } });
  if (!cardRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newStatus;
  try {
    newStatus = nextCardStatus(cardRequest.status as any, event);
  } catch {
    return NextResponse.json(
      { error: `Cannot apply "${event}" to a request in status "${cardRequest.status}"` },
      { status: 409 },
    );
  }

  let fileUrl = cardRequest.fileUrl;
  if (newStatus === "FINALIZED") {
    try {
      const template = await db.template.findUnique({ where: { id: cardRequest.templateId } });
      const fields = (cardRequest.fields as Record<string, any>) || {};
      const orientation = (template?.fieldLayout as any)?.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE";

      const pdfBytes = await generateCardPdf({
        fullName: fields.fullName || "Candidate",
        jobTitle: fields.jobTitle,
        employeeId: fields.employeeId,
        email: fields.email,
        phone: fields.phone,
        bloodGroup: fields.bloodGroup,
        templateName: template?.name || "Corporate Card",
        templateType: cardRequest.type,
        backgroundUrl: template?.backgroundUrl,
        orientation,
      });

      const cardsDir = path.join(process.cwd(), "public", "uploads", "cards");
      await fs.mkdir(cardsDir, { recursive: true });
      const cardFilename = `card_${cardRequest.id}_${Date.now()}.pdf`;
      await fs.writeFile(path.join(cardsDir, cardFilename), Buffer.from(pdfBytes));
      fileUrl = `/uploads/cards/${cardFilename}`;
    } catch (pdfErr) {
      console.warn("Card PDF generation error during finalization:", pdfErr);
    }
  }

  const updated = await db.cardRequest.update({
    where: { id },
    data: { status: newStatus, fileUrl },
  });

  if (comment) {
    await db.cardRequestComment.create({
      data: {
        cardRequestId: id,
        authorLabel: `${session.user.name} (${role})`,
        body: comment,
      },
    });
  }

  await logAudit({
    organizationId: cardRequest.organizationId,
    actorId: (session.user as any).id,
    action: `card-request.${event.toLowerCase()}`,
    entityType: "CardRequest",
    entityId: cardRequest.id,
    oldValue: { status: cardRequest.status },
    newValue: { status: newStatus },
  });

  // Multichannel notification dispatch (SRS §8.1 / §6.7)
  try {
    const fields = (cardRequest.fields as Record<string, any>) || {};
    const candidateName = fields.fullName || "Candidate";
    const candidateEmail = fields.email || null;
    const candidatePhone = fields.phone || null;

    if (event === "SUBMIT") {
      await sendNotification({
        organizationId: cardRequest.organizationId,
        actorId: userId,
        eventKey: "card-pending",
        recipientEmail: (session.user as any).email,
        recipientPhone: null,
        recipientName: session.user.name || "Administrator",
        data: {
          candidateName,
          refNumber: cardRequest.id.slice(0, 10).toUpperCase(),
          cardRequestId: cardRequest.id,
          submittedBy: session.user.name,
        },
      });
    } else if (event === "CANDIDATE_APPROVE") {
      await sendNotification({
        organizationId: cardRequest.organizationId,
        actorId: userId,
        eventKey: "candidate-approved",
        recipientEmail: (session.user as any).email,
        recipientPhone: null,
        recipientName: "Administrator",
        data: {
          candidateName,
          refNumber: cardRequest.id.slice(0, 10).toUpperCase(),
          cardRequestId: cardRequest.id,
        },
      });
    } else if (event === "ADMIN_REQUEST_CHANGES" || event === "CANDIDATE_REQUEST_CHANGES") {
      await sendNotification({
        organizationId: cardRequest.organizationId,
        actorId: userId,
        eventKey: "changes-requested",
        recipientEmail: candidateEmail || (session.user as any).email,
        recipientPhone: candidatePhone,
        recipientName: candidateName,
        data: {
          candidateName,
          refNumber: cardRequest.id.slice(0, 10).toUpperCase(),
          cardRequestId: cardRequest.id,
          comment: comment || "Revisions needed.",
          requestedBy: session.user.name,
        },
      });
    }
  } catch (notifErr) {
    console.warn("Card request notification dispatch error:", notifErr);
  }

  return NextResponse.json(updated);
}
