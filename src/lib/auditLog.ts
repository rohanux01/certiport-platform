import { db } from "./db";

/**
 * SRS §6.6 — every state change must be recorded, immutably. This is the
 * single call site the rest of the app should use; never write to
 * AuditLog directly from a route so this stays the one enforced path.
 */
export async function logAudit(params: {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  return db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue as any,
      newValue: params.newValue as any,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
