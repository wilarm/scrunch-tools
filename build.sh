#!/bin/bash
set -e
for app in bulk-setup scrunch-api-exporter google-slides-exporter response-analyzer axp-converter; do
  echo "Building $app..."
  cd "apps/$app"
  npm install
  npm run build
  cd ../..
done
echo "All apps built."
