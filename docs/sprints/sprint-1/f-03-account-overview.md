# Engineering Contract: F-03 Account Overview & Derived Balances

**Feature ID:** `F-03`  
**Feature Name:** Account Overview and Derived Balances Dashboard  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-01` (Auth), `SR-01` (Ledger Domain Engine), `SR-02` (Platform Baseline)  
**Linked Requirements:** FR-07, FR-08, BR-06, BR-10, BR-13, BR-14, BR-15, NFR-10  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **Dynamic Balance Aggregation:**
   - On request, the system retrieves all active accounts for the authenticated user along with their ledger transactions.
   - The Ledger Engine (`SR-01`) evaluates all transactions and computes derived balances:
     - **Cash Accounts (Wallet, Bank):** Total cash held.
     - **Loan Taken (Credit Card, Loans):** Total outstanding debt.
     - **Loan Given:** Total receivable owed to the user.
     - **Income & Expense:** Accumulated category totals.
2. **Privacy Enforcement:**
   - Queries strictly filter by `userId === req.user.id`. Requests for other users' account details fail with `404 Not Found` (BR-10, D-15).
3. **Responsive Presentation (NFR-10):**
   - Dashboard provides structured visual cards for Cash, Credit Card Debt, and Receivables.
   - Fully responsive down to 360px viewport width.
   - Implements loading skeletons, empty state when no accounts have transactions, and structured error states.

---

## 2. Technical Specifications

### 2.1 API Endpoints
- `GET /api/accounts`
  - **Headers:** `Cookie: sid=<token>`
  - **Response 200:**
    ```json
    {
      "accounts": [
        {
          "id": "cuid...",
          "name": "Main Bank Account",
          "type": "CASH",
          "subtype": "BANK",
          "balanceMinor": 5000000,
          "balanceFormatted": "฿50,000.00"
        },
        {
          "id": "cuid...",
          "name": "Credit Card",
          "type": "LOAN_TAKEN",
          "subtype": "CREDIT_CARD",
          "balanceMinor": 120000,
          "balanceFormatted": "฿1,200.00"
        }
      ],
      "summary": {
        "totalCashMinor": 5000000,
        "totalDebtMinor": 120000,
        "totalReceivableMinor": 0
      }
    }
    ```

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F03-01** | Retrieve user accounts | User has seeded accounts | 200 OK with list of accounts and derived balances. |
| **AC-F03-02** | Correct balance derivation | Bank has 50k opening, 30k salary, 700 repayment | Bank balance correctly computes to ฿79,300.00. |
| **AC-F03-03** | Credit card debt display | Card has 1,200 charge and 700 repayment | Outstanding debt correctly displays ฿500.00. |
| **AC-F03-04** | Privacy isolation | User 1 calls `/api/accounts` | Only User 1's accounts returned; zero records from User 2. |
| **AC-F03-05** | UI Responsive states | Viewport set to 360px width | Dashboard layout wraps gracefully without horizontal overflow (NFR-10). |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F03-01** | AC-F03-01 | API | Authenticated `GET /api/accounts`. | 200 OK with `accounts` array matching user's accounts. |
| **TEST-F03-02** | AC-F03-02 | Integration | Record opening balance + salary + payment; request `/api/accounts`. | Bank account balance equals 7,930,000 minor units. |
| **TEST-F03-03** | AC-F03-03 | Integration | Record card charge and partial repayment; request `/api/accounts`. | Card balance equals 50,000 minor units debt. |
| **TEST-F03-04** | AC-F03-04 | API | Seed data for User 1 and User 2; User 1 requests accounts. | Accounts belong exclusively to User 1. |
| **TEST-F03-05** | AC-F03-05 | UI / E2E | Render dashboard in 360px viewport; check card rendering. | All cards visible without horizontal scrollbar. |

---

## 5. Definition of Done
- Overview API and UI dashboard implemented with derived balances.
- Automated API tests verify balance derivation for all account types.
