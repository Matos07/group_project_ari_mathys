export const adminUsersHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Users</title>
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
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
    }
    header {
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    p.subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
    #alertBox {
      display: none;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    #alertBox.error { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    #alertBox.success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    tr:hover { background-color: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-admin { background-color: #ede9fe; color: #5b21b6; }
    .badge-user { background-color: #e2e8f0; color: #334155; }
    .badge-active { background-color: #dcfce7; color: #166534; }
    .badge-disabled { background-color: #fee2e2; color: #991b1b; }
    button.btn {
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.15s ease;
    }
    button.btn-disable { background-color: #ef4444; color: #ffffff; }
    button.btn-disable:hover { background-color: #dc2626; }
    button.btn-enable { background-color: #10b981; color: #ffffff; }
    button.btn-enable:hover { background-color: #059669; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Admin Dashboard</h1>
      <p class="subtitle">Platform User Management & Access Control</p>
    </header>

    <div id="alertBox"></div>

    <div class="table-responsive">
      <table id="usersTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="userRows">
          <tr><td colspan="5" style="text-align: center; color: #64748b;">Loading users...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    async function loadUsers() {
      const alertBox = document.getElementById('alertBox');
      const tbody = document.getElementById('userRows');
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) {
          throw new Error('Failed to load users (' + res.status + ')');
        }
        const data = await res.json();
        renderUsers(data.users || []);
      } catch (err) {
        alertBox.className = 'error';
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Unable to load users</td></tr>';
      }
    }

    function renderUsers(users) {
      const tbody = document.getElementById('userRows');
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">No users found</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => {
        const roleClass = u.role === 'ADMINISTRATOR' ? 'badge-admin' : 'badge-user';
        const statusClass = u.isActive ? 'badge-active' : 'badge-disabled';
        const statusText = u.isActive ? 'Active' : 'Disabled';
        const actionBtn = u.isActive
          ? '<button class="btn btn-disable" onclick="toggleUser(\\'' + u.id + '\\', false)">Disable</button>'
          : '<button class="btn btn-enable" onclick="toggleUser(\\'' + u.id + '\\', true)">Enable</button>';

        return '<tr>' +
          '<td><strong>' + escapeHtml(u.displayName) + '</strong></td>' +
          '<td>' + escapeHtml(u.email) + '</td>' +
          '<td><span class="badge ' + roleClass + '">' + escapeHtml(u.role) + '</span></td>' +
          '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
          '<td>' + actionBtn + '</td>' +
          '</tr>';
      }).join('');
    }

    async function toggleUser(id, newStatus) {
      const alertBox = document.getElementById('alertBox');
      alertBox.style.display = 'none';

      if (!newStatus) {
        const confirmed = confirm('Are you sure you want to disable this user account? All active sessions will be terminated immediately.');
        if (!confirmed) return;
      }

      try {
        const res = await fetch('/api/admin/users/' + id + '/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: newStatus })
        });

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error?.message || 'Failed to update user status');
        }

        alertBox.className = 'success';
        alertBox.textContent = 'User status updated successfully.';
        alertBox.style.display = 'block';
        loadUsers();
      } catch (err) {
        alertBox.className = 'error';
        alertBox.textContent = err.message;
        alertBox.style.display = 'block';
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', loadUsers);
  </script>
</body>
</html>
`;
