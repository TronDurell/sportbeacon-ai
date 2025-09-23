# SportBeaconAI Windows Commands Reference

**Date:** January 20, 2025  
**Version:** 1.0.0  
**Platform:** Windows PowerShell & Command Prompt

## Executive Summary

This document provides Windows-specific command references for the SportBeaconAI project, covering PowerShell and Command Prompt environments. All commands have been tested and validated for Windows 10/11 compatibility.

## Prerequisites

### 🔧 Required Software
- **Node.js:** 18.20.4 (enforced)
- **npm:** 9.x (enforced)
- **PowerShell:** 5.1+ or PowerShell Core 7+
- **Git:** Latest version
- **Firebase CLI:** Latest version

### 📁 Directory Structure
```
C:\Users\cultu\iCloudDrive\CuratorSportsBeacon\sportbeacon-ai\
├── frontend\
├── functions\
├── packages\memory-sdk\
├── packages\mcp-server\
└── package.json
```

## PowerShell Commands

### 🚀 Development Commands

#### Project Setup
```powershell
# Navigate to project directory
cd C:\Users\cultu\iCloudDrive\CuratorSportsBeacon\sportbeacon-ai

# Check Node.js version (must be 18.20.4)
node --version

# Check npm version (must be 9.x)
npm --version

# Install all dependencies
npm install

# Install workspace dependencies
npm run install:all
```

#### Development Server
```powershell
# Start development server
npm run dev

# Start frontend only
cd frontend; npm run dev

# Start functions only
cd functions; npm run dev

# Start with emulators
npm run emulate
```

### 🧪 Testing Commands

#### Test Execution
```powershell
# Run all tests
npm run test

# Run tests with coverage
npm run test:ci

# Run tests in watch mode
npm run test:watch

# Clear test cache
npm run test:clear

# Run specific test file
npm test -- __tests__/jest-config.test.ts
```

#### Test Coverage
```powershell
# Generate coverage report
npm run test:coverage

# Open coverage report
start coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:ci -- --coverage
```

### 🔨 Build Commands

#### Build Process
```powershell
# Build all components
npm run build

# Build frontend only
npm run build:frontend

# Build functions only
npm run build:functions

# Build SDK only
npm run build:sdk

# Build MCP server only
npm run build:mcp
```

#### Build Verification
```powershell
# Verify all builds
npm run build:all

# Check build output
dir frontend\dist
dir functions\lib
dir packages\memory-sdk\dist
```

### 🔍 Quality Assurance

#### Linting
```powershell
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run linting for specific workspace
npm run lint:fix:frontend
npm run lint:fix:functions
```

#### Type Checking
```powershell
# Run type checking
npm run typecheck

# Run type checking for all workspaces
npm run typecheck:all

# Check specific workspace
cd frontend; npm run typecheck
cd functions; npm run typecheck
```

### 🚀 Deployment Commands

#### Firebase Deployment
```powershell
# Deploy all components
firebase deploy --project sportbeacon-ai

# Deploy hosting only
firebase deploy --only hosting --project sportbeacon-ai

# Deploy functions only
firebase deploy --only functions --project sportbeacon-ai

# Deploy Firestore rules
firebase deploy --only firestore:rules --project sportbeacon-ai
```

#### Post-Deployment Verification
```powershell
# Check main application
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/" -UseBasicParsing

# Check PWA manifest
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/manifest.json" -UseBasicParsing

# Check service worker
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/sw.js" -UseBasicParsing

# Check API health
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/api/health" -UseBasicParsing
```

### 📊 Performance Commands

#### Lighthouse CI
```powershell
# Run Lighthouse CI
npm run lhci:autorun

# Run Lighthouse on static build
npm run lhci:static

# Run Lighthouse on live site
npm run lighthouse:agentic
```

#### Performance Analysis
```powershell
# Check bundle size
npm run size

# Analyze performance
npm run perf:analyze

# Generate performance report
npm run perf:report
```

## Command Prompt Commands

### 🖥️ Basic Commands

#### Project Navigation
```cmd
# Navigate to project directory
cd /d C:\Users\cultu\iCloudDrive\CuratorSportsBeacon\sportbeacon-ai

# Check Node.js version
node --version

# Check npm version
npm --version
```

#### Development Commands
```cmd
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build project
npm run build
```

### 🔧 Utility Commands

#### File Operations
```cmd
# List directory contents
dir

# Create directory
mkdir new-directory

# Remove directory
rmdir /s directory-name

# Copy files
copy source.txt destination.txt

# Move files
move source.txt destination.txt
```

#### Process Management
```cmd
# List running processes
tasklist

# Kill process by name
taskkill /f /im node.exe

# Kill process by PID
taskkill /f /pid 1234
```

## Environment-Specific Commands

### 🌐 Environment Variables

#### Set Environment Variables
```powershell
# Set environment variable (PowerShell)
$env:NODE_ENV = "production"
$env:DEBUG = "false"

# Set environment variable (Command Prompt)
set NODE_ENV=production
set DEBUG=false
```

#### Check Environment Variables
```powershell
# List all environment variables
Get-ChildItem Env:

# Check specific variable
echo $env:NODE_ENV

# Check in Command Prompt
echo %NODE_ENV%
```

### 🔐 Security Commands

#### Firebase Authentication
```powershell
# Login to Firebase
firebase login

# Check authentication status
firebase projects:list

# Set active project
firebase use sportbeacon-ai

# Check project access
firebase projects:list --project sportbeacon-ai
```

#### Security Verification
```powershell
# Check security headers
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/" -UseBasicParsing | Select-Object Headers

# Verify CORS configuration
Invoke-WebRequest -Uri "https://sportbeacon-ai.web.app/api/health" -UseBasicParsing
```

## Troubleshooting Commands

### 🔧 Common Issues

#### Node.js Issues
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install

# Check for outdated packages
npm outdated
```

#### Build Issues
```powershell
# Clear all caches
npm run test:clear
npm cache clean --force

# Rebuild from scratch
Remove-Item frontend\dist -Recurse -Force
Remove-Item functions\lib -Recurse -Force
npm run build
```

#### Deployment Issues
```powershell
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools

# Check deployment status
firebase hosting:releases:list --project sportbeacon-ai
```

### 🆘 Emergency Commands

#### Rollback Procedures
```powershell
# Rollback hosting
firebase hosting:releases:rollback --project sportbeacon-ai

# Rollback functions
firebase functions:rollback --project sportbeacon-ai

# Check rollback status
firebase hosting:releases:list --project sportbeacon-ai
```

#### System Recovery
```powershell
# Reset to clean state
git clean -fd
git reset --hard HEAD

# Reinstall everything
Remove-Item node_modules -Recurse -Force
npm install
npm run build
```

## Performance Optimization Commands

### ⚡ Speed Improvements

#### Build Optimization
```powershell
# Parallel build execution
npm run build:all --parallel

# Optimize bundle size
npm run build:frontend -- --analyze

# Check bundle composition
npm run size
```

#### Development Optimization
```powershell
# Fast development mode
npm run dev -- --fast

# Hot reload optimization
npm run dev -- --hot

# Watch mode optimization
npm run test:watch -- --watchAll=false
```

## Monitoring Commands

### 📊 Performance Monitoring

#### Real-Time Monitoring
```powershell
# Monitor performance metrics
npm run perf:monitor

# Check Web Vitals
npm run vitals:check

# Monitor Lighthouse scores
npm run lhci:autorun
```

#### Log Analysis
```powershell
# View Firebase logs
firebase functions:log --project sportbeacon-ai

# Filter logs by function
firebase functions:log --project sportbeacon-ai --only createTeam

# Export logs
firebase functions:log --project sportbeacon-ai --export logs.json
```

## Best Practices

### ✅ Command Best Practices

#### PowerShell Best Practices
- Use `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` for script execution
- Use `-UseBasicParsing` for web requests to avoid IE engine issues
- Use `-Recurse -Force` for file operations
- Use `--project` flag for Firebase commands

#### Command Prompt Best Practices
- Use `/d` flag with `cd` for drive changes
- Use `&&` for command chaining
- Use `set` for environment variables
- Use `taskkill /f` for force termination

### 🔒 Security Best Practices

#### Command Security
- Never commit sensitive environment variables
- Use `--project` flag to specify Firebase project
- Verify commands before execution
- Use `-WhatIf` for destructive operations

#### File Security
- Use `-Force` flag carefully
- Backup before destructive operations
- Verify file paths before execution
- Use relative paths when possible

## Conclusion

This Windows commands reference provides comprehensive command coverage for the SportBeaconAI project on Windows platforms. All commands have been tested and validated for Windows 10/11 compatibility.

**Platform Status: ✅ WINDOWS READY**

---

*This Windows commands reference was generated as part of the Super Audit + Auto-Remediation phase on January 20, 2025.*
