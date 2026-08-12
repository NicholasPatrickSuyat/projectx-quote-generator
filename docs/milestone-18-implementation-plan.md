# Milestone 18 — Production Authentication + Server Authorization

**Status:** IMPLEMENTATION COMPLETE — awaiting Nicholas approval (no commit / push / deploy / Vercel cutover)  
**Title:** Production Authentication + Server Authorization  
**Upstream:** Milestone 17 (`fc5b7c204ce538cd1a284dd9a45d32f05689cef6`)  
**Baseline:** `fc5b7c204ce538cd1a284dd9a45d32f05689cef6`  
**Production URL:** https://projectx-quote-generator.vercel.app/

**Standing constraints until cutover approval:**

- Do not modify Vercel production configuration  
- Public production remains `AUTH_MODE=demo` + `PERSISTENCE_MODE=session`  
- Do not commit / push / deploy without Nicholas’s approval  
- Do not start M19  

---

## Final approved decisions (A1–A14)

| ID | Decision | Status |
|----|----------|--------|
| **A1** | Auth.js Credentials + Neon + bcryptjs | APPROVED |
| **A2** | bcryptjs; target cost **12**; report if login latency forces change; never plaintext | APPROVED |
| **A3** | Admin create/reset passwords; defer email reset / forgot-password / forced change; no email infra | APPROVED |
| **A4** | One-time CLI bootstrap for first Admin; no default password in Git; never print password; refuse second bootstrap when users exist | APPROVED |
| **A5** | Temporary `AUTH_MODE=demo \| production` cutover; demo preserves M13 DEMO-ONLY; demo must not authorize durable DB writes; production = Auth.js + DB users; remove demo after successful cutover | **ADJUSTED / APPROVED** |
| **A6** | JWT sessions + DB re-check on privileged actions; deny inactive; office-appropriate expiry | APPROVED |
| **A7** | `app_users` table; email normalize + case-insensitive uniqueness; profile_picture nullable without upload UX | APPROVED |
| **A8** | Single `capabilitiesForRole` matrix; server never trusts client role/capabilities | APPROVED |
| **A9** | Deliberate production DB/auth cutover; code deploy alone does not flip public demo | APPROVED |
| **A10** | No Auth.js OAuth/adapter tables | APPROVED |
| **A11** | Nullable profile_picture; no upload in M18 | APPROVED |
| **A12** | Add Zod for auth/user server validation | APPROVED |
| **A13** | One milestone, phased implementation | APPROVED |
| **A14** | `canRestore` remains Admin-only | APPROVED |

---

## AUTH_MODE rules (A5)

| Mode | Behavior |
|------|----------|
| `demo` (default if unset) | M13 demo login; DEMO-ONLY labeling; **cannot** authorize durable Settings/Catalog/Users DB mutations |
| `production` | Auth.js + `app_users`; real server authorization; requires `AUTH_SECRET` (+ DB for user/durable paths) |

- Invalid `AUTH_MODE` → **fail fast** (no silent weaker fallback)  
- `AUTH_MODE=production` missing `AUTH_SECRET` → **fail fast**  
- Not a permanent dual-auth architecture — temporary migration mechanism  

---

## Persistence interaction

| | `PERSISTENCE_MODE=session` | `PERSISTENCE_MODE=database` |
|--|----------------------------|-----------------------------|
| `AUTH_MODE=demo` | Public demo / local session regression | Reads OK for hybrid local; **writes refused** (demo cannot authorize durable mutations) |
| `AUTH_MODE=production` | Auth.js login against DB users still needs DB; prefer database mode for full path | Auth.js + capability-gated Settings/Catalog/Users mutations |

Public production until cutover: **`AUTH_MODE=demo` + `PERSISTENCE_MODE=session`**.

---

## Proposed dependency versions (verified against npm at implement start)

| Package | Version | Notes |
|---------|---------|--------|
| `next-auth` | **5.0.0-beta.32** | Peer: Next `^14 \|\| ^15 \|\| ^16`, React `^18.2 \|\| ^19` — matches Next **16.3.0** / React **19.2.8** |
| `bcryptjs` | **3.0.3** | Pure JS; ships its own types (no `@types/bcryptjs`) |
| `zod` | **4.4.3** | Server-side auth/user validation |

Existing stack unchanged: `drizzle-orm@0.45.2`, `@neondatabase/serverless@1.1.0`, `drizzle-kit@0.31.10`.

**Not adding:** Clerk, Supabase Auth, argon2, OAuth providers, email packages, `@auth/drizzle-adapter`.

---

## Phased implementation

1. Schema + Zod validation  
2. Auth.js configuration  
3. Login/logout/session + AUTH_MODE  
4. Database-backed Users  
5. Server authorization  
6. Admin bootstrap CLI  
7. Demo/production mode controls  
8. Security testing  
9. Production-cutover readiness (report only; no Vercel changes)  

---

## Server guards (required)

- `requireAuthenticatedUser()`  
- `requireActiveUser()` (DB reload + `auth_version` match)  
- `requireCapability(...)`  
- `requireAdmin()`  
- `requireDatabaseSettingsRead()` / `requireDatabaseCatalogRead()` / `requireDatabaseUsersRead()`  

Protect at minimum: Settings **read**/save; Catalog **read**/create/edit/duplicate/archive/restore; Users list/create/edit/role/active/password reset.

See [milestone-18-authorization-matrix.md](./milestone-18-authorization-matrix.md).

---

## Password rules (V1)

- Minimum **12** characters  
- No composition theater  
- Generic invalid-login message (no account enumeration)  

---

## Session

- Auth.js JWT; httpOnly cookie  
- Max age: **7 days** (office app)  
- `auth_version` on `app_users` embedded in JWT; re-checked in `jwt` callback (~30s throttle on session access)  
- Privileged actions: reload user from DB; check `active`, role, `company_id`, `auth_version`; derive capabilities server-side  
- Password reset / role change / deactivation bump `auth_version` (reactivation does not revive old JWTs)  

---

## Schema (`app_users`)

`id`, `company_id` FK RESTRICT, `full_name`, `email` (normalized), `password_hash`, `role`, `active`, `auth_version`, `profile_picture` nullable, `created_at`, `updated_at`  
Unique: case-insensitive email per company (unique index on `company_id, lower(email)`).

Migrations: `0001_app_users_auth.sql`, `0002_app_users_auth_version.sql` (do not apply on public production without cutover approval).

---

## Rate limiting / brute-force

**PRODUCTION CUTOVER BLOCKER / deferred to M20 hardening.**  
No fake in-memory limiter. Docs must not claim brute-force protection until an approved serverless-safe or infrastructure solution ships.

---

## Out of scope

M19 customers/quotes; email reset; OAuth; public signup; Vercel prod cutover without approval; removing demo before cutover verification; login rate limiting (cutover blocker).
