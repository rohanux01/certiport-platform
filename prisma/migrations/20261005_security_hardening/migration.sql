-- Migration: Security Hardening - Audit Log Immutability & PostgreSQL Row Level Security (RLS)
-- Enforces SRS requirements for tamper-proof audit trails and DB-level tenant isolation.

-- 1. Database-Level AuditLog Immutability
-- Prevent any UPDATE or DELETE operations on the AuditLog table
REVOKE UPDATE, DELETE ON "AuditLog" FROM PUBLIC;

-- 2. PostgreSQL Row-Level Security (RLS) Policies for Multi-Tenancy
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Certificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CardRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-run
DROP POLICY IF EXISTS user_tenant_isolation_policy ON "User";
DROP POLICY IF EXISTS certificate_tenant_isolation_policy ON "Certificate";
DROP POLICY IF EXISTS card_request_tenant_isolation_policy ON "CardRequest";
DROP POLICY IF EXISTS template_tenant_isolation_policy ON "Template";
DROP POLICY IF EXISTS audit_log_tenant_isolation_policy ON "AuditLog";

-- Multi-Tenant Isolation RLS Policies
CREATE POLICY user_tenant_isolation_policy ON "User"
  FOR ALL
  USING (
    current_setting('app.current_organization_id', true) IS NULL
    OR current_setting('app.current_organization_id', true) = ''
    OR "organizationId" = current_setting('app.current_organization_id', true)
  );

CREATE POLICY certificate_tenant_isolation_policy ON "Certificate"
  FOR ALL
  USING (
    current_setting('app.current_organization_id', true) IS NULL
    OR current_setting('app.current_organization_id', true) = ''
    OR "organizationId" = current_setting('app.current_organization_id', true)
  );

CREATE POLICY card_request_tenant_isolation_policy ON "CardRequest"
  FOR ALL
  USING (
    current_setting('app.current_organization_id', true) IS NULL
    OR current_setting('app.current_organization_id', true) = ''
    OR "organizationId" = current_setting('app.current_organization_id', true)
  );

CREATE POLICY template_tenant_isolation_policy ON "Template"
  FOR ALL
  USING (
    current_setting('app.current_organization_id', true) IS NULL
    OR current_setting('app.current_organization_id', true) = ''
    OR "organizationId" = current_setting('app.current_organization_id', true)
  );

CREATE POLICY audit_log_tenant_isolation_policy ON "AuditLog"
  FOR ALL
  USING (
    current_setting('app.current_organization_id', true) IS NULL
    OR current_setting('app.current_organization_id', true) = ''
    OR "organizationId" = current_setting('app.current_organization_id', true)
  );
