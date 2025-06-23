#!/bin/bash

# SportBeaconAI Final Production Deployment Script
# Complete enterprise-ready deployment with monitoring and rollback

set -e  # Exit on any error

# Configuration
APP_NAME="sportbeacon-ai"
ENVIRONMENT="production"
REGION="us-east-1"
CLUSTER_NAME="sportbeacon-cluster"
NAMESPACE="production"
VERSION=$(date +'%Y.%m.%d-%H%M')
BACKUP_RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/var/log/sportbeacon-deployment.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi
    
    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        error "helm is not installed"
    fi
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        error "docker is not installed"
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi
    
    # Check namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log "Creating namespace $NAMESPACE"
        kubectl create namespace $NAMESPACE
    fi
    
    # Check resource availability
    check_cluster_resources
    
    log "Pre-deployment checks completed successfully"
}

check_cluster_resources() {
    log "Checking cluster resources..."
    
    # Check CPU and memory availability
    local available_cpu=$(kubectl describe nodes | grep -A 5 "Allocated resources" | grep "cpu" | awk '{print $3}' | sed 's/m//' | awk '{sum += $1} END {print sum}')
    local available_memory=$(kubectl describe nodes | grep -A 5 "Allocated resources" | grep "memory" | awk '{print $3}' | sed 's/Mi//' | awk '{sum += $1} END {print sum}')
    
    if [ "$available_cpu" -lt 4000 ]; then
        warn "Low CPU availability: ${available_cpu}m"
    fi
    
    if [ "$available_memory" -lt 8000 ]; then
        warn "Low memory availability: ${available_memory}Mi"
    fi
    
    log "Available CPU: ${available_cpu}m, Memory: ${available_memory}Mi"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="/backups/sportbeacon-$(date +'%Y%m%d-%H%M%S')"
    mkdir -p $BACKUP_DIR
    
    # Backup Kubernetes resources
    kubectl get all -n $NAMESPACE -o yaml > $BACKUP_DIR/k8s-resources.yaml
    kubectl get configmaps -n $NAMESPACE -o yaml > $BACKUP_DIR/configmaps.yaml
    kubectl get secrets -n $NAMESPACE -o yaml > $BACKUP_DIR/secrets.yaml
    
    # Backup database
    backup_database $BACKUP_DIR
    
    # Backup configuration files
    cp -r config/ $BACKUP_DIR/
    cp docker-compose.production.yml $BACKUP_DIR/
    cp k8s/ $BACKUP_DIR/
    
    # Compress backup
    tar -czf $BACKUP_DIR.tar.gz -C /backups $(basename $BACKUP_DIR)
    rm -rf $BACKUP_DIR
    
    # Upload to S3
    aws s3 cp $BACKUP_DIR.tar.gz s3://sportbeacon-backups/production/
    
    # Clean old backups
    cleanup_old_backups
    
    log "Backup completed: $BACKUP_DIR.tar.gz"
}

backup_database() {
    local backup_dir=$1
    
    log "Backing up database..."
    
    # Get database credentials from Kubernetes secret
    DB_HOST=$(kubectl get secret sportbeacon-db -n $NAMESPACE -o jsonpath='{.data.host}' | base64 -d)
    DB_NAME=$(kubectl get secret sportbeacon-db -n $NAMESPACE -o jsonpath='{.data.name}' | base64 -d)
    DB_USER=$(kubectl get secret sportbeacon-db -n $NAMESPACE -o jsonpath='{.data.user}' | base64 -d)
    DB_PASS=$(kubectl get secret sportbeacon-db -n $NAMESPACE -o jsonpath='{.data.password}' | base64 -d)
    
    # Create database backup
    kubectl run db-backup --image=postgres:15 --rm -i --restart=Never -n $NAMESPACE -- \
        pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $backup_dir/database.sql
    
    log "Database backup completed"
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find /backups -name "sportbeacon-*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Remove S3 backups older than retention period
    aws s3 ls s3://sportbeacon-backups/production/ | \
        awk '{print $4}' | \
        grep "sportbeacon-" | \
        while read file; do
            # Check if file is older than retention period
            if [ $(aws s3 ls s3://sportbeacon-backups/production/$file --query 'LastModified' --output text | xargs -I {} date -d {} +%s) -lt $(date -d "$BACKUP_RETENTION_DAYS days ago" +%s) ]; then
                aws s3 rm s3://sportbeacon-backups/production/$file
                log "Removed old backup: $file"
            fi
        done
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Set Docker build context
    export DOCKER_BUILDKIT=1
    
    # Build main application image
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from ghcr.io/sportbeacon/sportbeacon-ai:latest \
        -t ghcr.io/sportbeacon/sportbeacon-ai:$VERSION \
        -t ghcr.io/sportbeacon/sportbeacon-ai:latest \
        .
    
    # Build frontend image
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from ghcr.io/sportbeacon/sportbeacon-frontend:latest \
        -t ghcr.io/sportbeacon/sportbeacon-frontend:$VERSION \
        -t ghcr.io/sportbeacon/sportbeacon-frontend:latest \
        -f frontend/Dockerfile \
        ./frontend
    
    # Push images
    docker push ghcr.io/sportbeacon/sportbeacon-ai:$VERSION
    docker push ghcr.io/sportbeacon/sportbeacon-ai:latest
    docker push ghcr.io/sportbeacon/sportbeacon-frontend:$VERSION
    docker push ghcr.io/sportbeacon/sportbeacon-frontend:latest
    
    log "Docker images built and pushed successfully"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log "Deploying to Kubernetes..."
    
    # Update image tags in Kubernetes manifests
    sed -i "s|ghcr.io/sportbeacon/sportbeacon-ai:.*|ghcr.io/sportbeacon/sportbeacon-ai:$VERSION|g" k8s/production/deployment.yaml
    sed -i "s|ghcr.io/sportbeacon/sportbeacon-frontend:.*|ghcr.io/sportbeacon/sportbeacon-frontend:$VERSION|g" k8s/production/frontend-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/production/namespace.yaml
    kubectl apply -f k8s/production/configmaps.yaml
    kubectl apply -f k8s/production/secrets.yaml
    kubectl apply -f k8s/production/services.yaml
    kubectl apply -f k8s/production/ingress.yaml
    kubectl apply -f k8s/production/deployment.yaml
    kubectl apply -f k8s/production/frontend-deployment.yaml
    kubectl apply -f k8s/production/redis-deployment.yaml
    kubectl apply -f k8s/production/postgres-deployment.yaml
    kubectl apply -f k8s/production/monitoring/
    
    # Wait for deployments to be ready
    wait_for_deployments
    
    log "Kubernetes deployment completed"
}

wait_for_deployments() {
    log "Waiting for deployments to be ready..."
    
    local deployments=("sportbeacon-api" "sportbeacon-frontend" "redis" "postgres")
    
    for deployment in "${deployments[@]}"; do
        log "Waiting for $deployment deployment..."
        kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=600s
        
        if [ $? -ne 0 ]; then
            error "Deployment $deployment failed to become ready"
        fi
    done
    
    log "All deployments are ready"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Get service URLs
    API_URL=$(kubectl get service sportbeacon-api -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    FRONTEND_URL=$(kubectl get service sportbeacon-frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    # Wait for services to be available
    log "Waiting for services to be available..."
    sleep 30
    
    # Check API health
    check_api_health $API_URL
    
    # Check frontend health
    check_frontend_health $FRONTEND_URL
    
    # Check database connectivity
    check_database_health
    
    # Check Redis connectivity
    check_redis_health
    
    # Run smoke tests
    run_smoke_tests $API_URL $FRONTEND_URL
    
    log "Health checks completed successfully"
}

check_api_health() {
    local api_url=$1
    
    log "Checking API health at $api_url..."
    
    # Check health endpoint
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" http://$api_url/health)
    
    if [ "$health_response" != "200" ]; then
        error "API health check failed: HTTP $health_response"
    fi
    
    # Check readiness endpoint
    local ready_response=$(curl -s -o /dev/null -w "%{http_code}" http://$api_url/ready)
    
    if [ "$ready_response" != "200" ]; then
        error "API readiness check failed: HTTP $ready_response"
    fi
    
    log "API health checks passed"
}

check_frontend_health() {
    local frontend_url=$1
    
    log "Checking frontend health at $frontend_url..."
    
    # Check if frontend is responding
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://$frontend_url)
    
    if [ "$frontend_response" != "200" ]; then
        error "Frontend health check failed: HTTP $frontend_response"
    fi
    
    log "Frontend health checks passed"
}

check_database_health() {
    log "Checking database health..."
    
    # Check if database pod is running
    local db_pod=$(kubectl get pods -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$db_pod" ]; then
        error "Database pod not found"
    fi
    
    # Check if database is ready
    kubectl exec $db_pod -n $NAMESPACE -- pg_isready -U postgres
    
    if [ $? -ne 0 ]; then
        error "Database is not ready"
    fi
    
    log "Database health checks passed"
}

check_redis_health() {
    log "Checking Redis health..."
    
    # Check if Redis pod is running
    local redis_pod=$(kubectl get pods -n $NAMESPACE -l app=redis -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$redis_pod" ]; then
        error "Redis pod not found"
    fi
    
    # Check if Redis is ready
    kubectl exec $redis_pod -n $NAMESPACE -- redis-cli ping
    
    if [ $? -ne 0 ]; then
        error "Redis is not ready"
    fi
    
    log "Redis health checks passed"
}

run_smoke_tests() {
    local api_url=$1
    local frontend_url=$2
    
    log "Running smoke tests..."
    
    # Test API endpoints
    test_api_endpoints $api_url
    
    # Test frontend functionality
    test_frontend_functionality $frontend_url
    
    log "Smoke tests completed successfully"
}

test_api_endpoints() {
    local api_url=$1
    
    # Test authentication endpoint
    local auth_response=$(curl -s -o /dev/null -w "%{http_code}" http://$api_url/api/auth/status)
    
    if [ "$auth_response" != "401" ] && [ "$auth_response" != "200" ]; then
        warn "Authentication endpoint returned unexpected status: $auth_response"
    fi
    
    # Test leagues endpoint
    local leagues_response=$(curl -s -o /dev/null -w "%{http_code}" http://$api_url/api/leagues)
    
    if [ "$leagues_response" != "401" ] && [ "$leagues_response" != "200" ]; then
        warn "Leagues endpoint returned unexpected status: $leagues_response"
    fi
    
    log "API endpoint tests completed"
}

test_frontend_functionality() {
    local frontend_url=$1
    
    # Test if frontend loads
    local frontend_content=$(curl -s http://$frontend_url)
    
    if [[ ! $frontend_content =~ "SportBeacon" ]]; then
        warn "Frontend content does not contain expected text"
    fi
    
    log "Frontend functionality tests completed"
}

# Update DNS and CDN
update_dns_and_cdn() {
    log "Updating DNS and CDN..."
    
    # Update CloudFront distribution
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*"
    
    # Wait for invalidation to complete
    log "Waiting for CloudFront invalidation to complete..."
    sleep 60
    
    # Update Route53 if needed
    # aws route53 change-resource-record-sets \
    #     --hosted-zone-id $HOSTED_ZONE_ID \
    #     --change-batch file://dns-changes.json
    
    log "DNS and CDN updates completed"
}

# Monitoring and alerting
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Deploy Prometheus and Grafana
    kubectl apply -f k8s/production/monitoring/prometheus.yaml
    kubectl apply -f k8s/production/monitoring/grafana.yaml
    kubectl apply -f k8s/production/monitoring/alertmanager.yaml
    
    # Deploy Elasticsearch and Kibana
    kubectl apply -f k8s/production/monitoring/elasticsearch.yaml
    kubectl apply -f k8s/production/monitoring/kibana.yaml
    
    # Deploy custom dashboards
    kubectl apply -f k8s/production/monitoring/dashboards/
    
    # Setup alerting rules
    kubectl apply -f k8s/production/monitoring/alerts/
    
    log "Monitoring setup completed"
}

# Performance testing
run_performance_tests() {
    log "Running performance tests..."
    
    # Run load tests
    kubectl run load-test --image=artilleryio/artillery:latest --rm -i --restart=Never -n $NAMESPACE -- \
        artillery run /tests/load-test.yml
    
    # Run stress tests
    kubectl run stress-test --image=artilleryio/artillery:latest --rm -i --restart=Never -n $NAMESPACE -- \
        artillery run /tests/stress-test.yml
    
    log "Performance tests completed"
}

# Security scanning
run_security_scan() {
    log "Running security scan..."
    
    # Run container security scan
    trivy image ghcr.io/sportbeacon/sportbeacon-ai:$VERSION --severity HIGH,CRITICAL --exit-code 1
    
    if [ $? -ne 0 ]; then
        error "Security scan found critical vulnerabilities"
    fi
    
    # Run dependency vulnerability scan
    kubectl run dependency-scan --image=owasp/zap2docker-stable --rm -i --restart=Never -n $NAMESPACE -- \
        zap-baseline.py -t http://sportbeacon-api
    
    log "Security scan completed"
}

# Notifications
send_notifications() {
    log "Sending deployment notifications..."
    
    # Send Slack notification
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            'text': '🚀 SportBeaconAI Production Deployment Successful!',
            'attachments': [{
                'fields': [
                    {'title': 'Version', 'value': '$VERSION', 'short': true},
                    {'title': 'Environment', 'value': '$ENVIRONMENT', 'short': true},
                    {'title': 'Deployment Time', 'value': '$(date)', 'short': true},
                    {'title': 'Status', 'value': '✅ Success', 'short': true}
                ]
            }]
        }" \
        $SLACK_WEBHOOK_URL
    
    # Send email notification
    echo "SportBeaconAI Production Deployment Successful" | \
        mail -s "Deployment Notification" \
        -r "deployments@sportbeacon.ai" \
        $ADMIN_EMAIL
    
    log "Notifications sent"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Get previous version
    PREVIOUS_VERSION=$(kubectl get deployment sportbeacon-api -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d':' -f2)
    
    if [ -n "$PREVIOUS_VERSION" ]; then
        log "Rolling back to version: $PREVIOUS_VERSION"
        
        # Rollback deployments
        kubectl rollout undo deployment/sportbeacon-api -n $NAMESPACE
        kubectl rollout undo deployment/sportbeacon-frontend -n $NAMESPACE
        
        # Wait for rollback to complete
        kubectl rollout status deployment/sportbeacon-api -n $NAMESPACE
        kubectl rollout status deployment/sportbeacon-frontend -n $NAMESPACE
        
        # Run health checks after rollback
        run_health_checks
        
        # Send rollback notification
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                'text': '⚠️ SportBeaconAI Production Rollback Completed',
                'attachments': [{
                    'fields': [
                        {'title': 'Rollback Version', 'value': '$PREVIOUS_VERSION', 'short': true},
                        {'title': 'Failed Version', 'value': '$VERSION', 'short': true},
                        {'title': 'Rollback Time', 'value': '$(date)', 'short': true}
                    ]
                }]
            }" \
            $SLACK_WEBHOOK_URL
        
        log "Rollback completed successfully"
    else
        error "No previous version found for rollback"
    fi
}

# Main deployment function
main() {
    log "Starting SportBeaconAI production deployment..."
    log "Version: $VERSION"
    log "Environment: $ENVIRONMENT"
    log "Cluster: $CLUSTER_NAME"
    log "Namespace: $NAMESPACE"
    
    # Set trap for rollback on error
    trap rollback ERR
    
    # Execute deployment steps
    pre_deployment_checks
    backup_current_deployment
    build_and_push_images
    deploy_to_kubernetes
    run_health_checks
    update_dns_and_cdn
    setup_monitoring
    run_performance_tests
    run_security_scan
    send_notifications
    
    log "Production deployment completed successfully!"
    log "Version $VERSION is now live at https://sportbeacon.ai"
    
    # Remove error trap
    trap - ERR
}

# Check if script is run with correct arguments
if [ "$1" != "--confirm-production" ]; then
    error "This script deploys to PRODUCTION. Use --confirm-production to proceed."
fi

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
else
    error "Production environment file .env.production not found"
fi

# Validate required environment variables
required_vars=("CLOUDFRONT_DISTRIBUTION_ID" "SLACK_WEBHOOK_URL" "ADMIN_EMAIL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

# Run main deployment
main 