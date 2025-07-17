import { UserRole } from '../../src/types/user';

// Test data for different user roles
const testUsers = {
  Athlete: {
    email: 'athlete@test.com',
    password: 'testpass123',
    role: 'Athlete' as UserRole
  },
  Coach: {
    email: 'coach@test.com',
    password: 'testpass123',
    role: 'Coach' as UserRole
  },
  Scout: {
    email: 'scout@test.com',
    password: 'testpass123',
    role: 'Scout' as UserRole
  },
  Referee: {
    email: 'referee@test.com',
    password: 'testpass123',
    role: 'Referee' as UserRole
  },
  Trainer: {
    email: 'trainer@test.com',
    password: 'testpass123',
    role: 'Trainer' as UserRole
  },
  Admin: {
    email: 'admin@test.com',
    password: 'testpass123',
    role: 'Admin' as UserRole
  },
  TownStaff: {
    email: 'townstaff@cary.gov',
    password: 'testpass123',
    role: 'TownStaff' as UserRole
  }
};

describe('Smoke Tests - Critical Workflows', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/auth/me', { fixture: 'auth/user.json' }).as('getUser');
    cy.intercept('POST', '/api/auth/login', { fixture: 'auth/login-success.json' }).as('login');
    cy.intercept('GET', '/api/dashboard/*', { fixture: 'dashboard/data.json' }).as('getDashboard');
  });

  describe('Authentication Workflows', () => {
    Object.entries(testUsers).forEach(([role, user]) => {
      it(`${role} - Login workflow`, () => {
        cy.visit('/login');
        cy.get('[data-testid="email-input"]').type(user.email);
        cy.get('[data-testid="password-input"]').type(user.password);
        cy.get('[data-testid="login-button"]').click();
        
        cy.wait('@login');
        cy.wait('@getUser');
        
        // Verify redirect to role-specific dashboard
        cy.url().should('include', `/${user.role.toLowerCase()}`);
        cy.get('[data-testid="user-role"]').should('contain', role);
      });

      it(`${role} - Logout workflow`, () => {
        cy.login(user.email, user.password);
        cy.get('[data-testid="user-menu"]').click();
        cy.get('[data-testid="logout-button"]').click();
        
        // Verify redirect to login page
        cy.url().should('include', '/login');
        cy.get('[data-testid="login-form"]').should('be.visible');
      });
    });
  });

  describe('Dashboard Access Workflows', () => {
    Object.entries(testUsers).forEach(([role, user]) => {
      it(`${role} - View dashboard`, () => {
        cy.login(user.email, user.password);
        cy.visit(`/${user.role.toLowerCase()}`);
        
        cy.wait('@getDashboard');
        
        // Verify dashboard loads with role-specific content
        cy.get('[data-testid="dashboard-header"]').should('be.visible');
        cy.get('[data-testid="dashboard-content"]').should('be.visible');
        
        // Verify role-specific widgets are present
        if (role === 'Athlete') {
          cy.get('[data-testid="workout-summary"]').should('be.visible');
          cy.get('[data-testid="progress-chart"]').should('be.visible');
        } else if (role === 'Coach') {
          cy.get('[data-testid="team-overview"]').should('be.visible');
          cy.get('[data-testid="practice-schedule"]').should('be.visible');
        } else if (role === 'Scout') {
          cy.get('[data-testid="evaluation-queue"]').should('be.visible');
          cy.get('[data-testid="player-reports"]').should('be.visible');
        }
      });
    });
  });

  describe('Feature-Specific Workflows', () => {
    describe('Athlete Workflows', () => {
      beforeEach(() => {
        cy.login(testUsers.Athlete.email, testUsers.Athlete.password);
      });

      it('Submit drill', () => {
        cy.visit('/athlete/drills');
        cy.get('[data-testid="new-drill-button"]').click();
        
        // Fill drill form
        cy.get('[data-testid="drill-name"]').type('Test Drill');
        cy.get('[data-testid="drill-description"]').type('Test drill description');
        cy.get('[data-testid="drill-category"]').select('Strength');
        cy.get('[data-testid="drill-difficulty"]').select('Intermediate');
        
        cy.get('[data-testid="submit-drill"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Drill submitted successfully');
      });

      it('Post highlight', () => {
        cy.visit('/athlete/highlights');
        cy.get('[data-testid="new-highlight-button"]').click();
        
        // Upload video file
        cy.fixture('videos/test-highlight.mp4').then(fileContent => {
          cy.get('[data-testid="video-upload"]').attachFile({
            fileContent,
            fileName: 'test-highlight.mp4',
            mimeType: 'video/mp4'
          });
        });
        
        cy.get('[data-testid="highlight-title"]').type('Amazing Goal!');
        cy.get('[data-testid="highlight-description"]').type('Incredible goal from 30 yards out');
        cy.get('[data-testid="submit-highlight"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Highlight posted successfully');
      });

      it('View map', () => {
        cy.visit('/athlete/map');
        
        // Verify map loads
        cy.get('[data-testid="map-container"]').should('be.visible');
        cy.get('[data-testid="venue-markers"]').should('have.length.greaterThan', 0);
        
        // Test venue selection
        cy.get('[data-testid="venue-card"]').first().click();
        cy.get('[data-testid="venue-details"]').should('be.visible');
      });
    });

    describe('Coach Workflows', () => {
      beforeEach(() => {
        cy.login(testUsers.Coach.email, testUsers.Coach.password);
      });

      it('Submit drill', () => {
        cy.visit('/coach/drills');
        cy.get('[data-testid="new-drill-button"]').click();
        
        // Fill coach drill form
        cy.get('[data-testid="drill-name"]').type('Team Passing Drill');
        cy.get('[data-testid="drill-description"]').type('Improve team passing accuracy');
        cy.get('[data-testid="drill-category"]').select('Skills');
        cy.get('[data-testid="drill-difficulty"]').select('Advanced');
        cy.get('[data-testid="drill-duration"]').type('45');
        
        cy.get('[data-testid="submit-drill"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Drill created successfully');
      });

      it('View team analytics', () => {
        cy.visit('/coach/analytics');
        
        // Verify analytics dashboard
        cy.get('[data-testid="team-stats"]').should('be.visible');
        cy.get('[data-testid="player-performance"]').should('be.visible');
        cy.get('[data-testid="practice-attendance"]').should('be.visible');
      });
    });

    describe('Scout Workflows', () => {
      beforeEach(() => {
        cy.login(testUsers.Scout.email, testUsers.Scout.password);
      });

      it('Submit tip', () => {
        cy.visit('/scout/tips');
        cy.get('[data-testid="new-tip-button"]').click();
        
        // Fill tip form
        cy.get('[data-testid="tip-title"]').type('Promising Young Player');
        cy.get('[data-testid="tip-description"]').type('Excellent technical skills and game awareness');
        cy.get('[data-testid="player-name"]').type('John Smith');
        cy.get('[data-testid="player-age"]').type('16');
        cy.get('[data-testid="player-position"]').select('Midfielder');
        
        cy.get('[data-testid="submit-tip"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Tip submitted successfully');
      });

      it('Review evaluation queue', () => {
        cy.visit('/scout/evaluations');
        
        // Verify evaluation queue
        cy.get('[data-testid="evaluation-list"]').should('be.visible');
        cy.get('[data-testid="evaluation-item"]').should('have.length.greaterThan', 0);
        
        // Test evaluation review
        cy.get('[data-testid="evaluation-item"]').first().click();
        cy.get('[data-testid="evaluation-details"]').should('be.visible');
      });
    });

    describe('Referee Workflows', () => {
      beforeEach(() => {
        cy.login(testUsers.Referee.email, testUsers.Referee.password);
      });

      it('Submit feedback', () => {
        cy.visit('/referee/feedback');
        cy.get('[data-testid="new-feedback-button"]').click();
        
        // Fill feedback form
        cy.get('[data-testid="match-id"]').type('MATCH-001');
        cy.get('[data-testid="team-a"]').type('Team Alpha');
        cy.get('[data-testid="team-b"]').type('Team Beta');
        cy.get('[data-testid="feedback-text"]').type('Both teams showed excellent sportsmanship');
        cy.get('[data-testid="rating"]').select('5');
        
        cy.get('[data-testid="submit-feedback"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Feedback submitted successfully');
      });
    });

    describe('Trainer Workflows', () => {
      beforeEach(() => {
        cy.login(testUsers.Trainer.email, testUsers.Trainer.password);
      });

      it('Create workout plan', () => {
        cy.visit('/trainer/workouts');
        cy.get('[data-testid="new-workout-button"]').click();
        
        // Fill workout form
        cy.get('[data-testid="workout-name"]').type('Strength Training');
        cy.get('[data-testid="workout-description"]').type('Upper body strength focus');
        cy.get('[data-testid="workout-duration"]').type('60');
        cy.get('[data-testid="workout-difficulty"]').select('Intermediate');
        
        cy.get('[data-testid="submit-workout"]').click();
        
        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Workout plan created successfully');
      });
    });
  });

  describe('Admin Workflows', () => {
    beforeEach(() => {
      cy.login(testUsers.Admin.email, testUsers.Admin.password);
    });

    it('Access admin routes', () => {
      cy.visit('/admin');
      
      // Verify admin dashboard
      cy.get('[data-testid="admin-dashboard"]').should('be.visible');
      cy.get('[data-testid="admin-nav"]').should('be.visible');
      
      // Test admin navigation
      cy.get('[data-testid="admin-nav"]').contains('Users').click();
      cy.url().should('include', '/admin/users');
      
      cy.get('[data-testid="admin-nav"]').contains('Analytics').click();
      cy.url().should('include', '/admin/analytics');
    });

    it('Review payout', () => {
      cy.visit('/admin/payouts');
      
      // Verify payout management
      cy.get('[data-testid="payout-list"]').should('be.visible');
      cy.get('[data-testid="payout-item"]').should('have.length.greaterThan', 0);
      
      // Test payout review
      cy.get('[data-testid="payout-item"]').first().click();
      cy.get('[data-testid="payout-details"]').should('be.visible');
      cy.get('[data-testid="approve-payout"]').should('be.visible');
    });

    it('Manage users', () => {
      cy.visit('/admin/users');
      
      // Verify user management
      cy.get('[data-testid="user-list"]').should('be.visible');
      cy.get('[data-testid="user-item"]').should('have.length.greaterThan', 0);
      
      // Test user actions
      cy.get('[data-testid="user-item"]').first().within(() => {
        cy.get('[data-testid="edit-user"]').click();
      });
      cy.get('[data-testid="user-edit-form"]').should('be.visible');
    });
  });

  describe('Town Staff Workflows', () => {
    beforeEach(() => {
      cy.login(testUsers.TownStaff.email, testUsers.TownStaff.password);
    });

    it('Access Town Rec admin', () => {
      cy.visit('/admin/rec-admin');
      
      // Verify Town Rec dashboard
      cy.get('[data-testid="rec-admin-hub"]').should('be.visible');
      cy.get('[data-testid="waitlists-tab"]').should('be.visible');
      cy.get('[data-testid="overrides-tab"]').should('be.visible');
      cy.get('[data-testid="siblings-tab"]').should('be.visible');
    });

    it('Manage waitlists', () => {
      cy.visit('/admin/rec-admin');
      cy.get('[data-testid="waitlists-tab"]').click();
      
      // Verify waitlist management
      cy.get('[data-testid="waitlist-table"]').should('be.visible');
      cy.get('[data-testid="waitlist-entry"]').should('have.length.greaterThan', 0);
      
      // Test waitlist promotion
      cy.get('[data-testid="promote-button"]').first().click();
      cy.get('[data-testid="promotion-confirmation"]').should('be.visible');
    });

    it('Process age overrides', () => {
      cy.visit('/admin/rec-admin');
      cy.get('[data-testid="overrides-tab"]').click();
      
      // Verify override management
      cy.get('[data-testid="override-list"]').should('be.visible');
      cy.get('[data-testid="override-item"]').should('have.length.greaterThan', 0);
      
      // Test override approval
      cy.get('[data-testid="approve-override"]').first().click();
      cy.get('[data-testid="approval-confirmation"]').should('be.visible');
    });

    it('Access audit panel', () => {
      cy.visit('/admin/rec-audit');
      
      // Verify audit panel
      cy.get('[data-testid="audit-panel"]').should('be.visible');
      cy.get('[data-testid="audit-filters"]').should('be.visible');
      cy.get('[data-testid="audit-table"]').should('be.visible');
    });
  });

  describe('Creator Dashboard Workflows', () => {
    beforeEach(() => {
      cy.login(testUsers.Athlete.email, testUsers.Athlete.password);
    });

    it('View earnings', () => {
      cy.visit('/creator/earnings');
      
      // Verify earnings dashboard
      cy.get('[data-testid="earnings-summary"]').should('be.visible');
      cy.get('[data-testid="earnings-chart"]').should('be.visible');
      cy.get('[data-testid="transaction-history"]').should('be.visible');
    });

    it('View tips', () => {
      cy.visit('/creator/tips');
      
      // Verify tips dashboard
      cy.get('[data-testid="tips-summary"]').should('be.visible');
      cy.get('[data-testid="tips-list"]').should('be.visible');
      cy.get('[data-testid="tip-item"]').should('have.length.greaterThan', 0);
    });

    it('Setup payout', () => {
      cy.visit('/creator/payout-setup');
      
      // Verify payout setup
      cy.get('[data-testid="payout-setup-form"]').should('be.visible');
      cy.get('[data-testid="stripe-connect"]').should('be.visible');
      
      // Test Stripe connection
      cy.get('[data-testid="connect-stripe"]').click();
      cy.get('[data-testid="stripe-oauth"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('Handles network errors gracefully', () => {
      cy.intercept('GET', '/api/dashboard/*', { forceNetworkError: true }).as('dashboardError');
      
      cy.login(testUsers.Athlete.email, testUsers.Athlete.password);
      cy.visit('/athlete');
      
      cy.wait('@dashboardError');
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('Handles authentication errors', () => {
      cy.intercept('POST', '/api/auth/login', { statusCode: 401 }).as('loginError');
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('invalid@test.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@loginError');
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
    });

    it('Handles permission errors', () => {
      cy.login(testUsers.Athlete.email, testUsers.Athlete.password);
      cy.visit('/admin'); // Athlete shouldn't have admin access
      
      cy.get('[data-testid="access-denied"]').should('be.visible');
      cy.get('[data-testid="redirect-button"]').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('Dashboard loads within acceptable time', () => {
      cy.login(testUsers.Athlete.email, testUsers.Athlete.password);
      
      const startTime = Date.now();
      cy.visit('/athlete');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds
    });

    it('Large data sets render efficiently', () => {
      cy.intercept('GET', '/api/scout/evaluations', { fixture: 'scout/large-evaluation-list.json' }).as('largeData');
      
      cy.login(testUsers.Scout.email, testUsers.Scout.password);
      cy.visit('/scout/evaluations');
      
      cy.wait('@largeData');
      cy.get('[data-testid="evaluation-item"]').should('have.length', 100);
      
      // Verify virtual scrolling or pagination is working
      cy.get('[data-testid="pagination"]').should('be.visible');
    });
  });
}); 