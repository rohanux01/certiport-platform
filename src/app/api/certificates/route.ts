import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { hasEffectivePermission } from "@/lib/effectivePermissions";
import { logAudit } from "@/lib/auditLog";
import { sendNotification } from "@/lib/notifications";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";

const CreateCertificateSchema = z.object({
  templateId: z.string(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().optional(),
  courseName: z.string().min(1),
  studentId: z.string().optional(),
  grade: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const certificates = await db.certificate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { template: { select: { name: true } } },
  });
  return NextResponse.json(certificates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const allowed = await hasEffectivePermission({ id: userId, role }, "issue-certificate");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden — your role cannot issue certificates" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateCertificateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const organizationId = (session.user as any).organizationId;

  // Certificate ref pattern from the SRS mockup: MER/2026/<COURSE>/######
  const year = new Date().getFullYear();
  const courseCode = parsed.data.courseName.slice(0, 4).toUpperCase();
  const seq = Math.floor(100000 + Math.random() * 899999);
  const certificateRef = `MER/${year}/${courseCode}/${seq}`;

  // Retrieve template to composite background artwork if present
  const template = await db.template.findUnique({
    where: { id: parsed.data.templateId },
  });

  const now = new Date();
  let fileUrl: string | null = null;

  try {
    const orientation = (template?.fieldLayout as any)?.orientation === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE";
    const pdfBytes = await generateCertificatePdf({
      recipientName: parsed.data.recipientName,
      courseName: parsed.data.courseName,
      certificateRef,
      issuedAt: now,
      grade: parsed.data.grade,
      backgroundUrl: template?.backgroundUrl,
      orientation,
    });

    const certsDir = path.join(process.cwd(), "public", "uploads", "certificates");
    await fs.mkdir(certsDir, { recursive: true });
    const cleanRef = certificateRef.replace(/[^a-zA-Z0-9]/g, "_");
    const certFilename = `cert_${cleanRef}_${Date.now()}.pdf`;
    await fs.writeFile(path.join(certsDir, certFilename), Buffer.from(pdfBytes));
    fileUrl = `/uploads/certificates/${certFilename}`;
  } catch (pdfErr) {
    console.warn("PDF generation error during certificate issuance:", pdfErr);
  }

  const certificate = await db.certificate.create({
    data: {
      organizationId,
      templateId: parsed.data.templateId,
      certificateRef,
      recipientName: parsed.data.recipientName,
      recipientEmail: parsed.data.recipientEmail,
      recipientPhone: parsed.data.recipientPhone,
      courseName: parsed.data.courseName,
      studentId: parsed.data.studentId,
      grade: parsed.data.grade,
      status: "ISSUED",
      fileUrl,
      issuedAt: now,
      issuedById: userId,
    },
  });

  await logAudit({
    organizationId,
    actorId: userId,
    action: "certificate.create",
    entityType: "Certificate",
    entityId: certificate.id,
    newValue: certificate,
  });

  try {
    await sendNotification({
      organizationId,
      actorId: userId,
      eventKey: "certificate-issued",
      recipientEmail: parsed.data.recipientEmail,
      recipientPhone: parsed.data.recipientPhone,
      recipientName: parsed.data.recipientName,
      data: {
        courseName: parsed.data.courseName,
        certificateRef: certificate.certificateRef,
        publicId: certificate.qrPublicId,
        issueDate: certificate.issuedAt,
      },
    });
  } catch (notifErr) {
    console.warn("Failed to dispatch certificate notification:", notifErr);
  }

  return NextResponse.json(certificate, { status: 201 });
}
