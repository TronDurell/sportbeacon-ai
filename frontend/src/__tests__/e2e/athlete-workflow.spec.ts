/* SportBeaconAI - Athlete Workflow E2E Tests
   End-to-end tests for complete athlete management workflow
*/

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

test.describe('Athlete Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  });

  // ============================================================================
  // ATHLETE CLAIM WORKFLOW
  // ============================================================================

  test('should complete athlete claim workflow', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Click claim button
    await page.click('[data-testid="claim-athlete-button"]');
    
    // Step 3: Fill claim form
    await page.fill('[data-testid="claimer-email"]', 'coach@lincolnhigh.edu');
    await page.selectOption('[data-testid="claimer-type"]', 'coach');
    await page.selectOption('[data-testid="claim-method"]', 'email');
    
    // Step 4: Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]');
    
    // Step 5: Submit claim
    await page.click('[data-testid="submit-claim-button"]');
    
    // Step 6: Verify success message
    await expect(page.locator('[data-testid="claim-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="claim-success-message"]')).toContainText('Athlete claimed successfully');
    
    // Step 7: Verify athlete status changed to claimed
    await expect(page.locator('[data-testid="athlete-status"]')).toContainText('Claimed');
  });

  // ============================================================================
  // HIGHLIGHT ADDITION WORKFLOW
  // ============================================================================

  test('should add highlight to athlete profile', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Click add highlight button
    await page.click('[data-testid="add-highlight-button"]');
    
    // Step 3: Fill highlight form
    await page.fill('[data-testid="highlight-title"]', 'Amazing Three-Pointer');
    await page.fill('[data-testid="highlight-description"]', 'Clutch three-pointer in the final seconds');
    await page.selectOption('[data-testid="highlight-sport"]', 'basketball');
    await page.selectOption('[data-testid="highlight-type"]', 'play');
    
    // Step 4: Add source link
    await page.selectOption('[data-testid="source-platform"]', 'youtube');
    await page.fill('[data-testid="source-url"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('[data-testid="add-source-button"]');
    
    // Step 5: Add tags
    await page.fill('[data-testid="tag-input"]', 'three-pointer');
    await page.press('[data-testid="tag-input"]', 'Enter');
    await page.fill('[data-testid="tag-input"]', 'clutch');
    await page.press('[data-testid="tag-input"]', 'Enter');
    
    // Step 6: Set visibility
    await page.check('[data-testid="public-highlight"]');
    
    // Step 7: Submit highlight
    await page.click('[data-testid="submit-highlight-button"]');
    
    // Step 8: Verify success message
    await expect(page.locator('[data-testid="highlight-success-message"]')).toBeVisible();
    
    // Step 9: Verify highlight appears in highlights tab
    await page.click('[data-testid="highlights-tab"]');
    await expect(page.locator('[data-testid="highlight-item"]')).toContainText('Amazing Three-Pointer');
  });

  // ============================================================================
  // CSV IMPORT WORKFLOW
  // ============================================================================

  test('should import CSV stats successfully', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Click CSV import button
    await page.click('[data-testid="csv-import-button"]');
    
    // Step 3: Select sport
    await page.selectOption('[data-testid="csv-sport"]', 'basketball');
    
    // Step 4: Upload CSV file
    const csvContent = `Player Name,Points,Rebounds,Assists,Date,Opponent
John Doe,25,10,5,2024-01-15,Lincoln High School
John Doe,18,8,7,2024-01-20,Washington High School`;
    
    // Create a temporary file for upload
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'basketball_stats.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Step 5: Map columns
    await page.selectOption('[data-testid="map-player-name"]', 'playerName');
    await page.selectOption('[data-testid="map-points"]', 'points');
    await page.selectOption('[data-testid="map-rebounds"]', 'rebounds');
    await page.selectOption('[data-testid="map-assists"]', 'assists');
    await page.selectOption('[data-testid="map-date"]', 'gameDate');
    await page.selectOption('[data-testid="map-opponent"]', 'opponent');
    
    // Step 6: Validate data
    await page.click('[data-testid="validate-data-button"]');
    
    // Step 7: Verify validation results
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="valid-rows"]')).toContainText('2 valid rows');
    await expect(page.locator('[data-testid="invalid-rows"]')).toContainText('0 invalid rows');
    
    // Step 8: Import data
    await page.click('[data-testid="import-data-button"]');
    
    // Step 9: Verify success message
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // Step 10: Verify stats appear in stats tab
    await page.click('[data-testid="stats-tab"]');
    await expect(page.locator('[data-testid="stat-item"]')).toContainText('25 points');
    await expect(page.locator('[data-testid="stat-item"]')).toContainText('18 points');
  });

  // ============================================================================
  // STAT SUBMISSION AND VERIFICATION WORKFLOW
  // ============================================================================

  test('should submit and verify stats', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Click add stats button
    await page.click('[data-testid="add-stats-button"]');
    
    // Step 3: Fill stat form
    await page.selectOption('[data-testid="stat-sport"]', 'basketball');
    await page.selectOption('[data-testid="stat-season"]', '2023-24');
    await page.fill('[data-testid="stat-opponent"]', 'Central High School');
    await page.fill('[data-testid="stat-date"]', '2024-01-25');
    
    // Step 4: Fill basketball stats
    await page.fill('[data-testid="stat-points"]', '22');
    await page.fill('[data-testid="stat-rebounds"]', '12');
    await page.fill('[data-testid="stat-assists"]', '6');
    await page.fill('[data-testid="stat-steals"]', '3');
    await page.fill('[data-testid="stat-blocks"]', '2');
    await page.fill('[data-testid="stat-turnovers"]', '4');
    
    // Step 5: Fill shooting stats
    await page.fill('[data-testid="stat-fg-made"]', '9');
    await page.fill('[data-testid="stat-fg-attempted"]', '16');
    await page.fill('[data-testid="stat-3p-made"]', '2');
    await page.fill('[data-testid="stat-3p-attempted"]', '5');
    await page.fill('[data-testid="stat-ft-made"]', '2');
    await page.fill('[data-testid="stat-ft-attempted"]', '3');
    
    // Step 6: Add notes
    await page.fill('[data-testid="stat-notes"]', 'Great performance in the fourth quarter');
    
    // Step 7: Submit stats
    await page.click('[data-testid="submit-stats-button"]');
    
    // Step 8: Verify success message
    await expect(page.locator('[data-testid="stats-success-message"]')).toBeVisible();
    
    // Step 9: Verify stats appear with pending status
    await page.click('[data-testid="stats-tab"]');
    await expect(page.locator('[data-testid="stat-status"]')).toContainText('Pending Verification');
    
    // Step 10: Switch to admin view (simulate admin login)
    await page.goto('http://localhost:3000/admin/queue');
    
    // Step 11: Verify stat appears in admin queue
    await expect(page.locator('[data-testid="verification-queue"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-item"]')).toContainText('Basketball Stats Verification');
    
    // Step 12: Approve the stat
    await page.click('[data-testid="approve-stat-button"]');
    
    // Step 13: Verify stat is approved
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // Step 14: Return to athlete profile and verify verification status
    await page.goto('http://localhost:3000/athlete/athlete_123');
    await page.click('[data-testid="stats-tab"]');
    await expect(page.locator('[data-testid="stat-status"]')).toContainText('Verified');
  });

  // ============================================================================
  // DISPUTE SUBMISSION AND RESOLUTION WORKFLOW
  // ============================================================================

  test('should submit and resolve dispute', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Navigate to a stat line
    await page.click('[data-testid="stats-tab"]');
    await page.click('[data-testid="stat-item"]');
    
    // Step 3: Click dispute button
    await page.click('[data-testid="dispute-stat-button"]');
    
    // Step 4: Fill dispute form
    await page.selectOption('[data-testid="dispute-type"]', 'stat_accuracy');
    await page.fill('[data-testid="dispute-description"]', 'The points recorded are incorrect. My child scored 25 points, not 22.');
    await page.selectOption('[data-testid="dispute-priority"]', 'high');
    
    // Step 5: Submit dispute
    await page.click('[data-testid="submit-dispute-button"]');
    
    // Step 6: Verify success message
    await expect(page.locator('[data-testid="dispute-success-message"]')).toBeVisible();
    
    // Step 7: Switch to admin view
    await page.goto('http://localhost:3000/admin/queue');
    
    // Step 8: Verify dispute appears in admin queue
    await page.click('[data-testid="disputes-tab"]');
    await expect(page.locator('[data-testid="dispute-queue"]')).toBeVisible();
    await expect(page.locator('[data-testid="dispute-item"]')).toContainText('Points Dispute');
    
    // Step 9: Resolve the dispute
    await page.click('[data-testid="resolve-dispute-button"]');
    
    // Step 10: Fill resolution form
    await page.selectOption('[data-testid="resolution-action"]', 'resolve');
    await page.fill('[data-testid="resolution-reason"]', 'Points corrected from 22 to 25 after reviewing game footage');
    
    // Step 11: Submit resolution
    await page.click('[data-testid="submit-resolution-button"]');
    
    // Step 12: Verify resolution success
    await expect(page.locator('[data-testid="resolution-success"]')).toBeVisible();
    
    // Step 13: Return to athlete profile and verify dispute resolution
    await page.goto('http://localhost:3000/athlete/athlete_123');
    await page.click('[data-testid="activity-tab"]');
    await expect(page.locator('[data-testid="dispute-resolution"]')).toContainText('Dispute resolved');
  });

  // ============================================================================
  // COMPLETE WORKFLOW INTEGRATION TEST
  // ============================================================================

  test('should complete full athlete management workflow', async ({ page }) => {
    // This test combines all the above workflows into a comprehensive test
    
    // 1. Claim athlete
    await page.goto('http://localhost:3000/athlete/athlete_123');
    await page.click('[data-testid="claim-athlete-button"]');
    await page.fill('[data-testid="claimer-email"]', 'coach@lincolnhigh.edu');
    await page.selectOption('[data-testid="claimer-type"]', 'coach');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="submit-claim-button"]');
    await expect(page.locator('[data-testid="claim-success-message"]')).toBeVisible();
    
    // 2. Add highlight
    await page.click('[data-testid="add-highlight-button"]');
    await page.fill('[data-testid="highlight-title"]', 'Game-Winning Shot');
    await page.selectOption('[data-testid="highlight-sport"]', 'basketball');
    await page.selectOption('[data-testid="source-platform"]', 'youtube');
    await page.fill('[data-testid="source-url"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('[data-testid="add-source-button"]');
    await page.click('[data-testid="submit-highlight-button"]');
    await expect(page.locator('[data-testid="highlight-success-message"]')).toBeVisible();
    
    // 3. Import CSV stats
    await page.click('[data-testid="csv-import-button"]');
    await page.selectOption('[data-testid="csv-sport"]', 'basketball');
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'stats.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Player Name,Points,Rebounds\nJohn Doe,25,10')
    });
    await page.selectOption('[data-testid="map-player-name"]', 'playerName');
    await page.selectOption('[data-testid="map-points"]', 'points');
    await page.selectOption('[data-testid="map-rebounds"]', 'rebounds');
    await page.click('[data-testid="validate-data-button"]');
    await page.click('[data-testid="import-data-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // 4. Verify stats in admin
    await page.goto('http://localhost:3000/admin/queue');
    await expect(page.locator('[data-testid="verification-queue"]')).toBeVisible();
    await page.click('[data-testid="approve-stat-button"]');
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
    
    // 5. Verify final state
    await page.goto('http://localhost:3000/athlete/athlete_123');
    await expect(page.locator('[data-testid="athlete-status"]')).toContainText('Claimed');
    
    await page.click('[data-testid="highlights-tab"]');
    await expect(page.locator('[data-testid="highlight-item"]')).toContainText('Game-Winning Shot');
    
    await page.click('[data-testid="stats-tab"]');
    await expect(page.locator('[data-testid="stat-status"]')).toContainText('Verified');
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  test('should handle invalid CSV import gracefully', async ({ page }) => {
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Click CSV import button
    await page.click('[data-testid="csv-import-button"]');
    
    // Step 3: Upload invalid CSV
    await page.setInputFiles('[data-testid="csv-file-input"]', {
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Invalid,CSV,Format\nMissing,Required,Fields')
    });
    
    // Step 4: Try to validate
    await page.click('[data-testid="validate-data-button"]');
    
    // Step 5: Verify error messages
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-errors"]')).toContainText('Missing required fields');
    
    // Step 6: Verify import button is disabled
    await expect(page.locator('[data-testid="import-data-button"]')).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    // Step 1: Navigate to athlete profile
    await page.goto('http://localhost:3000/athlete/athlete_123');
    
    // Step 2: Try to add highlight
    await page.click('[data-testid="add-highlight-button"]');
    await page.fill('[data-testid="highlight-title"]', 'Test Highlight');
    await page.click('[data-testid="submit-highlight-button"]');
    
    // Step 3: Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to add highlight');
  });
});
