import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import CertificateIssueForm from "./CertificateIssueForm";

export default async function IssueCertificatePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;

  const templates = organizationId
    ? await db.template.findMany({
        where: {
          organizationId,
          type: "CERTIFICATE",
          isActive: true,
        },
        select: { id: true, name: true, backgroundUrl: true, fieldLayout: true },
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

      <main className="flex-1 min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/certificates" className="hover:text-emerald-700">
            Certificates
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Issue Certificate</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Certificate</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and sign an official digital credential with QR verification
          </p>
        </div>

        <CertificateIssueForm templates={templates} />
      </main>
    </div>
  );
}
