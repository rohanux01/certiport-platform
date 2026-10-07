import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/permissions";
import AppNav from "@/components/AppNav";
import UserInviteModal from "./UserInviteModal";
import AccessTransformationModal from "./AccessTransformationModal";
import GrantRevokeButton from "./GrantRevokeButton";

function formatRemaining(expiresAt: Date): { text: string; isUrgent: boolean } {
  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return { text: "Expired", isUrgent: false };
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    return { text: `${days}d ${remHours}h left`, isUrgent: false };
  }
  if (diffHours > 0) {
    return { text: `${diffHours}h ${diffMins}m left`, isUrgent: diffHours < 2 };
  }
  return { text: `${diffMins}m left`, isUrgent: true };
}

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as Role;
  const canManageAccess = can(role, "access-transformation");

  const now = new Date();

  // Expire any grants past expiry date in DB before fetching
  if (organizationId) {
    await db.temporaryAccess.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });
  }

  const [users, temporaryGrants] = organizationId
    ? await Promise.all([
        db.user.findMany({
          where: { organizationId },
          orderBy: { createdAt: "asc" },
          include: {
            temporaryGrantsReceived: {
              where: {
                status: "ACTIVE",
                expiresAt: { gt: now },
              },
            },
          },
        }),
        db.temporaryAccess.findMany({
          where: { recipient: { organizationId } },
          include: {
            recipient: { select: { name: true, email: true } },
            grantedBy: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const roleBadge: Record<string, { bg: string; text: string; label: string }> = {
    SUPER_ADMIN: { bg: "#EDE9FE", text: "#6D28D9", label: "Super Admin" },
    ORG_ADMIN: { bg: "#E0F2FE", text: "#0369A1", label: "Org Admin" },
    CERT_ISSUER: { bg: "#FEF3C7", text: "#B45309", label: "Cert Issuer" },
    HR: { bg: "#DCFCE7", text: "#15803D", label: "HR Specialist" },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Users & RBAC Governance</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                SRS §3.3 / §3.5
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              4-Actor RBAC permission matrix and dynamic Access Transformation ceiling governance
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canManageAccess && <AccessTransformationModal users={users} actorRole={role} />}
            <UserInviteModal />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-base font-bold text-gray-900">Organization Members ({users.length})</h2>
              <p className="text-xs text-gray-500">Active workforce with real-time privilege elevation status</p>
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Active Temporary Privileges</th>
                <th className="px-6 py-3.5">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const meta = roleBadge[u.role] || { bg: "#F3F4F6", text: "#374151", label: u.role };
                const activeGrants = u.temporaryGrantsReceived || [];

                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: meta.bg, color: meta.text }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activeGrants.length === 0 ? (
                        <span className="text-xs text-gray-400">Standard Role Ceiling</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeGrants.map((g) => {
                            const rem = formatRemaining(new Date(g.expiresAt));
                            return (
                              <span
                                key={g.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                                <span>+{g.permission}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${rem.isUrgent ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-purple-100 text-purple-700'}`}>
                                  ⏳ {rem.text}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Temporary Access Grants History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  Access Transformation Engine & Audit
                </h2>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  Dynamic RBAC
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Time-bounded privilege elevations granted under strict permission ceiling governance
              </p>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
              {temporaryGrants.length} logged grants
            </span>
          </div>

          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Recipient</th>
                <th className="px-6 py-3.5">Elevated Permission</th>
                <th className="px-6 py-3.5">Justification Reason</th>
                <th className="px-6 py-3.5">Granted By</th>
                <th className="px-6 py-3.5">Expires / Countdown</th>
                <th className="px-6 py-3.5">Status</th>
                {canManageAccess && <th className="px-6 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {temporaryGrants.length === 0 ? (
                <tr>
                  <td colSpan={canManageAccess ? 7 : 6} className="px-6 py-8 text-center text-gray-400 text-xs">
                    No temporary access grants issued yet.
                  </td>
                </tr>
              ) : (
                temporaryGrants.map((grant) => {
                  const isExpired = new Date(grant.expiresAt) < new Date();
                  const isRevoked = grant.status === "REVOKED";
                  const isCurrentlyActive = grant.status === "ACTIVE" && !isExpired;
                  const rem = formatRemaining(new Date(grant.expiresAt));

                  return (
                    <tr key={grant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{grant.recipient.name}</div>
                        <div className="text-xs text-gray-500">{grant.recipient.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                          {grant.permission}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate" title={grant.reason}>
                        {grant.reason}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {grant.grantedBy.name}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-gray-700">{new Date(grant.expiresAt).toLocaleString()}</div>
                        {isCurrentlyActive && (
                          <div className={`text-[11px] font-medium mt-0.5 ${rem.isUrgent ? 'text-amber-600 font-bold' : 'text-purple-600'}`}>
                            ⏳ {rem.text}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            REVOKED
                          </span>
                        ) : isExpired || grant.status === "EXPIRED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      {canManageAccess && (
                        <td className="px-6 py-4 text-right">
                          {isCurrentlyActive ? (
                            <GrantRevokeButton
                              grantId={grant.id}
                              recipientName={grant.recipient.name}
                              permission={grant.permission}
                            />
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      )}
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
