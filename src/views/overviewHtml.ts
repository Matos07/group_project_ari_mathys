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
      gap: 0.5rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    p.subtitle { color: #64748b; font-size: 0.875rem; }
    .user-badge {
      font-size: 0.875rem;
      background-color: #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      color: #334155;
      font-weight: 500;
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
    }
    .account-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
    .account-sub { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
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
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Account Overview</h1>
        <p class="subtitle">Live Derived Balances & Financial Position</p>
      </div>
      <div id="userInfo" class="user-badge" style="display: none;"></div>
    </header>

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
    </div>
  </div>

  <script>
    async function fetchAccounts() {
      const loading = document.getElementById('loadingState');
      const errorBox = document.getElementById('errorState');
      const content = document.getElementById('contentState');
      const errorMsg = document.getElementById('errorMessage');

      loading.style.display = 'block';
      errorBox.style.display = 'none';
      content.style.display = 'none';

      try {
        const res = await fetch('/api/accounts', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Server returned status ' + res.status);
        }

        const data = await res.json();
        renderOverview(data);

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
        item.innerHTML = \`
          <div>
            <div class="account-name">\${acc.name}</div>
            <div class="account-sub">\${acc.subtype !== 'NONE' ? acc.subtype : acc.type}</div>
          </div>
          <div class="account-balance">\${acc.balanceFormatted}</div>
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

    // Initial load
    fetchAccounts();
  </script>
</body>
</html>
`;

