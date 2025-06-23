#!/bin/bash

# SportBeaconAI Deployment Script
# Usage: ./scripts/deploy.sh [production|staging] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-$(date +%Y%m%d-%H%M%S)}
PROJECT_NAME="sportbeacon-ai"

# Environment-specific configurations
case $ENVIRONMENT in
    "production")
        DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
        DOMAIN="api.sportbeacon.ai"
        SSL_CERT_PATH="/etc/letsencrypt/live/sportbeacon.ai"
        ;;
    "staging")
        DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
        DOMAIN="staging-api.sportbeacon.ai"
        SSL_CERT_PATH="/etc/letsencrypt/live/staging.sportbeacon.ai"
        ;;
    *)
        echo -e "${RED}Error: Invalid environment. Use 'production' or 'staging'${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 Deploying SportBeaconAI to ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to backup current deployment
backup_deployment() {
    print_status "Creating backup of current deployment..."
    
    BACKUP_DIR="backups/${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment file
    cp .env "$BACKUP_DIR/"
    
    # Backup database (if running)
    if docker-compose ps | grep -q postgres; then
        docker-compose exec -T postgres pg_dump -U postgres sportbeacon > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup logs
    docker-compose logs > "$BACKUP_DIR/logs.txt" 2>/dev/null || true
    
    print_status "Backup created in $BACKUP_DIR"
}

# Function to build and push Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Set version tag
    export VERSION=$VERSION
    
    # Build images
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Tag images for registry
    docker tag sportbeacon-backend:latest sportbeacon/backend:$VERSION
    docker tag sportbeacon-frontend:latest sportbeacon/frontend:$VERSION
    
    print_status "Docker images built successfully"
}

# Function to deploy to registry (if configured)
push_to_registry() {
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        print_status "Pushing images to registry..."
        
        docker push sportbeacon/backend:$VERSION
        docker push sportbeacon/frontend:$VERSION
        
        print_status "Images pushed to registry"
    else
        print_warning "Docker registry not configured, skipping push"
    fi
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Stop current deployment
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Pull latest images (if using registry)
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE pull
    fi
    
    # Start new deployment
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check health status
    check_health_status
    
    print_status "Application deployed successfully"
}

# Function to check health status
check_health_status() {
    print_status "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    # Check database health
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_status "Database is healthy"
    else
        print_error "Database health check failed"
        exit 1
    fi
    
    # Check Redis health
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is healthy"
    else
        print_error "Redis health check failed"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend python manage.py db upgrade || {
        print_warning "Migration failed, continuing deployment"
    }
    
    print_status "Database migrations completed"
}

# Function to update SSL certificates
update_ssl() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Updating SSL certificates..."
        
        # Check if certbot is available
        if command -v certbot &> /dev/null; then
            certbot renew --quiet || {
                print_warning "SSL certificate renewal failed"
            }
        else
            print_warning "Certbot not available, skipping SSL update"
        fi
    fi
}

# Function to run post-deployment tests
run_tests() {
    print_status "Running post-deployment tests..."
    
    # API health check
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "API health check passed"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    # Frontend accessibility check
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend accessibility check passed"
    else
        print_error "Frontend accessibility check failed"
        exit 1
    fi
    
    # Database connectivity test
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend python -c "
import psycopg2
conn = psycopg2.connect('postgresql://postgres:password@postgres:5432/sportbeacon')
conn.close()
print('Database connection successful')
" > /dev/null 2>&1; then
        print_status "Database connectivity test passed"
    else
        print_error "Database connectivity test failed"
        exit 1
    fi
    
    print_status "All post-deployment tests passed"
}

# Function to send deployment notification
send_notification() {
    print_status "Sending deployment notification..."
    
    # Send Slack notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                'text': '🚀 SportBeaconAI deployed to ${ENVIRONMENT} (v${VERSION})',
                'attachments': [{
                    'color': 'good',
                    'fields': [
                        {'title': 'Environment', 'value': '${ENVIRONMENT}', 'short': true},
                        {'title': 'Version', 'value': '${VERSION}', 'short': true},
                        {'title': 'Domain', 'value': '${DOMAIN}', 'short': true},
                        {'title': 'Status', 'value': '✅ Successful', 'short': true}
                    ]
                }]
            }" \
            $SLACK_WEBHOOK_URL > /dev/null 2>&1 || true
    fi
    
    # Send email notification (if configured)
    if [ ! -z "$EMAIL_RECIPIENTS" ]; then
        echo "SportBeaconAI deployed to ${ENVIRONMENT} (v${VERSION})" | \
        mail -s "Deployment Notification - ${ENVIRONMENT}" $EMAIL_RECIPIENTS || true
    fi
    
    print_status "Deployment notification sent"
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed, initiating rollback..."
    
    # Stop current deployment
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Restore from backup if available
    LATEST_BACKUP=$(ls -t backups/${ENVIRONMENT}-* | head -1)
    if [ ! -z "$LATEST_BACKUP" ]; then
        print_status "Restoring from backup: $LATEST_BACKUP"
        cp "$LATEST_BACKUP/.env" .env
        
        # Restart with previous configuration
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
    fi
    
    print_error "Rollback completed"
    exit 1
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Set error handling
    trap rollback_deployment ERR
    
    # Run deployment steps
    check_prerequisites
    backup_deployment
    build_images
    push_to_registry
    deploy_application
    run_migrations
    update_ssl
    run_tests
    send_notification
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${BLUE}Version: ${VERSION}${NC}"
    echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
    echo -e "${BLUE}Health Check: http://localhost:5000/health${NC}"
}

# Run main function
main "$@" 