import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import TemplateDesignerCanvas from "./TemplateDesignerCanvas";

export default async function TemplateDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const organizationId = (session.user as any).organizationId as string | undefined;
  const role = ((session.user as any).role as string) ?? "ORG_ADMIN";

  if (!organizationId) {
    redirect("/login");
  }

  const template = await db.template.findUnique({
    where: { id },
  });

  if (!template || template.organizationId !== organizationId) {
    notFound();
  }

  return (
    <TemplateDesignerCanvas
      template={{
        id: template.id,
        name: template.name,
        type: template.type,
        source: template.source,
        version: template.version,
        fieldLayout: template.fieldLayout,
        backgroundUrl: template.backgroundUrl,
        backgroundHtml: template.backgroundHtml,
      }}
      userRole={role}
    />
  );
}
