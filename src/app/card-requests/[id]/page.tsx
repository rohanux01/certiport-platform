import { redirect, notFound } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { PIPELINE_ORDER, type CardRequestStatus } from "@/lib/cardWorkflow";
import CardActionControls from "./CardActionControls";
import CardVisualPreview from "@/components/CardVisualPreview";

export default async function CardRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string;

  const cardRequest = await db.cardRequest.findUnique({
    where: { id },
    include: {
      template: true,
      submittedBy: { select: { id: true, name: true, email: true } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cardRequest || cardRequest.organizationId !== organizationId) {
    notFound();
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const currentStatusIndex = PIPELINE_ORDER.indexOf(cardRequest.status as CardRequestStatus);
  const fields = cardRequest.fields as Record<string, any>;

  const friendlyStatusNames: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Admin",
    CHANGES_REQUESTED: "Changes Requested",
    APPROVED: "Admin Approved",
    PENDING_CANDIDATE: "Candidate Review",
    CANDIDATE_CHANGES: "Candidate Changes",
    CANDIDATE_APPROVED: "Candidate Approved",
    FINALIZED: "Finalized",
    DELIVERED: "Delivered",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/card-requests" className="hover:text-emerald-700">
                Card Requests
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-mono text-xs">{cardRequest.id.slice(0, 12)}...</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {fields?.fullName || "Card Request"}
            </h1>
            <p className="text-sm text-gray-500">
              {cardRequest.type === "ID_CARD" ? "Employee ID Card" : "Corporate Business Card"} · Template: {cardRequest.template.name}
            </p>
          </div>

          <Link
            href="/card-requests"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm"
          >
            ← Back to Requests
          </Link>
        </div>

        {/* 9-Phase Workflow Stepper */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Governance Pipeline Progress
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full">
              Current: {friendlyStatusNames[cardRequest.status] || cardRequest.status}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-[700px] justify-between">
              {PIPELINE_ORDER.map((step, idx) => {
                const isPassed = idx < currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;

                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    {/* Connecting line */}
                    {idx < PIPELINE_ORDER.length - 1 && (
                      <div
                        className={`absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${
                          idx < currentStatusIndex ? "bg-emerald-600" : "bg-gray-200"
                        }`}
                      />
                    )}

                    {/* Step Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                        isCurrent
                          ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`text-[11px] mt-2 text-center px-1 font-medium ${
                        isCurrent
                          ? "text-emerald-800 font-bold"
                          : isPassed
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {friendlyStatusNames[step] || step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Card Info & Visual Preview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Card Preview & Specifications
              </h3>

              {/* Dynamic Orientation-Aware Visual Card */}
              <CardVisualPreview
                template={cardRequest.template}
                fields={fields}
                orgName="CERTIPORT"
                fileUrl={cardRequest.fileUrl}
              />

              {/* Data Table */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-gray-400 font-bold uppercase">Phone Number</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">{fields?.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-bold uppercase">Submitted By</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">{cardRequest.submittedBy.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-bold uppercase">Created At</dt>
                  <dd className="font-semibold text-gray-900 mt-0.5">
                    {new Date(cardRequest.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-bold uppercase">Candidate Token</dt>
                  <dd className="font-mono text-gray-600 mt-0.5 select-all">
                    {cardRequest.candidateToken}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Comments Thread */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Audit Notes & Comments ({cardRequest.comments.length})
              </h3>

              {cardRequest.comments.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">
                  No notes recorded for this request yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {cardRequest.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-900">{c.authorLabel}</span>
                        <span className="text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-700">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Controls Column */}
          <div className="lg:col-span-6 space-y-6">
            <CardActionControls
              cardRequestId={cardRequest.id}
              currentStatus={cardRequest.status as CardRequestStatus}
              userRole={role}
              candidateToken={cardRequest.candidateToken}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
