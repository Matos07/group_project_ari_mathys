import { describe, it, expect } from 'vitest';
import {
  validateTransaction,
  deriveBalances,
  calculateIncomeExpenseSummary,
  AccountState,
  RecordedTransaction,
  ValidateTransactionInput
} from '../../src/domain/ledger/index.js';

describe('SR-01 Ledger Domain Engine', () => {
  describe('validateTransaction & Business Invariants', () => {
    it('TEST-SR01-01 / AC-SR01-01: Line sum matches total exactly', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100000,
        allocations: [
          { targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 60000 },
          { targetAccountId: 'exp-2', targetAccountType: 'EXPENSE', amountMinor: 40000 }
        ],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };

      const result = validateTransaction(input);
      expect(result).toEqual({ valid: true });
    });

    it('TEST-SR01-02 / AC-SR01-02: Line sum mismatch is rejected', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100000,
        allocations: [
          { targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 60000 },
          { targetAccountId: 'exp-2', targetAccountType: 'EXPENSE', amountMinor: 30000 }
        ],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('ALLOCATION_SUM_MISMATCH');
    });

    it('TEST-SR01-02b / AC-SR01-02: Empty allocation lines for payment or receipt is rejected', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100000,
        allocations: [],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('ALLOCATION_SUM_MISMATCH');
    });

    it('TEST-SR01-03 / AC-SR01-03: Zero or negative or non-integer amount is rejected (BR-02, NFR-04)', () => {
      // Zero line amount
      const zeroLine: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 0 }],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };
      expect(validateTransaction(zeroLine)).toEqual({
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: expect.any(String)
      });

      // Negative line amount
      const negativeLine: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: -100 }],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };
      expect(validateTransaction(negativeLine)).toEqual({
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: expect.any(String)
      });

      // Fractional / float line amount
      const floatLine: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 100,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 50.5 }],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };
      expect(validateTransaction(floatLine)).toEqual({
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: expect.any(String)
      });

      // Zero or negative total
      const zeroTotal: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 0,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 0 }],
        currentAccountBalances: new Map([['cash-1', 200000]])
      };
      expect(validateTransaction(zeroTotal)).toEqual({
        valid: false,
        errorCode: 'INVALID_AMOUNT',
        errorMessage: expect.any(String)
      });
    });

    it('TEST-SR01-04 / AC-SR01-04: Exceeds transaction ceiling (BR-02)', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 1000000001,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 1000000001 }],
        currentAccountBalances: new Map([['cash-1', 2000000000]])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('AMOUNT_EXCEEDS_MAX');

      // Allocation line exceeding max ceiling
      const lineExceedsMax: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 1000000000,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 1000000001 }],
        currentAccountBalances: new Map([['cash-1', 2000000000]])
      };
      const lineRes = validateTransaction(lineExceedsMax);
      expect(lineRes.valid).toBe(false);
      expect(lineRes.errorCode).toBe('AMOUNT_EXCEEDS_MAX');
    });

    it('TEST-SR01-04b / AC-SR01-04: Exactly at transaction ceiling is allowed', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 1000000000,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 1000000000 }],
        currentAccountBalances: new Map([['cash-1', 1000000000]])
      };

      const result = validateTransaction(input);
      expect(result).toEqual({ valid: true });
    });

    it('TEST-SR01-05 / AC-SR01-05: Target equals main account is rejected (BR-04)', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'acc-1',
        mainAccountType: 'CASH',
        totalMinor: 5000,
        allocations: [{ targetAccountId: 'acc-1', targetAccountType: 'CASH', amountMinor: 5000 }],
        currentAccountBalances: new Map([['acc-1', 10000]])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('SELF_TARGET_DISALLOWED');
    });

    it('TEST-SR01-06 / AC-SR01-06: Invalid target type for payment or receipt (BR-03)', () => {
      // Payment with Income target is disallowed
      const paymentWithIncome: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 5000,
        allocations: [{ targetAccountId: 'inc-1', targetAccountType: 'INCOME', amountMinor: 5000 }],
        currentAccountBalances: new Map([['cash-1', 10000]])
      };
      const res1 = validateTransaction(paymentWithIncome);
      expect(res1.valid).toBe(false);
      expect(res1.errorCode).toBe('INVALID_ALLOCATION_TARGET');

      // Receipt with Expense target is disallowed
      const receiptWithExpense: ValidateTransactionInput = {
        kind: 'RECEIPT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 5000,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 5000 }],
        currentAccountBalances: new Map([['cash-1', 10000]])
      };
      const res2 = validateTransaction(receiptWithExpense);
      expect(res2.valid).toBe(false);
      expect(res2.errorCode).toBe('INVALID_ALLOCATION_TARGET');
    });

    it('TEST-SR01-07 / AC-SR01-07: Cash overdraft prevention (BR-07)', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 50001,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 50001 }],
        currentAccountBalances: new Map([['cash-1', 50000]])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('OVERDRAFT_DISALLOWED');
    });

    it('TEST-SR01-07b / AC-SR01-07: Cash payment reducing balance exactly to 0 is permitted', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 50000,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 50000 }],
        currentAccountBalances: new Map([['cash-1', 50000]])
      };

      const result = validateTransaction(input);
      expect(result).toEqual({ valid: true });
    });

    it('TEST-SR01-07c / AC-SR01-07: Cash transfer out exceeding source cash balance is rejected', () => {
      const input: ValidateTransactionInput = {
        kind: 'RECEIPT',
        mainAccountId: 'cash-dest',
        mainAccountType: 'CASH',
        totalMinor: 60000,
        allocations: [{ targetAccountId: 'cash-src', targetAccountType: 'CASH', amountMinor: 60000 }],
        currentAccountBalances: new Map([
          ['cash-dest', 10000],
          ['cash-src', 50000]
        ])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('OVERDRAFT_DISALLOWED');
    });

    it('TEST-SR01-08 / AC-SR01-08: Loan repayment exceeds debt is rejected (BR-08)', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 120001,
        allocations: [{ targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 120001 }],
        currentAccountBalances: new Map([
          ['cash-1', 200000],
          ['card-1', 120000]
        ])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REPAYMENT_EXCEEDS_DEBT');
    });

    it('TEST-SR01-08b / AC-SR01-08: Multiple repayment lines exceeding debt across same transaction (BR-08)', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 120000,
        allocations: [
          { targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 70000 },
          { targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 50000 }
        ],
        currentAccountBalances: new Map([
          ['cash-1', 200000],
          ['card-1', 100000] // Debt is 100k, total repayments sum to 120k
        ])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REPAYMENT_EXCEEDS_DEBT');
    });

    it('TEST-SR01-08c / AC-SR01-08: Loan Given repayment received exceeding outstanding receivable is rejected (BR-08)', () => {
      const input: ValidateTransactionInput = {
        kind: 'RECEIPT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 15000,
        allocations: [{ targetAccountId: 'loan-given-1', targetAccountType: 'LOAN_GIVEN', amountMinor: 15000 }],
        currentAccountBalances: new Map([
          ['cash-1', 50000],
          ['loan-given-1', 10000] // Owed is 10k, attempting to receive 15k
        ])
      };

      const result = validateTransaction(input);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REPAYMENT_EXCEEDS_DEBT');
    });

    it('TEST-SR01-08d / AC-SR01-08: Exact repayment of outstanding debt is permitted', () => {
      const input: ValidateTransactionInput = {
        kind: 'PAYMENT',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 120000,
        allocations: [{ targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 120000 }],
        currentAccountBalances: new Map([
          ['cash-1', 200000],
          ['card-1', 120000]
        ])
      };

      const result = validateTransaction(input);
      expect(result).toEqual({ valid: true });
    });

    it('TEST-SR01-08e: Opening balance validation', () => {
      const validOpening: ValidateTransactionInput = {
        kind: 'OPENING_BALANCE',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 5000000,
        allocations: [],
        currentAccountBalances: new Map()
      };
      expect(validateTransaction(validOpening)).toEqual({ valid: true });

      const invalidAccountType: ValidateTransactionInput = {
        kind: 'OPENING_BALANCE',
        mainAccountId: 'inc-1',
        mainAccountType: 'INCOME' as any,
        totalMinor: 5000000,
        allocations: [],
        currentAccountBalances: new Map()
      };
      const invalidAccRes = validateTransaction(invalidAccountType);
      expect(invalidAccRes.valid).toBe(false);
      expect(invalidAccRes.errorCode).toBe('INVALID_MAIN_ACCOUNT_TYPE');

      const openingWithLines: ValidateTransactionInput = {
        kind: 'OPENING_BALANCE',
        mainAccountId: 'cash-1',
        mainAccountType: 'CASH',
        totalMinor: 5000000,
        allocations: [{ targetAccountId: 'exp-1', targetAccountType: 'EXPENSE', amountMinor: 5000000 }],
        currentAccountBalances: new Map()
      };
      const res = validateTransaction(openingWithLines);
      expect(res.valid).toBe(false);
      expect(res.errorCode).toBe('OPENING_BALANCE_NO_ALLOCATIONS');
    });
  });

  describe('deriveBalances (BR-06, D-07, D-09)', () => {
    it('should derive balances for the complete Sprint 1 worked example sequence (SRS 4.4)', () => {
      const accounts: AccountState[] = [
        { id: 'bank', type: 'CASH', balanceMinor: 0 },
        { id: 'card', type: 'LOAN_TAKEN', balanceMinor: 0 },
        { id: 'salary', type: 'INCOME', balanceMinor: 0 },
        { id: 'dining', type: 'EXPENSE', balanceMinor: 0 },
        { id: 'groceries', type: 'EXPENSE', balanceMinor: 0 }
      ];

      const transactions: RecordedTransaction[] = [
        // Step 1: Opening balance 50,000.00 on Bank
        {
          id: 'tx-1',
          kind: 'OPENING_BALANCE',
          mainAccountId: 'bank',
          totalMinor: 5000000,
          transactionDate: '2026-10-01'
        },
        // Step 2: Receive 30,000.00 into Bank, line: Income "Salary" 30,000.00
        {
          id: 'tx-2',
          kind: 'RECEIPT',
          mainAccountId: 'bank',
          totalMinor: 3000000,
          transactionDate: '2026-10-05',
          allocations: [
            { targetAccountId: 'salary', targetAccountType: 'INCOME', amountMinor: 3000000 }
          ]
        },
        // Step 3: Charge 1,200.00 on Credit Card, lines: Dining 800.00 + Groceries 400.00
        {
          id: 'tx-3',
          kind: 'PAYMENT',
          mainAccountId: 'card',
          totalMinor: 120000,
          transactionDate: '2026-10-10',
          allocations: [
            { targetAccountId: 'dining', targetAccountType: 'EXPENSE', amountMinor: 80000 },
            { targetAccountId: 'groceries', targetAccountType: 'EXPENSE', amountMinor: 40000 }
          ]
        },
        // Step 4: Pay 700.00 from Bank, line: Loan Taken "Credit Card" (repayment) 700.00
        {
          id: 'tx-4',
          kind: 'PAYMENT',
          mainAccountId: 'bank',
          totalMinor: 70000,
          transactionDate: '2026-10-15',
          allocations: [
            { targetAccountId: 'card', targetAccountType: 'LOAN_TAKEN', amountMinor: 70000 }
          ]
        }
      ];

      const balances = deriveBalances(accounts, transactions);

      // Bank: 50,000 + 30,000 - 700 = 79,300.00 THB = 7,930,000 satang
      expect(balances.get('bank')).toBe(7930000);
      // Card debt: + 1,200 - 700 = 500.00 THB = 50,000 satang
      expect(balances.get('card')).toBe(50000);
      // Income: 30,000.00 THB = 3,000,000 satang
      expect(balances.get('salary')).toBe(3000000);
      // Expenses: Dining = 80,000, Groceries = 40,000 satang
      expect(balances.get('dining')).toBe(80000);
      expect(balances.get('groceries')).toBe(40000);
    });

    it('should derive balances for loans given and cash transfers', () => {
      const accounts: AccountState[] = [
        { id: 'wallet', type: 'CASH', balanceMinor: 0 },
        { id: 'bank', type: 'CASH', balanceMinor: 0 },
        { id: 'friend-loan', type: 'LOAN_GIVEN', balanceMinor: 0 },
        { id: 'other-loan', type: 'LOAN_TAKEN', balanceMinor: 0 }
      ];

      const transactions: RecordedTransaction[] = [
        // Opening balance on loan given (owed to user)
        {
          id: 'tx-0',
          kind: 'OPENING_BALANCE',
          mainAccountId: 'friend-loan',
          totalMinor: 200000,
          transactionDate: '2026-10-01'
        },
        // Opening balance on loan taken (debt)
        {
          id: 'tx-0b',
          kind: 'OPENING_BALANCE',
          mainAccountId: 'other-loan',
          totalMinor: 100000,
          transactionDate: '2026-10-01'
        },
        // Initial cash in bank
        {
          id: 'tx-1',
          kind: 'OPENING_BALANCE',
          mainAccountId: 'bank',
          totalMinor: 500000,
          transactionDate: '2026-10-01'
        },
        // Transfer from Bank to Wallet: Payment from Bank, target Wallet (Cash)
        {
          id: 'tx-2',
          kind: 'PAYMENT',
          mainAccountId: 'bank',
          totalMinor: 100000,
          transactionDate: '2026-10-02',
          allocations: [
            { targetAccountId: 'wallet', targetAccountType: 'CASH', amountMinor: 100000 }
          ]
        },
        // Payment from Wallet lending to friend (Loan Given)
        {
          id: 'tx-3',
          kind: 'PAYMENT',
          mainAccountId: 'wallet',
          totalMinor: 50000,
          transactionDate: '2026-10-03',
          allocations: [
            { targetAccountId: 'friend-loan', targetAccountType: 'LOAN_GIVEN', amountMinor: 50000 }
          ]
        },
        // Receipt into Bank repaying friend loan
        {
          id: 'tx-4',
          kind: 'RECEIPT',
          mainAccountId: 'bank',
          totalMinor: 30000,
          transactionDate: '2026-10-04',
          allocations: [
            { targetAccountId: 'friend-loan', targetAccountType: 'LOAN_GIVEN', amountMinor: 30000 }
          ]
        },
        // Receipt into Bank borrowing on other-loan (Loan Taken)
        {
          id: 'tx-5',
          kind: 'RECEIPT',
          mainAccountId: 'bank',
          totalMinor: 40000,
          transactionDate: '2026-10-05',
          allocations: [
            { targetAccountId: 'other-loan', targetAccountType: 'LOAN_TAKEN', amountMinor: 40000 }
          ]
        }
      ];

      const balances = deriveBalances(accounts, transactions);

      // Bank: 500k - 100k (transfer to wallet) + 30k (repayment received) + 40k (borrowing) = 470k
      expect(balances.get('bank')).toBe(470000);
      // Wallet: +100k (transfer in) - 50k (lent out) = 50k
      expect(balances.get('wallet')).toBe(50000);
      // Friend loan (LOAN_GIVEN): 200k opening + 50k lent - 30k repaid = 220k
      expect(balances.get('friend-loan')).toBe(220000);
      // Other loan (LOAN_TAKEN): 100k opening + 40k borrowing = 140k
      expect(balances.get('other-loan')).toBe(140000);
    });
  });

  describe('calculateIncomeExpenseSummary (BR-05, AC-SR01-09)', () => {
    it('TEST-SR01-09 / AC-SR01-09: Opening balance and loan repayments do not affect income/expense', () => {
      const transactions: RecordedTransaction[] = [
        {
          id: 'tx-1',
          kind: 'OPENING_BALANCE',
          mainAccountId: 'cash-1',
          totalMinor: 500000,
          transactionDate: '2026-10-01'
        },
        {
          id: 'tx-2',
          kind: 'PAYMENT',
          mainAccountId: 'cash-1',
          totalMinor: 70000,
          transactionDate: '2026-10-02',
          allocations: [
            { targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 70000 }
          ]
        }
      ];

      const summary = calculateIncomeExpenseSummary(transactions);
      expect(summary).toEqual({
        incomeMinor: 0,
        expenseMinor: 0,
        netMinor: 0
      });
    });

    it('should aggregate income and expense totals and net minor correctly', () => {
      const transactions: RecordedTransaction[] = [
        {
          id: 'tx-1',
          kind: 'RECEIPT',
          mainAccountId: 'bank-1',
          totalMinor: 3000000,
          transactionDate: '2026-10-05',
          allocations: [
            { targetAccountId: 'salary-1', targetAccountType: 'INCOME', amountMinor: 3000000 }
          ]
        },
        {
          id: 'tx-2',
          kind: 'PAYMENT',
          mainAccountId: 'card-1',
          totalMinor: 120000,
          transactionDate: '2026-10-10',
          allocations: [
            { targetAccountId: 'dining-1', targetAccountType: 'EXPENSE', amountMinor: 80000 },
            { targetAccountId: 'groceries-1', targetAccountType: 'EXPENSE', amountMinor: 40000 }
          ]
        },
        {
          id: 'tx-3',
          kind: 'PAYMENT',
          mainAccountId: 'bank-1',
          totalMinor: 70000,
          transactionDate: '2026-10-15',
          allocations: [
            { targetAccountId: 'card-1', targetAccountType: 'LOAN_TAKEN', amountMinor: 70000 }
          ]
        }
      ];

      const summary = calculateIncomeExpenseSummary(transactions);
      expect(summary).toEqual({
        incomeMinor: 3000000,
        expenseMinor: 120000,
        netMinor: 2880000
      });
    });

    it('should respect fromDate and toDate filters', () => {
      const transactions: RecordedTransaction[] = [
        {
          id: 'tx-1',
          kind: 'RECEIPT',
          mainAccountId: 'bank-1',
          totalMinor: 1000000,
          transactionDate: '2026-09-30',
          allocations: [
            { targetAccountId: 'salary-1', targetAccountType: 'INCOME', amountMinor: 1000000 }
          ]
        },
        {
          id: 'tx-2',
          kind: 'RECEIPT',
          mainAccountId: 'bank-1',
          totalMinor: 3000000,
          transactionDate: '2026-10-05',
          allocations: [
            { targetAccountId: 'salary-1', targetAccountType: 'INCOME', amountMinor: 3000000 }
          ]
        },
        {
          id: 'tx-3',
          kind: 'PAYMENT',
          mainAccountId: 'bank-1',
          totalMinor: 50000,
          transactionDate: '2026-10-20',
          allocations: [
            { targetAccountId: 'dining-1', targetAccountType: 'EXPENSE', amountMinor: 50000 }
          ]
        },
        {
          id: 'tx-4',
          kind: 'PAYMENT',
          mainAccountId: 'bank-1',
          totalMinor: 80000,
          transactionDate: '2026-11-02',
          allocations: [
            { targetAccountId: 'dining-1', targetAccountType: 'EXPENSE', amountMinor: 80000 }
          ]
        }
      ];

      const filtered = calculateIncomeExpenseSummary(transactions, '2026-10-01', '2026-10-31');
      expect(filtered).toEqual({
        incomeMinor: 3000000,
        expenseMinor: 50000,
        netMinor: 2950000
      });
    });

    it('should resolve account types from passed accounts array or map if lines omit types', () => {
      const transactions: RecordedTransaction[] = [
        {
          id: 'tx-1',
          kind: 'RECEIPT',
          mainAccountId: 'bank-1',
          totalMinor: 100000,
          transactionDate: '2026-10-05',
          allocations: [
            { targetAccountId: 'inc-1', amountMinor: 100000 }
          ]
        },
        {
          id: 'tx-2',
          kind: 'PAYMENT',
          mainAccountId: 'bank-1',
          totalMinor: 40000,
          transactionDate: '2026-10-10',
          allocations: [
            { targetAccountId: 'exp-1', amountMinor: 40000 }
          ]
        }
      ];

      const accountsArray: AccountState[] = [
        { id: 'inc-1', type: 'INCOME' },
        { id: 'exp-1', type: 'EXPENSE' }
      ];
      const summaryWithArray = calculateIncomeExpenseSummary(transactions, undefined, undefined, accountsArray);
      expect(summaryWithArray).toEqual({
        incomeMinor: 100000,
        expenseMinor: 40000,
        netMinor: 60000
      });

      const accountsMap = new Map<string, any>([
        ['inc-1', 'INCOME'],
        ['exp-1', 'EXPENSE']
      ]);
      const summaryWithMap = calculateIncomeExpenseSummary(transactions, undefined, undefined, accountsMap);
      expect(summaryWithMap).toEqual({
        incomeMinor: 100000,
        expenseMinor: 40000,
        netMinor: 60000
      });
    });
  });
});
