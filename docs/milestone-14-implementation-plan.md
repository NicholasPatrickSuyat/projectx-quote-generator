# Milestone 14 — Implementation Planning Document

**Status:** Approved for implementation  
**Baseline commit (production):** `b3797ae77d67616de53f94566bf538d485eff895`  
**Production:** https://projectx-quote-generator.vercel.app/  
**Git (at planning time):** `main` = `origin/main` = `b3797ae…`; working tree clean  

**Constraints:** no new dependencies; no `package.json` / `package-lock.json` changes; no production auth libraries; no database; no redesign of Dashboard or modules.

---

## Final decisions (approved)

| ID | Decision |
|----|----------|
| **A1** | Defer re-send / email / SMS. M12 Final PDF regeneration is sufficient. |
| **A2** | Restore remains **Admin-only** for Customers, Quotes, and Catalog — enforce in UI **and** provider/domain mutations. |
| **A3** | Light Prepared By provider harden: new quotes default to auth full name; Staff cannot override via mutations; Admin may override; no `preparedByUserId`. |
| **A4** | Shared dirty-navigation guard using existing **ConfirmDialog**; `beforeunload` may use native warning; cover sidebar, top-bar links, Back/Forward, Sign Out, dirty forms. |
| **A5** | Defer customer quote aggregate sync unless required to fix a broken integration. |
| **A6** | Scope = **Cross-Module Hardening & Integration** as planned (Dashboard live, auto-expire, dirty nav, RBAC providers, SoT cleanup, auth/cross-module regression). |

### Auto-expiration rule (implemented)

| Rule | Behavior |
|------|----------|
| **Sent** + Valid Until before today | Auto → **Expired** (lazy evaluation) |
| **Draft** + past Valid Until | Remains **Draft** and editable (warning UI only) |
| Accepted / Rejected | Never auto-expire |
| Archived | Not mutated while archived |
| Reactivate Expired → Draft | **Admin-only** (`canOverrideQuoteStatus`) |
| PDF / sentAt | Preserved on auto Sent → Expired |

This supersedes the earlier planning note that Draft would auto-expire (Staff lockout fix).

**Out of scope:** Database, production auth, email/SMS, customer portal, re-send workflow, customer aggregate redesign, global search, notifications, broad refactors, new dependencies.

---

## 1. Recommended milestone name and purpose

**Name:** Milestone 14 — Cross-Module Hardening & Integration  

**Purpose:** Make the existing V1 feature set behave as one coherent demo product by closing known integration gaps between M5–M13 — without adding a new major feature module.

Primary outcomes:

1. Dashboard consumes live `QuoteSession` state (same source of truth as Quotes).
2. Quotes auto-expire per Product Spec §10.5 when Valid Until has passed (lazy evaluation; no background workers).
3. Shared dirty-navigation protection covers Browser Back/Forward and in-app links across dirty surfaces.
4. RBAC capability checks are consistent in UI **and** session providers for Admin-only actions.
5. Session stores remain the only runtime source of truth; seed data initializes only.
6. Light auth/regression and cross-module consistency fixes only where they unblock reliable demos.

---

## 2. Evidence this is the correct next milestone

| Evidence | Detail |
|----------|--------|
| Feature modules exist | F1–F9 are implemented at demo depth: Auth/Users (M13), Customers (M7), Quotes + Builder (M8–M9), Catalog (M10), Settings (M11), PDF (M12), Dashboard UI (M6), Shell (M5), Deploy (M5.5). |
| Spec V1 success criteria (§15.4) | Core flows exist; remaining failures are **consistency** (Dashboard not live, expiration not automatic, dirty nav incomplete), not missing screens. |
| M13 explicit deferrals | M13 decisions **C2** deferred Dashboard↔QuoteSession wiring and auto-expiration; shared popstate dirty guards deferred to a hardening milestone. |
| No competing major feature | Spec “re-send” is named in G2 but M13 **I1** deferred email/re-send; Spec treats production auth/DB as production-ready, not demo-complete. Neither should preempt hardening for a coherent V1 **demo**. |
| Roadmap docs are stale | `docs/README.md` / Spec §24 still list early modules as unchecked; implementation reality is ahead — planning must follow Spec + codebase, not the outdated checklist. |

**Conclusion:** No new major feature should take priority over hardening. **Milestone 14 — Cross-Module Hardening & Integration** is the correct next V1 milestone.

---

## 3. Current-state analysis

### 3.1 What works end-to-end today

- Demo login (Admin / Office Staff), route gates for Settings/Users, capability-driven UI for Catalog manage / restore / status overrides / Prepared By.
- Customers, Quotes, Builder, Catalog, Settings, Users each use session providers seeded once from demo data.
- PDF Final / Mark Sent freezes `pdfSnapshot`; Return to Draft / Reactivate clears snapshot appropriately.
- Dashboard UI (metrics, chart, attention, quick actions, deep-links) is complete **visually**.

### 3.2 Known gaps (verified in code)

| Gap | Current behavior | Spec / intent |
|-----|------------------|---------------|
| Dashboard data | `DashboardView` calls `getDemoQuotes()` from `src/lib/dashboard/demo-data.ts` — **not** `useQuoteSession` | §10.10 / §11 — Dashboard reports live quote statuses |
| Dual quote seeds | Dashboard `DemoQuote` (`q-001`, `expiresAt`) vs Quotes `Quote` (`QUO-…`, `validUntil`) | Single operational quote set |
| Auto-expiration | Manual `markQuoteExpired` only; Builder warns Valid Until past but does not change status | §10.5 automatic Expired |
| Dirty navigation | Builder/Settings: `beforeunload` + link click capture; Customers/Catalog/Users: panel discard + Sign Out registry only; **no `popstate`** | Unsaved work must not vanish via Back/Forward or nav |
| RBAC provider holes | Catalog/Settings/Users providers gate mutations; Quote/Customer `restore` / `markExpired` / `reactivate` are **UI-gated only** | §14.10 enforce; hide unauthorized UI |
| Customer aggregates | `totalQuotes` / `recentQuotes` are seed fields; QuoteSession creates do not update CustomerSession | Soft inconsistency (Customers summary / quoting context) |
| Separate Archive page | Spec §11.8 / Screens table; **no** `/archive` route — archive via list toggles | Acceptable for demo if lists cover archive; optional polish |

### 3.3 Architecture snapshot

```
DemoAuthSessionProvider
  RequireAuth
    CompanySettings → Customers → Catalog → Quotes
```

Capability helpers: `canManageUsers|Settings|Catalog`, `canOverrideQuoteStatus`, `canRestore`, `canOverridePreparedBy` (`src/lib/auth/capabilities.ts`).

---

## 4. Remaining V1 feature inventory

### A. Required before V1 **demo** is considered complete

| Item | Why |
|------|-----|
| Dashboard ↔ QuoteSession integration | Spec §11 + M13 deferral; demo otherwise shows stale/wrong metrics |
| Automatic quote expiration | Spec §10.5 explicit; currently warning-only |
| Shared dirty-navigation hardening | Prevents data-loss demos; M13 left popstate/cross-route incomplete |
| RBAC provider consistency for Admin-only quote/customer restore & status overrides | Matches Catalog/Settings pattern; closes soft holes |
| Retire Dashboard parallel seed as runtime SoT | Session consistency |

### B. Required before **production-ready** V1

| Item | Why |
|------|-----|
| Real authentication + server-side authorization | Spec §14.2 / §14.10 |
| Durable database persistence | Spec §19 / roadmap |
| Backend enforcement of all mutations | Frontend-only gates are demo-only |
| Credential hashing / no plaintext demo passwords | Spec §14.6 |
| Production deployment secrets / env hardening | Ops |

### C. Optional polish (demo-friendly, not blockers)

| Item | Notes |
|------|-------|
| Sync Customer `totalQuotes` / `recentQuotes` from QuoteSession | Improves Customers summary honesty |
| Deeper attention deep-links (quote id → open builder) | Today filter-only hrefs |
| Profile picture upload | Spec field; M13 deferred UI |
| Dedicated Archive page | Spec screen table; lists already support archived views |
| Extra a11y / empty-state copy passes | Only if time remains |

### D. Explicitly future / out of scope

| Item | Notes |
|------|-------|
| Email / Resend delivery pipeline | M13 **I1**; G2 mentions re-send — treat as future unless decided otherwise (Ambiguity A1) |
| Full audit trail / createdBy-updatedBy everywhere | Spec future; M13 **E1** |
| Multi-tenant SaaS, CRM expansion, invoices, scheduling | Spec non-goals |
| Manager / field technician roles | Spec future |
| Background job runners / cron for expiration | Unnecessary for session demo |
| Broad refactors, new UI frameworks, new dependencies | Explicitly out |

**Priority verdict:** Nothing in B–D should displace A for Milestone 14.

---

## 5. Dashboard integration plan

### Goal

Do **not** redesign Dashboard. Wire existing widgets to live quotes.

### Approach

1. `DashboardView` uses `useQuoteSession().quotes` (and customer name resolution from `useCustomerSession` or quote customer snapshot fields already on `Quote`).
2. Adapt `src/lib/dashboard/metrics.ts` to accept a **normalized dashboard row** derived from `Quote` (map `validUntil` → expiration field used by metrics; `quoteNumber`/`id`; `grandTotal`; status; timestamps; `archived`).
3. Keep archived quotes **excluded** from all metrics/lists (already `activeQuotes` pattern).
4. After auto-expiration runs in QuoteSession, Dashboard counts update automatically (same store).
5. Preserve date presets, status cards, chart, attention panels, quick actions, and deep-link href patterns (`/quotes?status=…`, `?expiringSoon=1`, etc.).
6. Retire runtime use of `getDemoQuotes` from Dashboard. Optionally keep the file temporarily unused or delete once metrics are Quote-based (prefer delete/unused cleanup only if safe).

### Expected behavioral wins

- Create / status change / archive / restore / expire → Dashboard updates in-session.
- Dashboard counts agree with Quotes list filters.
- Attention widgets reflect current Valid Until / Draft age / Sent state.

### Non-goals

- New Dashboard widgets, analytics, or layout redesign.
- Persisting Dashboard state.

---

## 6. Auto-expiration rules and lifecycle

### Spec baseline (§10.5)

- Quotes **automatically** become **Expired** when **Valid Until** has passed.
- Empty Valid Until → **never** auto-expire.
- Manual Expired remains allowed (Admin override today).

### Recommended rules (for approval)

| Rule | Recommendation |
|------|----------------|
| Eligible statuses | **Sent** only (Draft does **not** auto-expire) |
| Ineligible | **Accepted**, **Rejected**, **Expired** (already), and any **archived** quote |
| Empty `validUntil` | Skip |
| Comparison | Calendar date: `validUntil < todayIso` (start-of-day client today, same pattern as rest of app) |
| Side effects | Set `status: "Expired"`, set `expiredAt` / `updatedAt`; **do not** clear `pdfSnapshot` (historical Sent PDF remains correct) |
| Archived + past Valid Until | Do **not** change status while archived; on Admin restore, restore previous status then immediately re-evaluate expiration (so a restored past-due Sent becomes Expired) |
| Reactivate / Return paths | Existing Admin reactivate → Draft + new Valid Until from company defaults + clear PDF snapshot (already); after reactivation, not expired until new date passes |
| Builder warning | Past Valid Until on Draft: warn only; on Sent: expect auto-expire |

### When evaluation occurs (no timers)

**Recommended:** Lazy evaluation inside `QuoteSessionProvider` whenever quotes are loaded/updated for the session “today”:

1. On provider ready / initial seed apply.
2. After any quote mutation batch that could affect dates/status.
3. When client `today` is first resolved (existing `useSyncExternalStore` / client-today pattern).

Expose a pure helper e.g. `applyAutoExpirations(quotes, today) → quotes` used by the provider so Dashboard/Quotes/Builder all see post-expiration state without each screen implementing it.

**Not recommended:** `setInterval`, service workers, or Vercel cron for V1 demo.

### Effect on Dashboard and Quotes

- Status totals / filters / attention “Expired” reflect auto transitions.
- “Expiring within 7 days” continues to mean Draft/Sent with Valid Until in `[today, today+7]` **before** they expire.

---

## 7. Shared dirty-navigation strategy

### Current matrix

| Surface | Sign Out registry | `beforeunload` | In-app link capture | Panel discard | `popstate` |
|---------|-------------------|----------------|---------------------|---------------|------------|
| Quote Builder | Yes | Yes | Yes | Leave dialogs | No |
| Settings | Yes | Yes | Yes | Leave dialog | No |
| Customers | Yes | No | No | Panel only | No |
| Catalog | Yes | No | No | Panel only | No |
| Users | Yes | No | No | Panel only | No |

### Goal

Unsaved work should not disappear via Browser Back/Forward, sidebar, top-bar, or Sign Out — without inventing a routing framework.

### Recommended approach

1. Expand `src/lib/navigation/unsaved-changes.ts` into a small shared hook, e.g. `useUnsavedNavigationGuard({ isDirty, onConfirmLeave? })` that:
   - Registers with the existing Sign Out registry.
   - Adds `beforeunload` when dirty.
   - Captures same-origin `a[href]` clicks (document capture) — same pattern as Builder/Settings.
   - Handles `popstate` with a minimal history trap: on dirty back/forward, confirm; if cancel, `history.pushState` / re-push current URL to stay put.
2. Adopt the hook in Builder, Settings, Customers, Catalog, Users (replace duplicated listeners where present).
3. Keep intentional navigations via `allowLeave` / confirm-then-navigate refs.
4. Do **not** wrap Next.js App Router or add third-party blockers.

### Users applicability

Yes — when create/edit panel is dirty, same guard as Customers/Catalog.

### Non-goals

- Global middleware auth rewrite.
- Intercepting every `router.push` via monkey-patch (prefer call-site `requestNavigation` helpers where programmatic).

---

## 8. RBAC consistency findings

### Aligned today

| Area | Staff | Admin | Enforcement |
|------|-------|-------|-------------|
| Settings | Blocked (nav + `/settings` gate + save no-op) | Full | Strong |
| Users | Blocked (nav + gate + mutations) | Full | Strong |
| Catalog manage | Hidden/disabled; provider rejects | Full | Strong |
| Catalog view/use | Allowed | Allowed | OK |
| Prepared By field | Read-only UI | Editable UI | UI-only write path via upsert |
| PDF | Allowed | Allowed | OK |
| Quote/Customer archive | Allowed | Allowed | OK (matches Spec §14.3 archive) |
| Restore / Mark Expired / Reactivate | Hidden UI | Shown | **UI only — provider ungated** |

### Holes to fix in M14

1. `QuoteSessionProvider.restore` / `markExpired` / `reactivate` — add capability checks (no-op or no-op + ignored).
2. `CustomerSessionProvider.restoreCustomer` — gate with `canRestore`.
3. Optional: ignore Prepared By changes from Staff inside `upsertQuote` (normalize to session user name) — Ambiguity A3.

### Spec tension (needs decision)

- Spec §14.3 lists Staff **Restore** for Customers and Quotes.
- Spec §14.4 lists Admin **Restore archived records** + status overrides.
- M13 implemented **`canRestore` = Admin only** for both customers and quotes; your M14 brief treats restore/status overrides as Admin-only.

**Recommendation:** Retain **Admin-only restore** (M13 behavior) as the V1 demo rule; treat Spec §14.3 restore wording as superseded by M13 RBAC decisions unless you reverse it (Ambiguity A2).

---

## 9. Demo/session source-of-truth findings

| Module | Runtime SoT | Issue |
|--------|-------------|-------|
| Quotes / Builder | QuoteSession | OK |
| Customers | CustomerSession | OK (aggregates stale) |
| Catalog | CatalogSession | OK |
| Settings | CompanySettingsSession | OK |
| Users / identity | DemoAuthSession | OK |
| **Dashboard** | **`dashboard/demo-data`** | **Competing SoT — must fix** |

Seed files remain valid for **initialization only**.

**Secondary (optional M14):** derive customer quote counts from QuoteSession when rendering Customers summary so seed fields are not a second truth.

---

## 10. Cross-module integration findings

| Flow | Status | M14 action |
|------|--------|------------|
| Customers → Quotes (`?customer=`) | Works | Regression-test only |
| Catalog → Builder picker | Works; Staff use OK | Regression-test |
| Settings → new quote defaults | Works | Regression-test; ensure auto-expire uses same validity days |
| Auth user → Prepared By | Works (M13) | Optional provider harden |
| Quote status → Dashboard | **Broken** (static seed) | **Fix** |
| Quote → PDF / Sent freeze | Works | Ensure auto-expire does not wipe snapshot |
| Archive/restore → lists | Works | Ensure Dashboard excludes archived; restore + expire interaction |
| RBAC → actions | Mostly UI | Provider gates for admin actions |
| Dashboard deep-links → Quotes filters | Works against QuoteSession | After Dashboard lives on QuoteSession, counts and lists align |

---

## 11. Proposed data-model changes

**Minimal — prefer no schema break.**

| Change | Type |
|--------|------|
| Dashboard metrics input type | Adapt helpers to `Quote` (or thin view-model); deprecate `DemoQuote` if unused |
| Auto-expiration helper | Pure function over `Quote[]`; uses existing fields (`validUntil`, `status`, `archived`, `expiredAt`) |
| Dirty registry | Possibly richer checker API (message / confirm); no entity model change |
| Capabilities | No new flags required if A2 keeps Admin-only restore |

No new entities. No database.

---

## 12. Proposed files / components affected

**Likely touch (indicative, not exhaustive):**

| Area | Files |
|------|-------|
| Dashboard | `dashboard-view.tsx`, `src/lib/dashboard/metrics.ts`, `status-*`, `needs-attention.tsx`, `summary-metrics.tsx`; retire/stop using `demo-data.ts` |
| Expiration | `quote-session-provider.tsx`, `src/lib/quotes/mutations.ts` (or new `src/lib/quotes/auto-expire.ts`), Builder warning copy |
| Dirty nav | `src/lib/navigation/unsaved-changes.ts`, Builder, Settings, Customers, Catalog, Users views; `top-bar.tsx` (consume same registry) |
| RBAC | `quote-session-provider.tsx`, `customer-session-provider.tsx` (and any mutation wrappers) |
| Types | `src/types/quote.ts` if `DemoQuote` removed |
| Docs | This plan; brief implementation summary later |

**Avoid:** `package.json`, PDF layout redesign, Login redesign, new routes unless Archive page is approved (not recommended for M14).

---

## 13. Implementation phases

| Phase | Work | Exit check |
|-------|------|------------|
| **P0** | Auto-expiration helper + QuoteSession integration | Past-due Draft/Sent become Expired; Accepted/Rejected/Archived untouched; PDF snapshot retained |
| **P1** | Dashboard → QuoteSession + metrics adapter | Create/status/archive reflected; deep-links still work; archived excluded |
| **P2** | Shared dirty-navigation hook + adopt on all dirty surfaces | Back/Forward + sidebar prompt when dirty; Sign Out still works |
| **P3** | RBAC provider gates for restore / markExpired / reactivate | Staff UI remains hidden; provider no-ops without capability |
| **P4** | Light consistency + regression | Auth smoke, cross-module smoke, optional customer aggregates |
| **P5** | Lint, production build, browser verification, Multi-Model Review | Ready for commit approval |

Phases P0–P1 are the product-critical core; P2–P3 are reliability/RBAC; P4 is polish.

---

## 14. Validation / error behavior

| Case | Behavior |
|------|----------|
| Auto-expire | Silent status transition (no modal spam); lists/badges update |
| Manual expire (Admin) | Existing confirm flows retained |
| Staff calls gated API | No-op; no crash |
| Dirty leave cancel | Stay on page; history restored for Back cancel |
| Dirty leave confirm | Allow navigation / sign-out |
| Empty Valid Until | Never auto-expire |
| Dashboard with zero quotes | Existing empty/zero states |
| Auth loading | Existing RequireAuth shell — avoid capability flash regressions |

---

## 15. Accessibility / responsive considerations

- Reuse existing confirm dialogs for leave / status actions (focus trap, Esc, labeled buttons).
- Do not introduce new gesture-only guards.
- Dashboard layout unchanged — preserve desktop-first + existing responsive grid.
- Ensure expiration status badge contrast remains per Design System status colors.
- Browser Back confirm must be keyboard-accessible (native `window.confirm` or existing `ConfirmDialog`).

**Ambiguity A4:** native `confirm` vs Design System dialog for popstate (recommend Design System dialog where already used; native only if dialog cannot block history sync reliably).

---

## 16. Security considerations

- M14 remains **DEMO-ONLY** auth. Do not claim production security.
- Provider-side capability checks reduce casual bypass via React DevTools — still not real authorization.
- Do not expand plaintext credential storage.
- Keep `sanitizeNextPath` behavior; regression-test open redirects.
- Auto-expire is client-side only (acceptable for session demo).

---

## 17. Testing plan

### Manual / browser

1. **Dashboard live:** Admin creates quote → Dashboard Draft count increments; Mark Sent / Accept / Archive / Restore → metrics + attention update; Staff sees same live data.
2. **Auto-expire:** Sent with Valid Until yesterday → Expired; Draft with past Valid Until stays Draft/editable; Accepted unchanged; empty Valid Until unchanged; archived past-due unchanged until restore+reeval; Final PDF snapshot preserved on Sent → Expired.
3. **Dirty nav:** Dirty Builder/Settings/Customers/Catalog/Users — sidebar link, top-bar Settings (Admin), Browser Back, Sign Out all prompt; cancel keeps edits.
4. **RBAC:** Staff cannot restore / expire / reactivate via UI; provider no-op if forced; Settings/Users still blocked; Catalog manage blocked; Prepared By read-only.
5. **Auth smoke:** Login Admin/Staff; inactive blocked; safe `next`; no redirect loop; Sign Out clears session.
6. **Cross-module:** Customer → New Quote; Catalog pick; Settings validity days → new draft Valid Until; PDF Sent freeze then change Settings logo → frozen PDF unchanged.

### Automated / build

- `eslint` / existing lint script
- `next build` production build
- No new test framework required

---

## 18. Success criteria

- [ ] Dashboard metrics/lists derive from QuoteSession (no competing dashboard quote seed at runtime).
- [ ] Creating/updating/archiving/restoring/expiring quotes updates Dashboard in the same session.
- [ ] Sent quotes with past Valid Until auto-become Expired; Draft with past Valid Until stays Draft; empty Valid Until never auto-expires; Accepted/Rejected unchanged; archived excluded from evaluation until restore.
- [ ] Sent `pdfSnapshot` survives auto-expiration.
- [ ] Shared dirty guard covers Builder, Settings, Customers, Catalog, Users for in-app links, Sign Out, and Browser Back/Forward.
- [ ] Admin-only restore / markExpired / reactivate enforced in session providers as well as UI.
- [ ] No new dependencies; package manifests untouched.
- [ ] Lint + production build clean; browser-verified Admin + Staff paths.
- [ ] No Milestone 15 / production auth / database work started.

---

## 19. Explicit out-of-scope items

- Production authentication, password hashing, server sessions, middleware auth rewrite
- Database / API persistence
- Email / Resend / true re-send pipeline (unless Ambiguity A1 reverses)
- Dashboard redesign or new analytics
- New major modules (invoices, scheduling, CRM)
- Dedicated Archive app section (unless explicitly approved)
- Broad TypeScript/architecture refactors unrelated to gaps above
- New npm dependencies
- Commit / push / deploy until separately approved

---

## 20. Dependencies

| Dependency | Notes |
|------------|-------|
| External packages | **None** — reuse existing React/Next patterns |
| Prior milestones | Requires M13 demo auth + QuoteSession + Dashboard UI (already on `b3797ae`) |
| Decisions | Ambiguities A1–A5 below must be approved before implementation |

---

## 21. Ambiguities — RESOLVED

| ID | Decision |
|----|----------|
| A1 | Defer re-send / email / SMS |
| A2 | Admin-only restore (UI + provider) |
| A3 | Light Prepared By provider harden |
| A4 | ConfirmDialog shared guard; native beforeunload |
| A5 | Defer customer aggregates |
| A6 | Full hardening scope as Milestone 14 |

---

## Document control

| Field | Value |
|-------|--------|
| Created | 2026-08-09 |
| Approved | 2026-08-09 (A1–A6) |
| Based on | Product Spec V1 Approved; UI/UX M3; Design System M4; M13 commit `b3797ae` |
| Next | Implementation complete → await commit/push approval |
