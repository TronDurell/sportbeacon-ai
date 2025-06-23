# SportBeaconAI Developer Onboarding Checklist

Welcome to the SportBeaconAI team! This checklist will guide you through setting up your development environment and understanding the project structure.

## 🎯 Pre-Onboarding

### Required Skills
- [ ] **JavaScript/TypeScript** - Intermediate level
- [ ] **React** - Component lifecycle, hooks, state management
- [ ] **Python** - Flask, async programming
- [ ] **Git** - Branching, merging, pull requests
- [ ] **SQL** - Basic queries and database design
- [ ] **Web3** - Basic understanding of blockchain concepts

### Recommended Skills
- [ ] **Docker** - Containerization concepts
- [ ] **Redis** - Caching and session management
- [ ] **PostgreSQL** - Advanced queries and optimization
- [ ] **AI/ML** - Basic understanding of LLMs and APIs
- [ ] **Sports Analytics** - Understanding of sports metrics

## 🛠️ Development Environment Setup

### 1. System Requirements
- [ ] **OS**: macOS 12+, Ubuntu 20.04+, or Windows 11+
- [ ] **RAM**: 16GB+ recommended
- [ ] **Storage**: 50GB+ free space
- [ ] **Node.js**: 18.17.0+ (use nvm for version management)
- [ ] **Python**: 3.11+ (use pyenv for version management)
- [ ] **Git**: Latest version
- [ ] **Docker**: Desktop or Engine

### 2. IDE Setup
- [ ] **VS Code** (recommended) or **WebStorm**
- [ ] **Extensions**:
  - [ ] Python
  - [ ] TypeScript and JavaScript
  - [ ] React Developer Tools
  - [ ] GitLens
  - [ ] Docker
  - [ ] Prettier
  - [ ] ESLint
  - [ ] Python Test Explorer

### 3. Version Management
```bash
# Node.js (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18.17.0
nvm use 18.17.0

# Python (pyenv)
curl https://pyenv.run | bash
pyenv install 3.11.0
pyenv global 3.11.0
```

## 📦 Project Setup

### 1. Repository Clone
```bash
# Clone the repository
git clone https://github.com/your-org/sportbeacon-ai.git
cd sportbeacon-ai

# Set up git hooks (if applicable)
git config core.hooksPath .githooks
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt

# Set up pre-commit hooks
pre-commit install
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev @types/node @types/react @types/react-dom

# Set up git hooks
npm run prepare
```

### 4. Database Setup
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
createdb sportbeacon

# Run migrations (if applicable)
cd backend
python manage.py db upgrade
```

### 5. Redis Setup
```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: Use Docker or WSL

# Start Redis
redis-server
```

## 🔑 API Keys & Configuration

### 1. Environment Variables
Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**
```bash
# Flask Configuration
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/sportbeacon

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
OPENAI_API_KEY=sk-your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Web3
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-infura-key
CONTRACT_ADDRESS=0x...

# AWS (if using)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

**Frontend (.env)**
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000

# Firebase
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Web3
REACT_APP_WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-infura-key
REACT_APP_CONTRACT_ADDRESS=0x...

# External Services
REACT_APP_ELEVENLABS_API_KEY=your-elevenlabs-api-key
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

### 2. API Key Setup

#### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account and add billing information
3. Generate API key
4. Add to backend `.env`

#### ElevenLabs
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Create account
3. Generate API key
4. Add to both backend and frontend `.env`

#### Firebase
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Add web app and get configuration
4. Generate service account key
5. Add configuration to respective `.env` files

#### Infura (Web3)
1. Visit [Infura](https://infura.io/)
2. Create account and project
3. Get project ID
4. Add to both backend and frontend `.env`

## 🧪 Testing Setup

### 1. Backend Tests
```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ -v --cov=. --cov-report=html

# Run specific test file
python -m pytest tests/test_coach_api.py -v

# Run tests in watch mode
python -m pytest tests/ -f -v
```

### 2. Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=PlayerDashboard.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### 3. E2E Tests
```bash
cd frontend

# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- tests/e2e/basic.spec.ts
```

## 🚀 Running the Application

### 1. Development Mode
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - Redis
redis-server

# Terminal 4 - Database (if not running as service)
pg_ctl -D /usr/local/var/postgres start
```

### 2. Docker Mode
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Setup
- [ ] Backend API: http://localhost:5000/health
- [ ] Frontend App: http://localhost:3000
- [ ] API Documentation: http://localhost:5000/docs
- [ ] Database connection working
- [ ] Redis connection working

## 📚 Learning Resources

### 1. Project Documentation
- [ ] Read [README.md](README.md)
- [ ] Review [API Documentation](http://localhost:5000/docs)
- [ ] Study [Architecture Overview](docs/architecture.md)
- [ ] Understand [Sport Rules Configuration](frontend/config/sportRules.ts)

### 2. Code Structure
- [ ] Explore backend API structure
- [ ] Understand frontend component hierarchy
- [ ] Review database models
- [ ] Study Web3 integration patterns

### 3. Key Concepts
- [ ] **AI Coaching Engine**: How summaries and insights are generated
- [ ] **Sport Rules System**: How different sports are configured
- [ ] **Social Features**: How highlights and leaderboards work
- [ ] **Web3 Integration**: How tokens and NFTs function
- [ ] **Voice Coaching**: How ElevenLabs integration works

## 🔧 Development Workflow

### 1. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Code Quality
```bash
# Backend
cd backend
black .  # Format code
isort .  # Sort imports
flake8 . # Lint code
mypy .   # Type check

# Frontend
cd frontend
npm run format  # Format code
npm run lint    # Lint code
npm run type-check # Type check
```

### 3. Testing
- [ ] Write unit tests for new features
- [ ] Update existing tests if needed
- [ ] Run full test suite before committing
- [ ] Ensure test coverage doesn't decrease

## 🎯 First Tasks

### 1. Familiarization Tasks
- [ ] **Explore the codebase** - Spend 2-3 hours understanding the structure
- [ ] **Run the application** - Make sure everything works locally
- [ ] **Read existing code** - Pick a feature and understand how it works
- [ ] **Make a small change** - Fix a typo or add a comment

### 2. Beginner-Friendly Issues
- [ ] **Documentation updates** - Improve README or add comments
- [ ] **Test improvements** - Add missing test cases
- [ ] **UI polish** - Small styling improvements
- [ ] **Bug fixes** - Look for "good first issue" labels

### 3. Learning Path
- [ ] **Week 1**: Setup and familiarization
- [ ] **Week 2**: Small contributions and bug fixes
- [ ] **Week 3**: Feature development
- [ ] **Week 4**: Code review and mentoring

## 🆘 Getting Help

### 1. Internal Resources
- [ ] **Team Chat**: Discord/Slack channel
- [ ] **Code Reviews**: Ask for feedback on your PRs
- [ ] **Pair Programming**: Schedule sessions with team members
- [ ] **Documentation**: Check existing docs first

### 2. External Resources
- [ ] **Stack Overflow**: For technical questions
- [ ] **Official Docs**: React, Flask, OpenAI, etc.
- [ ] **Community Forums**: Discord, Reddit, etc.

### 3. Escalation Path
1. Check documentation and existing issues
2. Ask in team chat
3. Schedule 1:1 with mentor
4. Escalate to team lead if needed

## ✅ Completion Checklist

### Environment Setup
- [ ] All development tools installed
- [ ] Project cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database and Redis running
- [ ] Application starts successfully

### Understanding
- [ ] Project architecture understood
- [ ] Key features explored
- [ ] Development workflow practiced
- [ ] Testing procedures learned

### Contribution
- [ ] First PR submitted and merged
- [ ] Code review process experienced
- [ ] Team communication established
- [ ] Development rhythm established

---

**Welcome to the team! 🎉**

If you have any questions or need help with any of these steps, don't hesitate to ask your mentor or the team. We're here to help you succeed! 