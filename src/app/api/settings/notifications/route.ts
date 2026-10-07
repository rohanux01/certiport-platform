import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/permissions";
import { logAudit } from "@/lib/auditLog";
import { z } from "zod";

const DEFAULT_EVENTS = [
  { eventKey: "certificate-issued", emailEnabled: true, whatsappEnabled: false },
  { eventKey: "card-pending", emailEnabled: true, whatsappEnabled: true },
  { eventKey: "candidate-approved", emailEnabled: true, whatsappEnabled: true },
  { eventKey: "changes-requested", emailEnabled: true, whatsappEnabled: false },
  { eventKey: "access-granted", emailEnabled: true, whatsappEnabled: false },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) return NextResponse.json([]);

  const settings = await db.notificationSetting.findMany({
    where: { organizationId },
  });

  // Ensure defaults exist for missing keys
  const existingKeys = new Set(settings.map((s) => s.eventKey));
  const fullSettings = [...settings];

  for (const def of DEFAULT_EVENTS) {
    if (!existingKeys.has(def.eventKey)) {
      fullSettings.push({
        id: `virtual-${def.eventKey}`,
        organizationId,
        eventKey: def.eventKey,
        emailEnabled: def.emailEnabled,
        whatsappEnabled: def.whatsappEnabled,
      });
    }
  }

  return NextResponse.json(fullSettings);
}

const UpdateNotificationSchema = z.object({
  eventKey: z.string().min(1),
  emailEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as Role;
  if (!can(role, "manage-templates")) {
    return NextResponse.json(
      { error: "Forbidden: Org Admin permissions required to modify notification settings." },
      { status: 403 }
    );
  }

  const organizationId = (session.user as any).organizationId as string;
  const actorId = (session.user as any).id as string;

  const body = await req.json();
  const parsed = UpdateNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { eventKey, emailEnabled, whatsappEnabled } = parsed.data;

  const updated = await db.notificationSetting.upsert({
    where: {
      organizationId_eventKey: {
        organizationId,
        eventKey,
      },
    },
    update: {
      emailEnabled,
      whatsappEnabled,
    },
    create: {
      organizationId,
      eventKey,
      emailEnabled,
      whatsappEnabled,
    },
  });

  await logAudit({
    organizationId,
    actorId,
    action: "notifications.update",
    entityType: "NotificationSetting",
    entityId: updated.id,
    newValue: { eventKey, emailEnabled, whatsappEnabled },
  });

  return NextResponse.json(updated);
}
