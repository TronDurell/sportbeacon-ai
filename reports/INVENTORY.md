# SportBeaconAI Codebase Inventory

## 📦 Package Structure

### Root Monorepo
- **Name**: sportbeacon-ai
- **Type**: Monorepo with workspaces
- **Node Version**: 18.20.x (required) vs 22.14.0 (current) ❌
- **Package Manager**: npm 10.9.2 ✅

### Workspaces
1. **frontend** - React/Vite PWA application
2. **functions** - Firebase Cloud Functions
3. **packages/mcp-server** - Model Context Protocol server
4. **packages/memory-sdk** - Memory management SDK

## 🏗️ Applications & Entry Points

### Frontend Application
- **Path**: `frontend/`
- **Framework**: React 18.3.1 + Vite 7.1.5
- **Entry Point**: `frontend/src/index.tsx`
- **Main App**: `frontend/src/App.tsx`
- **Build Output**: `frontend/dist/`
- **PWA**: Yes (manifest.json, service worker)

### Firebase Functions
- **Path**: `functions/`
- **Entry Point**: `functions/src/index.ts`
- **Build Output**: `functions/lib/`
- **Runtime**: Node.js 18+ (Firebase Functions v2)

### MCP Server Package
- **Path**: `packages/mcp-server/`
- **Entry Point**: `packages/mcp-server/src/index.ts`
- **Build Output**: `packages/mcp-server/dist/`
- **Purpose**: Model Context Protocol server for AI agents

### Memory SDK Package
- **Path**: `packages/memory-sdk/`
- **Entry Point**: `packages/memory-sdk/src/index.ts`
- **Build Output**: `packages/memory-sdk/dist/`
- **Purpose**: Memory management for AI agents

## 🔥 Firebase Functions Inventory

### Core Functions
- **videoAnalyze** - Video analysis handler
- **getPlayer** - Player data retrieval
- **authLogin** - Authentication handler
- **vitals** - Health monitoring

### Admin Functions
- **adminGetLeagueStats** - League statistics
- **adminUpdateStaffRole** - Staff role management
- **adminGenerateReport** - Report generation
- **adminUpdateConfig** - Configuration updates
- **adminBulkOperation** - Bulk operations
- **adminGetSystemHealth** - System health check
- **resolveDispute** - Dispute resolution
- **verifyStat** - Stat verification

### League Functions
- **createLeague** - League creation
- **updateLeague** - League updates
- **getLeagueOverview** - League overview
- **getLeagueStandings** - League standings
- **getLeagueSchedule** - League schedule
- **generateLeagueSchedule** - Schedule generation
- **getLeagueStatistics** - League statistics

### Voice Functions
- **generateVoiceToken** - Voice authentication
- **revokeVoiceToken** - Token revocation
- **handleVoiceCall** - Call handling
- **callStatusWebhook** - Call status updates
- **getCallHistory** - Call history
- **generateAudio** - Audio generation

### Moderation Functions
- **reportPost** - Content reporting
- **reviewReportedPost** - Content review
- **cleanupExpiredQuarantines** - Cleanup automation

### Stripe Functions
- **checkout** - Payment processing
- **processPayout** - Payout processing
- **webhooks** - Stripe webhook handling

## 🛣️ Frontend Routes & Pages

### Main Routes
- **/** - Health page (default)
- **/insights** - Insights dashboard
- **/drills** - Training drills
- **/matchmaking** - Player matching
- **/winners** - Winners showcase
- **/places/:locationId** - Location profiles

### Admin Routes
- **/admin** - Admin dashboard
- **/admin/rec-audit** - Town Rec audit panel
- **/admin/league-stats** - League statistics
- **/admin/staff-management** - Staff management
- **/admin/reports** - Report generation

### API Routes
- **/api/auth** - Authentication endpoints
- **/api/players** - Player management
- **/api/teams** - Team management
- **/api/leagues** - League management
- **/api/stats** - Statistics endpoints
- **/api/payments** - Payment processing

## 🤖 AI Agents Inventory

### Core Agents
1. **CoachAgent** - Personal training and workout planning
2. **ScoutEval** - Video analysis and player evaluation
3. **TownRecAgent** - Municipal sports management
4. **VenuePredictor** - Smart venue matching
5. **EventNLPBuilder** - Natural language processing
6. **CivicIndexer** - Community engagement tracking

### Agent Implementation
- **Factory**: `agents/core/agentFactory.ts`
- **Base Classes**: `agents/core/BaseAgent.ts`
- **Context**: `frontend/contexts/AgentOrchestrationContext.tsx`
- **UI Components**: `frontend/src/components/agent/`

### Background Agents
- **VerificationAgent** - Automated stat verification
- **ReportingAgent** - Weekly report generation

## 🔧 Scripts & Automation

### Build Scripts
- **npm run build** - Full monorepo build
- **npm run build:frontend** - Frontend build
- **npm run build:functions** - Functions build
- **npm run build:sdk** - Memory SDK build
- **npm run build:mcp** - MCP server build

### Development Scripts
- **npm run dev** - Development mode
- **npm run dev:emulators** - Firebase emulators
- **npm run memory:demo** - Memory SDK demo

### Testing Scripts
- **npm run test** - Jest test suite
- **npm run test:ci** - CI test configuration
- **npm run test:coverage** - Coverage reports
- **npm run test:all** - All workspace tests

### Deployment Scripts
- **npm run deploy** - Firebase deployment
- **npm run deploy:hosting** - Hosting only
- **npm run deploy:functions** - Functions only
- **npm run deploy:agentic** - Agentic features deployment

### Quality Scripts
- **npm run typecheck** - TypeScript checking
- **npm run lint** - ESLint analysis
- **npm run size** - Bundle size analysis
- **npm run audit:fix** - Security audit

## 🌐 Environment Variables

### Firebase Configuration
- **FIREBASE_PROJECT_ID** - Project identifier
- **FIREBASE_AUTH_DOMAIN** - Authentication domain
- **FIREBASE_STORAGE_BUCKET** - Storage bucket
- **FIREBASE_MESSAGING_SENDER_ID** - Messaging sender
- **FIREBASE_APP_ID** - Application ID

### AI Service Keys
- **OPENAI_API_KEY** - OpenAI integration
- **ANTHROPIC_API_KEY** - Anthropic Claude
- **GOOGLE_AI_API_KEY** - Google AI services

### Payment Processing
- **STRIPE_SECRET_KEY** - Stripe secret key
- **STRIPE_PUBLISHABLE_KEY** - Stripe public key
- **STRIPE_WEBHOOK_SECRET** - Webhook verification

### Monitoring & Analytics
- **SENTRY_DSN** - Error monitoring
- **GOOGLE_ANALYTICS_ID** - Analytics tracking
- **MIXPANEL_TOKEN** - Event tracking

## 📊 CI/CD Workflows

### GitHub Actions (if configured)
- **Build & Test** - Automated testing
- **Deploy** - Production deployment
- **Security Scan** - Vulnerability scanning
- **Performance** - Lighthouse CI

### Firebase Deployment
- **Hosting** - Static site deployment
- **Functions** - Cloud functions deployment
- **Firestore Rules** - Database rules deployment
- **Storage Rules** - Storage security rules

## 🗂️ Key Directories

### Source Code
- **frontend/src/** - React application source
- **functions/src/** - Firebase functions source
- **packages/mcp-server/src/** - MCP server source
- **packages/memory-sdk/src/** - Memory SDK source

### Configuration
- **config/** - Application configuration
- **types/** - TypeScript type definitions
- **lib/** - Shared libraries

### Documentation
- **docs/** - Project documentation
- **reports/** - Audit and analysis reports
- **scripts/** - Utility scripts

### Testing
- **__tests__/** - Test files
- **__mocks__/** - Test mocks
- **coverage/** - Test coverage reports

## 🔒 Security Features

### Authentication
- **Firebase Auth** - User authentication
- **JWT Tokens** - API authentication
- **Role-based Access** - RBAC implementation

### Security Middleware
- **withSecurityGuards** - Request validation
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - Request throttling

### Data Validation
- **Zod Schemas** - Runtime validation
- **TypeScript** - Compile-time validation
- **Firestore Rules** - Database security

## 📱 PWA Features

### Manifest
- **Name**: SportBeacon
- **Short Name**: SportBeacon
- **Display**: standalone
- **Icons**: 192x192, 512x512, SVG

### Service Worker
- **Registration**: Automatic in production
- **Caching**: Static asset caching
- **Offline**: Fallback pages

### Shortcuts
- **Home Feed** - Quick access to home
- **Create Post** - Quick post creation

## 🎯 Feature Flags

### Development
- **MEMORY_ENABLED** - Memory SDK toggle
- **AGENT_ENABLED** - AI agent toggle
- **DEBUG_MODE** - Debug logging

### Production
- **FEATURE_ROLLOUT** - Gradual feature rollout
- **A/B_TESTING** - Experimentation
- **MAINTENANCE_MODE** - System maintenance

## 📈 Monitoring & Analytics

### Error Tracking
- **Sentry** - Real-time error monitoring
- **Custom Logging** - Application-specific logs
- **Performance Monitoring** - Web Vitals tracking

### Analytics
- **Google Analytics** - User behavior tracking
- **Mixpanel** - Event tracking
- **Custom Metrics** - Business KPIs

## 🔄 Background Jobs

### Scheduled Functions
- **Weekly Reports** - Automated report generation
- **Data Cleanup** - Maintenance tasks
- **Health Checks** - System monitoring

### Triggers
- **Firestore Triggers** - Database event handling
- **Auth Triggers** - User lifecycle events
- **Storage Triggers** - File processing

## 📋 Next Steps

1. **Environment Setup** - Fix Node version mismatch
2. **Dependency Resolution** - Resolve missing dependencies
3. **Lockfile Generation** - Create package-lock.json
4. **Security Audit** - Run npm audit after lockfile
5. **Build Verification** - Test all build processes
