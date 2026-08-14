# M20 — Monitoring (first client)

**Tooling:** Vercel deployment status + runtime logs only. **No Sentry** in M20.

## Watch during the first 7 days

| Signal | Where | Notes |
|--------|-------|-------|
| Failed deploys | Vercel / GitHub commit status | Block bad releases |
| HTTP 5xx / function crashes | Vercel Runtime Logs | DB/auth misconfig often surfaces here |
| Auth failures spike | Runtime logs (`[auth]` prefixes) | Rate-limit / bad password — **never** log passwords |
| Database errors | Runtime + Neon metrics | Connection/pool exhaustion |
| Failed Server Actions | Runtime logs | Authorization vs validation |
| Rate-limit denials | Runtime (`login rate limiter`) | Expected under attack; investigate floods |
| Authorization anomalies | Runtime (`AuthorizationError`) | Unexpected capability failures |

## Do not log

- Passwords or password hashes
- `AUTH_SECRET`
- Database connection strings
- Full `pdf_snapshot` / logo data URLs
- Full customer PII dumps

## Response

1. Identify deploy SHA and env mode (`AUTH_MODE` / `PERSISTENCE_MODE` — via Vercel UI, never print secrets).
2. Prefer Vercel rollback for bad code.
3. Prefer forward-fix migration for schema issues.
4. Escalate Neon restore only with client approval and drill knowledge.
