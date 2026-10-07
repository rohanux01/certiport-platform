// Pure RBAC logic — no DB dependency, matches SRS §3.3/§3.4 permission matrix.
// Kept dependency-free so it's trivially unit-testable and reusable from both
// API routes and UI components.

export type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "CERT_ISSUER" | "HR";

export type Permission =
  | "manage-templates"
  | "issue-certificate"
  | "bulk-upload"
  | "create-card"
  | "approve-card"
  | "view-audit-log"
  | "manage-user-roles"
  | "access-transformation"
  | "manage-tenants";

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ORG_ADMIN: 75,
  CERT_ISSUER: 50,
  HR: 50,
};

// SRS §3.4 permission matrix, encoded directly.
const MATRIX: Record<Permission, Role[]> = {
  "manage-templates": ["SUPER_ADMIN", "ORG_ADMIN"],
  "issue-certificate": ["SUPER_ADMIN", "ORG_ADMIN", "CERT_ISSUER"],
  "bulk-upload": ["SUPER_ADMIN", "ORG_ADMIN", "CERT_ISSUER"],
  "create-card": ["SUPER_ADMIN", "ORG_ADMIN", "HR"],
  "approve-card": ["SUPER_ADMIN", "ORG_ADMIN"],
  "view-audit-log": ["SUPER_ADMIN", "ORG_ADMIN"],
  "manage-user-roles": ["SUPER_ADMIN", "ORG_ADMIN"],
  "access-transformation": ["SUPER_ADMIN", "ORG_ADMIN"],
  "manage-tenants": ["SUPER_ADMIN"],
};

/**
 * Checks whether a given role has a specific permission.
 */
export function can(role: Role, permission: Permission): boolean {
  return MATRIX[permission]?.includes(role) ?? false;
}

/**
 * Returns all permissions granted to a specific role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.keys(MATRIX) as Permission[]).filter((perm) => can(role, perm));
}

/**
 * Returns all roles that hold a given permission.
 */
export function getRolesWithPermission(permission: Permission): Role[] {
  return MATRIX[permission] || [];
}

/**
 * SRS §3.4 "permission ceiling" rule: an actor can never grant a permission
 * they do not themselves hold. Used by the Access Transformation flow.
 */
export function canGrant(granterRole: Role, permission: Permission): boolean {
  return can(granterRole, permission);
}

/**
 * Checks whether an actor can assign a target role to a user.
 * Prevents non-SUPER_ADMIN users from assigning SUPER_ADMIN or roles higher than their own hierarchy.
 */
export function canAssignRole(actorRole: Role, roleToAssign: Role): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (roleToAssign === "SUPER_ADMIN") return false;
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[roleToAssign];
}

/**
 * Verifies that the actor has higher or equal role status than the target role.
 */
export function isHigherOrEqualRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Asserts that a role holds a permission, throwing PermissionDeniedError if not.
 */
export function assertPermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new PermissionDeniedError(role, permission);
  }
}

/**
 * Asserts role assignment compliance with permission ceiling rules.
 */
export function assertRoleAssignment(actorRole: Role, targetRoleToAssign: Role): void {
  if (!canAssignRole(actorRole, targetRoleToAssign)) {
    throw new Error(`Role ${actorRole} cannot assign higher privilege role ${targetRoleToAssign}`);
  }
}

export class PermissionDeniedError extends Error {
  constructor(public role: Role, public permission: Permission) {
    super(`Role ${role} does not hold permission "${permission}"`);
    this.name = "PermissionDeniedError";
  }
}
