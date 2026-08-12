# Milestone 16 — Production Architecture Planning

**Status:** **CLOSED — planning complete** (approved decisions recorded)  
**Milestone theme:** Production Architecture Planning (**planning only — no implementation**)  
**Baseline (production):** `62973868abb3171c4318b976ae453b6a76ae4e64` (Milestone 15)  
**Production URL:** https://projectx-quote-generator.vercel.app/  
**Product status:** **DEMO-COMPLETE V1** (session architecture) — **not** production-ready  

**This milestone does not implement a database, auth libraries, env configuration, or service accounts.**

---

## Approved decisions (final)

| ID | Topic | Decision |
|----|-------|----------|
| **A** | Architecture | **Staged** production migration (no big bang) |
| **B** | Database | **Neon Postgres** |
| **C** | Authentication | **Auth.js Credentials** direction — implement in **M18**, not M16/M17 |
| **D** | Tenancy | **Single company per installation**; no multi-tenant SaaS / RLS. Lightweight `company_id` may be evaluated in schema design if it prevents painful future migration |
| **E** | Sequence | See staged roadmap below |
| **F** | PDF storage | Keep **frozen PDF snapshot as structured quote data**; **no** generated PDF file storage yet |
| **G** | Seed | Demo/dev seed only; **production starts empty** of fake customers/quotes/catalog |
| **H** | Admin bootstrap | One-time secure bootstrap (**design before implement**); **never** commit production credentials |
| **I** | Environments | Separate **dev / preview / production** behavior; design Neon branching workflow before automating |
| **J** | Ownership | Prefer **long-term client-owned** infra; Project X may configure initially with handoff docs |
| **K** | Dependencies | **In principle only** — install nothing in M16. M17 may add Neon connectivity + **one** ORM/migration tool. Auth.js + hashing deferred to **M18** |

---

## Staged production roadmap (approved numbering)

| Milestone | Name | Nature |
|-----------|------|--------|
| **M16** | Production Architecture Planning | **This document — closed** |
| **M17** | Production Persistence Foundation | Neon + ORM; durable Settings + Catalog; hybrid with session Customers/Quotes |
| **M18** | Production Authentication + Server Authorization | Auth.js Credentials; server RBAC; replace DEMO-ONLY auth |
| **M19** | Customers + Quotes + PDF Snapshot Persistence | Migrate remaining session stores; tear down demo data plane |
| **M20** | Production Hardening / First-Client Release | **Only if required** after M19 review — not assumed mandatory |

---

## 1. Current architecture (baseline — post M15)

### Runtime topology

```
Root layout
  └─ DemoAuthSessionProvider          (users + plaintext demo credentials + currentUser)
       └─ (app) layout
            └─ SessionProviders
                 ├─ CompanySettingsSessionProvider   → in-memory (reseeds)
                 ├─ CustomerSessionProvider          → in-memory + QuoteSession aggregates
                 ├─ CatalogSessionProvider           → in-memory (reseeds)
                 └─ QuoteSessionProvider             → in-memory; PDF freeze; Sent-only expire
```

### Where data lives

| Domain | Storage today |
|--------|----------------|
| Auth user id | `sessionStorage` key `qg-demo-auth-user-id` |
| Users / passwords | React memory + plaintext credential map (DEMO-ONLY) |
| Customers / aggregates | Memory; aggregates from QuoteSession |
| Quotes / PDF snapshots | Memory (`pdfSnapshot` JSON on quote) |
| Catalog / Settings | Memory; seed on mount |
| RBAC | Client `capabilitiesForRole` + provider gates |

**No database. No server mutations. Not production-secure.**

---

## 2. Production-readiness definition (approved framing)

### Required before a real client uses the app

Durable Postgres data; real auth (hashed secrets + secure cookies); server-side authorization; inactive-user lockout; last-Admin protection; soft archive/restore; PDF snapshot integrity; settings/logo persistence; secrets outside git; Vercel + migrations; **empty** production bootstrap (no demo personas); basic error visibility.

### Strongly recommended soon after launch

Backups/PITR; structured logging; password reset / Admin set-password; preview DB branches; login rate limiting; export/backup story.

### Optional / later

Multi-tenant SaaS; PDF object storage; email/SMS; full audit trail; edit locking; SSO.

### Non-goal

Do **not** overengineer multi-tenant SaaS for V1 (Spec §4.2: one company per installation).

---

## 3. Architecture options (summary) → choice

| Option | Verdict |
|--------|---------|
| A. Supabase full stack | Strong runner-up; Admin password UX less natural |
| **B. Neon + Auth.js** | **Approved direction** |
| C. Neon + Clerk | Overkill for small office staff |
| D. Supabase DB + external auth | Extra vendor; not needed |
| Stay session-only | Rejected for real clients |

**Approved stack:** Neon Postgres + Auth.js Credentials (Auth in **M18**) + Next.js / Vercel.

---

## 4. Database strategy (planning-level)

Eventual core entities: `company`, `company_settings`, `users`, `customers`, `catalog_items`, `quotes`, `quote_line_items`, with PDF freeze as JSON on quote.

- Soft archive via flags / timestamps  
- Aggregates computed from quotes (M15 rule)  
- Migrations versioned in-repo  
- Exact phased schema owned by **M17+ plans**

**M17 refinement (approved):** create only tables that M17 wires (`company`, `company_settings`, `catalog_items`). Users / customers / quotes tables arrive in **M18/M19** migrations — do not lock unused entity schemas early.

**`company_id`:** Lightweight FK for ownership; no RLS / multi-tenant SaaS.

---

## 5. Provider migration strategy (approved direction)

| Provider | Target milestone |
|----------|------------------|
| Settings + Catalog session → durable façades | **M17** |
| DemoAuth → Auth.js | **M18** |
| Customers + Quotes (+ PDF JSON) | **M19** |

Preserve UI contracts / hook names where practical. No Design System rewrite.

---

## 6. Authentication strategy (direction only)

- Auth.js Credentials + password hashing in **M18**
- DEMO-ONLY auth remains through M17
- Bootstrap Admin: one-time secure mechanism; design before implement; never commit production passwords

---

## 7. Server authorization strategy (direction only)

Central `capabilitiesForRole` enforced on **server** starting with durable mutations in M17 (defense-in-depth; full trust boundary in M18 when sessions are real).

---

## 8. Seed / bootstrap (approved)

| Env | Behavior |
|-----|----------|
| Dev/demo | Explicit demo seed scripts only |
| Production | Empty operational data + controlled bootstrap |

Never auto-seed production with HVAC demo customers/quotes/catalog.

---

## 9. PDF (approved)

Keep client `@react-pdf/renderer` + frozen snapshot JSON on quote. No file storage until a later explicit need.

---

## 10. Environments / ownership (approved direction)

Separate dev / preview / production. Neon branching optional after workflow design. Prefer client-owned Vercel + Neon long-term; Project X may set up initially with handoff documentation.

---

## 11. Security risks (current demo — acknowledged)

Plaintext demo passwords; client-only RBAC; sessionStorage auth id; in-memory mutations; risk of demo seed in prod if misconfigured. Mitigations are the staged roadmap — not M16 code.

---

## 12. Dependencies (principle only — nothing installed in M16)

| When | May introduce (after approval) |
|------|--------------------------------|
| **M17** | Neon driver/connectivity + **one** ORM/migration system |
| **M18** | Auth.js + password hashing library |

---

## 13. Explicit out of scope for M16

- Any application implementation
- Neon account creation
- Dependency installs / `package.json` changes
- `DATABASE_URL` / secrets
- Migrations
- Commit / push / deploy of planning work (unless separately approved)

---

## 14. Success criteria (M16)

- [x] Architecture options compared
- [x] Stack recommended and **approved**
- [x] Staged roadmap numbered M16–M20 (M20 optional)
- [x] Decisions A–K approved and recorded
- [x] No database implementation in M16
- [x] Follow-on M17 implementation plan authored separately

---

## 15. Handoff

**Next document:** [`docs/milestone-17-implementation-plan.md`](./milestone-17-implementation-plan.md) — Production Persistence Foundation (**planning**; implementation only after further approval).

---

## Document control

| Field | Value |
|-------|-------|
| Closed as | Planning-only milestone |
| Approved decisions | A–K as listed above |
| Baseline commit | `62973868abb3171c4318b976ae453b6a76ae4e64` |
