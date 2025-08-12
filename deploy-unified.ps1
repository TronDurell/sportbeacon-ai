# SportBeaconAI Unified Deployment Script (PowerShell)

Write-Host "SportBeaconAI Unified Deployment Script" -ForegroundColor Green

# Exit on error
$ErrorActionPreference = "Stop"

# === STEP 1: Verify .env.local exists ===
if (-not (Test-Path ".env.local")) {
    Write-Host "Missing .env.local. Aborting." -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File setup-environment.ps1" -ForegroundColor Yellow
    exit 1
}

# === STEP 2: Prepare snapshot folder ===
$SNAPSHOT_DIR = "deploy_snapshots"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $SNAPSHOT_DIR | Out-Null
if (Test-Path "dist") { Copy-Item -Path "dist" -Destination "$SNAPSHOT_DIR/dist-$TIMESTAMP" -Recurse -Force; Write-Host "Snapshot saved: $SNAPSHOT_DIR/dist-$TIMESTAMP" -ForegroundColor Cyan } else { Write-Host "No existing dist/ folder to snapshot" -ForegroundColor Yellow }

# === STEP 3: Clean previous build ===
Write-Host "Cleaning old builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

# === STEP 4: Install & Build ===
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Building project..." -ForegroundColor Yellow
npm run build

# === STEP 5: Validate build output ===
if (-not (Test-Path "dist/index.html")) {
    Write-Host "Build failed - dist/index.html not found" -ForegroundColor Red
    exit 1
}

Write-Host "Build validation passed" -ForegroundColor Green

# === STEP 6: Deploy to Firebase ===
Write-Host "Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your app should be live at: https://sportbeacon-ai.web.app" -ForegroundColor Cyan 