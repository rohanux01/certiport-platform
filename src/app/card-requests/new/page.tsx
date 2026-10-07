import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import CardCreateForm from "./CardCreateForm";

export default async function NewCardRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;

  const templates = organizationId
    ? await db.template.findMany({
        where: {
          organizationId,
          type: { in: ["ID_CARD", "BUSINESS_CARD"] },
          isActive: true,
        },
        select: { id: true, name: true, type: true, backgroundUrl: true, fieldLayout: true },
        orderBy: { name: "asc" },
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
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/card-requests" className="hover:text-emerald-700">
            Card Requests
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New Card Request</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Card Request</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit a new ID Card or Business Card for administrative and candidate approval
          </p>
        </div>

        <CardCreateForm templates={templates} />
      </main>
    </div>
  );
}
