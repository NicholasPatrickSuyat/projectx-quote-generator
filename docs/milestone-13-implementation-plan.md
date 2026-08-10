# Milestone 13 — Implementation Plan (Approved)

**Status:** Approved for implementation  
**Scope:** Authentication + RBAC + User Management (F1 + F8)  
**Auth mode:** Session-only **DEMO** authentication (not production security)

---

## Final decisions

| ID | Decision |
|----|----------|
| A | **A1** — Auth + RBAC + User Management |
| B | **B1** — Session-only demo auth; no real auth dependency; replaceable architecture |
| C | **C2** — No Dashboard QuoteSession wiring; no auto-expiration in M13 |
| D | **D1** — `preparedBy` stays a display string; default from logged-in name; Staff read-only; Admin override |
| E | **E1** — Minimal attribution (Prepared By only); no audit log; no entity-wide createdBy/updatedBy |
| F | **F1** — Design System + existing app patterns for Login and Users |
| G | **G1** — Always retain at least one active Admin |
| H | **H1** — Staff: hide Settings nav + top-bar link; block `/settings` (no read-only) |
| I | **I1** — Re-send out of scope |
| J | **J1** — No new dependencies |

---

## Demo credentials (document in implementation summary)

| Role | Email | Password |
|------|-------|----------|
| Admin | `alex.admin@demo.projectx.local` | `DemoAdmin!23` |
| Office Staff | `jordan.staff@demo.projectx.local` | `DemoStaff!23` |

These are fake demo values only — not production secrets.

---

## Architecture principles

1. Label demo auth clearly in code (`DEMO`, comments, module names).
2. Do not claim client-side guards are production security.
3. Centralize permissions in capability helpers (`canManageUsers`, `canManageSettings`, `canManageCatalog`, `canOverrideQuoteStatus`, `canRestore`, `canOverridePreparedBy`).
4. Keep UI/RBAC replaceable: real server auth later should swap the auth session provider without rewriting feature screens.
5. Profile picture: data model future-ready; upload UI deferred if it expands scope.

---

## Out of scope (M13)

- Dashboard live QuoteSession sync
- Automatic quote expiration
- Shared popstate / cross-route dirty navigation guards (Sign Out uses a lightweight dirty registry only; full shared guard is a hardening milestone)
- Email / Resend workflow
- Real auth libraries / hashed production credentials
- Database persistence
- Audit trail / createdBy-updatedBy everywhere

---

## Success criteria

- Demo login for Admin and Office Staff; inactive cannot sign in
- Sign out clears demo session → Login
- Unauthenticated → Login; authenticated on Login → Dashboard
- No Admin UI flash while auth loading
- Staff blocked from Settings and Users (nav + direct URL)
- Catalog manage Admin-only; Staff view/use only
- Users CRUD + soft deactivate + last-Admin protection
- Prepared By defaults and role editability
- Capability helpers drive gates
- Lint + production build clean; browser-tested; Multi-Model Review before commit
