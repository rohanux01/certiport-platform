import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";

const RecipientItemSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientEmail: z.string().email("Valid email is required"),
  recipientPhone: z.string().optional().nullable(),
  courseName: z.string().min(1, "Course name is required"),
  studentId: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
});

const BulkIssueSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  recipients: z.array(RecipientItemSchema).min(1, "At least one recipient is required").max(500, "Maximum 500 recipients per batch"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id as string;
    const allowed =
      (await hasEffectivePermission({ id: userId, role }, "bulk-upload")) ||
      (await hasEffectivePermission({ id: userId, role }, "issue-certificate"));

    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden — your role cannot perform bulk certificate issuance" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = BulkIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const organizationId = (session.user as any).organizationId as string;
    const { templateId, recipients } = parsed.data;

    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template || template.organizationId !== organizationId) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const certsDir = path.join(process.cwd(), "public", "uploads", "certificates");
    await fs.mkdir(certsDir, { recursive: true });

    const orientation = (template.fieldLayout as any)?.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE";
    const year = new Date().getFullYear();
    const now = new Date();

    const createdCertificates = [];

    for (let i = 0; i < recipients.length; i++) {
      const rec = recipients[i];
      const courseCode = rec.courseName.slice(0, 4).toUpperCase();
      const seq = Math.floor(100000 + Math.random() * 899999);
      const certificateRef = `MER/${year}/${courseCode}/${seq}`;

      let fileUrl: string | null = null;
      try {
        const pdfBytes = await generateCertificatePdf({
          recipientName: rec.recipientName,
          courseName: rec.courseName,
          certificateRef,
          issuedAt: now,
          grade: rec.grade,
          backgroundUrl: template.backgroundUrl,
          orientation,
        });

        const cleanRef = certificateRef.replace(/[^a-zA-Z0-9]/g, "_");
        const certFilename = `cert_${cleanRef}_${Date.now()}_${i}.pdf`;
        await fs.writeFile(path.join(certsDir, certFilename), Buffer.from(pdfBytes));
        fileUrl = `/uploads/certificates/${certFilename}`;
      } catch (pdfErr) {
        console.warn(`PDF error for recipient ${rec.recipientName}:`, pdfErr);
      }

      const cert = await db.certificate.create({
        data: {
          organizationId,
          templateId,
          certificateRef,
          recipientName: rec.recipientName,
          recipientEmail: rec.recipientEmail,
          recipientPhone: rec.recipientPhone || null,
          courseName: rec.courseName,
          studentId: rec.studentId || null,
          grade: rec.grade || null,
          status: "ISSUED",
          fileUrl,
          issuedAt: now,
          issuedById: userId,
        },
      });

      createdCertificates.push({
        id: cert.id,
        certificateRef: cert.certificateRef,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        qrPublicId: cert.qrPublicId,
        fileUrl: cert.fileUrl,
      });
    }

    await logAudit({
      organizationId,
      actorId: userId,
      action: "certificate.bulk_issue",
      entityType: "Certificate",
      entityId: templateId,
      newValue: {
        templateId,
        count: createdCertificates.length,
      },
    });

    return NextResponse.json({
      success: true,
      count: createdCertificates.length,
      certificates: createdCertificates,
    });
  } catch (err: any) {
    console.error("Bulk certificate issuance error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to issue certificates in bulk" },
      { status: 500 }
    );
  }
}
