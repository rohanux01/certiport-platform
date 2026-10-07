import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import path from "path";
import fs from "fs/promises";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const organizationId = (session.user as any).organizationId as string;
    const userId = (session.user as any).id as string;

    if (!(await hasEffectivePermission({ id: userId, role }, "manage-templates"))) {
      return NextResponse.json(
        { error: "Forbidden — your role or active permissions cannot manage templates" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const templateId = formData.get("templateId") as string | null;
    const pageImageDataUrl = formData.get("pageImageDataUrl") as string | null;

    if (!file && !pageImageDataUrl) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "templates");
    await fs.mkdir(uploadsDir, { recursive: true });

    let fileUrl = "";
    let previewUrl = "";
    const timestamp = Date.now();

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File exceeds 25MB maximum limit" },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only PDF, PNG, JPG, and WebP are allowed." },
          { status: 400 }
        );
      }

      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const savedName = "tpl_" + timestamp + "_" + originalName;
      const filePath = path.join(uploadsDir, savedName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      fileUrl = "/uploads/templates/" + savedName;
    }

    // If client supplied rendered page preview (e.g. from PDF.js for a PDF file)
    if (pageImageDataUrl && pageImageDataUrl.startsWith("data:image/")) {
      const matches = pageImageDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const previewName = "tpl_" + timestamp + "_preview." + ext;
        const previewPath = path.join(uploadsDir, previewName);
        const buffer = Buffer.from(matches[2], "base64");
        await fs.writeFile(previewPath, buffer);
        previewUrl = "/uploads/templates/" + previewName;
      }
    }

    // Determine primary display background URL
    const activeBackgroundUrl = previewUrl || fileUrl;

    // If templateId was provided, update template in database
    if (templateId) {
      const template = await db.template.findUnique({
        where: { id: templateId },
      });

      if (!template || template.organizationId !== organizationId) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      const isPdf = file?.type === "application/pdf";
      const updated = await db.template.update({
        where: { id: templateId },
        data: {
          backgroundUrl: activeBackgroundUrl,
          source: isPdf ? "UPLOADED_PDF" : "UPLOADED_IMAGE",
          version: { increment: 1 },
        },
      });

      await logAudit({
        organizationId,
        actorId: userId,
        action: "template.update",
        entityType: "Template",
        entityId: templateId,
        oldValue: { backgroundUrl: template.backgroundUrl, source: template.source },
        newValue: { backgroundUrl: activeBackgroundUrl, source: updated.source },
      });

      return NextResponse.json({
        success: true,
        fileUrl,
        previewUrl: activeBackgroundUrl,
        template: updated,
      });
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      previewUrl: activeBackgroundUrl,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
