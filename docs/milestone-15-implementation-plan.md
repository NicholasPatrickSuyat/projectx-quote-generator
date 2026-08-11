# Milestone 15 — Implementation Planning Document

**Status:** Implemented in working tree — **awaiting commit / push approval**  
**Milestone name:** V1 Demo Readiness & Documentation Freeze  
**Baseline commit (production):** `8c8ddccb3273ea69b49a6acc96fef466bb26abc9`  
**Production:** https://projectx-quote-generator.vercel.app/  
**Git (at planning time):** `main` = `origin/main` = `8c8ddcc…`; working tree clean  

**Constraints:**

- No new dependencies or external services (**I1**)
- Do not modify `package.json` / `package-lock.json`
- No database / durable persistence (**F1**; deferred to a later milestone)
- No production authentication libraries (deferred; current auth remains **DEMO-ONLY**)
- Do not present the application as production-secure
- Do not add email / SMS / re-send
- Do not expand into new product features
- Do not modify Product Specification §24 or rewrite historical milestone docs merely to update checkboxes (**D1**)
- Keep deferred M14 Medium/Low findings deferred unless an M15 change directly exposes or reproduces one (**H1**)

---

## Final decisions (approved)

| ID | Decision |
|----|----------|
| **A1** | Milestone theme = **V1 Demo Readiness & Documentation Freeze** (not DB, not production auth) |
| **B1** | Sync customer quote aggregates from `QuoteSession` so customer data reflects live quote state |
| **C2** | Do **not** build a dedicated Archive page; existing archived list/filter behavior is sufficient for V1 demo |
| **D1** | Update living roadmap docs in `README.md` and `docs/README.md` only; **do not** amend Spec §24 |
| **E2** | Keep Needs Attention **filter-based** navigation; no quote-specific deep links |
| **F1** | Keep in-memory / session demo architecture; no database in M15 |
| **G2** | Remove the nonfunctional global Search / “Soon” stub from the sellable demo UI; **do not** implement global search |
| **H1** | Keep deferred M14 Medium/Low findings deferred unless directly exposed by an M15 change |
| **I1** | No new dependencies or external services |

### Additional approved boundaries

| Topic | Decision |
|-------|----------|
| Database / persistence | **Deferred** to a later milestone |
| Production authentication | **Deferred** to a later milestone |
| Current authentication | Continue to describe accurately as **DEMO-ONLY** |
| Security claims | Do **not** present the app as production-secure |
| Email / SMS / re-send | **Out of scope** |
| Feature expansion | No new product features in M15 |

---

## 1. Purpose

Make the post–Milestone 14 application a coherent, **sellable V1 demo**: documentation matches reality, demo-facing UI does not advertise unfinished core features, and customer summary metrics stay honest against live quotes — while preserving the demo session architecture and a clean path to production persistence/auth later.

Primary outcomes:

1. Living roadmap docs (`README.md`, `docs/README.md`) reflect M1–M14 completion and the demo-complete vs production-ready boundary.
2. Customer quote aggregates (`totalQuotes`, `draftQuotes`, `acceptedQuotes`, `lastQuoteDate`, `recentQuotes`) are derived from live `QuoteSession` data.
3. Nonfunctional global Search / “Soon” stub is removed from the Top Bar.
4. Stale Settings copy that claims PDF is a “later milestone” is corrected.
5. Demo seed data is verified against Product Spec §15.2 (fix only if materially wrong).
6. A short sellable-demo smoke checklist is documented for Admin and Office Staff demos.
7. Auth remains clearly DEMO-ONLY; no DB; no production auth; no new features.

---

## 2. Why this milestone is next

| Evidence | Detail |
|----------|--------|
| Spec §15.4 | Demo V1 success criteria are met at feature depth after M5–M14 |
| Spec §14.2 / §6.3 | Real auth and database belong to production-ready phase, not demo-complete |
| M14 closed | Live Dashboard, Sent-only auto-expire, dirty nav, provider RBAC |
| Remaining gaps | Docs/copy honesty and customer aggregate sync — not missing modules |
| Strategy | Sellable demo without overengineering; freeze demo before persistence/auth |

**Conclusion:** M15 is documentation + demo readiness polish, not a platform milestone.

---

## 3. Product Spec requirements involved

| Spec | Relevance |
|------|-----------|
| §15.4 Version 1 success criteria | Confirm demo-complete flows remain intact |
| §15.2 Seed data | Verify counts / status mix; correct only if material |
| §7 Customer fields / summary | Aggregates must reflect operational quotes |
| §11 Dashboard / Needs Attention | Keep filter-based deep links (**E2**) |
| §14.2 Authentication timing | Demo auth OK for demos; production auth later |
| §15.3 Out of scope | No email, portal, audit trail, etc. |
| §24 Roadmap Alignment | **Do not modify** in M15 (**D1**) |

---

## 4. Current-state analysis (post-M14)

### Complete for current demo architecture

- Demo login (Admin / Office Staff), Sign Out, route gates, capability helpers
- Users (Admin), Customers, Quotes, Builder, Catalog, Settings, PDF freeze
- Dashboard live on `QuoteSession`
- Sent-only auto-expiration; Draft past Valid Until stays editable
- Archive/restore via lists (no dedicated Archive page)
- Shared dirty-navigation guard
- Deployed to Vercel production

### Partially complete / demo honesty gaps

- Customer aggregates still seeded statically in `CustomerSession` / `demo-data.ts`
- Settings PDF section still says PDF arrives in a later milestone
- Top Bar global Search “Soon” stub is nonfunctional
- Living README roadmaps are stale

### Not implemented (intentionally later)

- Database persistence
- Production authentication / server authorization
- Email delivery / re-send

### Intentionally out of V1 (Spec §15.3)

- Multi-tenant, CRM expansion, invoicing, scheduling, portal, e-sign, AI, audit trail, notifications product, etc.

---

## 5. Exact scope

### In scope

1. **Documentation freeze (living docs only)**
   - Update root `README.md` checklist and narrative for M1–M14 reality
   - Update `docs/README.md` similarly
   - Clearly label: demo-complete V1 demo vs production-ready (DB + real auth later)
   - State that authentication is **DEMO-ONLY**
   - Add a short sellable-demo smoke checklist (Admin + Staff)
   - Do **not** edit Spec §24 or rewrite historical M13/M14 plans for checkboxes

2. **Customer quote aggregate sync (B1)**
   - Derive customer aggregate fields from live quotes in `QuoteSession`
   - Keep existing Customer type fields; no schema expansion for production DB
   - Update when quotes change (create/update/status/archive/duplicate/auto-expire) and on session ready

3. **Remove global Search / “Soon” stub (G2)**
   - Remove the nonfunctional Top Bar search placeholder UI
   - Do **not** implement global search
   - Leave layout balanced (do not invent a replacement feature)

4. **Stale Settings PDF copy**
   - Replace “PDF generation arrives in a later milestone” with accurate shipped wording

5. **Demo seed verification**
   - Audit customers (10), catalog (15), quotes (15), status mix vs Spec §15.2
   - Correct seed data only if materially wrong for demos
   - After aggregate sync, customer totals must match live quote membership (not stale seed aggregates)

6. **Explicit deferrals recorded in this plan / living docs**
   - DB, production auth, email/re-send, Archive page, profile pictures, global search, M14 Mediums

### Explicit out of scope

- Database / durable persistence
- Production authentication and credential hashing
- Server-side authorization / auth middleware as a security model
- Email / SMS / re-send
- Dedicated Archive page (**C2**)
- Quote-specific Needs Attention deep links (**E2**)
- Global search implementation (**G2**)
- Profile picture upload
- Notifications product (disabled bell may remain; do not build notifications)
- New product features, broad redesigns, new dependencies (**I1**)
- Spec §24 edits (**D1**)
- Auto-fixing deferred M14 Medium/Low findings (**H1**)
- Claiming production security

---

## 6. User workflows affected

| Workflow | Change |
|----------|--------|
| Open Customers / customer summary | Totals and recent quotes match live QuoteSession |
| Create / status / archive / duplicate quotes | Customer aggregates update in-session |
| Top Bar | No Search “Soon” stub; remaining chrome unchanged except layout cleanup |
| Settings → PDF defaults | Copy no longer implies PDF is unshipped |
| Demo script / onboarding via README | Accurate milestone and DEMO-ONLY auth language |
| Needs Attention | Unchanged filter links |
| Archive | Unchanged list/filter behavior |

---

## 7. Screens / components affected

| Area | Change |
|------|--------|
| Top Bar | Remove Search / Soon stub block |
| Customers list / summary | Consume synced aggregates (likely no visual redesign) |
| Customer session (+ possibly quote session bridge) | Aggregate sync logic |
| Settings view | PDF section copy |
| README / docs README | Roadmap + demo checklist |
| Demo seed files | Only if audit requires |

**Not affected by design:** Dashboard widgets (except they already share QuoteSession), Builder flows, PDF renderer, Users, Catalog manage UX.

---

## 8. Customer aggregate synchronization approach (B1)

### Fields to keep in sync

From `Customer` (`src/types/customer.ts`):

- `totalQuotes`
- `draftQuotes`
- `acceptedQuotes`
- `lastQuoteDate`
- `recentQuotes` (`id`, `number`, `status`, `date`, `total`)

### Source of truth

- Quotes: `QuoteSession` (post auto-expire)
- Match quotes to customers via `quote.customer.customerId` (or equivalent snapshot id field already used in quote model)
- **Recommended counting rule for V1 demo:** include **non-archived** quotes only in totals / recent list (archived quotes remain discoverable via Quotes archived filters, not customer “active” totals). If seed/product copy already counted archived, document the chosen rule in the PR summary and keep UI consistent.

### Implementation shape (illustrative)

1. Add a pure helper e.g. `src/lib/customers/quote-aggregates.ts`:
   - `buildCustomerQuoteAggregates(customerId, quotes) → aggregate fields`
   - `applyQuoteAggregatesToCustomers(customers, quotes) → customers`
2. Apply after QuoteSession is ready and whenever quotes commit.
3. Prefer updating customers from a single place to avoid drift:
   - **Preferred:** QuoteSession (or a thin effect in a parent that has both sessions) calls into CustomerSession with recomputed aggregates after quote commits / seed.
   - **Acceptable alternative:** Customers view/provider recomputes derived display values from quotes without persisting — but list sorting by `totalQuotes` already uses stored fields, so **persisting synced fields on the customer records in session** is preferred for consistency.
4. New customer create: start aggregates at zeros; they update when quotes appear.
5. Do not invent fake recent quotes in customer demo seed after sync ships — seed aggregates may be zeroed or omitted as authoritative, with sync overwriting on boot.

### Non-goals for aggregates

- No SQL / DB views
- No changing Spec customer field set
- No customer portal “activity feed” redesign

---

## 9. Exact Search / “Soon” UI being removed (G2)

**Location:** `src/components/layout/top-bar.tsx`

**Current UI (remove this block):**

- Center Top Bar container (`max-w-md` flex-1) containing a non-interactive `role="search"` element
- Label: `aria-label="Global search (coming soon)"`
- Placeholder text: `Search customers & quotes…`
- Badge: `Soon`
- Associated `IconSearch` usage for that stub only

**Do not:**

- Implement search
- Replace with another fake feature
- Remove Company Settings icon, Sign Out, or (unless required for layout) the disabled notifications control — notifications remain a separate future stub; M15 only requires removing the Search/Soon stub per **G2**

**Layout after removal:** Keep Top Bar balanced (company identity left, actions right). Avoid a large empty center hole — collapse/remove the center flex spacer as needed for a clean sellable chrome.

---

## 10. Demo seed-data verification approach

Against Product Spec §15.2:

| Requirement | Check |
|-------------|-------|
| Customers | Count = 10 active seed customers (or Spec-intended set) |
| Catalog | Count = 15 items |
| Quotes | Count = 15 |
| Status mix | 4 Draft, 3 Sent, 4 Accepted, 2 Rejected, 2 Expired (evaluate **after** M14 Sent-only auto-expire on “today”) |

Process:

1. Inventory `src/lib/customers/demo-data.ts`, `src/lib/catalog/demo-data.ts`, `src/lib/quotes/demo-data.ts` (and any related seeds).
2. Note Valid Until dates that would auto-expire Sent quotes on demo “today”.
3. If mix is wrong after auto-expire, adjust seed dates/statuses **minimally** so a fresh session matches Spec intent for demos.
4. After aggregate sync, spot-check 2–3 customers: totals/recent quotes equal QuoteSession membership.
5. Do not add an in-app “Reset demo data” control (Spec: reseed via dev tools only).

---

## 11. Data-model implications

- No new production entities
- No DB migrations
- Customer aggregate fields remain session-denormalized display fields, now **maintained from quotes**
- Auth model unchanged (DEMO-ONLY)

---

## 12. Integration with existing modules

```text
QuoteSession (SoT for quotes, incl. auto-expire)
    → aggregate helper
    → CustomerSession customer fields updated

TopBar
    → remove Search/Soon stub

Settings
    → copy fix only

README / docs/README
    → roadmap + DEMO-ONLY + smoke checklist
```

Dashboard already uses QuoteSession — no change required for **E2**.

---

## 13. RBAC implications

- No new capabilities
- Aggregate sync is data honesty, not a permission change
- Staff and Admin both see accurate customer totals for customers they can already view
- Continue DEMO-ONLY labeling; client gates are not production security

---

## 14. Validation / error / empty / loading

- Aggregates: empty recent list when no matching quotes; totals show `0`
- No new error dialogs expected
- Session `ready` gates already exist — ensure aggregates apply after both customer + quote sessions are ready to avoid flash of seed lies if practical (smallest safe approach)

---

## 15. Responsive behavior

- Top Bar without center search must remain usable on mobile (menu, actions)
- No layout redesign beyond Search stub removal

---

## 16. Accessibility considerations

- Removing `role="search"` stub eliminates a misleading search landmark
- Do not leave orphaned “coming soon” search affordances
- Preserve existing focus order for remaining Top Bar controls

---

## 17. Security considerations

- Auth remains **DEMO-ONLY** (plaintext demo credentials in-browser; sessionStorage user id)
- Documentation must not claim production security
- No new secrets, env vars, or auth providers in M15

---

## 18. Demo vs production considerations

| Layer | M15 |
|-------|-----|
| Demo session stores | Keep (**F1**) |
| Demo auth | Keep; label DEMO-ONLY |
| Database | Later milestone |
| Production auth | Later milestone |
| Sellable demo | Goal of M15 |

---

## 19. Implementation phases

### Phase 0 — Confirm baseline (no product changes)

- Confirm `main` @ `8c8ddcc…`, clean tree, production URL
- Re-read this plan and approved decisions A–I

### Phase 1 — Living documentation

- Update `README.md` and `docs/README.md`
- Add demo-complete vs production-ready note + DEMO-ONLY auth language
- Add short Admin/Staff smoke checklist
- Do not touch Spec §24

### Phase 2 — Top Bar Search/Soon removal

- Remove Search stub from `top-bar.tsx`
- Adjust spacing so chrome remains clean on desktop/mobile
- Confirm Settings link / Sign Out / menu unchanged

### Phase 3 — Settings PDF copy

- Fix stale “later milestone” PDF wording in `settings-view.tsx`

### Phase 4 — Customer aggregate sync

- Implement pure aggregate helper
- Wire QuoteSession → CustomerSession sync (boot + quote commits)
- Neutralize misleading static seed aggregates as needed
- Verify Customers list sort by quote count and customer summary cards

### Phase 5 — Seed audit

- Verify Spec §15.2 counts/mix (post auto-expire)
- Minimal seed fixes if required
- Spot-check aggregates against quotes

### Phase 6 — Verification

- Lint + production build
- Browser checklist (below)
- Multi-Model Review only if requested later; do not expand scope from new nits unless blocking

### Phase 7 — Stop for commit approval

- No commit/push/deploy until explicitly approved

---

## 20. Dependencies

- None new (**I1**)
- Relies on existing QuoteSession, CustomerSession, Top Bar, Settings, demo seeds

---

## 21. Testing / browser checklist

### Documentation

- [ ] README / docs README show M1–M14 complete for demo modules
- [ ] DEMO-ONLY auth called out; no “production-secure” claim
- [ ] Demo vs production-ready (DB/auth later) stated
- [ ] Spec §24 unchanged

### Top Bar

- [ ] No “Search customers & quotes…” stub
- [ ] No “Soon” search badge
- [ ] Mobile menu + Sign Out + Settings (Admin) still work

### Settings

- [ ] PDF section copy does not say PDF is unshipped

### Aggregates

- [ ] Customer summary totals match that customer’s non-archived quotes
- [ ] Create quote for customer → totals increment
- [ ] Mark Accepted → accepted count updates; Draft count updates appropriately
- [ ] Archive quote → excluded from customer totals (per chosen rule)
- [ ] Auto-expired Sent → status reflected in recent quote row
- [ ] Staff and Admin both see synced values

### Seeds / demo

- [ ] Fresh load: customer/catalog/quote counts align with Spec intent
- [ ] Status mix acceptable for demos after auto-expire

### Regression (smoke)

- [ ] Login Admin / Staff (DEMO-ONLY)
- [ ] Dashboard live metrics still move with quote changes
- [ ] Builder dirty leave still prompts
- [ ] PDF preview / Final still works
- [ ] Staff blocked from Settings/Users
- [ ] No package.json changes

---

## 22. Success criteria

M15 is complete when:

1. Living roadmap docs accurately describe the demo V1 state and DEMO-ONLY auth.
2. Spec §24 remains unmodified.
3. Global Search / “Soon” stub is gone.
4. Settings PDF copy is accurate.
5. Customer aggregates reflect live QuoteSession state across create/status/archive/expire flows.
6. Seed data is verified (and minimally corrected if needed) against Spec §15.2 intent.
7. Lint and production build pass.
8. Browser smoke checklist passes.
9. No new dependencies; no DB; no production auth; no email/re-send; no Archive page; no quote-id attention deep links.
10. Working tree ready for a focused commit **only after** Nicholas approves commit.

---

## 23. Risks / migration concerns

| Risk | Mitigation |
|------|------------|
| Seed aggregates disagree with quotes after sync | Overwrite from quotes on ready; fix seeds if IDs don’t line up |
| Flash of wrong totals before sync | Apply sync as soon as both sessions ready |
| Counting archived quotes differently than users expect | Document non-archived rule; stay consistent in UI |
| Top Bar looks empty after search removal | Collapse center region; keep left/right chrome |
| Scope creep into DB/auth | Hard out-of-scope; stop and ask |
| Touching Spec §24 by habit | Explicitly forbidden (**D1**) |

---

## 24. Files likely affected (illustrative only)

### Documentation (expected)

- `docs/milestone-15-implementation-plan.md` (this file)
- `README.md`
- `docs/README.md`

### Application (expected during implementation — not yet)

- `src/components/layout/top-bar.tsx` — remove Search/Soon stub
- `src/components/settings/settings-view.tsx` — PDF copy
- `src/lib/customers/quote-aggregates.ts` — **new** helper (name may vary)
- `src/components/session/customer-session-provider.tsx` — accept/apply aggregates
- `src/components/session/quote-session-provider.tsx` and/or app provider wiring — trigger sync
- Possibly `src/lib/customers/demo-data.ts` / `src/lib/quotes/demo-data.ts` — seed audit fixes only
- Possibly light touches to `src/components/customers/*` if display assumptions change

### Must not change

- `package.json`, `package-lock.json`
- `docs/01 - Product Specification.md` §24 (and avoid Spec rewrites)
- Historical M13/M14 plans (checkbox archaeology)

---

## 25. Implementation gate

**This document finalizes planning only.**

Do **not** begin application implementation until Nicholas explicitly approves starting Milestone 15 implementation.

When implementation is approved, follow Phases 0–7 above, then stop again for commit/push approval.
