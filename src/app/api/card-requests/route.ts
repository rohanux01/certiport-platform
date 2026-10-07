import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/auditLog";
import { z } from "zod";

const CreateCardRequestSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  type: z.enum(["ID_CARD", "BUSINESS_CARD"]),
  fields: z.object({
    fullName: z.string().min(1, "Full name is required"),
    jobTitle: z.string().min(1, "Job title is required"),
    employeeId: z.string().optional(),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    bloodGroup: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) {
    return NextResponse.json([]);
  }

  const searchParams = req.nextUrl.searchParams;
  const statusFilter = searchParams.get("status");

  const cardRequests = await db.cardRequest.findMany({
    where: {
      organizationId,
      ...(statusFilter ? { status: statusFilter as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { id: true, name: true, type: true } },
      submittedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(cardRequests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!can(role, "create-card")) {
    return NextResponse.json(
      { error: "Forbidden — your role cannot submit card requests" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = CreateCardRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const organizationId = (session.user as any).organizationId as string;
  const userId = (session.user as any).id as string;

  // Verify template exists in org
  const template = await db.template.findFirst({
    where: { id: parsed.data.templateId, organizationId },
  });
  if (!template) {
    return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
  }

  const cardRequest = await db.cardRequest.create({
    data: {
      organizationId,
      templateId: parsed.data.templateId,
      type: parsed.data.type,
      status: "DRAFT",
      fields: parsed.data.fields,
      submittedById: userId,
    },
    include: {
      template: { select: { name: true } },
    },
  });

  await logAudit({
    organizationId,
    actorId: userId,
    action: "card-request.create",
    entityType: "CardRequest",
    entityId: cardRequest.id,
    newValue: cardRequest,
  });

  return NextResponse.json(cardRequest, { status: 201 });
}
