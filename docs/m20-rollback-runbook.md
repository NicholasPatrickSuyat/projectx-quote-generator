# M20 — Rollback runbook (Gate 2)

Use when a client cutover or post-cutover deploy fails.

## Prefer reversible steps

| Situation | Action |
|-----------|--------|
| Bad application deploy | **Vercel Instant Rollback** on the **client** project to previous good SHA |
| Bad env var | Fix env → redeploy; do **not** flip client project to `AUTH_MODE=demo` |
| Auth misconfig | Rollback deploy; verify `AUTH_SECRET` / `AUTH_URL` / mode combo |
| Failed migration mid-apply | Stop traffic; **forward-fix** with a new migration — do not edit applied history |
| Data corruption | Neon restore/PITR **if plan supports it** (verified at cutover); communicate data-loss window |
| Abandon cutover before real usage | Leave Neon; keep prior deployment; sales demo unaffected |

## When rollback is unsafe

- Client already created substantial real quotes/customers and a Neon restore would wipe them — prefer forward-fix.
- Schema migrated forward and old code cannot read new columns — deploy fixed code, don’t silently env-downgrade.

## Demo project

`projectx-quote-generator.vercel.app` is **not** a rollback target for client data. Keep it on demo+session.

## Forward-fix option

1. Reproduce on non-prod.
2. Ship fix to `main`.
3. Deploy client project.
4. If data fix needed, controlled SQL/migration with backup point first.
