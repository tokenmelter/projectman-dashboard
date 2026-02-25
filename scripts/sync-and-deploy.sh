#!/bin/bash
# Export live DB data and POST to Vercel Blob via the /api/update endpoint
set -e

DEPLOY_URL="${PROJECTMAN_URL:-https://projectman-dashboard.vercel.app}"
EXPORT_FILE="/tmp/projectman-export.json"

echo "Exporting data from database..."
node "$(dirname "$0")/export-data.mjs"

echo "Posting data to $DEPLOY_URL/api/update ..."
HTTP_CODE=$(curl -s -o /dev/stderr -w '%{http_code}' \
  -X POST "$DEPLOY_URL/api/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer projectman-sync-2026" \
  -d @"$EXPORT_FILE")

if [ "$HTTP_CODE" = "200" ]; then
  echo "Sync complete."
else
  echo "Sync failed with HTTP $HTTP_CODE"
  exit 1
fi
