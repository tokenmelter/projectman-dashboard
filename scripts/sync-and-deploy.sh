#!/bin/bash
# Export live DB data and push to Vercel Blob storage
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Exporting data from database..."
node "$SCRIPT_DIR/export-data.mjs"

echo "Uploading to Vercel Blob..."
curl -sf -X POST https://projectman-dashboard.vercel.app/api/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer projectman-sync-2026" \
  -d @/tmp/projectman-export.json

echo ""
echo "Data synced to Vercel Blob."
