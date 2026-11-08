# Engineering Contract: F-01 Authentication, Sessions, and Role-Based Access

**Feature ID:** `F-01`  
**Feature Name:** Authentication, Session Management, and Role-Based Access Control  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** `SR-02` (Platform Baseline & Prisma Schema)  
**Linked Requirements:** FR-01, FR-02, FR-03, FR-04, BR-10, BR-16, BR-17, BR-21, NFR-01, NFR-02, NFR-05  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Behavior & Workflow
1. **User Authentication:**
   - Active users log in with `email` and `password`.
   - On success, a cryptographic session ID is stored in the `Session` table and transmitted via an `httpOnly`, `SameSite=Lax` cookie named `sid`.
   - Failed attempts (wrong email or wrong password) return `401 Unauthorized` with a single generic error message: `"Invalid email or password"` to prevent user enumeration ([BR-21](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/srs.md#L163)).
   - Inactive/disabled accounts are rejected with `"Invalid email or password"` after password verification ([BR-17](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/srs.md#L159), [BR-21](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/srs.md#L163)).
2. **Current Identity:**
   - Authenticated clients call `GET /api/auth/me` to retrieve session identity: `{ id, email, displayName, role }`.
3. **Session Invalidation:**
   - `POST /api/auth/logout` deletes the `Session` record from the database and sets the cookie max age to 0. Subsequent requests with that cookie fail with `401`.
   - Disabling a user through admin operations deletes all existing `Session` records for that user ([BR-17](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/srs.md#L159)).
4. **Access Control & Privacy (BR-10, BR-16):**
   - Financial endpoints require `role === 'USER'`. An administrator attempting to invoke them receives `403 Forbidden`.
   - Access to another user's accounts, transactions, or summaries returns `404 Not Found` (indistinguishable from a non-existent ID) to eliminate data probing vectors ([D-15](file:///c:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/project/group_project_ari_mathys/docs/decisions.md#L23)).

---

## 2. Technical Specifications

### 2.1 API Endpoints
- `POST /api/auth/login`
  - **Body:** `{ "email": "string", "password": "string" }`
  - **Response 200:** `{ "user": { "id": "...", "email": "...", "displayName": "...", "role": "USER" } }` + `Set-Cookie: sid=...; HttpOnly; Path=/; Max-Age=28800`
  - **Response 401:** `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }`
- `POST /api/auth/logout`
  - **Headers:** `Cookie: sid=...`
  - **Response 200:** `{ "message": "Logged out successfully" }` + `Set-Cookie: sid=; Max-Age=0`
- `GET /api/auth/me`
  - **Headers:** `Cookie: sid=...`
  - **Response 200:** `{ "user": { "id": "...", "email": "...", "displayName": "...", "role": "..." } }`
  - **Response 401:** `{ "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }`

### 2.2 Middleware Specification
- `requireAuth(req, res, next)`: Validates `sid` cookie against database `Session`. Injects `req.user`. If invalid/expired $\rightarrow$ `401`.
- `requireRole(role)`: Validates `req.user.role === role`. If mismatch $\rightarrow$ `403`.

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-F01-01** | Valid user login | Correct email and password | 200 OK, returns user info, sets `sid` cookie. |
| **AC-F01-02** | Invalid password | Existing user, incorrect password | 401 Unauthorized with `"Invalid email or password"`. |
| **AC-F01-03** | Non-existent user | Unregistered email | 401 Unauthorized with same generic error. |
| **AC-F01-04** | Disabled user login | Inactive account, valid password | 401 Unauthorized with generic error. |
| **AC-F01-05** | Current user identity query | Valid `sid` cookie | 200 OK returning user identity object. |
| **AC-F01-06** | Logout session revocation | Call `/logout`, then reuse old cookie | Initial logout returns 200; subsequent call returns 401. |
| **AC-F01-07** | Session expiry (8h) | Expired session timestamp in DB | Request returns 401 Unauthorized. |
| **AC-F01-08** | Unauthenticated access | Request protected route without cookie | 401 Unauthorized without leaking private data (NFR-01). |
| **AC-F01-09** | Role mismatch protection | Admin role calling financial route | 403 Forbidden (BR-16). |
| **AC-F01-10** | Cross-user privacy isolation | User 1 requesting User 2 account/tx | 404 Not Found (BR-10, D-15). |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-F01-01** | AC-F01-01 | API | `POST /api/auth/login` with demo user credentials. | Status 200, `Set-Cookie` header present with `HttpOnly`. |
| **TEST-F01-02** | AC-F01-02 | API | `POST /api/auth/login` with wrong password. | Status 401, error code `INVALID_CREDENTIALS`. |
| **TEST-F01-03** | AC-F01-03 | API | `POST /api/auth/login` with unknown email. | Status 401, identical error code and message. |
| **TEST-F01-04** | AC-F01-04 | API | Deactivate user, then submit valid login. | Status 401. |
| **TEST-F01-05** | AC-F01-05 | API | `GET /api/auth/me` with active session. | Status 200 with matching `email` and `displayName`. |
| **TEST-F01-06** | AC-F01-06 | API | Login $\rightarrow$ Logout $\rightarrow$ Request `/api/auth/me`. | First call 200, second call 401. |
| **TEST-F01-07** | AC-F01-07 | API | Manually update session `expiresAt` to past $\rightarrow$ request `/api/auth/me`. | Status 401. |
| **TEST-F01-08** | AC-F01-08 | API | Iterate all `/api/*` protected routes without cookie. | All routes return 401 with `{ error: { code: "UNAUTHENTICATED" } }`. |
| **TEST-F01-09** | AC-F01-09 | API | Admin session calls `GET /api/accounts` and `POST /api/transactions/*`. | Status 403 Forbidden. |
| **TEST-F01-10** | AC-F01-10 | API | User 1 attempts `GET /api/accounts/:user2AccountId`. | Status 404 Not Found. |

---

## 5. Definition of Done
- Auth routes and middleware implemented with Supertest coverage.
- Bcrypt cost factor verified at 12.
- Session cookie configuration verified (`httpOnly`, `SameSite=Lax`).
