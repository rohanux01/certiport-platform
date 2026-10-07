<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project brief: CertiPort Certificate & Card Platform

Read this before touching code. It's the fast path to the same context a prior
build session already has — skip it and you'll rediscover the schema and
workflow rules the slow way, and likely violate one of them.

## What this is

A backend scaffold (Next.js 15 App Router + TypeScript + Prisma + PostgreSQL +
NextAuth v5) for a multi-tenant certificate-and-ID-card issuance platform,
built against a supplied SRS v2.1 document. It is a **real, working
foundation**, not a mockup: real bcrypt-hashed auth, real RBAC enforcement,
real Postgres schema, real PDF generation, real audit logging. It is **not**
feature-complete — see "What's not built yet" below and `README.md`'s longer
version before assuming a screen exists.

A separate, older deliverable — a single-file HTML/CSS/JS interactive mockup
of ~20 screens (`cert-platform-admin-dashboard.html`, not in this repo) —
covers the full intended UI surface. Porting those screens into real React
pages wired to this backend's API routes is the main remaining work. Don't
rebuild that UI from scratch; the visual/interaction design was already
worked out there.

## Domain rules that are load-bearing — do not casually change

- **RBAC** (`src/lib/permissions.ts`): 4 roles — `SUPER_ADMIN` (cross-tenant),
  `ORG_ADMIN`, `CERT_ISSUER`, `HR`. Permissions are a data table (`MATRIX`),
  checked via `can(role, permission)`. There is also a **permission-ceiling
  rule** (`canGrant`): an actor can never grant a permission it doesn't itself
  hold. Any new permission-gated route must call `can()`/`assertPermission()`
  — don't inline ad-hoc role checks.
- **Card approval workflow** (`src/lib/cardWorkflow.ts`): a 9-status finite
  state machine (`CardRequestStatus`) driven by 8 named events, encoded as an
  explicit `TRANSITIONS` table. `nextCardStatus(current, event)` throws
  `InvalidCardTransitionError` on an illegal transition — that's intentional;
  don't add a bypass. `ADMIN_APPROVE` / `ADMIN_REQUEST_CHANGES` / `FINALIZE`
  are admin-only events (enforced in the transition API route via `can()`).
- **Audit logging** (`src/lib/auditLog.ts`): `logAudit()` is the single
  enforced call site. Any new mutating action (issue, approve, revoke, etc.)
  must call it — that's how the "every action is logged" SRS requirement is
  actually satisfied. True immutability is a DB-level `REVOKE UPDATE, DELETE`
  grant that has NOT been applied anywhere yet — do that before real
  deployment, not just in code review.
- **Multi-tenancy**: enforced only via `organizationId` filtering in queries
  right now. There is no Postgres row-level security. Fine for single-tenant
  use; flag it if asked to onboard multiple orgs.

## Known, deliberate compromises (don't "fix" these without asking)

- `src/app/certificates/page.tsx` defines `CertificateWithTemplate` as a
  hand-written type instead of `Prisma.CertificateGetPayload<...>`. This was
  forced by a sandbox that couldn't reach `binaries.prisma.sh` to fully
  generate the Prisma client's utility-type surface. **On your machine, with
  a normal `npx prisma generate`, the generated utility types will be fully
  available** — switching back is a reasonable optional cleanup, not a bug
  that needs a workaround preserved.
- The Microsoft Entra ID (Azure AD) OAuth provider in `src/lib/auth.ts` is
  wired correctly (`issuer: https://login.microsoftonline.com/${tenantId}/v2.0`,
  the modern `MicrosoftEntraID` provider — not the deprecated `AzureAD` one)
  but has no real App Registration behind it yet. It will show a real config
  error until `.env` has real `AZURE_AD_CLIENT_ID/SECRET/TENANT_ID` — see
  README "Configuring Microsoft sign-in."
- `generateCertificatePdf.ts` draws a clean generic layout via `pdf-lib`. It
  does not yet composite the actual uploaded template artwork underneath —
  that needs an object-storage upload route first (also not built).

## What's not built yet (don't assume it exists)

Only `/login`, `/dashboard`, and `/certificates` are real pages. Templates,
Card Requests, Users & Permissions, Notifications, and the Module 3
canvas-style card designer all exist only in the old HTML mockup, not here.
No file-upload/object-storage route, no WhatsApp integration, no real
Microsoft Graph email sending (only login uses Graph so far), no EPS/CDR
export. Full list with reasoning: `README.md`.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Demo logins after seeding (password `DemoPass123!` for all):
`j.fernandes@gttdata.ai` (Org Admin), `r.okafor@gttdata.ai` (HR),
`devraj.shinde@gttdata.ai` (Cert Issuer).

Full architecture, verified-vs-assumed claims, and deploy notes: `README.md`.
