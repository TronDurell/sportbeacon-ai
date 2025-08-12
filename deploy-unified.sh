#!/bin/bash

echo "🚀 SportBeaconAI Unified Deployment Script"

# Exit on error
set -e

# === STEP 1: Verify .env.local exists ===
if [ ! -f .env.local ]; then
  echo "❌ Missing .env.local. Aborting."
  echo "💡 Run: powershell -ExecutionPolicy Bypass -File setup-environment.ps1"
  exit 1
fi

# === STEP 2: Prepare snapshot folder ===
SNAPSHOT_DIR="deploy_snapshots"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
mkdir -p $SNAPSHOT_DIR
if [ -d "dist" ]; then
  cp -r dist "$SNAPSHOT_DIR/dist-$TIMESTAMP"
  echo "📸 Snapshot saved: $SNAPSHOT_DIR/dist-$TIMESTAMP"
else
  echo "⚠️  No existing dist/ folder to snapshot"
fi

# === STEP 3: Clean previous build ===
echo "🧹 Cleaning old builds..."
rm -rf dist

# === STEP 4: Install & Build ===
echo "📦 Installing dependencies..."
npm install

echo "🔧 Building project..."
npm run build

# === STEP 5: Validate build output ===
if [ ! -f "dist/index.html" ]; then
  echo "❌ Build failed - dist/index.html not found"
  exit 1
fi

echo "✅ Build validation passed"

# === STEP 6: Deploy to Firebase ===
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete! 🔥"
echo "🌐 Your app should be live at: https://sportbeacon-ai.web.app" 