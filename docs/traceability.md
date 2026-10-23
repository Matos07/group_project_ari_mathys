# Requirements traceability - Personal Money and Expense Logging System

**Version:** v0.1 (baseline) - 2026-10-23

Chain maintained from now on: **requirement (FR/BR/NFR) -> feature or responsibility -> sprint -> acceptance criteria (AC) -> planned test (STS) -> actual test and result.**
This baseline fills the first three links and the planned verification method. AC and test IDs are assigned in the engineering
contracts (Sprint 1 by Deliverable 1, later sprints in their own contracts) and added to this table as they are created.

| Requirement | Summary | Feature / responsibility | Sprint | Planned verification | AC / TEST | Status |
|---|---|---|---|---|---|---|
| FR-01 | An active user can log in with email and password and receives a server-side session... | F-01 | Sprint 1 | API integration test (valid and invalid credentials) | Pending: Sprint 1 contract | Planned |
| FR-02 | A logged-in user can log out; the session is invalidated server-side and the old... | F-01 | Sprint 1 | API integration test (reuse cookie after logout) | Pending: Sprint 1 contract | Planned |
| FR-03 | A logged-in user can retrieve their current identity (id, email, display name, role). | F-01 | Sprint 1 | API integration test | Pending: Sprint 1 contract | Planned |
| FR-04 | The backend authorizes every protected operation from the identity and role stored in... | F-01 | Sprint 1 | API tests (unauthenticated, forbidden role, spoofed user ID) | Pending: Sprint 1 contract | Planned |
| FR-05 | An administrator can list platform user accounts (email, display name, role, active... | F-02 | Sprint 1 | API test + E2E journey | Pending: Sprint 1 contract | Planned |
| FR-06 | An administrator can enable or disable another user account. | F-02 | Sprint 1 | API test + E2E journey | Pending: Sprint 1 contract | Planned |
| FR-07 | A user can view their cash and bank accounts with current balances. | F-03 | Sprint 1 | API integration test + UI test | Pending: Sprint 1 contract | Planned |
| FR-08 | A user can view outstanding loans taken (including credit-card debt) and amounts owed... | F-03 | Sprint 1 | API integration test + UI test | Pending: Sprint 1 contract | Planned |
| FR-09 | A user can create an account by choosing its type (Cash, Loan Given, Loan Taken,... | F-08 | Sprint 2 | API test + E2E journey | Sprint 2 contract | Planned |
| FR-10 | A user can rename or archive an account; archived accounts cannot be used in new... | F-08 | Sprint 2 | API test | Sprint 2 contract | Planned |
| FR-11 | A user can record a dated opening balance for a Cash, Loan Taken or Loan Given account. | F-04 | Sprint 1 | API integration test + UI test | Pending: Sprint 1 contract | Planned |
| FR-12 | A user can modify an existing opening balance; the previous value stays in an audit... | F-13 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-13 | A user can record a 'Receive money' transaction into a cash or bank account, allocated... | F-05 | Sprint 1 | API integration test + E2E journey | Pending: Sprint 1 contract | Planned |
| FR-14 | A user can record a 'Payment/charge' transaction from a cash, bank, credit-card or... | F-06 | Sprint 1 | API integration test + E2E journey | Pending: Sprint 1 contract | Planned |
| FR-15 | A user can allocate part or all of a payment to the repayment of a loan taken (for... | F-06 | Sprint 1 | API integration test | Pending: Sprint 1 contract | Planned |
| FR-16 | A user can allocate part of a payment to a new loan given to someone. | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-17 | A user can allocate part of a receipt to the repayment of a loan given. | F-09 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-18 | A user can allocate part of a receipt to a new borrowing on a loan-taken account. | F-10 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-19 | A user can transfer money between their own cash/bank accounts. | F-11 | Sprint 2 | API integration test | Sprint 2 contract | Planned |
| FR-20 | A user can correct a recorded transaction; the original stays visible in an audit trail. | F-12 | Sprint 2 | API integration test + UI test | Sprint 2 contract | Planned |
| FR-21 | A user can view their transaction history, newest first and paginated, with each... | F-07 | Sprint 1 | API integration test + UI test | Pending: Sprint 1 contract | Planned |
| FR-22 | A user can view total income and total expenses for a date range. | F-07 | Sprint 1 | Unit test (summary logic) + API test | Pending: Sprint 1 contract | Planned |
| FR-23 | A user can search and filter transactions by date range, account, amount range and text. | F-14 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-24 | A user can view spending per expense category for a period. | F-16 | Sprint 3 | Unit + API test | Sprint 3 contract | Planned |
| FR-25 | A user can view reports: monthly income/expense/net and outstanding loans. | F-17 | Sprint 3 | API test + UI test | Sprint 3 contract | Planned |
| FR-26 | A user can mark and unmark a transaction as favorite. | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-27 | A user can list their favorite transactions. | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| FR-28 | A user can duplicate a transaction into a new editable form pre-filled with the same... | F-15 | Sprint 3 | API test + E2E journey | Sprint 3 contract | Planned |
| BR-01 | A transaction has at least one allocation line, and the sum of its allocation lines... | F-05, F-06, SR-01 | Sprint 1 | Unit + API test (sum mismatch rejected, nothing stored) | Pending: Sprint 1 contract | Planned |
| BR-02 | Amounts are positive integers in minor units (satang); each line is at least 1 and a... | F-04, F-05, F-06, SR-01 | Sprint 1 | Unit + API boundary tests (0, negative, max, max+1, non-integer) | Pending: Sprint 1 contract | Planned |
| BR-03 | Allowed allocation targets depend on the form. Payment: Expense, Loan Taken... | F-05, F-06, SR-01 | Sprint 1 | Unit test over the full matrix; API tests for Sprint 1 targets | Pending: Sprint 1 contract | Planned |
| BR-04 | An allocation line may not target the same account as the transaction's main account. | F-05, F-06 | Sprint 1 | Unit + API test | Pending: Sprint 1 contract | Planned |
| BR-05 | Only lines targeting Income accounts count as income and only lines targeting Expense... | F-07, SR-01 | Sprint 1 | Unit test (summary) + API test with mixed transaction | Pending: Sprint 1 contract | Planned |
| BR-06 | Every transaction updates all involved balances according to the balance-effect table... | F-03, SR-01 | Sprint 1 | Unit tests per cell of the effect table + integration test | Pending: Sprint 1 contract | Planned |
| BR-07 | A transaction that would make a Cash account balance negative is rejected (checked on... | F-06, SR-01 | Sprint 1 | Unit + API test | Pending: Sprint 1 contract | Planned |
| BR-08 | A loan repayment (paid or received) may not exceed the outstanding amount of the... | F-06, SR-01 | Sprint 1 | Unit + API test | Pending: Sprint 1 contract | Planned |
| BR-09 | A transaction date is a calendar date (Asia/Bangkok) and may not be in the future. | F-05, F-06 | Sprint 1 | API boundary test (today accepted, tomorrow rejected) | Pending: Sprint 1 contract | Planned |
| BR-10 | A user can only read or change their own accounts, transactions and summaries;... | F-01, F-03, F-07 | Sprint 1 | API tests (user A requests user B's records) | Pending: Sprint 1 contract | Planned |
| BR-11 | Every account referenced by a transaction must belong to the transaction's owner and... | F-05, F-06 | Sprint 1 | API test (foreign account ID rejected) | Pending: Sprint 1 contract | Planned |
| BR-12 | An opening balance applies only to Cash, Loan Taken or Loan Given accounts, is at... | F-04 | Sprint 1 | API test | Pending: Sprint 1 contract | Planned |
| BR-13 | Account type is fixed at creation. Income and Expense accounts accumulate totals and... | F-03, F-08 | Sprint 1 | Unit + API test | Pending: Sprint 1 contract | Planned |
| BR-14 | Account names are unique per user (case-insensitive). | F-03, F-08 | Sprint 1 | Database constraint test | Pending: Sprint 1 contract | Planned |
| BR-15 | The product is single-currency: all amounts are Thai baht (THB). | F-03, SR-02 | Sprint 1 | Review of schema and API contract | Pending: Sprint 1 contract | Planned |
| BR-16 | An administrator holds no financial accounts and cannot read or modify any user's... | F-01, F-02 | Sprint 1 | API test (admin calls every financial endpoint, all rejected 403) | Pending: Sprint 1 contract | Planned |
| BR-17 | A disabled user cannot log in, and all of their sessions are revoked when the account... | F-01, F-02 | Sprint 1 | API test | Pending: Sprint 1 contract | Planned |
| BR-18 | An administrator cannot disable their own account or the last active administrator. | F-02 | Sprint 1 | API test | Pending: Sprint 1 contract | Planned |
| BR-19 | In Sprint 1 recorded transactions are immutable (no edit or delete operation exists).... | F-05, F-06, F-12 | Sprint 1 | API test (update/delete verbs not available); Sprint 2 audit test | Pending: Sprint 1 contract | Planned |
| BR-20 | Favorites are private to their owner. Duplicating a transaction creates an unsaved... | F-15 | Sprint 3 | API test | Sprint 3 contract | Planned |
| BR-21 | A failed login returns one generic message that does not reveal whether the email... | F-01 | Sprint 1 | API test | Pending: Sprint 1 contract | Planned |
| NFR-01 | Every protected endpoint answers 401 to an unauthenticated request without any private... | F-01 | Sprint 1 | API test iterating over every protected route | Pending: Sprint 1 contract | Planned |
| NFR-02 | Passwords are stored only as bcrypt hashes with cost factor 12; plaintext never... | F-01 | Sprint 1 | Integration test on stored hash + review | Pending: Sprint 1 contract | Planned |
| NFR-03 | A rejected transaction leaves the database unchanged: header, lines and balances are... | SR-01, F-05, F-06 | Sprint 1 | Integration test comparing row counts before/after a rejected request | Pending: Sprint 1 contract | Planned |
| NFR-04 | Monetary arithmetic is exact: amounts are integers end to end, with no floating-point... | SR-01 | Sprint 1 | Unit tests on sums (e.g. 3 lines of 1,000 + 1 + 1) and type review | Pending: Sprint 1 contract | Planned |
| NFR-05 | A session expires 8 hours after login; logout invalidates it immediately on the server. | F-01 | Sprint 1 | API test with controllable clock + reuse-after-logout test | Pending: Sprint 1 contract | Planned |
| NFR-06 | A clean checkout can be installed, migrated, seeded, run and tested using at most 5... | SR-02 | Sprint 1 | Manual run of the README on a fresh clone, result recorded | Pending: Sprint 1 contract | Planned |
| NFR-07 | Committed data survives an application restart (verified locally in Sprint 1; across... | SR-02, F-05, F-06 | Sprint 1 | Integration test restarting the app against the same database | Pending: Sprint 1 contract | Planned |
| NFR-08 | Error responses never contain stack traces, SQL, file paths or other users' identifiers. | SR-02 | Sprint 1 | API tests on error bodies | Pending: Sprint 1 contract | Planned |
| NFR-09 | The ledger domain module has at least 80% line coverage from automated tests. | SR-01 | Sprint 1 | Coverage report in the test run | Pending: Sprint 1 contract | Planned |
| NFR-10 | Every Sprint 1 screen has validation, loading, empty and error states and is usable at... | F-03, F-05, F-06, F-07, HR-01 | Sprint 1 | UI tests on Sprint 1 screens; full pass in Sprint 3 | Pending: Sprint 1 contract | Planned |
| NFR-11 | History and summary requests return in 500 ms or less (95th percentile) for a user... | F-07, F-16, HR-01 | Sprint 3 | Benchmark script on generated data | Sprint 3 contract | Planned |
| NFR-12 | All configuration comes from environment variables documented in .env.example; no... | SR-02 | Sprint 1 | Secret scan of the repository + review | Pending: Sprint 1 contract | Planned |
| NFR-13 | Two concurrent payments cannot together overdraw a Cash account. | SR-01, F-06 | Sprint 2 | Concurrency integration test | Sprint 2 contract | Planned |

## Coverage check (generated from the baseline data)

| Item | Count |
|---|---|
| Functional requirements | 28 |
| Business rules | 21 |
| Non-functional requirements | 13 |
| Requirements assigned to Sprint 1 | 45 |
| Requirements assigned to Sprint 2 | 8 |
| Requirements assigned to Sprint 3 | 9 |
| Requirements without a feature or responsibility | 0 |
| Features or responsibilities without a requirement | 0 |

**Coverage gaps:** none at baseline.
**Approved changes since baseline:** none.
**Status legend:** Planned (baseline), Specified (contract written), Implemented, Verified (test executed and passing), Changed (see change log).

## Change log

| Date | Change | Reason | Approved by |
|---|---|---|---|
| 2026-10-23 | Baseline v0.1 created | Initial planning | Team |
