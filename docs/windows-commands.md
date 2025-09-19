# Windows Commands Reference

This document provides Windows-specific commands and their POSIX equivalents for the SportBeaconAI project.

## 🖥️ **Cross-Platform Command Equivalents**

### **File Operations**

| Task | POSIX | Windows PowerShell | Windows CMD |
|------|-------|-------------------|-------------|
| List files | `ls -la` | `Get-ChildItem` | `dir` |
| Create directory | `mkdir -p dir` | `New-Item -ItemType Directory -Force dir` | `mkdir dir` |
| Remove directory | `rm -rf dir` | `Remove-Item -Recurse -Force dir` | `rmdir /s dir` |
| Copy files | `cp -r src dest` | `Copy-Item -Recurse src dest` | `xcopy src dest /e` |
| Move files | `mv src dest` | `Move-Item src dest` | `move src dest` |

### **Text Processing**

| Task | POSIX | Windows PowerShell | Windows CMD |
|------|-------|-------------------|-------------|
| Search in files | `grep -r "pattern" .` | `Select-String -Pattern "pattern" -Recurse` | `findstr /s "pattern" *` |
| Count lines | `wc -l file` | `(Get-Content file).Count` | `find /c /v "" file` |
| View file | `cat file` | `Get-Content file` | `type file` |
| Head of file | `head -n 50 file` | `Get-Content file -Head 50` | `more +1 file` |

### **Network Operations**

| Task | POSIX | Windows PowerShell | Windows CMD |
|------|-------|-------------------|-------------|
| HTTP request | `curl -s url` | `Invoke-WebRequest -Uri url -UseBasicParsing` | `curl.exe -s url` |
| Download file | `curl -O url` | `Invoke-WebRequest -Uri url -OutFile file` | `curl.exe -O url` |
| Check connectivity | `ping host` | `Test-NetConnection host` | `ping host` |

## 🔧 **Project-Specific Commands**

### **Node.js and npm**

```powershell
# Install dependencies
npm ci

# Run tests
npm run test

# Build frontend
npm run build:frontend

# Build functions
npm run build:functions

# Clear Jest cache
npm run test:clear
```

### **Git Operations**

```powershell
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "message"

# Push changes
git push origin main

# Pull changes
git pull origin main
```

### **Firebase Operations**

```powershell
# Deploy hosting
firebase deploy --only hosting --project sportbeacon-ai

# Deploy functions
firebase deploy --only functions --project sportbeacon-ai

# Deploy all
firebase deploy --project sportbeacon-ai
```

## 🌐 **Post-Deploy Verification**

### **POSIX (Linux/macOS)**
```bash
# Check if site is accessible
curl -s https://sportbeacon-ai.web.app | head -n 50

# Check HTTP status
curl -I https://sportbeacon-ai.web.app

# Check specific endpoint
curl -s https://sportbeacon-ai.web.app/api/health
```

### **Windows PowerShell**
```powershell
# Check if site is accessible
iwr https://sportbeacon-ai.web.app -UseBasicParsing | Select-Object -First 50

# Check HTTP status
iwr https://sportbeacon-ai.web.app -UseBasicParsing | Select-Object StatusCode

# Check specific endpoint
iwr https://sportbeacon-ai.web.app/api/health -UseBasicParsing
```

### **Windows CMD**
```cmd
# Check if site is accessible
curl.exe -s https://sportbeacon-ai.web.app | more

# Check HTTP status
curl.exe -I https://sportbeacon-ai.web.app

# Check specific endpoint
curl.exe -s https://sportbeacon-ai.web.app/api/health
```

## 🧪 **Testing Commands**

### **Jest Testing**
```powershell
# Run all tests
npm run test

# Run specific test file
npm run test -- __tests__/frontend-smoke.test.tsx

# Run tests with coverage
npm run test:ci

# Clear Jest cache
npm run test:clear

# Update snapshots
npm run test -- -u
```

### **Lighthouse CI**
```powershell
# Run Lighthouse CI locally
npx @lhci/cli autorun

# Run with specific config
npx @lhci/cli autorun --config=lighthouserc.json
```

## 🔍 **Debugging Commands**

### **Process Management**
```powershell
# List Node.js processes
Get-Process node

# Kill Node.js processes
Stop-Process -Name node -Force

# List processes by port
netstat -ano | findstr :3000
```

### **Environment Variables**
```powershell
# List all environment variables
Get-ChildItem Env:

# Set environment variable
$env:NODE_ENV = "test"

# Check specific variable
echo $env:NODE_ENV
```

### **File Permissions**
```powershell
# Check file permissions
Get-Acl file.txt

# Set file permissions
icacls file.txt /grant Everyone:F
```

## 📦 **Package Management**

### **npm Commands**
```powershell
# Install package
npm install package-name

# Install dev dependency
npm install -D package-name

# Install globally
npm install -g package-name

# List installed packages
npm list

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### **Node Version Management**
```powershell
# Check Node version
node -v

# Check npm version
npm -v

# Use nvm (if installed)
nvm use 18.20.4
nvm list
nvm install 18.20.4
```

## 🚀 **CI/CD Commands**

### **GitHub Actions (Local Simulation)**
```powershell
# Run linting
npm run lint:ci

# Run type checking
npm run typecheck

# Run tests with coverage
npm run test:ci

# Build all
npm run build
```

### **Docker (if using)**
```powershell
# Build Docker image
docker build -t sportbeacon-ai .

# Run Docker container
docker run -p 3000:3000 sportbeacon-ai

# List Docker images
docker images

# Remove Docker images
docker rmi sportbeacon-ai
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Permission Errors**
```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb RunAs

# Fix npm permissions
npm config set prefix %APPDATA%\npm
```

#### **Path Issues**
```powershell
# Check PATH
echo $env:PATH

# Add to PATH
$env:PATH += ";C:\path\to\your\tool"
```

#### **Firewall Issues**
```powershell
# Check Windows Firewall status
Get-NetFirewallProfile

# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### **Performance Monitoring**
```powershell
# Monitor CPU usage
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Monitor memory usage
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10

# Monitor disk usage
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

## 📚 **Additional Resources**

- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Windows Command Reference](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/)
- [Node.js Windows Installation](https://nodejs.org/en/download/)
- [Firebase CLI Windows Setup](https://firebase.google.com/docs/cli#windows)

## 🎯 **Best Practices**

1. **Use PowerShell over CMD** for better scripting capabilities
2. **Use `iwr` (Invoke-WebRequest) over `curl.exe`** for better error handling
3. **Use `Get-Content` over `type`** for better file processing
4. **Use `Select-String` over `findstr`** for better regex support
5. **Always use `-UseBasicParsing`** with `iwr` to avoid IE engine issues
6. **Use `-Force` flag** with file operations to avoid confirmation prompts
7. **Use `-Recurse` flag** for directory operations
8. **Check `$LASTEXITCODE`** after running external commands to verify success
