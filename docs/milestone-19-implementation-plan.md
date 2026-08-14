# Milestone 19 — Customers + Quotes + PDF Snapshot Persistence

**Status:** IMPLEMENTATION IN PROGRESS  
**Product:** Quote Generator Pro  
**Production URL:** https://projectx-quote-generator.vercel.app/  
**Baseline:** Milestone 18 closed (`7ce4aa3`) — production auth + server authorization available locally; public production remains demo+session.

**Standing constraints until cutover approval:**

- Do not flip public Vercel `AUTH_MODE` / `PERSISTENCE_MODE`
- Do not apply M19 migrations to public production Neon
- Do not push/deploy without separate approval
- Do not start M20
- Keep session/demo Customer + Quote implementations until production cutover is verified

---

## 1. Goal

Move Customers and Quotes (including line items and frozen PDF JSON) from in-memory session stores to durable Neon persistence behind the existing provider façades, with server authorization in production-auth mode, without rewriting approved UX.

Public production remains `AUTH_MODE=demo` + `PERSISTENCE_MODE=session` after M19 code ship. Cutover is a separate milestone/approval (M20 hardening).

---

## 2. Approved decisions (D1–D10)

| ID | Decision |
|----|----------|
| **D1** | Normalized `quote_line_items` for live lines; frozen lines also inside `pdf_snapshot` JSONB. No lines-only JSONB as editable SoT. |
| **D2** | UUID PKs internally. Business identifiers: `customer_number` (`CUST-000001`), `quote_number` (`QUO-000001`). No `LINE-*` display numbers. Unique `(company_id, customer_number)` / `(company_id, quote_number)`. Relationships use UUIDs. |
| **D3** | Per-company `entity_counters` table; atomic allocation in the create transaction. Never reuse numbers. No `max()+1` / `count()+1` without transactional allocation. |
| **D4** | `prepared_by_user_id` nullable FK → `app_users` (`ON DELETE SET NULL`) **and** `prepared_by` text historical/display. Staff cannot spoof; Admin override via existing capability. |
| **D5** | Lazy auto-expire on load/list (+ lifecycle ops). Sent + `valid_until < today` → Expired. Draft never auto-expires. Keep `pdf_snapshot` on expire. No cron. |
| **D6** | Customer edits do **not** rewrite existing quote `customer_snapshot`. Live `customer_id` FK + historical snapshot. |
| **D7** | M19 = code + **non-production** DB verification only. No public cutover / Vercel env changes. |
| **D8** | Keep session/demo backends until cutover verified. Dual façade: session **or** database. |
| **D9** | Full list load into providers (no pagination UI). Company-scoped queries + indexes; interfaces must not preclude future pagination. |
| **D10** | Explicit non-prod seed CLI only; refuse `APP_ENV=production`. No auto-seed. No browser→Neon migration of ephemeral demo data. |

---

## 3. Scope

### In scope

1. Schema + migrations: `customers`, `quotes`, `quote_line_items`, `entity_counters`, `quote_status` enum
2. Repositories + Server Actions with transactions for multi-record ops
3. Customer/Quote provider database façades (preserve session path)
4. Lifecycle, numbering, Prepared By, auto-expire, PDF snapshot durability
5. Dashboard/aggregates continue via QuoteSessionProvider
6. Auth matrix extension for Customers/Quotes
7. Non-prod migrate + seed + local E2E; restore demo+session locally
8. Docs / hybrid notice updates

### Out of scope

- Public production cutover; Vercel env flips
- Login rate limiting (M20 blocker)
- PDF object storage; pagination UI; hard deletes; audit trail
- Removing session/demo Customer/Quote code
- M20 implementation

---

## 4. Domain model adjustments (UUID + display numbers)

Session and database modes share one domain shape:

| Domain field | Meaning |
|--------------|---------|
| `Customer.id` | UUID (internal) |
| `Customer.customerNumber` | `CUST-000001` (UI / deep links) |
| `Quote.id` | UUID (routes, keys) |
| `Quote.quoteNumber` | `QUO-000001` (UI / PDF quote id display) |
| `QuoteLineItem.id` | UUID |
| `QuoteCustomerSnapshot.customerId` | Customer UUID |
| `QuoteCustomerSnapshot.customerNumber` | Display id in snapshot/PDF |
| `CustomerRecentQuote.id` | Quote UUID |
| `CustomerRecentQuote.number` | `quoteNumber` |

Deep links keep `?customer=CUST-…` and resolve by `customerNumber`.

Derived aggregates remain computed (not persisted): `totalQuotes`, `draftQuotes`, `acceptedQuotes`, `lastQuoteDate`, `recentQuotes`.

---

## 5. Schema (exact direction)

### Enums

- `quote_status`: Draft | Sent | Accepted | Rejected | Expired  
- Reuse `catalog_category` for line categories  
- Reuse `discount_type`

### `entity_counters`

`(company_id, entity_type)` PK — types: `customer`, `quote` — `next_value`, `updated_at`

### `customers`

UUID PK; `company_id`; `customer_number`; identity/address/notes; archive flags; timestamps.  
Unique `(company_id, customer_number)`. No aggregate columns.

### `quotes`

UUID PK; `company_id`; `quote_number`; `customer_id` → customers; `customer_snapshot` jsonb; header/lifecycle/money cents; `prepared_by_user_id` SET NULL; `prepared_by` text; `pdf_snapshot` jsonb nullable.  
Unique `(company_id, quote_number)`.

### `quote_line_items`

UUID PK; `company_id`; `quote_id` CASCADE; category; description; **decimal quantity**; unit; unit_price_cents; line_total_cents; internal_notes; sort_order; timestamps.

### Money / quantity

- Money: integer cents (match catalog/settings)  
- Quantity: `numeric` with sufficient scale (preserve decimal quantities; do not coerce to int)  
- Discount value: `numeric` (percent or fixed dollars representation, same as settings)

---

## 6. Transactions

Required atomic ops:

- Create quote: allocate number + insert quote + insert lines  
- Update quote: update header + reconcile lines  
- Duplicate: allocate + Draft + new line UUIDs + clear snapshot/lifecycle  
- Mark Sent / Final: validate + freeze `pdf_snapshot` + lifecycle  
- Return to Draft / Reactivate: lifecycle + clear snapshot  

Use Drizzle interactive transactions (Neon serverless Pool). Fail the whole unit if any step fails.

---

## 7. Authorization (production DB mode)

Unauthenticated / inactive: **deny all** private Customer/Quote reads and writes.  
Company scope from authenticated DB user only. Ignore client `company_id` / role / capabilities / actor id.

| Resource | Admin | Staff |
|----------|-------|-------|
| Customers read/create/update/archive | ✓ | ✓ |
| Customer restore | ✓ | ✗ |
| Quotes read/create/update/duplicate/archive/Mark Sent/Accept/Reject/Return to Draft/PDF | ✓ | ✓ |
| Quote restore | ✓ | ✗ |
| Manual Expire / Reactivate | ✓ | ✗ |
| Prepared By override | ✓ | ✗ |

Demo+database: local development only; durable writes still require `AUTH_MODE=production`.

---

## 8. PDF / snapshots

- Preview: live quote + current settings  
- Final: `pdf_snapshot` JSONB (includes frozen line items)  
- Previously sent quotes regenerate Final PDF from snapshot even if Settings fail to load  
- No file/object storage in M19  
- Return to Draft / Reactivate clears freeze per existing mutations  
- Expire preserves snapshot  

---

## 9. Phases

1. Schema + migration + counters  
2. Customer repository + Server Actions  
3. Quote / line-item repository + transactions  
4. Customer provider database façade  
5. Quote provider database façade  
6. Lifecycle / numbering / Prepared By / auto-expiration  
7. PDF snapshot durability  
8. Dashboard / aggregate regression  
9. Seed + docs  
10. Production-auth local E2E + demo/session regression  

Then: lint/build, read-only multi-model security review, pre-commit report — **stop for approval** (no commit/push/deploy).

---

## 10. Relationship to M20

M19 makes durable Customers/Quotes possible.  
M20 (if required): login rate limiting (cutover blocker), production env flip, prod migrations, empty operational data, retire demo plane after verified cutover.

---

## 11. Non-goals reminder

Do not silently round decimal quantities.  
Do not persist customer aggregates as SoT.  
Do not rewrite historical `customer_snapshot` on customer edit.  
Do not auto-seed production or migrate browser session data into Neon.
