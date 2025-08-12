# 🚀 SportBeaconAI Production Deployment Script (PowerShell)
# Includes: build cleanup, Vite build, Git tag, Firebase deploy, log capture, rollback checkpoint, and TestFlight trigger

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false
)

# Set error action to stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_NAME = "sportbeacon-ai"
$BUILD_DIR = "dist"
$DEPLOY_ENV = $Environment
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DEPLOY_LOG = "deploy_logs/deploy-$TIMESTAMP.log"
$TAG_NAME = "deploy-$TIMESTAMP"

# 🔒 Confirm Firebase CLI and Git installed
try {
    $null = Get-Command firebase -ErrorAction Stop
    Write-Host "✅ Firebase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command git -ErrorAction Stop
    Write-Host "✅ Git found" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed." -ForegroundColor Red
    exit 1
}

# 🧼 CLEAN
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path $BUILD_DIR) {
    Remove-Item -Recurse -Force $BUILD_DIR
}
New-Item -ItemType Directory -Force -Path "deploy_logs" | Out-Null

# 🔨 BUILD
Write-Host "🔧 Building app with Vite..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
$buildOutput | Tee-Object -FilePath $DEPLOY_LOG -Append
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 📦 BACKUP
if (-not $SkipBackup) {
    Write-Host "💾 Creating backup snapshot..." -ForegroundColor Yellow
    $backupName = "$BUILD_DIR-backup-$(Get-Date -Format 'yyyyMMddHHmm')"
    Copy-Item -Recurse $BUILD_DIR $backupName
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
}

# 🏷️ GIT TAG
Write-Host "🏷️ Creating Git tag $TAG_NAME..." -ForegroundColor Yellow
git add . | Tee-Object -FilePath $DEPLOY_LOG -Append
git commit -m "🔄 Production Deploy: $TAG_NAME" | Tee-Object -FilePath $DEPLOY_LOG -Append
git tag -a $TAG_NAME -m "Deployment on $(Get-Date)" | Tee-Object -FilePath $DEPLOY_LOG -Append
git push origin main --tags | Tee-Object -FilePath $DEPLOY_LOG -Append

# 🚀 DEPLOY TO FIREBASE
Write-Host "🚀 Deploying to Firebase Hosting..." -ForegroundColor Yellow
$deployOutput = firebase deploy --only hosting 2>&1
$deployOutput | Tee-Object -FilePath $DEPLOY_LOG -Append
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase deployment failed!" -ForegroundColor Red
    exit 1
}

# ✅ POST DEPLOY CHECK
Write-Host "✅ Checking live URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$PROJECT_NAME.web.app" -Method Head -TimeoutSec 30
    $response.StatusCode | Tee-Object -FilePath $DEPLOY_LOG -Append
    Write-Host "✅ Live URL check passed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Live URL check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    $_.Exception.Message | Tee-Object -FilePath $DEPLOY_LOG -Append
}

# 🧪 TRIGGER IOS BUILD (via GitHub Actions or Fastlane)
Write-Host "📲 Triggering TestFlight build (if connected via CI)..." -ForegroundColor Yellow
try {
    $null = Get-Command gh -ErrorAction Stop
    gh workflow run ios_build.yml -R username/repo-name | Tee-Object -FilePath $DEPLOY_LOG -Append
    Write-Host "✅ TestFlight build triggered" -ForegroundColor Green
} catch {
    Write-Host "⚠️ GitHub CLI not configured or no CI connected." -ForegroundColor Yellow
}

# ✅ DONE
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📋 Logs stored in: $DEPLOY_LOG" -ForegroundColor Cyan
Write-Host "🌐 Live URL: https://$PROJECT_NAME.web.app" -ForegroundColor Cyan
Write-Host "📊 Firebase Console: https://console.firebase.google.com/project/$PROJECT_NAME/overview" -ForegroundColor Cyan 