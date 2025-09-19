@echo off
REM SportBeaconAI Deployment Script for Windows
REM This script builds and deploys the application to Firebase

echo 🚀 Starting SportBeaconAI deployment...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo    npm install -g firebase-tools
    exit /b 1
)

REM Check if user is logged in
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Firebase. Please run:
    echo    firebase login
    exit /b 1
)

echo ✅ Firebase CLI is ready

REM Install dependencies
echo 📦 Installing dependencies...
npm ci --legacy-peer-deps
if errorlevel 1 exit /b 1

REM Run type checking
echo 🔍 Running type checking...
npm run typecheck
if errorlevel 1 exit /b 1

REM Run tests
echo 🧪 Running tests...
npm run test:ci
if errorlevel 1 exit /b 1

REM Build frontend
echo 🏗️ Building frontend...
npm run build:frontend
if errorlevel 1 exit /b 1

REM Build functions
echo ⚙️ Building functions...
npm run build:functions
if errorlevel 1 exit /b 1

REM Deploy to Firebase
echo 🚀 Deploying to Firebase...
firebase deploy --only hosting,functions
if errorlevel 1 exit /b 1

echo ✅ Deployment completed successfully!
echo 🌐 Your app is now live at: https://sportbeacon-ai.web.app
