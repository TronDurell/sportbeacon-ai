# SportBeacon AI Deployment Guide

This guide covers deployment options for the SportBeacon AI application, including both frontend and backend components.

## Architecture Overview

- **Frontend**: React SPA with Vite build system
- **Backend**: FastAPI Python application
- **Database**: No persistent database required (in-memory for demo)
- **Containerization**: Docker with docker-compose orchestration

## Deployment Options

### 1. Serverless Frontend + Containerized Backend

#### Frontend (Vercel/Netlify)

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

**Netlify Deployment:**
```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Netlify (drag and drop dist folder)
# Or use Netlify CLI
netlify deploy --prod --dir=dist
```

#### Backend (Render/Railway/Fly.io)

**Render Deployment:**
1. Connect GitHub repository
2. Select backend directory as root
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `FRONTEND_ORIGIN`: Your frontend URL
   - `UVICORN_HOST`: 0.0.0.0
   - `UVICORN_PORT`: $PORT

**Railway Deployment:**
1. Connect GitHub repository
2. Select backend directory
3. Railway auto-detects Python and installs requirements
4. Set start command: `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Railway dashboard

**Fly.io Deployment:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Create fly.toml
fly launch

# Deploy
fly deploy
```

### 2. Full Container Deployment

#### Docker Compose (Local/Server)

```bash
# Build and run locally
docker-compose up --build

# Access applications
# Frontend: http://localhost:3002
# Backend: http://localhost:8000
# Metrics: http://localhost:8000/metrics
```

#### Kubernetes Deployment

Create Kubernetes manifests:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sportbeacon-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sportbeacon-backend
  template:
    metadata:
      labels:
        app: sportbeacon-backend
    spec:
      containers:
      - name: backend
        image: your-registry/sportbeacon-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: FRONTEND_ORIGIN
          value: "https://your-frontend-domain.com"
```

### 3. Cloud Platform Deployment

#### Google Cloud Run

```bash
# Deploy backend
gcloud run deploy sportbeacon-backend \
  --source backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy sportbeacon-frontend \
  --source frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### AWS ECS

1. Create ECS cluster
2. Create task definitions for frontend and backend
3. Create services with load balancers
4. Configure environment variables

## Environment Variables

### Backend (.env)
```bash
FRONTEND_ORIGIN=http://localhost:3002
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
SENTRY_DSN=your-sentry-dsn
OPENAI_API_KEY=your-openai-key
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend-domain.com
VITE_APP_VERSION=1.0.0
```

## Health Checks

- **Backend**: `GET /health`
- **Frontend**: `GET /health`
- **Metrics**: `GET /metrics` (Prometheus format)

## Monitoring

### Prometheus Metrics
The backend exposes Prometheus metrics at `/metrics` endpoint:
- Request counts and durations
- Error rates
- Custom business metrics

### Logging
- Backend: Structured JSON logging
- Frontend: Console logging with error reporting

## Security Considerations

1. **CORS**: Configure `FRONTEND_ORIGIN` for production
2. **HTTPS**: Always use HTTPS in production
3. **API Keys**: Store sensitive keys in environment variables
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **Input Validation**: All inputs are validated with Pydantic

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `FRONTEND_ORIGIN` environment variable
2. **Port Conflicts**: Ensure ports 8000 and 3002 are available
3. **Build Failures**: Check Node.js and Python versions
4. **Docker Issues**: Ensure Docker and docker-compose are installed

### Debug Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3002/

# View logs
docker-compose logs backend
docker-compose logs frontend

# Check metrics
curl http://localhost:8000/metrics
```

## Performance Optimization

1. **Frontend**: Enable gzip compression in nginx
2. **Backend**: Use multiple workers with uvicorn
3. **Caching**: Implement Redis for session storage
4. **CDN**: Use CDN for static assets

## Backup and Recovery

1. **Configuration**: Version control all configuration files
2. **Environment Variables**: Document all required variables
3. **Docker Images**: Tag and store images in registry
4. **Monitoring**: Set up alerts for critical metrics
