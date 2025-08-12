#!/bin/bash

# 🚀 SportBeaconAI Production Deployment Script
# Includes: build cleanup, Vite build, Git tag, Firebase deploy, log capture, rollback checkpoint, and TestFlight trigger

set -e

PROJECT_NAME="sportbeacon-ai"
BUILD_DIR="dist"
DEPLOY_ENV="production"
DEPLOY_LOG="deploy_logs/deploy-$(date +'%Y-%m-%d_%H-%M-%S').log"
TAG_NAME="deploy-$(date +'%Y-%m-%d_%H-%M-%S')"

# 🔒 Confirm Firebase CLI and Git installed
command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI is not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is not installed."; exit 1; }

# 🧼 CLEAN
echo "🧹 Cleaning previous builds..."
rm -rf $BUILD_DIR
mkdir -p deploy_logs

# 🔨 BUILD
echo "🔧 Building app with Vite..."
npm run build | tee -a "$DEPLOY_LOG"

# 📦 BACKUP
echo "💾 Creating backup snapshot..."
cp -r "$BUILD_DIR" "$BUILD_DIR-backup-$(date +'%Y%m%d%H%M')"

# 🏷️ GIT TAG
echo "🏷️ Creating Git tag $TAG_NAME..."
git add .
git commit -m "🔄 Production Deploy: $TAG_NAME"
git tag -a "$TAG_NAME" -m "Deployment on $(date)"
git push origin main --tags | tee -a "$DEPLOY_LOG"

# 🚀 DEPLOY TO FIREBASE
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting | tee -a "$DEPLOY_LOG"

# ✅ POST DEPLOY CHECK
echo "✅ Checking live URL..."
curl -s -I https://$PROJECT_NAME.web.app | tee -a "$DEPLOY_LOG"

# 🧪 TRIGGER IOS BUILD (via GitHub Actions or Fastlane)
echo "📲 Triggering TestFlight build (if connected via CI)..."
gh workflow run ios_build.yml -R username/repo-name || echo "⚠️ GitHub CLI not configured or no CI connected."

# ✅ DONE
echo "✅ Deployment complete. Logs stored in $DEPLOY_LOG" 