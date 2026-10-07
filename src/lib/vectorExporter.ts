import { FieldLayoutItem } from "@/app/templates/[id]/designer/TemplateDesignerCanvas";

export type VectorExportOptions = {
  width: number;
  height: number;
  bgColor?: string | null;
  bgUrl?: string | null;
  previewData?: Record<string, string>;
};

const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  recipientName: "Miss. Vaishnavi Ingale",
  courseName: "Project Readiness Program: Vibe Coding Live",
  certificateRef: "MER/2026/VIBE/00142",
  issueDate: "07 September, 2026",
  grade: "Distinction (A+)",
  studentId: "STD-2026-8841",
  qrCode: "[QR CODE]",
  customText: "Prasanna Joshi · Head, SEED Infotech Ltd.",
  fullName: "Miss. Vaishnavi Ingale",
  jobTitle: "AI Workflow Specialist",
  employeeId: "EMP-2026-904",
  email: "vaishnavi.i@gttdata.ai",
  phone: "+91 98765 43210",
  bloodGroup: "B+",
  department: "Emerging Technologies",
  companyName: "SEED Infotech Ltd.",
};

/**
 * Generates structured SVG Vector XML string from layout items.
 */
export function generateSvgVector(fields: FieldLayoutItem[], options: VectorExportOptions): string {
  const { width, height, bgColor, bgUrl, previewData = DEFAULT_SAMPLE_DATA } = options;
  const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const defs: string[] = [];
  const svgBody: string[] = [];

  // Embedded font style
  defs.push(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Anton&amp;family=Dancing+Script:wght@400;700&amp;family=Inter:wght@300;400;500;600;700;800&amp;family=Montserrat:wght@400;600;700;800&amp;family=Outfit:wght@400;600;700&amp;family=Playfair+Display:wght@400;700&amp;family=Roboto:wght@400;500;700&amp;display=swap');
      .svg-text { font-family: 'Inter', sans-serif; }
    </style>
  `);

  // Background rect / image
  if (bgUrl) {
    svgBody.push(`  <image href="${escapeXml(bgUrl)}" width="${width}" height="${height}" preserveAspectRatio="none" />`);
  } else {
    svgBody.push(`  <rect width="${width}" height="${height}" fill="${bgColor || "#FFFFFF"}" />`);
  }

  sortedFields.forEach((f, idx) => {
    const x = (f.left / 100) * width;
    const y = (f.top / 100) * height;
    const elemW = f.width ? (f.width / 100) * width : 120;
    const elemH = f.height ? (f.height / 100) * height : 60;
    const opacityAttr = typeof f.opacity === "number" && f.opacity < 1 ? ` opacity="${f.opacity}"` : "";

    let fillAttr = f.bgColor || "#F8FAFC";

    if (f.gradient?.enabled && f.gradient.from && f.gradient.to) {
      const gradId = `grad_${idx}_${f.fieldId.replace(/[^a-zA-Z0-9]/g, "_")}`;
      let x1 = "0%", y1 = "0%", x2 = "100%", y2 = "0%";
      if (f.gradient.direction === "to bottom") { x1 = "0%"; y1 = "0%"; x2 = "0%"; y2 = "100%"; }
      else if (f.gradient.direction === "to bottom right") { x1 = "0%"; y1 = "0%"; x2 = "100%"; y2 = "100%"; }
      else if (f.gradient.direction === "to top right") { x1 = "0%"; y1 = "100%"; x2 = "100%"; y2 = "0%"; }

      defs.push(`
        <linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
          <stop offset="0%" stop-color="${f.gradient.from}" />
          <stop offset="100%" stop-color="${f.gradient.to}" />
        </linearGradient>
      `);
      fillAttr = `url(#${gradId})`;
    }

    if (f.itemType === "shape") {
      const strokeAttr = f.borderColor ? ` stroke="${f.borderColor}" stroke-width="${f.borderWidth ?? 1}"` : "";
      if (f.shapeType === "circle") {
        const r = elemW / 2;
        svgBody.push(`  <circle cx="${x}" cy="${y}" r="${r}" fill="${fillAttr}"${strokeAttr}${opacityAttr} />`);
      } else if (f.shapeType === "line") {
        const lineH = f.height || 2;
        svgBody.push(`  <line x1="${x - elemW / 2}" y1="${y}" x2="${x + elemW / 2}" y2="${y}" stroke="${f.borderColor || f.fontColor || fillAttr}" stroke-width="${lineH}"${opacityAttr} />`);
      } else {
        const rx = f.borderRadius || 8;
        svgBody.push(`  <rect x="${x - elemW / 2}" y="${y - elemH / 2}" width="${elemW}" height="${elemH}" rx="${rx}" fill="${fillAttr}"${strokeAttr}${opacityAttr} />`);
      }
    } else if (f.itemType === "photo" && f.imageUrl) {
      const rx = f.borderRadius || 8;
      svgBody.push(`  <image href="${escapeXml(f.imageUrl)}" x="${x - elemW / 2}" y="${y - elemH / 2}" width="${elemW}" height="${elemH}" rx="${rx}"${opacityAttr} />`);
    } else {
      // Text or Credential Field
      const textVal = f.itemType === "text" ? (f.content || f.label) : (previewData[f.fieldId] || `[${f.label}]`);
      const fontFam = f.fontFamily ? f.fontFamily.replace(/'/g, "") : "Inter, sans-serif";
      const fontW = f.fontStyle === "bold" || f.fontStyle === "bold-italic" ? "bold" : "normal";
      const fontSt = f.fontStyle === "italic" || f.fontStyle === "bold-italic" ? "italic" : "normal";
      const textAnchor = f.textAlign === "center" ? "middle" : f.textAlign === "right" ? "end" : "start";
      const fillCol = f.gradient?.enabled ? fillAttr : (f.fontColor || "#0F172A");

      svgBody.push(`  <text x="${x}" y="${y}" font-family="${escapeXml(fontFam)}" font-size="${f.fontSize || 16}" font-weight="${fontW}" font-style="${fontSt}" fill="${fillCol}" text-anchor="${textAnchor}" dominant-baseline="central"${opacityAttr}>${escapeXml(textVal)}</text>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${defs.join("\n")}
  </defs>
${svgBody.join("\n")}
</svg>`;
}

/**
 * Generates PostScript EPS (Encapsulated PostScript) vector file format (CorelDraw & Illustrator compatible).
 * Conforms to SRS §4.2 vector print export standard.
 */
export function generateEpsVector(fields: FieldLayoutItem[], options: VectorExportOptions): string {
  const { width, height, bgColor = "#FFFFFF", previewData = DEFAULT_SAMPLE_DATA } = options;
  const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const epsLines: string[] = [
    `%!PS-Adobe-3.0 EPSF-3.0`,
    `%%Title: CertiPort Certificate Vector Export`,
    `%%Creator: CertiPort Platform EPS Generator`,
    `%%BoundingBox: 0 0 ${Math.round(width)} ${Math.round(height)}`,
    `%%Pages: 1`,
    `%%EndComments`,
    ``,
    `% Vector Helpers`,
    `/sethexcolor {`,
    `  % Converts hex RGB to PostScript RGB`,
    `  pop % placeholder`,
    `} bind def`,
    ``,
    `% Set canvas background`,
    `0 0 ${width} ${height} rectfill`,
    `1.0 1.0 1.0 setrgbcolor`,
    ``,
  ];

  // Convert Hex Color to EPS RGB tuple
  const hexToEpsRgb = (hex?: string): string => {
    if (!hex || hex === "transparent") return "1.0 1.0 1.0";
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    return `${(r || 0).toFixed(3)} ${(g || 0).toFixed(3)} ${(b || 0).toFixed(3)}`;
  };

  // Convert canvas Y (top-down) to EPS Y (bottom-up)
  const toEpsY = (topPct: number): number => {
    return height - (topPct / 100) * height;
  };

  sortedFields.forEach((f) => {
    const x = (f.left / 100) * width;
    const y = toEpsY(f.top);
    const elemW = f.width ? (f.width / 100) * width : 120;
    const elemH = f.height ? (f.height / 100) * height : 60;

    if (f.itemType === "shape") {
      const fillRgb = hexToEpsRgb(f.bgColor || f.gradient?.from || "#F8FAFC");
      epsLines.push(`% Shape ${f.fieldId}`);
      epsLines.push(`${fillRgb} setrgbcolor`);

      if (f.shapeType === "circle") {
        epsLines.push(`newpath ${x} ${y} ${elemW / 2} 0 360 arc fill`);
      } else if (f.shapeType === "line") {
        const strokeRgb = hexToEpsRgb(f.borderColor || f.fontColor || "#0F172A");
        epsLines.push(`${strokeRgb} setrgbcolor`);
        epsLines.push(`${f.height || 2} setlinewidth`);
        epsLines.push(`newpath ${x - elemW / 2} ${y} moveto ${x + elemW / 2} ${y} lineto stroke`);
      } else {
        epsLines.push(`newpath ${x - elemW / 2} ${y - elemH / 2} ${elemW} ${elemH} rectfill`);
      }

      if (f.borderColor && f.borderWidth) {
        const strokeRgb = hexToEpsRgb(f.borderColor);
        epsLines.push(`${strokeRgb} setrgbcolor`);
        epsLines.push(`${f.borderWidth} setlinewidth`);
        epsLines.push(`newpath ${x - elemW / 2} ${y - elemH / 2} ${elemW} ${elemH} rectstroke`);
      }
    } else if (f.itemType === "text" || f.itemType === "field") {
      const textVal = f.itemType === "text" ? (f.content || f.label) : (previewData[f.fieldId] || `[${f.label}]`);
      const fillRgb = hexToEpsRgb(f.fontColor || f.gradient?.from || "#0F172A");

      epsLines.push(`% Text ${f.fieldId}`);
      epsLines.push(`${fillRgb} setrgbcolor`);
      epsLines.push(`/Helvetica findfont ${f.fontSize || 16} scalefont setfont`);
      epsLines.push(`${x} ${y} moveto (${escapePsString(textVal)}) show`);
    }
  });

  epsLines.push(``);
  epsLines.push(`showpage`);
  epsLines.push(`%%EOF`);

  return epsLines.join("\n");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapePsString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
