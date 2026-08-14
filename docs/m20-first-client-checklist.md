# First-client deployment checklist

Concise ops list for deploying Quote Generator Pro to a real business.

## Architecture

- [ ] Separate **client Vercel** project
- [ ] Separate **client Neon** project (empty)
- [ ] Sales demo left on `projectx-quote-generator.vercel.app` (demo+session)
- [ ] Ownership noted: client-owned **or** Project-X-managed (billing, domain, backups, support)

## Gate 2 (after Gate 1 approval)

- [ ] Neon recovery capability verified for the selected plan
- [ ] Migrate `0000`–latest
- [ ] Bootstrap company + Settings (`ALLOW_PRODUCTION_BOOTSTRAP=1` then clear)
- [ ] Bootstrap first Admin (interactive password)
- [ ] Confirm empty Catalog / Customers / Quotes
- [ ] Set production env (no probes, no demo)
- [ ] Deploy client project
- [ ] Admin + Staff login
- [ ] Settings / Catalog / Customer / Quote / PDF / RBAC smoke
- [ ] Rate-limit smoke
- [ ] Custom domain (optional after `*.vercel.app` OK)
- [ ] 7-day log watch

## Never

- [ ] Mix client data into sales demo or dev Neon
- [ ] Auto-seed HVAC/demo catalog
- [ ] Commit secrets
- [ ] Cut over without Nicholas Gate 2 approval
