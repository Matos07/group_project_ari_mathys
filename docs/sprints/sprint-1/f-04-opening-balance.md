# Engineering Contract: F-04 Opening Balance Recording

**Feature ID:** `F-04`  
**Feature Name:** Opening Balance Recording  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-03` (Account Overview), `SR-01` (Ledger Domain Engine)  
**Linked Requirements:** FR-11, BR-02, BR-12  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **Creation of Opening Balance:**
   - A user records an initial balance on a Cash, Loan Taken, or Loan Given account.
   - Creates a transaction row with `kind: 'OPENING_BALANCE'`.
   - Opening balance transactions have **no allocation lines** (D-08, D-14).
2. **Business Rules:**
   - Applicable only to `CASH`, `LOAN_TAKEN`, or `LOAN_GIVEN` accounts (BR-12). Attempting to set an opening balance on `INCOME` or `EXPENSE` accounts is rejected with `422 Unprocessable Entity`.
   - Amount must be a positive integer $\ge 1$ satang and $\le 1,000,000,000$ satang (BR-02).
   - In Sprint 1, at most one opening balance is allowed per account (BR-12). Subsequent attempts return `422`.
   - Never counted as Income or Expense (BR-05, D-14).

---

## 2. Technical Specifications

### 2.1 API Endpoint
- `POST /api/transactions/opening-balance`
  - **Headers:** `Cookie: sid=<token>`
  - **Body:**
    ```json
    {
      "accountId": "cuid...",
      "amountMinor": 5000000,
      "date": "2026-10-23",
      "description": "Initial bank deposit"
    }
    ```
  - **Response 201 Created:**
    ```json
    {
      "transaction": {
        "id": "cuid...",
        "kind": "OPENING_BALANCE",
        "mainAccountId": "cuid...",
        "totalMinor": 5000000,
        "transactionDate": "2026-10-23",
        "description": "Initial bank deposit"
      }
    }
    ```
  - **Response 422 Unprocessable Entity:**
    - If target account is `INCOME` or `EXPENSE`: `INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE`.
    - If account already has an opening balance: `OPENING_BALANCE_EXISTS`.

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F04-01** | Valid opening balance | Cash account, amount = 5,000,000 satang (50k THB) | 201 Created; Cash balance updates to 50,000.00 THB. |
| **AC-F04-02** | Invalid target account type | Setting opening balance on Expense account | 422 with `INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE`. |
| **AC-F04-03** | Duplicate opening balance | Account already has an opening balance transaction | 422 with `OPENING_BALANCE_EXISTS`. |
| **AC-F04-04** | Negative or zero amount | `amountMinor: 0` or `-100` | 400 Bad Request with validation error. |
| **AC-F04-05** | Isolation from income | Record 50k opening balance | Income and Expense summaries remain 0. |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F04-01** | AC-F04-01 | API | Post valid opening balance to Main Bank. | Status 201 Created; subsequent account query shows 5,000,000 satang balance. |
| **TEST-F04-02** | AC-F04-02 | API | Post opening balance targeting Dining expense account. | Status 422 with code `INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE`. |
| **TEST-F04-03** | AC-F04-03 | API | Post opening balance twice on same Bank account. | First returns 201, second returns 422 `OPENING_BALANCE_EXISTS`. |
| **TEST-F04-04** | AC-F04-04 | API | Post opening balance with `amountMinor: 0`. | Status 400 Bad Request. |
| **TEST-F04-05** | AC-F04-05 | Integration | Record opening balance $\rightarrow$ query `/api/summary/income-expense`. | `incomeMinor: 0, expenseMinor: 0`. |

---

## 5. Definition of Done
- Endpoint and UI dialog for opening balance completed.
- Tests passing for positive creation, duplicate prevention, and income isolation.
