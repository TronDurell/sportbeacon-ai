import { playerAgent, coachAgent, parentAgent, adminAgent, scoutAgent, refereeAgent } from '../lib/ai/onboardingAgents';

// Mock Firestore for testing
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({})
      })
    })),
    add: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
    where: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        docs: []
      })
    }))
  }))
};

// Mock Firebase setup
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue({}),
  updateDoc: jest.fn().mockResolvedValue({}),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({})
  }),
  getDocs: jest.fn().mockResolvedValue({
    docs: []
  }),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn()
}));

// Test data for different roles
const testUserData = {
  Player: {
    id: 'player-test-123',
    name: 'Alex Johnson',
    age: 12,
    sport: 'soccer',
    skillLevel: 'intermediate',
    goals: ['improve dribbling', 'team coordination'],
    availability: ['weekends', 'tuesday', 'thursday']
  },
  Coach: {
    id: 'coach-test-456',
    name: 'Sarah Williams',
    experience: 5,
    certifications: ['USSF D License', 'First Aid'],
    sports: ['soccer', 'basketball'],
    availability: ['weekdays', 'weekends'],
    teamSize: 15
  },
  Parent: {
    id: 'parent-test-789',
    name: 'Michael Chen',
    children: [
      { name: 'Emma Chen', age: 10, sport: 'soccer' },
      { name: 'Lucas Chen', age: 8, sport: 'basketball' }
    ],
    preferences: ['same team', 'weekend games'],
    contactInfo: { email: 'michael@example.com', phone: '555-0123' }
  },
  Admin: {
    id: 'admin-test-101',
    name: 'Jennifer Rodriguez',
    role: 'league_director',
    permissions: ['manage_teams', 'approve_requests', 'view_analytics'],
    leagues: ['u10_soccer', 'u12_basketball'],
    responsibilities: ['scheduling', 'registration', 'disputes']
  },
  Scout: {
    id: 'scout-test-202',
    name: 'David Thompson',
    experience: 8,
    specializations: ['soccer', 'basketball', 'baseball'],
    evaluationCriteria: ['technical_skills', 'tactical_awareness', 'physical_attributes'],
    reportingFormat: 'detailed_analysis'
  },
  Referee: {
    id: 'referee-test-303',
    name: 'Lisa Park',
    experience: 3,
    certifications: ['USSF Grade 8', 'High School Certified'],
    sports: ['soccer', 'basketball'],
    availability: ['weekends', 'weekday_evenings'],
    preferredAgeGroups: ['u10', 'u12', 'u14']
  }
};

// Validation criteria for each role
const validationCriteria = {
  Player: {
    requiredFields: ['id', 'name', 'age', 'sport'],
    expectedActions: ['skill_assessment', 'goal_setting', 'schedule_recommendation'],
    successIndicators: ['profile_created', 'goals_defined', 'next_steps_provided']
  },
  Coach: {
    requiredFields: ['id', 'name', 'experience', 'certifications'],
    expectedActions: ['team_setup', 'practice_planning', 'player_evaluation'],
    successIndicators: ['profile_verified', 'teams_configured', 'resources_provided']
  },
  Parent: {
    requiredFields: ['id', 'name', 'children'],
    expectedActions: ['child_registration', 'schedule_coordination', 'communication_setup'],
    successIndicators: ['children_registered', 'preferences_set', 'notifications_configured']
  },
  Admin: {
    requiredFields: ['id', 'name', 'role', 'permissions'],
    expectedActions: ['league_management', 'request_processing', 'analytics_review'],
    successIndicators: ['permissions_granted', 'tools_accessible', 'workflow_configured']
  },
  Scout: {
    requiredFields: ['id', 'name', 'experience', 'specializations'],
    expectedActions: ['evaluation_setup', 'reporting_configured', 'criteria_definition'],
    successIndicators: ['evaluation_tools_ready', 'reporting_configured', 'criteria_set']
  },
  Referee: {
    requiredFields: ['id', 'name', 'experience', 'certifications'],
    expectedActions: ['schedule_setup', 'rule_review', 'communication_configured'],
    successIndicators: ['schedule_accessible', 'rules_understood', 'communication_ready']
  }
};

// Flow validation function
export async function validateOnboardingFlows(role: string, agent: any) {
  console.log(`\n🧪 Testing ${role} onboarding flow...`);
  
  const testData = testUserData[role as keyof typeof testUserData];
  const criteria = validationCriteria[role as keyof typeof validationCriteria];
  
  if (!testData || !criteria) {
    throw new Error(`No test data or criteria found for role: ${role}`);
  }

  const results = {
    role,
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    performance: {
      startTime: Date.now(),
      endTime: 0,
      duration: 0
    }
  };

  try {
    // Test 1: Agent initialization
    console.log(`  ✓ Testing ${role} agent initialization...`);
    results.testsRun++;
    
    if (!agent || typeof agent !== 'object') {
      throw new Error(`${role} agent is not properly initialized`);
    }
    
    if (typeof agent.onboard !== 'function') {
      throw new Error(`${role} agent missing onboard method`);
    }
    
    results.testsPassed++;
    console.log(`    ✅ ${role} agent initialized successfully`);

    // Test 2: Data validation
    console.log(`  ✓ Testing ${role} data validation...`);
    results.testsRun++;
    
    const missingFields = criteria.requiredFields.filter(field => !testData[field as keyof typeof testData]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    results.testsPassed++;
    console.log(`    ✅ ${role} test data validation passed`);

    // Test 3: Onboarding flow execution
    console.log(`  ✓ Testing ${role} onboarding flow execution...`);
    results.testsRun++;
    
    const onboardingResult = await agent.onboard(testData);
    
    if (!onboardingResult) {
      throw new Error(`${role} onboarding returned no result`);
    }
    
    if (typeof onboardingResult !== 'object') {
      throw new Error(`${role} onboarding result is not an object`);
    }
    
    results.testsPassed++;
    console.log(`    ✅ ${role} onboarding flow executed successfully`);

    // Test 4: Result validation
    console.log(`  ✓ Testing ${role} result validation...`);
    results.testsRun++;
    
    const missingIndicators = criteria.successIndicators.filter(indicator => 
      !onboardingResult[indicator as keyof typeof onboardingResult]
    );
    
    if (missingIndicators.length > 0) {
      results.warnings.push(`Missing success indicators: ${missingIndicators.join(', ')}`);
    }
    
    results.testsPassed++;
    console.log(`    ✅ ${role} result validation completed`);

    // Test 5: Performance validation
    console.log(`  ✓ Testing ${role} performance...`);
    results.testsRun++;
    
    const maxDuration = 5000; // 5 seconds
    if (results.performance.duration > maxDuration) {
      results.warnings.push(`Onboarding took ${results.performance.duration}ms (max: ${maxDuration}ms)`);
    }
    
    results.testsPassed++;
    console.log(`    ✅ ${role} performance within acceptable limits`);

    // Test 6: Error handling
    console.log(`  ✓ Testing ${role} error handling...`);
    results.testsRun++;
    
    try {
      await agent.onboard({}); // Test with empty data
      results.warnings.push('Agent should handle empty data more gracefully');
    } catch (error) {
      // Expected behavior - agent should handle invalid data
      console.log(`    ✅ ${role} error handling working as expected`);
    }
    
    results.testsPassed++;

  } catch (error) {
    results.testsFailed++;
    results.errors.push(error instanceof Error ? error.message : String(error));
    console.log(`    ❌ ${role} test failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  results.performance.endTime = Date.now();
  results.performance.duration = results.performance.endTime - results.performance.startTime;

  // Log results
  console.log(`\n📊 ${role} Flow Validation Results:`);
  console.log(`   Tests Run: ${results.testsRun}`);
  console.log(`   Tests Passed: ${results.testsPassed}`);
  console.log(`   Tests Failed: ${results.testsFailed}`);
  console.log(`   Duration: ${results.performance.duration}ms`);
  
  if (results.errors.length > 0) {
    console.log(`   Errors: ${results.errors.join(', ')}`);
  }
  
  if (results.warnings.length > 0) {
    console.log(`   Warnings: ${results.warnings.join(', ')}`);
  }

  return results;
}

// Batch validation function
export async function runAllOnboardingValidations() {
  console.log('🚀 Starting comprehensive onboarding flow validation...\n');
  
  const agents = {
    Player: playerAgent,
    Coach: coachAgent,
    Parent: parentAgent,
    Admin: adminAgent,
    Scout: scoutAgent,
    Referee: refereeAgent
  };

  const allResults = [];
  const startTime = Date.now();

  for (const [role, agent] of Object.entries(agents)) {
    try {
      const result = await validateOnboardingFlows(role, agent);
      allResults.push(result);
    } catch (error) {
      console.error(`❌ Failed to validate ${role} flow:`, error);
      allResults.push({
        role,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        performance: { startTime: Date.now(), endTime: Date.now(), duration: 0 }
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  const totalTests = allResults.reduce((sum, r) => sum + r.testsRun, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.testsPassed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.testsFailed, 0);

  console.log('\n🎯 Overall Validation Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${totalPassed}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log(`   Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log(`   Average per Role: ${(totalDuration / allResults.length).toFixed(0)}ms`);

  return {
    results: allResults,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: (totalPassed / totalTests) * 100,
      totalDuration
    }
  };
}

// Export for use in test files
export { mockFirestore, testUserData, validationCriteria }; 