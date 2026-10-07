import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// SRS §6.1 QR Engine: "URL-based, data-linked: /verify/{publicId}. Underlying
// data can update without changing the QR code or URL." This is intentionally
// public and unauthenticated — that's the point of a verification link.
export async function GET(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const certificate = await db.certificate.findUnique({
    where: { qrPublicId: publicId },
    select: {
      certificateRef: true,
      recipientName: true,
      courseName: true,
      status: true,
      issuedAt: true,
      grade: true,
      organization: { select: { name: true } },
    },
  });

  if (!certificate || certificate.status === "REVOKED") {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    ...certificate,
  });
}
