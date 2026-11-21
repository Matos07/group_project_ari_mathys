# Deployment and Environment Documentation (Lab 5)

This document describes the deployment architecture, configuration parameters, local execution instructions, and cloud delivery procedure for the Personal Money and Expense Logging System (**MoneyLogger**), fulfilling requirements **R-02**, **R-04**, **R-08**, and Lab 5 Section 4.3.

---

## 1. Stack and Cloud Architecture

The cloud architecture uses Google Cloud Platform (GCP) serverless and managed database infrastructure:

* **Compute:** Google Cloud Run (fully managed container execution, scales to zero when idle, min instances 0, max instances 3).
* **Database:** Google Cloud SQL for PostgreSQL 16 (`db-f1-micro`, 10 GB SSD, storage auto-increase disabled for cost control).
* **Container Registry:** Google Artifact Registry (`moneylogger` repository in `asia-southeast1`).
* **Secrets Management:** Google Secret Manager (stores `DATABASE_URL`, `SESSION_SECRET`, and `SEED_PASSWORD`).
* **Continuous Integration & Delivery:** GitHub Actions with keyless Workload Identity Federation (WIF).
* **Runtime User:** Unprivileged `node` user inside minimal `node:24-alpine` container.

---

## 2. Environment Variables Specification (R-02)

Every configuration setting is read from the runtime environment. No secrets are baked into container images or committed to version control.

| Variable Name | Purpose | Is Secret? | Source (Local / Docker) | Source (Cloud Run Production) |
|---|---|---|---|---|
| `PORT` | HTTP port on which the Express server listens | No | `.env` / `3000` | Injected automatically by Cloud Run (`$PORT`) |
| `NODE_ENV` | Runtime environment mode (`development`, `production`, `test`) | No | `.env` (`development`) | Container ENV (`production`) |
| `DATABASE_URL` | Prisma relational database connection string | **Yes** | `.env` (`file:./dev.db` or PostgreSQL) | Mounted from Secret Manager (`DATABASE_URL`) |
| `SESSION_SECRET` | Secret key used to cryptographically sign session cookies (`sid`) | **Yes** | `.env` | Mounted from Secret Manager (`SESSION_SECRET`) |
| `SEED_PASSWORD` | Master password for synthetic demo user accounts (`USER` and `ADMIN`) | **Yes** | `.env` | Mounted from Secret Manager (`SEED_PASSWORD`) |

---

## 3. Local Commands: Build, Run, Test, Migrate, and Seed

### 3.1 Local Development (Node.js & SQLite)

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env

# 3. Generate Prisma client & migrate
npx prisma generate
npx prisma migrate dev --name init

# 4. Populate synthetic seed data
npm run seed

# 5. Run automated test suite
npm test

# 6. Start local development server
npm run dev
```

### 3.2 Local Containerized Execution (Docker Compose)

```bash
# Build image and start PostgreSQL + Application
docker compose up --build -d

# Verify container status
docker compose ps

# Check probes
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/ready

# Stop containers
docker compose down
```

---

## 4. GCP Target Resources

| Resource Type | Resource Name | GCP Region | Specification |
|---|---|---|---|
| GCP Project | `YOUR_PROJECT_ID` | `asia-southeast1` | Free Trial account |
| Artifact Registry | `moneylogger` | `asia-southeast1` | Docker repository |
| Cloud SQL Instance | `moneylogger-pg` | `asia-southeast1` | PostgreSQL 16, `db-f1-micro`, Enterprise Edition |
| Cloud SQL Database | `moneylogger` | `asia-southeast1` | UTF-8 default database |
| Cloud Run Service | `moneylogger` | `asia-southeast1` | Port 3000, 1 vCPU, 512 MiB RAM, 0-3 instances |
| Cloud Run Migrate Job | `moneylogger-migrate` | `asia-southeast1` | Runs `npx prisma migrate deploy && npm run seed` |
| Service Account (Runtime) | `moneylogger-runner` | Global | Secret Manager Secret Accessor, Cloud SQL Client |
| Service Account (Deployer) | `moneylogger-deployer` | Global | Cloud Run Developer, Artifact Registry Writer |

---

## 5. Release Procedure and Commit Identification (R-08)

Routine releases are managed through GitHub Actions:
1. Every reviewed change merged from `staging` into `main` automatically triggers the `.github/workflows/deploy.yml` pipeline.
2. The pipeline builds the container image tagged with the **full 40-character Git commit SHA** (`$GITHUB_SHA`).
3. The image is deployed to Cloud Run using its immutable digest (`@sha256:...`).
4. To identify the currently running commit on production:
   * **Via GCP Console:** Navigate to Cloud Run > `moneylogger` > Revisions > View the container image tag or digest.
   * **Via CLI:**
     ```bash
     gcloud run services describe moneylogger --region=asia-southeast1 --format='value(spec.template.spec.containers[0].image)'
     ```
   * **Via Application Smoke Test:** The smoke test validates the live URL and records the deployed digest in GitHub Actions workflow summary.
