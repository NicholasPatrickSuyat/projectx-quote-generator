# Milestone 18 — Production authorization matrix (server enforcement)

Source of truth: Server Actions + `src/lib/auth/session.ts` helpers.  
Client RBAC (`capabilitiesForRole`) is UX-only.

## Modes

| Mode | Durable reads | Durable writes |
|------|---------------|----------------|
| `AUTH_MODE=demo` + `PERSISTENCE_MODE=session` | N/A (session stores) | N/A |
| `AUTH_MODE=demo` + `PERSISTENCE_MODE=database` | **Local `APP_ENV=development` only.** Refused on preview/production-like hosts. Hybrid loads without Auth.js when allowed. **Writes refused.** |
| `AUTH_MODE=production` + `PERSISTENCE_MODE=database` | Authenticated active DB user + capability rules below | Authenticated + capability + `auth_version` match |

Non-sensitive metadata (`getPersistencePublicInfo`, `getAuthPublicInfo`) remains unauthenticated by design.

## LOGIN RATE LIMITING = PRODUCTION CUTOVER BLOCKER

No in-app brute-force / rate-limit protection ships in M18.  
Do **not** present the app as fully production-ready until a serverless-safe rate-limit strategy is implemented (M20 hardening).  
Do not add a fake in-memory limiter on Vercel.

## Production mode matrix (`AUTH_MODE=production`)

| Resource / action | Admin | Staff | Unauthenticated | Inactive / revoked JWT |
|-------------------|-------|-------|-----------------|------------------------|
| Settings read | Allow (`canManageSettings`) | Deny | Deny | Deny |
| Settings save | Allow (`canManageSettings`) | Deny | Deny | Deny |
| Catalog read | Allow (any active user) | Allow (any active user) | Deny | Deny |
| Catalog create / edit / duplicate | Allow (`canManageCatalog`) | Deny | Deny | Deny |
| Catalog archive / restore | Allow (`canManageCatalog`) | Deny | Deny | Deny |
| Users list / read | Allow (`canManageUsers`) | Deny | Deny | Deny |
| Users create / edit | Allow (`canManageUsers`) | Deny | Deny | Deny |
| Role change | Allow (`canManageUsers`) + bumps `auth_version` | Deny | Deny | Deny |
| Deactivate | Allow + bumps `auth_version` | Deny | Deny | Deny |
| Reactivate | Allow; **does not** restore old JWT versions | Deny | Deny | Deny |
| Password reset | Allow + bumps `auth_version` | Deny | Deny | Deny |

Company scoping: users are loaded for the authenticated user’s `company_id` only (single-company install). Client-supplied company/role/capabilities are ignored.

## Customers + Quotes (M19 extension)

| Resource / action | Admin | Staff | Unauthenticated | Inactive / revoked JWT |
|-------------------|-------|-------|-----------------|------------------------|
| Customers list / read | Allow (any active user) | Allow (any active user) | Deny | Deny |
| Customer create / update / archive | Allow | Allow | Deny | Deny |
| Customer restore | Allow (`canRestore`) | Deny | Deny | Deny |
| Quotes list / read | Allow (any active user) | Allow (any active user) | Deny | Deny |
| Quote create / update / duplicate / archive | Allow | Allow* | Deny | Deny |
| Mark Sent / Accept / Reject / Return to Draft / PDF freeze | Allow | Allow* | Deny | Deny |
| Quote restore | Allow (`canRestore`) | Deny | Deny | Deny |
| Manual Expire / Reactivate | Allow (`canOverrideQuoteStatus`) | Deny | Deny | Deny |
| Prepared By override | Allow (`canOverridePreparedBy`) | Deny (forced to actor) | Deny | Deny |

\*Staff follow existing lifecycle edit rules; Prepared By is normalized to the authenticated user.

IDs: internal UUID PKs; business numbers `customer_number` / `quote_number` allocated via `entity_counters` inside create transactions.

## Session revocation (`auth_version`)

Incremented on: password reset, role change, deactivation, password change during edit.  
Not decremented on reactivation — prior JWTs stay invalid; user must sign in again.

JWT re-check: Auth.js `jwt` callback compares token `authVersion` to DB (throttled ~30s) when the session is accessed. `SessionProvider` `refetchInterval={30}`. Privileged Server Actions always re-check DB + version immediately.

## Brute-force / rate limiting

**Deferred — PRODUCTION CUTOVER BLOCKER / M20 hardening.**  
No in-memory/serverless-fake limiter shipped. Do not claim brute-force protection exists until an approved infrastructure or DB-backed lockout is implemented.
