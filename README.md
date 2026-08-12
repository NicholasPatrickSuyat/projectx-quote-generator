# Quote Generator Pro

Professional quote generation for service businesses such as HVAC, plumbing, roofing, electrical, and construction.

## Status

**Demo-complete V1 (session architecture)** — sellable in-browser demo on Vercel.

| Layer | State |
|-------|--------|
| **Demo-complete** | Core Spec §15.4 workflows work end-to-end in this deployment |
| **Production-ready** | **Not yet** — authentication is **DEMO-ONLY**; production stays on session persistence until later milestones |

**Production demo:** https://projectx-quote-generator.vercel.app/

### Persistence modes (Milestone 17)

| `PERSISTENCE_MODE` | Behavior |
|--------------------|----------|
| `session` (**default**, **production**) | Current demo: Settings, Catalog, Customers, Quotes all in-memory / session |
| `database` (local / approved preview only) | **Settings + Catalog** durable on Neon; Customers / Quotes / Auth remain demo session |

Production must remain `PERSISTENCE_MODE=session` until production authentication (M18+). Database mode is **development / private-preview only** and is **not** production-secure; demo sign-in is not server authorization. Durable Server Actions refuse `APP_ENV=production` and `VERCEL_ENV=production`. Company logo uploads are capped at **512 KB** decoded so they fit the default Server Action body limit after base64 encoding.

See `.env.example` for `DATABASE_URL` / `DATABASE_URL_UNPOOLED`. Optional scripts: `npm run db:migrate`, `npm run db:bootstrap:company`, `npm run db:seed:demo`.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- `@react-pdf/renderer` (quote PDF)
- Drizzle ORM + Neon (optional local/preview persistence)
- Git / GitHub / Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo authentication (DEMO-ONLY)

Credentials are checked in the browser session only. This is **not** production security.

| Role | Email | Password |
|------|-------|----------|
| Admin | `alex.admin@demo.projectx.local` | `DemoAdmin!23` |
| Office Staff | `jordan.staff@demo.projectx.local` | `DemoStaff!23` |

Data (customers, quotes, users) lives in **in-memory session stores** and reseeds on full reload when `PERSISTENCE_MODE=session` (default). Only the demo signed-in user id is kept in `sessionStorage`. In local `database` mode, Company Settings and Service Catalog persist to Neon instead.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Specification](docs/01%20-%20Product%20Specification.md) | Version 1 Approved — product source of truth |
| [UI/UX Planning](docs/02%20-%20UI%20UX%20Planning.md) | Milestone 3 complete — approved wireframes |
| [Design System](docs/03%20-%20Design%20System.md) | Milestone 4 Approved — Project X visual standard |
| [Project Structure](docs/project-structure.md) | Codebase layout and conventions |
| [Milestone 13 plan](docs/milestone-13-implementation-plan.md) | Demo auth + RBAC + Users |
| [Milestone 14 plan](docs/milestone-14-implementation-plan.md) | Cross-module hardening |
| [Milestone 15 plan](docs/milestone-15-implementation-plan.md) | Demo readiness & documentation freeze |

## Roadmap

### Completed (demo architecture)

- [x] Project Initialization
- [x] Product Specification
- [x] UI/UX Planning
- [x] Design System and Visual Style
- [x] Application shell + deployment (Vercel)
- [x] Dashboard (live QuoteSession)
- [x] Customers
- [x] Quotes + Quote Builder
- [x] Service Catalog
- [x] Company Settings
- [x] PDF Preview / Final PDF / frozen snapshots
- [x] Demo authentication + RBAC + User Management (**DEMO-ONLY**)
- [x] Cross-module hardening (auto-expire Sent-only, dirty nav, provider RBAC)
- [ ] Demo readiness polish (docs freeze, customer aggregates, Search stub removal) — Milestone 15 (implemented locally; awaiting commit approval)

### Later (production-ready path — not started)

- [ ] Durable database / persistence
- [ ] Production authentication + server-side authorization
- [ ] Email / SMS delivery (explicitly out of current demo scope)

## Sellable demo smoke checklist

**Admin**

1. Sign in with Admin demo credentials  
2. Dashboard metrics move when you change quote status  
3. Customers → open a customer → totals match that customer’s quotes  
4. New Quote → add lines / catalog → Preview PDF → Mark Sent / Final PDF  
5. Settings + Catalog manage + Users remain available  

**Office Staff**

1. Sign in with Staff demo credentials  
2. Settings and Users are not reachable  
3. Catalog is view/pick only (no manage)  
4. Create/edit quotes; Prepared By is not Staff-editable  
5. Preview PDF still works  

## Notes

- Product Spec §24 historical checklist is intentionally left as written; this README is the living roadmap.
- Do not treat client-side RBAC as production security.
