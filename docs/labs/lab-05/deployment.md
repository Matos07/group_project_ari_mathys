# Deployment and Environment Documentation (Lab 5)

This document describes the deployment architecture, configuration parameters, local execution instructions, and cloud delivery procedure for the Personal Money and Expense Logging System (**MoneyLogger**), fulfilling requirements **R-02**, **R-04**, **R-08**, and Lab 5 Section 4.3.

---

## 1. Stack and Cloud Architecture

The cloud architecture uses Google Cloud Platform (GCP) serverless and managed database infrastructure:

* **Compute:** Google Cloud Run (`sc3de6abc` service, fully managed container execution, scales to zero when idle, min instances 0, max instances 1).
* **Database:** Google Cloud SQL for PostgreSQL 16 (`sc3de6abc-pg`, `db-f1-micro`).
* **Container Registry:** Google Artifact Registry (`sc3de6abc` repository in `asia-southeast1`).
* **Secrets Management:** Google Secret Manager (stores `sc3de6abc-database-url`, `sc3de6abc-admin-password`, and `sc3de6abc-demo-password`).
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
| GCP Project | `cpe-se-course-2026` | `asia-southeast1` | Shared course project (Number `670075229477`) |
| Artifact Registry | `sc3de6abc` | `asia-southeast1` | Docker repository |
| Cloud SQL Instance | `sc3de6abc-pg` | `asia-southeast1` | PostgreSQL 16, `db-f1-micro` |
| Cloud SQL Database | `sc3de6abc` | `asia-southeast1` | UTF-8 default database |
| Cloud Run Service | `sc3de6abc` | `asia-southeast1` | Port 3000, 1 vCPU, 512 MiB RAM, URL `https://sc3de6abc-4d7hbszvwq-as.a.run.app` |
| Cloud Run Migrate Job | `sc3de6abc-migrate` | `asia-southeast1` | Runs `npx prisma migrate deploy && npm run seed` |
| Service Account (Runtime) | `sc3de6abc-runner@cpe-se-course-2026.iam.gserviceaccount.com` | Global | Secret Manager Secret Accessor, Cloud SQL Client |
| Service Account (Deployer) | `sc3de6abc-deployer@cpe-se-course-2026.iam.gserviceaccount.com` | Global | WIF GitHub Actions deployer |

---

## 5. Release Procedure and Commit Identification (R-08)

Routine releases are managed through GitHub Actions:
1. Every reviewed change merged from `staging` into `main` automatically triggers the `.github/workflows/deploy.yml` pipeline.
2. The pipeline builds the container image tagged with the **full 40-character Git commit SHA** (`$GITHUB_SHA`).
3. The image is deployed to Cloud Run using its immutable digest (`@sha256:...`).
4. To identify the currently running commit on production:
   * **Via GCP Console:** Navigate to Cloud Run > `sc3de6abc` > Revisions > View the container image tag or digest.
   * **Via CLI:**
     ```bash
     gcloud run services describe sc3de6abc --project=cpe-se-course-2026 --region=asia-southeast1 --format='value(spec.template.spec.containers[0].image)'
     ```
   * **Via Application Smoke Test:** The smoke test validates the live URL (`https://sc3de6abc-4d7hbszvwq-as.a.run.app`) and records the deployed digest in GitHub Actions workflow summary.

---

## 6. Deployment Scripts & Offline Verification (R-07, R-08)

The `deploy/` directory provides standardized, idempotent automation scripts:

* `deploy/deploy.sh`: Initial GCP infrastructure provisioning (Cloud SQL, Secret Manager, Cloud Run service & migration job). Safe to re-run; supports `--demo` and `DRY_RUN=1`.
* `deploy/release.sh`: Executed by GitHub Actions CD pipeline to update Cloud Run to the new immutable digest and run database migrations.
* `deploy/smoke_test.py`: Standalone Python script verifying public health probes (`/api/health`, `/api/ready`), HTML views, and optional authenticated session lifecycle.
* `deploy/teardown.sh`: Destroys provisioned GCP resources to immediately stop billing after lab completion.

### Offline Testing Suite (`deploy/tests/`)
All scripts are verified offline in the CI pipeline without requiring live GCP access or incurring cloud costs:
* `bash deploy/tests/test_deploy_stub.sh`: Verifies idempotency, credential secrecy, enterprise edition flags, and failure gating.
* `bash deploy/tests/test_release_stub.sh`: Tests normal release, rollback mode, and abort on failed migrations.
* `python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'`: Validates smoke test assertions and session cleanup.

