import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import AppNav from "@/components/AppNav";
import NotificationSettingsForm from "./NotificationSettingsForm";

const DEFAULT_EVENTS = [
  { eventKey: "certificate-issued", emailEnabled: true, whatsappEnabled: false },
  { eventKey: "card-pending", emailEnabled: true, whatsappEnabled: true },
  { eventKey: "candidate-approved", emailEnabled: true, whatsappEnabled: true },
  { eventKey: "changes-requested", emailEnabled: true, whatsappEnabled: false },
  { eventKey: "access-granted", emailEnabled: true, whatsappEnabled: false },
];

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string;

  const dbSettings = organizationId
    ? await db.notificationSetting.findMany({
        where: { organizationId },
      })
    : [];

  const existingKeys = new Set(dbSettings.map((s) => s.eventKey));
  const fullSettings = [...dbSettings];

  for (const def of DEFAULT_EVENTS) {
    if (!existingKeys.has(def.eventKey)) {
      fullSettings.push({
        id: `virtual-${def.eventKey}`,
        organizationId: organizationId || "",
        eventKey: def.eventKey,
        emailEnabled: def.emailEnabled,
        whatsappEnabled: def.whatsappEnabled,
      });
    }
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AppNav user={session.user} onSignOut={handleSignOut} />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Channels & Delivery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure automated Email notifications and WhatsApp Business API dispatch rules
          </p>
        </div>

        <NotificationSettingsForm initialSettings={fullSettings} userRole={role} />
      </main>
    </div>
  );
}
