# Engineering Contract: SR-01 Ledger Domain Engine

**Feature ID:** `SR-01`  
**Feature Name:** Ledger Domain Engine & Arithmetic Core  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** None (Pure domain module in TypeScript)  
**Linked Requirements:** BR-01, BR-02, BR-03, BR-05, BR-06, BR-07, BR-08, NFR-03, NFR-04, NFR-09  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Architectural Isolation
The Ledger Domain Engine (`src/domain/ledger/`) is a pure TypeScript module containing zero network, HTTP, or database dependencies. All business invariant checks, calculation functions, and balance derivations reside here to enable fast, exhaustive unit testing (NFR-09).

### 1.2 Invariants & Business Logic
1. **Integer Arithmetic (NFR-04, BR-02):**
   - All amounts are integers in minor units (Thai satang; $1\text{ THB} = 100\text{ satang}$).
   - Any fractional value, negative number, or value $\le 0$ is rejected.
   - Per-transaction ceiling: $\le 1,000,000,000\text{ satang}$ ($10,000,000.00\text{ THB}$).
2. **Allocation Balance Check (BR-01):**
   - For every transaction of kind `RECEIPT` or `PAYMENT`, $\sum \text{line.amountMinor} == \text{totalMinor}$.
   - Must have at least 1 allocation line.
3. **Allocation Target Matrix (BR-03, BR-04):**
   - **Payment main account (Cash / Loan Taken):** Target accounts must be `EXPENSE`, `LOAN_TAKEN`, `LOAN_GIVEN`, or `CASH`.
   - **Receipt main account (Cash):** Target accounts must be `INCOME`, `LOAN_GIVEN`, `LOAN_TAKEN`, or `CASH`.
   - Target account ID cannot equal main account ID (`BR-04`).
4. **Balance Derivation (BR-06, D-07, D-09):**
   - Evaluates a list of recorded transactions to calculate current balance per account according to the balance effect matrix.
5. **Overdraft & Repayment Safeguards (BR-07, BR-08):**
   - **Overdraft Guard:** If a transaction reduces a `CASH` account balance below 0, it must be rejected.
   - **Repayment Ceiling:** If a transaction repays a `LOAN_TAKEN` account by more than its currently outstanding debt, it must be rejected.
6. **Summary Categorization (BR-05):**
   - Summaries strictly calculate total income and expenses only from lines targeting `INCOME` and `EXPENSE` accounts respectively.

---

## 2. Technical Specifications

### 2.1 Domain Types & Function Signatures
```typescript
export interface AccountState {
  id: string;
  type: 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN' | 'INCOME' | 'EXPENSE';
  balanceMinor: number;
}

export interface AllocationInput {
  targetAccountId: string;
  targetAccountType: 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN' | 'INCOME' | 'EXPENSE';
  amountMinor: number;
}

export interface ValidateTransactionInput {
  kind: 'OPENING_BALANCE' | 'RECEIPT' | 'PAYMENT';
  mainAccountId: string;
  mainAccountType: 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN';
  totalMinor: number;
  allocations: AllocationInput[];
  currentAccountBalances: Map<string, number>;
}

export interface ValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export function validateTransaction(input: ValidateTransactionInput): ValidationResult;
export function deriveBalances(accounts: AccountState[], transactions: RecordedTransaction[]): Map<string, number>;
export function calculateIncomeExpenseSummary(transactions: RecordedTransaction[], fromDate?: string, toDate?: string): { incomeMinor: number; expenseMinor: number; netMinor: number };
```

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-SR01-01** | Line sum matches total | Total = 100,000; Lines = [60,000, 40,000] | Validation passes. |
| **AC-SR01-02** | Line sum mismatch | Total = 100,000; Lines = [60,000, 30,000] | Rejected with error code `ALLOCATION_SUM_MISMATCH`. |
| **AC-SR01-03** | Zero or negative amount | Line amount = 0 or -500 | Rejected with error code `INVALID_AMOUNT`. |
| **AC-SR01-04** | Exceeds transaction ceiling | Total = 1,000,000,001 satang | Rejected with error code `AMOUNT_EXCEEDS_MAX`. |
| **AC-SR01-05** | Target equals main account | Main = Acc1; Line target = Acc1 | Rejected with error code `SELF_TARGET_DISALLOWED`. |
| **AC-SR01-06** | Invalid target type for payment | Payment main = Cash; Line target = Income | Rejected with error code `INVALID_ALLOCATION_TARGET`. |
| **AC-SR01-07** | Cash overdraft prevention | Cash balance = 50,000; Payment = 50,001 | Rejected with error code `OVERDRAFT_DISALLOWED`. |
| **AC-SR01-08** | Card repayment exceeds debt | Card debt = 120,000; Repayment = 120,001 | Rejected with error code `REPAYMENT_EXCEEDS_DEBT`. |
| **AC-SR01-09** | Opening balance non-income | Opening balance of 500,000 on Cash | Cash balance = 500,000; Income and Expense totals remain 0. |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-SR01-01** | AC-SR01-01 | Unit | Pass 2 valid allocation lines summing to header total. | Returns `{ valid: true }`. |
| **TEST-SR01-02** | AC-SR01-02 | Unit | Pass allocation lines summing to 99,999 for total 100,000. | Returns `{ valid: false, errorCode: 'ALLOCATION_SUM_MISMATCH' }`. |
| **TEST-SR01-03** | AC-SR01-03 | Unit | Pass line with `amountMinor: 0` and `-100`. | Rejection with `INVALID_AMOUNT`. |
| **TEST-SR01-04** | AC-SR01-04 | Unit | Pass total `1000000001`. | Rejection with `AMOUNT_EXCEEDS_MAX`. |
| **TEST-SR01-05** | AC-SR01-05 | Unit | Payment from `acc-1` with allocation target `acc-1`. | Rejection with `SELF_TARGET_DISALLOWED`. |
| **TEST-SR01-06** | AC-SR01-06 | Unit | Payment with line targeting `INCOME` account. | Rejection with `INVALID_ALLOCATION_TARGET`. |
| **TEST-SR01-07** | AC-SR01-07 | Unit | Current cash balance 50,000; execute payment deducting 60,000. | Rejection with `OVERDRAFT_DISALLOWED`. |
| **TEST-SR01-08** | AC-SR01-08 | Unit | Outstanding card debt 10,000; execute repayment line of 15,000. | Rejection with `REPAYMENT_EXCEEDS_DEBT`. |
| **TEST-SR01-09** | AC-SR01-09 | Unit | Calculate summary after opening balance + loan repayment. | `incomeMinor: 0, expenseMinor: 0`. |
| **TEST-SR01-10** | NFR-09 | Unit | Run Istanbul / Vitest coverage on `src/domain/ledger/`. | Line coverage $\ge 80\%$. |

---

## 5. Definition of Done
- All test cases `TEST-SR01-01` through `TEST-SR01-10` implemented and passing.
- TDD commit evidence: Red failing test committed before green implementation.
- Zero external libraries or framework dependencies in the ledger module.
