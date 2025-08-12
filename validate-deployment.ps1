# SportBeaconAI Deployment Validation Script

Write-Host "SportBeaconAI Deployment Validation" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$allChecksPassed = $true

# === CHECK 1: Environment Files ===
Write-Host "`nChecking Environment Configuration..." -ForegroundColor Cyan

if (Test-Path ".env.local") {
    Write-Host "OK .env.local exists" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_FIREBASE_API_KEY") {
        Write-Host "OK Firebase API key configured" -ForegroundColor Green
    } else {
        Write-Host "ERROR Firebase API key missing in .env.local" -ForegroundColor Red
        $allChecksPassed = $false
    }
} else {
    Write-Host "ERROR .env.local missing" -ForegroundColor Red
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File setup-environment.ps1" -ForegroundColor Yellow
    $allChecksPassed = $false
}

# === CHECK 2: Node.js and npm ===
Write-Host "`nChecking Node.js and npm..." -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "OK Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR Node.js not found" -ForegroundColor Red
    $allChecksPassed = $false
}

try {
    $npmVersion = npm --version
    Write-Host "OK npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR npm not found" -ForegroundColor Red
    $allChecksPassed = $false
}

# === CHECK 3: Firebase CLI ===
Write-Host "`nChecking Firebase CLI..." -ForegroundColor Cyan

try {
    $firebaseVersion = firebase --version
    Write-Host "OK Firebase CLI version: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR Firebase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    $allChecksPassed = $false
}

# === CHECK 4: Firebase Login Status ===
Write-Host "`nChecking Firebase Login..." -ForegroundColor Cyan

try {
    $loginStatus = firebase login:list
    if ($loginStatus -match "sportbeacon-ai") {
        Write-Host "OK Firebase logged in and project configured" -ForegroundColor Green
    } else {
        Write-Host "WARNING Firebase logged in but project may not be configured" -ForegroundColor Yellow
        Write-Host "Run: firebase use sportbeacon-ai" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR Firebase not logged in" -ForegroundColor Red
    Write-Host "Run: firebase login" -ForegroundColor Yellow
    $allChecksPassed = $false
}

# === CHECK 5: Dependencies ===
Write-Host "`nChecking Dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Write-Host "OK node_modules exists" -ForegroundColor Green
} else {
    Write-Host "WARNING node_modules missing" -ForegroundColor Yellow
    Write-Host "Run: npm install" -ForegroundColor Yellow
}

if (Test-Path "package.json") {
    Write-Host "OK package.json exists" -ForegroundColor Green
} else {
    Write-Host "ERROR package.json missing" -ForegroundColor Red
    $allChecksPassed = $false
}

# === CHECK 6: Build Script ===
Write-Host "`nChecking Build Configuration..." -ForegroundColor Cyan

$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts.build) {
    Write-Host "OK Build script configured" -ForegroundColor Green
} else {
    Write-Host "ERROR Build script missing in package.json" -ForegroundColor Red
    $allChecksPassed = $false
}

# === CHECK 7: Firebase Configuration ===
Write-Host "`nChecking Firebase Configuration..." -ForegroundColor Cyan

if (Test-Path "firebase.json") {
    Write-Host "OK firebase.json exists" -ForegroundColor Green
    $firebaseConfig = Get-Content "firebase.json" | ConvertFrom-Json
    if ($firebaseConfig.hosting.public -eq "dist") {
        Write-Host "OK Firebase hosting configured for dist/ directory" -ForegroundColor Green
    } else {
        Write-Host "WARNING Firebase hosting may not be configured for dist/" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR firebase.json missing" -ForegroundColor Red
    Write-Host "Run: firebase init hosting" -ForegroundColor Yellow
    $allChecksPassed = $false
}

# === CHECK 8: Deployment Scripts ===
Write-Host "`nChecking Deployment Scripts..." -ForegroundColor Cyan

$scripts = @("deploy-unified.ps1", "rollback.ps1", "test-local.ps1", "setup-environment.ps1")
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "OK $script exists" -ForegroundColor Green
    } else {
        Write-Host "ERROR $script missing" -ForegroundColor Red
        $allChecksPassed = $false
    }
}

# === CHECK 9: Git Ignore ===
Write-Host "`nChecking Security Configuration..." -ForegroundColor Cyan

$gitignore = Get-Content ".gitignore" -Raw
if ($gitignore -match "deploy_snapshots/") {
    Write-Host "OK Deployment snapshots protected in .gitignore" -ForegroundColor Green
} else {
    Write-Host "WARNING Deployment snapshots not protected in .gitignore" -ForegroundColor Yellow
}

if ($gitignore -match "\.env\*") {
    Write-Host "OK Environment files protected in .gitignore" -ForegroundColor Green
} else {
    Write-Host "WARNING Environment files not protected in .gitignore" -ForegroundColor Yellow
}

# === FINAL SUMMARY ===
Write-Host "`nValidation Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

if ($allChecksPassed) {
    Write-Host "All critical checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Test locally: .\test-local.ps1" -ForegroundColor White
    Write-Host "2. Deploy to production: .\deploy-unified.ps1" -ForegroundColor White
} else {
    Write-Host "Some checks failed. Please fix the issues above before deploying." -ForegroundColor Red
    Write-Host "`nFix the issues marked with ERROR above, then run this validation again." -ForegroundColor Yellow
}

Write-Host "`nFor detailed instructions, see: DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan 