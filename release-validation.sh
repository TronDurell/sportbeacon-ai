#!/bin/bash
# Release Validation Script for SportBeacon AI
set -e

echo "🚀 SportBeacon AI Release Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    print_status 0 "Node.js version: $(node --version)"
else
    print_status 1 "Node.js version $(node --version) is too old. Need 18+"
fi

# Check Python version
echo "📋 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ "$PYTHON_VERSION" == "3.11" ]]; then
    print_status 0 "Python version: $(python3 --version)"
else
    print_status 1 "Python version $(python3 --version) is not 3.11"
fi

# Backend validation
echo "🔧 Validating Backend..."
cd backend
python3 -c "from api import app; print('Backend API import OK')" 2>/dev/null
print_status $? "Backend API imports successfully"

# Test backend endpoints (if server is running)
echo "🌐 Testing Backend Endpoints..."
if curl -s -f http://127.0.0.1:8000/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/health)
    print_status 0 "Health endpoint: $HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠️ Backend server not running on port 8000${NC}"
fi

cd ..

# Frontend validation
echo "🎨 Validating Frontend..."
cd frontend

# Check dependencies
echo "📦 Checking dependencies..."
npm ci --silent
print_status $? "Dependencies installed"

# TypeScript check
echo "📝 TypeScript compilation check..."
npm run typecheck --silent
print_status $? "TypeScript compilation successful"

# Build test
echo "🏗️ Build test..."
npm run build --silent
print_status $? "Frontend build successful"

cd ..

# Docker validation
echo "🐳 Validating Docker..."
if command -v docker &> /dev/null; then
    echo "📦 Building Docker images..."
    docker compose build --quiet
    print_status $? "Docker images built successfully"
    
    echo "🚀 Starting Docker services..."
    docker compose up -d
    sleep 10
    
    echo "🔍 Testing Docker services..."
    if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status 0 "Backend service healthy"
    else
        print_status 1 "Backend service not responding"
    fi
    
    if curl -s -f http://localhost:3002 > /dev/null 2>&1; then
        print_status 0 "Frontend service responding"
    else
        print_status 1 "Frontend service not responding"
    fi
    
    echo "🛑 Stopping Docker services..."
    docker compose down
else
    echo -e "${YELLOW}⚠️ Docker not available, skipping Docker validation${NC}"
fi

# Version check
echo "📋 Version Validation..."
FRONTEND_VERSION=$(node -p "require('./frontend/package.json').version")
BACKEND_VERSION=$(python3 -c "from backend.version import __version__; print(__version__)" 2>/dev/null || echo "unknown")

if [[ "$FRONTEND_VERSION" == "0.1.0-rc" && "$BACKEND_VERSION" == "0.1.0-rc" ]]; then
    print_status 0 "Versions match: $FRONTEND_VERSION"
else
    print_status 1 "Version mismatch: Frontend=$FRONTEND_VERSION, Backend=$BACKEND_VERSION"
fi

echo ""
echo "🎉 Release Validation Complete!"
echo "================================"
echo "✅ All checks passed"
echo "📋 Frontend version: $FRONTEND_VERSION"
echo "📋 Backend version: $BACKEND_VERSION"
echo "🚀 Ready for release!"
