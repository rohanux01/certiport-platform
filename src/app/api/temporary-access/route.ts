import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canGrant, type Role, type Permission } from "@/lib/permissions";
import { logAudit } from "@/lib/auditLog";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const GrantTemporaryAccessSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  permission: z.enum([
    "manage-templates",
    "issue-certificate",
    "bulk-upload",
    "create-card",
    "approve-card",
    "view-audit-log",
    "manage-user-roles",
    "access-transformation",
    "manage-tenants",
  ]),
  reason: z.string().min(5, "A justification reason is required"),
  durationHours: z.number().min(1).max(720).default(24),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) return NextResponse.json([]);

  const now = new Date();

  // Mark expired grants
  await db.temporaryAccess.updateMany({
    where: {
      recipient: { organizationId },
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  const grants = await db.temporaryAccess.findMany({
    where: {
      recipient: { organizationId },
    },
    include: {
      recipient: { select: { id: true, name: true, email: true, role: true } },
      grantedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(grants);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = (session.user as any).role as Role;
  const actorId = (session.user as any).id as string;
  const organizationId = (session.user as any).organizationId as string;

  if (!can(actorRole, "access-transformation")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to perform Access Transformation." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = GrantTemporaryAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipientId, permission, reason, durationHours } = parsed.data;

  // SRS §3.4 Permission Ceiling check
  if (!canGrant(actorRole, permission as Permission)) {
    return NextResponse.json(
      {
        error: `Permission Ceiling Violation: You cannot grant permission "${permission}" because your own role (${actorRole}) does not hold it.`,
      },
      { status: 403 }
    );
  }

  const recipient = await db.user.findFirst({
    where: { id: recipientId, organizationId },
  });

  if (!recipient) {
    return NextResponse.json({ error: "Recipient user not found in this organization." }, { status: 404 });
  }

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

  const grant = await db.temporaryAccess.create({
    data: {
      recipientId,
      grantedById: actorId,
      permission,
      reason,
      startsAt,
      expiresAt,
      status: "ACTIVE",
    },
    include: {
      recipient: { select: { name: true, email: true } },
      grantedBy: { select: { name: true } },
    },
  });

  await logAudit({
    organizationId,
    actorId,
    action: "permission.grant.temporary",
    entityType: "TemporaryAccess",
    entityId: grant.id,
    newValue: {
      recipientId,
      permission,
      reason,
      expiresAt,
    },
  });

  try {
    await sendNotification({
      organizationId,
      actorId,
      eventKey: "access-granted",
      recipientEmail: grant.recipient.email,
      recipientName: grant.recipient.name || "Colleague",
      data: {
        permission,
        reason,
        grantedByName: grant.grantedBy.name || "Administrator",
        expiresAt,
        durationHours,
      },
    });
  } catch (notifErr) {
    console.warn("Failed to dispatch access-granted notification:", notifErr);
  }

  return NextResponse.json(grant, { status: 201 });
}
