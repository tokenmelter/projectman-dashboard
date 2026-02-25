#!/bin/bash
# Export live DB data to static JSON, commit, and push to trigger Vercel deploy
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

echo "Exporting data from database..."
node "$SCRIPT_DIR/export-data.mjs"

cd "$REPO_DIR"

echo "Committing data..."
git add public/data/
git commit -m "data sync $(date '+%Y-%m-%d %H:%M')" || echo "No changes to commit"
git push origin main

echo "Deploy triggered."
