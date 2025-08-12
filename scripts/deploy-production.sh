#!/bin/bash

# SportBeaconAI Production Deployment Script
# This script performs a complete pre-deployment audit and deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command_exists firebase; then
        print_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    print_success "Prerequisites check passed"
}

# Step 1: Cleanup + Dependency Reset
cleanup_dependencies() {
    print_status "Step 1: Cleaning up dependencies..."
    
    # Remove node_modules and lock files
    if [ -d "node_modules" ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        print_status "Removing package-lock.json..."
        rm package-lock.json
    fi
    
    # Remove other build artifacts
    if [ -d ".turbo" ]; then
        print_status "Removing .turbo..."
        rm -rf .turbo
    fi
    
    if [ -d ".next" ]; then
        print_status "Removing .next..."
        rm -rf .next
    fi
    
    if [ -d "dist" ]; then
        print_status "Removing dist..."
        rm -rf dist
    fi
    
    # Clean npm cache
    print_status "Cleaning npm cache..."
    npm cache clean --force
    
    print_success "Cleanup completed"
}

# Step 2: Install Dependencies
install_dependencies() {
    print_status "Step 2: Installing dependencies..."
    
    # Install with legacy peer deps
    npm install --legacy-peer-deps
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Step 3: Environment Validation
validate_environment() {
    print_status "Step 3: Validating environment..."
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        if [ -f "env.example" ]; then
            print_status "Creating .env from env.example..."
            cp env.example .env
            print_warning "Please edit .env file with your actual values before continuing"
            read -p "Press Enter after you've configured .env file..."
        else
            print_error "env.example not found"
            exit 1
        fi
    else
        print_success ".env file exists"
    fi
    
    # Check for required environment variables
    required_vars=(
        "VITE_FIREBASE_API_KEY"
        "VITE_FIREBASE_PROJECT_ID"
        "VITE_STRIPE_PUBLISHABLE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            print_warning "Required environment variable $var not found in .env"
        fi
    done
}

# Step 4: Run Pre-deployment Audit
run_audit() {
    print_status "Step 4: Running pre-deployment audit..."
    
    if [ -f "scripts/pre-deployment-audit.js" ]; then
        node scripts/pre-deployment-audit.js
        if [ $? -eq 0 ]; then
            print_success "Pre-deployment audit passed"
        else
            print_error "Pre-deployment audit failed"
            print_warning "Please fix the issues before continuing"
            read -p "Press Enter after fixing the issues..."
        fi
    else
        print_warning "Pre-deployment audit script not found, skipping..."
    fi
}

# Step 5: Code Quality Checks
code_quality_checks() {
    print_status "Step 5: Running code quality checks..."
    
    # TypeScript check
    print_status "Checking TypeScript compilation..."
    npx tsc --noEmit
    if [ $? -eq 0 ]; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        exit 1
    fi
    
    # ESLint check
    print_status "Running ESLint..."
    npm run lint
    if [ $? -eq 0 ]; then
        print_success "ESLint passed"
    else
        print_warning "ESLint found issues"
        read -p "Press Enter to continue anyway..."
    fi
    
    # Format check
    print_status "Checking code formatting..."
    npm run format:check
    if [ $? -eq 0 ]; then
        print_success "Code formatting is consistent"
    else
        print_warning "Code formatting issues found"
        read -p "Press Enter to continue anyway..."
    fi
}

# Step 6: Build Application
build_application() {
    print_status "Step 6: Building application..."
    
    # Build for production
    npm run build:prod
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Step 7: Run Tests
run_tests() {
    print_status "Step 7: Running tests..."
    
    # Run tests with coverage
    npm run test:ci
    
    if [ $? -eq 0 ]; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed"
        read -p "Press Enter to continue anyway..."
    fi
}

# Step 8: Firebase Deployment
deploy_to_firebase() {
    print_status "Step 8: Deploying to Firebase..."
    
    # Check if user is logged in to Firebase
    if ! firebase projects:list >/dev/null 2>&1; then
        print_warning "Not logged in to Firebase. Please login first."
        firebase login
    fi
    
    # Deploy to Firebase
    print_status "Deploying to Firebase..."
    firebase deploy --only hosting,functions,firestore:rules
    
    if [ $? -eq 0 ]; then
        print_success "Firebase deployment successful"
    else
        print_error "Firebase deployment failed"
        exit 1
    fi
}

# Step 9: Post-deployment Verification
post_deployment_verification() {
    print_status "Step 9: Post-deployment verification..."
    
    # Get the deployed URL
    DEPLOYED_URL=$(firebase hosting:channel:list --json | jq -r '.result.channels[0].url // empty')
    
    if [ -n "$DEPLOYED_URL" ]; then
        print_success "Application deployed to: $DEPLOYED_URL"
        
        # Basic health check
        print_status "Performing health check..."
        if curl -f -s "$DEPLOYED_URL" >/dev/null; then
            print_success "Health check passed"
        else
            print_warning "Health check failed"
        fi
    else
        print_warning "Could not determine deployed URL"
    fi
}

# Main deployment function
main() {
    echo -e "${GREEN}🚀 SportBeaconAI Production Deployment${NC}"
    echo "=========================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Confirm deployment
    echo -e "${YELLOW}This will deploy the application to production.${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Run all steps
    check_prerequisites
    cleanup_dependencies
    install_dependencies
    validate_environment
    run_audit
    code_quality_checks
    build_application
    run_tests
    deploy_to_firebase
    post_deployment_verification
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Verify the application is working correctly"
    echo "2. Monitor error logs and performance"
    echo "3. Update documentation if needed"
    echo ""
}

# Run main function
main "$@" 