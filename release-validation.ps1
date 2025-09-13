# Release Validation Script for SportBeacon AI (PowerShell)
param(
    [switch]$SkipDocker
)

Write-Host "🚀 SportBeacon AI Release Validation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        exit 1
    }
}

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeMajor = $nodeVersion.TrimStart('v').Split('.')[0]
    if ([int]$nodeMajor -ge 18) {
        Write-Status $true "Node.js version: $nodeVersion"
    } else {
        Write-Status $false "Node.js version $nodeVersion is too old. Need 18+"
    }
} catch {
    Write-Status $false "Node.js not found"
}

# Check Python version
Write-Host "📋 Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.11") {
        Write-Status $true "Python version: $pythonVersion"
    } else {
        Write-Status $false "Python version $pythonVersion is not 3.11"
    }
} catch {
    Write-Status $false "Python not found"
}

# Backend validation
Write-Host "🔧 Validating Backend..." -ForegroundColor Yellow
try {
    $null = python -c "from backend.api import app; print('Backend API import OK')" 2>$null
    Write-Status $true "Backend API imports successfully"
} catch {
    Write-Status $false "Backend API import failed"
}

# Test backend endpoints (if server is running)
Write-Host "🌐 Testing Backend Endpoints..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.StatusCode -eq 200) {
        Write-Status $true "Health endpoint: $($healthResponse.Content)"
    } else {
        Write-Status $false "Health endpoint returned status $($healthResponse.StatusCode)"
    }
} catch {
    Write-Host "⚠️ Backend server not running on port 8000" -ForegroundColor Yellow
}

# Frontend validation
Write-Host "🎨 Validating Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
try {
    npm ci --silent
    Write-Status $true "Dependencies installed"
} catch {
    Write-Status $false "Dependency installation failed"
}

# TypeScript check
Write-Host "📝 TypeScript compilation check..." -ForegroundColor Yellow
try {
    npm run typecheck --silent
    Write-Status $true "TypeScript compilation successful"
} catch {
    Write-Status $false "TypeScript compilation failed"
}

# Build test
Write-Host "🏗️ Build test..." -ForegroundColor Yellow
try {
    npm run build --silent
    Write-Status $true "Frontend build successful"
} catch {
    Write-Status $false "Frontend build failed"
}

Set-Location ..

# Docker validation
if (-not $SkipDocker) {
    Write-Host "🐳 Validating Docker..." -ForegroundColor Yellow
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "📦 Building Docker images..." -ForegroundColor Yellow
        try {
            docker compose build --quiet
            Write-Status $true "Docker images built successfully"
        } catch {
            Write-Status $false "Docker build failed"
        }
        
        Write-Host "🚀 Starting Docker services..." -ForegroundColor Yellow
        try {
            docker compose up -d
            Start-Sleep -Seconds 10
            
            Write-Host "🔍 Testing Docker services..." -ForegroundColor Yellow
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
            if ($healthResponse.StatusCode -eq 200) {
                Write-Status $true "Backend service healthy"
            } else {
                Write-Status $false "Backend service not responding"
            }
            
            $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 5
            if ($frontendResponse.StatusCode -eq 200) {
                Write-Status $true "Frontend service responding"
            } else {
                Write-Status $false "Frontend service not responding"
            }
            
            Write-Host "🛑 Stopping Docker services..." -ForegroundColor Yellow
            docker compose down
        } catch {
            Write-Status $false "Docker services validation failed"
        }
    } else {
        Write-Host "⚠️ Docker not available, skipping Docker validation" -ForegroundColor Yellow
    }
}

# Version check
Write-Host "📋 Version Validation..." -ForegroundColor Yellow
try {
    $frontendVersion = (Get-Content frontend/package.json | ConvertFrom-Json).version
    $backendVersion = python -c "from backend.version import __version__; print(__version__)" 2>$null
    
    if ($frontendVersion -eq "0.1.0-rc" -and $backendVersion -eq "0.1.0-rc") {
        Write-Status $true "Versions match: $frontendVersion"
    } else {
        Write-Status $false "Version mismatch: Frontend=$frontendVersion, Backend=$backendVersion"
    }
} catch {
    Write-Status $false "Version check failed"
}

Write-Host ""
Write-Host "🎉 Release Validation Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ All checks passed" -ForegroundColor Green
Write-Host "📋 Frontend version: $frontendVersion" -ForegroundColor Cyan
Write-Host "📋 Backend version: $backendVersion" -ForegroundColor Cyan
Write-Host "🚀 Ready for release!" -ForegroundColor Green
