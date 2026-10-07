import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/permissions";
import { logAudit } from "@/lib/auditLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorRole = (session.user as any).role as Role;
    const actorId = (session.user as any).id as string;
    const organizationId = (session.user as any).organizationId as string;

    if (!can(actorRole, "access-transformation")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to revoke temporary access grants." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const grant = await db.temporaryAccess.findUnique({
      where: { id },
      include: {
        recipient: { select: { name: true, email: true, organizationId: true } },
      },
    });

    if (!grant || grant.recipient.organizationId !== organizationId) {
      return NextResponse.json({ error: "Temporary access grant not found." }, { status: 404 });
    }

    if (grant.status === "REVOKED") {
      return NextResponse.json({ error: "This grant has already been revoked." }, { status: 400 });
    }

    const updated = await db.temporaryAccess.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    await logAudit({
      organizationId,
      actorId,
      action: "permission.revoke.temporary",
      entityType: "TemporaryAccess",
      entityId: grant.id,
      oldValue: { status: grant.status },
      newValue: { status: "REVOKED" },
    });

    return NextResponse.json({
      success: true,
      message: `Temporary grant of ${grant.permission} to ${grant.recipient.name} revoked.`,
      grant: updated,
    });
  } catch (err: any) {
    console.error("Revoke temporary access error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to revoke temporary access" },
      { status: 500 }
    );
  }
}
