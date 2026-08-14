# Milestone 20 — Production Hardening, Cutover & First-Client Release

**Status:** GATE 1 HARDENING IN PROGRESS — Gate 2 cutover NOT authorized  
**Product:** Quote Generator Pro  
**Baseline:** Milestone 19 closed on `main`  
**HEAD / origin/main:** `462f70be27b4e64f3cc137f0ce192bb524c048a2`  
**Production URL:** https://projectx-quote-generator.vercel.app  

**Current public production (verified):**

| Setting | Value |
|---------|--------|
| `AUTH_MODE` | `demo` |
| `PERSISTENCE_MODE` | `session` |
| Neon / Auth.js cutover | **Not performed** |

### Final approved decisions (A–L) — Gate 1 authorized

| ID | Decision |
|----|----------|
| **A** | Neon-backed rate limit; enforce **email (~5/15m)** and **trusted IP (~20/15m)**; no in-memory; enumeration-safe; fail closed on limiter errors |
| **B** | Separate Neon project per real client; never promote M17–M19 non-prod DB |
| **C** | Keep `projectx-quote-generator.vercel.app` as sales demo (`demo`+`session`) |
| **D** | Isolated client infra; client-owned **or** Project-X-managed; not multi-tenant |
| **E** | Empty Catalog by default; no auto HVAC/demo seed; no fake Customers/Quotes |
| **F** | Vercel logs only; no Sentry in M20 |
| **G** | Neon native recovery/PITR **as verified on the selected plan at cutover**; git migrations; recovery drill; stop if inadequate |
| **H** | Keep demo mode in codebase for sales demo; client prod must fail closed (no demo/session fallback) |
| **I** | M20 merge ≠ cutover; Gate 2 needs separate approval |
| **J** | Client custom domain supported; may verify on `*.vercel.app` first |
| **K** | No new vendors (no Upstash/Sentry/object storage/WAF) unless forced to STOP and ask |
| **L** | One milestone, two gates: Gate 1 hardening → STOP; Gate 2 cutover only after approval |

**Gate 1 standing constraints:**

- Implement/test hardening on **non-production** infrastructure only
- Do **not** create real client Neon/Vercel projects
- Do **not** change public demo env vars or cut over
- Do **not** commit/push/deploy until Nicholas approves Gate 1 review

---

## 1. Current production architecture

### 1.1 What ships today

```
Public Vercel (projectx-quote-generator)
  AUTH_MODE=demo
  PERSISTENCE_MODE=session
  └─ Demo auth (browser credentials) + in-memory session stores
       Customers / Quotes / Settings / Catalog / Users (demo personas)
```

### 1.2 What exists in code but is not public-cutover-enabled

| Layer | Status |
|-------|--------|
| Neon schema migrations `0000`–`0005` | Applied on **non-production** Neon only |
| Settings + Catalog DB repos (M17) | Ready under `PERSISTENCE_MODE=database` |
| Auth.js Credentials + `app_users` (M18) | Ready under `AUTH_MODE=production` |
| Customers / Quotes / lines / `pdf_snapshot` (M19) | Ready under database + production auth |
| Server authorization matrix | Enforced on Server Actions when production+database |
| Session/demo façades | Still present for sales demo + local regression |
| Login rate limiting | **Not implemented** (explicit cutover blocker) |

### 1.3 Mode matrix (current product truth)

| Combo | Allowed where | Behavior |
|-------|---------------|----------|
| demo + session | Public prod (today), local | Sales demo |
| demo + database | **Local `APP_ENV=development` only** | Hybrid reads; writes refused |
| production + database | Local cutover tests; **target for client prod** | Auth.js + Neon + RBAC |

### 1.4 Single-company model

One installation = one `company` row + `company_id` scoping. Not multi-tenant SaaS. Matches Spec §4.2 and M16 Decision D.

### 1.5 Already verified security foundations (M17–M19)

- Durable mutations require `AUTH_MODE=production` + active DB user + capabilities
- `auth_version` JWT invalidation on password/role/deactivate
- Last-active-Admin protection in users repository/validation
- Quote lifecycle CAS (expected prior status + archived)
- Line ownership scoped to company + quote
- Composite FKs: quotes→customers, lines→quotes (same company)
- Server-owned Mark Sent `pdf_snapshot`
- Generic create/update cannot forge lifecycle/freeze
- Prepared By normalized server-side
- Demo cannot authorize durable writes
- Demo+database refused on Vercel preview/production hosts

---

## 2. Remaining blockers (before public switch to production+database)

### HIGH — must fix before cutover

| ID | Blocker | Notes |
|----|---------|-------|
| **H1** | Login rate limiting | Explicit M18 deferral; no in-memory limiter on Vercel |
| **H2** | Dedicated production Neon (empty) | Current non-prod Neon has verify/seed/probe residue — never promote it as client DB |
| **H3** | Production secrets on target deploy | `AUTH_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_ENV=production`, `AUTH_MODE=production`, `PERSISTENCE_MODE=database` |
| **H4** | Production migrate `0000`–`0005` on empty DB | Forward-only; verify journal |
| **H5** | Company + Settings bootstrap | Empty Settings row; real client company name |
| **H6** | First Admin bootstrap | CLI; no Git password; refuse if users exist |
| **H7** | Zero fake Customers/Quotes/Catalog on client DB | No auto-seed; refuse production seeds |
| **H8** | Cutover runbook + go/no-go | Env flip is deliberate ops, not “merge = cutover” |
| **H9** | Rollback plan rehearsed | Revert deploy/env without destroying Neon if possible |
| **H10** | Client production must not show demo credentials / demo auth | Login UX + `AUTH_MODE=production` |

### MEDIUM — strongly recommended before first client

| ID | Item | Notes |
|----|------|-------|
| **M1** | Neon PITR / restore understanding | Document restore path; one recovery drill |
| **M2** | Sales demo separated from client prod | Separate Vercel project/deployment |
| **M3** | Production UX cleanup | Remove demo-facing copy on client deploy; hide hybrid notices when N/A |
| **M4** | Ops checklist for Admin create Staff | Password handoff procedure |
| **M5** | Migration failure / failed deploy procedure | Who runs `db:migrate`; what blocks traffic |
| **M6** | Connection / Pooler awareness | Use pooled `DATABASE_URL` for app; unpooled for migrate |
| **M7** | Logo / snapshot size awareness | 512 KB logo cap already; document JSONB growth |
| **M8** | Disable or gate non-prod probes | `M18_AUTH_PROBE` / `M19_AUTH_PROBE` must stay off in client prod |
| **M9** | Basic monitoring via Vercel | Deployment + runtime log watch for first week |

### LOW — post-launch acceptable

| ID | Item |
|----|------|
| **L1** | Email forgot-password / self-service reset |
| **L2** | External error service (Sentry, etc.) |
| **L3** | Object storage for logos/PDFs |
| **L4** | Multi-tenant SaaS / RLS |
| **L5** | Full audit trail |
| **L6** | Retire session/demo code from the monorepo (keep while sales demo exists) |
| **L7** | Pagination for large quote volumes |
| **L8** | Advanced WAF / bot management beyond app rate limit |

---

## 3. Rate-limit recommendation (APPROVED — Gate 1)

### Final design (A adjusted)

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| Storage | Neon `login_rate_limits` | Serverless-safe; no new vendor |
| Window | **15 minutes** | Office-scale brute-force friction without long lockouts |
| Account (email) | **5** failures / window | Stops password spraying on one mailbox |
| IP | **20** failures / window | Stops distributed/unknown-email floods from one source |
| Email key | SHA-256 of normalized email | Avoid storing raw email in limiter table |
| IP key | Canonical IP string when trusted | Only when Vercel (or local-dev test) provides trustworthy forwarding |
| Success | Reset **email** row only | No permanent lock; IP window left for flood detection |
| Failure / unknown user | Increment email + IP (if present) | Same path → enumeration-safe |
| Limiter DB error | **Deny login** (fail closed) | Prefer outage over open brute-force |
| Cleanup | Lazy delete rows idle **> 24h** on each limiter write | Bounds table growth |
| Trust | On Vercel: first `x-forwarded-for` hop / `x-vercel-forwarded-for`. Off Vercel production: do **not** trust client-spoofable headers (local `APP_ENV=development` may use them for tests) |

Auth.js `authorize(credentials, request)` receives the original `Request` — IP is read from that request’s headers only under the trust rules above.

---

## 4. Production database strategy

### Recommendation: **Separate Neon project for first client production**

| Approach | Verdict |
|----------|---------|
| Same Neon project, production branch | Acceptable if branch is empty and isolated; easier for Project X ops |
| **Separate Neon project** | **Preferred for first paying client** — cleaner credential handoff, no test-data contamination, clear billing boundary |

**Never** point client production at the existing non-prod Neon that ran M17–M19 seeds/probes.

### Cutover DB sequence (logical)

1. Create client Neon project (or empty production branch)
2. Set `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED`
3. `drizzle-kit migrate` → `0000`–`0005`
4. `db:bootstrap:company` (real name)
5. `db:bootstrap:admin` (interactive password preferred)
6. Verify: one company, one settings row, one Admin, **zero** customers/quotes, catalog empty (unless onboarding chose otherwise)
7. Do **not** run demo/customer seed scripts against this DB

---

## 5. Production environment strategy

### Required Vercel env (client production project)

| Variable | Value |
|----------|--------|
| `APP_ENV` | `production` |
| `AUTH_MODE` | `production` |
| `PERSISTENCE_MODE` | `database` |
| `AUTH_SECRET` | Strong random; never commit |
| `DATABASE_URL` | Neon pooled |
| `DATABASE_URL_UNPOOLED` | Neon direct (migrate/ops) |
| `AUTH_URL` / `AUTH_TRUST_HOST` | As required by Auth.js on custom domain |

### Must remain unset / disabled

- `M18_AUTH_PROBE`, `M19_AUTH_PROBE`
- `BOOTSTRAP_ADMIN_PASSWORD` (temporary local only; never permanent Vercel env)
- Demo seed scripts as deploy hooks

### Sales demo project (separate)

| Variable | Value |
|----------|--------|
| `AUTH_MODE` | `demo` |
| `PERSISTENCE_MODE` | `session` |
| Neon | **Not required** |

---

## 6. Demo vs client deployment strategy

### Recommendation: **D / B hybrid — keep a separate public demo deployment; client gets a distinct production deployment**

| Surface | Mode | Purpose |
|---------|------|---------|
| **Sales demo** (current URL or renamed `demo.*`) | demo + session | Project X sales; fake data OK |
| **Client production** | production + database | Real business; empty start |

**Do not** destroy demo capability when cutting over a client.

**Do not** put client data on the sales demo deployment.

Codebase may retain demo+session façades while any demo deployment exists (L6).

---

## 7. First-client deployment model

### Recommendation: **one client = one Vercel project + one Neon project** (not multi-tenant SaaS)

| Concern | Recommendation |
|---------|----------------|
| Tenancy | Single company per install (already) |
| Vercel | Dedicated project (or dedicated production target) per client |
| Neon | Dedicated project per client |
| Domain | Client custom domain on client Vercel project |
| Ownership | Prefer **client-owned** accounts long-term (M16 J); Project X may set up then hand off |
| Billing | Client (or Project X interim) — document who pays Neon/Vercel |
| Backups | Neon project owner responsibility + Project X runbook during support period |
| Support | Project X application support; infra access via agreed handoff |

---

## 8. Admin bootstrap

### Keep CLI bootstrap as production approach (approved M18 A4)

1. Migrate empty DB  
2. `npm run db:bootstrap:company` with real company name  
3. `npm run db:bootstrap:admin` with **interactive password** preferred on a secure workstation  
4. Clear any temporary `BOOTSTRAP_ADMIN_*` env vars after success  
5. First login → create Staff in-app → optional Catalog setup  

**Recovery Admin:** If last Admin is locked out, recovery is **ops**: temporary break-glass via controlled DB password hash update / re-bootstrap only if zero users — document carefully. Prefer always keeping two Admins after onboarding (process, not code).

Last-active-Admin protection already exists in code — retain and test at cutover.

---

## 9. Backup strategy

### Minimum viable (first client)

| Asset | Strategy |
|-------|----------|
| Neon data | Enable / confirm Neon **history / PITR** (plan tier dependent); document restore UI steps |
| Schema | Git migrations `0000`–`0005` (+ future) are source of truth |
| Secrets | Password manager / Vercel env — not Git |
| App code | GitHub `main` + Vercel deployment history |

### Cadence / ownership

- **Continuous:** Neon PITR window (as provided by plan)  
- **Before cutover:** Snapshot / note restore point; confirm migrations applied  
- **Owner:** Neon project owner (client or Project X during setup)  
- **Recovery test:** One dry-run restore to a scratch branch/DB **before** first client go-live (or immediately after empty bootstrap, before real data)

### Additional exports

Not required for M20 if Neon PITR is available. Optional quarterly `pg_dump` later (LOW).

---

## 10. Monitoring strategy

### Recommendation: **Vercel deployment + runtime logs are enough for first client**

| Signal | Source |
|--------|--------|
| Failed deploys | Vercel / GitHub deployment status |
| Runtime 5xx | Vercel logs |
| Auth failures | App logs (avoid logging passwords / tokens) |
| DB errors | Vercel logs + Neon metrics |
| Rate-limit lockouts | DB counters / structured log line (no PII beyond email hash optional) |

**Do not add Sentry** unless first-client support proves Vercel logs insufficient (LOW / post-launch).

Watch first 7 days post-cutover manually.

---

## 11. Security hardening (planning-level threat review)

### Still a true cutover blocker

| Threat | Mitigation in M20 |
|--------|-------------------|
| Brute-force login | **H1** Neon rate limit |
| Demo auth on client prod | **H10** `AUTH_MODE=production` + UX |
| Test DB contamination | **H2/H7** fresh Neon; no seeds |
| Probe endpoints | **M8** probes off |
| Secret exposure | **H3** env discipline; never commit `.env.local` |

### Already mitigated (verify at cutover; not new design)

Brute-force aside: bcrypt cost 12; Auth.js cookies; CSRF on Auth.js routes; Server Action authz; company_id from session; role/capability server-side; Prepared By; lifecycle CAS; line ownership; composite FKs; inactive + `auth_version`; last Admin; password reset bumps version; demo write refusal; demo+database host refusal; parameterized Drizzle/SQL; logo size cap 512 KB.

### Residual accepted risks (document, not block)

| Risk | Stance |
|------|--------|
| Logo in JSONB / snapshot size | Cap exists; object storage deferred |
| Admin password reset requires another Admin | Accepted V1 (no email) |
| Session JWT throttle ~30s | Privileged actions re-check immediately |
| Lifecycle TOCTOU | CAS fixed in M19 |
| SQL injection | ORM + scripts; keep discipline |

---

## 12. PDF production readiness

| Topic | Verdict |
|-------|---------|
| `pdf_snapshot` JSONB | Keep; server-owned on Mark Sent |
| Logo data URLs | Keep; **512 KB** validation already |
| Object storage | **Not required** for first client |
| Preview vs Final | Unchanged domain rules |
| Historical integrity | Frozen snapshot; settings/customer edits do not rewrite Final |
| Client generation | Browser renders PDF bytes from model/snapshot; persistence is JSON |

**Must-change before first client:** none beyond verifying Final PDF on production+database in cutover tests.

**Optional polish:** clearer error if snapshot missing on Final for corrupt rows (MEDIUM UX).

---

## 13. Production UX cleanup (client deploy only)

Material items only — no visual redesign:

- Ensure production login does **not** list demo accounts  
- Ensure “Demo authentication only” copy is absent when `AUTH_MODE=production`  
- Hybrid/database development notice must not show on client production session path (already session-hidden; confirm production+database notice is appropriate or toned for real clients)  
- Remove / avoid “Soon” placeholders in client-facing nav if any remain  
- Empty states: “No customers yet” / “Create your first quote” (business tone)  
- Branding: company Settings-driven name/logo after bootstrap  

Sales demo deployment may keep demo credentials panel.

---

## 14. Cutover checklist

### PRE-CUTOVER

- [ ] `main` clean; M20 hardening merged; tag or note commit SHA  
- [ ] Migrations `0000`–`0005` reviewed  
- [ ] Client Neon project created (empty)  
- [ ] Neon PITR/history confirmed  
- [ ] Secrets generated (`AUTH_SECRET`, DB URLs)  
- [ ] Rate limiting implemented + tested  
- [ ] Probes disabled  
- [ ] Bootstrap scripts tested on empty DB  
- [ ] Sales demo deployment still separate and healthy  
- [ ] Rollback steps written and understood  
- [ ] Client Admin contact + password handoff plan  

### CUTOVER (client project)

- [ ] Apply migrations via unpooled URL  
- [ ] Bootstrap company + Settings  
- [ ] Bootstrap first Admin (interactive)  
- [ ] Verify empty Customers/Quotes; Catalog empty or agreed starter  
- [ ] Set Vercel env: production + database + secrets  
- [ ] Deploy client production  
- [ ] Confirm deployment SHA  

### POST-CUTOVER

- [ ] Admin login  
- [ ] Staff create + login  
- [ ] Users RBAC  
- [ ] Settings save + logo  
- [ ] Catalog CRUD (Admin)  
- [ ] Customer CRUD + archive/restore (Admin restore)  
- [ ] Quote CRUD, lines, numbering uniqueness  
- [ ] Preview PDF + Final PDF + Mark Sent freeze  
- [ ] Accept / Reject / Return to Draft / Expire / Reactivate (RBAC)  
- [ ] Dashboard aggregates  
- [ ] Rate-limit test (expect lockout; no enumeration leak)  
- [ ] Inactive user denied  
- [ ] Password reset invalidates old session  
- [ ] Direct unauthorized action denied  
- [ ] Hard refresh persistence  
- [ ] Confirm demo auth API 404 on **sales** demo still works; client prod Auth.js session works  
- [ ] Confirm no demo credential UI on client  
- [ ] Watch logs 24–72h  

---

## 15. Rollback plan

Prefer **reversible env/deploy** over destructive DB rewind when possible.

| Failure mode | Action |
|--------------|--------|
| Bad deploy, DB OK | Instant Rollback to previous Vercel deployment on **client** project |
| Bad env | Revert `AUTH_MODE`/`PERSISTENCE_MODE` only if a session demo fallback exists on that project — **prefer not** to run client project as demo; keep previous production deployment instead |
| Failed migrate mid-way | Stop traffic; fix forward with new migration; avoid editing applied history |
| Data corruption post-go-live | Neon PITR to pre-incident point; communicate data loss window |
| Auth misconfig | Rollback deploy; fix `AUTH_SECRET` / `AUTH_URL`; re-deploy |
| Need to abandon client cutover | Leave Neon intact; point DNS back to prior safe deployment; sales demo unaffected |

**Do not** migrate client data “back” into session mode.

**Sales demo** remains independent — not a rollback target for client data.

---

## 16. Sell-ready definition

| Tier | Meaning |
|------|---------|
| **Demo-ready** | **Achieved** — public demo+session sells the product |
| **First-client-ready** | M20 hardening done + empty Neon + production auth + rate limit + separate client deploy + cutover checklist passed |
| **Production-hardened** | First-client-ready + recovery drill + 7-day quiet ops + two Admins + backup ownership documented |
| **Future SaaS-ready** | Explicitly **out of scope** — multi-tenant, self-serve signup, billing, RLS |

**Sell/deploy to a real business** = **First-client-ready** (not SaaS-ready).

---

## 17. Exact M20 scope

### In scope

1. Neon-backed login rate limiting + tests  
2. Production guards / probe hardening / seed refusal review  
3. Client vs demo deployment documentation + runbooks  
4. Cutover checklist + rollback doc (this plan → ops checklist in README or `docs/cutover-runbook.md` during implementation)  
5. Minimal production UX cleanup for `AUTH_MODE=production` login  
6. Backup/monitoring documentation (no new SaaS monitors required)  
7. Security fix pass only for items discovered as true HIGH blockers  
8. **Controlled cutover operation** for first client (or Project X production target) **after** hardening ships — gated as its own approval step inside M20  

### Out of scope

- Multi-tenant SaaS  
- Email/SMS/forgot-password  
- Sentry / Upstash / object storage (unless approval changes A/K)  
- Rewriting demo out of the repo while sales demo exists  
- Broad UI redesign  
- Changing M17–M19 domain model  
- Promoting non-prod Neon to production  

---

## 18. Explicit out-of-scope (summary)

Email infra; OAuth/SSO; RLS multi-tenant; PDF file storage; automatic demo→prod data migration; in-memory rate limits; permanent `BOOTSTRAP_ADMIN_PASSWORD` in Vercel; editing old migrations; public cutover without checklist sign-off.

---

## 19. Implementation phases

| Phase | Work | Gate |
|-------|------|------|
| **P0 — Plan approval** | This document | Nicholas decisions A–L |
| **P1 — Hardening code** | Rate limit; production login UX; probe/seed guards; docs/runbook | Lint/build; local production-auth E2E |
| **P2 — Infra prep** | Client Neon empty project; secrets; migrate+bootstrap dry-run | Empty DB verified |
| **P3 — Deploy hardening** | Ship M20 code to **sales demo** without flipping demo modes; optionally preview client project | Demo still demo+session |
| **P4 — Cutover (separate approval)** | Client env → production+database; deploy; checklist | Explicit Nicholas go-ahead |
| **P5 — Stabilize** | 7-day watch; recovery note; handoff doc | First-client-ready declaration |

**M20 can be one milestone** if P4 cutover remains an **explicit sub-approval** after P1–P3. Do not auto-cutover on merge.

---

## 20. Testing plan

- Unit/integration: rate-limit windows, lockout, enumeration-safe messages  
- Local: `AUTH_MODE=production` + database against **scratch** Neon  
- Replay M18/M19 auth + forgery probes (probes enabled only locally)  
- Cutover dry-run on empty DB  
- Post-cutover checklist (§14)  
- Confirm sales demo deployment unaffected  

---

## 21. Success criteria

1. Rate limiting live and tested on production auth path  
2. Client production runs `AUTH_MODE=production` + `PERSISTENCE_MODE=database`  
3. Sales demo remains usable on demo+session  
4. Empty client DB bootstrap path documented and executed  
5. Admin/Staff/PDF/lifecycle/RBAC checklist green  
6. Rollback path understood  
7. No secrets in Git; probes off  
8. Nicholas signs **First-client-ready**

---

## 22. Expected dependencies / services

| Service | Role |
|---------|------|
| Neon | Client DB + rate-limit storage |
| Vercel | Client + demo deployments |
| Auth.js / bcryptjs / Drizzle | Existing |
| **New packages** | Prefer **none**; rate limit can be SQL-only |

If a tiny helper is needed later, justify in implementation approval — default is **no new vendors**.

---

## 23. Files / modules likely affected (implementation)

| Area | Likely touch |
|------|----------------|
| Auth login | `src/auth.ts`, credentials authorize path |
| Rate limit | New `login_attempts` schema + migration `0006_*`; small lib |
| Login UI | `src/components/auth/login-form.tsx` |
| Docs | README status; auth matrix; cutover runbook |
| Scripts | Bootstrap/refusal comments; optional cutover verify script |
| Env example | Document new vars (no secrets) |

---

## 24. Risks

| Risk | Mitigation |
|------|------------|
| Cutting over shared Neon with test data | Separate client Neon |
| Demo broken by production-only codepaths | Keep mode switches; test demo deploy |
| Lockout of sole Admin via rate limit + typo | Clear cooldown; ops unlock via DB; create second Admin early |
| Env flip on wrong Vercel project | Checklist names project; separate demo project |
| Underestimating logo/snapshot size | Existing 512 KB cap; monitor |
| Treating merge as cutover | P4 explicit approval |

---

## 25. Decisions requiring approval

See final decision table **A–L** in the planning report (same recommendations as below).

| ID | Topic | Recommendation |
|----|-------|----------------|
| **A** | Rate limiter | Neon-backed attempts table |
| **B** | Production Neon layout | Separate Neon project per client |
| **C** | Demo vs client | Separate demo deployment; client production distinct |
| **D** | Infra ownership | Client-owned long-term; Project X may set up |
| **E** | Catalog bootstrap | Empty by default; optional explicit seed only on request |
| **F** | Monitoring | Vercel logs only for first client |
| **G** | Backups | Neon PITR/history + git migrations + one recovery drill |
| **H** | Demo auth retirement | Retire on **client** prod only; keep for sales demo |
| **I** | Cutover timing | After M20 hardening; separate go-ahead |
| **J** | Domain | Client custom domain on client Vercel project |
| **K** | External deps | No new vendors for M20 default |
| **L** | M20 scope | One milestone; cutover gated sub-phase |

---

## Appendix — Catalog starter (Decision E detail)

| Option | Notes |
|--------|-------|
| A. Empty Catalog | **Recommended default** for real client |
| B. Generic HVAC starter | Only if client is HVAC and requests it |
| C. Optional explicit seed command | Keep non-prod refusal; allow **opt-in** named seed for onboarding |
| D. Manual onboarding entry | Always available |

**Recommendation:** **A + C** — empty start; optional explicit seed when client asks; never auto-seed production.

---

*End of Milestone 20 planning document.*
