# Engineering Contract: F-05 Receive Money (Income Allocations)

**Feature ID:** `F-05`  
**Feature Name:** Receive Money Transactions (Income Allocations)  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-03` (Account Overview), `SR-01` (Ledger Domain Engine)  
**Linked Requirements:** FR-13, BR-01, BR-02, BR-03, BR-04, BR-09, BR-11, BR-19, NFR-03, NFR-07, NFR-10  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **Receive Money Workflow:**
   - User opens the "Receive Money" form.
   - Selects a receiving destination `CASH` account (Wallet or Bank).
   - Enters total amount received and transaction date ($\le \text{today}$).
   - Adds one or more allocation lines, choosing target `INCOME` accounts (e.g. Salary, Interest) and assigning amounts.
2. **Server-Side Validation & Business Rules:**
   - Main account must belong to user, be active, and be of type `CASH` (BR-03, BR-11).
   - Target accounts must belong to user, be active, and be of type `INCOME` in Sprint 1 (BR-03, BR-11).
   - Target account cannot equal main account (BR-04).
   - Total amount must equal the exact sum of all allocation lines (BR-01).
   - Date must be a valid calendar date formatted `YYYY-MM-DD` and cannot be in the future (BR-09).
   - Transaction header and all allocation lines are committed atomically in a single Prisma `$transaction` (NFR-03).
   - Recorded transactions cannot be modified or deleted in Sprint 1 (BR-19).

---

## 2. Technical Specifications

### 2.1 API Endpoint
- `POST /api/transactions/receipt`
  - **Headers:** `Cookie: sid=<token>`
  - **Body:**
    ```json
    {
      "mainAccountId": "cuid...",
      "totalMinor": 3000000,
      "transactionDate": "2026-10-23",
      "description": "October Monthly Salary",
      "allocations": [
        {
          "targetAccountId": "cuid...",
          "amountMinor": 3000000,
          "memo": "Base salary"
        }
      ]
    }
    ```
  - **Response 201 Created:**
    ```json
    {
      "transaction": {
        "id": "cuid...",
        "kind": "RECEIPT",
        "totalMinor": 3000000,
        "transactionDate": "2026-10-23",
        "description": "October Monthly Salary",
        "allocations": [
          {
            "id": "cuid...",
            "targetAccountId": "cuid...",
            "amountMinor": 3000000,
            "memo": "Base salary"
          }
        ]
      }
    }
    ```
  - **Error Codes:**
    - `ALLOCATION_SUM_MISMATCH` (422)
    - `FUTURE_DATE_DISALLOWED` (422)
    - `INVALID_ALLOCATION_TARGET` (422)
    - `ACCOUNT_NOT_FOUND` (404)

### 2.2 UI Specification
- Modal or dedicated view: "Receive Money".
- Fields: Receiving Account dropdown, Date picker (max: today), Total Amount input with satang conversion.
- Allocation rows with dynamic "Add Category" button.
- Live sum comparison indicating remaining or over-allocated amount before submit button is enabled.

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F05-01** | Valid receipt with single line | 30k THB into Bank allocated to Salary | 201 Created; Bank balance increases by 30k; Salary income increases by 30k. |
| **AC-F05-02** | Valid receipt with multiple lines | 15k THB total: 10k Salary + 5k Interest | 201 Created; lines stored and total matches. |
| **AC-F05-03** | Allocation sum mismatch | Total = 30k; Line = 25k | 422 Unprocessable Entity with `ALLOCATION_SUM_MISMATCH`. |
| **AC-F05-04** | Future transaction date | Date set to tomorrow | 422 Unprocessable Entity with `FUTURE_DATE_DISALLOWED`. |
| **AC-F05-05** | Foreign account target | Allocation line references User 2's account | 404 Not Found (BR-10, BR-11). |
| **AC-F05-06** | Atomic transaction rollback | Invalid line in multi-line payload | Zero rows committed to Transaction or AllocationLine tables (NFR-03). |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F05-01** | AC-F05-01 | API | Post valid receipt to `/api/transactions/receipt`. | Status 201 Created; verify response shape. |
| **TEST-F05-02** | AC-F05-02 | API | Post receipt with two allocation lines summing to total. | Status 201; 2 allocation lines returned. |
| **TEST-F05-03** | AC-F05-03 | API | Post receipt where lines sum to 29k for total 30k. | Status 422, error code `ALLOCATION_SUM_MISMATCH`. |
| **TEST-F05-04** | AC-F05-04 | API | Post receipt with tomorrow's date. | Status 422, error code `FUTURE_DATE_DISALLOWED`. |
| **TEST-F05-05** | AC-F05-05 | API | User 1 creates receipt using User 2's income account. | Status 404 Not Found. |
| **TEST-F05-06** | AC-F05-06 | Integration | Simulate DB failure midway through allocation insertion. | Total transaction row count remains unchanged. |

---

## 5. Definition of Done
- Receipt endpoint and UI form implemented.
- TDD test committed and passing for sum mismatch, future date, and atomic rollback.
