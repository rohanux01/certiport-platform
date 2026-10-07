import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import { z } from "zod";

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["CERTIFICATE", "ID_CARD", "BUSINESS_CARD"]).optional(),
  source: z
    .enum([
      "UPLOADED_IMAGE",
      "UPLOADED_HTML",
      "UPLOADED_PDF",
      "DESIGNED_FROM_SCRATCH",
    ])
    .optional(),
  backgroundUrl: z.string().optional().nullable(),
  backgroundHtml: z.string().optional().nullable(),
  fieldLayout: z.any().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const organizationId = (session.user as any).organizationId as string | undefined;

  const template = await db.template.findUnique({
    where: { id },
  });

  if (!template || template.organizationId !== organizationId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id as string | undefined;
  if (!(await hasEffectivePermission({ id: userId, role }, "manage-templates"))) {
    return NextResponse.json(
      { error: "Forbidden — your role or active permissions cannot manage templates" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const organizationId = (session.user as any).organizationId as string;

  const existing = await db.template.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== organizationId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.template.update({
    where: { id },
    data: {
      ...parsed.data,
      version: { increment: 1 },
    },
  });

  await logAudit({
    organizationId,
    actorId: userId,
    action: "template.update",
    entityType: "Template",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id as string | undefined;
  if (!(await hasEffectivePermission({ id: userId, role }, "manage-templates"))) {
    return NextResponse.json(
      { error: "Forbidden — your role or active permissions cannot delete templates" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const organizationId = (session.user as any).organizationId as string;

  const existing = await db.template.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== organizationId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const certCount = await db.certificate.count({ where: { templateId: id } });
  const cardCount = await db.cardRequest.count({ where: { templateId: id } });

  if (certCount > 0 || cardCount > 0) {
    // Soft-delete / deactivate to preserve historical issuance integrity
    await db.template.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      organizationId,
      actorId: userId,
      action: "template.archive",
      entityType: "Template",
      entityId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false, reason: "Archived due to active linked credentials" },
    });

    return NextResponse.json({
      success: true,
      archived: true,
      message: `Template deactivated and archived (${certCount + cardCount} issued credentials linked).`,
    });
  }

  // Delete directly if no credentials linked
  await db.template.delete({ where: { id } });

  await logAudit({
    organizationId,
    actorId: userId,
    action: "template.delete",
    entityType: "Template",
    entityId: id,
    oldValue: existing,
  });

  return NextResponse.json({ success: true, message: "Template deleted successfully" });
}
