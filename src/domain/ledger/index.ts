export type AccountType = 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN' | 'INCOME' | 'EXPENSE';
export type TransactionKind = 'OPENING_BALANCE' | 'RECEIPT' | 'PAYMENT';

export const MAX_TRANSACTION_AMOUNT_MINOR = 1_000_000_000; // 10,000,000.00 THB in satang (BR-02)

export interface AccountState {
  id: string;
  type: AccountType;
  balanceMinor?: number;
}

export interface AllocationInput {
  targetAccountId: string;
  targetAccountType: AccountType;
  amountMinor: number;
  memo?: string;
}

export interface ValidateTransactionInput {
  kind: TransactionKind;
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

export interface RecordedAllocationLine {
  id?: string;
  targetAccountId: string;
  targetAccountType?: AccountType;
  targetAccount?: {
    type: AccountType;
    name?: string;
  };
  amountMinor: number;
  memo?: string;
}

export interface RecordedTransaction {
  id?: string;
  kind: TransactionKind;
  mainAccountId: string;
  mainAccountType?: 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN';
  mainAccount?: {
    type: 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN';
    name?: string;
  };
  totalMinor: number;
  transactionDate: string;
  description?: string;
  allocations?: RecordedAllocationLine[];
}

export interface IncomeExpenseSummary {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

/**
 * Validates a proposed financial transaction against core business invariants and constraints.
 * Implements BR-01, BR-02, BR-03, BR-04, BR-07, BR-08, NFR-04.
 */
export function validateTransaction(input: ValidateTransactionInput): ValidationResult {
  // 1. Transaction ceiling and integer check on total (BR-02, NFR-04)
  if (
    typeof input.totalMinor !== 'number' ||
    !Number.isInteger(input.totalMinor) ||
    input.totalMinor <= 0
  ) {
    return {
      valid: false,
      errorCode: 'INVALID_AMOUNT',
      errorMessage: 'Transaction total must be a positive integer in minor units (satang)'
    };
  }

  if (input.totalMinor > MAX_TRANSACTION_AMOUNT_MINOR) {
    return {
      valid: false,
      errorCode: 'AMOUNT_EXCEEDS_MAX',
      errorMessage: `Transaction total cannot exceed ${MAX_TRANSACTION_AMOUNT_MINOR} minor units (10,000,000.00 THB)`
    };
  }

  // 2. Opening balance validation (BR-12)
  if (input.kind === 'OPENING_BALANCE') {
    if (!['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'].includes(input.mainAccountType)) {
      return {
        valid: false,
        errorCode: 'INVALID_MAIN_ACCOUNT_TYPE',
        errorMessage: 'Opening balance can only apply to Cash, Loan Taken, or Loan Given accounts'
      };
    }

    if (input.allocations && input.allocations.length > 0) {
      return {
        valid: false,
        errorCode: 'OPENING_BALANCE_NO_ALLOCATIONS',
        errorMessage: 'Opening balance transactions cannot contain allocation lines'
      };
    }

    return { valid: true };
  }

  // 3. For RECEIPT or PAYMENT: must have at least one allocation line (BR-01)
  if (!input.allocations || input.allocations.length === 0) {
    return {
      valid: false,
      errorCode: 'ALLOCATION_SUM_MISMATCH',
      errorMessage: 'Transaction must have at least one allocation line'
    };
  }

  // 4. Validate each allocation line amount and ceiling (BR-02, NFR-04)
  let lineSum = 0;
  for (const line of input.allocations) {
    if (
      typeof line.amountMinor !== 'number' ||
      !Number.isInteger(line.amountMinor) ||
      line.amountMinor <= 0
    ) {
      return {
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: 'Allocation amount must be a positive integer in minor units (satang)'
      };
    }

    if (line.amountMinor > MAX_TRANSACTION_AMOUNT_MINOR) {
      return {
        valid: false,
        errorCode: 'AMOUNT_EXCEEDS_MAX',
        errorMessage: `Allocation line amount cannot exceed ${MAX_TRANSACTION_AMOUNT_MINOR} minor units`
      };
    }

    lineSum += line.amountMinor;
  }

  // 5. Allocation sum must equal header total exactly (BR-01)
  if (lineSum !== input.totalMinor) {
    return {
      valid: false,
      errorCode: 'ALLOCATION_SUM_MISMATCH',
      errorMessage: `Sum of allocation lines (${lineSum}) does not equal transaction total (${input.totalMinor})`
    };
  }

  // 6. Main account and allocation target checks (BR-03, BR-04)
  for (const line of input.allocations) {
    // BR-04: Target account cannot equal main account
    if (line.targetAccountId === input.mainAccountId) {
      return {
        valid: false,
        errorCode: 'SELF_TARGET_DISALLOWED',
        errorMessage: 'Allocation line cannot target the transaction main account'
      };
    }

    // BR-03: Allowed allocation target matrix
    if (input.kind === 'PAYMENT') {
      const allowedPaymentTargets: AccountType[] = ['EXPENSE', 'LOAN_TAKEN', 'LOAN_GIVEN', 'CASH'];
      if (!allowedPaymentTargets.includes(line.targetAccountType)) {
        return {
          valid: false,
          errorCode: 'INVALID_ALLOCATION_TARGET',
          errorMessage: `Target account type ${line.targetAccountType} is not permitted for a PAYMENT transaction`
        };
      }
    } else if (input.kind === 'RECEIPT') {
      const allowedReceiptTargets: AccountType[] = ['INCOME', 'LOAN_GIVEN', 'LOAN_TAKEN', 'CASH'];
      if (!allowedReceiptTargets.includes(line.targetAccountType)) {
        return {
          valid: false,
          errorCode: 'INVALID_ALLOCATION_TARGET',
          errorMessage: `Target account type ${line.targetAccountType} is not permitted for a RECEIPT transaction`
        };
      }
    }
  }

  // 7. Overdraft guard (Cash cannot go negative, BR-07)
  // Case A: Payment deducting from Cash main account
  if (input.kind === 'PAYMENT' && input.mainAccountType === 'CASH') {
    const currentMainCash = input.currentAccountBalances.get(input.mainAccountId) ?? 0;
    if (currentMainCash - input.totalMinor < 0) {
      return {
        valid: false,
        errorCode: 'OVERDRAFT_DISALLOWED',
        errorMessage: 'Cash account balance cannot become negative'
      };
    }
  }

  // Case B: Receipt transferring out of a Cash target account
  if (input.kind === 'RECEIPT') {
    for (const line of input.allocations) {
      if (line.targetAccountType === 'CASH') {
        const currentTargetCash = input.currentAccountBalances.get(line.targetAccountId) ?? 0;
        if (currentTargetCash - line.amountMinor < 0) {
          return {
            valid: false,
            errorCode: 'OVERDRAFT_DISALLOWED',
            errorMessage: 'Cash account balance cannot become negative'
          };
        }
      }
    }
  }

  // 8. Repayment limit check (repayment cannot exceed outstanding debt/receivable, BR-08)
  // Group repayments by target account across all lines of the transaction
  const repaymentsByAccount = new Map<string, { type: AccountType; totalRepaymentMinor: number }>();
  for (const line of input.allocations) {
    if (
      (input.kind === 'PAYMENT' && line.targetAccountType === 'LOAN_TAKEN') ||
      (input.kind === 'RECEIPT' && line.targetAccountType === 'LOAN_GIVEN')
    ) {
      const existing = repaymentsByAccount.get(line.targetAccountId) ?? {
        type: line.targetAccountType,
        totalRepaymentMinor: 0
      };
      existing.totalRepaymentMinor += line.amountMinor;
      repaymentsByAccount.set(line.targetAccountId, existing);
    }
  }

  for (const [accountId, { type, totalRepaymentMinor }] of repaymentsByAccount.entries()) {
    const currentBalance = input.currentAccountBalances.get(accountId) ?? 0;
    if (totalRepaymentMinor > currentBalance) {
      return {
        valid: false,
        errorCode: 'REPAYMENT_EXCEEDS_DEBT',
        errorMessage:
          type === 'LOAN_TAKEN'
            ? 'Repayment amount exceeds outstanding debt'
            : 'Repayment amount exceeds outstanding loan receivable'
      };
    }
  }

  return { valid: true };
}

/**
 * Derives current balances from a list of recorded transactions and initial accounts.
 * Implements BR-06, D-07, D-09, and the SRS 4.3 Balance-Effect table.
 */
export function deriveBalances(
  accounts: AccountState[],
  transactions: RecordedTransaction[]
): Map<string, number> {
  const accountTypeMap = new Map<string, AccountType>();
  const balances = new Map<string, number>();

  for (const acc of accounts) {
    accountTypeMap.set(acc.id, acc.type);
    balances.set(acc.id, acc.balanceMinor ?? 0);
  }

  for (const tx of transactions) {
    const mainType = tx.mainAccountType ?? tx.mainAccount?.type ?? accountTypeMap.get(tx.mainAccountId);

    if (tx.kind === 'OPENING_BALANCE') {
      const current = balances.get(tx.mainAccountId) ?? 0;
      if (mainType === 'CASH' || mainType === 'LOAN_TAKEN' || mainType === 'LOAN_GIVEN') {
        balances.set(tx.mainAccountId, current + tx.totalMinor);
      }
      continue;
    }

    if (tx.kind === 'PAYMENT') {
      // Main account effect:
      // Cash balance decreases by total; Loan Taken debt increases by total
      const currentMain = balances.get(tx.mainAccountId) ?? 0;
      if (mainType === 'CASH') {
        balances.set(tx.mainAccountId, currentMain - tx.totalMinor);
      } else if (mainType === 'LOAN_TAKEN') {
        balances.set(tx.mainAccountId, currentMain + tx.totalMinor);
      }

      // Allocation target effects
      for (const line of tx.allocations ?? []) {
        const targetType =
          line.targetAccountType ?? line.targetAccount?.type ?? accountTypeMap.get(line.targetAccountId);
        const currentTarget = balances.get(line.targetAccountId) ?? 0;

        switch (targetType) {
          case 'EXPENSE':
            // expense total + a
            balances.set(line.targetAccountId, currentTarget + line.amountMinor);
            break;
          case 'LOAN_TAKEN':
            // debt - a (repayment)
            balances.set(line.targetAccountId, currentTarget - line.amountMinor);
            break;
          case 'LOAN_GIVEN':
            // owed + a (new loan given)
            balances.set(line.targetAccountId, currentTarget + line.amountMinor);
            break;
          case 'CASH':
            // balance + a (transfer in)
            balances.set(line.targetAccountId, currentTarget + line.amountMinor);
            break;
          default:
            break;
        }
      }
      continue;
    }

    if (tx.kind === 'RECEIPT') {
      // Main account effect (Cash receiving money): balance + total
      const currentMain = balances.get(tx.mainAccountId) ?? 0;
      balances.set(tx.mainAccountId, currentMain + tx.totalMinor);

      // Allocation source/target effects
      for (const line of tx.allocations ?? []) {
        const targetType =
          line.targetAccountType ?? line.targetAccount?.type ?? accountTypeMap.get(line.targetAccountId);
        const currentTarget = balances.get(line.targetAccountId) ?? 0;

        switch (targetType) {
          case 'INCOME':
            // income total + a
            balances.set(line.targetAccountId, currentTarget + line.amountMinor);
            break;
          case 'LOAN_GIVEN':
            // owed - a (repayment received)
            balances.set(line.targetAccountId, currentTarget - line.amountMinor);
            break;
          case 'LOAN_TAKEN':
            // debt + a (new borrowing)
            balances.set(line.targetAccountId, currentTarget + line.amountMinor);
            break;
          case 'CASH':
            // balance - a (transfer out of T)
            balances.set(line.targetAccountId, currentTarget - line.amountMinor);
            break;
          default:
            break;
        }
      }
      continue;
    }
  }

  return balances;
}

/**
 * Calculates aggregated income, expense, and net values strictly from lines targeting
 * Income and Expense accounts, excluding all internal movements (transfers, borrowings, lendings,
 * repayments, opening balances).
 * Implements BR-05, FR-22, AC-SR01-09.
 */
export function calculateIncomeExpenseSummary(
  transactions: RecordedTransaction[],
  fromDate?: string,
  toDate?: string,
  accounts?: AccountState[] | Map<string, AccountType>
): IncomeExpenseSummary {
  let incomeMinor = 0;
  let expenseMinor = 0;

  const accountTypeMap = new Map<string, AccountType>();
  if (accounts) {
    if (accounts instanceof Map) {
      for (const [k, v] of accounts.entries()) {
        accountTypeMap.set(k, v);
      }
    } else {
      for (const acc of accounts) {
        accountTypeMap.set(acc.id, acc.type);
      }
    }
  }

  for (const tx of transactions) {
    if (fromDate && tx.transactionDate < fromDate) {
      continue;
    }
    if (toDate && tx.transactionDate > toDate) {
      continue;
    }

    // Opening balances never count as income or expense (BR-05, BR-12)
    if (tx.kind === 'OPENING_BALANCE') {
      continue;
    }

    for (const line of tx.allocations ?? []) {
      const targetType =
        line.targetAccountType ?? line.targetAccount?.type ?? accountTypeMap.get(line.targetAccountId);

      if (tx.kind === 'RECEIPT' && targetType === 'INCOME') {
        incomeMinor += line.amountMinor;
      } else if (tx.kind === 'PAYMENT' && targetType === 'EXPENSE') {
        expenseMinor += line.amountMinor;
      }
    }
  }

  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor
  };
}
