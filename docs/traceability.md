# Requirements Traceability Matrix

This matrix maps every functional requirement (FR), business rule (BR), non-functional requirement (NFR), and architecture constraint (A) from the [Software Requirements Specification](srs.md) to its implementing feature, sprint, verification method, test reference, and current verification status.

## Status Legend
- **Planned:** Requirements identified; implementation scheduled in future sprints.
- **Specified:** Engineering contract and AC defined; ready for or in implementation.
- **In Progress:** Feature currently under active development.
- **Passed (Feature ID):** Verification tests authored, automated, and passing against the current build.

---

## 1. Functional Requirements (FR)

| Req ID | Requirement Statement | Feature ID | Sprint | Verification Method | Contract & Test Reference | Status |
|---|---|---|---|---|---|---|
| FR-01 | User authentication with secure session cookie | F-01 | Sprint 1 | API integration test | AC-F01-01 / TEST-F01-01 | Passed (F-01) |
| FR-02 | Session termination (logout) revoking cookie | F-01 | Sprint 1 | API integration test | AC-F01-06 / TEST-F01-06 | Passed (F-01) |
| FR-03 | Two platform roles: Administrator and User | F-01 | Sprint 1 | API integration test | AC-F01-01, AC-F01-09 / TEST-F01-01, TEST-F01-09 | Passed (F-01) |
| FR-04 | Role enforcement on API and UI routes | F-01 | Sprint 1 | API integration test | AC-F01-08, AC-F01-09 / TEST-F01-08, TEST-F01-09 | Passed (F-01) |
| FR-05 | Admin lists platform users without financial data | F-02 | Sprint 1 | API integration test | AC-F02-01 / TEST-F02-01 | Passed (F-02) |
| FR-06 | Admin enables or disables user account | F-02 | Sprint 1 | API test + E2E journey | AC-F02-03, AC-F02-04 / TEST-F02-03, TEST-F02-04 | Passed (F-02) |
| FR-07 | User views cash/bank accounts with balances | F-03 | Sprint 1 | API integration test + UI test | AC-F03-01, AC-F03-02 / TEST-F03-01, TEST-F03-02 | Passed (F-03) |
| FR-08 | User views loans taken and receivables | F-03 | Sprint 1 | API integration test + UI test | AC-F03-03 / TEST-F03-03 | Passed (F-03) |
| FR-09 | User creates account across 5 types | F-08 | Sprint 2 | API test + E2E journey | Sprint 2 contract | Planned |
| FR-10 | User renames or archives account | F-08 | Sprint 2 | API test | Sprint 2 contract | Planned |
| FR-11 | Record dated opening balance | F-04 | Sprint 1 | API integration test + UI test | AC-F04-01 / TEST-F04-01 | Passed (F-04) |
| FR-12 | Modify existing opening balance with audit | F-13 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-13 | Record 'Receive money' with income allocations | F-05 | Sprint 1 | API integration test + E2E journey | AC-F05-01, AC-F05-02 / TEST-F05-01, TEST-F05-02 | Passed (F-05) |
| FR-14 | Record payment/charge with expense allocations | F-06 | Sprint 1 | API integration test + E2E journey | AC-F06-01 / TEST-F06-01 | Passed (F-06) |
| FR-15 | Allocate payment to repay loan taken | F-06 | Sprint 1 | API integration test | AC-F06-02 / TEST-F06-02 | Passed (F-06) |
| FR-16 | Allocate payment to new loan given | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-17 | Allocate receipt to loan given repayment | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-18 | Allocate receipt to new loan taken borrowing | F-10 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-19 | Transfer money between cash/bank accounts | F-11 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-20 | Correct transaction with audit trail | F-12 | Sprint 2 | API integration test + UI test | Sprint 2 contract | Planned |
| FR-21 | View paginated transaction history | F-07 | Sprint 1 | API integration test + UI test | AC-F07-01, AC-F07-02 / TEST-F07-01, TEST-F07-02 | Passed (F-07) |
| FR-22 | View income and expense totals for period | F-07 | Sprint 1 | Unit test (summary logic) + API test | AC-F07-03 / TEST-F07-03 | Passed (F-07) |
| FR-23 | Search and filter transactions | F-14 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-24 | View spending per expense category | F-16 | Sprint 3 | Unit + API test | Sprint 3 contract | Planned |
| FR-25 | View financial reports (monthly / loans) | F-17 | Sprint 3 | API test + UI test | Sprint 3 contract | Planned |
| FR-26 | Mark and unmark favorite transaction | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-27 | List favorite transactions | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-28 | Duplicate transaction into prefilled form | F-15 | Sprint 3 | API test + E2E journey | Sprint 3 contract | Planned |

---

## 2. Business Rules (BR)

| Rule ID | Rule Statement | Enforcing Features | Sprint | Verification Method | Contract & Test Reference | Status |
|---|---|---|---|---|---|---|
| BR-01 | Line sum equals transaction total exactly | F-05, F-06, SR-01 | Sprint 1 | Unit + API test (sum mismatch rejected) | AC-SR01-01, AC-SR01-02, AC-F05-03, AC-F06-05 / TEST-SR01-01, TEST-SR01-02, TEST-F05-03, TEST-F06-05 | Passed (F-05, F-06, SR-01) |
| BR-02 | Positive integer minor units (satang); max cap | F-04, F-05, F-06, SR-01 | Sprint 1 | Unit + API boundary tests (0, max, negative) | AC-SR01-03, AC-SR01-04, AC-F04-04 / TEST-SR01-03, TEST-SR01-04, TEST-F04-04 | Passed (F-04, SR-01) |
| BR-03 | Allocation target matrix per form kind | F-05, F-06, SR-01 | Sprint 1 | Unit test over full matrix; API tests | AC-SR01-06 / TEST-SR01-06 | Passed (F-05, F-06, SR-01) |
| BR-04 | Target account cannot equal main account | F-05, F-06 | Sprint 1 | Unit + API test | AC-SR01-05, AC-F06-06 / TEST-SR01-05, TEST-F06-06 | Passed (F-05, F-06, SR-01) |
| BR-05 | Income/expense strictly from Income/Expense lines | F-07, SR-01 | Sprint 1 | Unit test (summary) + API test | AC-SR01-09, AC-F07-03, AC-F07-04, AC-F07-05 / TEST-SR01-09, TEST-F07-03, TEST-F07-04, TEST-F07-05 | Passed (F-07, SR-01) |
| BR-06 | Balances derived per effect table | F-03, SR-01 | Sprint 1 | Unit tests per cell + integration test | AC-SR01-01, AC-F03-02, AC-F03-03 / TEST-SR01-01, TEST-F03-02, TEST-F03-03 | Passed (F-03, SR-01) |
| BR-07 | Cash account cannot become negative | F-06, SR-01 | Sprint 1 | Unit + API test | AC-SR01-07, AC-F06-03 / TEST-SR01-07, TEST-F06-03 | Passed (F-06, SR-01) |
| BR-08 | Loan repayment cannot exceed debt | F-06, SR-01 | Sprint 1 | Unit + API test | AC-SR01-08, AC-F06-04 / TEST-SR01-08, TEST-F06-04 | Passed (F-06, SR-01) |
| BR-09 | Date in Asia/Bangkok, not in future | F-05, F-06 | Sprint 1 | API boundary test (today pass, tomorrow fail) | AC-F05-04, AC-F06-07 / TEST-F05-04, TEST-F06-07 | Passed (F-05, F-06) |
| BR-10 | Strict user isolation (404 on foreign data) | F-01, F-03, F-07 | Sprint 1 | API tests (user A requests user B records) | AC-F01-10, AC-F03-04, AC-F07-06 / TEST-F01-10, TEST-F03-04, TEST-F07-06 | Passed (F-01, F-03, F-07) |
| BR-11 | Accounts must belong to owner and be active | F-05, F-06 | Sprint 1 | API test (foreign account ID rejected) | AC-F05-05, TEST-F06-08 / TEST-F05-05 | Passed (F-05, F-06) |
| BR-12 | Opening balance only Cash/Loans, <= 1 in S1 | F-04 | Sprint 1 | API test | AC-F04-01..03 / TEST-F04-01..03 | Passed (F-04) |
| BR-13 | Account type fixed at creation | F-03, F-08 | Sprint 1 | Unit + API test | AC-F03-01 / TEST-F03-01 | Passed (F-03) |
| BR-14 | Account names unique per user (case-insensitive) | F-03, F-08 | Sprint 1 | Database constraint test | AC-SR02-03 / TEST-SR02-03 | Passed (F-03, SR-02) |
| BR-15 | Single currency (THB satang) | F-03, SR-02 | Sprint 1 | Schema & API review | AC-SR01-01, AC-SR02-01 / TEST-SR01-01, TEST-SR02-01 | Passed (F-03, SR-02) |
| BR-16 | Administrator holds no financial accounts | F-01, F-02 | Sprint 1 | API test (admin calls financial routes -> 403) | AC-F01-09, AC-F02-01 / TEST-F01-09, TEST-F02-01 | Passed (F-01, F-02) |
| BR-17 | Disabled user session revocation & blocked login | F-01, F-02 | Sprint 1 | API test | AC-F01-04, AC-F02-04 / TEST-F01-04, TEST-F02-04 | Passed (F-01, F-02) |
| BR-18 | Administrator cannot disable self or last admin | F-02 | Sprint 1 | API test | AC-F02-05, AC-F02-06 / TEST-F02-05, TEST-F02-06 | Passed (F-02) |
| BR-19 | Allocation lines must be >= 1 satang | F-05, F-06 | Sprint 1 | Unit + API test | AC-SR01-04 / TEST-SR01-04 | Passed (F-05, F-06, SR-01) |
| BR-20 | Audit trail on edit/delete (Sprint 2 & 3) | F-12, F-13 | Sprint 2 | Integration test on audit log table | Sprint 2 contract | Planned |
| BR-21 | Obscure login failure messages | F-01 | Sprint 1 | API security test | AC-F01-02, AC-F01-03 / TEST-F01-02, TEST-F01-03 | Passed (F-01) |

---

## 3. Non-Functional Requirements (NFR)

| NFR ID | Requirement Statement | Verification Method | Status |
|---|---|---|---|
| NFR-01 | Role-based authorization on all routes | Security test suite with negative role matrices | Passed (F-01) |
| NFR-02 | Bcrypt cost factor 12 for password hashing | Unit test inspecting hash format and cost factor | Passed (SR-02) |
| NFR-03 | Zero rounding error via integer satang | Ledger engine unit test verifying exact minor unit sums | Passed (SR-01) |
| NFR-04 | Max transaction amount cap 1,000,000,000 satang | API boundary test | Passed (SR-01) |
| NFR-05 | 8-hour absolute session expiration | Unit test on session expiry calculation | Passed (F-01) |
| NFR-06 | Clean architecture with decoupled ledger engine | Code review & isolation verification | Passed (SR-01) |
| NFR-07 | Database transactions on multi-line inserts | Concurrency / transactional rollback test | Passed (F-05, F-06) |
| NFR-08 | Generic error messages without leaking stack traces | API error handling test | Passed (SR-02) |
| NFR-09 | Immediate derived balance consistency | Unit tests on balance derivation | Passed (SR-01) |
| NFR-10 | Responsive UI with loading, empty, and error states | Visual and UI behavior tests (360px+) | Passed (F-02, F-03, F-05, F-06, F-07) |
| NFR-11 | < 500ms p95 on 5k transactions | Benchmark script | Planned (Sprint 3) |
| NFR-12 | 100% test pass before merging; > 80% coverage | CI pipeline enforcement | Passed (Sprint 1) |
| NFR-13 | Comprehensive input validation on all payloads | API negative validation tests | Passed (F-01, F-02, F-03, F-05, F-06, F-07) |

---

## 4. Change History & Baseline Control

**Approved changes since baseline:** Contracts elaborated with stable AC and STS IDs.

---

## Change log

| Date | Change | Reason | Approved by |
|---|---|---|---|
| 2026-10-23 | Baseline v0.1 created | Initial planning | Team |
| 2026-10-23 | Sprint 1 AC and STS IDs added (v1.0) | Feature engineering contracts created for Issue #1 | Team |
| 2026-11-03 | F-04 opening balance recording verified | Issue #8 implemented and all test cases passing | Team |
| 2026-11-04 | F-05 receive money transactions verified | Issue #9 implemented; FR-13, BR-01, BR-03, BR-04, BR-09, BR-11, NFR-07 passing | Team |
| 2026-11-04 | F-06 payment/charge transactions verified | Issue #10 implemented; FR-14, FR-15, BR-07, BR-08, BR-09, BR-11, BR-19 passing | Team |
| 2026-11-04 | F-07 transaction history and summary verified | Issue #11 implemented; FR-21, FR-22, BR-05, BR-10, NFR-10 passing | Team |
