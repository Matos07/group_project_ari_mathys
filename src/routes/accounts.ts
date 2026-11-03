import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  deriveBalances,
  AccountState,
  RecordedTransaction,
  AccountType,
  TransactionKind
} from '../domain/ledger/index.js';
import { formatSatang } from '../utils/currency.js';

export const accountsRouter = Router();

// Financial endpoints require role USER (BR-16, FR-04)
accountsRouter.use(requireAuth, requireRole('USER'));

/**
 * GET /api/accounts
 * Retrieves all accounts owned by the authenticated user with derived balances.
 * Implements FR-07, FR-08, BR-06, BR-10, BR-13, BR-15, AC-F03-01..04.
 */
accountsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Fetch user's active accounts (BR-10: own accounts only)
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 2. Fetch all user transactions with lines to derive balances
    const transactions = await prisma.transaction.findMany({
      where: {
        userId
      },
      include: {
        mainAccount: true,
        allocations: {
          include: {
            targetAccount: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 3. Map to domain structures for deriveBalances
    const accountStates: AccountState[] = accounts.map((a) => ({
      id: a.id,
      type: a.type as AccountType
    }));

    const recordedTransactions: RecordedTransaction[] = transactions.map((t) => ({
      id: t.id,
      kind: t.kind as TransactionKind,
      mainAccountId: t.mainAccountId,
      mainAccountType: t.mainAccount.type as 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN',
      totalMinor: t.totalMinor,
      transactionDate: t.transactionDate,
      description: t.description,
      allocations: t.allocations.map((line) => ({
        id: line.id,
        targetAccountId: line.targetAccountId,
        targetAccountType: line.targetAccount.type as AccountType,
        amountMinor: line.amountMinor,
        memo: line.memo
      }))
    }));

    // 4. Derive balances using pure domain engine (BR-06, D-07, D-09)
    const derivedBalances = deriveBalances(accountStates, recordedTransactions);

    let totalCashMinor = 0;
    let totalDebtMinor = 0;
    let totalReceivableMinor = 0;

    const formattedAccounts = accounts.map((acc) => {
      const balanceMinor = derivedBalances.get(acc.id) ?? 0;

      if (acc.type === 'CASH') {
        totalCashMinor += balanceMinor;
      } else if (acc.type === 'LOAN_TAKEN') {
        totalDebtMinor += balanceMinor;
      } else if (acc.type === 'LOAN_GIVEN') {
        totalReceivableMinor += balanceMinor;
      }

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        balanceMinor,
        balanceFormatted: formatSatang(balanceMinor)
      };
    });

    res.json({
      accounts: formattedAccounts,
      summary: {
        totalCashMinor,
        totalCashFormatted: formatSatang(totalCashMinor),
        totalDebtMinor,
        totalDebtFormatted: formatSatang(totalDebtMinor),
        totalReceivableMinor,
        totalReceivableFormatted: formatSatang(totalReceivableMinor)
      }
    });
  } catch (error) {
    next(error);
  }
});

