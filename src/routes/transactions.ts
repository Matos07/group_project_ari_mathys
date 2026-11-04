import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  MAX_TRANSACTION_AMOUNT_MINOR,
  validateTransaction,
  deriveBalances,
  AccountType,
  AccountState,
  RecordedTransaction,
  TransactionKind
} from '../domain/ledger/index.js';

export const transactionsRouter = Router();

// Financial endpoints require role USER (BR-16, FR-04)
transactionsRouter.use(requireAuth, requireRole('USER'));

/**
 * POST /api/transactions/opening-balance
 * Records an initial balance on a Cash, Loan Taken, or Loan Given account.
 * Implements F-04, FR-11, BR-02, BR-12, D-08, D-14, AC-F04-01..05.
 */
transactionsRouter.post(
  '/opening-balance',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { accountId, amountMinor, date, description } = req.body ?? {};

      // 1. Input presence & type validation (BR-02, AC-F04-04)
      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'accountId is required'
          }
        });
        return;
      }

      if (
        amountMinor === undefined ||
        typeof amountMinor !== 'number' ||
        !Number.isInteger(amountMinor) ||
        amountMinor <= 0
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_AMOUNT',
            message: 'amountMinor must be a positive integer in minor units (satang)'
          }
        });
        return;
      }

      if (amountMinor > MAX_TRANSACTION_AMOUNT_MINOR) {
        res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_MAX',
            message: `amountMinor cannot exceed ${MAX_TRANSACTION_AMOUNT_MINOR} minor units (10,000,000.00 THB)`
          }
        });
        return;
      }

      // Date validation
      let transactionDate: string;
      if (date !== undefined && date !== null && String(date).trim() !== '') {
        const dateStr = String(date).trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
          res.status(400).json({
            error: {
              code: 'INVALID_DATE',
              message: 'date must be a valid date in YYYY-MM-DD format'
            }
          });
          return;
        }
        transactionDate = dateStr;
      } else {
        transactionDate = new Date().toISOString().slice(0, 10);
      }

      // 2. Account existence and privacy isolation (BR-10, D-15)
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account || account.userId !== userId) {
        res.status(404).json({
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        });
        return;
      }

      // 3. Target account type validation (BR-12, AC-F04-02)
      // Opening balances can only apply to CASH, LOAN_TAKEN, or LOAN_GIVEN
      const allowedTypes = ['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'];
      if (!allowedTypes.includes(account.type)) {
        res.status(422).json({
          error: {
            code: 'INVALID_ACCOUNT_TYPE_FOR_OPENING_BALANCE',
            message: 'Opening balance can only apply to Cash, Loan Taken, or Loan Given accounts'
          }
        });
        return;
      }

      // 4. In Sprint 1, at most one opening balance is allowed per account (BR-12, AC-F04-03)
      const existingOpeningBalance = await prisma.transaction.findFirst({
        where: {
          userId,
          mainAccountId: account.id,
          kind: 'OPENING_BALANCE'
        }
      });

      if (existingOpeningBalance) {
        res.status(422).json({
          error: {
            code: 'OPENING_BALANCE_EXISTS',
            message: 'An opening balance has already been recorded for this account'
          }
        });
        return;
      }

      // 5. Create transaction row (no allocation lines per D-08, D-14)
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          kind: 'OPENING_BALANCE',
          mainAccountId: account.id,
          totalMinor: amountMinor,
          transactionDate,
          description: description !== undefined && description !== null ? String(description).trim() : ''
        }
      });

      // 6. Return 201 Created
      res.status(201).json({
        transaction: {
          id: transaction.id,
          kind: transaction.kind,
          mainAccountId: transaction.mainAccountId,
          totalMinor: transaction.totalMinor,
          transactionDate: transaction.transactionDate,
          description: transaction.description
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/transactions/receipt
 * Records a money receipt (income) transaction with allocation lines.
 * Implements F-05, FR-13, BR-01, BR-02, BR-03, BR-04, BR-09, BR-11, NFR-03.
 */
transactionsRouter.post(
  '/receipt',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { mainAccountId, totalMinor, transactionDate, description, allocations } = req.body ?? {};

      // 1. Input presence validation
      if (!mainAccountId || typeof mainAccountId !== 'string') {
        res.status(400).json({
          error: { code: 'INVALID_INPUT', message: 'mainAccountId is required' }
        });
        return;
      }

      if (
        totalMinor === undefined ||
        typeof totalMinor !== 'number' ||
        !Number.isInteger(totalMinor) ||
        totalMinor <= 0
      ) {
        res.status(400).json({
          error: { code: 'INVALID_AMOUNT', message: 'totalMinor must be a positive integer in minor units (satang)' }
        });
        return;
      }

      if (totalMinor > MAX_TRANSACTION_AMOUNT_MINOR) {
        res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_MAX',
            message: `totalMinor cannot exceed ${MAX_TRANSACTION_AMOUNT_MINOR} minor units (10,000,000.00 THB)`
          }
        });
        return;
      }

      if (!Array.isArray(allocations) || allocations.length === 0) {
        res.status(400).json({
          error: { code: 'INVALID_INPUT', message: 'allocations must be a non-empty array' }
        });
        return;
      }

      // 2. Date validation — must be YYYY-MM-DD and not in the future (BR-09)
      if (!transactionDate || typeof transactionDate !== 'string') {
        res.status(400).json({
          error: { code: 'INVALID_INPUT', message: 'transactionDate is required in YYYY-MM-DD format' }
        });
        return;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const dateStr = String(transactionDate).trim();
      if (!dateRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
        res.status(400).json({
          error: { code: 'INVALID_DATE', message: 'transactionDate must be a valid date in YYYY-MM-DD format' }
        });
        return;
      }

      // Future date check (BR-09)
      const today = new Date().toISOString().slice(0, 10);
      if (dateStr > today) {
        res.status(422).json({
          error: {
            code: 'FUTURE_DATE_DISALLOWED',
            message: 'Transaction date cannot be in the future'
          }
        });
        return;
      }

      // 3. Main account existence, ownership, and type validation (BR-03, BR-10, BR-11)
      const mainAccount = await prisma.account.findUnique({
        where: { id: mainAccountId }
      });

      if (!mainAccount || mainAccount.userId !== userId) {
        res.status(404).json({
          error: { code: 'ACCOUNT_NOT_FOUND', message: 'Main account not found' }
        });
        return;
      }

      if (!mainAccount.isActive) {
        res.status(422).json({
          error: { code: 'ACCOUNT_NOT_FOUND', message: 'Main account is not active' }
        });
        return;
      }

      // Main account must be CASH for RECEIPT (BR-03)
      if (mainAccount.type !== 'CASH') {
        res.status(422).json({
          error: {
            code: 'INVALID_MAIN_ACCOUNT_TYPE',
            message: 'Receive money transactions require a Cash account as the main account'
          }
        });
        return;
      }

      // 4. Validate each allocation line's target account (BR-03, BR-04, BR-11)
      const targetAccountIds = allocations.map((a: any) => a.targetAccountId);
      const targetAccounts = await prisma.account.findMany({
        where: { id: { in: targetAccountIds } }
      });

      const targetAccountMap = new Map(targetAccounts.map((a) => [a.id, a]));

      for (const line of allocations) {
        const target = targetAccountMap.get(line.targetAccountId);

        // Target must exist and belong to the same user (BR-10, BR-11)
        if (!target || target.userId !== userId) {
          res.status(404).json({
            error: { code: 'ACCOUNT_NOT_FOUND', message: 'Target account not found' }
          });
          return;
        }

        if (!target.isActive) {
          res.status(422).json({
            error: { code: 'ACCOUNT_NOT_FOUND', message: 'Target account is not active' }
          });
          return;
        }
      }

      // 5. Use the ledger domain engine to validate the transaction (BR-01, BR-02, BR-03, BR-04, BR-07)
      // Build current balances for overdraft checks
      const userAccounts = await prisma.account.findMany({ where: { userId } });
      const existingTransactions = await prisma.transaction.findMany({
        where: { userId },
        include: { allocations: { include: { targetAccount: true } }, mainAccount: true },
        orderBy: { createdAt: 'asc' }
      });

      const accountStates: AccountState[] = userAccounts.map((a) => ({
        id: a.id,
        type: a.type as AccountType
      }));

      const recordedTxs: RecordedTransaction[] = existingTransactions.map((t) => ({
        id: t.id,
        kind: t.kind as TransactionKind,
        mainAccountId: t.mainAccountId,
        mainAccountType: t.mainAccount.type as 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN',
        totalMinor: t.totalMinor,
        transactionDate: t.transactionDate,
        description: t.description,
        allocations: t.allocations.map((line) => ({
          targetAccountId: line.targetAccountId,
          targetAccountType: line.targetAccount.type as AccountType,
          amountMinor: line.amountMinor,
          memo: line.memo
        }))
      }));

      const currentBalances = deriveBalances(accountStates, recordedTxs);

      const validationResult = validateTransaction({
        kind: 'RECEIPT',
        mainAccountId,
        mainAccountType: mainAccount.type as 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN',
        totalMinor,
        allocations: allocations.map((a: any) => ({
          targetAccountId: a.targetAccountId,
          targetAccountType: targetAccountMap.get(a.targetAccountId)!.type as AccountType,
          amountMinor: a.amountMinor,
          memo: a.memo
        })),
        currentAccountBalances: currentBalances
      });

      if (!validationResult.valid) {
        res.status(422).json({
          error: {
            code: validationResult.errorCode!,
            message: validationResult.errorMessage!
          }
        });
        return;
      }

      // 6. Atomically create Transaction + AllocationLines in a Prisma $transaction (NFR-03)
      const transaction = await prisma.$transaction(async (tx) => {
        const created = await tx.transaction.create({
          data: {
            userId,
            kind: 'RECEIPT',
            mainAccountId,
            totalMinor,
            transactionDate: dateStr,
            description: description !== undefined && description !== null ? String(description).trim() : '',
            allocations: {
              create: allocations.map((a: any) => ({
                targetAccountId: a.targetAccountId,
                amountMinor: a.amountMinor,
                memo: a.memo !== undefined && a.memo !== null ? String(a.memo).trim() : ''
              }))
            }
          },
          include: {
            allocations: true
          }
        });
        return created;
      });

      // 7. Return 201 Created with response shape per F-05 contract
      res.status(201).json({
        transaction: {
          id: transaction.id,
          kind: transaction.kind,
          totalMinor: transaction.totalMinor,
          transactionDate: transaction.transactionDate,
          description: transaction.description,
          allocations: transaction.allocations.map((line) => ({
            id: line.id,
            targetAccountId: line.targetAccountId,
            amountMinor: line.amountMinor,
            memo: line.memo
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
