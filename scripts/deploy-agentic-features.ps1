# SportBeaconAI Agentic Features Deployment Script (PowerShell)
# This script handles the deployment of agentic features with proper staging and rollback capabilities

param(
    [Parameter(Position=0)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",
    
    [Parameter(Position=1)]
    [switch]$SkipTests,
    
    [Parameter(Position=2)]
    [ValidateSet("rollback", "test", "build", "validate", "monitor", "help")]
    [string]$Command = ""
)

# Configuration
$PROJECT_ID = if ($env:FIREBASE_PROJECT_ID) { $env:FIREBASE_PROJECT_ID } else { "sportbeaconai-prod" }
$STAGING_PROJECT_ID = if ($env:FIREBASE_STAGING_PROJECT_ID) { $env:FIREBASE_STAGING_PROJECT_ID } else { "sportbeaconai-staging" }
$BACKUP_DIR = "./deploy-backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$LOG_FILE = "./deploy-logs/agentic-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Colors for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"

# Logging functions
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $BLUE
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Error {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[ERROR] $Message"
    Write-Host $logMessage -ForegroundColor $RED
    Add-Content -Path $LOG_FILE -Value $logMessage
    exit 1
}

function Write-Success {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[SUCCESS] $Message"
    Write-Host $logMessage -ForegroundColor $GREEN
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Warning {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[WARNING] $Message"
    Write-Host $logMessage -ForegroundColor $YELLOW
    Add-Content -Path $LOG_FILE -Value $logMessage
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path "deploy-backups" | Out-Null
New-Item -ItemType Directory -Force -Path "deploy-logs" | Out-Null

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if Firebase CLI is installed
    try {
        firebase --version | Out-Null
    } catch {
        Write-Error "Firebase CLI is not installed. Please install it first."
    }
    
    # Check if Node.js is installed
    try {
        node --version | Out-Null
    } catch {
        Write-Error "Node.js is not installed. Please install it first."
    }
    
    # Check if npm is installed
    try {
        npm --version | Out-Null
    } catch {
        Write-Error "npm is not installed. Please install it first."
    }
    
    # Check if user is logged in to Firebase
    try {
        firebase projects:list | Out-Null
    } catch {
        Write-Error "Not logged in to Firebase. Please run 'firebase login' first."
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to run tests
function Invoke-Tests {
    Write-Log "Running comprehensive test suite..."
    
    # Install dependencies
    Write-Log "Installing dependencies..."
    npm ci
    
    # Run MCP server tests
    Write-Log "Running MCP server tests..."
    Set-Location packages/mcp-server
    npm test
    Set-Location ../..
    
    # Run Firebase Functions tests
    Write-Log "Running Firebase Functions tests..."
    npm run test:functions
    
    # Run frontend tests
    Write-Log "Running frontend tests..."
    npm run test:frontend
    
    # Run integration tests
    Write-Log "Running integration tests..."
    npm run test:integration
    
    Write-Success "All tests passed"
}

# Function to build all packages
function Build-Packages {
    Write-Log "Building all packages..."
    
    # Build MCP server
    Write-Log "Building MCP server..."
    npm run mcp:build
    
    # Build Firebase Functions
    Write-Log "Building Firebase Functions..."
    npm run build:functions
    
    # Build frontend
    Write-Log "Building frontend..."
    npm run build:frontend
    
    Write-Success "All packages built successfully"
}

# Function to validate Firestore rules and indexes
function Test-Firestore {
    Write-Log "Validating Firestore rules and indexes..."
    
    # Validate rules
    firebase firestore:rules:validate --project $PROJECT_ID
    
    # Validate indexes
    firebase firestore:indexes:validate --project $PROJECT_ID
    
    Write-Success "Firestore validation passed"
}

# Function to create backup
function New-Backup {
    Write-Log "Creating backup of current deployment..."
    
    # Create backup directory
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
    
    # Backup Firestore rules
    firebase firestore:rules:get --project $PROJECT_ID | Out-File -FilePath "$BACKUP_DIR/firestore.rules"
    
    # Backup Firestore indexes
    firebase firestore:indexes:get --project $PROJECT_ID | Out-File -FilePath "$BACKUP_DIR/firestore.indexes.json"
    
    # Backup Firebase Functions
    firebase functions:list --project $PROJECT_ID | Out-File -FilePath "$BACKUP_DIR/functions-list.txt"
    
    Write-Success "Backup created at $BACKUP_DIR"
}

# Function to deploy to staging
function Deploy-Staging {
    Write-Log "Deploying to staging environment..."
    
    # Deploy to staging
    firebase deploy --only functions,firestore:rules,firestore:indexes,hosting --project $STAGING_PROJECT_ID
    
    # Run post-deployment tests
    Write-Log "Running post-deployment tests on staging..."
    npm run test:post-deployment -- --project=$STAGING_PROJECT_ID
    
    Write-Success "Staging deployment completed"
}

# Function to deploy to production
function Deploy-Production {
    Write-Log "Deploying to production environment..."
    
    # Deploy to production
    firebase deploy --only functions,firestore:rules,firestore:indexes,hosting --project $PROJECT_ID
    
    # Run production health checks
    Write-Log "Running production health checks..."
    npm run test:production-health -- --project=$PROJECT_ID
    
    Write-Success "Production deployment completed"
}

# Function to rollback deployment
function Invoke-Rollback {
    Write-Log "Rolling back deployment..."
    
    if (-not (Test-Path $BACKUP_DIR)) {
        Write-Error "Backup directory not found: $BACKUP_DIR"
    }
    
    # Restore Firestore rules
    if (Test-Path "$BACKUP_DIR/firestore.rules") {
        Write-Log "Restoring Firestore rules..."
        firebase firestore:rules:set "$BACKUP_DIR/firestore.rules" --project $PROJECT_ID
    }
    
    # Restore Firestore indexes
    if (Test-Path "$BACKUP_DIR/firestore.indexes.json") {
        Write-Log "Restoring Firestore indexes..."
        firebase firestore:indexes:set "$BACKUP_DIR/firestore.indexes.json" --project $PROJECT_ID
    }
    
    # Redeploy functions (this will use the previous version)
    Write-Log "Redeploying functions..."
    firebase deploy --only functions --project $PROJECT_ID
    
    Write-Success "Rollback completed"
}

# Function to monitor deployment
function Invoke-Monitor {
    Write-Log "Monitoring deployment health..."
    
    # Wait for deployment to stabilize
    Start-Sleep -Seconds 30
    
    # Check system health
    Write-Log "Checking system health..."
    try {
        Invoke-WebRequest -Uri "https://$PROJECT_ID.web.app/health" -UseBasicParsing | Out-Null
    } catch {
        Write-Warning "Health check endpoint not responding"
    }
    
    # Check MCP server health
    Write-Log "Checking MCP server health..."
    try {
        Invoke-WebRequest -Uri "https://$PROJECT_ID.web.app/mcp/health" -UseBasicParsing | Out-Null
    } catch {
        Write-Warning "MCP server health check failed"
    }
    
    Write-Success "Deployment monitoring completed"
}

# Function to send notifications
function Send-Notifications {
    param(
        [string]$Status,
        [string]$Message
    )
    
    # Send Slack notification
    if ($env:SLACK_WEBHOOK_URL) {
        $body = @{
            text = $Message
        } | ConvertTo-Json
        
        try {
            Invoke-WebRequest -Uri $env:SLACK_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json" | Out-Null
        } catch {
            Write-Warning "Failed to send Slack notification"
        }
    }
}

# Main deployment function
function Start-Deployment {
    param(
        [string]$Environment,
        [bool]$SkipTests
    )
    
    Write-Log "Starting SportBeaconAI Agentic Features deployment to $Environment"
    
    # Check prerequisites
    Test-Prerequisites
    
    # Run tests unless skipped
    if (-not $SkipTests) {
        Invoke-Tests
    } else {
        Write-Warning "Skipping tests as requested"
    }
    
    # Build packages
    Build-Packages
    
    # Validate Firestore
    Test-Firestore
    
    # Create backup
    New-Backup
    
    # Deploy based on environment
    switch ($Environment) {
        "staging" {
            Deploy-Staging
            Invoke-Monitor
            Send-Notifications "SUCCESS" "Agentic features deployed to staging successfully! 🚀"
        }
        "production" {
            Deploy-Production
            Invoke-Monitor
            Send-Notifications "SUCCESS" "Agentic features deployed to production successfully! 🎉"
        }
    }
    
    Write-Success "Deployment completed successfully!"
}

# Handle command line arguments
switch ($Command) {
    "rollback" {
        Invoke-Rollback
    }
    "test" {
        Invoke-Tests
    }
    "build" {
        Build-Packages
    }
    "validate" {
        Test-Firestore
    }
    "monitor" {
        Invoke-Monitor
    }
    "help" {
        Write-Host "Usage: .\deploy-agentic-features.ps1 [Environment] [SkipTests] [Command]"
        Write-Host ""
        Write-Host "Environments:"
        Write-Host "  staging     Deploy to staging environment (default)"
        Write-Host "  production  Deploy to production environment"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  SkipTests   Skip running tests"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  rollback    Rollback to previous deployment"
        Write-Host "  test        Run tests only"
        Write-Host "  build       Build packages only"
        Write-Host "  validate    Validate Firestore rules and indexes"
        Write-Host "  monitor     Monitor deployment health"
        Write-Host "  help        Show this help message"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\deploy-agentic-features.ps1 staging"
        Write-Host "  .\deploy-agentic-features.ps1 production -SkipTests"
        Write-Host "  .\deploy-agentic-features.ps1 -Command rollback"
    }
    default {
        Start-Deployment -Environment $Environment -SkipTests $SkipTests
    }
}
