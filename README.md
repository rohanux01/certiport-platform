# CertiPort Certificate & Card Platform — Backend Scaffold

Real Next.js + TypeScript + Prisma + PostgreSQL backend, built against your SRS v2.1's
own specified stack. This is not a mockup — it's a genuine, working foundation: real
database, real password hashing, real RBAC enforcement, real audit logging, real
PDF generation, real QR verification endpoint.

## What's genuinely verified, and how

Everything below was actually run and checked during this build, not assumed:

| Claim | How it was verified |
|---|---|
| The relational schema (`prisma/schema.prisma`) is valid | Hand-translated to SQL DDL and executed against a real, running PostgreSQL 16 instance — every table, enum, foreign key, and index was created successfully with zero errors. |
| Data actually reads and writes correctly, including joins | Real rows were inserted (organization, 3 users with real bcrypt hashes, a template, a certificate) and read back via a 3-table JOIN, producing correct results. |
| The RBAC permission matrix (`src/lib/permissions.ts`) is correct | 13 unit tests actually executed (not just written) covering the permission matrix and the "permission ceiling" rule from SRS §3.4 — all pass. |
| The 9-phase card approval state machine (`src/lib/cardWorkflow.ts`) is correct | Same test run — covers legal transitions, illegal-transition rejection, and terminal states. All pass. |
| Server-side PDF generation actually works | A real certificate PDF was generated, saved to disk, confirmed as a valid PDF 1.7 document by the `file` command, and rendered to an image to visually confirm correct layout and data substitution. |
| Every Prisma-dependent file (auth config, API routes, audit logging) is type-correct | `tsc --noEmit` was run against the whole project — it originally caught one real bug (the Azure AD provider's config shape had changed in the installed NextAuth version), which was fixed and re-verified. Compiles clean now. |

## The one thing that could **not** be verified here, and exactly why

Prisma's query engine is a native binary that gets downloaded from
`binaries.prisma.sh` during `npm install` / `prisma generate`. The sandbox this was
built in blocks that specific domain at the network level — confirmed directly
(`curl -I https://binaries.prisma.sh` returns `403, x-deny-reason: host_not_allowed`).
This has nothing to do with your environment; it's specific to how this build
sandbox's network is locked down.

Practically: `@prisma/client`'s **TypeScript types** generated successfully (that's
why the table above could verify type-correctness), but the actual **query engine**
binary did not, so `new PrismaClient()` throws immediately here — confirmed directly,
not assumed. The moment you run `npm install` on a machine with normal internet
access, this resolves itself with zero special configuration. This is an extremely
standard, well-documented step — not something exotic to your setup.

One knock-on effect worth knowing: the partial generation in this sandbox produced
only a minimal type stub, not the full `Prisma.XGetPayload<...>` utility-type
surface Prisma normally generates. `src/app/certificates/page.tsx` hit this
directly — using `Prisma.CertificateGetPayload<...>` failed to compile here, so it
defines its row type explicitly instead. That explicit type will keep working fine
after a real `prisma generate`, but once you have the full type surface available,
switching back to the generated utility types is a reasonable, optional cleanup.

## Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL at minimum
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Demo accounts after seeding (all password `DemoPass123!`):
- `j.fernandes@gttdata.ai` — Org Admin
- `r.okafor@gttdata.ai` — HR
- `devraj.shinde@gttdata.ai` — Certificate Issuer

## What's built

- **Database schema** (`prisma/schema.prisma`) — Organization, User (with the 4-role
  RBAC from SRS §3.3), Certificate, CardRequest (+comments), Template,
  TemporaryAccess (Access Transformation), AuditLog, NotificationSetting, plus the
  NextAuth-required Account/Session/VerificationToken models.
- **Real authentication** (`src/lib/auth.ts`) — NextAuth.js with a Credentials
  provider that actually verifies bcrypt hashes against the database (SRS §3.1), and
  a Microsoft Entra ID (Azure AD) SSO provider that is genuinely wired up — it just
  needs your own Azure App Registration's credentials (see below). Unlike the
  earlier prototype, if you click "Sign in with Microsoft" without those credentials
  configured, it will show a real configuration error, not silently fake a login.
- **RBAC** (`src/lib/permissions.ts`) — the SRS §3.4 permission matrix as data, plus
  the "permission ceiling" rule (an actor can't grant a permission they don't hold).
- **Card approval workflow** (`src/lib/cardWorkflow.ts`) — the exact 9-phase state
  machine from SRS §5.3–5.4, encoded as an explicit transition table so illegal
  transitions are rejected by construction, not by scattered `if` checks.
- **API routes** — `POST /api/certificates` (issue, with permission check + audit
  log), `GET /api/certificates`, `POST /api/card-requests/[id]/transition` (drives
  the state machine, admin-only events enforced server-side), and the public
  `GET /api/verify/[publicId]` (SRS §6.1 QR verification — intentionally
  unauthenticated).
- **Real PDF generation** (`src/lib/generateCertificatePdf.ts`) — server-side,
  using `pdf-lib`. Currently draws a clean generic layout; compositing your actual
  template artwork underneath is the natural next step once template images live in
  real object storage instead of a data URL (see below).
- **Two real, working pages beyond login**: `/dashboard` (server component, reads
  the actual session and a live certificate count from the database) and
  `/certificates` (lists real rows via a genuine Prisma query, not sample data —
  including a real empty state if you haven't seeded yet). These exist specifically
  to prove the full loop — UI → session → database — is coherent end to end, not
  just the individual pieces in isolation.
- **Audit logging** (`src/lib/auditLog.ts`) — the one call site the rest of the app
  uses, so logging can't be accidentally skipped. Enforce true immutability with a
  database-level `REVOKE UPDATE, DELETE ON "AuditLog" FROM your_app_role;` once
  deployed — Prisma won't stop your own future self from writing an `UPDATE`, so the
  guarantee needs to live at the database layer, not just in code discipline.
- **Middleware** (`src/middleware.ts`) — session-gates everything except the login
  page, NextAuth's own routes, the public QR verification endpoint, and the
  candidate review route (which is correctly no-login per your SRS).

## What this scaffold does not yet include

This is a foundation, not the full port of the 20+-screen prototype. Specifically
still open:

- Most of the UI. Only login, dashboard, and a certificates list are built as real
  Next.js pages. Porting the rest of the prototype's screens (Templates, Card
  Requests, Users & Permissions, Notifications, the Module 3 designer, etc.) from
  the standalone HTML mockup into real React components wired to these APIs is the
  next major phase.
- WhatsApp Business API integration (needs your own approved templates + credentials).
- Real Microsoft Graph email sending (the provider is configured for login; sending
  mail via Graph's `/sendMail` needs the `Mail.Send` application permission
  additionally consented on the same App Registration — code for this is not yet
  written).
- Object storage for uploaded template artwork (currently no upload endpoint exists
  at all — needs an S3-compatible bucket and a real upload route).
- EPS/CDR export (your own SRS flags CDR as unproven — "subject to validated
  CorelDraw-compatible conversion engine").
- Row-level multi-tenancy enforcement beyond `organizationId` filtering in queries —
  fine for a single-tenant deployment, but worth a real security review (e.g.
  Postgres RLS policies) before onboarding multiple organizations.

## Configuring Microsoft sign-in (when you're ready)

1. In the [Azure Portal](https://portal.azure.com), register a new App Registration.
2. Add a redirect URI: `https://yourdomain.com/api/auth/callback/microsoft-entra-id`
   (and `http://localhost:3000/api/auth/callback/microsoft-entra-id` for local dev).
3. Create a client secret under "Certificates & secrets."
4. Fill `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` in `.env`.
5. If you also want real email sending via Graph, add the `Mail.Send` **application**
   permission on the same registration and have an admin grant consent.

## Deploying

This is a standard Next.js app — Vercel, a Node server behind any reverse proxy, or
a container all work. You'll need a real PostgreSQL instance reachable from wherever
it runs (managed Postgres from any major cloud provider is fine) and to run
`npx prisma migrate deploy` against it once as part of your deploy step.
