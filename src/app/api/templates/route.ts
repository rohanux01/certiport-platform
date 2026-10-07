import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import { z } from "zod";

const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(["CERTIFICATE", "ID_CARD", "BUSINESS_CARD"]),
  source: z
    .enum([
      "UPLOADED_IMAGE",
      "UPLOADED_HTML",
      "UPLOADED_PDF",
      "DESIGNED_FROM_SCRATCH",
    ])
    .optional()
    .default("DESIGNED_FROM_SCRATCH"),
  backgroundUrl: z.string().optional().nullable(),
  backgroundHtml: z.string().optional().nullable(),
  fieldLayout: z.any().optional().default([]),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) {
    return NextResponse.json([]);
  }

  const templates = await db.template.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const allowed = await hasEffectivePermission({ id: userId, role }, "manage-templates");
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden — your role cannot manage templates" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const organizationId = (session.user as any).organizationId as string;

  const template = await db.template.create({
    data: {
      organizationId,
      name: parsed.data.name,
      type: parsed.data.type,
      source: parsed.data.source,
      backgroundUrl: parsed.data.backgroundUrl || null,
      backgroundHtml: parsed.data.backgroundHtml || null,
      fieldLayout: parsed.data.fieldLayout ?? [],
      isDefault: parsed.data.isDefault,
      isActive: parsed.data.isActive,
    },
  });

  await logAudit({
    organizationId,
    actorId: userId,
    action: "template.create",
    entityType: "Template",
    entityId: template.id,
    newValue: template,
  });

  return NextResponse.json(template, { status: 201 });
}
