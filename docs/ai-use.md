# AI-use declaration

| Tool | Task assisted | Where used (Issue / document) | Human verification |
|---|---|---|---|
| Antigravity AI Agent | Drafting System-Level SDS and Sprint 1 feature engineering contracts (AC, STS, and DoD) | Issue #1 (`docs/system-sds.md`, `docs/sprints/sprint-1/*.md`, `docs/traceability.md`) | Reviewed by team members against CPE 334 rubric and Theme 7 specifications. |
| Antigravity AI Agent | Implementing Platform Baseline, Prisma migrations, and Error Envelope middleware | Issue #2 (`src/`, `tests/platform/`, `prisma/schema.prisma`, `README.md`) | Tested with Vitest & Supertest, verified against NFR-06, NFR-07, NFR-08, NFR-12. |
| Antigravity AI Agent | Implementing Synthetic Seed Data Generator and automated tests | Issue #3 (`prisma/seed.ts`, `tests/platform/seed.test.ts`) | Tested with Vitest verifying bcrypt cost 12, demo accounts, and SEED_PASSWORD enforcement. |
| Antigravity AI Agent | Implementing Account Balance & Debt Overview endpoint and UI dashboard | Issue #7 (`src/routes/accounts.ts`, `src/views/overviewHtml.ts`, `tests/accounts/accounts.test.ts`) | Tested with Vitest & Supertest, verified balance derivation, privacy isolation, and 403 on admin. |
| Antigravity AI Agent | Implementing Receive Money (Receipt) endpoint and UI modal with allocation lines, ledger validation, and atomic writes | Issue #9 (`src/routes/transactions.ts`, `src/views/overviewHtml.ts`, `tests/transactions/receipt.test.ts`) | 12 tests passing: valid single/multi-line receipts, sum mismatch, future date, foreign account, atomic rollback, auth/RBAC, invalid target type, self-target, non-CASH main, UI modal controls. |
