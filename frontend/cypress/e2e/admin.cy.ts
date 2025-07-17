describe('SportBeacon Admin Suite', () => {
  beforeEach(() => {
    // Visit admin login page
    cy.visit('/admin/login');
  });

  describe('Admin Authentication', () => {
    it('should display login page with demo accounts', () => {
      cy.get('h2').should('contain', 'SportBeacon Admin');
      cy.get('button').should('contain', 'Super Administrator');
      cy.get('button').should('contain', 'League Administrator');
      cy.get('button').should('contain', 'Town Administrator');
    });

    it('should login with super admin credentials', () => {
      cy.get('button').contains('Super Administrator').click();
      cy.url().should('include', '/admin/dashboard');
      cy.get('h1').should('contain', 'Town-Rec Admin Dashboard');
    });

    it('should login with league admin credentials', () => {
      cy.get('button').contains('League Administrator').click();
      cy.url().should('include', '/admin/dashboard');
      cy.get('h1').should('contain', 'Town-Rec Admin Dashboard');
    });

    it('should show access denied for unauthorized routes', () => {
      cy.get('button').contains('Finance Administrator').click();
      cy.visit('/admin/player-reviews');
      cy.get('h2').should('contain', 'Access Denied');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
    });

    it('should display dashboard with statistics', () => {
      cy.get('[data-testid="total-players"]').should('be.visible');
      cy.get('[data-testid="pending-actions"]').should('be.visible');
      cy.get('[data-testid="completed-today"]').should('be.visible');
      cy.get('[data-testid="alerts"]').should('be.visible');
    });

    it('should display admin panel cards', () => {
      cy.get('a[href="/admin/player-reviews"]').should('be.visible');
      cy.get('a[href="/admin/waitlist"]').should('be.visible');
      cy.get('a[href="/admin/siblings"]').should('be.visible');
      cy.get('a[href="/admin/age-exceptions"]').should('be.visible');
      cy.get('a[href="/admin/reports"]').should('be.visible');
      cy.get('a[href="/admin/referee-scheduler"]').should('be.visible');
      cy.get('a[href="/admin/league-dashboard"]').should('be.visible');
      cy.get('a[href="/admin/payments"]').should('be.visible');
    });

    it('should navigate to admin panels', () => {
      cy.get('a[href="/admin/player-reviews"]').click();
      cy.url().should('include', '/admin/player-reviews');
      cy.get('h1').should('contain', 'Player Registration Review');
    });
  });

  describe('Player Registration Review Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/player-reviews');
    });

    it('should load player registrations', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should filter registrations by status', () => {
      cy.get('select[id="status-filter"]').select('pending');
      cy.get('tbody tr').should('be.visible');
    });

    it('should approve a registration', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Approve').click();
      });
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-green-50').should('contain', 'Registration approved');
    });

    it('should reject a registration', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Reject').click();
      });
      cy.get('textarea').type('Test rejection reason');
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-red-50').should('contain', 'Registration rejected');
    });

    it('should view registration details', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Details').click();
      });
      cy.get('h3').should('contain', 'Registration Details');
    });
  });

  describe('Waitlist Manager Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/waitlist');
    });

    it('should load waitlist entries', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should select league and display waitlist', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('tbody tr').should('be.visible');
    });

    it('should assign player from waitlist', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('tbody tr').first().within(() => {
        cy.get('select').select('Red Dragons');
        cy.get('button').contains('Assign').click();
      });
      cy.get('.bg-green-50').should('contain', 'Player assigned');
    });

    it('should auto-fill teams', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('button').contains('Auto-Fill Teams').click();
      cy.get('.bg-green-50').should('contain', 'Teams auto-filled');
    });
  });

  describe('Sibling Team Placement Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/siblings');
    });

    it('should load sibling groups', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('h3').should('contain', 'Sibling Groups');
    });

    it('should display sibling group details', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('button').contains('View Roster').first().click();
      cy.get('h4').should('contain', 'Roster');
    });

    it('should generate AI suggestions', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('button').contains('Generate AI Suggestions').click();
      cy.get('.bg-blue-100').should('contain', 'AI Suggestions');
    });
  });

  describe('Age Exception Requests Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/age-exceptions');
    });

    it('should load age exceptions', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should approve age exception', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Approve').click();
      });
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-green-50').should('contain', 'Exception approved');
    });

    it('should reject age exception', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Reject').click();
      });
      cy.get('textarea').type('Test rejection reason');
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-red-50').should('contain', 'Exception rejected');
    });
  });

  describe('Incident & Score Reports Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/reports');
    });

    it('should display incident reports tab', () => {
      cy.get('button').contains('Incident Reports').should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should switch to score reports tab', () => {
      cy.get('button').contains('Score Reports').click();
      cy.get('table').should('be.visible');
    });

    it('should resolve incident', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Resolve').click();
      });
      cy.get('input[placeholder="Enter resolution"]').type('Test resolution');
      cy.get('select').select('low');
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-green-50').should('contain', 'Incident resolved');
    });

    it('should update score', () => {
      cy.get('button').contains('Score Reports').click();
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Update').click();
      });
      cy.get('input[placeholder="Enter home score"]').type('3');
      cy.get('input[placeholder="Enter away score"]').type('2');
      cy.get('button').contains('Confirm').click();
      cy.get('.bg-green-50').should('contain', 'Score updated');
    });
  });

  describe('Referee Scheduler Dashboard', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/referee-scheduler');
    });

    it('should load referee scheduler', () => {
      cy.get('h1').should('contain', 'Referee Scheduler');
      cy.get('table').should('be.visible');
    });

    it('should select league and display games', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('table').should('be.visible');
    });

    it('should auto-assign referees', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('button').contains('Auto-Assign Referees').click();
      cy.get('.bg-green-50').should('contain', 'Referees auto-assigned');
    });
  });

  describe('League Overview Dashboard', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/league-dashboard');
    });

    it('should load league overview', () => {
      cy.get('h1').should('contain', 'League Overview Dashboard');
    });

    it('should select league and display overview', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('h2').should('contain', 'Spring Soccer League');
    });

    it('should switch between tabs', () => {
      cy.get('select[id="league-select"]').select('Spring Soccer League');
      cy.get('button').contains('Teams & Rosters').click();
      cy.get('h3').should('contain', 'Teams & Rosters');
      
      cy.get('button').contains('Schedule').click();
      cy.get('table').should('be.visible');
      
      cy.get('button').contains('Statistics').click();
      cy.get('h3').should('contain', 'Team Standings');
    });
  });

  describe('Payments & Refunds Panel', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/payments');
    });

    it('should load payments', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should search payments', () => {
      cy.get('input[placeholder*="Payment ID"]').type('pay-1');
      cy.get('button').contains('Search').click();
      cy.get('tbody tr').should('be.visible');
    });

    it('should process refund', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Refund').click();
      });
      cy.get('input[placeholder="Enter refund amount"]').type('50');
      cy.get('textarea').type('Test refund reason');
      cy.get('button').contains('Process Refund').click();
      cy.get('.bg-green-50').should('contain', 'Refund processed');
    });

    it('should export payment data', () => {
      cy.get('button').contains('Export Data').click();
      cy.get('.bg-green-50').should('contain', 'Data exported');
    });
  });

  describe('Admin Sidebar Navigation', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
    });

    it('should navigate via sidebar', () => {
      cy.get('nav').within(() => {
        cy.get('a[href="/admin/player-reviews"]').click();
      });
      cy.url().should('include', '/admin/player-reviews');
      
      cy.get('nav').within(() => {
        cy.get('a[href="/admin/waitlist"]').click();
      });
      cy.url().should('include', '/admin/waitlist');
    });

    it('should collapse and expand sidebar', () => {
      cy.get('button[aria-label="Toggle sidebar"]').click();
      cy.get('nav').should('have.class', 'collapsed');
      
      cy.get('button[aria-label="Toggle sidebar"]').click();
      cy.get('nav').should('not.have.class', 'collapsed');
    });

    it('should logout via sidebar', () => {
      cy.get('nav').within(() => {
        cy.get('a[href="/admin/logout"]').click();
      });
      cy.url().should('include', '/admin/login');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-6');
      cy.get('h1').should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('h1').should('be.visible');
      cy.get('table').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/admin/**', { forceNetworkError: true });
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/player-reviews');
      cy.get('.bg-red-50').should('contain', 'Error');
    });

    it('should handle 404 errors', () => {
      cy.get('button').contains('Super Administrator').click();
      cy.visit('/admin/nonexistent');
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.get('button').contains('Super Administrator').click();
    });

    it('should have proper ARIA labels', () => {
      cy.get('button').should('have.attr', 'aria-label');
      cy.get('input').should('have.attr', 'aria-label');
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should have proper color contrast', () => {
      cy.get('body').should('have.css', 'color');
      cy.get('body').should('have.css', 'background-color');
    });
  });
}); 