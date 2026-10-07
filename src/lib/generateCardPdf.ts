import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

/**
 * Generates an ISO/IEC 7810 CR80 compliant vector ID Card or Business Card PDF
 * (SRS §5.5 / Module 2).
 * Composites template background artwork (PDF page or PNG/JPG image).
 */
export async function generateCardPdf(params: {
  fullName: string;
  jobTitle?: string | null;
  employeeId?: string | null;
  email?: string | null;
  phone?: string | null;
  bloodGroup?: string | null;
  templateName: string;
  templateType: string;
  backgroundUrl?: string | null;
  orientation?: "LANDSCAPE" | "PORTRAIT";
  orgName?: string;
}): Promise<Uint8Array> {
  const isPortrait = params.orientation === "PORTRAIT";
  const isBusinessCard = params.templateType === "BUSINESS_CARD";

  // CR80 dimensions in points (72 points = 1 inch, 25.4mm = 1 inch)
  // ID Card: 85.6mm x 54mm -> 242.6pt x 153pt
  // Business Card: 89mm x 51mm -> 252.3pt x 144.6pt
  let width = isBusinessCard ? 252 : 243;
  let height = isBusinessCard ? 145 : 153;

  if (isPortrait) {
    const temp = width;
    width = height;
    height = temp;
  }

  const doc = await PDFDocument.create();
  const page = doc.addPage([width, height]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await doc.embedFont(StandardFonts.Helvetica);

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
          page.drawPage(embedded, { x: 0, y: 0, width, height });
          hasCustomBg = true;
        } else if (urlLower.endsWith(".png")) {
          const img = await doc.embedPng(bgBuffer);
          page.drawImage(img, { x: 0, y: 0, width, height });
          hasCustomBg = true;
        } else if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg")) {
          const img = await doc.embedJpg(bgBuffer);
          page.drawImage(img, { x: 0, y: 0, width, height });
          hasCustomBg = true;
        }
      }
    } catch (err) {
      console.warn("Could not composite background artwork into Card PDF:", err);
    }
  }

  const orgLabel = (params.orgName || "CERTIPORT").toUpperCase();

  // If no artwork was composited, draw a polished default corporate card design
  if (!hasCustomBg) {
    // Dark background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: isBusinessCard ? rgb(0.1, 0.12, 0.25) : rgb(0.04, 0.15, 0.12),
    });

    // Decorative accent stripe
    page.drawRectangle({
      x: 0,
      y: height - 4,
      width,
      height: 4,
      color: rgb(0.07, 0.72, 0.51), // Emerald #10B981
    });

    // Outer border
    page.drawRectangle({
      x: 3,
      y: 3,
      width: width - 6,
      height: height - 6,
      borderColor: rgb(0.07, 0.72, 0.51),
      borderWidth: 0.5,
    });
  }

  // Draw Card Text Fields
  const textColor = hasCustomBg ? rgb(0.1, 0.1, 0.1) : rgb(1, 1, 1);
  const accentColor = hasCustomBg ? rgb(0.07, 0.5, 0.35) : rgb(0.3, 0.85, 0.65);
  const mutedColor = hasCustomBg ? rgb(0.4, 0.4, 0.4) : rgb(0.65, 0.75, 0.7);

  if (isPortrait) {
    // Portrait layout
    // Org Header
    page.drawText(orgLabel, {
      x: width / 2 - (fontBold.widthOfTextAtSize(orgLabel, 10) / 2),
      y: height - 24,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    // Full Name
    const name = params.fullName || "Candidate Name";
    const nameSize = 13;
    page.drawText(name, {
      x: width / 2 - (fontBold.widthOfTextAtSize(name, nameSize) / 2),
      y: height - 85,
      size: nameSize,
      font: fontBold,
      color: textColor,
    });

    // Job Title
    if (params.jobTitle) {
      page.drawText(params.jobTitle, {
        x: width / 2 - (fontNormal.widthOfTextAtSize(params.jobTitle, 9) / 2),
        y: height - 100,
        size: 9,
        font: fontNormal,
        color: accentColor,
      });
    }

    // Employee ID
    if (params.employeeId) {
      const empText = "ID: " + params.employeeId;
      page.drawText(empText, {
        x: width / 2 - (fontBold.widthOfTextAtSize(empText, 8) / 2),
        y: height - 118,
        size: 8,
        font: fontBold,
        color: textColor,
      });
    }

    // Email
    if (params.email) {
      page.drawText(params.email, {
        x: width / 2 - (fontNormal.widthOfTextAtSize(params.email, 7.5) / 2),
        y: height - 134,
        size: 7.5,
        font: fontNormal,
        color: mutedColor,
      });
    }

    // Blood group & Template
    const footerY = 16;
    if (params.bloodGroup) {
      page.drawText("Blood: " + params.bloodGroup, {
        x: 12,
        y: footerY,
        size: 7,
        font: fontBold,
        color: accentColor,
      });
    }
  } else {
    // Landscape layout
    // Org Header
    page.drawText(orgLabel, {
      x: 16,
      y: height - 22,
      size: 11,
      font: fontBold,
      color: textColor,
    });

    // Employee ID badge (top right)
    if (params.employeeId) {
      const empText = params.employeeId;
      page.drawText(empText, {
        x: width - fontBold.widthOfTextAtSize(empText, 8) - 16,
        y: height - 22,
        size: 8,
        font: fontBold,
        color: accentColor,
      });
    }

    // Full Name
    const name = params.fullName || "Candidate Name";
    page.drawText(name, {
      x: 16,
      y: height - 62,
      size: 14,
      font: fontBold,
      color: textColor,
    });

    // Job Title
    if (params.jobTitle) {
      page.drawText(params.jobTitle, {
        x: 16,
        y: height - 78,
        size: 9.5,
        font: fontNormal,
        color: accentColor,
      });
    }

    // Email
    if (params.email) {
      page.drawText(params.email, {
        x: 16,
        y: height - 94,
        size: 8,
        font: fontNormal,
        color: mutedColor,
      });
    }

    // Footer info
    const footerY = 14;
    if (params.bloodGroup) {
      page.drawText("Blood: " + params.bloodGroup, {
        x: 16,
        y: footerY,
        size: 7.5,
        font: fontBold,
        color: accentColor,
      });
    }

    if (params.phone) {
      const phoneText = "Tel: " + params.phone;
      page.drawText(phoneText, {
        x: 80,
        y: footerY,
        size: 7.5,
        font: fontNormal,
        color: mutedColor,
      });
    }

    const tplText = params.templateName;
    page.drawText(tplText, {
      x: width - fontNormal.widthOfTextAtSize(tplText, 7) - 16,
      y: footerY,
      size: 7,
      font: fontNormal,
      color: mutedColor,
    });
  }

  return doc.save();
}
