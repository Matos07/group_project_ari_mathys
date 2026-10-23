# Engineering Contract: F-07 History and Income/Expense Summary

**Feature ID:** `F-07`  
**Feature Name:** Transaction History and Income/Expense Summary  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-05` (Receive Money), `F-06` (Payment & Charge), `SR-01` (Ledger Domain Engine)  
**Linked Requirements:** FR-21, FR-22, BR-05, BR-10, NFR-10, NFR-11  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **Transaction History View (FR-21):**
   - Paginated display of recorded transactions sorted in reverse chronological order (newest first).
   - Each entry shows: transaction date, kind (`OPENING_BALANCE`, `RECEIPT`, `PAYMENT`), main account name, total formatted in THB satang, description, and an expandable list of allocation lines with their target accounts and memos.
   - Paging parameters: `page` (default 1) and `pageSize` (default 20, max 100 per D-16).
2. **Income & Expense Summary Widget (FR-22, BR-05):**
   - Calculates total income and total expenses over an optional date range (`fromDate`, `toDate`).
   - Pure mathematical aggregation:
     - Only lines targeting `INCOME` accounts count toward total income.
     - Only lines targeting `EXPENSE` accounts count toward total expense.
     - Internal movements (loan repayments, opening balances, transfers) are strictly excluded (BR-05).
     - Net calculation: $\text{Net} = \text{Total Income} - \text{Total Expense}$.
3. **Data Privacy (BR-10):**
   - Enforces user isolation: queries only return transactions where `userId === req.user.id`.

---

## 2. Technical Specifications

### 2.1 API Endpoints
- `GET /api/transactions`
  - **Headers:** `Cookie: sid=<token>`
  - **Query Params:** `page=1&pageSize=20`
  - **Response 200 OK:**
    ```json
    {
      "transactions": [
        {
          "id": "cuid...",
          "kind": "PAYMENT",
          "mainAccountName": "Main Bank Account",
          "totalMinor": 70000,
          "totalFormatted": "฿700.00",
          "transactionDate": "2026-10-23",
          "description": "Credit card payment",
          "allocations": [
            {
              "id": "cuid...",
              "targetAccountName": "Credit Card",
              "targetAccountType": "LOAN_TAKEN",
              "amountMinor": 70000,
              "amountFormatted": "฿700.00",
              "memo": "Partial bill settlement"
            }
          ]
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalCount": 1,
        "totalPages": 1
      }
    }
    ```
- `GET /api/summary/income-expense`
  - **Headers:** `Cookie: sid=<token>`
  - **Query Params:** `fromDate=2026-10-01&toDate=2026-10-31`
  - **Response 200 OK:**
    ```json
    {
      "incomeMinor": 3000000,
      "incomeFormatted": "฿30,000.00",
      "expenseMinor": 120000,
      "expenseFormatted": "฿1,200.00",
      "netMinor": 2880000,
      "netFormatted": "฿28,800.00"
    }
    ```

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F07-01** | Paginated history listing | 25 transactions exist; request `page=1&pageSize=20` | Returns 20 items ordered newest first, with pagination meta. |
| **AC-F07-02** | Transaction allocation line visibility | Transaction has 2 expense lines | Response includes both child allocation records with target names. |
| **AC-F07-03** | Income and expense summary calculation | User has salary (30k) and card expense (1.2k) and repayment (700) | Summary returns Income = ฿30,000.00, Expense = ฿1,200.00, Net = ฿28,800.00. |
| **AC-F07-04** | Exclusion of repayments from expense | Card repayment of 700 THB recorded | Repayment is not added to expense total (BR-05). |
| **AC-F07-05** | Exclusion of opening balances from income | 50k opening balance recorded | Opening balance is not added to income total (BR-05). |
| **AC-F07-06** | Cross-user privacy isolation | User 1 queries history | Returns only User 1 transactions; zero leakage from User 2 (BR-10). |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F07-01** | AC-F07-01 | API | Create 5 transactions $\rightarrow$ request `GET /api/transactions`. | Status 200; transactions sorted descending by `createdAt`. |
| **TEST-F07-02** | AC-F07-02 | API | Query specific transaction detail. | Allocation lines returned with valid target account details. |
| **TEST-F07-03** | AC-F07-03 | API | Record SRS 4.4 worked example $\rightarrow$ call `/api/summary/income-expense`. | `incomeMinor: 3000000, expenseMinor: 120000, netMinor: 2880000`. |
| **TEST-F07-04** | AC-F07-04 | API | Call summary after a 700 THB loan repayment transaction. | `expenseMinor` remains unchanged by repayment. |
| **TEST-F07-05** | AC-F07-05 | API | Call summary after recording a 50k THB opening balance. | `incomeMinor` remains 0. |
| **TEST-F07-06** | AC-F07-06 | API | User 1 calls `/api/transactions` while User 2 has recorded transactions. | User 1's list contains only own records. |

---

## 5. Definition of Done
- History endpoint with pagination and summary calculation implemented.
- UI components (History Table with line expansion and Summary Cards) tested.
- Automated API test verifying full SRS 4.4 sequence summary figures.
