#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
cd admin && npm install && cd ..

echo "==> Building React admin UI..."
cd admin && npm run build && cd ..

echo "==> Creating plugin ZIP..."
cd ..
zip -r jug-ai-wp.zip jug-ai-wp-mc/ \
  -x "jug-ai-wp-mc/admin/node_modules/*" \
  -x "jug-ai-wp-mc/admin/src/*" \
  -x "jug-ai-wp-mc/admin/package.json" \
  -x "jug-ai-wp-mc/admin/package-lock.json" \
  -x "jug-ai-wp-mc/admin/tsconfig.json" \
  -x "jug-ai-wp-mc/docker-compose.yml" \
  -x "jug-ai-wp-mc/build.sh" \
  -x "jug-ai-wp-mc/.git/*" \
  -x "jug-ai-wp-mc/.gitignore" \
  -x "jug-ai-wp-mc/.DS_Store" \
  -x "jug-ai-wp-mc/README.md" \
  -x "jug-ai-wp-mc/*.log"
cd jug-ai-wp-mc

echo "==> Done! ZIP created at ../jug-ai-wp.zip"
