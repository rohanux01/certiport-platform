import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string;

  const [
    certificateCount,
    templateCount,
    cardRequestCount,
    pendingCardCount,
    userCount,
    recentCertificates,
    recentCards,
  ] = organizationId
    ? await Promise.all([
        db.certificate.count({ where: { organizationId } }),
        db.template.count({ where: { organizationId } }),
        db.cardRequest.count({ where: { organizationId } }),
        db.cardRequest.count({
          where: { organizationId, status: { in: ["PENDING_APPROVAL", "PENDING_CANDIDATE"] } },
        }),
        db.user.count({ where: { organizationId } }),
        db.certificate.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { template: { select: { name: true } } },
        }),
        db.cardRequest.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { template: { select: { name: true } } },
        }),
      ])
    : [0, 0, 0, 0, 0, [], []];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const statusColor: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#F2F5F7", text: "#57616B" },
    PENDING_APPROVAL: { bg: "#FEF3C7", text: "#B45309" },
    CHANGES_REQUESTED: { bg: "#FEE2E2", text: "#C81E1E" },
    APPROVED: { bg: "#EEF2FF", text: "#494BDF" },
    PENDING_CANDIDATE: { bg: "#E0F2FE", text: "#0369A1" },
    CANDIDATE_CHANGES: { bg: "#FFEDD5", text: "#B8470A" },
    CANDIDATE_APPROVED: { bg: "#E6F4ED", text: "#0A7B46" },
    FINALIZED: { bg: "#F3E8FF", text: "#6B21A8" },
    DELIVERED: { bg: "#E6F4ED", text: "#0A7B46" },
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-[#423D34] flex flex-col md:flex-row font-sans">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner (SEED Theme) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E0E6EB] shadow-premium flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#494BDF]/10 text-[#494BDF] text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#494BDF] animate-pulse" />
              SEED — Beyond the Obvious
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#423D34]">
              Welcome back, <span className="text-[#494BDF]">{session.user.name?.split(" ")[0] || "User"}</span>
            </h1>
            <p className="text-sm text-[#57616B] mt-1">
              CertiPort Credentials Platform · Role: <span className="font-semibold text-[#423D34]">{role}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/certificates/issue"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#494BDF] hover:bg-[#3B3DC2] text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>+</span>
              <span>Issue Certificate</span>
            </Link>
            <Link
              href="/card-requests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F2F5F7] hover:bg-[#E5E9EE] text-[#423D34] text-sm font-semibold rounded-xl border border-[#E0E6EB] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>+</span>
              <span>New Card Request</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid (SEED soft rounded float style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Certificate Count */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E6EB] shadow-premium hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57616B] uppercase tracking-wider">Certificates Issued</span>
              <span className="w-9 h-9 rounded-xl bg-[#494BDF]/10 text-[#494BDF] flex items-center justify-center text-base font-bold group-hover:scale-110 transition-transform">
                📜
              </span>
            </div>
            <div className="text-4xl font-bold text-[#423D34] mt-3 tracking-tight">{certificateCount}</div>
            <div className="text-xs text-[#57616B] mt-1">Total credentials generated</div>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#494BDF] hover:underline"
            >
              <span>View all certificates</span>
              <span>→</span>
            </Link>
          </div>

          {/* Card Requests Count */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E6EB] shadow-premium hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57616B] uppercase tracking-wider">Card Requests</span>
              <span className="w-9 h-9 rounded-xl bg-[#B8470A]/10 text-[#B8470A] flex items-center justify-center text-base font-bold group-hover:scale-110 transition-transform">
                💳
              </span>
            </div>
            <div className="text-4xl font-bold text-[#423D34] mt-3 tracking-tight">{cardRequestCount}</div>
            <div className="text-xs font-semibold text-[#B8470A] mt-1">{pendingCardCount} requiring attention</div>
            <Link
              href="/card-requests"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#494BDF] hover:underline"
            >
              <span>Manage requests</span>
              <span>→</span>
            </Link>
          </div>

          {/* Templates Count */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E6EB] shadow-premium hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57616B] uppercase tracking-wider">Templates</span>
              <span className="w-9 h-9 rounded-xl bg-[#0A7B46]/10 text-[#0A7B46] flex items-center justify-center text-base font-bold group-hover:scale-110 transition-transform">
                🎨
              </span>
            </div>
            <div className="text-4xl font-bold text-[#423D34] mt-3 tracking-tight">{templateCount}</div>
            <div className="text-xs text-[#57616B] mt-1">Active design layouts</div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#494BDF] hover:underline"
            >
              <span>Browse templates</span>
              <span>→</span>
            </Link>
          </div>

          {/* Organization Users */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E6EB] shadow-premium hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57616B] uppercase tracking-wider">Team Members</span>
              <span className="w-9 h-9 rounded-xl bg-[#494BDF]/10 text-[#494BDF] flex items-center justify-center text-base font-bold group-hover:scale-110 transition-transform">
                👥
              </span>
            </div>
            <div className="text-4xl font-bold text-[#423D34] mt-3 tracking-tight">{userCount}</div>
            <div className="text-xs text-[#57616B] mt-1">Active RBAC workforce</div>
            <Link
              href="/users"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#494BDF] hover:underline"
            >
              <span>Manage access</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Card Requests */}
          <div className="bg-white rounded-2xl border border-[#E0E6EB] shadow-premium overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E0E6EB] flex justify-between items-center bg-[#F8FAFB]">
              <h2 className="text-base font-bold text-[#423D34]">
                Recent Card <span className="text-[#494BDF]">Requests</span>
              </h2>
              <Link href="/card-requests" className="text-xs font-semibold text-[#494BDF] hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-[#E0E6EB] flex-1">
              {recentCards.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#57616B]">No card requests submitted yet.</div>
              ) : (
                recentCards.map((card) => {
                  const fields = card.fields as Record<string, any>;
                  const badge = statusColor[card.status] || { bg: "#F2F5F7", text: "#57616B" };
                  return (
                    <div key={card.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFB] transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-[#423D34]">{fields?.fullName || "Unnamed Candidate"}</div>
                        <div className="text-xs text-[#57616B]">{fields?.jobTitle || "—"} · {card.template.name}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {card.status.replace(/_/g, " ")}
                        </span>
                        <Link href={`/card-requests/${card.id}`} className="text-xs text-[#57616B] hover:text-[#494BDF] font-semibold">
                          →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Certificates */}
          <div className="bg-white rounded-2xl border border-[#E0E6EB] shadow-premium overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E0E6EB] flex justify-between items-center bg-[#F8FAFB]">
              <h2 className="text-base font-bold text-[#423D34]">
                Recent <span className="text-[#494BDF]">Certificates</span>
              </h2>
              <Link href="/certificates" className="text-xs font-semibold text-[#494BDF] hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-[#E0E6EB] flex-1">
              {recentCertificates.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#57616B]">No certificates issued yet.</div>
              ) : (
                recentCertificates.map((cert) => (
                  <div key={cert.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFB] transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-[#423D34]">{cert.recipientName}</div>
                      <div className="text-xs text-[#57616B] font-mono">{cert.certificateRef} · {cert.template.name}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4ED] text-[#0A7B46]">
                      {cert.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
