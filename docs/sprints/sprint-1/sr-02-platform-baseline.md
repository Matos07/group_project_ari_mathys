# Engineering Contract: SR-02 Platform Baseline & Database Setup

**Feature ID:** `SR-02`  
**Feature Name:** Platform Baseline, Persistence, and Seed Pipeline  
**Sprint:** Sprint 1  
**Target Release:** Deliverable 1  
**Dependencies:** None  
**Linked Requirements:** BR-15, NFR-06, NFR-07, NFR-08, NFR-12  

---

## 1. Feature SDS (Design & Invariants)

### 1.1 Architecture & Setup
- Initializes the backend project workspace with TypeScript, Node.js, Express, and Prisma ORM.
- Relational schema with migrations for `User`, `Session`, `Account`, `Transaction`, and `AllocationLine`.
- Standardized top-level error-handling middleware that catches unhandled exceptions and formats them safely without stack traces, database queries, or server internals (NFR-08).
- Externalized configuration with `.env.example` defining all required settings (NFR-12).

### 1.2 Synthetic Seed Pipeline (D-17, A-06)
- CLI command `npm run seed` reading `SEED_PASSWORD` from environment.
- Fails immediately if `SEED_PASSWORD` is not provided.
- Idempotently creates:
  - 2 demo users: `demo.user1@example.test`, `demo.user2@example.test`.
  - 1 demo admin: `demo.admin@example.test`.
  - Default accounts for both users: Wallet (Cash), Main Bank (Cash), Credit Card (Loan Taken), Personal Loan (Loan Given), Salary (Income), Interest (Income), Dining (Expense), Groceries (Expense), Electricity (Expense), Telecom (Expense).

---

## 2. Technical Specifications

### 2.1 Prisma Database Schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMINISTRATOR
}

enum AccountType {
  CASH
  LOAN_TAKEN
  LOAN_GIVEN
  INCOME
  EXPENSE
}

enum AccountSubtype {
  WALLET
  BANK
  CREDIT_CARD
  OTHER_LOAN
  NONE
}

enum TransactionKind {
  OPENING_BALANCE
  RECEIPT
  PAYMENT
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  displayName  String
  role         Role          @default(USER)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  sessions     Session[]
  accounts     Account[]
  transactions Transaction[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Account {
  id              String           @id @default(cuid())
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            AccountType
  subtype         AccountSubtype   @default(NONE)
  name            String
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  mainTransactions Transaction[]   @relation("MainAccount")
  allocationLines AllocationLine[] @relation("TargetAccount")

  @@unique([userId, name])
}

model Transaction {
  id              String           @id @default(cuid())
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind            TransactionKind
  mainAccountId   String
  mainAccount     Account          @relation("MainAccount", fields: [mainAccountId], references: [id], onDelete: Restrict)
  totalMinor      Int
  transactionDate String
  description     String           @default("")
  createdAt       DateTime         @default(now())
  allocations     AllocationLine[]
}

model AllocationLine {
  id              String      @id @default(cuid())
  transactionId   String
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  targetAccountId String
  targetAccount   Account     @relation("TargetAccount", fields: [targetAccountId], references: [id], onDelete: Restrict)
  amountMinor     Int
  memo            String      @default("")
}
```

---

## 3. Acceptance Criteria (AC)

| AC ID | Scenario | Preconditions / Input | Expected Outcome |
|---|---|---|---|
| **AC-SR02-01** | Clean installation workflow | Fresh clone with documented 5 commands | App installs, migrates, seeds, and executes tests successfully (NFR-06). |
| **AC-SR02-02** | Seed password enforcement | Run seed script without `SEED_PASSWORD` env var | Process terminates with non-zero exit code and explicit error message. |
| **AC-SR02-03** | Seed demo accounts creation | Run seed script with `SEED_PASSWORD="SecretPass123!"` | 3 users and default accounts created with hashed passwords (bcrypt cost 12). |
| **AC-SR02-04** | Error envelope hygiene | Trigger unhandled error or malformed route | HTTP 500/404 response body matches `{ error: { code, message } }`; no stack trace or SQL exposed (NFR-08). |
| **AC-SR02-05** | Persistent storage durability | Create records, stop server process, restart server | Previously recorded entities remain intact in DB (NFR-07). |

---

## 4. Software Test Specification (STS)

| Test ID | Linked AC | Level | Input / Action | Expected Result |
|---|---|---|---|---|
| **TEST-SR02-01** | AC-SR02-01 | Integration / CLI | Execute setup sequence: install, migrate, seed, test. | Exit code 0 on all steps. |
| **TEST-SR02-02** | AC-SR02-02 | Integration / CLI | Run `npm run seed` with empty `SEED_PASSWORD`. | Process exits with error message requiring `SEED_PASSWORD`. |
| **TEST-SR02-03** | AC-SR02-03 | Integration | Inspect DB records after seed script run. | Users exist with valid bcrypt hash `$2a$12$...` and default accounts are populated. |
| **TEST-SR02-04** | AC-SR02-04 | API | Send invalid request / force unhandled internal exception. | Response body contains `{ error: { code, message } }` with no `stack` property. |
| **TEST-SR02-05** | AC-SR02-05 | Integration | Write transaction row, close Prisma client connection, reconnect and query row. | Row returns identical values. |

---

## 5. Definition of Done
- Prisma schema, migrations, and client generation tested.
- Error handling middleware active on all Express routes.
- Seed script tested and documented in README.
