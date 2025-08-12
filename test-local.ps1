# SportBeaconAI Local Test Script (PowerShell)

Write-Host "🧪 SportBeaconAI Local Test Script" -ForegroundColor Green

# Check if dist/ exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist/ folder not found. Building first..." -ForegroundColor Yellow
    npm run build
}

# Check if npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
} catch {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "🌐 Starting local server..." -ForegroundColor Yellow
Write-Host "📱 Your app will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the local server
npx serve dist -p 3000 