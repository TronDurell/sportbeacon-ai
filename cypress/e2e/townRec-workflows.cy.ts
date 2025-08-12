describe('Town Rec Workflows E2E', () => {
  beforeEach(() => {
    // Setup test data and authentication
    cy.intercept('GET', '/api/auth/me', { fixture: 'auth/parent-user.json' }).as('getAuth');
    cy.intercept('GET', '/api/town-rec/leagues', { fixture: 'townRec/leagues.json' }).as('getLeagues');
    cy.intercept('GET', '/api/town-rec/players/*', { fixture: 'townRec/players.json' }).as('getPlayers');
    
    cy.visit('/town-rec');
    cy.wait('@getAuth');
    cy.wait('@getLeagues');
  });

  describe('Sibling Pairing Workflow', () => {
    it('should complete full sibling pairing workflow from request to approval', () => {
      // Mock API responses for sibling pairing workflow
      cy.intercept('POST', '/api/town-rec/sibling-pairing', {
        statusCode: 200,
        body: { requestId: 'sibling-req-123', status: 'pending' }
      }).as('submitSiblingRequest');

      cy.intercept('GET', '/api/town-rec/sibling-requests/*', {
        statusCode: 200,
        body: { 
          id: 'sibling-req-123',
          status: 'pending',
          parentId: 'parent-123',
          siblingIds: ['player-1', 'player-2'],
          leagueId: 'league-456'
        }
      }).as('getSiblingRequest');

      cy.intercept('PUT', '/api/town-rec/sibling-requests/*/approve', {
        statusCode: 200,
        body: { success: true, message: 'Sibling pairing approved' }
      }).as('approveSiblingRequest');

      // Navigate to sibling pairing form
      cy.get('[data-testid="sibling-pairing-tab"]').click();
      cy.get('[data-testid="new-sibling-request-btn"]').click();

      // Fill out sibling pairing form
      cy.get('[data-testid="league-select"]').click();
      cy.get('[data-testid="league-option-soccer-u10"]').click();

      cy.get('[data-testid="sibling-1-select"]').click();
      cy.get('[data-testid="player-option-player-1"]').click();

      cy.get('[data-testid="sibling-2-select"]').click();
      cy.get('[data-testid="player-option-player-2"]').click();

      cy.get('[data-testid="preference-same-team"]').check();
      cy.get('[data-testid="preference-same-time"]').check();

      cy.get('[data-testid="submit-sibling-request"]').click();

      // Verify request submission
      cy.wait('@submitSiblingRequest');
      cy.get('[data-testid="success-message"]').should('contain', 'Sibling pairing request submitted');

      // Navigate to admin dashboard to approve request
      cy.visit('/admin/town-rec/sibling-requests');
      cy.wait('@getSiblingRequest');

      // Verify request appears in admin dashboard
      cy.get('[data-testid="sibling-request-sibling-req-123"]').should('be.visible');
      cy.get('[data-testid="request-status-pending"]').should('be.visible');

      // Approve the request
      cy.get('[data-testid="approve-request-sibling-req-123"]').click();
      cy.get('[data-testid="approval-reason"]').type('Space available in requested team');
      cy.get('[data-testid="confirm-approval"]').click();

      // Verify approval
      cy.wait('@approveSiblingRequest');
      cy.get('[data-testid="success-message"]').should('contain', 'Sibling pairing approved');
      cy.get('[data-testid="request-status-approved"]').should('be.visible');
    });

    it('should handle sibling pairing request rejection', () => {
      cy.intercept('PUT', '/api/town-rec/sibling-requests/*/reject', {
        statusCode: 200,
        body: { success: true, message: 'Sibling pairing rejected' }
      }).as('rejectSiblingRequest');

      // Navigate to admin dashboard
      cy.visit('/admin/town-rec/sibling-requests');

      // Reject a pending request
      cy.get('[data-testid="reject-request-sibling-req-123"]').click();
      cy.get('[data-testid="rejection-reason"]').type('Insufficient space in requested league');
      cy.get('[data-testid="confirm-rejection"]').click();

      // Verify rejection
      cy.wait('@rejectSiblingRequest');
      cy.get('[data-testid="success-message"]').should('contain', 'Sibling pairing rejected');
      cy.get('[data-testid="request-status-rejected"]').should('be.visible');
    });

    it('should handle age override exception workflow', () => {
      cy.intercept('POST', '/api/town-rec/age-override', {
        statusCode: 200,
        body: { requestId: 'age-override-123', status: 'pending' }
      }).as('submitAgeOverride');

      cy.intercept('PUT', '/api/town-rec/age-override/*/approve', {
        statusCode: 200,
        body: { success: true, message: 'Age override approved' }
      }).as('approveAgeOverride');

      // Navigate to age override form
      cy.get('[data-testid="age-override-tab"]').click();
      cy.get('[data-testid="new-age-override-btn"]').click();

      // Fill out age override form
      cy.get('[data-testid="player-select"]').click();
      cy.get('[data-testid="player-option-player-1"]').click();

      cy.get('[data-testid="league-select"]').click();
      cy.get('[data-testid="league-option-soccer-u12"]').click();

      cy.get('[data-testid="override-reason"]').type('Player has advanced skills and experience for this age group');
      
      // Upload supporting documents
      cy.get('[data-testid="document-upload"]').attachFile('supporting-docs.pdf');

      cy.get('[data-testid="submit-age-override"]').click();

      // Verify request submission
      cy.wait('@submitAgeOverride');
      cy.get('[data-testid="success-message"]').should('contain', 'Age override request submitted');

      // Navigate to admin dashboard to approve
      cy.visit('/admin/town-rec/age-overrides');
      
      // Approve the age override
      cy.get('[data-testid="approve-override-age-override-123"]').click();
      cy.get('[data-testid="approval-reason"]').type('Player demonstrates exceptional ability');
      cy.get('[data-testid="confirm-approval"]').click();

      // Verify approval
      cy.wait('@approveAgeOverride');
      cy.get('[data-testid="success-message"]').should('contain', 'Age override approved');
    });

    it('should handle waitlist management workflow', () => {
      cy.intercept('GET', '/api/town-rec/waitlist/*', {
        statusCode: 200,
        body: {
          position: 5,
          estimatedWaitTime: '2-3 weeks',
          status: 'waitlisted',
          totalWaitlist: 25
        }
      }).as('getWaitlistStatus');

      cy.intercept('POST', '/api/town-rec/waitlist/join', {
        statusCode: 200,
        body: { success: true, position: 26 }
      }).as('joinWaitlist');

      // Navigate to waitlist
      cy.get('[data-testid="waitlist-tab"]').click();

      // Check waitlist status
      cy.get('[data-testid="check-waitlist-status"]').click();
      cy.wait('@getWaitlistStatus');

      cy.get('[data-testid="waitlist-position"]').should('contain', '5');
      cy.get('[data-testid="estimated-wait-time"]').should('contain', '2-3 weeks');

      // Join waitlist for a different league
      cy.get('[data-testid="join-waitlist-btn"]').click();
      cy.get('[data-testid="league-select"]').click();
      cy.get('[data-testid="league-option-soccer-u14"]').click();
      cy.get('[data-testid="confirm-join-waitlist"]').click();

      cy.wait('@joinWaitlist');
      cy.get('[data-testid="success-message"]').should('contain', 'Added to waitlist');
    });

    it('should handle form validation errors', () => {
      // Navigate to sibling pairing form
      cy.get('[data-testid="sibling-pairing-tab"]').click();
      cy.get('[data-testid="new-sibling-request-btn"]').click();

      // Try to submit without required fields
      cy.get('[data-testid="submit-sibling-request"]').click();

      // Verify validation errors
      cy.get('[data-testid="error-league-required"]').should('be.visible');
      cy.get('[data-testid="error-siblings-required"]').should('be.visible');

      // Fill required fields and verify errors disappear
      cy.get('[data-testid="league-select"]').click();
      cy.get('[data-testid="league-option-soccer-u10"]').click();
      cy.get('[data-testid="error-league-required"]').should('not.exist');

      cy.get('[data-testid="sibling-1-select"]').click();
      cy.get('[data-testid="player-option-player-1"]').click();
      cy.get('[data-testid="error-siblings-required"]').should('not.exist');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '/api/town-rec/sibling-pairing', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('submitSiblingRequestError');

      // Navigate to sibling pairing form
      cy.get('[data-testid="sibling-pairing-tab"]').click();
      cy.get('[data-testid="new-sibling-request-btn"]').click();

      // Fill form and submit
      cy.get('[data-testid="league-select"]').click();
      cy.get('[data-testid="league-option-soccer-u10"]').click();
      cy.get('[data-testid="sibling-1-select"]').click();
      cy.get('[data-testid="player-option-player-1"]').click();
      cy.get('[data-testid="submit-sibling-request"]').click();

      // Verify error handling
      cy.wait('@submitSiblingRequestError');
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to submit request');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle concurrent user interactions', () => {
      // Test multiple users accessing the same data
      cy.intercept('GET', '/api/town-rec/sibling-requests', {
        statusCode: 200,
        body: [
          { id: 'req-1', status: 'pending' },
          { id: 'req-2', status: 'pending' }
        ]
      }).as('getSiblingRequests');

      // First user loads the page
      cy.visit('/admin/town-rec/sibling-requests');
      cy.wait('@getSiblingRequests');

      // Simulate second user making changes
      cy.intercept('PUT', '/api/town-rec/sibling-requests/req-1/approve', {
        statusCode: 409,
        body: { error: 'Request already processed by another user' }
      }).as('concurrentApproval');

      // Try to approve request that was already processed
      cy.get('[data-testid="approve-request-req-1"]').click();
      cy.get('[data-testid="confirm-approval"]').click();

      // Verify conflict handling
      cy.wait('@concurrentApproval');
      cy.get('[data-testid="error-message"]').should('contain', 'already processed');
      cy.get('[data-testid="refresh-data"]').click();
    });

    it('should handle large data sets efficiently', () => {
      // Mock large dataset
      const largeLeaguesList = Array.from({ length: 100 }, (_, i) => ({
        id: `league-${i}`,
        name: `League ${i}`,
        sport: 'soccer',
        ageGroup: 'u10'
      }));

      cy.intercept('GET', '/api/town-rec/leagues', {
        statusCode: 200,
        body: largeLeaguesList
      }).as('getLargeLeaguesList');

      // Navigate to leagues page
      cy.visit('/town-rec/leagues');
      cy.wait('@getLargeLeaguesList');

      // Verify performance with large dataset
      cy.get('[data-testid="league-item"]').should('have.length', 100);
      
      // Test search functionality
      cy.get('[data-testid="league-search"]').type('League 50');
      cy.get('[data-testid="league-item"]').should('have.length', 1);
      cy.get('[data-testid="league-item"]').should('contain', 'League 50');

      // Test pagination
      cy.get('[data-testid="next-page"]').click();
      cy.get('[data-testid="league-item"]').should('have.length', 20); // Assuming 20 items per page
    });
  });

  describe('Performance and Accessibility', () => {
    it('should meet performance benchmarks', () => {
      // Measure page load time
      cy.visit('/town-rec', { onBeforeLoad: (win) => {
        win.performance.mark('page-load-start');
      }});

      cy.get('[data-testid="town-rec-loaded"]').should('be.visible').then(() => {
        cy.window().then((win) => {
          win.performance.mark('page-load-end');
          win.performance.measure('page-load', 'page-load-start', 'page-load-end');
          
          const measure = win.performance.getEntriesByName('page-load')[0];
          expect(measure.duration).to.be.lessThan(3000); // Should load in under 3 seconds
        });
      });
    });

    it('should be accessible', () => {
      cy.visit('/town-rec');
      
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'sibling-pairing-tab');
      
      cy.focused().type('{enter}');
      cy.get('[data-testid="sibling-pairing-content"]').should('be.visible');
      
      // Test screen reader compatibility
      cy.get('[data-testid="sibling-pairing-tab"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="league-select"]').should('have.attr', 'aria-describedby');
    });
  });
}); 