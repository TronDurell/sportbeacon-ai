# SportBeaconAI Town-Rec Automation Suite

A comprehensive admin panel system for municipal Parks & Rec departments managing youth sports leagues. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Admin Panels
- **Player Registration Review** - AI-powered flagging and approval workflow
- **Waitlist Manager** - Smart roster gap filling and player assignment
- **Sibling Team Placement** - Group siblings with AI suggestions
- **Age Exception Requests** - 1-click approval with validation
- **Incident & Score Reports** - Review and resolve incidents/scores
- **Referee Scheduler** - Weekly calendar with skill-based matching
- **League Overview Dashboard** - Comprehensive league management
- **Payments & Refunds** - Stripe integration with refund processing

### Security & Access Control
- **Role-Based Access Control (RBAC)** - 5 admin roles with granular permissions
- **Secure Authentication** - Session management with localStorage
- **Protected Routes** - Automatic redirect for unauthorized access
- **Permission-Based UI** - Dynamic sidebar and component visibility

### Development Features
- **Mock Data Generation** - Faker.js powered realistic test data
- **Mock API Endpoints** - Full CRUD operations with simulated delays
- **Cypress E2E Tests** - Comprehensive test coverage
- **Responsive Design** - Mobile-first Tailwind CSS implementation
- **TypeScript** - Full type safety and IntelliSense support

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser with ES6+ support

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd sportbeacon-ai/frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run E2E tests
npm run cypress:open
```

## 🔐 Authentication

### Demo Accounts
The system includes 5 demo accounts for testing different permission levels:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Super Administrator | `superadmin@sportbeacon.ai` | `admin123` | All permissions |
| League Administrator | `leagueadmin@sportbeacon.ai` | `admin123` | League management |
| Town Administrator | `townadmin@sportbeacon.ai` | `admin123` | Town-level access |
| Referee Coordinator | `referee@sportbeacon.ai` | `admin123` | Referee management |
| Finance Administrator | `finance@sportbeacon.ai` | `admin123` | Payment processing |

### Permission Matrix

| Permission | Super Admin | League Admin | Town Admin | Referee Coord | Finance Admin |
|------------|-------------|--------------|------------|---------------|---------------|
| View Players | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve Registrations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Waitlist | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Siblings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Age Exceptions | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Incidents | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Scores | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Payments | ✅ | ✅ | ✅ | ❌ | ✅ |
| Process Refunds | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Referees | ✅ | ✅ | ❌ | ✅ | ❌ |
| View League Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |

## 📁 Project Structure

```
frontend/
├── components/
│   └── admin/                    # Admin panel components
│       ├── AdminDashboard.tsx    # Main dashboard
│       ├── AdminLayout.tsx       # Layout wrapper
│       ├── AdminLogin.tsx        # Login component
│       ├── AdminSidebar.tsx      # Navigation sidebar
│       ├── PlayerRegistrationReviewPanel.tsx
│       ├── WaitlistManager.tsx
│       ├── SiblingTeamPlacementPanel.tsx
│       ├── AgeExceptionRequestsPanel.tsx
│       ├── IncidentScoreReportingPanel.tsx
│       ├── RefereeSchedulerDashboard.tsx
│       ├── LeagueOverviewDashboard.tsx
│       └── PaymentRefundPanel.tsx
├── contexts/
│   └── AdminAuthContext.tsx      # Authentication & RBAC
├── hooks/
│   └── useTownRecAdmin.ts        # Admin data hooks
├── mocks/
│   └── admin/                    # Mock data & API
│       ├── mockData.ts           # Faker.js data generation
│       └── mockAPI.ts            # Simulated API endpoints
├── routes/
│   └── AdminRoutes.tsx           # Route configuration
├── cypress/
│   └── e2e/
│       └── admin.cy.ts           # E2E test suite
└── types/
    └── townRecTypes.ts           # TypeScript definitions
```

## 🎯 Usage

### Starting the Application
1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/admin/login`
3. Use any demo account to log in
4. Explore different admin panels based on your role

### Key Features by Panel

#### Player Registration Review
- Filter by status (pending, approved, rejected)
- AI-flagged registrations highlighted
- Bulk approval/rejection
- Detailed registration review modal

#### Waitlist Manager
- League-specific waitlist filtering
- Drag-and-drop roster gap filling
- Auto-fill teams with smart matching
- Player assignment with team selection

#### Sibling Team Placement
- Automatic sibling group detection
- AI-powered team suggestions
- Manual override capabilities
- Roster gap visualization

#### Age Exception Requests
- Age cutoff validation
- Coach override handling
- 1-click approval workflow
- Reason tracking and notes

#### Incident & Score Reports
- Tabbed interface for incidents and scores
- Resolution workflow with severity levels
- Comment system for tracking
- Score dispute resolution

#### Referee Scheduler
- Weekly calendar view
- Skill-based referee matching
- Auto-assignment algorithms
- Availability management

#### League Overview Dashboard
- Multi-tab interface (Teams, Schedule, Statistics)
- Roster viewer with drill-down
- Coach and player management
- League statistics and standings

#### Payments & Refunds
- Stripe ledger integration
- Payment search by ID
- Refund processing workflow
- Data export capabilities

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# Open Cypress UI
npm run cypress:open

# Run headless tests
npm run cypress:run

# Run with dev server
npm run test:e2e
```

### Test Coverage
- Authentication flows
- RBAC permission testing
- Panel navigation and interactions
- Form submissions and validations
- Responsive design testing
- Error handling scenarios

## 🎨 Styling

The application uses **Tailwind CSS** for styling with:
- Responsive design patterns
- Dark mode support (planned)
- Accessibility-focused components
- Consistent design system
- Mobile-first approach

### Key Design Principles
- Clean, modern interface
- Intuitive navigation
- Clear visual hierarchy
- Consistent spacing and typography
- Accessible color contrast

## 🔧 Development

### Adding New Admin Panels
1. Create component in `components/admin/`
2. Add route in `routes/AdminRoutes.tsx`
3. Add navigation item in `AdminSidebar.tsx`
4. Create mock data in `mocks/admin/mockData.ts`
5. Add API endpoints in `mocks/admin/mockAPI.ts`
6. Update types in `types/townRecTypes.ts`
7. Add Cypress tests in `cypress/e2e/admin.cy.ts`

### Mock Data Management
The system uses Faker.js for generating realistic test data:
- Consistent data across sessions
- Configurable data volumes
- Realistic relationships between entities
- Easy to extend for new features

### API Integration
When ready for production:
1. Replace mock API calls with real endpoints
2. Update authentication to use real auth service
3. Implement proper error handling
4. Add loading states and optimistic updates
5. Configure environment variables

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create `.env` file for production configuration:
```env
REACT_APP_API_URL=https://api.sportbeacon.ai
REACT_APP_AUTH_DOMAIN=your-auth-domain
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-key
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] API endpoints updated
- [ ] Authentication service connected
- [ ] Error monitoring configured
- [ ] Performance monitoring enabled
- [ ] SSL certificates installed
- [ ] CDN configured for static assets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits
- Comprehensive testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**SportBeaconAI Town-Rec Automation Suite** - Modernizing municipal sports management with AI-powered automation. 