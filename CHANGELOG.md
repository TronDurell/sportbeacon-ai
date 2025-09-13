# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-rc] - 2025-01-20

### Added
- **Backend API**: Complete FastAPI backend with health endpoint, CORS, and Prometheus metrics
- **AI Engines**: PlayerInsightEngine, MatchmakingEngine, and DrillRecommendationEngine with real logic
- **Frontend**: React application with Vite, TypeScript, and React Router
- **API Integration**: Typed API client with all backend endpoints
- **Docker Support**: Multi-stage Dockerfiles for both frontend and backend
- **CI/CD**: GitHub Actions workflows for testing and deployment
- **Monitoring**: Prometheus metrics integration and health checks
- **Documentation**: Comprehensive deployment guides and API documentation

### Fixed
- **Model Conflicts**: Resolved PlayerProfile model conflicts between AI engines and backend
- **CORS Issues**: Fixed CORS configuration to use environment variables
- **Type Safety**: Added proper TypeScript types and validation
- **Build Process**: Cleaned up Vite configuration and removed unused dependencies
- **Environment Variables**: Proper environment variable handling for both frontend and backend

### Changed
- **Version Management**: Added backend version tracking and frontend version bump
- **Port Configuration**: Standardized on port 3002 for frontend and 8000 for backend
- **API Structure**: Organized API endpoints with proper error handling
- **Development Setup**: Simplified development environment configuration

### Technical Details
- **Backend**: FastAPI 0.104.1, Python 3.11, Prometheus metrics
- **Frontend**: React 18, Vite 5.4, TypeScript 5.8
- **Docker**: Multi-stage builds with Nginx for frontend
- **CI/CD**: GitHub Actions with Docker image building and testing
