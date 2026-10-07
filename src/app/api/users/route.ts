import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, canAssignRole, type Role } from "@/lib/permissions";
import { logAudit } from "@/lib/auditLog";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["SUPER_ADMIN", "ORG_ADMIN", "CERT_ISSUER", "HR"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) {
    return NextResponse.json([]);
  }

  const users = await db.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      temporaryGrantsReceived: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          permission: true,
          reason: true,
          expiresAt: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = (session.user as any).role as Role;
  if (!can(actorRole, "manage-user-roles")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to manage user roles." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!canAssignRole(actorRole, parsed.data.role)) {
    return NextResponse.json(
      { error: `Forbidden: Role ${actorRole} cannot assign higher privilege role ${parsed.data.role} (Permission Ceiling violation)` },
      { status: 403 }
    );
  }

  const organizationId = (session.user as any).organizationId as string;
  const actorId = (session.user as any).id as string;

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email address already exists." },
      { status: 409 }
    );
  }

  const password = parsed.data.password || "DemoPass123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
      organizationId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  await logAudit({
    organizationId,
    actorId,
    action: "user.create",
    entityType: "User",
    entityId: newUser.id,
    newValue: { email: newUser.email, role: newUser.role },
  });

  return NextResponse.json(newUser, { status: 201 });
}
