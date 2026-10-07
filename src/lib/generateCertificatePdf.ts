import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

/**
 * Real vector PDF generation (SRS §5.6 / §5.5).
 * Composites uploaded template artwork (PDF page or PNG/JPG image)
 * underneath the dynamic certificate data.
 */
export async function generateCertificatePdf(params: {
  recipientName: string;
  courseName: string;
  certificateRef: string;
  issuedAt: Date;
  grade?: string | null;
  backgroundUrl?: string | null;
  orientation?: "LANDSCAPE" | "PORTRAIT";
}): Promise<Uint8Array> {
  const isPortrait = params.orientation === "PORTRAIT";
  const pageWidth = isPortrait ? 595 : 842; // A4 in points
  const pageHeight = isPortrait ? 842 : 595;

  const doc = await PDFDocument.create();
  const page = doc.addPage([pageWidth, pageHeight]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);

  let hasCustomBg = false;

  if (params.backgroundUrl) {
    try {
      let bgBuffer: Buffer | null = null;
      if (params.backgroundUrl.startsWith("/uploads/")) {
        const localPath = path.join(process.cwd(), "public", params.backgroundUrl);
        bgBuffer = await fs.readFile(localPath);
      } else if (params.backgroundUrl.startsWith("http")) {
        const resp = await fetch(params.backgroundUrl);
        if (resp.ok) {
          bgBuffer = Buffer.from(await resp.arrayBuffer());
        }
      }

      if (bgBuffer) {
        const urlLower = params.backgroundUrl.toLowerCase();
        if (urlLower.endsWith(".pdf")) {
          const bgDoc = await PDFDocument.load(bgBuffer);
          const [copiedPage] = await doc.copyPages(bgDoc, [0]);
          const embedded = await doc.embedPage(copiedPage);
          page.drawPage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });
          hasCustomBg = true;
        } else if (urlLower.endsWith(".png")) {
          const img = await doc.embedPng(bgBuffer);
          page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
          hasCustomBg = true;
        } else if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg")) {
          const img = await doc.embedJpg(bgBuffer);
          page.drawImage(img, { x: 0, y: 0, width: pageWidth, height: pageHeight });
          hasCustomBg = true;
        }
      }
    } catch (err) {
      console.warn("Could not composite background artwork into PDF:", err);
    }
  }

  // If no artwork was composited, draw a clean fallback decorative frame
  if (!hasCustomBg) {
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(1, 1, 1) });
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0.07, 0.5, 0.35),
      borderWidth: 3,
    });
  }

  // Draw certificate texts
  const titleY = isPortrait ? 720 : 460;
  const certText = "CERTIFICATE OF COMPLETION";
  page.drawText(certText, {
    x: pageWidth / 2 - (font.widthOfTextAtSize(certText, 26) / 2),
    y: titleY,
    size: 26,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  const subtitle = "This certifies that";
  page.drawText(subtitle, {
    x: pageWidth / 2 - (bodyFont.widthOfTextAtSize(subtitle, 12) / 2),
    y: titleY - 50,
    size: 12,
    font: bodyFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const nameSize = 22;
  page.drawText(params.recipientName, {
    x: pageWidth / 2 - (font.widthOfTextAtSize(params.recipientName, nameSize) / 2),
    y: titleY - 90,
    size: nameSize,
    font,
    color: rgb(0.07, 0.5, 0.35),
  });

  const completionText = `has successfully completed ${params.courseName}`;
  page.drawText(completionText, {
    x: pageWidth / 2 - (bodyFont.widthOfTextAtSize(completionText, 13) / 2),
    y: titleY - 130,
    size: 13,
    font: bodyFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  if (params.grade) {
    const gradeText = `Grade: ${params.grade}`;
    page.drawText(gradeText, {
      x: pageWidth / 2 - (bodyFont.widthOfTextAtSize(gradeText, 12) / 2),
      y: titleY - 160,
      size: 12,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  page.drawText(`Certificate ID: ${params.certificateRef}`, {
    x: 40,
    y: 40,
    size: 9,
    font: bodyFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Issued ${params.issuedAt.toDateString()}`, {
    x: pageWidth - 200,
    y: 40,
    size: 9,
    font: bodyFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}
