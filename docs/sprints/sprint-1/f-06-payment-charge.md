# Engineering Contract: F-06 Payment and Charge Transactions

**Feature ID:** `F-06`  
**Feature Name:** Payment and Charge Transactions (Expenses & Card Repayment)  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-03` (Account Overview), `SR-01` (Ledger Domain Engine)  
**Linked Requirements:** FR-14, FR-15, BR-01, BR-02, BR-03, BR-04, BR-07, BR-08, BR-09, BR-11, BR-19, NFR-03, NFR-07, NFR-10, NFR-13  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **Payment / Charge Workflow:**
   - User initiates a payment/charge transaction.
   - Chooses a source account:
     - `CASH` (Wallet / Bank): Deducts cash balance.
     - `LOAN_TAKEN` (Credit Card): Increases outstanding debt balance.
   - Enters total amount and transaction date ($\le \text{today}$).
   - Allocates the total across target accounts:
     - `EXPENSE` accounts (e.g. Dining, Groceries) $\rightarrow$ increases expense totals.
     - `LOAN_TAKEN` account (Credit Card Repayment from Cash) $\rightarrow$ decreases outstanding card debt.
2. **Business Rules & Critical Safeguards:**
   - **Overdraft Guard (BR-07):** If paying from a `CASH` account, the transaction must not drive the account balance below 0. Rejects with `OVERDRAFT_DISALLOWED` (422).
   - **Repayment Cap (BR-08):** If allocating payment to repay a `LOAN_TAKEN` account, the repayment amount cannot exceed the target account's current outstanding debt. Rejects with `REPAYMENT_EXCEEDS_DEBT` (422).
   - **Main Account Restriction (BR-04):** An allocation line cannot target the source account itself (e.g., cannot repay Credit Card using Credit Card as source). Rejects with `SELF_TARGET_DISALLOWED` (422).
   - **Exact Sum (BR-01):** Sum of allocation lines must equal header total exactly.
   - **Single Transaction Atomicity (NFR-03):** Header and all lines written within a single Prisma transaction.

---

## 2. Technical Specifications

### 2.1 API Endpoint
- `POST /api/transactions/payment`
  - **Headers:** `Cookie: sid=<token>`
  - **Body:**
    ```json
    {
      "mainAccountId": "cuid...",
      "totalMinor": 120000,
      "transactionDate": "2026-10-23",
      "description": "Weekend Supermarket & Dinner",
      "allocations": [
        {
          "targetAccountId": "cuid-dining...",
          "amountMinor": 80000,
          "memo": "Restaurant dinner"
        },
        {
          "targetAccountId": "cuid-groceries...",
          "amountMinor": 40000,
          "memo": "Weekly groceries"
        }
      ]
    }
    ```
  - **Response 201 Created:** Returns transaction object with populated allocation items.
  - **Error Codes:**
    - `ALLOCATION_SUM_MISMATCH` (422)
    - `OVERDRAFT_DISALLOWED` (422)
    - `REPAYMENT_EXCEEDS_DEBT` (422)
    - `SELF_TARGET_DISALLOWED` (422)
    - `FUTURE_DATE_DISALLOWED` (422)

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F06-01** | Card purchase with 2 expense lines | Charge 1,200 THB on Credit Card (800 Dining + 400 Groceries) | 201 Created; Card debt increases by 1,200; Expenses increase by 1,200. |
| **AC-F06-02** | Credit card repayment from Bank | Pay 700 THB from Bank to Credit Card | 201 Created; Bank balance decreases by 700; Card debt decreases by 700; Expense total unchanged. |
| **AC-F06-03** | Cash overdraft rejection | Bank balance = 79,300 THB; attempt payment of 100,000 THB | 422 Unprocessable Entity with `OVERDRAFT_DISALLOWED`. |
| **AC-F06-04** | Excessive debt repayment rejection | Card debt = 500 THB; attempt repayment of 600 THB | 422 Unprocessable Entity with `REPAYMENT_EXCEEDS_DEBT`. |
| **AC-F06-05** | Allocation sum mismatch | Total = 1,200 THB; lines = 800 + 300 THB | 422 with `ALLOCATION_SUM_MISMATCH`. |
| **AC-F06-06** | Self-target rejection | Source = Credit Card; Line target = Credit Card | 422 with `SELF_TARGET_DISALLOWED`. |
| **AC-F06-07** | Future date rejection | Date set to future | 422 with `FUTURE_DATE_DISALLOWED`. |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F06-01** | AC-F06-01 | API | Post payment from Credit Card with Dining and Grocery lines. | Status 201; Card balance reflects +120,000 minor units debt. |
| **TEST-F06-02** | AC-F06-02 | API | Post payment from Bank to Credit Card target account. | Status 201; Bank decreases by 70,000; Card debt decreases by 70,000. |
| **TEST-F06-03** | AC-F06-03 | API | Post payment from Bank with amount exceeding current balance. | Status 422, error code `OVERDRAFT_DISALLOWED`. |
| **TEST-F06-04** | AC-F06-04 | API | Card debt is 500 THB; post repayment of 600 THB. | Status 422, error code `REPAYMENT_EXCEEDS_DEBT`. |
| **TEST-F06-05** | AC-F06-05 | API | Post payment where lines sum does not match header total. | Status 422, error code `ALLOCATION_SUM_MISMATCH`. |
| **TEST-F06-06** | AC-F06-06 | API | Post payment with line targeting same account as `mainAccountId`. | Status 422, error code `SELF_TARGET_DISALLOWED`. |
| **TEST-F06-07** | AC-F06-07 | API | Post payment with future date string. | Status 422, error code `FUTURE_DATE_DISALLOWED`. |

---

## 5. Definition of Done
- Payment/charge endpoint and UI form implemented.
- TDD test commits showing red failure followed by green fix for overdraft and debt cap rules.
- Worked example demonstration sequence validated end-to-end.
