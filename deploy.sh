#!/bin/bash

# SportBeaconAI Deployment Script
# This script builds and deploys the application to Firebase

set -e  # Exit on any error

echo "🚀 Starting SportBeaconAI deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI is ready"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Run type checking
echo "🔍 Running type checking..."
npm run typecheck

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build frontend
echo "🏗️ Building frontend..."
npm run build:frontend

# Build functions
echo "⚙️ Building functions..."
npm run build:functions

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting,functions

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is now live at: https://sportbeacon-ai.web.app"
