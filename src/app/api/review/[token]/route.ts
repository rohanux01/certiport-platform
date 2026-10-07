import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nextCardStatus } from "@/lib/cardWorkflow";
import { logAudit } from "@/lib/auditLog";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const CandidateActionSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_CHANGES"]),
  comment: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const cardRequest = await db.cardRequest.findUnique({
    where: { candidateToken: token },
    include: {
      template: { select: { name: true, type: true, backgroundUrl: true } },
      organization: { select: { name: true } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cardRequest) {
    return NextResponse.json({ error: "Invalid or expired review link" }, { status: 404 });
  }

  return NextResponse.json(cardRequest);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const parsed = CandidateActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardRequest = await db.cardRequest.findUnique({
    where: { candidateToken: token },
  });

  if (!cardRequest) {
    return NextResponse.json({ error: "Invalid or expired review link" }, { status: 404 });
  }

  const event = parsed.data.action === "APPROVE" ? "CANDIDATE_APPROVE" : "CANDIDATE_REQUEST_CHANGES";

  let newStatus;
  try {
    newStatus = nextCardStatus(cardRequest.status as any, event);
  } catch {
    return NextResponse.json(
      { error: `Cannot perform action from current status "${cardRequest.status}"` },
      { status: 409 }
    );
  }

  const updated = await db.cardRequest.update({
    where: { candidateToken: token },
    data: { status: newStatus },
  });

  const fields = cardRequest.fields as Record<string, any>;
  const candidateName = fields?.fullName || "Candidate";

  if (parsed.data.comment) {
    await db.cardRequestComment.create({
      data: {
        cardRequestId: cardRequest.id,
        authorLabel: `${candidateName} (Candidate)`,
        body: parsed.data.comment,
      },
    });
  }

  await logAudit({
    organizationId: cardRequest.organizationId,
    actorId: undefined, // unauthenticated external candidate
    action: `card-request.candidate_${parsed.data.action.toLowerCase()}`,
    entityType: "CardRequest",
    entityId: cardRequest.id,
    oldValue: { status: cardRequest.status },
    newValue: { status: newStatus },
  });

  try {
    if (parsed.data.action === "APPROVE") {
      await sendNotification({
        organizationId: cardRequest.organizationId,
        eventKey: "candidate-approved",
        recipientName: "Administrator",
        data: {
          candidateName,
          refNumber: cardRequest.id.slice(0, 10).toUpperCase(),
          cardRequestId: cardRequest.id,
        },
      });
    } else {
      await sendNotification({
        organizationId: cardRequest.organizationId,
        eventKey: "changes-requested",
        recipientName: candidateName,
        recipientEmail: fields?.email || null,
        recipientPhone: fields?.phone || null,
        data: {
          candidateName,
          refNumber: cardRequest.id.slice(0, 10).toUpperCase(),
          cardRequestId: cardRequest.id,
          comment: parsed.data.comment || "Candidate requested revisions.",
          requestedBy: candidateName,
        },
      });
    }
  } catch (notifErr) {
    console.warn("Candidate review notification dispatch error:", notifErr);
  }

  return NextResponse.json(updated);
}
