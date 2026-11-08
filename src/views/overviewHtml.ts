export const overviewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Overview - Personal Money & Expense Logger</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      padding: 1.5rem;
      min-width: 360px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    p.subtitle { color: #64748b; font-size: 0.875rem; }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-badge {
      font-size: 0.875rem;
      background-color: #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      color: #334155;
      font-weight: 500;
    }
    .btn-primary {
      background-color: #2563eb;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-primary:hover { background-color: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      background-color: #e2e8f0;
      color: #334155;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }
    .btn-secondary:hover { background-color: #cbd5e1; }
    .btn-outline-danger {
      background-color: transparent;
      color: #dc2626;
      border: 1px solid #fca5a5;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-outline-danger:hover { background-color: #fee2e2; }
    .btn-sm {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background-color: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-sm:hover { background-color: #dbeafe; }
    .badge-status {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-weight: 500;
    }
    .badge-recorded {
      background-color: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    
    /* Summary Cards Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 4px solid #cbd5e1;
    }
    .card-cash { border-left-color: #10b981; }
    .card-debt { border-left-color: #ef4444; }
    .card-receivable { border-left-color: #3b82f6; }
    .card-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .card-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    .card-amount.cash { color: #059669; }
    .card-amount.debt { color: #dc2626; }
    .card-amount.receivable { color: #2563eb; }
    .card-income { border-left-color: #10b981; }
    .card-expense { border-left-color: #ef4444; }
    .card-net { border-left-color: #6366f1; }
    .card-amount.income { color: #059669; }
    .card-amount.expense { color: #dc2626; }
    .card-amount.net { color: #4f46e5; }
    .badge-opening { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .badge-receipt { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-payment { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .filter-date-input {
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      outline: none;
    }
    .filter-date-input:focus { border-color: #2563eb; }
    .btn-outline-secondary {
      background-color: transparent;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-outline-secondary:hover { background-color: #f1f5f9; }
    .history-row:hover { background-color: #f8fafc; }

    /* Account Section */
    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
      margin: 1.5rem 0 0.75rem;
    }
    .accounts-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .account-item {
      background: #ffffff;
      border-radius: 6px;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      gap: 0.75rem;
    }
    .account-info {
      flex: 1;
      min-width: 0;
    }
    .account-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
    .account-sub { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
    .account-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
    }
    .account-balance { font-weight: 700; font-size: 1rem; color: #0f172a; }

    /* UI States (NFR-10) */
    .loading-state, .empty-state, .error-state {
      background: #ffffff;
      border-radius: 8px;
      padding: 3rem 1.5rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin: 1rem 0;
    }
    .error-state {
      background-color: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .btn-retry {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: #dc2626;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      z-index: 1000;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 10px;
      max-width: 480px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }
    .modal-close:hover { color: #475569; }
    .modal-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
    .alert-box {
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .alert-error {
      background-color: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-success {
      background-color: #dcfce7;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .satang-preview {
      font-size: 0.75rem;
      margin-top: 0.35rem;
      font-weight: 500;
    }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    /* Allocation Row Styling */
    .allocation-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      align-items: center;
      background: #f8fafc;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .allocation-row select {
      flex: 3;
      min-width: 130px;
    }
    .allocation-row input[type="number"] {
      flex: 2;
      min-width: 90px;
    }
    .allocation-row input[type="text"] {
      flex: 3;
      min-width: 110px;
    }
    .allocation-row .btn-remove {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 4px;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .allocation-row .btn-remove:hover {
      background: #fca5a5;
    }
    .sum-indicator {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.5rem;
      border-radius: 6px;
      margin-top: 0.5rem;
      text-align: center;
    }
    .sum-match {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .sum-mismatch {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Account Overview</h1>
        <p class="subtitle">Live Derived Balances & Financial Position</p>
      </div>
      <div class="header-actions">
        <button id="makePaymentBtn" class="btn-primary" onclick="openPaymentModal()" style="display: none;">+ Record Payment</button>
        <button id="receiveMoneyBtn" class="btn-primary" onclick="openReceiveMoneyModal()" style="display: none;">+ Receive Money</button>
        <button id="openModalBtn" class="btn-primary" onclick="openOpeningBalanceModal()" style="display: none;">+ Record Opening Balance</button>
        <div id="userInfo" class="user-badge" style="display: none;"></div>
        <button id="btnLogout" class="btn-outline-danger" onclick="handleLogout()" style="display: none;">Log Out</button>
      </div>
    </header>

    <!-- Sign In State (shown when unauthenticated) -->
    <div id="loginState" class="card" style="display: none; max-width: 420px; margin: 3rem auto; padding: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.35rem; color: #1e293b;">Sign In</h2>
      <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1.25rem;">Enter your credentials to test and manage accounts.</p>
      <div id="loginAlert" class="alert-box alert-error" style="display: none;"></div>
      <form onsubmit="handleLogin(event)">
        <div class="form-group">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" value="demo.user1@example.test" required />
        </div>
        <div class="form-group">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" value="ChangeMeInLocalTesting123!" required />
        </div>
        <button type="submit" id="btnLoginSubmit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 0.5rem;">Sign In</button>
      </form>
    </div>

    <!-- Loading State -->
    <div id="loadingState" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your accounts and deriving balances...</p>
    </div>

    <!-- Error State -->
    <div id="errorState" class="error-state" style="display: none;">
      <p id="errorMessage">Failed to load account overview.</p>
      <button class="btn-retry" onclick="fetchAccounts()">Retry</button>
    </div>

    <!-- Main Content State -->
    <div id="contentState" style="display: none;">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="card card-cash">
          <div class="card-title">Total Cash Held</div>
          <div id="totalCash" class="card-amount cash">฿0.00</div>
        </div>
        <div class="card card-debt">
          <div class="card-title">Credit Card & Loan Debt</div>
          <div id="totalDebt" class="card-amount debt">฿0.00</div>
        </div>
        <div class="card card-receivable">
          <div class="card-title">Loans Given (Receivables)</div>
          <div id="totalReceivable" class="card-amount receivable">฿0.00</div>
        </div>
      </div>

      <!-- Cash Accounts -->
      <h2 class="section-title">Cash & Bank Accounts</h2>
      <div id="cashList" class="accounts-list"></div>

      <!-- Debt Accounts -->
      <h2 class="section-title">Loans Taken & Credit Cards</h2>
      <div id="debtList" class="accounts-list"></div>

      <!-- Receivable Accounts -->
      <h2 class="section-title">Loans Given (Owed to You)</h2>
      <div id="receivableList" class="accounts-list"></div>

      <!-- Period Summary Widget (F-07, FR-22, BR-05) -->
      <div class="summary-section" style="margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <h2 class="section-title" style="margin: 0;">Income &amp; Expense Period Summary</h2>
            <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.15rem;">Calculates actual income vs expenses (transfers, borrowings, repayments &amp; opening balances strictly excluded per BR-05)</p>
          </div>
          <div class="date-filter-group" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <input type="date" id="summaryFromDate" class="filter-date-input" title="From Date" />
            <span style="color: #64748b; font-size: 0.85rem;">to</span>
            <input type="date" id="summaryToDate" class="filter-date-input" title="To Date" />
            <button class="btn-sm" id="btnFilterSummary" onclick="applySummaryDateFilter()">Filter</button>
            <button class="btn-sm btn-outline-secondary" id="btnClearSummary" onclick="clearSummaryDateFilter()">All Time</button>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card card-income">
            <div class="card-title">Total Income</div>
            <div id="summaryIncome" class="card-amount income">฿0.00</div>
          </div>
          <div class="card card-expense">
            <div class="card-title">Total Expenses</div>
            <div id="summaryExpense" class="card-amount expense">฿0.00</div>
          </div>
          <div class="card card-net">
            <div class="card-title">Net Savings</div>
            <div id="summaryNet" class="card-amount net">฿0.00</div>
          </div>
        </div>
      </div>

      <!-- Transaction History Section (F-07, FR-21, BR-10, NFR-10) -->
      <div class="history-section" style="margin-top: 2rem; margin-bottom: 3rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <h2 class="section-title" style="margin: 0;">Transaction History</h2>
            <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.15rem;">Paginated transactions ordered newest first with expandable allocation breakdown</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="historyPageSize" style="font-size: 0.8rem; color: #475569; font-weight: 500;">Per page:</label>
            <select id="historyPageSize" onchange="changeHistoryPageSize(this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 4px; border: 1px solid #cbd5e1;">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <!-- History Loading & Empty States -->
        <div id="historyLoading" style="display: none; text-align: center; padding: 1.5rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
          <p style="font-size: 0.85rem; color: #64748b;">Loading transaction history...</p>
        </div>

        <div id="historyEmpty" style="display: none; text-align: center; padding: 2rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.9rem;">
          No transactions recorded yet. Use the buttons above to record an opening balance, receipt, or payment.
        </div>

        <div id="historyTableContainer" style="display: none; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow-x: auto;">
          <table class="history-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">
                <th style="padding: 0.75rem 1rem; width: 40px;"></th>
                <th style="padding: 0.75rem 1rem;">Date</th>
                <th style="padding: 0.75rem 1rem;">Type</th>
                <th style="padding: 0.75rem 1rem;">Main Account</th>
                <th style="padding: 0.75rem 1rem;">Description</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody id="historyTableBody"></tbody>
          </table>

          <!-- Pagination Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.85rem; color: #64748b;">
            <div id="historyPaginationInfo">Showing 0 of 0 transactions</div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button id="btnPrevHistoryPage" class="btn-sm" onclick="navigateHistoryPage(-1)" disabled>&laquo; Previous</button>
              <span id="historyPageIndicator" style="font-weight: 500; color: #1e293b;">Page 1 of 1</span>
              <button id="btnNextHistoryPage" class="btn-sm" onclick="navigateHistoryPage(1)" disabled>Next &raquo;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Opening Balance Modal (F-04, FR-11, BR-02, BR-12, D-14) -->
  <div id="openingBalanceModal" class="modal-overlay" style="display: none;">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Record Opening Balance</h3>
        <button class="modal-close" onclick="closeOpeningBalanceModal()" aria-label="Close modal">&times;</button>
      </div>
      <p class="modal-desc">
        Record an initial starting balance on a Cash, Loan Taken, or Loan Given account.
        In Sprint 1, at most one opening balance may be recorded per account.
      </p>

      <div id="modalAlert" class="alert-box alert-error" style="display: none;"></div>
      <div id="modalSuccess" class="alert-box alert-success" style="display: none;"></div>

      <form id="openingBalanceForm" onsubmit="handleOpeningBalanceSubmit(event)">
        <div class="form-group">
          <label for="modalAccountSelect">Account *</label>
          <select id="modalAccountSelect" required>
            <option value="">-- Select an account --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="modalAmountBaht">Initial Amount (THB) *</label>
          <input
            type="number"
            id="modalAmountBaht"
            step="0.01"
            min="0.01"
            max="10000000"
            placeholder="e.g. 50000.00"
            required
            oninput="handleAmountInput(this.value)"
          />
          <div id="satangPreviewText" class="satang-preview text-danger">
            Enter a positive amount (> 0 satang)
          </div>
        </div>

        <div class="form-group">
          <label for="modalDate">Effective Date *</label>
          <input type="date" id="modalDate" required />
        </div>

        <div class="form-group">
          <label for="modalDescription">Description (Optional)</label>
          <input type="text" id="modalDescription" placeholder="e.g. Initial bank deposit" />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeOpeningBalanceModal()">Cancel</button>
          <button type="submit" id="btnSubmitModal" class="btn-primary">Record Balance</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Receive Money Modal (F-05, FR-13, BR-01, BR-03, BR-04, BR-09, BR-11, NFR-03, NFR-10) -->
  <div id="receiveMoneyModal" class="modal-overlay" style="display: none;">
    <div class="modal-card" style="max-width: 580px;">
      <div class="modal-header">
        <h3>Receive Money</h3>
        <button class="modal-close" onclick="closeReceiveMoneyModal()" aria-label="Close modal">&times;</button>
      </div>
      <p class="modal-desc">
        Record money received into a Cash/Bank account and allocate it across Income categories.
      </p>

      <div id="receiptAlert" class="alert-box alert-error" style="display: none;"></div>
      <div id="receiptSuccess" class="alert-box alert-success" style="display: none;"></div>

      <form id="receiveMoneyForm" onsubmit="handleReceiptSubmit(event)">
        <div class="form-group">
          <label for="receiptMainAccountSelect">Receiving Cash Account *</label>
          <select id="receiptMainAccountSelect" required>
            <option value="">-- Select receiving cash account --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="receiptTotalBaht">Total Amount Received (THB) *</label>
          <input
            type="number"
            id="receiptTotalBaht"
            step="0.01"
            min="0.01"
            max="10000000"
            placeholder="e.g. 30000.00"
            required
            oninput="handleReceiptTotalInput(this.value)"
          />
          <div id="receiptSatangPreview" class="satang-preview text-danger">
            Enter a positive amount (> 0 satang)
          </div>
        </div>

        <div class="form-group">
          <label for="receiptDate">Transaction Date *</label>
          <input type="date" id="receiptDate" required />
        </div>

        <div class="form-group">
          <label for="receiptDescription">Description (Optional)</label>
          <input type="text" id="receiptDescription" placeholder="e.g. October Monthly Salary" />
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="margin-bottom: 0;">Income Allocations *</label>
            <button type="button" id="btnAddAllocation" class="btn-sm" onclick="addAllocationRow()">+ Add Category</button>
          </div>
          <div id="allocationsContainer"></div>
          <div id="allocationSumStatus" class="sum-indicator sum-mismatch">
            Total allocations must match total amount.
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeReceiveMoneyModal()">Cancel</button>
          <button type="submit" id="btnSubmitReceipt" class="btn-primary" disabled>Record Receipt</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Payment / Charge Modal (F-06, FR-14, FR-15, BR-01, BR-03, BR-04, BR-07, BR-08, BR-09, BR-11, NFR-03, NFR-10) -->
  <div id="paymentModal" class="modal-overlay" style="display: none;">
    <div class="modal-card" style="max-width: 580px;">
      <div class="modal-header">
        <h3>Record Payment / Expense</h3>
        <button class="modal-close" onclick="closePaymentModal()" aria-label="Close modal">&times;</button>
      </div>
      <p class="modal-desc">
        Record an expense payment or debt repayment from a Cash account or Credit Card.
      </p>

      <div id="paymentAlert" class="alert-box alert-error" style="display: none;"></div>
      <div id="paymentSuccess" class="alert-box alert-success" style="display: none;"></div>

      <form id="paymentForm" onsubmit="handlePaymentSubmit(event)">
        <div class="form-group">
          <label for="paymentMainAccountSelect">Payment Source Account *</label>
          <select id="paymentMainAccountSelect" required onchange="handlePaymentSourceChange()">
            <option value="">-- Select paying account (Cash / Credit Card) --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="paymentTotalBaht">Total Payment Amount (THB) *</label>
          <input
            type="number"
            id="paymentTotalBaht"
            step="0.01"
            min="0.01"
            max="10000000"
            placeholder="e.g. 1200.00"
            required
            oninput="handlePaymentTotalInput(this.value)"
          />
          <div id="paymentSatangPreview" class="satang-preview text-danger">
            Enter a positive amount (> 0 satang)
          </div>
        </div>

        <div class="form-group">
          <label for="paymentDate">Transaction Date *</label>
          <input type="date" id="paymentDate" required />
        </div>

        <div class="form-group">
          <label for="paymentDescription">Description (Optional)</label>
          <input type="text" id="paymentDescription" placeholder="e.g. Weekend Supermarket & Dinner" />
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="margin-bottom: 0;">Allocations (Expenses & Repayments) *</label>
            <button type="button" id="btnAddPaymentAllocation" class="btn-sm" onclick="addPaymentAllocationRow()">+ Add Category</button>
          </div>
          <div id="paymentAllocationsContainer"></div>
          <div id="paymentSumStatus" class="sum-indicator sum-mismatch">
            Total allocations must match payment total.
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closePaymentModal()">Cancel</button>
          <button type="submit" id="btnSubmitPayment" class="btn-primary" disabled>Record Payment</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let globalAccounts = [];

    async function checkCurrentUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          const badge = document.getElementById('userInfo');
          badge.textContent = user.displayName + ' (' + user.role + ')';
          badge.style.display = 'inline-block';
          document.getElementById('btnLogout').style.display = 'inline-block';
          document.getElementById('openModalBtn').style.display = 'inline-flex';
          document.getElementById('receiveMoneyBtn').style.display = 'inline-flex';
          document.getElementById('makePaymentBtn').style.display = 'inline-flex';
        }
      } catch (e) {}
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const alertBox = document.getElementById('loginAlert');
      const submitBtn = document.getElementById('btnLoginSubmit');

      alertBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Login failed');
        }

        document.getElementById('loginState').style.display = 'none';
        await checkCurrentUser();
        fetchAccounts();
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    }

    async function handleLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      document.getElementById('userInfo').style.display = 'none';
      document.getElementById('btnLogout').style.display = 'none';
      document.getElementById('openModalBtn').style.display = 'none';
      document.getElementById('receiveMoneyBtn').style.display = 'none';
      document.getElementById('makePaymentBtn').style.display = 'none';
      document.getElementById('contentState').style.display = 'none';
      document.getElementById('loginState').style.display = 'block';
    }

    async function fetchAccounts() {
      const loading = document.getElementById('loadingState');
      const errorBox = document.getElementById('errorState');
      const content = document.getElementById('contentState');
      const loginState = document.getElementById('loginState');
      const errorMsg = document.getElementById('errorMessage');

      loading.style.display = 'block';
      errorBox.style.display = 'none';
      content.style.display = 'none';
      loginState.style.display = 'none';

      try {
        const res = await fetch('/api/accounts', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            loading.style.display = 'none';
            loginState.style.display = 'block';
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Server returned status ' + res.status);
        }

        const data = await res.json();
        globalAccounts = data.accounts || [];
        await checkCurrentUser();
        renderOverview(data);
        await Promise.all([fetchSummary(), fetchHistory()]);

        loading.style.display = 'none';
        content.style.display = 'block';
      } catch (err) {
        loading.style.display = 'none';
        errorBox.style.display = 'block';
        errorMsg.textContent = err.message;
      }
    }

    function renderOverview(data) {
      document.getElementById('totalCash').textContent = data.summary.totalCashFormatted;
      document.getElementById('totalDebt').textContent = data.summary.totalDebtFormatted;
      document.getElementById('totalReceivable').textContent = data.summary.totalReceivableFormatted;

      const cashList = document.getElementById('cashList');
      const debtList = document.getElementById('debtList');
      const receivableList = document.getElementById('receivableList');

      cashList.innerHTML = '';
      debtList.innerHTML = '';
      receivableList.innerHTML = '';

      data.accounts.forEach(acc => {
        const item = document.createElement('div');
        item.className = 'account-item';

        const isEligible = ['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'].includes(acc.type);
        let actionHtml = '';
        if (isEligible) {
          if (acc.hasOpeningBalance) {
            actionHtml = '<span class="badge-status badge-recorded">Opening balance recorded</span>';
          } else {
            actionHtml = \`<button class="btn-sm" onclick="openOpeningBalanceModal('\${acc.id}')">+ Opening Balance</button>\`;
          }
        }

        item.innerHTML = \`
          <div class="account-info">
            <div class="account-name">\${acc.name}</div>
            <div class="account-sub">\${acc.subtype !== 'NONE' ? acc.subtype : acc.type}</div>
          </div>
          <div class="account-right">
            <div class="account-balance">\${acc.balanceFormatted}</div>
            \${actionHtml}
          </div>
        \`;

        if (acc.type === 'CASH') {
          cashList.appendChild(item);
        } else if (acc.type === 'LOAN_TAKEN') {
          debtList.appendChild(item);
        } else if (acc.type === 'LOAN_GIVEN') {
          receivableList.appendChild(item);
        }
      });
    }

    /* Period Summary Widget Logic (F-07, FR-22, BR-05) */
    let currentSummaryFrom = '';
    let currentSummaryTo = '';

    async function fetchSummary() {
      try {
        let url = '/api/summary/income-expense';
        const params = new URLSearchParams();
        if (currentSummaryFrom) params.append('fromDate', currentSummaryFrom);
        if (currentSummaryTo) params.append('toDate', currentSummaryTo);
        const qs = params.toString();
        if (qs) url += '?' + qs;

        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const incomeEl = document.getElementById('summaryIncome');
        const expenseEl = document.getElementById('summaryExpense');
        const netEl = document.getElementById('summaryNet');

        if (incomeEl) incomeEl.textContent = data.incomeFormatted;
        if (expenseEl) expenseEl.textContent = data.expenseFormatted;
        if (netEl) {
          netEl.textContent = data.netFormatted;
          if (data.netMinor < 0) {
            netEl.className = 'card-amount expense';
          } else {
            netEl.className = 'card-amount net';
          }
        }
      } catch (err) {
        console.error('Failed to fetch period summary', err);
      }
    }

    function applySummaryDateFilter() {
      currentSummaryFrom = document.getElementById('summaryFromDate').value;
      currentSummaryTo = document.getElementById('summaryToDate').value;
      fetchSummary();
    }

    function clearSummaryDateFilter() {
      const fromInput = document.getElementById('summaryFromDate');
      const toInput = document.getElementById('summaryToDate');
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      currentSummaryFrom = '';
      currentSummaryTo = '';
      fetchSummary();
    }

    /* Transaction History Table Logic (F-07, FR-21, BR-10, NFR-10) */
    let currentHistoryPage = 1;
    let currentHistoryPageSize = 20;

    async function fetchHistory(page = currentHistoryPage) {
      currentHistoryPage = page;
      const loading = document.getElementById('historyLoading');
      const empty = document.getElementById('historyEmpty');
      const tableContainer = document.getElementById('historyTableContainer');
      const tbody = document.getElementById('historyTableBody');
      const paginationInfo = document.getElementById('historyPaginationInfo');
      const pageIndicator = document.getElementById('historyPageIndicator');
      const btnPrev = document.getElementById('btnPrevHistoryPage');
      const btnNext = document.getElementById('btnNextHistoryPage');

      if (loading) loading.style.display = 'block';
      if (empty) empty.style.display = 'none';

      try {
        const res = await fetch(\`/api/transactions?page=\${currentHistoryPage}&pageSize=\${currentHistoryPageSize}\`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const data = await res.json();
        const { transactions, pagination } = data;

        if (loading) loading.style.display = 'none';

        if (!transactions || transactions.length === 0) {
          if (pagination.totalCount === 0) {
            if (empty) empty.style.display = 'block';
            if (tableContainer) tableContainer.style.display = 'none';
            return;
          }
        }

        if (tableContainer) tableContainer.style.display = 'block';
        if (tbody) tbody.innerHTML = '';

        transactions.forEach((tx) => {
          const tr = document.createElement('tr');
          tr.className = 'history-row';
          tr.style.borderBottom = '1px solid #f1f5f9';
          tr.id = \`tx-row-\${tx.id}\`;

          let kindBadgeClass = 'badge-opening';
          let kindLabel = 'Opening Balance';
          let amountColor = '#1e293b';

          if (tx.kind === 'RECEIPT') {
            kindBadgeClass = 'badge-receipt';
            kindLabel = 'Receipt';
            amountColor = '#059669';
          } else if (tx.kind === 'PAYMENT') {
            kindBadgeClass = 'badge-payment';
            kindLabel = 'Payment';
            amountColor = '#dc2626';
          }

          const hasAllocations = tx.allocations && tx.allocations.length > 0;
          const toggleIcon = hasAllocations ? '&#9656;' : '&bull;';
          const cursorStyle = hasAllocations ? 'cursor: pointer;' : '';

          tr.innerHTML = \`
            <td style="padding: 0.75rem 1rem; text-align: center; \${cursorStyle}" onclick="\${hasAllocations ? \`toggleAllocations('\${tx.id}')\` : ''}">
              <span id="toggle-icon-\${tx.id}" style="color: #64748b; font-size: 0.9rem; font-weight: bold;">\${toggleIcon}</span>
            </td>
            <td style="padding: 0.75rem 1rem; font-weight: 500; color: #1e293b;">\${tx.transactionDate}</td>
            <td style="padding: 0.75rem 1rem;">
              <span class="badge-status \${kindBadgeClass}">\${kindLabel}</span>
            </td>
            <td style="padding: 0.75rem 1rem; color: #334155; font-weight: 500;">\${tx.mainAccountName}</td>
            <td style="padding: 0.75rem 1rem; color: #64748b;">\${tx.description || '-'}</td>
            <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: \${amountColor};">
              \${tx.totalFormatted}
            </td>
          \`;

          if (tbody) tbody.appendChild(tr);

          if (hasAllocations && tbody) {
            const subTr = document.createElement('tr');
            subTr.id = \`alloc-row-\${tx.id}\`;
            subTr.style.display = 'none';
            subTr.style.backgroundColor = '#f8fafc';

            let allocHtml = \`
              <td colspan="6" style="padding: 0.75rem 1.5rem; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  Allocation Breakdown (\${tx.allocations.length} line\${tx.allocations.length > 1 ? 's' : ''}):
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            \`;

            tx.allocations.forEach((line) => {
              allocHtml += \`
                <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 0.5rem 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.85rem;">
                  <div>
                    <span style="font-weight: 600; color: #1e293b;">\${line.targetAccountName}</span>
                    <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.35rem;">(\${line.targetAccountType})</span>
                    \${line.memo ? \`<span style="color: #64748b; font-style: italic; margin-left: 0.5rem;">— \${line.memo}</span>\` : ''}
                  </div>
                  <div style="font-weight: 600; color: #0f172a;">\${line.amountFormatted}</div>
                </div>
              \`;
            });

            allocHtml += \`
                </div>
              </td>
            \`;
            subTr.innerHTML = allocHtml;
            tbody.appendChild(subTr);
          }
        });

        if (paginationInfo) {
          const fromItem = pagination.totalCount > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
          const toItem = Math.min(pagination.totalCount, pagination.page * pagination.pageSize);
          paginationInfo.textContent = pagination.totalCount > 0
            ? \`Showing \${fromItem}–\${toItem} of \${pagination.totalCount} transactions\`
            : 'No transactions';
        }

        const maxPages = Math.max(1, pagination.totalPages);
        if (pageIndicator) pageIndicator.textContent = \`Page \${pagination.page} of \${maxPages}\`;
        if (btnPrev) btnPrev.disabled = pagination.page <= 1;
        if (btnNext) btnNext.disabled = pagination.page >= maxPages;

      } catch (err) {
        if (loading) loading.style.display = 'none';
        console.error('Failed to load transaction history', err);
      }
    }

    function toggleAllocations(txId) {
      const row = document.getElementById(\`alloc-row-\${txId}\`);
      const icon = document.getElementById(\`toggle-icon-\${txId}\`);
      if (!row) return;
      if (row.style.display === 'none') {
        row.style.display = 'table-row';
        if (icon) icon.innerHTML = '&#9662;';
      } else {
        row.style.display = 'none';
        if (icon) icon.innerHTML = '&#9656;';
      }
    }

    function navigateHistoryPage(delta) {
      fetchHistory(currentHistoryPage + delta);
    }

    function changeHistoryPageSize(newSize) {
      currentHistoryPageSize = parseInt(newSize, 10) || 20;
      fetchHistory(1);
    }

    /* Modal & Positive Satang Validation Logic */
    function openOpeningBalanceModal(selectedAccountId = '') {
      const modal = document.getElementById('openingBalanceModal');
      const select = document.getElementById('modalAccountSelect');
      const dateInput = document.getElementById('modalDate');
      const amountInput = document.getElementById('modalAmountBaht');
      const descInput = document.getElementById('modalDescription');
      const alertBox = document.getElementById('modalAlert');
      const successBox = document.getElementById('modalSuccess');

      alertBox.style.display = 'none';
      successBox.style.display = 'none';
      amountInput.value = '';
      descInput.value = '';
      handleAmountInput('');

      // Set default date to today YYYY-MM-DD
      dateInput.value = new Date().toISOString().slice(0, 10);

      // Populate accounts select
      select.innerHTML = '<option value="">-- Select an account --</option>';
      const eligibleAccounts = globalAccounts.filter(a => ['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'].includes(a.type));

      eligibleAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = \`\${acc.name} (\${acc.type})\${acc.hasOpeningBalance ? ' - Opening balance already set' : ''}\`;
        if (acc.hasOpeningBalance) {
          opt.disabled = true;
        }
        if (acc.id === selectedAccountId && !acc.hasOpeningBalance) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      modal.style.display = 'flex';
    }

    function closeOpeningBalanceModal() {
      const modal = document.getElementById('openingBalanceModal');
      modal.style.display = 'none';
    }

    function handleAmountInput(val) {
      const satangEl = document.getElementById('satangPreviewText');
      const num = parseFloat(val);

      if (val === '' || isNaN(num) || num <= 0) {
        satangEl.textContent = 'Enter a positive amount (> 0 satang)';
        satangEl.className = 'satang-preview text-danger';
        return;
      }

      const satang = Math.round(num * 100);

      if (satang < 1) {
        satangEl.textContent = 'Amount must be at least 1 satang (0.01 THB)';
        satangEl.className = 'satang-preview text-danger';
      } else if (satang > 1000000000) {
        satangEl.textContent = 'Amount exceeds maximum limit (1,000,000,000 satang / 10,000,000 THB)';
        satangEl.className = 'satang-preview text-danger';
      } else {
        satangEl.textContent = satang.toLocaleString('en-US') + ' satang';
        satangEl.className = 'satang-preview text-success';
      }
    }

    async function handleOpeningBalanceSubmit(event) {
      event.preventDefault();

      const alertBox = document.getElementById('modalAlert');
      const successBox = document.getElementById('modalSuccess');
      const submitBtn = document.getElementById('btnSubmitModal');
      const accountId = document.getElementById('modalAccountSelect').value;
      const amountBaht = parseFloat(document.getElementById('modalAmountBaht').value);
      const date = document.getElementById('modalDate').value;
      const description = document.getElementById('modalDescription').value;

      alertBox.style.display = 'none';
      successBox.style.display = 'none';

      if (!accountId) {
        alertBox.textContent = 'Please select an account';
        alertBox.style.display = 'block';
        return;
      }

      if (isNaN(amountBaht) || amountBaht <= 0) {
        alertBox.textContent = 'Amount must be a positive number greater than 0';
        alertBox.style.display = 'block';
        return;
      }

      const amountMinor = Math.round(amountBaht * 100);

      if (amountMinor < 1) {
        alertBox.textContent = 'Amount must be at least 1 satang (BR-02)';
        alertBox.style.display = 'block';
        return;
      }

      if (amountMinor > 1000000000) {
        alertBox.textContent = 'Amount cannot exceed 1,000,000,000 satang (10,000,000.00 THB) (BR-02)';
        alertBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';

      try {
        const res = await fetch('/api/transactions/opening-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            accountId,
            amountMinor,
            date,
            description: description || undefined
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to record opening balance (status ' + res.status + ')');
        }

        successBox.textContent = 'Opening balance recorded successfully!';
        successBox.style.display = 'block';

        setTimeout(() => {
          closeOpeningBalanceModal();
          fetchAccounts();
        }, 800);
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Balance';
      }
    }

    /* Receive Money Modal Logic (F-05) */
    function openReceiveMoneyModal() {
      const modal = document.getElementById('receiveMoneyModal');
      const mainSelect = document.getElementById('receiptMainAccountSelect');
      const totalInput = document.getElementById('receiptTotalBaht');
      const dateInput = document.getElementById('receiptDate');
      const descInput = document.getElementById('receiptDescription');
      const alertBox = document.getElementById('receiptAlert');
      const successBox = document.getElementById('receiptSuccess');
      const container = document.getElementById('allocationsContainer');

      alertBox.style.display = 'none';
      successBox.style.display = 'none';
      totalInput.value = '';
      descInput.value = '';
      handleReceiptTotalInput('');

      // Set default date to today and max to today (BR-09)
      const today = new Date().toISOString().slice(0, 10);
      dateInput.value = today;
      dateInput.max = today;

      // Populate cash accounts dropdown (BR-03: Cash receiving money)
      mainSelect.innerHTML = '<option value="">-- Select receiving cash account --</option>';
      const cashAccounts = globalAccounts.filter(a => a.type === 'CASH');
      cashAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = \`\${acc.name} (\${acc.subtype !== 'NONE' ? acc.subtype : 'CASH'})\`;
        mainSelect.appendChild(opt);
      });

      // Clear and add initial allocation row
      container.innerHTML = '';
      addAllocationRow();

      updateAllocationSum();
      modal.style.display = 'flex';
    }

    function closeReceiveMoneyModal() {
      const modal = document.getElementById('receiveMoneyModal');
      modal.style.display = 'none';
    }

    function addAllocationRow(targetAccountId = '', amount = '', memo = '') {
      const container = document.getElementById('allocationsContainer');
      const row = document.createElement('div');
      row.className = 'allocation-row';

      const incomeAccounts = globalAccounts.filter(a => a.type === 'INCOME');
      let optionsHtml = '<option value="">-- Select income category --</option>';
      incomeAccounts.forEach(acc => {
        const selected = acc.id === targetAccountId ? 'selected' : '';
        optionsHtml += \`<option value="\${acc.id}" \${selected}>\${acc.name}</option>\`;
      });

      row.innerHTML = \`
        <select class="alloc-target" required>
          \${optionsHtml}
        </select>
        <input
          type="number"
          class="alloc-amount"
          step="0.01"
          min="0.01"
          placeholder="Amount (THB)"
          value="\${amount}"
          required
          oninput="updateAllocationSum()"
        />
        <input
          type="text"
          class="alloc-memo"
          placeholder="Memo (Optional)"
          value="\${memo}"
        />
        <button type="button" class="btn-remove" onclick="removeAllocationRow(this)" title="Remove category">&times;</button>
      \`;

      container.appendChild(row);
      updateAllocationSum();
    }

    function removeAllocationRow(btn) {
      const row = btn.closest('.allocation-row');
      const container = document.getElementById('allocationsContainer');
      if (container.querySelectorAll('.allocation-row').length > 1) {
        row.remove();
      } else {
        // Reset the single remaining row instead of removing it
        row.querySelector('.alloc-target').value = '';
        row.querySelector('.alloc-amount').value = '';
        row.querySelector('.alloc-memo').value = '';
      }
      updateAllocationSum();
    }

    function handleReceiptTotalInput(val) {
      const satangEl = document.getElementById('receiptSatangPreview');
      const num = parseFloat(val);

      if (val === '' || isNaN(num) || num <= 0) {
        satangEl.textContent = 'Enter a positive amount (> 0 satang)';
        satangEl.className = 'satang-preview text-danger';
      } else {
        const satang = Math.round(num * 100);
        if (satang < 1) {
          satangEl.textContent = 'Amount must be at least 1 satang (0.01 THB)';
          satangEl.className = 'satang-preview text-danger';
        } else if (satang > 1000000000) {
          satangEl.textContent = 'Amount exceeds maximum limit (1,000,000,000 satang / 10,000,000 THB)';
          satangEl.className = 'satang-preview text-danger';
        } else {
          satangEl.textContent = satang.toLocaleString('en-US') + ' satang';
          satangEl.className = 'satang-preview text-success';
        }
      }
      updateAllocationSum();
    }

    function updateAllocationSum() {
      const totalInput = document.getElementById('receiptTotalBaht');
      const statusEl = document.getElementById('allocationSumStatus');
      const submitBtn = document.getElementById('btnSubmitReceipt');
      const totalNum = parseFloat(totalInput.value);

      if (isNaN(totalNum) || totalNum <= 0) {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = 'Enter a valid total amount received';
        submitBtn.disabled = true;
        return;
      }

      const totalSatang = Math.round(totalNum * 100);
      const rows = document.querySelectorAll('#allocationsContainer .allocation-row');
      let allocSatangSum = 0;
      let allTargetsSelected = rows.length > 0;

      rows.forEach(r => {
        const targetVal = r.querySelector('.alloc-target').value;
        const amountVal = parseFloat(r.querySelector('.alloc-amount').value);
        if (!targetVal) allTargetsSelected = false;
        if (!isNaN(amountVal) && amountVal > 0) {
          allocSatangSum += Math.round(amountVal * 100);
        }
      });

      const diff = totalSatang - allocSatangSum;

      if (diff === 0 && allocSatangSum > 0 && allTargetsSelected) {
        statusEl.className = 'sum-indicator sum-match';
        statusEl.textContent = \`Allocations match total: ฿\${(allocSatangSum / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = false;
      } else if (diff > 0) {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = \`Remaining to allocate: ฿\${(diff / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = true;
      } else {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = \`Over-allocated by: ฿\${(Math.abs(diff) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = true;
      }
    }

    async function handleReceiptSubmit(event) {
      event.preventDefault();

      const alertBox = document.getElementById('receiptAlert');
      const successBox = document.getElementById('receiptSuccess');
      const submitBtn = document.getElementById('btnSubmitReceipt');
      const mainAccountId = document.getElementById('receiptMainAccountSelect').value;
      const totalBaht = parseFloat(document.getElementById('receiptTotalBaht').value);
      const transactionDate = document.getElementById('receiptDate').value;
      const description = document.getElementById('receiptDescription').value;

      alertBox.style.display = 'none';
      successBox.style.display = 'none';

      if (!mainAccountId) {
        alertBox.textContent = 'Please select a receiving cash account';
        alertBox.style.display = 'block';
        return;
      }

      if (isNaN(totalBaht) || totalBaht <= 0) {
        alertBox.textContent = 'Total amount must be greater than 0';
        alertBox.style.display = 'block';
        return;
      }

      const totalMinor = Math.round(totalBaht * 100);

      const rows = document.querySelectorAll('#allocationsContainer .allocation-row');
      const allocations = [];

      for (const r of rows) {
        const targetAccountId = r.querySelector('.alloc-target').value;
        const lineBaht = parseFloat(r.querySelector('.alloc-amount').value);
        const memo = r.querySelector('.alloc-memo').value;

        if (!targetAccountId) {
          alertBox.textContent = 'All allocation lines must specify an income category';
          alertBox.style.display = 'block';
          return;
        }

        if (isNaN(lineBaht) || lineBaht <= 0) {
          alertBox.textContent = 'All allocation amounts must be positive';
          alertBox.style.display = 'block';
          return;
        }

        allocations.push({
          targetAccountId,
          amountMinor: Math.round(lineBaht * 100),
          memo: memo || undefined
        });
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';

      try {
        const res = await fetch('/api/transactions/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mainAccountId,
            totalMinor,
            transactionDate,
            description: description || undefined,
            allocations
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to record receipt (status ' + res.status + ')');
        }

        successBox.textContent = 'Money receipt recorded successfully!';
        successBox.style.display = 'block';

        setTimeout(() => {
          closeReceiveMoneyModal();
          fetchAccounts();
        }, 800);
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Receipt';
      }
    }

    /* Payment / Charge Modal Logic (F-06) */
    function openPaymentModal() {
      const modal = document.getElementById('paymentModal');
      const mainSelect = document.getElementById('paymentMainAccountSelect');
      const totalInput = document.getElementById('paymentTotalBaht');
      const dateInput = document.getElementById('paymentDate');
      const descInput = document.getElementById('paymentDescription');
      const alertBox = document.getElementById('paymentAlert');
      const successBox = document.getElementById('paymentSuccess');
      const container = document.getElementById('paymentAllocationsContainer');

      alertBox.style.display = 'none';
      successBox.style.display = 'none';
      totalInput.value = '';
      descInput.value = '';
      handlePaymentTotalInput('');

      // Set default date to today and max to today (BR-09)
      const today = new Date().toISOString().slice(0, 10);
      dateInput.value = today;
      dateInput.max = today;

      // Populate paying source accounts dropdown (CASH and LOAN_TAKEN per BR-03)
      mainSelect.innerHTML = '<option value="">-- Select paying account (Cash / Credit Card) --</option>';
      const payingAccounts = globalAccounts.filter(a => ['CASH', 'LOAN_TAKEN'].includes(a.type));
      payingAccounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = \`\${acc.name} (\${acc.type === 'CASH' ? 'Cash' : 'Credit / Loan'})\`;
        mainSelect.appendChild(opt);
      });

      // Clear and add initial allocation row
      container.innerHTML = '';
      addPaymentAllocationRow();

      updatePaymentAllocationSum();
      modal.style.display = 'flex';
    }

    function closePaymentModal() {
      const modal = document.getElementById('paymentModal');
      modal.style.display = 'none';
    }

    function handlePaymentSourceChange() {
      // Re-populate target account dropdowns to reflect exclusion of mainAccount (BR-04)
      const rows = document.querySelectorAll('#paymentAllocationsContainer .payment-alloc-row');
      rows.forEach(r => {
        const select = r.querySelector('.payment-alloc-target');
        const currentVal = select.value;
        const mainId = document.getElementById('paymentMainAccountSelect').value;

        const eligibleAccounts = globalAccounts.filter(a => {
          if (a.id === mainId) return false; // BR-04: target cannot equal main
          return a.type === 'EXPENSE' || a.type === 'LOAN_TAKEN';
        });

        let optionsHtml = '<option value="">-- Select expense or repayment --</option>';
        eligibleAccounts.forEach(acc => {
          const selected = acc.id === currentVal ? 'selected' : '';
          const label = acc.type === 'EXPENSE' ? acc.name : \`\${acc.name} (Debt Repayment)\`;
          optionsHtml += \`<option value="\${acc.id}" \${selected}>\${label}</option>\`;
        });
        select.innerHTML = optionsHtml;
      });
      updatePaymentAllocationSum();
    }

    function addPaymentAllocationRow(targetAccountId = '', amount = '', memo = '') {
      const container = document.getElementById('paymentAllocationsContainer');
      const row = document.createElement('div');
      row.className = 'allocation-row payment-alloc-row';

      const mainId = document.getElementById('paymentMainAccountSelect').value;
      const eligibleAccounts = globalAccounts.filter(a => {
        if (a.id === mainId) return false;
        return a.type === 'EXPENSE' || a.type === 'LOAN_TAKEN';
      });

      let optionsHtml = '<option value="">-- Select expense or repayment --</option>';
      eligibleAccounts.forEach(acc => {
        const selected = acc.id === targetAccountId ? 'selected' : '';
        const label = acc.type === 'EXPENSE' ? acc.name : \`\${acc.name} (Debt Repayment)\`;
        optionsHtml += \`<option value="\${acc.id}" \${selected}>\${label}</option>\`;
      });

      row.innerHTML = \`
        <select class="payment-alloc-target" required onchange="updatePaymentAllocationSum()">
          \${optionsHtml}
        </select>
        <input
          type="number"
          class="payment-alloc-amount"
          step="0.01"
          min="0.01"
          placeholder="Amount (THB)"
          value="\${amount}"
          required
          oninput="updatePaymentAllocationSum()"
        />
        <input
          type="text"
          class="payment-alloc-memo"
          placeholder="Memo (Optional)"
          value="\${memo}"
        />
        <button type="button" class="btn-remove" onclick="removePaymentAllocationRow(this)" title="Remove line">&times;</button>
      \`;

      container.appendChild(row);
      updatePaymentAllocationSum();
    }

    function removePaymentAllocationRow(btn) {
      const row = btn.closest('.payment-alloc-row');
      const container = document.getElementById('paymentAllocationsContainer');
      if (container.querySelectorAll('.payment-alloc-row').length > 1) {
        row.remove();
      } else {
        row.querySelector('.payment-alloc-target').value = '';
        row.querySelector('.payment-alloc-amount').value = '';
        row.querySelector('.payment-alloc-memo').value = '';
      }
      updatePaymentAllocationSum();
    }

    function handlePaymentTotalInput(val) {
      const satangEl = document.getElementById('paymentSatangPreview');
      const num = parseFloat(val);

      if (val === '' || isNaN(num) || num <= 0) {
        satangEl.textContent = 'Enter a positive amount (> 0 satang)';
        satangEl.className = 'satang-preview text-danger';
      } else {
        const satang = Math.round(num * 100);
        if (satang < 1) {
          satangEl.textContent = 'Amount must be at least 1 satang (0.01 THB)';
          satangEl.className = 'satang-preview text-danger';
        } else if (satang > 1000000000) {
          satangEl.textContent = 'Amount exceeds maximum limit (1,000,000,000 satang / 10,000,000 THB)';
          satangEl.className = 'satang-preview text-danger';
        } else {
          satangEl.textContent = satang.toLocaleString('en-US') + ' satang';
          satangEl.className = 'satang-preview text-success';
        }
      }
      updatePaymentAllocationSum();
    }

    function updatePaymentAllocationSum() {
      const totalInput = document.getElementById('paymentTotalBaht');
      const statusEl = document.getElementById('paymentSumStatus');
      const submitBtn = document.getElementById('btnSubmitPayment');
      const totalNum = parseFloat(totalInput.value);

      if (isNaN(totalNum) || totalNum <= 0) {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = 'Enter a valid payment total amount';
        submitBtn.disabled = true;
        return;
      }

      const totalSatang = Math.round(totalNum * 100);
      const rows = document.querySelectorAll('#paymentAllocationsContainer .payment-alloc-row');
      let allocSatangSum = 0;
      let allTargetsSelected = rows.length > 0;

      rows.forEach(r => {
        const targetVal = r.querySelector('.payment-alloc-target').value;
        const amountVal = parseFloat(r.querySelector('.payment-alloc-amount').value);
        if (!targetVal) allTargetsSelected = false;
        if (!isNaN(amountVal) && amountVal > 0) {
          allocSatangSum += Math.round(amountVal * 100);
        }
      });

      const diff = totalSatang - allocSatangSum;

      if (diff === 0 && allocSatangSum > 0 && allTargetsSelected) {
        statusEl.className = 'sum-indicator sum-match';
        statusEl.textContent = \`Allocations match total: ฿\${(allocSatangSum / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = false;
      } else if (diff > 0) {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = \`Remaining to allocate: ฿\${(diff / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = true;
      } else {
        statusEl.className = 'sum-indicator sum-mismatch';
        statusEl.textContent = \`Over-allocated by: ฿\${(Math.abs(diff) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}\`;
        submitBtn.disabled = true;
      }
    }

    async function handlePaymentSubmit(event) {
      event.preventDefault();

      const alertBox = document.getElementById('paymentAlert');
      const successBox = document.getElementById('paymentSuccess');
      const submitBtn = document.getElementById('btnSubmitPayment');
      const mainAccountId = document.getElementById('paymentMainAccountSelect').value;
      const totalBaht = parseFloat(document.getElementById('paymentTotalBaht').value);
      const transactionDate = document.getElementById('paymentDate').value;
      const description = document.getElementById('paymentDescription').value;

      alertBox.style.display = 'none';
      successBox.style.display = 'none';

      if (!mainAccountId) {
        alertBox.textContent = 'Please select a paying source account';
        alertBox.style.display = 'block';
        return;
      }

      if (isNaN(totalBaht) || totalBaht <= 0) {
        alertBox.textContent = 'Total amount must be greater than 0';
        alertBox.style.display = 'block';
        return;
      }

      const totalMinor = Math.round(totalBaht * 100);

      const rows = document.querySelectorAll('#paymentAllocationsContainer .payment-alloc-row');
      const allocations = [];

      for (const r of rows) {
        const targetAccountId = r.querySelector('.payment-alloc-target').value;
        const lineBaht = parseFloat(r.querySelector('.payment-alloc-amount').value);
        const memo = r.querySelector('.payment-alloc-memo').value;

        if (!targetAccountId) {
          alertBox.textContent = 'All allocation lines must specify a target expense or debt account';
          alertBox.style.display = 'block';
          return;
        }

        if (isNaN(lineBaht) || lineBaht <= 0) {
          alertBox.textContent = 'All allocation amounts must be positive';
          alertBox.style.display = 'block';
          return;
        }

        allocations.push({
          targetAccountId,
          amountMinor: Math.round(lineBaht * 100),
          memo: memo || undefined
        });
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';

      try {
        const res = await fetch('/api/transactions/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mainAccountId,
            totalMinor,
            transactionDate,
            description: description || undefined,
            allocations
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to record payment (status ' + res.status + ')');
        }

        successBox.textContent = 'Payment recorded successfully!';
        successBox.style.display = 'block';

        setTimeout(() => {
          closePaymentModal();
          fetchAccounts();
        }, 800);
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Payment';
      }
    }

    // Initial load
    fetchAccounts();
  </script>
</body>
</html>
`;
