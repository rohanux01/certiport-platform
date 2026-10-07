import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import TemplateCreateForm from "./TemplateCreateForm";
import TemplateGrid from "./TemplateGrid";

type TemplateRow = {
  id: string;
  name: string;
  type: string;
  source: string;
  version: number;
  isActive: boolean;
  isDefault: boolean;
  fieldLayout?: any;
  backgroundUrl?: string | null;
  backgroundHtml?: string | null;
  createdAt: Date;
};

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = ((session.user as any).role as string) ?? "ORG_ADMIN";

  const templates: TemplateRow[] = organizationId
    ? await db.template.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          source: true,
          version: true,
          isActive: true,
          isDefault: true,
          fieldLayout: true,
          backgroundUrl: true,
          backgroundHtml: true,
          createdAt: true,
        },
      })
    : [];

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-[#0F172A]">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Templates</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Design & manage certificate, ID card, and business card layouts ({templates.length} total)
            </p>
          </div>

          <TemplateCreateForm userRole={role} />
        </div>

        {/* Interactive template grid with category filtering */}
        <TemplateGrid templates={templates} />
      </main>
    </div>
  );
}
