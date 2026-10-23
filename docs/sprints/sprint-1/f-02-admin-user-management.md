# Engineering Contract: F-02 Administrator User Management

**Feature ID:** `F-02`  
**Feature Name:** Administrator User Management & Access Control  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `F-01` (Authentication & RBAC)  
**Linked Requirements:** FR-05, FR-06, BR-16, BR-17, BR-18  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **User Listing (FR-05):**
   - An administrator can list all registered users on the platform.
   - The returned data includes: `id`, `email`, `displayName`, `role`, `isActive`, `createdAt`.
   - The response **strictly excludes** any account balances, transactions, or financial records.
2. **Account Disabling / Enabling (FR-06):**
   - An administrator can toggle `isActive` status for any user.
   - When a user is transitioned to `isActive: false`:
     - All active `Session` records for that user are deleted from the database immediately ([BR-17](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/srs.md#L159)).
     - Any in-flight requests by that user with their cookie will fail authentication upon next check.
3. **Protection Rules (BR-18):**
   - An administrator cannot disable their own account.
   - An administrator cannot disable the last remaining active administrator on the system.
4. **Zero Financial Privileges (BR-16):**
   - An administrator role cannot own accounts and is strictly rejected with `403 Forbidden` if attempting to perform financial operations.

---

## 2. Technical Specifications

### 2.1 API Endpoints
- `GET /api/admin/users`
  - **Headers:** `Cookie: sid=<admin_token>`
  - **Response 200:**
    ```json
    {
      "users": [
        {
          "id": "cuid...",
          "email": "demo.user1@example.test",
          "displayName": "User One",
          "role": "USER",
          "isActive": true,
          "createdAt": "2026-10-23T10:00:00.000Z"
        }
      ]
    }
    ```
- `PATCH /api/admin/users/:id/status`
  - **Headers:** `Cookie: sid=<admin_token>`
  - **Body:** `{ "isActive": false }`
  - **Response 200:** `{ "id": "...", "isActive": false }`
  - **Response 400 / 422:** If attempting self-disable or disabling last active admin.

### 2.2 UI Specification
- Screen: Admin Dashboard (`/admin/users`).
- Table displaying users, role badge, status badge (`Active` / `Disabled`), and action button (`Disable` / `Enable`).
- Displays confirmation dialog before disabling an account.

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F02-01** | Admin lists users | Admin session calls `/api/admin/users` | 200 OK returning list of users without financial data. |
| **AC-F02-02** | User lists users | Regular `USER` session calls endpoint | 403 Forbidden. |
| **AC-F02-03** | Admin disables user | Admin calls `PATCH .../status` with `isActive: false` | 200 OK, user set to inactive. |
| **AC-F02-04** | Disabling revokes active sessions | User 1 logged in; Admin disables User 1 | User 1's subsequent authenticated API call returns 401. |
| **AC-F02-05** | Admin self-disable prevention | Admin attempts to set own `isActive: false` | 422 Unprocessable Entity with `CANNOT_DISABLE_SELF`. |
| **AC-F02-06** | Last admin disable prevention | Only 1 admin active; attempt to disable | 422 with `CANNOT_DISABLE_LAST_ADMIN`. |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F02-01** | AC-F02-01 | API | Admin requests `GET /api/admin/users`. | Status 200, array of users returned, no balance fields present. |
| **TEST-F02-02** | AC-F02-02 | API | User requests `GET /api/admin/users`. | Status 403 Forbidden. |
| **TEST-F02-03** | AC-F02-03 | API | Admin sends `PATCH /api/admin/users/:userId/status` `{ isActive: false }`. | Status 200, user is updated in database. |
| **TEST-F02-04** | AC-F02-04 | Integration | User logs in $\rightarrow$ Admin disables user $\rightarrow$ User requests `/api/auth/me`. | Final request returns 401 Unauthorized. |
| **TEST-F02-05** | AC-F02-05 | API | Admin calls status endpoint with own user ID. | Status 422, error code `CANNOT_DISABLE_SELF`. |
| **TEST-F02-06** | AC-F02-06 | Integration | Single admin in system; call disable status. | Status 422, error code `CANNOT_DISABLE_LAST_ADMIN`. |

---

## 5. Definition of Done
- Admin endpoints, security guards, and UI panel implemented.
- Session revocation on deactivation verified by automated integration test.
