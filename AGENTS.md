<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 app named Quote Generator Pro. Package manager is npm (`package-lock.json`). Node 22 works. Dependencies are refreshed automatically by the startup update script (`npm install`).

Standard commands live in `package.json` scripts: `npm run dev` (dev server, http://localhost:3000), `npm run lint`, `npm run build`, `npm run start`.

Non-obvious notes:
- The app is UI-shell only so far (Dashboard, Customers, Quotes, Service Catalog, Settings are placeholder pages). No database, auth, env vars, or external services are required to run or test it.
- No automated test framework is configured yet (no `test` script). "Testing" today means running the dev server and exercising the UI.
- `next dev`/`next build` may rewrite `package-lock.json` optional-dep metadata (`libc` fields) and re-add the `nextjs-agent-rules` block above; these are benign — either commit them with your work or `git checkout` to keep the tree clean.
