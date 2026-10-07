import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function CardRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const { status: statusFilter } = await searchParams;

  const cardRequests = organizationId
    ? await db.cardRequest.findMany({
        where: {
          organizationId,
          ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          template: { select: { id: true, name: true, type: true } },
          submittedBy: { select: { name: true, email: true } },
        },
      })
    : [];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const tabs = [
    { label: "All Requests", value: "ALL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Pending Admin", value: "PENDING_APPROVAL" },
    { label: "Pending Candidate", value: "PENDING_CANDIDATE" },
    { label: "Candidate Approved", value: "CANDIDATE_APPROVED" },
    { label: "Delivered", value: "DELIVERED" },
  ];

  const currentTab = statusFilter || "ALL";

  const statusColor: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#F3F4F6", text: "#4B5563" },
    PENDING_APPROVAL: { bg: "#FEF3C7", text: "#92400E" },
    CHANGES_REQUESTED: { bg: "#FEE2E2", text: "#991B1B" },
    APPROVED: { bg: "#E0E7FF", text: "#3730A3" },
    PENDING_CANDIDATE: { bg: "#E0F2FE", text: "#0369A1" },
    CANDIDATE_CHANGES: { bg: "#FFEDD5", text: "#9A3412" },
    CANDIDATE_APPROVED: { bg: "#D1FAE5", text: "#065F46" },
    FINALIZED: { bg: "#EDE9FE", text: "#5B21B6" },
    DELIVERED: { bg: "#DCFCE7", text: "#166534" },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Card Requests</h1>
            <p className="text-sm text-gray-500 mt-1">
              Module 2 — 9-phase ID Card and Business Card governance workflow
            </p>
          </div>

          <Link
            href="/card-requests/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            + Create Card Request
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value === "ALL" ? "/card-requests" : `/card-requests?status=${tab.value}`}
                className={`py-2.5 px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  currentTab === tab.value
                    ? "border-emerald-700 text-emerald-800 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Candidate / Employee</th>
                <th className="px-6 py-3.5">Card Type</th>
                <th className="px-6 py-3.5">Template</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Candidate Review Link</th>
                <th className="px-6 py-3.5">Submitted By</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cardRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No card requests found in this view. Click &quot;+ Create Card Request&quot; to begin.
                  </td>
                </tr>
              ) : (
                cardRequests.map((req) => {
                  const fields = req.fields as Record<string, any>;
                  const badge = statusColor[req.status] || { bg: "#F3F4F6", text: "#4B5563" };
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{fields?.fullName || "—"}</div>
                        <div className="text-xs text-gray-500">{fields?.email || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {req.type === "ID_CARD" ? "ID Card" : "Business Card"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{req.template.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/review/${req.candidateToken}`}
                          target="_blank"
                          className="text-xs font-mono text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>/review/...{req.candidateToken.slice(-6)}</span>
                          <span className="text-[10px]">↗</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {req.submittedBy.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/card-requests/${req.id}`}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition-colors"
                        >
                          Review & Stepper →
                        </Link>
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
