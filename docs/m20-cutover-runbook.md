# M20 Gate 2 — Client production cutover runbook

**DO NOT EXECUTE during Gate 1.** Requires Nicholas’s explicit Gate 2 approval.

Sales demo `projectx-quote-generator.vercel.app` stays `AUTH_MODE=demo` + `PERSISTENCE_MODE=session`.

## Preconditions

- [ ] Gate 1 hardening merged and approved
- [ ] Rate limiting live and tested on non-prod
- [ ] Separate **client** Vercel project created (empty)
- [ ] Separate **client** Neon project created (empty — not the M17–M19 dev DB)
- [ ] Neon plan recovery capability **verified** (see `m20-backup-recovery.md`)
- [ ] Secrets ready: `AUTH_SECRET`, pooled + unpooled DB URLs
- [ ] Client company name + first Admin email agreed
- [ ] Responsibility sheet: billing, domain, backups, support (client-owned or PX-managed)

## Ordered steps

1. **Migrate** client Neon with `DATABASE_URL_UNPOOLED` → apply `0000`–latest (including login rate limits).
2. **Bootstrap company**  
   `ALLOW_PRODUCTION_BOOTSTRAP=1 APP_ENV=production PERSISTENCE_MODE=database npm run db:bootstrap:company`  
   Clear the allow flag after success.
3. **Bootstrap Admin** (interactive password preferred)  
   `ALLOW_PRODUCTION_BOOTSTRAP=1 … npm run db:bootstrap:admin`  
   Never leave `BOOTSTRAP_ADMIN_PASSWORD` in Vercel env.
4. **Verify empty data:** zero Customers, zero Quotes, Catalog empty (unless client requested explicit seed — still not demo HVAC auto-seed).
5. **Configure client Vercel env:**  
   `APP_ENV=production`  
   `AUTH_MODE=production`  
   `PERSISTENCE_MODE=database`  
   `AUTH_SECRET`  
   `DATABASE_URL`  
   `DATABASE_URL_UNPOOLED` (ops only if needed)  
   `AUTH_URL` as required  
   Probes **unset** / `0`
6. **Deploy** client project from approved `main` SHA.
7. **Smoke:** Admin login, create Staff, Settings, Catalog item, Customer, Quote, Mark Sent, Final PDF, archive/restore RBAC, rate-limit check, hard refresh.
8. **Optional:** attach custom domain after `*.vercel.app` verification.
9. **Watch logs** 7 days (`m20-monitoring.md`).

## Must never happen

- Pointing client prod at the development Neon
- Enabling demo auth on the client project
- Running `db:seed:*` against client prod
- Enabling `M18_AUTH_PROBE` / `M19_AUTH_PROBE` on client prod
- Treating sales demo deploy as the client
