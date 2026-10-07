import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/permissions";
import AppNav from "@/components/AppNav";
import AuditLogTable from "./AuditLogTable";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as Role;

  if (!can(role, "view-audit-log")) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppNav user={session.user} onSignOut={async () => { "use server"; await signOut({ redirectTo: "/login" }); }} />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
            <p className="text-sm text-gray-500">
              Your role ({role}) does not have permission to inspect immutable governance audit logs.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const logs = organizationId
    ? await db.auditLog.findMany({
        where: { organizationId },
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs & Governance</h1>
          <p className="text-sm text-gray-500 mt-1">
            SRS §7.1 Immutable audit trail recording every state mutation across certificates, card workflows, and access transformation.
          </p>
        </div>

        <AuditLogTable initialLogs={logs as any} />
      </main>
    </div>
  );
}
