# Sprint 1 Engineering Contracts

**Sprint:** 1 — Small Deployable Money-Tracking Vertical Slice  
**Target Delivery:** Project Deliverable 1 (8 November 2026)  
**Status:** Contracts Ready (Pre-implementation baseline)  
**Engineering Discipline:** Specifications and tests committed before implementation.

---

## 1. Product Definition of Done (Sprint 1)

An issue or feature in Sprint 1 is considered **Done** only when all of the following conditions are met:
1. **Behavior Implemented:** All specified domain logic, API endpoints, and UI behaviors exist and function according to the feature specification.
2. **Acceptance Criteria Verified:** Every Acceptance Criterion (AC) mapped to a Software Test Specification (STS) has a passing automated test (Unit, Integration, or E2E).
3. **TDD Sequence Evidenced:** For domain rules, an observed failing test commit (`test: ...`) precedes the passing implementation commit (`feat: ...`).
4. **Clean Execution:** No test in the automated suite fails or is disabled/skipped to mask errors.
5. **Code Review Completed:** Teammate review on the PR into `sprint-1-staging` contains specific verification feedback, questions, or explicit justification for approval (authors never approve their own PRs).
6. **Documentation & Traceability Maintained:** `docs/traceability.md` is updated with exact test IDs and pass statuses.
7. **No Plaintext Secrets:** Configuration is strictly externalized via environment variables.

---

## 2. Sprint 1 Contracts Index

| ID | Feature / Contract | File | Linked Requirements | Key Responsibilities |
|---|---|---|---|---|
| **SR-01** | Ledger Domain Engine | [`sr-01-ledger-engine.md`](./sr-01-ledger-engine.md) | BR-01, BR-02, BR-03, BR-05, BR-06, BR-07, BR-08, NFR-03, NFR-04, NFR-09 | Satang math, balance derivation, allocation validation, overdraft & repayment checks. |
| **SR-02** | Platform Baseline | [`sr-02-platform-baseline.md`](./sr-02-platform-baseline.md) | BR-15, NFR-06, NFR-07, NFR-08, NFR-12 | Project setup, Prisma schema, error envelopes, and synthetic seed script. |
| **F-01** | Authentication & RBAC | [`f-01-auth-sessions.md`](./f-01-auth-sessions.md) | FR-01..04, BR-10, BR-16, BR-17, BR-21, NFR-01, NFR-02, NFR-05 | Login/logout, 8-hour session cookie, RBAC middleware, 404 on foreign resources. |
| **F-02** | Administrator User Management | [`f-02-admin-user-management.md`](./f-02-admin-user-management.md) | FR-05, FR-06, BR-16, BR-17, BR-18 | Admin user list, enable/disable toggle, session revocation, admin blocked from financial data. |
| **F-03** | Seed Data & Account Overview | [`f-03-account-overview.md`](./f-03-account-overview.md) | FR-07, FR-08, BR-06, BR-10, BR-13..15, NFR-10 | Dashboard showing derived balances: Cash, Credit Card debt, Loans Given. |
| **F-04** | Opening Balance Recording | [`f-04-opening-balance.md`](./f-04-opening-balance.md) | FR-11, BR-02, BR-12 | Starting balance on Cash/Loan accounts; excluded from income/expense. |
| **F-05** | Receive Money (Income) | [`f-05-receive-money.md`](./f-05-receive-money.md) | FR-13, BR-01..04, BR-09, BR-11, BR-19, NFR-03, NFR-07 | Cash receipt allocated across Income categories with atomic persistence. |
| **F-06** | Payment / Charge Transactions | [`f-06-payment-charge.md`](./f-06-payment-charge.md) | FR-14, FR-15, BR-01..04, BR-07, BR-08, BR-09, BR-11, BR-19 | Expenses and Card repayments; overdraft & debt cap enforcement. |
| **F-07** | History & Income/Expense Summary | [`f-07-history-and-summary.md`](./f-07-history-and-summary.md) | FR-21, FR-22, BR-05, BR-10, NFR-10, NFR-11 | Paginated history table with line items, date-filtered Income vs Expense summary. |
