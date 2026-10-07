"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { renderPdfToDataUrl, isPdf } from "@/lib/pdfRenderer";

const CANVAS_INFO: Record<
  string,
  Record<"LANDSCAPE" | "PORTRAIT", { dimensions: string; unit: string }>
> = {
  CERTIFICATE: {
    LANDSCAPE: { dimensions: "297 × 210 mm", unit: "A4 Landscape" },
    PORTRAIT: { dimensions: "210 × 297 mm", unit: "A4 Vertical (Portrait)" },
  },
  ID_CARD: {
    LANDSCAPE: { dimensions: "85.6 × 54 mm", unit: "CR80 Landscape (Horizontal)" },
    PORTRAIT: { dimensions: "54 × 85.6 mm", unit: "CR80 Vertical (Portrait)" },
  },
  BUSINESS_CARD: {
    LANDSCAPE: { dimensions: "89 × 51 mm", unit: "Standard Landscape" },
    PORTRAIT: { dimensions: "51 × 89 mm", unit: "Standard Vertical" },
  },
};

export default function TemplateCreateForm({ userRole }: { userRole: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"CERTIFICATE" | "ID_CARD" | "BUSINESS_CARD">("CERTIFICATE");
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">("LANDSCAPE");
  const [source, setSource] = useState<
    "DESIGNED_FROM_SCRATCH" | "UPLOADED_IMAGE" | "UPLOADED_HTML" | "UPLOADED_PDF"
  >("DESIGNED_FROM_SCRATCH");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pageImageDataUrl, setPageImageDataUrl] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN";

  if (!canManage) {
    return (
      <div className="text-xs text-gray-500 italic">
        Read-only mode (Role: {userRole})
      </div>
    );
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessingFile(true);
    setError(null);

    try {
      if (isPdf(file)) {
        setSource("UPLOADED_PDF");
        const rendered = await renderPdfToDataUrl(file, 1, 2.0);
        setFilePreview(rendered.dataUrl);
        setPageImageDataUrl(rendered.dataUrl);

        // Auto-detect orientation
        if (rendered.height > rendered.width) {
          setOrientation("PORTRAIT");
        } else {
          setOrientation("LANDSCAPE");
        }
      } else if (file.type.startsWith("image/")) {
        setSource("UPLOADED_IMAGE");
        const objUrl = URL.createObjectURL(file);
        setFilePreview(objUrl);
        setPageImageDataUrl(null);

        // Auto-detect orientation from image dimensions
        const img = new Image();
        img.onload = () => {
          if (img.naturalHeight > img.naturalWidth) {
            setOrientation("PORTRAIT");
          } else {
            setOrientation("LANDSCAPE");
          }
        };
        img.src = objUrl;
      } else if (file.name.endsWith(".html") || file.type === "text/html") {
        setSource("UPLOADED_HTML");
        setFilePreview(null);
        setPageImageDataUrl(null);
      }
    } catch (err: any) {
      setError("Error reading file: " + (err.message || "Failed to render preview"));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setPageImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (source === "UPLOADED_PDF" || source === "UPLOADED_IMAGE") {
      setSource("DESIGNED_FROM_SCRATCH");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let backgroundUrl: string | null = null;

      // If a background file was selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (pageImageDataUrl) {
          formData.append("pageImageDataUrl", pageImageDataUrl);
        }

        const uploadRes = await fetch("/api/templates/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || "Failed to upload artwork file");
        }

        const uploadData = await uploadRes.json();
        backgroundUrl = uploadData.previewUrl || uploadData.fileUrl;
      }

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          source,
          backgroundUrl,
          isDefault,
          fieldLayout: {
            orientation,
            fields: [],
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error?.fieldErrors
            ? JSON.stringify(data.error.fieldErrors)
            : data.error || "Failed to create template"
        );
      }

      setName("");
      setType("CERTIFICATE");
      setOrientation("LANDSCAPE");
      setSource("DESIGNED_FROM_SCRATCH");
      setSelectedFile(null);
      setFilePreview(null);
      setPageImageDataUrl(null);
      setIsDefault(false);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const canvasInfo =
    CANVAS_INFO[type]?.[orientation] || CANVAS_INFO.CERTIFICATE[orientation];

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
        className="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-98"
      >
        <svg
          className="w-4 h-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>+ Create Template</span>
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">New Template</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure template type, source format, artwork, and canvas specifications
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive ID Card 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Template Type & Source Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Template Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="CERTIFICATE">📜 Certificate</option>
                    <option value="ID_CARD">🪪 ID Card</option>
                    <option value="BUSINESS_CARD">💼 Business Card / V-Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Source Format
                  </label>
                  <select
                    value={source}
                    onChange={(e) => {
                      const newSource = e.target.value as any;
                      setSource(newSource);
                      if (newSource === "DESIGNED_FROM_SCRATCH" && !selectedFile) {
                        setFilePreview(null);
                        setPageImageDataUrl(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="DESIGNED_FROM_SCRATCH">Designed from Scratch</option>
                    <option value="UPLOADED_PDF">Uploaded PDF Template</option>
                    <option value="UPLOADED_IMAGE">Uploaded Image (PNG / JPG)</option>
                    <option value="UPLOADED_HTML">Uploaded HTML</option>
                  </select>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  source === "UPLOADED_PDF"
                    ? ".pdf"
                    : source === "UPLOADED_HTML"
                    ? ".html,.htm"
                    : "image/png,image/jpeg,image/jpg,image/webp,.pdf"
                }
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Upload Source Button & Dropzone (Added directly after Source Format) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Source Artwork File {source !== "DESIGNED_FROM_SCRATCH" ? "*" : "(Optional)"}
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Remove File
                    </button>
                  )}
                </div>

                {selectedFile && filePreview ? (
                  /* Active File Preview Card */
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <img
                      src={filePreview}
                      alt="Artwork Preview"
                      className="w-14 h-14 object-contain rounded-lg bg-white border border-emerald-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-emerald-950 truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-2">
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                          Auto-Detected: {orientation === "PORTRAIT" ? "Vertical" : "Landscape"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Upload Button / Dropzone */
                  <div
                    onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-emerald-600 hover:bg-emerald-50/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-gray-50 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                      {isProcessingFile ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="text-xs font-bold text-emerald-800 hover:underline"
                      >
                        {isProcessingFile
                          ? "Rendering page preview..."
                          : source === "UPLOADED_PDF"
                          ? "Upload Source PDF Template"
                          : source === "UPLOADED_IMAGE"
                          ? "Upload Source Artwork Image"
                          : "Upload Source Artwork / File"}
                      </button>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        PDF, PNG, JPG, or WebP up to 25MB · Auto-detects canvas orientation
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas Orientation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Canvas Orientation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrientation("LANDSCAPE")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orientation === "LANDSCAPE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs ring-1 ring-emerald-600"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                    </svg>
                    <span>Landscape (Horizontal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientation("PORTRAIT")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      orientation === "PORTRAIT"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs ring-1 ring-emerald-600"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="6" y="2" width="12" height="20" rx="2" />
                    </svg>
                    <span>Vertical (Portrait)</span>
                  </button>
                </div>
              </div>

              {/* Canvas Dimensions Preview Box */}
              {canvasInfo && (
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950">
                      Canvas: {canvasInfo.dimensions}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {canvasInfo.unit} · Supports high-res vector PDF & JPG export
                    </div>
                  </div>
                </div>
              )}

              {/* Organization Default Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span>Set as Organization Default</span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isProcessingFile}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Template...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Template</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
