import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  calculateIncomeExpenseSummary,
  RecordedTransaction,
  TransactionKind,
  AccountType
} from '../domain/ledger/index.js';
import { formatSatang } from '../utils/currency.js';

export const summaryRouter = Router();

// Financial endpoints require role USER (BR-16, FR-04)
summaryRouter.use(requireAuth, requireRole('USER'));

/**
 * GET /api/summary/income-expense
 * Returns income, expense, and net summary for the user within an optional date range.
 * Implements FR-22, BR-05, BR-10, AC-F04-05, AC-F07-03..05.
 */
summaryRouter.get(
  '/income-expense',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { fromDate, toDate } = req.query;

      // Validate date formats if provided (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      let fromStr: string | undefined;
      let toStr: string | undefined;

      if (fromDate !== undefined && fromDate !== null && String(fromDate).trim() !== '') {
        fromStr = String(fromDate).trim();
        if (!dateRegex.test(fromStr) || isNaN(Date.parse(fromStr))) {
          res.status(400).json({
            error: {
              code: 'INVALID_DATE',
              message: 'fromDate must be a valid date in YYYY-MM-DD format'
            }
          });
          return;
        }
      }

      if (toDate !== undefined && toDate !== null && String(toDate).trim() !== '') {
        toStr = String(toDate).trim();
        if (!dateRegex.test(toStr) || isNaN(Date.parse(toStr))) {
          res.status(400).json({
            error: {
              code: 'INVALID_DATE',
              message: 'toDate must be a valid date in YYYY-MM-DD format'
            }
          });
          return;
        }
      }

      if (fromStr && toStr && fromStr > toStr) {
        res.status(400).json({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'fromDate cannot be after toDate'
          }
        });
        return;
      }

      const transactions = await prisma.transaction.findMany({
        where: { userId },
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

      const summary = calculateIncomeExpenseSummary(
        recordedTransactions,
        fromStr,
        toStr
      );

      res.status(200).json({
        incomeMinor: summary.incomeMinor,
        incomeFormatted: formatSatang(summary.incomeMinor),
        expenseMinor: summary.expenseMinor,
        expenseFormatted: formatSatang(summary.expenseMinor),
        netMinor: summary.netMinor,
        netFormatted: formatSatang(summary.netMinor)
      });
    } catch (error) {
      next(error);
    }
  }
);

