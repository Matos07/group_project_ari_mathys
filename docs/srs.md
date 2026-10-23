# Software Requirements Specification - Personal Money and Expense Logging System

**Course:** CPE 334, Semester 1/2026 | **Theme:** 7 - Personal Money and Expense Logging System
**Team:** [Student 1 - ID] and [Student 2 - ID] | **Repository:** [URL]
**Document version:** v0.1 (baseline) - 2026-10-23
**Related documents:** `docs/decisions.md`, `docs/features.md`, `docs/traceability.md`, `docs/sprints/plan.md`

## 1. Stakeholder problem and context

A person needs one place to track money: bank and wallet balances, credit-card spending, personal loans
(given and taken), income and expenses. Today this is done with memory, paper or loose spreadsheets, which makes
it hard to answer simple questions: *How much do I have? How much do I owe on my card? Where did my money go
this month?* The most error-prone part is a single real-life payment that does several things at once, for example
one card payment that covers groceries, a friend's loan and a transfer.

The product is a multi-user web application. Each user owns private financial accounts and transactions. A
transaction records one real movement of money and splits it into **allocation lines** that say where the money
went or came from. The system keeps every balance consistent and separates real income/expenses from
internal movements (transfers, borrowing, loan repayments, opening balances).

**Chosen context:** an individual tracking personal finances in Thai baht (THB), using synthetic demo data.

## 2. Actors

| Actor | Responsibilities |
|---|---|
| **User** | Owns private accounts and transactions. Records opening balances, receipts and payments, reviews balances, history and summaries. Cannot see other users' data. |
| **Administrator** | Manages platform user accounts (list, enable, disable). Has no financial accounts and cannot read or modify any financial record or summary. |

There are no other human actors and no external systems (no bank integration, no payment gateway).

## 3. Scope and exclusions

**In scope (whole product, delivered over three sprints):** authentication and roles; five account types; opening
balances; receipts and payments with allocation lines; loans given and taken with repayments; transfers; transaction
corrections with an audit trail; balances, history, income/expense summary, category spending, reports; search and
filtering; favorites and duplication; administrator user management.

**Explicit exclusions:**
- Period budgets, shared budgets, automatic recurring transactions and bank integration (excluded by the stakeholder brief).
- Multiple currencies and exchange rates; interest, fees or credit-limit calculation on loans and cards.
- Self-registration, password recovery, email verification, multiple roles per account, advanced account administration.
- File/receipt attachments, data import, notifications and a native mobile application.
- Real financial data: all data is synthetic.

## 4. Product summary

### 4.1 Account types

| Type | Subtypes | Meaning |
|---|---|---|
| Cash | Wallet, Bank | Money the user holds. Balance is the amount held. |
| Loan Taken | Credit card, Other loan | Money the user owes. Balance is the outstanding debt. |
| Loan Given | (none) | Money others owe the user. Balance is the amount owed to the user. |
| Income | (none) | Category of earnings (salary, interest earned). Accumulates a total. |
| Expense | (none) | Category of spending (dining, groceries, electricity, telecom). Accumulates a total. |

### 4.2 Transaction forms

- **Payment / charge:** choose the account used (Cash, Bank, credit card or other Loan Taken). Allocate the total across Expense accounts, repayments of Loans Taken, new Loans Given, or transfers to another Cash account.
- **Receive money:** choose the Cash/Bank account receiving the money. Allocate the total across Income accounts, repayments of Loans Given, new borrowing on a Loan Taken account, or transfers from another Cash account.
- **Opening balance:** a dated starting amount on one Cash, Loan Taken or Loan Given account (no allocation lines).

### 4.3 Balance-effect table (decision D-09)

Balances are derived from recorded transactions. "Debt" and "owed" are positive numbers.

**Payment from account S, one line of amount *a* to target T:**

| Main account S | Effect on S | Target T | Effect on T |
|---|---|---|---|
| Cash | balance - a | Expense | expense total + a |
| Cash | balance - a | Loan Taken (repayment) | debt - a |
| Cash | balance - a | Loan Given (new loan) | owed + a |
| Cash | balance - a | Cash (transfer in) | balance + a |
| Loan Taken (card/loan) | debt + a | any allowed target (same effects as above on T) | as above |

**Receipt into cash account D, one line of amount *a* from source T:**

| Main account D | Effect on D | Source T | Effect on T |
|---|---|---|---|
| Cash | balance + a | Income | income total + a |
| Cash | balance + a | Loan Given (repayment received) | owed - a |
| Cash | balance + a | Loan Taken (new borrowing) | debt + a |
| Cash | balance + a | Cash (transfer out of T) | balance - a |

**Opening balance of amount *a*:** Cash balance + a; Loan Taken debt + a; Loan Given owed + a. It never counts as income or expense.

### 4.4 Worked example (Sprint 1 demonstration sequence)

| Step | Action | Result |
|---|---|---|
| 1 | Opening balance 50,000.00 on Bank | Bank 50,000.00 |
| 2 | Receive 30,000.00 into Bank, line: Income "Salary" 30,000.00 | Bank 80,000.00; income 30,000.00 |
| 3 | Charge 1,200.00 on Credit Card, lines: Expense "Dining" 800.00 + Expense "Groceries" 400.00 | Card debt 1,200.00; expenses 1,200.00 |
| 4 | Pay 700.00 from Bank, line: Loan Taken "Credit Card" (repayment) 700.00 | Bank 79,300.00; card debt 500.00; expenses still 1,200.00 |

Rejection examples: step 3 with lines 800.00 + 300.00 (sum mismatch, BR-01); a 100,000.00 payment from Bank (negative balance, BR-07);
a 600.00 card repayment when debt is 500.00 (BR-08); user B requesting user A's transaction (404, BR-10); the administrator calling a financial endpoint (403, BR-16).

## 5. Requirements

Each requirement has a stable ID. The **Sprint** column is the sprint that establishes and verifies it
(see `docs/traceability.md` for the feature mapping and `docs/sprints/plan.md` for the plan).

### 5.1 Functional requirements (FR)

| ID | Requirement | Sprint |
|---|---|---|
| FR-01 | An active user can log in with email and password and receives a server-side session carried by an httpOnly cookie. | 1 |
| FR-02 | A logged-in user can log out; the session is invalidated server-side and the old cookie no longer authenticates. | 1 |
| FR-03 | A logged-in user can retrieve their current identity (id, email, display name, role). | 1 |
| FR-04 | The backend authorizes every protected operation from the identity and role stored in the session: financial operations require role USER, user management requires ADMINISTRATOR. Client-supplied user IDs or roles are ignored. | 1 |
| FR-05 | An administrator can list platform user accounts (email, display name, role, active status) without any financial data. | 1 |
| FR-06 | An administrator can enable or disable another user account. | 1 |
| FR-07 | A user can view their cash and bank accounts with current balances. | 1 |
| FR-08 | A user can view outstanding loans taken (including credit-card debt) and amounts owed to them (loans given). | 1 |
| FR-09 | A user can create an account by choosing its type (Cash, Loan Given, Loan Taken, Income, Expense), subtype and name. | 2 |
| FR-10 | A user can rename or archive an account; archived accounts cannot be used in new transactions. | 2 |
| FR-11 | A user can record a dated opening balance for a Cash, Loan Taken or Loan Given account. | 1 |
| FR-12 | A user can modify an existing opening balance; the previous value stays in an audit history. | 3 |
| FR-13 | A user can record a 'Receive money' transaction into a cash or bank account, allocated across one or more income accounts. | 1 |
| FR-14 | A user can record a 'Payment/charge' transaction from a cash, bank, credit-card or other loan-taken account, allocated across one or more expense accounts. | 1 |
| FR-15 | A user can allocate part or all of a payment to the repayment of a loan taken (for example paying a credit card from a bank account). | 1 |
| FR-16 | A user can allocate part of a payment to a new loan given to someone. | 2 |
| FR-17 | A user can allocate part of a receipt to the repayment of a loan given. | 2 |
| FR-18 | A user can allocate part of a receipt to a new borrowing on a loan-taken account. | 2 |
| FR-19 | A user can transfer money between their own cash/bank accounts. | 2 |
| FR-20 | A user can correct a recorded transaction; the original stays visible in an audit trail. | 2 |
| FR-21 | A user can view their transaction history, newest first and paginated, with each transaction's allocation lines. | 1 |
| FR-22 | A user can view total income and total expenses for a date range. | 1 |
| FR-23 | A user can search and filter transactions by date range, account, amount range and text. | 3 |
| FR-24 | A user can view spending per expense category for a period. | 3 |
| FR-25 | A user can view reports: monthly income/expense/net and outstanding loans. | 3 |
| FR-26 | A user can mark and unmark a transaction as favorite. | 3 |
| FR-27 | A user can list their favorite transactions. | 3 |
| FR-28 | A user can duplicate a transaction into a new editable form pre-filled with the same details; nothing is stored until it is submitted. | 3 |

### 5.2 Business rules (BR)

| ID | Rule | Sprint |
|---|---|---|
| BR-01 | A transaction has at least one allocation line, and the sum of its allocation lines equals the transaction total exactly. | 1 |
| BR-02 | Amounts are positive integers in minor units (satang); each line is at least 1 and a transaction total is at most 1,000,000,000 (10,000,000.00 THB). | 1 |
| BR-03 | Allowed allocation targets depend on the form. Payment: Expense, Loan Taken (repayment), Loan Given (new loan), Cash (transfer). Receipt: Income, Loan Given (repayment received), Loan Taken (new borrowing), Cash (transfer in). Any other target type is rejected. | 1 |
| BR-04 | An allocation line may not target the same account as the transaction's main account. | 1 |
| BR-05 | Only lines targeting Income accounts count as income and only lines targeting Expense accounts count as expenses. Transfers, borrowing, lending, loan repayments and opening balances never do. | 1 |
| BR-06 | Every transaction updates all involved balances according to the balance-effect table (SRS section 5.4); balances are derived from recorded transactions. | 1 |
| BR-07 | A transaction that would make a Cash account balance negative is rejected (checked on the resulting current balance). | 1 |
| BR-08 | A loan repayment (paid or received) may not exceed the outstanding amount of the target loan account, counting all lines of the same transaction. | 1 |
| BR-09 | A transaction date is a calendar date (Asia/Bangkok) and may not be in the future. | 1 |
| BR-10 | A user can only read or change their own accounts, transactions and summaries; requesting another user's resource answers 404, as if it did not exist. | 1 |
| BR-11 | Every account referenced by a transaction must belong to the transaction's owner and be active. | 1 |
| BR-12 | An opening balance applies only to Cash, Loan Taken or Loan Given accounts, is at least 1, and at most one exists per account in Sprint 1. | 1 |
| BR-13 | Account type is fixed at creation. Income and Expense accounts accumulate totals and hold no balance. | 1 |
| BR-14 | Account names are unique per user (case-insensitive). | 1 |
| BR-15 | The product is single-currency: all amounts are Thai baht (THB). | 1 |
| BR-16 | An administrator holds no financial accounts and cannot read or modify any user's financial records or summaries. | 1 |
| BR-17 | A disabled user cannot log in, and all of their sessions are revoked when the account is disabled. | 1 |
| BR-18 | An administrator cannot disable their own account or the last active administrator. | 1 |
| BR-19 | In Sprint 1 recorded transactions are immutable (no edit or delete operation exists). From Sprint 2, corrections keep the original and link a replacement. | 1 |
| BR-20 | Favorites are private to their owner. Duplicating a transaction creates an unsaved draft; nothing is stored until submitted. | 3 |
| BR-21 | A failed login returns one generic message that does not reveal whether the email exists. A disabled account is revealed only after a correct password. | 1 |

### 5.3 Non-functional requirements (NFR)

| ID | Measurable target | Verification method | Sprint |
|---|---|---|---|
| NFR-01 | Every protected endpoint answers 401 to an unauthenticated request without any private data in the body. | API test iterating over every protected route | 1 |
| NFR-02 | Passwords are stored only as bcrypt hashes with cost factor 12; plaintext never appears in the database, logs or responses. | Integration test on stored hash + review | 1 |
| NFR-03 | A rejected transaction leaves the database unchanged: header, lines and balances are written atomically or not at all. | Integration test comparing row counts before/after a rejected request | 1 |
| NFR-04 | Monetary arithmetic is exact: amounts are integers end to end, with no floating-point sums. | Unit tests on sums (e.g. 3 lines of 1,000 + 1 + 1) and type review | 1 |
| NFR-05 | A session expires 8 hours after login; logout invalidates it immediately on the server. | API test with controllable clock + reuse-after-logout test | 1 |
| NFR-06 | A clean checkout can be installed, migrated, seeded, run and tested using at most 5 documented commands. | Manual run of the README on a fresh clone, result recorded | 1 |
| NFR-07 | Committed data survives an application restart (verified locally in Sprint 1; across redeployment in Lab 5). | Integration test restarting the app against the same database | 1 |
| NFR-08 | Error responses never contain stack traces, SQL, file paths or other users' identifiers. | API tests on error bodies | 1 |
| NFR-09 | The ledger domain module has at least 80% line coverage from automated tests. | Coverage report in the test run | 1 |
| NFR-10 | Every Sprint 1 screen has validation, loading, empty and error states and is usable at 360 px width; the rest of the product is checked in Sprint 3. | UI tests on Sprint 1 screens; full pass in Sprint 3 | 1 |
| NFR-11 | History and summary requests return in 500 ms or less (95th percentile) for a user with 5,000 transactions on a development machine. | Benchmark script on generated data | 3 |
| NFR-12 | All configuration comes from environment variables documented in .env.example; no secret or real password is committed. | Secret scan of the repository + review | 1 |
| NFR-13 | Two concurrent payments cannot together overdraw a Cash account. | Concurrency integration test | 2 |


NFR-07 is verified locally in Sprint 1 and across redeployment in Lab 5. NFR-10 is verified on Sprint 1 screens in
Sprint 1 and on the whole product in Sprint 3.

## 6. Assumptions

| ID | Assumption |
|---|---|
| A-01 | All users and amounts are synthetic; THB is the only currency (BR-15). |
| A-02 | Dates are calendar dates in the Asia/Bangkok time zone; transactions carry no time of day. |
| A-03 | Accounts are seeded in Sprint 1; account creation arrives in Sprint 2 (FR-09). |
| A-04 | Seeded demo accounts are sufficient for authentication in Sprint 1; users do not self-register. |
| A-05 | A user's data volume stays in the low thousands of transactions (NFR-11). |
| A-06 | Demo passwords are supplied through the `SEED_PASSWORD` environment variable and are never committed. |

## 7. Decisions and questions

Design decisions D-01 to D-25 are recorded with rationale in `docs/decisions.md`. The ones that shape requirements are:
money as integer minor units (D-06), balances derived from transactions (D-07), the allocation matrix (D-10), no overdraft
and repayment cap (D-11), immutability in Sprint 1 (D-13), 404 for foreign resources (D-15).

| ID | Question | Resolution |
|---|---|---|
| Q-01 | Is a Sprint 1 with seeded accounts (account creation in Sprint 2) an acceptable vertical slice? | Applied by default: the Sprint 1 example of theme 7 uses seeded accounts. To confirm with the TA. |
| Q-02 | Must the administrator create users in Sprint 1? | No. Enable/disable only; users are seeded. To confirm with the TA. |
| Q-03 | Is a single currency acceptable? | Applied by default (BR-15). |
| Q-04 | Do reports need file export? | No. On-screen reports only (FR-25). |

## 8. Glossary

**Allocation line:** one part of a transaction total assigned to a target account. **Main account:** the Cash or Loan Taken
account used by a Payment, or the Cash account receiving a Receipt. **Minor unit:** satang (1 THB = 100 satang).
**Outstanding amount:** current debt on a Loan Taken account or current amount owed on a Loan Given account.
