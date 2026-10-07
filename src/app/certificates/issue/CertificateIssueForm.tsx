"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface TemplateOption {
  id: string;
  name: string;
  backgroundUrl?: string | null;
  fieldLayout?: any;
}

interface ParsedRecipient {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  courseName: string;
  studentId: string;
  grade: string;
  isValid: boolean;
  validationError?: string;
}

interface IssuedCertificateResult {
  id: string;
  certificateRef: string;
  recipientName: string;
  recipientEmail: string;
  qrPublicId: string;
  fileUrl: string | null;
}

export default function CertificateIssueForm({ templates }: { templates: TemplateOption[] }) {
  const router = useRouter();

  // Mode: "single" vs "bulk"
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single mode state
  const [formData, setFormData] = useState({
    templateId: templates[0]?.id || "",
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    courseName: "",
    studentId: "",
    grade: "Pass with Distinction",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCert, setIssuedCert] = useState<{
    certificateRef: string;
    qrPublicId: string;
    fileUrl?: string | null;
  } | null>(null);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleCopyVerificationLink(qrPublicId: string) {
    const url = `${window.location.origin}/verify/${qrPublicId}`;
    navigator.clipboard.writeText(url);
    setToastMessage("✓ Public verification link copied!");
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Bulk mode state
  const [bulkTemplateId, setBulkTemplateId] = useState(templates[0]?.id || "");
  const [csvText, setCsvText] = useState("");
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<IssuedCertificateResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single submit
  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || (typeof data.error === "string" ? data.error : "Failed to issue certificate"));
      }

      setIssuedCert({
        certificateRef: data.certificateRef,
        qrPublicId: data.qrPublicId,
        fileUrl: data.fileUrl,
      });
      setShowSingleModal(true);
      setToastMessage("✓ Certificate generated and published successfully!");
      setTimeout(() => setToastMessage(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Parse CSV text into recipient objects
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRecipients([]);
      return;
    }

    // Check if line 1 is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("name") ||
      firstLine.includes("email") ||
      firstLine.includes("course");

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed: ParsedRecipient[] = dataLines.map((line, idx) => {
      // Split by comma while respecting quotes
      const regex = /(?:\"([^\"]*)\"|([^,]+)|,)(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match[1] !== undefined) matches.push(match[1].trim());
        else if (match[2] !== undefined) matches.push(match[2].trim());
        else matches.push("");
      }

      // Column mapping: Name, Email, Phone, Course, Student ID, Grade
      const recipientName = matches[0] || "";
      const recipientEmail = matches[1] || "";
      const recipientPhone = matches[2] || "";
      const courseName = matches[3] || formData.courseName || "Default Course";
      const studentId = matches[4] || "";
      const grade = matches[5] || "Pass with Distinction";

      let isValid = true;
      let validationError = "";

      if (!recipientName) {
        isValid = false;
        validationError = "Missing recipient name";
      } else if (!recipientEmail || !recipientEmail.includes("@")) {
        isValid = false;
        validationError = "Invalid email address";
      } else if (!courseName) {
        isValid = false;
        validationError = "Missing course name";
      }

      return {
        recipientName,
        recipientEmail,
        recipientPhone,
        courseName,
        studentId,
        grade,
        isValid,
        validationError,
      };
    });

    setParsedRecipients(parsed);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample = [
      "Recipient Name,Recipient Email,Recipient Phone,Course Name,Student ID,Grade",
      "Dr. Maya Angelou,maya.angelou@gttdata.ai,+15550192831,UX Foundations & Systems Design,STD-2026-001,Pass with Distinction",
      "Alan Turing,alan.turing@gttdata.ai,+15550192832,Advanced Algorithmic Governance,STD-2026-002,First Class Honors",
      "Ada Lovelace,ada.lovelace@gttdata.ai,+15550192833,Distributed Systems Architecture,STD-2026-003,Distinction",
    ].join("\n");

    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "certiport_recipients_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Bulk Submit
  const handleBulkSubmit = async () => {
    const validRecipients = parsedRecipients.filter((r) => r.isValid);
    if (validRecipients.length === 0) {
      setBulkError("No valid recipients to issue.");
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkProgress(10);

    try {
      setBulkProgress(30);

      const res = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: bulkTemplateId,
          recipients: validRecipients.map((r) => ({
            recipientName: r.recipientName,
            recipientEmail: r.recipientEmail,
            recipientPhone: r.recipientPhone || null,
            courseName: r.courseName,
            studentId: r.studentId || null,
            grade: r.grade || null,
          })),
        }),
      });

      setBulkProgress(80);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process bulk issuance");
      }

      setBulkProgress(100);
      setBulkResults(data.certificates || []);
      setShowBulkModal(true);
      setToastMessage(`✓ ${data.certificates?.length || validRecipients.length} certificates issued in bulk!`);
      setTimeout(() => setToastMessage(null), 5000);
      router.refresh();
    } catch (err: any) {
      setBulkError(err.message || "Failed to issue bulk certificates");
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedTemplate = templates.find(
    (t) => t.id === (mode === "single" ? formData.templateId : bulkTemplateId)
  );

  const validCount = parsedRecipients.filter((r) => r.isValid).length;
  const invalidCount = parsedRecipients.length - validCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Single Issuance Success Modal Popup */}
      {showSingleModal && issuedCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Certificate Issued Successfully!</h3>
                  <p className="text-xs text-gray-500">Registered and cryptographically verified</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Certificate Details Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-emerald-900 font-bold uppercase tracking-wider text-[10px]">Reference Number</span>
                <span className="font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                  {issuedCert.certificateRef}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Recipient:</span>
                <span className="font-semibold">{formData.recipientName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Course:</span>
                <span className="font-semibold">{formData.courseName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Delivery Channels:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Email + Verification Dispatched
                </span>
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                {issuedCert.fileUrl && (
                  <a
                    href={issuedCert.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm text-center flex items-center justify-center gap-2"
                  >
                    <span>Download Official PDF</span>
                    <span>↓</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyVerificationLink(issuedCert.qrPublicId)}
                  className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                  title="Copy public verification URL"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </button>
              </div>

              <a
                href={`/verify/${issuedCert.qrPublicId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center block transition-colors border border-slate-200"
              >
                View in Public QR Verification Portal (SRS §6.1) ↗
              </a>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowSingleModal(false);
                  setIssuedCert(null);
                  setFormData({
                    templateId: templates[0]?.id || "",
                    recipientName: "",
                    recipientEmail: "",
                    recipientPhone: "",
                    courseName: "",
                    studentId: "",
                    grade: "Pass with Distinction",
                  });
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                + Issue Another Certificate
              </button>
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Issuance Complete Modal Popup */}
      {showBulkModal && bulkResults && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  🎉
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Batch Issuance Complete ({bulkResults.length} Certificates)
                  </h3>
                  <p className="text-xs text-gray-500">SRS §5.5 Bulk Credential Generation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex justify-between items-center">
                <span>All {bulkResults.length} vector PDFs generated & cryptographic QR tokens activated.</span>
                <span className="font-bold bg-emerald-200/80 px-2 py-0.5 rounded text-[10px]">100% Success</span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-500">Recipient</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-500">Reference</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bulkResults.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-gray-900">{item.recipientName}</div>
                          <div className="text-[11px] text-gray-500">{item.recipientEmail}</div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-800 font-bold">
                          {item.certificateRef}
                        </td>
                        <td className="px-3 py-2.5 text-right space-x-2">
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              PDF ↓
                            </a>
                          )}
                          <a
                            href={`/verify/${item.qrPublicId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-slate-600 hover:underline"
                          >
                            Verify ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <Link
                href="/certificates"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                ← View All in Certificates Table
              </Link>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher: Single vs Bulk */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === "single"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          📜 Single Certificate
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            mode === "bulk"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          📁 Bulk CSV Issuance
          <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
            SRS §5.5
          </span>
        </button>
      </div>

      {/* SINGLE MODE */}
      {mode === "single" && (
        <div className="space-y-6">
          {issuedCert && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900">Certificate Issued Successfully!</h3>
                  <p className="text-xs text-emerald-700 font-mono">Reference: {issuedCert.certificateRef}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {issuedCert.fileUrl && (
                  <a
                    href={issuedCert.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span>Download Certificate PDF</span>
                    <span>↓</span>
                  </a>
                )}
                <a
                  href={`/api/verify/${issuedCert.qrPublicId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 hover:bg-emerald-50"
                >
                  Verify Public QR Endpoint (SRS §6.1) ↗
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIssuedCert(null);
                    setFormData({
                      templateId: templates[0]?.id || "",
                      recipientName: "",
                      recipientEmail: "",
                      recipientPhone: "",
                      courseName: "",
                      studentId: "",
                      grade: "Pass with Distinction",
                    });
                  }}
                  className="px-4 py-2 bg-white text-gray-700 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Issue Another Certificate
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Certificate Issuance Details
            </h2>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Certificate Template *
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  {templates.length === 0 ? (
                    <option value="">No active certificate templates</option>
                  ) : (
                    templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
                {selectedTemplate?.backgroundUrl && (
                  <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                    <span>✓</span>
                    <span>Custom background artwork attached</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="e.g. Dr. Maya Angelou"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="recipient@gttdata.ai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient Phone Number (For WhatsApp)
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Course / Program Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  placeholder="e.g. UX Foundations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Student / Employee ID
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. STD-2026-881"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Grade / Honors
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g. Distinction (A+)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || templates.length === 0}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                {loading ? "Generating Vector PDF..." : "Sign & Issue Certificate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BULK MODE */}
      {mode === "bulk" && (
        <div className="space-y-6">
          {/* Results Screen */}
          {bulkResults ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {bulkResults.length} Certificates Issued Successfully!
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      All credentials signed with QR verification and vector PDF generated
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBulkResults(null);
                    setParsedRecipients([]);
                    setCsvText("");
                  }}
                  className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-100"
                >
                  Issue Another Batch
                </button>
              </div>

              {/* Table of Issued Certificates */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Reference ID</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bulkResults.map((cert, idx) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{cert.recipientName}</td>
                        <td className="px-4 py-3 text-gray-600">{cert.recipientEmail}</td>
                        <td className="px-4 py-3 font-mono text-emerald-800">{cert.certificateRef}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {cert.fileUrl && (
                            <a
                              href={cert.fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-semibold hover:bg-emerald-100"
                            >
                              <span>PDF</span>
                              <span>↓</span>
                            </a>
                          )}
                          <a
                            href={`/api/verify/${cert.qrPublicId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded font-semibold hover:bg-gray-200"
                          >
                            <span>Verify</span>
                            <span>↗</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Upload & Configuration Form */
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Bulk Certificate Issuance
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Upload a CSV file or paste recipient data to generate hundreds of certificates at once
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {bulkError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {bulkError}
                </div>
              )}

              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Certificate Template *
                </label>
                <select
                  value={bulkTemplateId}
                  onChange={(e) => setBulkTemplateId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate?.backgroundUrl && (
                  <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                    <span>✓</span>
                    <span>Custom background artwork attached</span>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Recipient Data File (.CSV)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-emerald-600 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:bg-emerald-50/40 transition-colors"
                >
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-sm font-semibold text-gray-800">
                    Click to browse or drop your CSV file here
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Columns: Recipient Name, Email, Phone, Course, Student ID, Grade
                  </div>
                </div>
              </div>

              {/* Or Paste Raw CSV */}
              <div>
                <details className="text-xs text-gray-600">
                  <summary className="font-semibold cursor-pointer text-emerald-700 hover:text-emerald-900 mb-2">
                    Or paste raw CSV text directly...
                  </summary>
                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value);
                      parseCsv(e.target.value);
                    }}
                    placeholder="Recipient Name,Recipient Email,Recipient Phone,Course Name,Student ID,Grade&#10;Dr. Maya Angelou,maya@gttdata.ai,+15550192831,UX Foundations,STD-001,Distinction"
                    className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </details>
              </div>

              {/* Parsed Recipients Preview Table */}
              {parsedRecipients.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        Recipient Preview ({parsedRecipients.length} rows detected)
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        {validCount} valid
                      </span>
                      {invalidCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                          {invalidCount} invalid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">#</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Status</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Course</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {parsedRecipients.map((rec, idx) => (
                          <tr key={idx} className={rec.isValid ? "hover:bg-gray-50" : "bg-red-50/50"}>
                            <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {rec.isValid ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  Valid
                                </span>
                              ) : (
                                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold" title={rec.validationError}>
                                  {rec.validationError || "Invalid"}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">{rec.recipientName || "—"}</td>
                            <td className="px-3 py-2 text-gray-600">{rec.recipientEmail || "—"}</td>
                            <td className="px-3 py-2 text-gray-600">{rec.courseName || "—"}</td>
                            <td className="px-3 py-2 text-gray-600">{rec.grade || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Progress Bar during generation */}
                  {bulkLoading && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-emerald-900">
                        <span>Generating vector PDFs with template artwork...</span>
                        <span>{bulkProgress}%</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${bulkProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Issue All Button */}
                  <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      disabled={bulkLoading || validCount === 0}
                      onClick={handleBulkSubmit}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      {bulkLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Issuing Batch...</span>
                        </>
                      ) : (
                        <span>Issue All {validCount} Certificates →</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
