# Windows PowerShell Commands Reference

## Overview
This document provides PowerShell equivalents for common Linux/macOS commands used in the SportBeaconAI project, ensuring cross-platform compatibility.

## Command Translations

### Web Requests

| Linux/macOS | Windows PowerShell | Windows Git Bash |
|-------------|-------------------|------------------|
| `curl -s URL \| head -50` | `iwr URL -UseBasicParsing \| Select-Object -First 50` | `curl -s URL \| head -50` |
| `curl -I URL` | `iwr URL -UseBasicParsing -Method Head` | `curl -I URL` |
| `curl -X POST URL -d "data"` | `iwr URL -UseBasicParsing -Method Post -Body "data"` | `curl -X POST URL -d "data"` |

### Text Processing

| Linux/macOS | Windows PowerShell | Windows Git Bash |
|-------------|-------------------|------------------|
| `head -n 50` | `Select-Object -First 50` | `head -n 50` |
| `tail -n 50` | `Select-Object -Last 50` | `tail -n 50` |
| `grep pattern` | `Select-String pattern` | `grep pattern` |
| `grep -r pattern .` | `Get-ChildItem -Recurse \| Select-String pattern` | `grep -r pattern .` |
| `sed 's/old/new/'` | `(Get-Content file) -replace 'old', 'new'` | `sed 's/old/new/'` |
| `awk '{print $1}'` | `ForEach-Object { $_.Split()[0] }` | `awk '{print $1}'` |

### File Operations

| Linux/macOS | Windows PowerShell | Windows Git Bash |
|-------------|-------------------|------------------|
| `find . -name "*.ts"` | `Get-ChildItem -Recurse -Filter "*.ts"` | `find . -name "*.ts"` |
| `wc -l file` | `(Get-Content file).Count` | `wc -l file` |
| `sort file` | `Get-Content file \| Sort-Object` | `sort file` |

## Project-Specific Commands

### Testing & Development

```powershell
# Check if site is accessible
try { 
  $response = Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app" -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)" 
} catch { 
  Write-Host "Error: $($_.Exception.Message)" 
}

# Get page content for debugging
$content = Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app" -UseBasicParsing
$content.Content | Select-Object -First 20

# Check Firebase deployment status
iwr "https://sportbeacon-ai.web.app" -UseBasicParsing | Select-String "SportBeacon"
```

### Build & Deploy

```powershell
# Run tests (cross-platform)
npm test

# Check deployment (POSIX)
npm run postdeploy:check:posix

# Check deployment (PowerShell)
npm run postdeploy:check:powershell

# Clear Jest cache
npm run test:clear
```

## Troubleshooting

### Common Issues

1. **Command not found**: Use `curl.exe` instead of `curl` when GNU semantics are required
2. **Permission errors**: Run PowerShell as Administrator for file operations
3. **Encoding issues**: Use `-Encoding UTF8` with PowerShell text operations

### Environment Variables

```powershell
# Set Node version (if using nvm-windows)
nvm use 18.20.4

# Check Node version
node --version

# Check npm version
npm --version
```

## CI/CD Compatibility

The project includes both POSIX and PowerShell versions of critical commands:

- `postdeploy:check:posix` - Uses curl + head for Linux/macOS
- `postdeploy:check:powershell` - Uses iwr for Windows

This ensures the same functionality across all platforms in CI/CD pipelines.
