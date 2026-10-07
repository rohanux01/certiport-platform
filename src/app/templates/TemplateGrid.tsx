"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type TemplateRow = {
  id: string;
  name: string;
  type: string;
  source: string;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  fieldLayout?: any;
  backgroundUrl?: string | null;
  backgroundHtml?: string | null;
  createdAt: Date;
};

export function getTemplateOrientation(t: TemplateRow): "LANDSCAPE" | "PORTRAIT" {
  if (t.fieldLayout && typeof t.fieldLayout === "object" && !Array.isArray(t.fieldLayout)) {
    if (t.fieldLayout.orientation === "PORTRAIT") return "PORTRAIT";
  }
  return "LANDSCAPE";
}

const CANVAS_INFO: Record<
  string,
  Record<"LANDSCAPE" | "PORTRAIT", { label: string; dimensions: string; unit: string }>
> = {
  CERTIFICATE: {
    LANDSCAPE: { label: "Certificate", dimensions: "297 × 210 mm", unit: "A4 Landscape" },
    PORTRAIT: { label: "Certificate", dimensions: "210 × 297 mm", unit: "A4 Portrait" },
  },
  ID_CARD: {
    LANDSCAPE: { label: "ID Card", dimensions: "85.6 × 54 mm", unit: "CR80 Landscape" },
    PORTRAIT: { label: "ID Card", dimensions: "54 × 85.6 mm", unit: "CR80 Portrait" },
  },
  BUSINESS_CARD: {
    LANDSCAPE: { label: "V-Card", dimensions: "89 × 51 mm", unit: "Standard Landscape" },
    PORTRAIT: { label: "V-Card", dimensions: "51 × 89 mm", unit: "Standard Portrait" },
  },
};

const SOURCE_LABELS: Record<string, string> = {
  DESIGNED_FROM_SCRATCH: "From Scratch",
  UPLOADED_IMAGE: "Uploaded Image",
  UPLOADED_HTML: "Uploaded HTML",
  UPLOADED_PDF: "Uploaded PDF",
};

const FILTER_TABS = [
  { key: "ALL", label: "All Templates" },
  { key: "CERTIFICATE", label: "Certificates" },
  { key: "ID_CARD", label: "ID Cards" },
  { key: "BUSINESS_CARD", label: "V-Cards" },
];

const SAMPLE_DATA: Record<string, string> = {
  recipientName: "Miss. Vaishnavi Ingale",
  firstName: "Miss. Vaishnavi Ingale",
  lastName: "Ingale",
  fullName: "Miss. Vaishnavi Ingale",
  courseName: "Project Readiness Program: Vibe Coding Live",
  certificateRef: "MER/2026/VIBE/00142",
  issueDate: "07 Sept 2026",
  grade: "Distinction (A+)",
  studentId: "STD-2026-8841",
  jobTitle: "AI Workflow Specialist",
  employeeId: "EMP-2026-904",
  department: "Emerging Technologies",
  companyName: "SEED Infotech Ltd.",
  bloodGroup: "B+",
  email: "vaishnavi.i@gttdata.ai",
  phone: "+91 98765 43210",
  customText: "Prasanna Joshi · Head, SEED",
};

/**
 * High-Fidelity Miniature Document Preview
 * Renders actual uploaded background artwork, HTML, shapes, badges, and placed fields
 */
function TemplateExactPreview({ template }: { template: TemplateRow }) {
  const orientation = getTemplateOrientation(template);
  const isPortrait = orientation === "PORTRAIT";
  const layout = template.fieldLayout;

  // Extract front fields & background
  const fields: any[] =
    layout?.sides?.front?.fields ||
    layout?.fields ||
    (Array.isArray(layout) ? layout : []);

  const bgUrl = layout?.sides?.front?.backgroundUrl || template.backgroundUrl || null;
  const bgHtml = layout?.sides?.front?.backgroundHtml || template.backgroundHtml || null;

  // Card dimensions based on type & orientation
  let previewWidth = 220;
  let previewHeight = 140;

  if (template.type === "CERTIFICATE") {
    if (isPortrait) {
      previewWidth = 140;
      previewHeight = 198;
    } else {
      previewWidth = 230;
      previewHeight = 155;
    }
  } else if (template.type === "ID_CARD") {
    if (isPortrait) {
      previewWidth = 120;
      previewHeight = 190;
    } else {
      previewWidth = 220;
      previewHeight = 138;
    }
  } else {
    // BUSINESS_CARD
    if (isPortrait) {
      previewWidth = 115;
      previewHeight = 195;
    } else {
      previewWidth = 225;
      previewHeight = 130;
    }
  }

  const hasContent = fields.length > 0 || Boolean(bgUrl) || Boolean(bgHtml);

  return (
    <div
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
      }}
      className="bg-white rounded-xl shadow-md border border-[#CBD5E1] relative overflow-hidden select-none transition-transform duration-200 group-hover:scale-[1.03]"
    >
      {/* 1. Background HTML Layer */}
      {bgHtml && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden scale-75 origin-top-left"
          dangerouslySetInnerHTML={{ __html: bgHtml }}
        />
      )}

      {/* 2. Background Image Layer */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt="Template Artwork"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />
      )}

      {/* 3. Fallback Built-in Decorative Artwork if no custom background */}
      {!bgUrl && !bgHtml && (
        <>
          {template.type === "CERTIFICATE" ? (
            <div className="absolute inset-0 pointer-events-none">
              {/* Certificate Border Frames */}
              <div className="absolute inset-1.5 border border-amber-600/30 rounded-xs" />
              <div className="absolute inset-2.5 border border-amber-700/60 rounded-xs" />
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 text-[6px] text-amber-700">❖</div>
              <div className="absolute top-3 right-3 text-[6px] text-amber-700">❖</div>
              <div className="absolute bottom-3 left-3 text-[6px] text-amber-700">❖</div>
              <div className="absolute bottom-3 right-3 text-[6px] text-amber-700">❖</div>
              {/* Header Title */}
              <div className="absolute top-3 inset-x-0 text-center">
                <span className="text-[7px] font-serif font-black tracking-widest text-[#1E3A8A] uppercase">
                  Certificate of Completion
                </span>
              </div>
              {/* Seal Watermark in bottom corner */}
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-200 shadow-2xs flex flex-col items-center justify-center text-white">
                <span className="text-[8px]">★</span>
                <span className="text-[4px] font-black uppercase tracking-tighter">SEED</span>
              </div>
            </div>
          ) : template.type === "ID_CARD" ? (
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#F8FAFC] to-[#FFFFFF]">
              {/* Header Color Band */}
              <div className="h-5 bg-gradient-to-r from-[#0F172A] to-[#334155] px-2 flex items-center justify-between text-white">
                <span className="text-[6px] font-black tracking-wider uppercase">CERTIPORT ID</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              {/* Candidate Photo Placeholder */}
              <div className={`absolute ${isPortrait ? "top-7 left-1/2 -translate-x-1/2 w-10 h-13" : "top-7 left-2.5 w-9 h-11"} rounded border border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-2xs`}>
                <span className="text-[12px]">👤</span>
              </div>
              {/* Smart Card Chip */}
              <div className={`absolute ${isPortrait ? "top-22 left-1/2 -translate-x-1/2" : "top-8 right-3"} w-5 h-4 rounded bg-amber-200 border border-amber-400/80 flex items-center justify-center`}>
                <div className="w-3 h-2 border border-amber-500/50 rounded-xs" />
              </div>
            </div>
          ) : (
            /* BUSINESS_CARD */
            <div className="absolute inset-0 pointer-events-none bg-white">
              <div className="absolute top-2.5 left-3 flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-[#FF5B37]" />
                <span className="text-[7px] font-black text-[#0F172A] tracking-wider uppercase">CERTIPORT</span>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-purple-100 to-transparent rounded-tl-full opacity-60" />
            </div>
          )}
        </>
      )}

      {/* 4. Real Placed Fields & Elements */}
      {fields.map((f, idx) => {
        const val = SAMPLE_DATA[f.fieldId] || f.content || f.label;
        const isQr = f.fieldId === "qrCode" || f.fieldId?.startsWith("qrCode");

        return (
          <div
            key={f.fieldId ? `${f.fieldId}_${idx}` : idx}
            style={{
              position: "absolute",
              left: `${f.left}%`,
              top: `${f.top}%`,
              transform: "translate(-50%, -50%)",
              zIndex: f.itemType === "shape" ? 2 : 10,
              opacity: typeof f.opacity === "number" ? f.opacity : 1,
              whiteSpace: "nowrap",
            }}
          >
            {/* Shape */}
            {f.itemType === "shape" ? (
              <div
                style={{
                  width: f.width ? `${(f.width / 100) * previewWidth}px` : "40px",
                  height: f.shapeType === "line" ? (f.height || 1) : f.height ? `${(f.height / 100) * previewHeight}px` : "20px",
                  backgroundColor: f.bgColor || "transparent",
                  borderColor: f.borderColor || "#CBD5E1",
                  borderWidth: f.shapeType === "line" ? 0 : (f.borderWidth ?? 1),
                  borderStyle: "solid",
                  borderRadius: f.shapeType === "circle" ? "50%" : Math.min(12, f.borderRadius ?? 4),
                }}
              />
            ) : f.itemType === "element" ? (
              /* Badges & Seals */
              f.elementType === "seal" ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-200 shadow-2xs flex flex-col items-center justify-center text-white">
                  <span className="text-[6px]">★</span>
                </div>
              ) : f.elementType === "badge" ? (
                <div className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[6px] font-bold border border-emerald-300">
                  ✓ Verified
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-dashed border-blue-600 text-blue-700 flex items-center justify-center text-[5px] font-bold -rotate-12">
                  CERT
                </div>
              )
            ) : f.itemType === "photo" ? (
              /* Photo Box */
              <div
                style={{
                  width: f.width ? `${(f.width / 100) * previewWidth}px` : "28px",
                  height: f.height ? `${(f.height / 100) * previewHeight}px` : "34px",
                  borderRadius: Math.min(6, f.borderRadius ?? 4),
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#F8FAFC",
                }}
                className="overflow-hidden flex items-center justify-center"
              >
                {f.imageUrl ? (
                  <img src={f.imageUrl} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-gray-400">👤</span>
                )}
              </div>
            ) : isQr ? (
              /* QR Code square */
              <div className="w-5 h-5 bg-white border border-gray-900 flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-gray-900 rounded-xs flex items-center justify-center text-white text-[4px] font-mono">
                  QR
                </div>
              </div>
            ) : (
              /* Typography Text */
              <div
                style={{
                  fontSize: Math.max(6, Math.min(13, (f.fontSize || 14) * 0.45)),
                  color: f.fontColor || "#0F172A",
                  fontFamily: f.fontFamily || "Inter, sans-serif",
                  fontWeight: f.fontStyle === "bold" ? 700 : 500,
                  fontStyle: f.fontStyle === "italic" ? "italic" : "normal",
                  textAlign: f.textAlign || "left",
                  textDecoration: f.textDecoration || "none",
                }}
              >
                {val}
              </div>
            )}
          </div>
        );
      })}

      {/* Blank Canvas Watermark when no fields exist */}
      {!hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-[#F8FAFC]">
          <span className="text-base text-gray-300 mb-1">📄</span>
          <span className="text-[8px] font-bold text-gray-400">Blank Canvas</span>
          <span className="text-[7px] text-gray-300">Ready to design</span>
        </div>
      )}
    </div>
  );
}

export default function TemplateGrid({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [templateList, setTemplateList] = useState<TemplateRow[]>(templates);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = activeFilter === "ALL"
    ? templateList
    : templateList.filter((t) => t.type === activeFilter);

  const counts: Record<string, number> = {
    ALL: templateList.length,
    CERTIFICATE: templateList.filter((t) => t.type === "CERTIFICATE").length,
    ID_CARD: templateList.filter((t) => t.type === "ID_CARD").length,
    BUSINESS_CARD: templateList.filter((t) => t.type === "BUSINESS_CARD").length,
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete template");
      }
      if (data.archived) {
        setTemplateList((prev) =>
          prev.map((t) => (t.id === deleteTarget.id ? { ...t, isActive: false } : t))
        );
        setToastMessage(data.message || `Template archived (active credentials linked)`);
      } else {
        setTemplateList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setToastMessage(`Template "${deleteTarget.name}" deleted successfully.`);
      }
      setDeleteTarget(null);
      router.refresh();
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Grid/Table Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Modern Segmented Pill Filters */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl gap-1">
          {FILTER_TABS.map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-[#0F172A] shadow-xs border border-[#E5E7EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive ? "bg-[#0F172A] text-white" : "bg-[#E2E8F0] text-[#64748B]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switcher (Grid / Table) */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl gap-1 border border-[#E5E7EB]">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === "grid" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
            }`}
            title="Grid View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === "table" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
            }`}
            title="Table View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid Cards View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const orientation = getTemplateOrientation(t);
            const isPortrait = orientation === "PORTRAIT";
            const info = CANVAS_INFO[t.type]?.[orientation] || CANVAS_INFO.CERTIFICATE[orientation];
            const dateStr = new Date(t.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#FF5B37]/40 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Clean Canvas Preview Area with Dot Grid */}
                <div
                  className="bg-[#F8F9FA] p-6 flex items-center justify-center relative min-h-[190px] border-b border-[#F1F5F9]"
                  style={{
                    backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  {/* Top-Left Version Pill */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold text-[#64748B] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E2E8F0] shadow-2xs z-20">
                    v{t.version}
                  </span>

                  {/* Top-Right Active Status Pill */}
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs z-20 ${
                    t.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {t.isActive ? "Active" : "Archived"}
                  </span>

                  {/* High-Fidelity Miniature Exact Design Preview */}
                  <TemplateExactPreview template={t} />
                </div>

                {/* Card Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Icon + Title */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center text-sm shrink-0">
                        {t.type === "CERTIFICATE" ? "📜" : t.type === "ID_CARD" ? "🪪" : "💳"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-[#0F172A] truncate leading-tight">
                          {t.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569]">
                            {t.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[9px] text-[#94A3B8]">
                            {SOURCE_LABELS[t.source] || t.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Physical Dimension Pill */}
                    <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        {isPortrait ? (
                          <rect x="5" y="2" width="14" height="20" rx="2" />
                        ) : (
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                        )}
                      </svg>
                      <span>{info.dimensions}</span>
                      <span className="text-[#CBD5E1]">•</span>
                      <span>{isPortrait ? "Vertical" : "Landscape"}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-[10px] text-[#94A3B8] font-medium">
                      {dateStr}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Info Button */}
                      <button
                        onClick={() => setPreviewTemplate(t)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[11px] font-semibold text-[#475569] shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span>👁</span>
                        <span>Info</span>
                      </button>

                      {/* Design Button (Charcoal Pill) */}
                      <Link
                        href={`/templates/${t.id}/designer`}
                        className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Design</span>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 rounded-xl text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Template"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#64748B] font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 pl-4">Template Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Dimensions</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((t) => {
                const orientation = getTemplateOrientation(t);
                const info = CANVAS_INFO[t.type]?.[orientation] || CANVAS_INFO.CERTIFICATE[orientation];
                return (
                  <tr key={t.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="p-3 pl-4 font-bold text-[#0F172A]">{t.name}</td>
                    <td className="p-3 text-[#64748B]">{t.type.replace(/_/g, " ")}</td>
                    <td className="p-3 font-mono text-[#64748B]">{info.dimensions}</td>
                    <td className="p-3 text-[#94A3B8]">{SOURCE_LABELS[t.source] || t.source}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        t.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {t.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4 space-x-1.5">
                      <Link
                        href={`/templates/${t.id}/designer`}
                        className="px-3 py-1 bg-[#0F172A] text-white font-bold rounded-lg text-xs inline-block"
                      >
                        Design
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg mb-1">
              ⚠️
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">Delete Template</h3>
            <p className="text-xs text-[#64748B]">
              Are you sure you want to delete <strong className="text-[#0F172A]">"{deleteTarget.name}"</strong>? If active credentials reference this template, it will be safely archived instead of purged.
            </p>
            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-[#F8F9FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                {isDeleting ? "Deleting..." : "Delete Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5E7EB] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="space-y-2 text-xs text-[#475569]">
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#94A3B8]">Template ID:</span>
                <span className="font-mono text-[#0F172A]">{previewTemplate.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#94A3B8]">Type:</span>
                <span className="font-bold text-[#0F172A]">{previewTemplate.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#94A3B8]">Source:</span>
                <span className="text-[#0F172A]">{SOURCE_LABELS[previewTemplate.source] || previewTemplate.source}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#94A3B8]">Version:</span>
                <span className="font-bold text-[#0F172A]">v{previewTemplate.version}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#94A3B8]">Orientation:</span>
                <span className="font-semibold text-[#0F172A]">{getTemplateOrientation(previewTemplate)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link
                href={`/templates/${previewTemplate.id}/designer`}
                className="px-4 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
              >
                Open in Designer
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
