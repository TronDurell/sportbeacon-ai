/**
 * @fileoverview 10x Vanguard Expansion E2E Test Suite
 * Comprehensive end-to-end testing for all new modules
 */

import { ChapterManager } from '../lib/chapters';
import { I18nSystem } from '../lib/i18n';
import { GrantSystem } from '../lib/grants';
import { EduSystem } from '../lib/edu';
import { MobileAIStudio } from '../lib/studio';
import { CivicSystem } from '../lib/civic';

class VanguardE2ETest {
  private chapterManager: ChapterManager;
  private i18nSystem: I18nSystem;
  private grantSystem: GrantSystem;
  private eduSystem: EduSystem;
  private studio: MobileAIStudio;
  private civicSystem: CivicSystem;

  constructor() {
    this.chapterManager = new ChapterManager();
    this.i18nSystem = new I18nSystem();
    this.grantSystem = new GrantSystem();
    this.eduSystem = new EduSystem();
    this.studio = new MobileAIStudio();
    this.civicSystem = new CivicSystem();
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting 10x Vanguard Expansion E2E Tests...\n');

    try {
      await this.testChaptersModule();
      await this.testI18nModule();
      await this.testGrantsModule();
      await this.testEduModule();
      await this.testStudioModule();
      await this.testCivicModule();
      await this.testIntegrationScenarios();

      console.log('\n✅ All 10x Vanguard Expansion E2E tests passed!');
    } catch (error) {
      console.error('\n❌ E2E test failed:', error);
      process.exit(1);
    }
  }

  private async testChaptersModule(): Promise<void> {
    console.log('📋 Testing Chapters Module...');

    // Test chapter creation
    const chapterConfig = {
      name: 'E2E Test Chapter',
      location: {
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country'
      },
      contact: {
        email: 'e2e@test.com'
      },
      settings: {
        autoOnboarding: true,
        customBranding: false,
        analyticsEnabled: true
      },
      features: {
        coachAgent: true,
        scoutEval: true,
        civicIndexer: false,
        venuePredictor: false
      }
    };

    const chapterId = await this.chapterManager.createChapter(chapterConfig);
    console.log(`  ✅ Chapter created: ${chapterId}`);

    // Test metrics retrieval
    const metrics = await this.chapterManager.getChapterMetrics(chapterId);
    console.log(`  ✅ Metrics retrieved: ${metrics.activeUsers} active users`);

    // Test onboarding script generation
    const script = await this.chapterManager.generateOnboardingScript(chapterId);
    console.log(`  ✅ Onboarding script generated: ${script.length} characters`);

    console.log('  ✅ Chapters module tests completed\n');
  }

  private async testI18nModule(): Promise<void> {
    console.log('🌍 Testing I18n Module...');

    // Test language detection
    const englishText = 'Welcome to SportBeaconAI';
    const spanishText = 'Bienvenido a SportBeaconAI';
    const frenchText = 'Bienvenue sur SportBeaconAI';

    const englishLocale = await this.i18nSystem.detectLanguage(englishText);
    const spanishLocale = await this.i18nSystem.detectLanguage(spanishText);
    const frenchLocale = await this.i18nSystem.detectLanguage(frenchText);

    console.log(`  ✅ Language detection: EN=${englishLocale}, ES=${spanishLocale}, FR=${frenchLocale}`);

    // Test prompt translation
    const translatedPrompt = await this.i18nSystem.translatePrompt(englishText, 'es');
    console.log(`  ✅ Prompt translation: ${translatedPrompt}`);

    // Test key translation
    const translatedKey = await this.i18nSystem.translateKey('welcome_message', 'es');
    console.log(`  ✅ Key translation: ${translatedKey}`);

    // Test user locale management
    const userId = 'e2e-test-user';
    await this.i18nSystem.setUserLocale(userId, 'es');
    const userLocale = await this.i18nSystem.getUserLocale(userId);
    console.log(`  ✅ User locale set: ${userLocale}`);

    console.log('  ✅ I18n module tests completed\n');
  }

  private async testGrantsModule(): Promise<void> {
    console.log('💰 Testing Grants Module...');

    // Test grant discovery
    const criteria = {
      category: 'youth_programs',
      amount: { min: 5000, max: 50000 },
      location: { country: 'USA' },
      eligibility: {
        organizationType: ['nonprofit'],
        focusAreas: ['youth_development'],
        experienceLevel: 'established_organization'
      },
      deadline: {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31')
      }
    };

    const grants = await this.grantSystem.findGrants(criteria);
    console.log(`  ✅ Grants found: ${grants.length} matching grants`);

    // Test application draft generation
    const organizationData = {
      name: 'E2E Test Organization',
      type: 'nonprofit',
      establishedYear: 2020,
      targetPopulation: 'youth',
      serviceArea: 'local community',
      mission: 'To serve the community',
      staffCount: 10,
      annualParticipants: 500
    };

    const draft = await this.grantSystem.generateApplicationDraft('grant-001', organizationData);
    console.log(`  ✅ Application draft generated: ${draft.completionPercentage}% complete`);

    // Test deadline tracking
    const deadlines = await this.grantSystem.trackDeadlines();
    console.log(`  ✅ Deadlines tracked: ${deadlines.length} upcoming`);

    // Test grant subscription
    await this.grantSystem.subscribeToGrant('grant-001', 'e2e-test-user');
    console.log(`  ✅ Grant subscription created`);

    console.log('  ✅ Grants module tests completed\n');
  }

  private async testEduModule(): Promise<void> {
    console.log('🎓 Testing Education Module...');

    // Test learning path generation
    const userId = 'e2e-test-user';
    const skillLevel = 'intermediate';
    
    const learningPath = await this.eduSystem.getLearningPath(userId, skillLevel);
    console.log(`  ✅ Learning path generated: ${learningPath.courses.length} courses, ${learningPath.estimatedDuration} hours`);

    // Test course enrollment
    await this.eduSystem.enrollInCourse(userId, 'course-001');
    console.log(`  ✅ Course enrollment completed`);

    // Test progress tracking
    await this.eduSystem.trackProgress(userId, 'course-001', 75);
    console.log(`  ✅ Progress tracked: 75%`);

    // Test assessment retrieval
    const assessments = await this.eduSystem.getAssessments('course-001');
    console.log(`  ✅ Assessments retrieved: ${assessments.length} assessments`);

    console.log('  ✅ Education module tests completed\n');
  }

  private async testStudioModule(): Promise<void> {
    console.log('🎬 Testing Mobile AI Studio Module...');

    // Test video project creation
    const userId = 'e2e-test-user';
    const config = {
      title: 'E2E Test Video',
      description: 'A comprehensive test video project',
      category: 'sports_highlight'
    };

    const project = await this.studio.createVideoProject(userId, config);
    console.log(`  ✅ Video project created: ${project.title}`);

    // Test video publishing
    const publishUrl = await this.studio.publishVideo(project.id);
    console.log(`  ✅ Video published: ${publishUrl}`);

    // Test monetization tiers
    const tiers = await this.studio.getMonetizationTiers(userId);
    console.log(`  ✅ Monetization tiers retrieved: ${tiers.length} tiers`);

    // Test badge awarding
    const badge = await this.studio.awardBadge(userId, 'first_video');
    console.log(`  ✅ Badge awarded: ${badge.name} (${badge.icon})`);

    console.log('  ✅ Studio module tests completed\n');
  }

  private async testCivicModule(): Promise<void> {
    console.log('🏛️ Testing Civic Module...');

    // Test city metrics retrieval
    const cityId = 'cary-nc';
    const metrics = await this.civicSystem.getCityMetrics(cityId);
    console.log(`  ✅ City metrics retrieved: ${metrics.name}, Score: ${metrics.overallScore}/100`);

    // Test impact tracking
    const initiativeId = 'e2e-test-initiative';
    const impactData = {
      participants: 150,
      reach: 750,
      satisfaction: 4.3,
      outcomes: {
        'participation_rate': 88,
        'skill_improvement': 82
      },
      costEffectiveness: 0.85,
      sustainability: 0.78
    };

    await this.civicSystem.trackImpact(initiativeId, impactData);
    console.log(`  ✅ Impact tracked: ${impactData.participants} participants`);

    // Test report generation
    const report = await this.civicSystem.generateReport(cityId, '6 months');
    console.log(`  ✅ Report generated: ${report.initiatives.length} initiatives, ${report.recommendations.length} recommendations`);

    // Test initiative launch
    const initiative = {
      name: 'E2E Test Initiative',
      description: 'A comprehensive test civic initiative',
      category: 'youth_development',
      targetMetrics: ['participation_rate', 'skill_improvement'],
      budget: 150000,
      timeline: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      },
      stakeholders: [cityId, 'local_schools'],
      status: 'planning',
      impact: {
        participants: 0,
        reach: 0,
        satisfaction: 0,
        outcomes: {},
        costEffectiveness: 0,
        sustainability: 0
      }
    };

    const launchedInitiativeId = await this.civicSystem.launchInitiative(initiative);
    console.log(`  ✅ Initiative launched: ${launchedInitiativeId}`);

    console.log('  ✅ Civic module tests completed\n');
  }

  private async testIntegrationScenarios(): Promise<void> {
    console.log('🔗 Testing Integration Scenarios...');

    // Test cross-module integration: Chapter with I18n
    const chapterConfig = {
      name: 'International Chapter',
      location: { city: 'Test City', state: 'Test State', country: 'Test Country' },
      contact: { email: 'international@test.com' },
      settings: { autoOnboarding: true, customBranding: false, analyticsEnabled: true },
      features: { coachAgent: true, scoutEval: true, civicIndexer: false, venuePredictor: false }
    };

    const chapterId = await this.chapterManager.createChapter(chapterConfig);
    const onboardingScript = await this.chapterManager.generateOnboardingScript(chapterId);
    const translatedScript = await this.i18nSystem.translatePrompt(onboardingScript, 'es');
    console.log(`  ✅ Cross-module: Chapter onboarding script translated to Spanish (${translatedScript.length} chars)`);

    // Test education with studio integration
    const userId = 'integration-test-user';
    const learningPath = await this.eduSystem.getLearningPath(userId, 'beginner');
    await this.eduSystem.enrollInCourse(userId, 'course-001');
    
    const videoProject = await this.studio.createVideoProject(userId, {
      title: 'Educational Content',
      description: 'Video created as part of learning path',
      category: 'training_tutorial'
    });
    console.log(`  ✅ Cross-module: Educational video project created: ${videoProject.title}`);

    // Test civic impact with grants
    const grants = await this.grantSystem.findGrants({
      category: 'youth_development',
      amount: { min: 10000, max: 100000 },
      location: { country: 'USA' },
      eligibility: {
        organizationType: ['nonprofit'],
        focusAreas: ['youth_development'],
        experienceLevel: 'any'
      },
      deadline: {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31')
      }
    });

    if (grants.length > 0) {
      const grant = grants[0];
      const draft = await this.grantSystem.generateApplicationDraft(grant.id, {
        name: 'Civic Impact Organization',
        type: 'nonprofit',
        establishedYear: 2020,
        targetPopulation: 'youth',
        serviceArea: 'local community',
        mission: 'To create civic impact through sports',
        staffCount: 15,
        annualParticipants: 1000
      });
      console.log(`  ✅ Cross-module: Civic grant application draft created: ${draft.completionPercentage}% complete`);
    }

    console.log('  ✅ Integration scenarios completed\n');
  }
}

// Run the E2E tests
async function main() {
  const e2eTest = new VanguardE2ETest();
  await e2eTest.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { VanguardE2ETest }; 