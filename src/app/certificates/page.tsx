import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;

  const certificates = organizationId
    ? await db.certificate.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { template: { select: { name: true } } },
      })
    : [];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const statusColor: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#F3F4F6", text: "#4B5563" },
    GENERATING: { bg: "#E0F2FE", text: "#0369A1" },
    GENERATED: { bg: "#E0F2FE", text: "#0369A1" },
    ISSUED: { bg: "#FEF3C7", text: "#92400E" },
    DELIVERED: { bg: "#DCFCE7", text: "#166534" },
    REVOKED: { bg: "#FEE2E2", text: "#991B1B" },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Module 1 — {certificates.length} credentials issued with QR verification
            </p>
          </div>

          <Link
            href="/certificates/issue"
            className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            + Issue Certificate
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Recipient</th>
                <th className="px-6 py-3.5">Certificate Ref</th>
                <th className="px-6 py-3.5">Course / Achievement</th>
                <th className="px-6 py-3.5">Template</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Issued Date</th>
                <th className="px-6 py-3.5 text-right">Verification QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No certificates issued yet. Click &quot;+ Issue Certificate&quot; to issue your first credential.
                  </td>
                </tr>
              ) : (
                certificates.map((c) => {
                  const badge = statusColor[c.status] || { bg: "#F3F4F6", text: "#4B5563" };
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{c.recipientName}</div>
                        <div className="text-xs text-gray-500">{c.recipientEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-900 font-semibold select-all">
                        {c.certificateRef}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{c.courseName}</div>
                        {c.grade && <div className="text-xs text-gray-500">Grade: {c.grade}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{c.template.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.fileUrl && (
                            <a
                              href={c.fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md"
                            >
                              <span>PDF</span>
                              <span className="text-[10px]">↓</span>
                            </a>
                          )}
                          <a
                            href={`/api/verify/${c.qrPublicId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md"
                          >
                            <span>Verify (SRS §6.1)</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
