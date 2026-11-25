#!/usr/bin/env bash
# ==============================================================================
# MoneyLogger — release.sh (used by .github/workflows/deploy.yml)
# ==============================================================================
# WHAT THIS SCRIPT DOES
#   Update pre-provisioned resources only. Does not create SQL, IAM or secrets.
#   Normal release : verify image -> run migration job -> update service.
#   Rollback       : verify image -> update service (NO migration, NO seed).
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Read and validate inputs (fail before any GCP call)
# ------------------------------------------------------------------------------
: "${PROJECT_ID:?Required}" "${REGION:?Required}" "${IMAGE_TAG:?Required}"
SERVICE_NAME="${SERVICE_NAME:-sc3de6abc}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-sc3de6abc-migrate}"
ROLLBACK="${ROLLBACK:-false}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid image tag.' >&2; exit 1; }
[[ "$ROLLBACK" == true || "$ROLLBACK" == false ]] || { echo 'Invalid rollback mode.' >&2; exit 1; }

# ------------------------------------------------------------------------------
# 2. Find the image and pin it by digest
# ------------------------------------------------------------------------------
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/sc3de6abc/sc3de6abc:$IMAGE_TAG"
DIGEST_IMAGE="$(gcloud artifacts docker images describe "$IMAGE" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
[[ "$DIGEST_IMAGE" == "$REGION-docker.pkg.dev/$PROJECT_ID/sc3de6abc/sc3de6abc@sha256:"* ]] || { echo 'Image digest not found.' >&2; exit 1; }

# ------------------------------------------------------------------------------
# 3. Database migration (normal release only; `--wait` blocks until it finishes)
# ------------------------------------------------------------------------------
if [[ "$ROLLBACK" == false ]]; then
  UPDATE_ARGS=(
    --image="$DIGEST_IMAGE"
    --set-secrets="DATABASE_URL=sc3de6abc-database-url:latest,ADMIN_PASSWORD=sc3de6abc-admin-password:latest,SEED_PASSWORD=sc3de6abc-admin-password:latest"
    --command="sh"
    --args="-c,npx prisma migrate deploy && npm run seed"
    --project="$PROJECT_ID" --region="$REGION" --quiet
  )
  if [[ -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
    UPDATE_ARGS+=(--set-env-vars="SMOKE_EMAIL=${SMOKE_EMAIL},SMOKE_PASSWORD=${SMOKE_PASSWORD}")
  fi
  gcloud run jobs update "$MIGRATE_JOB_NAME" "${UPDATE_ARGS[@]}"
  gcloud run jobs execute "$MIGRATE_JOB_NAME" --wait --project="$PROJECT_ID" --region="$REGION" --quiet
  if [[ -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
    gcloud run jobs update "$MIGRATE_JOB_NAME" --remove-env-vars="SMOKE_EMAIL,SMOKE_PASSWORD" --project="$PROJECT_ID" --region="$REGION" --quiet || true
  fi
else
  echo 'Rollback: reuse existing image; skip tests, build, migration and seed.'
fi

# ------------------------------------------------------------------------------
# 4. Point the Cloud Run service at the image and send it 100% of traffic
# ------------------------------------------------------------------------------
gcloud run services update "$SERVICE_NAME" --image="$DIGEST_IMAGE" --project="$PROJECT_ID" --region="$REGION" --quiet
gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project="$PROJECT_ID" --region="$REGION" --quiet

# ------------------------------------------------------------------------------
# 5. Report the URL
# ------------------------------------------------------------------------------
SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
echo "Service URL: $SERVICE_URL"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" >> "$GITHUB_ENV"
fi
