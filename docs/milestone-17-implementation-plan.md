# Milestone 17 — Production Persistence Foundation (Final Implementation Plan)

**Status:** Planning finalized — **awaiting explicit implementation approval**  
**Milestone name:** Production Persistence Foundation  
**Upstream:** Milestone 16 closed (architecture decisions A–K)  
**Baseline (production):** `62973868abb3171c4318b976ae453b6a76ae4e64` (M15 demo-complete)  
**Production URL:** https://projectx-quote-generator.vercel.app/  

**Until implementation is approved:**

- Do not install packages  
- Do not create Neon resources  
- Do not configure env vars  
- Do not implement / migrate / commit / push / deploy  

---

## Final approved decisions (this pass)

| ID | Decision |
|----|----------|
| **ORM-1** | **Drizzle ORM + drizzle-kit + `@neondatabase/serverless`**. Do not install until implement go-ahead. |
| **CID-1** | Single company per installation. Lightweight `company_id` FK for Settings/Catalog ownership. **No** multi-tenant SaaS. **No RLS** in M17. |
| **SCH-1** | Create **only** tables M17 wires: `company`, `company_settings`, `catalog_items`. **Do not** create `users` / `customers` / `quotes` / `quote_line_items` yet. |
| **BR-1** | **No** forgeable DEMO auth cookie as server authorization. DEMO-ONLY auth remains. Durable Settings/Catalog mutations are for **local/dev and approved preview** only. **Public production stays on `PERSISTENCE_MODE=session`** until M18. Do not describe M17 as production-secure. Design repos/actions so M18 can add real auth without rewriting persistence. |
| **ENV-1** | Explicit `PERSISTENCE_MODE=session \| database`. Default **session** if unset. `database` requires `DATABASE_URL`; **fail fast** — never silent fallback. |
| **HYB-1** | Document hybrid clearly (see §Hybrid). |
| **PREV-1** | Dedicated **non-production** Neon DB/branch for M17. Do **not** wire public production to the database in M17. Per-PR branching later. |
| **DEP-1** | Install only the three approved packages (versions §Dependencies). No other DB packages without approval. |
| **NEON-1** | Neon project created only when implementation is explicitly approved — **not during planning**. |

---

## 1. Final M17 scope

### In scope

1. Add Drizzle + Neon serverless driver (after install approval).  
2. Define schema + **committed SQL migrations** for:
   - `company`
   - `company_settings`
   - `catalog_items`
3. Server-only repositories for Company Settings and Catalog.  
4. Server Actions for Settings/Catalog mutations (when in `database` mode).  
5. Provider façades that switch between **session** vs **database** backends via repository interfaces — **no Settings/Catalog UI rewrite**.  
6. Explicit demo seed script (dev/preview only) + company bootstrap script.  
7. Hybrid documentation (README / docs + light in-app notices on Settings & Catalog when in database mode).  
8. Keep DEMO-ONLY auth, Users, Customers, Quotes, Dashboard, PDF snapshots on session architecture.  
9. Keep existing client RBAC UI gates; do not weaken them.  
10. Validate mutation inputs on the server in database mode.  
11. Authorization **hooks** ready for M18 (e.g. `assertCanManageSettings(actor)` stub / TODO boundary).

### Out of scope

- Creating Neon during planning  
- Wiring **production** Vercel to Neon  
- Auth.js / password hashing / DEMO cookie “server auth”  
- Users / Customers / Quotes tables or persistence  
- PDF file / object storage  
- RLS / multi-tenant  
- Schema push as production migration strategy  
- Auto-seeding on app startup  

### Production behavior during M17 (critical)

| Environment | `PERSISTENCE_MODE` | Behavior |
|-------------|--------------------|----------|
| **Public production (Vercel prod)** | **`session`** (unset or explicit) | Identical to today’s demo — no DB |
| Local / approved preview | `database` + Neon non-prod URL | Settings + Catalog durable |
| Misconfig | `database` without `DATABASE_URL` | **Fail fast** server-side |

M17 does **not** make the sellable production deploy database-backed or production-secure.

---

## 2. Exact tables / columns

### 2.1 Enum / check strategy

Use Postgres enums via Drizzle `pgEnum` (committed in SQL migrations):

| Enum | Values |
|------|--------|
| `catalog_category` | `Services`, `Materials`, `Labor` |
| `discount_type` | `none`, `percent`, `fixed` |

Currency V1: `text` with CHECK `currency = 'USD'` (or enum with single value).

### 2.2 `company`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

V1 expects **one** company row per installation (enforced by bootstrap + app logic, not RLS).

### 2.3 `company_settings`

One settings row per company.

| Column | Type | Constraints |
|--------|------|-------------|
| `company_id` | `uuid` | **PK** and FK → `company(id)` ON DELETE CASCADE |
| `company_name` | `text` | NOT NULL |
| `phone` | `text` | NOT NULL |
| `email` | `text` | NOT NULL |
| `website` | `text` | NOT NULL DEFAULT `''` |
| `street` | `text` | NOT NULL |
| `city` | `text` | NOT NULL |
| `state` | `text` | NOT NULL |
| `zip` | `text` | NOT NULL |
| `logo_json` | `jsonb` | NULL — temporary data-URL payload (see §Logo) |
| `currency` | `text` | NOT NULL DEFAULT `'USD'`; CHECK `= 'USD'` |
| `tax_rate` | `numeric` | NOT NULL — percent as used by app today |
| `quote_validity_days` | `integer` | NOT NULL |
| `discount_type` | `discount_type` | NOT NULL |
| `discount_value` | `numeric` | NOT NULL — percent or dollar amount per type (UI semantics unchanged) |
| `prepared_by` | `text` | NOT NULL DEFAULT `''` |
| `customer_facing_message` | `text` | NOT NULL |
| `terms_and_conditions` | `text` | NOT NULL |
| `pdf_footer_text` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL |
| `updated_at` | `timestamptz` | NOT NULL |

**FK:** `company_id` → `company(id)`.  
**Unique:** PK already enforces one settings row per company.

### 2.4 `catalog_items`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `text` | PK (keep app id scheme e.g. `CAT-…`) |
| `company_id` | `uuid` | NOT NULL, FK → `company(id)` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `category` | `catalog_category` | NOT NULL |
| `description` | `text` | NOT NULL DEFAULT `''` |
| `unit` | `text` | NOT NULL |
| `unit_price_cents` | `integer` | NOT NULL — **integer cents** |
| `archived` | `boolean` | NOT NULL DEFAULT `false` |
| `archived_at` | `timestamptz` | NULL — set on archive, cleared on restore |
| `created_at` | `timestamptz` | NOT NULL |
| `updated_at` | `timestamptz` | NOT NULL |

**Indexes:**

- `(company_id, archived)`
- `(company_id, category)`
- `(company_id, name)`

**Soft archive:** `archived = true` + `archived_at = now()`; restore sets `archived = false`, `archived_at = null`. No hard deletes in M17.

### 2.5 Domain mapping note (cents)

UI / `CatalogItem.unitPrice` today is **dollars** (`number`).  
Repository boundary:

- DB ↔ domain: `unit_price_cents` ↔ dollars via existing `dollarsToCents` / inverse helpers  
- **No Catalog UI rewrite** required for cents storage  

---

## 3. Exact repository / action architecture

### 3.1 Layering

```
Settings / Catalog UI (unchanged contracts)
  └─ Session providers (façades)
       └─ Persistence ports (interfaces)
            ├─ SessionCompanySettingsRepository / SessionCatalogRepository
            └─ DbCompanySettingsRepository / DbCatalogRepository
                 └─ server-only Drizzle client (database mode only)
```

Server Actions call **DB repositories** (+ validation + M18-ready auth hooks) when invoked. Providers in `database` mode call those actions / server loaders; in `session` mode call in-memory repos (current behavior).

### 3.2 Interfaces (ports)

```ts
// Conceptual — names indicative

interface CompanySettingsRepository {
  get(): Promise<CompanySettings>;
  save(values: CompanySettingsFormValues): Promise<CompanySettings>;
}

interface CatalogRepository {
  list(): Promise<CatalogItem[]>;
  get(id: string): Promise<CatalogItem | undefined>;
  create(values: CatalogFormValues): Promise<CatalogItem>;
  update(id: string, values: CatalogFormValues): Promise<CatalogItem | null>;
  duplicate(id: string): Promise<CatalogItem | null>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
```

Factory selects implementation from `PERSISTENCE_MODE` **on the server only**.

### 3.3 Server Actions vs Route Handlers

| Mechanism | Use in M17 |
|-----------|------------|
| **Server Actions** | Preferred for Settings save + Catalog create/update/duplicate/archive/restore |
| **Route Handlers** | Only if an HTTP boundary proves necessary — **not** default |
| Client → `db` | **Forbidden** |
| `import "server-only"` | Required on db client + DB repositories |

### 3.4 Validation + M18-ready authorization

On every durable mutation Server Action:

1. `assertPersistenceDatabaseConfigured()`  
2. Validate payload with existing `src/lib/company/validation.ts` / catalog validators  
3. Call `assertCanManageSettings(actor)` / `assertCanManageCatalog(actor)` where:
   - **M17:** implementation is an explicit **no-op or denied-in-production** policy:
     - If `APP_ENV === 'production'` **or** public prod deploy: durable mutation actions **must refuse** (defense in depth with `PERSISTENCE_MODE=session` on prod)
     - If local/preview `database` mode: allow mutations for development (DEMO identity is **not** treated as proof of security)
   - **M18:** replace bodies with real session + `capabilitiesForRole` without changing repositories

Do **not** invent a DEMO cookie that pretends to be server auth.

### 3.5 Provider transition

Keep:

- `useCompanySettingsSession()`
- `useCatalogSession()`
- Existing method shapes (`saveSettings`, `createItem`, …)

Internals branch on mode; UI largely untouched aside from hybrid notice.

---

## 4. Exact migration workflow

1. Author Drizzle schema in `src/lib/db/schema/*`  
2. `drizzle-kit generate` → SQL under committed folder (e.g. `drizzle/` or `src/lib/db/migrations/`)  
3. **Review** generated SQL in PR  
4. Apply intentionally: `drizzle-kit migrate` using **unpooled** URL  
5. Commit schema **and** migration history together  

**Forbidden as production/dev-of-record strategy:** `drizzle-kit push` for shared/preview/prod databases (local throwaway experiments only if ever used — not the team path).

Re-running migrate on an already-applied DB must be a no-op (Drizzle migrations journal).

---

## 5. Exact environment variables

| Variable | Required | Meaning |
|----------|----------|---------|
| `PERSISTENCE_MODE` | Optional | `session` (default) \| `database` |
| `DATABASE_URL` | Required iff mode=`database` | Neon **pooled** URL for app |
| `DATABASE_URL_UNPOOLED` | Required for migrate scripts | Neon **direct** URL |
| `APP_ENV` | Recommended | `development` \| `preview` \| `production` |
| `BOOTSTRAP_COMPANY_NAME` | Optional | Name for empty company bootstrap |

**.env.example** documents names only.  
**Never** expose these to the browser bundle (`NEXT_PUBLIC_*` must not carry DB URLs).

### Mode rules (ENV-1)

```
if PERSISTENCE_MODE unset or "session" → session repos (current demo)
if PERSISTENCE_MODE === "database":
  if !DATABASE_URL → throw clear server config error (fail fast)
  else → DB repos
never silently downgrade database → session
```

---

## 6. Exact dependencies and proposed versions

Checked against this workspace (planning time):

| Check | Result |
|-------|--------|
| Node | `v24.19.0` (local) — satisfies `@neondatabase/serverless` `engines.node >=19` |
| Next.js | `16.3.0` (package.json) |
| `drizzle-orm` peer | `@neondatabase/serverless >=0.10.0` |

### Proposed install set (pin at implement time; re-verify with `npm view` before install)

| Package | Role | Proposed version (npm latest at planning) |
|---------|------|-------------------------------------------|
| `drizzle-orm` | runtime | **`0.45.2`** |
| `@neondatabase/serverless` | runtime | **`1.1.0`** |
| `drizzle-kit` | devDependency | **`0.31.10`** |

**Compatibility notes**

- `drizzle-orm@0.45.2` declares optional peer `@neondatabase/serverless >=0.10.0` → `1.1.0` OK  
- No Auth.js / bcrypt / Prisma / `pg` TCP driver unless separately approved  
- Before install: re-run `npm view` to confirm versions still current; if majors moved, stop and re-approve  

Optional tiny helper: `server-only` package if not already available via Next — only if needed; prefer Next’s pattern. **Do not add without noting in implement report.**

---

## 7. Neon project / branch setup steps (when implementation approved)

1. Create Neon **project** (agency or client account per Decision J handoff).  
2. Create branch **`dev`** (or use default non-prod branch) for local M17 work.  
3. Optional second branch **`preview`** for Vercel Preview env (shared non-prod).  
4. **Do not** attach production Vercel env to this project in M17.  
5. Copy pooled + unpooled URLs into local `.env.local` / preview env only.  
6. Run migrations on `dev` (then `preview` if used).  
7. Document project id + branch names in internal handoff notes (not secrets).

Per-PR Neon branching: **deferred**.

---

## 8. Local development workflow

1. Implementation approval received  
2. Install three packages; commit lockfile when implementation commits are allowed  
3. Create Neon non-prod project/branch; set `.env.local`:
   ```
   PERSISTENCE_MODE=database
   DATABASE_URL=...pooler...
   DATABASE_URL_UNPOOLED=...
   APP_ENV=development
   ```
4. `npm run db:migrate` (script name TBD)  
5. Optional: `npm run db:seed:demo`  
6. `npm run dev`  
7. Verify Settings/Catalog survive hard reload; Customers/Quotes do not  
8. Also verify `PERSISTENCE_MODE=session` (or unset) matches pre-M17 demo  

---

## 9. Preview deployment workflow

1. Vercel **Preview** env (not Production):
   - `PERSISTENCE_MODE=database`
   - `DATABASE_URL` / unpooled for migrate-on-preview **only if** migrate workflow approved
   - `APP_ENV=preview`
2. Point at dedicated **non-prod** Neon branch  
3. Do **not** run demo seed from deploy hooks automatically  
4. Public production project remains `PERSISTENCE_MODE=session` (or unset)

If preview DB wiring is deferred in the first implement PR, local `database` mode alone is acceptable for M17 verification — document which path shipped.

---

## 10. Production behavior during M17

- Production deploy continues **session/demo** persistence for **all** modules including Settings/Catalog  
- No production `DATABASE_URL`  
- Durable mutation Server Actions refuse when `APP_ENV=production` even if misconfigured  
- README states: production remains demo session architecture until M18+  

---

## 11. Logo persistence approach

**M17 temporary approach:** store current logo object in `company_settings.logo_json` JSONB:

```json
{
  "dataUrl": "data:image/png;base64,...",
  "fileName": "...",
  "mimeType": "image/png",
  "byteLength": 12345
}
```

| Rule | Detail |
|------|--------|
| Max size | Enforce `LOGO_MAX_BYTES` (512 KB decoded) on client + server — kept under Next.js default 1 MiB Server Action body limit after base64/data-URL overhead |
| Object storage | **Not** in M17 |
| Future | Column can later become URL/storage key; keep `logo_json` shape versionable |
| Honesty | Document as **temporary**; fine for single-company small logos |

Base64 in Postgres is acceptable short-term given the 512 KB decoded cap (aligned with Server Action body limits); monitor row size.

---

## 12. Seed / bootstrap strategy

| Command (planned) | When | Inserts |
|-------------------|------|---------|
| `db:bootstrap:company` | Empty DB setup | One `company` + neutral `company_settings` (no fake catalog) |
| `db:seed:demo` | Dev/preview **explicit only** | Demo company branding + demo catalog items |

**Guards**

- Refuse `db:seed:demo` when `APP_ENV=production`  
- **No** auto-seed on `next start` / app boot  
- Production path: bootstrap company/settings only when intentionally preparing a client DB (post-M18 timing for real use)

Normal app startup never writes demo rows.

---

## 13. Expected files created / modified

### Created

- `src/lib/db/client.ts` (`server-only`)
- `src/lib/db/schema/company.ts` (and/or split files)
- `src/lib/db/schema/catalog.ts`
- `src/lib/db/schema/enums.ts`
- `drizzle.config.ts`
- `drizzle/**` (or `src/lib/db/migrations/**`) — **committed SQL**
- `src/lib/persistence/mode.ts` — resolve `PERSISTENCE_MODE`
- `src/lib/persistence/company-settings-repository.ts` (port + session + db)
- `src/lib/persistence/catalog-repository.ts` (port + session + db)
- `src/lib/actions/company-settings.ts`
- `src/lib/actions/catalog.ts`
- `src/lib/auth/assert-capability.ts` — M17 stub / prod refuse; M18 fills in
- `scripts/db-seed-demo.ts` / `scripts/db-bootstrap-company.ts` (or `src/lib/db/seed-*.ts`)
- `.env.example`

### Modified

- `package.json` / `package-lock.json` (on implement)  
- `company-settings-session-provider.tsx`  
- `catalog-session-provider.tsx`  
- `README.md`, `docs/README.md` (hybrid + mode docs)  
- Settings + Catalog views (hybrid notice when `database` mode)  
- Possibly `session-providers.tsx` for ready gating  

### Unchanged

- Quote / Customer / DemoAuth providers (except reading settings defaults as today)  
- PDF pipeline  
- Spec §24  

---

## 14. Testing checklist

1. Migrations apply on clean Neon branch  
2. Re-running migrations is safe (no-op / journal)  
3. Company Settings load from DB (`database` mode)  
4. Settings changes survive refresh and `next` restart  
5. Catalog loads from DB  
6. Create / Edit / Archive / Restore Catalog survives refresh  
7. Staff / Admin **demo UI** RBAC does not regress  
8. Session Customers / Quotes unchanged (still reset on full reload)  
9. `PERSISTENCE_MODE=session` (or unset) matches current demo exactly  
10. `PERSISTENCE_MODE=database` without `DATABASE_URL` fails clearly server-side  
11. Demo seed never auto-runs; refused in production `APP_ENV`  
12. No DB credentials in browser bundle  
13. DB modules are server-only (build/lint / import boundary)  
14. `npm run lint` and `npm run build` pass  
15. Production config remains session (manual/env review)  
16. Durable mutations refuse under `APP_ENV=production`  

---

## 15. Hybrid architecture communication (HYB-1)

### While M17 is active and `PERSISTENCE_MODE=database` (dev/preview only)

**Database-backed**

- Company Settings  
- Service Catalog  

**Session / demo-backed**

- Authentication (DEMO-ONLY)  
- Users  
- Customers  
- Quotes / Quote Builder  
- Dashboard quote state  
- PDF quote snapshots  

### Channels

1. README + `docs/README.md`  
2. In-app notice on Settings and Catalog when running in database mode  
3. Never claim full-app durability or production security  

---

## 16. Remaining decisions requiring approval

| ID | Topic | Recommendation |
|----|-------|----------------|
| **IMPL-1** | Approve start of M17 **implementation** (install + Neon + code) | Await Nicholas go-ahead |
| **PREV-DB-1** | Wire Vercel Preview to shared non-prod Neon in first implement PR, or local-only first? | **Local database mode first**; preview wiring optional follow-up in same milestone if smooth |
| **NOTICE-1** | Exact hybrid notice copy | Short factual banner on Settings/Catalog in database mode |
| **BOOT-1** | Neutral production-like settings defaults text for `db:bootstrap:company` | Empty/minimal placeholders, not Project X demo marketing copy |

No further architecture forks expected for M17 beyond IMPL-1.

---

## 17. Risks (final)

| Risk | Mitigation |
|------|------------|
| Accidental prod DB wiring | PREV-1 + prod stays `session`; mutation refuse in production |
| Believing DEMO auth secures DB | BR-1; docs; no DEMO cookie auth theater |
| Hybrid confusion | HYB-1 notices |
| Logo JSON size | 512 KB decoded cap (Server Action–safe); temporary; future storage |
| Cents vs dollars bugs | Central converters at repository boundary |
| Schema lock-in for quotes/users | SCH-1 — those tables deferred to M18/M19 |

---

## 18. Success criteria (implementation)

- [ ] Approved packages installed at verified versions  
- [ ] Only `company` / `company_settings` / `catalog_items` migrated  
- [ ] Session mode unchanged from M15 demo  
- [ ] Database mode Settings + Catalog durable locally (and preview if wired)  
- [ ] Production remains session  
- [ ] Hybrid documented  
- [ ] Lint/build green  
- [ ] Not described as production-secure  

---

## Document control

| Field | Value |
|-------|-------|
| Plan revision | Final pre-implementation (SCH-1 / BR-1 adjustments applied) |
| Next step | Nicholas approves **IMPL-1** (and optional PREV-DB-1) → then implement |
