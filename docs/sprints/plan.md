# Three-sprint plan - Personal Money and Expense Logging System

**Version:** v0.1 (baseline) - 2026-10-23

The three sprints together cover every requirement in `docs/srs.md` (see the coverage check in `docs/traceability.md`).
Each feature gets its engineering contract (feature SDS, UI/API/data specs, AC, STS, DoD) **before** it is implemented.

## Sprint 1 - Small deployable money-tracking slice (Deliverable 1, 8 November)

**Goal:** authentication and permissions, an exact ledger engine, and a complete user journey with persistence.

**Features:**
- **F-01** Authentication, sessions and role-based access
- **F-02** Administrator user management
- **F-03** Seed data and account overview
- **F-04** Opening balance recording
- **F-05** Receive money (income allocations)
- **F-06** Payment / charge (expenses and loan-taken repayment)
- **F-07** Transaction history and income/expense summary
- **SR-01** Ledger engine (system responsibility)
- **SR-02** Platform baseline (system responsibility)

**Dependencies:** SR-01 and SR-02 first; then F-01 and F-03; then F-04, F-05 and F-06 (which share the ledger engine); F-07 last; F-02 in parallel with F-03.

**Completion outcome:**
- The worked example in SRS 4.4 runs end to end through UI, API and database, and its results persist after a restart.
- Rejections are demonstrated and tested: allocation sum mismatch (BR-01), overdraft (BR-07), repayment above debt (BR-08), another user's record (BR-10), administrator on a financial endpoint (BR-16).
- Login, logout, unauthenticated access and forbidden role operations have automated tests.
- All Sprint 1 AC are mapped to executed tests; a tagged release is on `main`; setup works from the README.

**Why this scope is feasible:** it implements one ledger engine and two money forms (receipt and payment) restricted to the targets needed by the
theme's Sprint 1 example (Income, Expense, Loan Taken repayment). The data model already supports every account type and target, so Sprints 2 and 3 add
rules and screens, not schema rewrites. Account creation, loans given, borrowing and transfers are deliberately left to Sprint 2.

**Internal milestones**

| Date | Milestone |
|---|---|
| 23-25 Oct | Repository, branches, board; SRS, features, traceability, plan (baseline) |
| 26-28 Oct | System-level SDS; Sprint 1 contracts committed (before any implementation) |
| 29 Oct - 4 Nov | Implementation in TDD, one bounded Issue per PR, teammate review into `sprint-1-staging` |
| 4-5 Nov | Integration and system tests; workshop questions (3 and 5 Nov) |
| 6 Nov | Release PR `sprint-1-staging` -> `main`, tag `v0.1.0-sprint1`, README and test evidence |
| 7-8 Nov | PDF assembly, cross-review, submission before 23:59 on 8 Nov |

## Sprint 2 - Core expansion (Deliverable 2, 29 November)

**Goal:** the remaining core money workflows under feature contracts, with a deployed integrated increment.

**Features:**
- **F-08** Account management
- **F-09** Loans given: lend and receive repayment
- **F-10** Borrowing (new loan taken)
- **F-11** Transfers between cash/bank accounts
- **F-12** Transaction corrections with audit trail

**Dependencies:** F-08 first (accounts must be creatable); F-09, F-10, F-11 reuse the ledger engine; F-12 last. Lab 5 (CI/CD, Docker, GCP) uses the Sprint 1 release; Lab 7 changes one existing rule.

**Completion outcome:** all Sprint 2 features complete with AC and tests; NFR-13 verified; integrated release deployed; contracts for Sprint 3 written.

## Sprint 3 - Completion and hardening (final delivery, 13 December)

**Goal:** finish the remaining features, harden the product and complete verification.

**Features:**
- **F-13** Opening balance management
- **F-14** Search and filter transactions
- **F-15** Favorites and duplication
- **F-16** Category spending summary
- **F-17** Reports
- **HR-01** Product hardening (system responsibility)

**Dependencies:** F-14 to F-17 build on the history and summary from F-07; F-13 needs F-12's audit mechanism; HR-01 runs last.

**Completion outcome:** all requirements verified (NFR-11 benchmark included), regression suite green, UAT defects resolved, deployed release, report and demo video.
By 29 November Sprint 3 contracts, working progress and an explicit remaining-work list are submitted with Deliverable 2.

## Risks

| Risk | Mitigation |
|---|---|
| Allocation model is the hardest part | Build and test SR-01 first, with unit tests per cell of the effect table |
| Contracts written after code lose their evidence | Specs-only commit before implementation; red test commit before green commit |
| Examination period (until 25 Oct) | Baseline documents finished early; heavy implementation after 26 Oct |
| Late PDF assembly | Documents are Markdown in `docs/` and converted to PDF; assembly rehearsed by 5 Nov |
| Parallel labs (5, 6, 7) compete with Sprint 2 | Sprint 1 release kept deployable; Lab work isolated in its own Issues |
