# Requirements traceability - Personal Money and Expense Logging System

**Version:** v1.0 (Sprint 1 Contracts Baseline) - 2026-10-23

Chain maintained from now on: **requirement (FR/BR/NFR) -> feature or responsibility -> sprint -> acceptance criteria (AC) -> planned test (STS) -> actual test and result.**  
Sprint 1 contracts define exact AC and STS IDs (Status: *Specified*). Later sprint requirements will be assigned AC and test IDs when their contracts are created.

| Requirement | Summary | Feature / responsibility | Sprint | Planned verification | AC / TEST | Status |
|---|---|---|---|---|---|---|
| FR-01 | Active user login with session cookie | F-01 | Sprint 1 | API integration test (valid/invalid credentials) | AC-F01-01..04 / TEST-F01-01..04 | Passed (F-01) |
| FR-02 | Logged-in user logout with server revocation | F-01 | Sprint 1 | API integration test (cookie reuse after logout) | AC-F01-06 / TEST-F01-06 | Passed (F-01) |
| FR-03 | Retrieve current user identity | F-01 | Sprint 1 | API integration test | AC-F01-05 / TEST-F01-05 | Passed (F-01) |
| FR-04 | Backend RBAC enforcement from session | F-01 | Sprint 1 | API tests (unauthenticated, forbidden role) | AC-F01-08, AC-F01-09 / TEST-F01-08, TEST-F01-09 | Passed (F-01) |
| FR-05 | Admin lists users without financial data | F-02 | Sprint 1 | API test + E2E journey | AC-F02-01 / TEST-F02-01 | Specified |
| FR-06 | Admin enables or disables user account | F-02 | Sprint 1 | API test + E2E journey | AC-F02-03, AC-F02-04 / TEST-F02-03, TEST-F02-04 | Specified |
| FR-07 | User views cash/bank accounts with balances | F-03 | Sprint 1 | API integration test + UI test | AC-F03-01, AC-F03-02 / TEST-F03-01, TEST-F03-02 | Specified |
| FR-08 | User views loans taken and receivables | F-03 | Sprint 1 | API integration test + UI test | AC-F03-03 / TEST-F03-03 | Specified |
| FR-09 | User creates account across 5 types | F-08 | Sprint 2 | API test + E2E journey | Sprint 2 contract | Planned |
| FR-10 | User renames or archives account | F-08 | Sprint 2 | API test | Sprint 2 contract | Planned |
| FR-11 | Record dated opening balance | F-04 | Sprint 1 | API integration test + UI test | AC-F04-01 / TEST-F04-01 | Specified |
| FR-12 | Modify existing opening balance with audit | F-13 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-13 | Record 'Receive money' with income allocations | F-05 | Sprint 1 | API integration test + E2E journey | AC-F05-01, AC-F05-02 / TEST-F05-01, TEST-F05-02 | Specified |
| FR-14 | Record payment/charge with expense allocations | F-06 | Sprint 1 | API integration test + E2E journey | AC-F06-01 / TEST-F06-01 | Specified |
| FR-15 | Allocate payment to repay loan taken | F-06 | Sprint 1 | API integration test | AC-F06-02 / TEST-F06-02 | Specified |
| FR-16 | Allocate payment to new loan given | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-17 | Allocate receipt to loan given repayment | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-18 | Allocate receipt to new loan taken borrowing | F-10 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-19 | Transfer money between cash/bank accounts | F-11 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-20 | Correct transaction with audit trail | F-12 | Sprint 2 | API integration test + UI test | Sprint 2 contract | Planned |
| FR-21 | View paginated transaction history | F-07 | Sprint 1 | API integration test + UI test | AC-F07-01, AC-F07-02 / TEST-F07-01, TEST-F07-02 | Specified |
| FR-22 | View income and expense totals for period | F-07 | Sprint 1 | Unit test (summary logic) + API test | AC-F07-03 / TEST-F07-03 | Specified |
| FR-23 | Search and filter transactions | F-14 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-24 | View spending per expense category | F-16 | Sprint 3 | Unit + API test | Sprint 3 contract | Planned |
| FR-25 | View financial reports (monthly / loans) | F-17 | Sprint 3 | API test + UI test | Sprint 3 contract | Planned |
| FR-26 | Mark and unmark favorite transaction | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-27 | List favorite transactions | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-28 | Duplicate transaction into prefilled form | F-15 | Sprint 3 | API test + E2E journey | Sprint 3 contract | Planned |
| BR-01 | Line sum equals transaction total exactly | F-05, F-06, SR-01 | Sprint 1 | Unit + API test (sum mismatch rejected) | AC-SR01-01, AC-SR01-02, AC-F05-03, AC-F06-05 / TEST-SR01-01, TEST-SR01-02, TEST-F05-03, TEST-F06-05 | Specified |
| BR-02 | Positive integer minor units (satang); max cap | F-04, F-05, F-06, SR-01 | Sprint 1 | Unit + API boundary tests (0, max, negative) | AC-SR01-03, AC-SR01-04, AC-F04-04 / TEST-SR01-03, TEST-SR01-04, TEST-F04-04 | Specified |
| BR-03 | Allocation target matrix per form kind | F-05, F-06, SR-01 | Sprint 1 | Unit test over full matrix; API tests | AC-SR01-06 / TEST-SR01-06 | Specified |
| BR-04 | Target account cannot equal main account | F-05, F-06 | Sprint 1 | Unit + API test | AC-SR01-05, AC-F06-06 / TEST-SR01-05, TEST-F06-06 | Specified |
| BR-05 | Income/expense strictly from Income/Expense lines | F-07, SR-01 | Sprint 1 | Unit test (summary) + API test | AC-SR01-09, AC-F07-03, AC-F07-04, AC-F07-05 / TEST-SR01-09, TEST-F07-03, TEST-F07-04, TEST-F07-05 | Specified |
| BR-06 | Balances derived per effect table | F-03, SR-01 | Sprint 1 | Unit tests per cell + integration test | AC-SR01-01, AC-F03-02, AC-F03-03 / TEST-SR01-01, TEST-F03-02, TEST-F03-03 | Specified |
| BR-07 | Cash account cannot become negative | F-06, SR-01 | Sprint 1 | Unit + API test | AC-SR01-07, AC-F06-03 / TEST-SR01-07, TEST-F06-03 | Specified |
| BR-08 | Loan repayment cannot exceed debt | F-06, SR-01 | Sprint 1 | Unit + API test | AC-SR01-08, AC-F06-04 / TEST-SR01-08, TEST-F06-04 | Specified |
| BR-09 | Date in Asia/Bangkok, not in future | F-05, F-06 | Sprint 1 | API boundary test (today pass, tomorrow fail) | AC-F05-04, AC-F06-07 / TEST-F05-04, TEST-F06-07 | Specified |
| BR-10 | Strict user isolation (404 on foreign data) | F-01, F-03, F-07 | Sprint 1 | API tests (user A requests user B records) | AC-F01-10, AC-F03-04, AC-F07-06 / TEST-F01-10, TEST-F03-04, TEST-F07-06 | Specified |
| BR-11 | Accounts must belong to owner and be active | F-05, F-06 | Sprint 1 | API test (foreign account ID rejected) | AC-F05-05 / TEST-F05-05 | Specified |
| BR-12 | Opening balance only Cash/Loans, <= 1 in S1 | F-04 | Sprint 1 | API test | AC-F04-01..03 / TEST-F04-01..03 | Specified |
| BR-13 | Account type fixed at creation | F-03, F-08 | Sprint 1 | Unit + API test | AC-F03-01 / TEST-F03-01 | Specified |
| BR-14 | Account names unique per user (case-insensitive) | F-03, F-08 | Sprint 1 | Database constraint test | AC-SR02-03 / TEST-SR02-03 | Specified |
| BR-15 | Single currency (THB satang) | F-03, SR-02 | Sprint 1 | Schema & API review | AC-SR01-01, AC-SR02-01 / TEST-SR01-01, TEST-SR02-01 | Specified |
| BR-16 | Administrator holds no financial accounts | F-01, F-02 | Sprint 1 | API test (admin calls financial routes -> 403) | AC-F01-09, AC-F02-01 / TEST-F01-09, TEST-F02-01 | Specified |
| BR-17 | Disabled user session revocation & blocked login | F-01, F-02 | Sprint 1 | API test | AC-F01-04, AC-F02-04 / TEST-F01-04, TEST-F02-04 | Specified |
| BR-18 | Administrator cannot disable self or last admin | F-02 | Sprint 1 | API test | AC-F02-05, AC-F02-06 / TEST-F02-05, TEST-F02-06 | Specified |
| BR-19 | Transactions immutable in Sprint 1 | F-05, F-06, F-12 | Sprint 1 | API test (no PUT/DELETE endpoints) | AC-F05-01, AC-F06-01 / TEST-F05-01, TEST-F06-01 | Specified |
| BR-20 | Favorites private, duplication creates draft | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| BR-21 | Generic error message on failed login | F-01 | Sprint 1 | API test | AC-F01-02, AC-F01-03 / TEST-F01-02, TEST-F01-03 | Passed (F-01) |
| NFR-01 | 401 unauthenticated on all protected routes | F-01 | Sprint 1 | API test suite iterating protected routes | AC-F01-08 / TEST-F01-08 | Passed (F-01) |
| NFR-02 | Bcrypt cost 12, no plaintext passwords | F-01 | Sprint 1 | Integration test on stored hash + code review | AC-SR02-03 / TEST-SR02-03 | Passed (SR-02) |
| NFR-03 | Transaction atomicity (rollback on failure) | SR-01, F-05, F-06 | Sprint 1 | Integration test on row counts | AC-F05-06 / TEST-F05-06 | Specified |
| NFR-04 | Exact integer satang arithmetic | SR-01 | Sprint 1 | Unit tests on minor unit sums | AC-SR01-01, AC-SR01-03 / TEST-SR01-01, TEST-SR01-03 | Passed (SR-01) |
| NFR-05 | 8h absolute session lifetime & immediate logout | F-01 | Sprint 1 | API test with mock clock & logout test | AC-F01-06, AC-F01-07 / TEST-F01-06, TEST-F01-07 | Passed (F-01) |
| NFR-06 | Setup in <= 5 documented commands | SR-02 | Sprint 1 | Verification on fresh clone | AC-SR02-01 / TEST-SR02-01 | Passed |
| NFR-07 | Committed data survives app restart | SR-02, F-05, F-06 | Sprint 1 | Integration test across DB reconnect | AC-SR02-05 / TEST-SR02-05 | Passed (SR-02) |
| NFR-08 | Safe error bodies (no stack trace / SQL) | SR-02 | Sprint 1 | API tests on error responses | AC-SR02-04 / TEST-SR02-04 | Passed |
| NFR-09 | Ledger domain module >= 80% coverage | SR-01 | Sprint 1 | Coverage report | AC-SR01-10 / TEST-SR01-10 | Passed (SR-01) |
| NFR-10 | Sprint 1 UI states & responsive at 360px | F-03, F-05, F-06, F-07, HR-01 | Sprint 1 | UI / E2E viewport tests | AC-F03-05 / TEST-F03-05 | Specified |
| NFR-11 | < 500ms p95 on 5k transactions | F-07, F-16, HR-01 | Sprint 3 | Benchmark script | Sprint 3 contract | Planned |
| NFR-12 | Environment variables in .env.example | SR-02 | Sprint 1 | Secret scan + repo audit | AC-SR02-02 / TEST-SR02-02 | Passed |
| NFR-13 | Cash overdraft concurrency protection | SR-01, F-06 | Sprint 2 | Concurrency test | Sprint 2 contract | Planned |

---

## Coverage check

| Item | Count |
|---|---|
| Functional requirements | 28 |
| Business rules | 21 |
| Non-functional requirements | 13 |
| Requirements in Sprint 1 | 45 |
| Sprint 1 requirements with complete AC/TEST mappings | 45 (100%) |
| Requirements assigned to Sprint 2 | 8 |
| Requirements assigned to Sprint 3 | 9 |
| Requirements without a feature or responsibility | 0 |
| Features or responsibilities without a requirement | 0 |

**Coverage gaps:** None.  
**Approved changes since baseline:** Contracts elaborated with stable AC and STS IDs.

---

## Change log

| Date | Change | Reason | Approved by |
|---|---|---|---|
| 2026-10-23 | Baseline v0.1 created | Initial planning | Team |
| 2026-10-23 | Sprint 1 AC and STS IDs added (v1.0) | Feature engineering contracts created for Issue #1 | Team |
