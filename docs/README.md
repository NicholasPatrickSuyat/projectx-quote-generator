# Documentation

Project documentation for Quote Generator Pro.

| Document | Description |
|----------|-------------|
| [01 - Product Specification](./01%20-%20Product%20Specification.md) | **Version 1 Approved** — product source of truth |
| [02 - UI UX Planning](./02%20-%20UI%20UX%20Planning.md) | **Milestone 3 complete** — approved wireframes |
| [03 - Design System](./03%20-%20Design%20System.md) | **Milestone 4 Approved** — Project X visual standard |
| [project-structure.md](./project-structure.md) | Folder layout and conventions |
| [milestone-13-implementation-plan.md](./milestone-13-implementation-plan.md) | Demo auth + RBAC + Users (**DEMO-ONLY**) |
| [milestone-14-implementation-plan.md](./milestone-14-implementation-plan.md) | Cross-module hardening & integration |
| [milestone-15-implementation-plan.md](./milestone-15-implementation-plan.md) | V1 demo readiness & documentation freeze |
| [milestone-16-implementation-plan.md](./milestone-16-implementation-plan.md) | Production architecture planning (closed) |
| [milestone-17-implementation-plan.md](./milestone-17-implementation-plan.md) | Production persistence foundation (Settings + Catalog) |
| [milestone-18-implementation-plan.md](./milestone-18-implementation-plan.md) | Production authentication + server authorization |
| [milestone-18-authorization-matrix.md](./milestone-18-authorization-matrix.md) | Production server authorization matrix + session revocation |

## Status

| Layer | Meaning |
|-------|---------|
| **Demo-complete** | Spec §15.4 office workflows are implemented on the current **session** architecture and deployed for demos |
| **Production-ready** | **Not yet** — public production remains `AUTH_MODE=demo` + `PERSISTENCE_MODE=session` until deliberate cutover |

Default authentication is **DEMO-ONLY** (`AUTH_MODE=demo`). Production Auth.js + `app_users` is available when `AUTH_MODE=production` (local/non-production cutover testing only until separately approved).

### Auth + persistence cutover (M17/M18)

| Mode combo | Behavior |
|------------|----------|
| `AUTH_MODE=demo` + `PERSISTENCE_MODE=session` | Public demo (default) |
| `AUTH_MODE=demo` + `PERSISTENCE_MODE=database` | **Local `APP_ENV=development` only** — refused on preview/production hosts |
| `AUTH_MODE=production` + `PERSISTENCE_MODE=database` | Auth.js + DB users; capability-gated Settings/Catalog/Users |

Customers / Quotes remain session until M19.

## Completed milestones (implementation)

- Milestone 3 — UI/UX Planning  
- Milestone 4 — Design System and Visual Style  
- Milestone 5 / 5.5 — Application shell + Vercel deployment  
- Milestone 6 — Dashboard  
- Milestone 7 — Customers  
- Milestone 8–9 — Quotes + Quote Builder  
- Milestone 10 — Service Catalog  
- Milestone 11 — Company Settings  
- Milestone 12 — PDF Preview / Final / frozen snapshots  
- Milestone 13 — Demo authentication + RBAC + Users  
- Milestone 14 — Cross-module hardening (live Dashboard, Sent-only auto-expire, dirty nav, provider RBAC)  
- Milestone 15 — Demo readiness & documentation freeze  
- Milestone 16 — Production architecture planning  
- Milestone 17 — Persistence foundation (Settings + Catalog; production stays session)  
- Milestone 18 — Production auth + server authorization — **implemented locally; awaiting approval** (no public cutover)

## Explicitly deferred

- Public production auth/database **cutover** (separate approval; do not flip Vercel env yet)  
- Customers / Quotes / PDF snapshot durability (M19)  
- Email / SMS / re-send  
- Dedicated Archive page (list filters suffice for V1 demo)  
- Global search / notifications product  

**Do not rewrite Product Specification §24** merely to update historical checkboxes — the living status lives here and in the root `README.md`.
