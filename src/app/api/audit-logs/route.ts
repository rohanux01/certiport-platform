import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as Role;
  if (!can(role, "view-audit-log")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view audit logs." },
      { status: 403 }
    );
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) return NextResponse.json([]);

  const searchParams = req.nextUrl.searchParams;
  const actionFilter = searchParams.get("action");
  const entityFilter = searchParams.get("entityType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  const logs = await db.auditLog.findMany({
    where: {
      organizationId,
      ...(actionFilter ? { action: { contains: actionFilter, mode: "insensitive" } } : {}),
      ...(entityFilter ? { entityType: entityFilter } : {}),
    },
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
