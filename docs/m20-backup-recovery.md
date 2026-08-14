# M20 — Backup & Recovery (Gate 1 documentation)

**Status:** Documentation for Gate 2 cutover. Do not assume capabilities without verifying the **actual** Neon plan selected for the client.

## Source of truth

| Asset | Source |
|-------|--------|
| Schema | Committed Drizzle migrations in `drizzle/` (`0000`–current) |
| Application code | GitHub `main` + Vercel deployment history |
| Business data | Neon database for that client project only |
| Secrets | Vercel env / password manager — never Git |

## Neon recovery capability (VERIFY AT CUTOVER)

Before Gate 2 go-live:

1. Open the client Neon project → confirm **History / PITR / restore** features available on the **selected plan**.
2. Record: restore window length (if any), branch restore vs in-place restore, who can click restore.
3. If the plan does **not** provide an adequate recovery story for client data:
   - **STOP** the cutover
   - Report options (upgrade plan, alternative export cadence, delay launch)
   - Do **not** invent a third-party backup SaaS in M20 without a new approval

Do **not** hard-code a PITR window in ops docs until verified.

## Recovery procedure (generic)

1. Pause writes / take the client Vercel project offline or rollback to a maintenance deploy if needed.
2. Identify restore point (time or branch snapshot) in Neon UI.
3. Restore to a **new** branch/database when possible; validate row counts and Admin login.
4. Point `DATABASE_URL` / `DATABASE_URL_UNPOOLED` at the restored endpoint **or** promote the restored branch per Neon’s documented flow.
5. Re-run smoke: Admin login, one Customer, one Quote, Final PDF.
6. Communicate data-loss window to the client.

## Recovery drill (required once)

Perform on a **scratch** Neon database (not the sales demo, not a live client with real data if avoidable):

1. Bootstrap company + Admin + create one Customer/Quote.
2. Note timestamp.
3. Restore/branch-restore using Neon’s available feature.
4. Confirm data present or document exact behavior.
5. File the drill date + result in the client onboarding notes.

## Responsibilities

| Role | Responsibility |
|------|----------------|
| Neon project owner | Billing, plan tier, restore access |
| Project X (during setup/support) | Runbook, drill, migration apply |
| Client (after handoff) | Own Neon access + approve restores |

## Out of scope (M20)

- Third-party backup SaaS
- Continuous `pg_dump` automation (optional later)
