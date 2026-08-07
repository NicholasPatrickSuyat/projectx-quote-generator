# Quote Generator Pro — Project Structure

This document describes the foundation layout for long-term scalability.

## Overview

```text
Quote Generator/
├── docs/                 # Project documentation
├── public/               # Static assets served as-is
├── src/
│   ├── app/              # Next.js App Router (routes, layouts, pages)
│   ├── components/       # Shared, reusable UI components
│   ├── hooks/            # Shared React hooks
│   ├── lib/              # Shared libraries and configuration helpers
│   ├── services/         # External API / integration clients (future)
│   ├── types/            # Shared TypeScript types and interfaces
│   └── utils/            # Pure utility helpers
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── postcss.config.mjs    # PostCSS / Tailwind pipeline
└── tsconfig.json         # TypeScript configuration
```

## Folder purposes

| Path | Purpose |
|------|---------|
| `src/app/` | Routing, layouts, and page entry points (App Router). |
| `src/components/` | Presentational and shared UI building blocks. |
| `src/hooks/` | Reusable React hooks shared across features. |
| `src/lib/` | App-level helpers (formatting config, constants wiring, etc.). |
| `src/services/` | Reserved for API clients and third-party integrations. |
| `src/types/` | Shared TypeScript contracts used by multiple modules. |
| `src/utils/` | Small, pure helper functions with no framework coupling. |
| `docs/` | Architecture notes, setup guides, and milestone docs. |
| `public/` | Images, icons, and other static files. |

## Conventions

- Prefer `@/` path alias imports (mapped to `src/`).
- Keep domain logic out of `app/` route files as features grow; move it into `components/`, `services/`, `lib/`, or feature modules.
- Do not place secrets in the repo. Use environment variables when integrations are added.

## Current milestone status

Milestone 1 initializes the application foundation only:

- No authentication
- No database
- No business/quote features
