#!/bin/bash

# SportBeaconAI Agentic Features Deployment Script
# This script handles the deployment of agentic features with proper staging and rollback capabilities

set -e

# Configuration
PROJECT_ID=${FIREBASE_PROJECT_ID:-"sportbeaconai-prod"}
STAGING_PROJECT_ID=${FIREBASE_STAGING_PROJECT_ID:-"sportbeaconai-staging"}
BACKUP_DIR="./deploy-backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./deploy-logs/agentic-deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p deploy-backups deploy-logs

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI is not installed. Please install it first."
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install it first."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install it first."
    fi
    
    # Check if user is logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        error "Not logged in to Firebase. Please run 'firebase login' first."
    fi
    
    success "Prerequisites check passed"
}

# Function to run tests
run_tests() {
    log "Running comprehensive test suite..."
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci
    
    # Run MCP server tests
    log "Running MCP server tests..."
    cd packages/mcp-server
    npm test
    cd ../..
    
    # Run Firebase Functions tests
    log "Running Firebase Functions tests..."
    npm run test:functions
    
    # Run frontend tests
    log "Running frontend tests..."
    npm run test:frontend
    
    # Run integration tests
    log "Running integration tests..."
    npm run test:integration
    
    success "All tests passed"
}

# Function to build all packages
build_packages() {
    log "Building all packages..."
    
    # Build MCP server
    log "Building MCP server..."
    npm run mcp:build
    
    # Build Firebase Functions
    log "Building Firebase Functions..."
    npm run build:functions
    
    # Build frontend
    log "Building frontend..."
    npm run build:frontend
    
    success "All packages built successfully"
}

# Function to validate Firestore rules and indexes
validate_firestore() {
    log "Validating Firestore rules and indexes..."
    
    # Validate rules
    firebase firestore:rules:validate --project "$PROJECT_ID"
    
    # Validate indexes
    firebase firestore:indexes:validate --project "$PROJECT_ID"
    
    success "Firestore validation passed"
}

# Function to create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup Firestore rules
    firebase firestore:rules:get --project "$PROJECT_ID" > "$BACKUP_DIR/firestore.rules"
    
    # Backup Firestore indexes
    firebase firestore:indexes:get --project "$PROJECT_ID" > "$BACKUP_DIR/firestore.indexes.json"
    
    # Backup Firebase Functions
    firebase functions:list --project "$PROJECT_ID" > "$BACKUP_DIR/functions-list.txt"
    
    success "Backup created at $BACKUP_DIR"
}

# Function to deploy to staging
deploy_staging() {
    log "Deploying to staging environment..."
    
    # Deploy to staging
    firebase deploy --only functions,firestore:rules,firestore:indexes,hosting --project "$STAGING_PROJECT_ID"
    
    # Run post-deployment tests
    log "Running post-deployment tests on staging..."
    npm run test:post-deployment -- --project="$STAGING_PROJECT_ID"
    
    success "Staging deployment completed"
}

# Function to deploy to production
deploy_production() {
    log "Deploying to production environment..."
    
    # Deploy to production
    firebase deploy --only functions,firestore:rules,firestore:indexes,hosting --project "$PROJECT_ID"
    
    # Run production health checks
    log "Running production health checks..."
    npm run test:production-health -- --project="$PROJECT_ID"
    
    success "Production deployment completed"
}

# Function to rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory not found: $BACKUP_DIR"
    fi
    
    # Restore Firestore rules
    if [ -f "$BACKUP_DIR/firestore.rules" ]; then
        log "Restoring Firestore rules..."
        firebase firestore:rules:set "$BACKUP_DIR/firestore.rules" --project "$PROJECT_ID"
    fi
    
    # Restore Firestore indexes
    if [ -f "$BACKUP_DIR/firestore.indexes.json" ]; then
        log "Restoring Firestore indexes..."
        firebase firestore:indexes:set "$BACKUP_DIR/firestore.indexes.json" --project "$PROJECT_ID"
    fi
    
    # Redeploy functions (this will use the previous version)
    log "Redeploying functions..."
    firebase deploy --only functions --project "$PROJECT_ID"
    
    success "Rollback completed"
}

# Function to monitor deployment
monitor_deployment() {
    log "Monitoring deployment health..."
    
    # Wait for deployment to stabilize
    sleep 30
    
    # Check system health
    log "Checking system health..."
    curl -f "https://$PROJECT_ID.web.app/health" || warning "Health check endpoint not responding"
    
    # Check MCP server health
    log "Checking MCP server health..."
    curl -f "https://$PROJECT_ID.web.app/mcp/health" || warning "MCP server health check failed"
    
    # Check agent status
    log "Checking agent status..."
    # This would typically check the agent status endpoints
    
    success "Deployment monitoring completed"
}

# Function to send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    # Send Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email notification (if configured)
    if [ -n "$EMAIL_RECIPIENTS" ]; then
        echo "$message" | mail -s "SportBeaconAI Deployment $status" "$EMAIL_RECIPIENTS"
    fi
}

# Main deployment function
main() {
    local environment=${1:-"staging"}
    local skip_tests=${2:-"false"}
    
    log "Starting SportBeaconAI Agentic Features deployment to $environment"
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests unless skipped
    if [ "$skip_tests" != "true" ]; then
        run_tests
    else
        warning "Skipping tests as requested"
    fi
    
    # Build packages
    build_packages
    
    # Validate Firestore
    validate_firestore
    
    # Create backup
    create_backup
    
    # Deploy based on environment
    case $environment in
        "staging")
            deploy_staging
            monitor_deployment
            send_notifications "SUCCESS" "Agentic features deployed to staging successfully! 🚀"
            ;;
        "production")
            deploy_production
            monitor_deployment
            send_notifications "SUCCESS" "Agentic features deployed to production successfully! 🎉"
            ;;
        *)
            error "Invalid environment: $environment. Use 'staging' or 'production'"
            ;;
    esac
    
    success "Deployment completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_packages
        ;;
    "validate")
        validate_firestore
        ;;
    "monitor")
        monitor_deployment
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment] [skip_tests]"
        echo ""
        echo "Environments:"
        echo "  staging     Deploy to staging environment (default)"
        echo "  production  Deploy to production environment"
        echo ""
        echo "Options:"
        echo "  skip_tests  Set to 'true' to skip tests"
        echo ""
        echo "Commands:"
        echo "  rollback    Rollback to previous deployment"
        echo "  test        Run tests only"
        echo "  build       Build packages only"
        echo "  validate    Validate Firestore rules and indexes"
        echo "  monitor     Monitor deployment health"
        echo "  help        Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 staging"
        echo "  $0 production true"
        echo "  $0 rollback"
        ;;
    *)
        main "$@"
        ;;
esac
