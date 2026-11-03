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

    // Initial load
    fetchAccounts();
  </script>
</body>
</html>
`;
