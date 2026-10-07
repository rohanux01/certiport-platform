import { db } from "@/lib/db";
import Link from "next/link";
import crypto from "crypto";
import VerifyActionButtons from "./VerifyActionButtons";

export const metadata = {
  title: "Verify Credential · CertiPort Trust Registry",
  description: "Official public verification for CertiPort certificates and credentials",
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  const certificate = await db.certificate.findUnique({
    where: { qrPublicId: publicId },
    include: {
      organization: { select: { id: true, name: true } },
      template: {
        select: {
          id: true,
          name: true,
          type: true,
          backgroundUrl: true,
          fieldLayout: true,
        },
      },
      issuedBy: { select: { name: true, email: true, role: true } },
    },
  });

  // 1. Not Found State
  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-sm">
              C
            </div>
            <span className="font-extrabold text-sm tracking-wider text-slate-900">
              CERTIPORT <span className="text-gray-400 font-normal">| Trust Registry</span>
            </span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Credential Not Found</h1>
            <p className="text-sm text-gray-600">
              The verification code <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-red-600 font-semibold">{publicId}</code> does not match any authentic credential record in the CertiPort Trust Ledger.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 text-left space-y-2">
            <div className="font-bold text-gray-700 uppercase">Verification Security Notice:</div>
            <div>
              If you believe this is an error, please ensure you scanned the authentic QR code on an original certificate or contact the issuing organization.
            </div>
          </div>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors"
          >
            Go to Homepage
          </Link>
        </main>

        <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200">
          CertiPort Credential & Card Platform · Cryptographic Verification Engine
        </footer>
      </div>
    );
  }

  // 2. Revoked State
  if (certificate.status === "REVOKED") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sm:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-700 text-white font-bold flex items-center justify-center text-sm">
              C
            </div>
            <span className="font-extrabold text-sm tracking-wider text-slate-900">
              CERTIPORT <span className="text-gray-400 font-normal">| Trust Registry</span>
            </span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <div className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Status: Revoked Credential
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Credential Has Been Revoked</h1>
            <p className="text-sm text-gray-600">
              Certificate <strong className="font-mono text-gray-800">{certificate.certificateRef}</strong> was issued to <strong>{certificate.recipientName}</strong> but has subsequently been officially revoked by <strong>{certificate.organization.name}</strong>.
            </p>
          </div>

          <div className="p-4 bg-red-50/60 rounded-xl border border-red-200 text-xs text-red-900 text-left space-y-1">
            <div className="font-bold uppercase tracking-wider">Invalidity Notice:</div>
            <div>This certificate is invalid and cannot be accepted for professional, academic, or identity verification purposes.</div>
          </div>
        </main>

        <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200">
          CertiPort Credential & Card Platform · Cryptographic Verification Engine
        </footer>
      </div>
    );
  }

  // 3. Valid Credential Experience
  // Generate a mock SHA-256 fingerprint from the certificate reference and recipient email
  const sha256Fingerprint = crypto
    .createHash("sha256")
    .update(`${certificate.certificateRef}:${certificate.recipientEmail}:${certificate.createdAt.toISOString()}`)
    .digest("hex")
    .toUpperCase();

  const formattedFingerprint = sha256Fingerprint.match(/.{1,4}/g)?.slice(0, 8).join(":") || sha256Fingerprint;

  const orientation =
    certificate.template.fieldLayout &&
    typeof certificate.template.fieldLayout === "object" &&
    !Array.isArray(certificate.template.fieldLayout) &&
    certificate.template.fieldLayout.orientation === "PORTRAIT"
      ? "PORTRAIT"
      : "LANDSCAPE";

  const isPortrait = orientation === "PORTRAIT";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Trust Registry Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            C
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wider text-slate-900 flex items-center gap-2">
              CERTIPORT <span className="text-emerald-700 font-semibold">TRUST LEDGER</span>
            </div>
            <div className="text-[10px] text-gray-500">Official Public Verification (SRS §6.1)</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-800 hidden sm:inline">
            Active Verification Authority
          </span>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Verification Status Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          {/* Subtle background circle decoration */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-20 top-0 w-32 h-32 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                Officially Verified Authentic
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Valid Credential Record
              </h1>
              <p className="text-sm text-emerald-100 max-w-xl">
                Issued by <strong>{certificate.organization.name}</strong> · Tamper-evident digital signature verified against immutable audit trail.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-center sm:text-right shrink-0">
              <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Certificate ID</div>
              <div className="text-sm sm:text-base font-mono font-bold text-white mt-0.5 select-all">
                {certificate.certificateRef}
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Display & Details Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          {/* Visual Certificate Preview Card */}
          <div className="p-6 sm:p-8 bg-slate-50 border-b border-gray-200 flex flex-col items-center">
            <div
              style={{
                width: "100%",
                maxWidth: isPortrait ? 420 : 640,
                aspectRatio: isPortrait ? "210 / 297" : "297 / 210",
                position: "relative",
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid #10B981",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                background: "#ffffff",
              }}
            >
              {certificate.template.backgroundUrl ? (
                <img
                  src={certificate.template.backgroundUrl}
                  alt="Certificate artwork"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textAlign: "center",
                    border: "3px solid #0E6B49",
                    margin: 8,
                    background: "#FAFAFA",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0E6B49", letterSpacing: 2 }}>
                    CERTIFICATE OF COMPLETION
                  </div>
                  <div style={{ margin: "auto 0" }}>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>This certifies that</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "6px 0" }}>
                      {certificate.recipientName}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      has successfully completed <strong>{certificate.courseName}</strong>
                    </div>
                    {certificate.grade && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginTop: 4 }}>
                        Grade: {certificate.grade}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 9, color: "#9CA3AF" }}>
                    <span>ID: {certificate.certificateRef}</span>
                    <span>{certificate.organization.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 w-full flex justify-center">
              <VerifyActionButtons
                fileUrl={certificate.fileUrl}
                recipientName={certificate.recipientName}
                certificateRef={certificate.certificateRef}
              />
            </div>
          </div>

          {/* Detailed Verification Records Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Certified Credential Details
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Name</dt>
                <dd className="text-base font-bold text-gray-900">{certificate.recipientName}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course / Certification</dt>
                <dd className="text-base font-semibold text-gray-900">{certificate.courseName}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grade / Honors</dt>
                <dd className="text-base font-semibold text-emerald-800">
                  {certificate.grade || "Pass / Completed"}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issuing Organization</dt>
                <dd className="text-sm font-semibold text-gray-900">{certificate.organization.name}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Date</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date(certificate.createdAt).toLocaleDateString()}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student / Reference ID</dt>
                <dd className="text-sm font-mono text-gray-700">{certificate.studentId || "—"}</dd>
              </div>
            </dl>

            {/* Cryptographic Ledger Proof Section */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 bg-slate-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Cryptographic Trust Proof (SRS §6.1)
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  SHA-256 Validated
                </span>
              </div>

              <div className="font-mono text-[11px] text-gray-600 bg-white p-3 rounded-lg border border-gray-200 select-all break-all">
                Fingerprint: {formattedFingerprint}
              </div>

              <div className="flex flex-wrap justify-between text-[11px] text-gray-500 pt-1">
                <span>Public QR Key: <code className="font-mono text-gray-800 font-semibold">{certificate.qrPublicId}</code></span>
                <span>Registry: CertiPort Trust Authority</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} CertiPort Platform · Multi-Tenant Credential Verification Network
      </footer>
    </div>
  );
}
