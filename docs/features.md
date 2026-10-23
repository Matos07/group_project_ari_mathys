# Feature inventory - Personal Money and Expense Logging System

**Version:** v0.1 (baseline) - 2026-10-23

Features carry the IDs `F-xx`. `SR-xx` and `HR-xx` are named system responsibilities used for cross-cutting requirements.
Sprint 1 features receive full engineering contracts in `docs/sprints/sprint-1/`.

| ID | Feature / responsibility | Description | Requirements | Depends on | Sprint |
|---|---|---|---|---|---|
| F-01 | Authentication, sessions and role-based access | Login/logout, current user, server-side session cookie, USER/ADMINISTRATOR role guard, ownership guard (foreign resources answer 404). | FR-01, FR-02, FR-03, FR-04, BR-10, BR-16, BR-17, BR-21, NFR-01, NFR-02, NFR-05 | - | 1 |
| F-02 | Administrator user management | Admin lists platform users and enables/disables accounts; admin has no access to any financial endpoint. | FR-05, FR-06, BR-16, BR-17, BR-18 | F-01 | 1 |
| F-03 | Seed data and account overview | Seeded demo users and accounts; overview of cash/bank balances, loans taken (credit-card debt) and money owed to the user. | FR-07, FR-08, BR-06, BR-10, BR-13, BR-14, BR-15, NFR-10 | F-01, SR-01, SR-02 | 1 |
| F-04 | Opening balance recording | Record a dated opening balance on a Cash, Loan Taken or Loan Given account (one per account in Sprint 1). | FR-11, BR-02, BR-12 | F-03, SR-01 | 1 |
| F-05 | Receive money (income allocations) | Receipt into a cash/bank account allocated across one or more income accounts, with full validation. | FR-13, BR-01, BR-02, BR-03, BR-04, BR-09, BR-11, BR-19, NFR-03, NFR-07, NFR-10 | F-03, SR-01 | 1 |
| F-06 | Payment / charge (expenses and loan-taken repayment) | Payment from a cash/bank/credit-card account allocated across expense accounts and/or repayment of a loan taken. | FR-14, FR-15, BR-01, BR-02, BR-03, BR-04, BR-07, BR-08, BR-09, BR-11, BR-19, NFR-03, NFR-07, NFR-10, NFR-13 | F-03, SR-01 | 1 |
| F-07 | Transaction history and income/expense summary | Paginated newest-first history with allocation lines; income and expense totals for a period. | FR-21, FR-22, BR-05, BR-10, NFR-10, NFR-11 | F-05, F-06 | 1 |
| SR-01 | Ledger engine (system responsibility) | Domain module that validates allocations, applies the balance-effect rules and derives balances; used by every money feature. | BR-01, BR-02, BR-03, BR-05, BR-06, BR-07, BR-08, NFR-03, NFR-04, NFR-09, NFR-13 | - | 1 |
| SR-02 | Platform baseline (system responsibility) | Configuration via environment variables, migrations and seed procedure, safe error handling, README and reproducible setup. | BR-15, NFR-06, NFR-07, NFR-08, NFR-12 | - | 1 |
| F-08 | Account management | Create, rename and archive accounts of the five types. | FR-09, FR-10, BR-13, BR-14 | F-03 | 2 |
| F-09 | Loans given: lend and receive repayment | Payment line to a Loan Given account; receipt line repaying a Loan Given account. | FR-16, FR-17 | F-05, F-06, F-08 | 2 |
| F-10 | Borrowing (new loan taken) | Receipt line allocated to a Loan Taken account, increasing the debt. | FR-18 | F-05, F-08 | 2 |
| F-11 | Transfers between cash/bank accounts | Payment line to another cash/bank account and receipt line from another cash/bank account. | FR-19 | F-05, F-06, F-08 | 2 |
| F-12 | Transaction corrections with audit trail | Correct a transaction by voiding it and recording a linked replacement; originals stay visible. | FR-20, BR-19 | F-07, F-09, F-10, F-11 | 2 |
| F-13 | Opening balance management | Edit an existing opening balance with audit history. | FR-12 | F-04, F-12 | 3 |
| F-14 | Search and filter transactions | Filter history by date range, account, amount range and text. | FR-23 | F-07 | 3 |
| F-15 | Favorites and duplication | Mark/unmark favorites, list favorites, duplicate into a new editable unsaved form. | FR-26, FR-27, FR-28, BR-20 | F-07 | 3 |
| F-16 | Category spending summary | Spending per expense account for a period. | FR-24, NFR-11 | F-07 | 3 |
| F-17 | Reports | Monthly income/expense/net and outstanding-loans reports. | FR-25 | F-07, F-16 | 3 |
| HR-01 | Product hardening (system responsibility) | Performance, usability (UI states, responsive), failure handling and regression pass over the whole product. | NFR-10, NFR-11 | F-17 | 3 |

## Sprint 1 vertical slice

F-01 to F-07 together with SR-01 and SR-02 deliver the journey: log in as a user, record an opening balance, receive a salary,
charge a card with two expense lines, repay part of the card from the bank, then see balances, outstanding debt, the
income/expense summary and the history. A second user and the administrator are used to demonstrate access restrictions.
