#!/bin/bash
# Export live DB data and push to GitHub (triggers Vercel auto-deploy)
cd "$(dirname "$0")/.."
node scripts/export-data.mjs
git add public/data/
git diff --cached --quiet && echo "No data changes." && exit 0
git commit -m "data sync $(date '+%Y-%m-%d %H:%M')"
git push origin main
echo "Pushed. Vercel will auto-deploy."
