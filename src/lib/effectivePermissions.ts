import { can, type Role, type Permission, PermissionDeniedError } from "./permissions";
import { db } from "./db";

/**
 * Evaluates whether an actor holds a permission either through:
 * 1. Their static primary RBAC role (SRS §3.3 / §3.4 MATRIX)
 * 2. An active, time-bounded Access Transformation grant in the database (SRS §3.5)
 */
export async function hasEffectivePermission(
  actor: { id?: string; role: Role },
  permission: Permission
): Promise<boolean> {
  // 1. Check static role permission matrix first (fastest)
  if (can(actor.role, permission)) {
    return true;
  }

  // 2. If no user ID is present, cannot evaluate database grants
  if (!actor.id) {
    return false;
  }

  const now = new Date();

  // 3. Query active TemporaryAccess grant within valid time window
  const activeGrant = await db.temporaryAccess.findFirst({
    where: {
      recipientId: actor.id,
      permission,
      status: "ACTIVE",
      startsAt: { lte: now },
      expiresAt: { gt: now },
    },
  });

  return !!activeGrant;
}

/**
 * Asserts effective permission or throws PermissionDeniedError
 */
export async function assertEffectivePermission(
  actor: { id?: string; role: Role },
  permission: Permission
): Promise<void> {
  const allowed = await hasEffectivePermission(actor, permission);
  if (!allowed) {
    throw new PermissionDeniedError(actor.role, permission);
  }
}
