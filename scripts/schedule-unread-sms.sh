#!/usr/bin/env bash
# Create / update a Cloud Scheduler job that hits unread-inbox SMS at 08:00 Africa/Accra.
# Usage:
#   APP_URL=https://vendorsgram.com CRON_SECRET=... ./scripts/schedule-unread-sms.sh
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-sellersgram-87822}"
REGION="${SCHEDULER_REGION:-europe-west1}"
JOB_NAME="${JOB_NAME:-vendorsgram-unread-sms}"
APP_URL="${APP_URL:?Set APP_URL to your production host, e.g. https://vendorsgram.com}"
CRON_SECRET="${CRON_SECRET:?Set CRON_SECRET to match the App Hosting secret}"

ENDPOINT="${APP_URL%/}/api/cron/unread-sms"

if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "$JOB_NAME" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --schedule="0 8 * * *" \
    --time-zone="Africa/Accra" \
    --uri="$ENDPOINT" \
    --http-method=POST \
    --headers="Authorization=Bearer ${CRON_SECRET},Content-Type=application/json" \
    --attempt-deadline=320s
  echo "Updated scheduler job $JOB_NAME → $ENDPOINT"
else
  gcloud scheduler jobs create http "$JOB_NAME" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --schedule="0 8 * * *" \
    --time-zone="Africa/Accra" \
    --uri="$ENDPOINT" \
    --http-method=POST \
    --headers="Authorization=Bearer ${CRON_SECRET},Content-Type=application/json" \
    --attempt-deadline=320s
  echo "Created scheduler job $JOB_NAME → $ENDPOINT"
fi
