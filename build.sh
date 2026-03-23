#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
cd admin && npm install && cd ..

echo "==> Building React admin UI..."
cd admin && npm run build && cd ..

echo "==> Creating plugin ZIP..."

# Build into a temp directory with the correct slug name.
PLUGIN_DIR="$PWD"
BUILD_DIR=$(mktemp -d)
mkdir -p "$BUILD_DIR/jug-ai"

# Copy everything, then remove files that should not ship.
rsync -a \
  --exclude='admin/node_modules' \
  --exclude='admin/src' \
  --exclude='admin/package.json' \
  --exclude='admin/package-lock.json' \
  --exclude='admin/tsconfig.json' \
  --exclude='docker-compose.yml' \
  --exclude='build.sh' \
  --exclude='composer.json' \
  --exclude='composer.lock' \
  --exclude='.git' \
  --exclude='.gitignore' \
  --exclude='.DS_Store' \
  --exclude='README.md' \
  --exclude='*.log' \
  ./ "$BUILD_DIR/jug-ai/"

cd "$BUILD_DIR"
zip -r jug-ai.zip jug-ai/
mv jug-ai.zip "$PLUGIN_DIR/../jug-ai.zip"
rm -rf "$BUILD_DIR"

echo "==> Done! ZIP created at $PLUGIN_DIR/../jug-ai.zip"
