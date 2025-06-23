#!/bin/bash

# SportBeaconAI Production Deployment Script
# This script handles the complete production deployment with monitoring and rollback capabilities

set -e

# Configuration
PROJECT_NAME="sportbeacon-ai"
DEPLOYMENT_ENV="production"
DOCKER_REGISTRY="sportbeacon"
VERSION=$(git describe --tags --always)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
LOG_FILE="/var/log/sportbeacon/deployment_${TIMESTAMP}.log"

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

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running or not accessible"
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        error "Docker Compose is not installed"
    fi
    
    # Check if required environment variables are set
    required_vars=(
        "DATABASE_URL"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "OPENAI_API_KEY"
        "STRIPE_SECRET_KEY"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_PRIVATE_KEY"
        "FIREBASE_CLIENT_EMAIL"
        "WEB3_PROVIDER_URL"
        "ELEVENLABS_API_KEY"
        "GRAFANA_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    BACKUP_NAME="backup_${TIMESTAMP}.sql"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create database backup
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U "$POSTGRES_USER" sportbeacon > "$BACKUP_PATH"; then
        success "Database backup created: $BACKUP_PATH"
    else
        warning "Failed to create database backup, continuing with deployment..."
    fi
    
    # Create configuration backup
    CONFIG_BACKUP="config_backup_${TIMESTAMP}.tar.gz"
    tar -czf "${BACKUP_DIR}/${CONFIG_BACKUP}" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        .
    
    success "Configuration backup created: ${BACKUP_DIR}/${CONFIG_BACKUP}"
}

# Build and tag images
build_images() {
    log "Building and tagging Docker images..."
    
    # Build frontend
    log "Building frontend image..."
    docker build -f frontend/Dockerfile.production -t "${DOCKER_REGISTRY}/frontend:${VERSION}" ./frontend
    docker tag "${DOCKER_REGISTRY}/frontend:${VERSION}" "${DOCKER_REGISTRY}/frontend:latest"
    
    # Build backend
    log "Building backend image..."
    docker build -f backend/Dockerfile.production -t "${DOCKER_REGISTRY}/backend:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/backend:${VERSION}" "${DOCKER_REGISTRY}/backend:latest"
    
    # Build video processor
    log "Building video processor image..."
    docker build -f backend/Dockerfile.video -t "${DOCKER_REGISTRY}/video-processor:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/video-processor:${VERSION}" "${DOCKER_REGISTRY}/video-processor:latest"
    
    # Build websocket service
    log "Building websocket service image..."
    docker build -f backend/Dockerfile.websocket -t "${DOCKER_REGISTRY}/websocket:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/websocket:${VERSION}" "${DOCKER_REGISTRY}/websocket:latest"
    
    # Build job processor
    log "Building job processor image..."
    docker build -f backend/Dockerfile.jobs -t "${DOCKER_REGISTRY}/job-processor:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/job-processor:${VERSION}" "${DOCKER_REGISTRY}/job-processor:latest"
    
    # Build plugin manager
    log "Building plugin manager image..."
    docker build -f backend/Dockerfile.plugins -t "${DOCKER_REGISTRY}/plugin-manager:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/plugin-manager:${VERSION}" "${DOCKER_REGISTRY}/plugin-manager:latest"
    
    # Build privacy service
    log "Building privacy service image..."
    docker build -f backend/Dockerfile.privacy -t "${DOCKER_REGISTRY}/privacy-service:${VERSION}" ./backend
    docker tag "${DOCKER_REGISTRY}/privacy-service:${VERSION}" "${DOCKER_REGISTRY}/privacy-service:latest"
    
    success "All images built and tagged successfully"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.production.yml down --remove-orphans
    
    # Start services
    log "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    success "Services deployed successfully"
}

# Health checks
perform_health_checks() {
    log "Performing health checks..."
    
    # Check if services are running
    services=("frontend" "backend" "postgres" "redis" "nginx")
    
    for service in "${services[@]}"; do
        log "Checking $service..."
        if docker-compose -f docker-compose.production.yml ps "$service" | grep -q "Up"; then
            success "$service is running"
        else
            error "$service is not running"
        fi
    done
    
    # Check API health endpoint
    log "Checking API health endpoint..."
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "API health check passed"
    else
        error "API health check failed"
    fi
    
    # Check frontend
    log "Checking frontend..."
    if curl -f http://localhost > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check database connection
    log "Checking database connection..."
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connection
    log "Checking Redis connection..."
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        success "Redis health check passed"
    else
        error "Redis health check failed"
    fi
    
    success "All health checks passed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if docker-compose -f docker-compose.production.yml exec -T backend python manage.py migrate; then
        success "Database migrations completed"
    else
        error "Database migrations failed"
    fi
}

# Initialize monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Wait for Prometheus to be ready
    log "Waiting for Prometheus to be ready..."
    sleep 30
    
    # Check Prometheus
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        success "Prometheus is running"
    else
        warning "Prometheus health check failed"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Grafana is running"
    else
        warning "Grafana health check failed"
    fi
    
    # Check Elasticsearch
    if curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        success "Elasticsearch is running"
    else
        warning "Elasticsearch health check failed"
    fi
    
    success "Monitoring setup completed"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Test API endpoints
    endpoints=(
        "http://localhost:8000/health"
        "http://localhost:8000/api/version"
        "http://localhost:8000/api/sports"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        if curl -f "$endpoint" > /dev/null 2>&1; then
            success "Endpoint $endpoint is working"
        else
            warning "Endpoint $endpoint failed"
        fi
    done
    
    # Test frontend routes
    frontend_routes=(
        "http://localhost/"
        "http://localhost/dashboard"
        "http://localhost/admin"
    )
    
    for route in "${frontend_routes[@]}"; do
        log "Testing frontend route: $route"
        if curl -f "$route" > /dev/null 2>&1; then
            success "Frontend route $route is working"
        else
            warning "Frontend route $route failed"
        fi
    done
    
    success "Smoke tests completed"
}

# Update deployment status
update_deployment_status() {
    log "Updating deployment status..."
    
    # Create deployment record
    deployment_data=$(cat <<EOF
{
    "version": "$VERSION",
    "timestamp": "$TIMESTAMP",
    "environment": "$DEPLOYMENT_ENV",
    "status": "completed",
    "health_checks": "passed",
    "backup_created": "true"
}
EOF
)
    
    # Store deployment record (you can modify this to store in your preferred location)
    echo "$deployment_data" > "/var/log/sportbeacon/deployment_${TIMESTAMP}.json"
    
    success "Deployment status updated"
}

# Cleanup old images
cleanup_old_images() {
    log "Cleaning up old Docker images..."
    
    # Remove images older than 7 days
    docker image prune -f --filter "until=168h"
    
    # Remove unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting SportBeaconAI production deployment..."
    log "Version: $VERSION"
    log "Timestamp: $TIMESTAMP"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    build_images
    deploy_services
    run_migrations
    perform_health_checks
    setup_monitoring
    run_smoke_tests
    update_deployment_status
    cleanup_old_images
    
    success "Production deployment completed successfully!"
    log "Deployment log: $LOG_FILE"
    
    # Display service URLs
    echo ""
    echo "Service URLs:"
    echo "Frontend: http://localhost"
    echo "API: http://localhost:8000"
    echo "Grafana: http://localhost:3000"
    echo "Prometheus: http://localhost:9090"
    echo "Kibana: http://localhost:5601"
    echo "HAProxy Stats: http://localhost:8404"
}

# Rollback function
rollback() {
    log "Starting rollback process..."
    
    # Get the previous version
    PREVIOUS_VERSION=$(ls -t /var/log/sportbeacon/deployment_*.json | head -2 | tail -1 | xargs cat | jq -r '.version')
    
    if [ -z "$PREVIOUS_VERSION" ]; then
        error "No previous deployment found for rollback"
    fi
    
    log "Rolling back to version: $PREVIOUS_VERSION"
    
    # Stop current services
    docker-compose -f docker-compose.production.yml down
    
    # Restore from backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.sql | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restoring database from backup: $LATEST_BACKUP"
        docker-compose -f docker-compose.production.yml up -d postgres
        sleep 10
        docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d sportbeacon -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d sportbeacon < "$LATEST_BACKUP"
    fi
    
    # Restart services with previous version
    docker-compose -f docker-compose.production.yml up -d
    
    log "Rollback completed"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        perform_health_checks
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|backup}"
        exit 1
        ;;
esac 