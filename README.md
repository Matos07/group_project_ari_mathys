# Personal Money and Expense Logging System

> **Course:** CPE 334 Software Engineering | Semester 1/2026  
> **Theme:** 7 — Personal Money and Expense Logging System  
> **Milestone:** Sprint 1 Baseline & Vertical Slice

A multi-user personal finance and expense logging web application built with TypeScript, Node.js, Express, Prisma ORM, and React. Tracks cash and bank accounts, credit card debts, loan receivables, and expense/income allocations using exact integer arithmetic (Thai satang) and strict ledger invariants.

---

## 1. Quick Start & Setup (NFR-06)

A fresh checkout can be installed, configured, migrated, seeded, and tested in **5 commands**:

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm test
```

### Environment Variables (NFR-12)
All configuration is externalized via `.env`. See `.env.example`:
- `PORT`: HTTP port for Express server (default `3000`).
- `NODE_ENV`: Execution environment (`development`, `test`, `production`).
- `DATABASE_URL`: Relational database connection string (SQLite file in local dev/testing).
- `SESSION_SECRET`: Secret used for signing session cookies.
- `SEED_PASSWORD`: Master password used by the synthetic seed runner (never committed).

---

## 2. Project Architecture

The backend follows a modular monolith structure with strict boundary encapsulation:
- **`src/app.ts`**: Express application factory mounting middleware, JSON parsers, signed cookie handlers, health checks, 404 handler, and central error envelope middleware.
- **`src/config/`**: Environment variable validation and parsing.
- **`src/db/`**: Prisma Client singleton connection manager.
- **`src/errors/`**: Custom `AppError` class encapsulating HTTP status codes and domain error codes.
- **`src/middleware/`**: Standardized error handling middleware formatting all responses into `{ error: { code, message, details? } }` (D-15, NFR-08).
- **`prisma/schema.prisma`**: Relational schema covering `User`, `Session`, `Account`, `Transaction`, and `AllocationLine`.

---

## 3. Running & Testing

- **Development server:** `npm run dev`
- **Build production bundle:** `npm run build`
- **Start production server:** `npm start`
- **Run test suite:** `npm test`
- **Run test coverage:** `npm run test:coverage`
