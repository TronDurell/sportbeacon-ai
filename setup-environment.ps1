# SportBeaconAI Environment Setup Script
# This script helps create the .env.local file with proper Firebase configuration

Write-Host "Setting up SportBeaconAI Environment Variables..." -ForegroundColor Yellow

# Firebase Configuration (from your provided config)
$firebaseConfig = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyDgpV09FF2-Rm5OzWVxsN_lW_qacvYk8EY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "sportbeacon-ai.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "sportbeacon-ai"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "sportbeacon-ai.appspot.com"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "104921686559"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:104921686559:web:406dad79245c28c4ec6b2a"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = "G-1YH08655TT"
}

# Create .env.local content
$envContent = "# SportBeaconAI Production Environment Configuration`n"
$envContent += "# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

$envContent += "# Firebase Configuration (Frontend)`n"

foreach ($key in $firebaseConfig.Keys) {
    $envContent += "$key=$($firebaseConfig[$key])`n"
}

$envContent += "`n# Additional Configuration (Replace with actual values)`n"
$envContent += "NEXT_PUBLIC_ENABLE_SENTRY=false`n"
$envContent += "NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here`n"
$envContent += "NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`n"
$envContent += "NEXT_PUBLIC_SENTRY_RELEASE=v1.0.0`n"
$envContent += "`n# Node Environment`n"
$envContent += "NODE_ENV=production`n"
$envContent += "VITE_APP_ENV=production`n"

# Write to .env.local
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "OK .env.local file created successfully!" -ForegroundColor Green
Write-Host "Please review and update any placeholder values in .env.local" -ForegroundColor Cyan

# Instructions for next steps
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Review .env.local and update any placeholder values" -ForegroundColor White
Write-Host "2. Run: npm run build" -ForegroundColor White
Write-Host "3. Run: firebase deploy --only hosting" -ForegroundColor White
Write-Host "4. Test: https://sportbeacon-ai.web.app" -ForegroundColor White

Write-Host "`nIf you still see a white screen:" -ForegroundColor Yellow
Write-Host "- Open browser dev tools (F12)" -ForegroundColor White
Write-Host "- Check Console tab for errors" -ForegroundColor White
Write-Host "- Check Network tab for failed requests" -ForegroundColor White 