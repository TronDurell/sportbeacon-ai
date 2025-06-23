#!/bin/bash

# SportBeaconAI Rollback Script
# Usage: ./scripts/rollback.sh [production|staging] [backup_version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
BACKUP_VERSION=${2:-"latest"}
PROJECT_NAME="sportbeacon-ai"

# Environment-specific configurations
case $ENVIRONMENT in
    "production")
        DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
        DOMAIN="api.sportbeacon.ai"
        ;;
    "staging")
        DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
        DOMAIN="staging-api.sportbeacon.ai"
        ;;
    *)
        echo -e "${RED}Error: Invalid environment. Use 'production' or 'staging'${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}🔄 Rolling back SportBeaconAI from ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Backup Version: ${BACKUP_VERSION}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to find backup
find_backup() {
    if [ "$BACKUP_VERSION" = "latest" ]; then
        BACKUP_DIR=$(ls -t backups/${ENVIRONMENT}-* | head -1)
    else
        BACKUP_DIR="backups/${ENVIRONMENT}-${BACKUP_VERSION}"
    fi
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup not found: $BACKUP_DIR"
        exit 1
    fi
    
    echo $BACKUP_DIR
}

# Function to stop current deployment
stop_current_deployment() {
    print_status "Stopping current deployment..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    print_status "Current deployment stopped"
}

# Function to restore from backup
restore_from_backup() {
    local backup_dir=$1
    
    print_status "Restoring from backup: $backup_dir"
    
    # Restore environment file
    if [ -f "$backup_dir/.env" ]; then
        cp "$backup_dir/.env" .env
        print_status "Environment file restored"
    else
        print_warning "No environment file found in backup"
    fi
    
    # Restore database if backup exists
    if [ -f "$backup_dir/database.sql" ]; then
        print_status "Restoring database..."
        
        # Start database service
        docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres
        
        # Wait for database to be ready
        sleep 10
        
        # Restore database
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres psql -U postgres -d sportbeacon < "$backup_dir/database.sql" || {
            print_warning "Database restoration failed"
        }
        
        print_status "Database restored"
    else
        print_warning "No database backup found"
    fi
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    
    # Start services with backup configuration
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be ready
    sleep 30
    
    print_status "Services restarted"
}

# Function to verify rollback
verify_rollback() {
    print_status "Verifying rollback..."
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check database health
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_status "Database is healthy"
    else
        print_error "Database health check failed"
        return 1
    fi
    
    print_status "Rollback verification completed"
    return 0
}

# Function to send rollback notification
send_rollback_notification() {
    local backup_dir=$1
    
    print_status "Sending rollback notification..."
    
    # Send Slack notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                'text': '🔄 SportBeaconAI rolled back on ${ENVIRONMENT}',
                'attachments': [{
                    'color': 'warning',
                    'fields': [
                        {'title': 'Environment', 'value': '${ENVIRONMENT}', 'short': true},
                        {'title': 'Backup Version', 'value': '$(basename $backup_dir)', 'short': true},
                        {'title': 'Domain', 'value': '${DOMAIN}', 'short': true},
                        {'title': 'Status', 'value': '✅ Rollback Successful', 'short': true}
                    ]
                }]
            }" \
            $SLACK_WEBHOOK_URL > /dev/null 2>&1 || true
    fi
    
    # Send email notification (if configured)
    if [ ! -z "$EMAIL_RECIPIENTS" ]; then
        echo "SportBeaconAI rolled back on ${ENVIRONMENT} to backup: $(basename $backup_dir)" | \
        mail -s "Rollback Notification - ${ENVIRONMENT}" $EMAIL_RECIPIENTS || true
    fi
    
    print_status "Rollback notification sent"
}

# Function to list available backups
list_backups() {
    echo -e "${BLUE}Available backups for ${ENVIRONMENT}:${NC}"
    
    if [ -d "backups" ]; then
        for backup in backups/${ENVIRONMENT}-*; do
            if [ -d "$backup" ]; then
                backup_name=$(basename $backup)
                backup_date=$(echo $backup_name | sed 's/.*-//')
                echo -e "  ${GREEN}${backup_name}${NC} (${backup_date})"
            fi
        done
    else
        echo -e "${YELLOW}No backups directory found${NC}"
    fi
}

# Main rollback process
main() {
    echo -e "${BLUE}Starting rollback process...${NC}"
    
    # Check if backup version is specified
    if [ "$BACKUP_VERSION" = "list" ]; then
        list_backups
        exit 0
    fi
    
    # Find backup directory
    BACKUP_DIR=$(find_backup)
    
    if [ -z "$BACKUP_DIR" ]; then
        print_error "No backup found"
        exit 1
    fi
    
    echo -e "${BLUE}Using backup: $BACKUP_DIR${NC}"
    
    # Confirm rollback
    read -p "Are you sure you want to rollback to this backup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Rollback cancelled"
        exit 0
    fi
    
    # Run rollback steps
    stop_current_deployment
    restore_from_backup $BACKUP_DIR
    restart_services
    
    # Verify rollback
    if verify_rollback; then
        send_rollback_notification $BACKUP_DIR
        echo -e "${GREEN}🎉 Rollback completed successfully!${NC}"
        echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
        echo -e "${BLUE}Backup: $(basename $BACKUP_DIR)${NC}"
        echo -e "${BLUE}Health Check: http://localhost:5000/health${NC}"
    else
        print_error "Rollback verification failed"
        exit 1
    fi
}

# Run main function
main "$@" 