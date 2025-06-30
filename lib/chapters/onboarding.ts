import { ChapterConfig, OnboardingFlow } from './types';
import { analytics } from '../ai/shared/analytics';

export class OnboardingGenerator {
  async generateScripts(chapterId: string, config?: ChapterConfig): Promise<string> {
    const flow = this.createOnboardingFlow(chapterId, config);
    
    try {
      const script = await this.generateScript(flow);
      
      await analytics.track('onboarding_script_generated', {
        chapterId,
        stepsCount: flow.steps.length,
        estimatedTime: flow.averageTime
      });
      
      return script;
    } catch (error) {
      await analytics.track('onboarding_script_failed', {
        chapterId,
        error: error.message
      });
      throw error;
    }
  }

  private createOnboardingFlow(chapterId: string, config?: ChapterConfig): OnboardingFlow {
    const baseSteps = [
      {
        id: 'welcome',
        title: 'Welcome to SportBeaconAI',
        description: 'Get started with your new chapter',
        required: true,
        completed: false,
        estimatedTime: 2
      },
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Set up your chapter administrator profile',
        required: true,
        completed: false,
        estimatedTime: 5
      },
      {
        id: 'features',
        title: 'Configure Features',
        description: 'Enable and configure AI features for your chapter',
        required: true,
        completed: false,
        estimatedTime: 10
      },
      {
        id: 'team',
        title: 'Invite Your Team',
        description: 'Add coaches, scouts, and administrators',
        required: false,
        completed: false,
        estimatedTime: 8
      },
      {
        id: 'branding',
        title: 'Customize Branding',
        description: 'Add your chapter logo and colors',
        required: false,
        completed: false,
        estimatedTime: 5
      },
      {
        id: 'launch',
        title: 'Launch Your Chapter',
        description: 'Go live and start serving your community',
        required: true,
        completed: false,
        estimatedTime: 3
      }
    ];

    return {
      chapterId,
      steps: baseSteps,
      completionRate: 0,
      averageTime: baseSteps.reduce((sum, step) => sum + step.estimatedTime, 0)
    };
  }

  private async generateScript(flow: OnboardingFlow): Promise<string> {
    const script = `#!/bin/bash
# SportBeaconAI Chapter Onboarding Script
# Generated for chapter: ${flow.chapterId}
# Estimated completion time: ${flow.averageTime} minutes

echo "🚀 Welcome to SportBeaconAI Chapter Setup!"
echo "Chapter ID: ${flow.chapterId}"
echo ""

# Step 1: Welcome
echo "📋 Step 1: Welcome to SportBeaconAI"
echo "   - Estimated time: 2 minutes"
echo "   - Status: Ready to begin"
echo ""

# Step 2: Profile Setup
echo "👤 Step 2: Complete Your Profile"
echo "   - Estimated time: 5 minutes"
echo "   - Required: Yes"
echo "   - Action: Visit your chapter dashboard"
echo ""

# Step 3: Feature Configuration
echo "⚙️  Step 3: Configure Features"
echo "   - Estimated time: 10 minutes"
echo "   - Required: Yes"
echo "   - Features to configure:"
${flow.steps.find(s => s.id === 'features') ? '   - CoachAgent AI Assistant' : ''}
${flow.steps.find(s => s.id === 'features') ? '   - ScoutEval Assessment System' : ''}
${flow.steps.find(s => s.id === 'features') ? '   - CivicIndexer Analytics' : ''}
${flow.steps.find(s => s.id === 'features') ? '   - VenuePredictor Location Services' : ''}
echo ""

# Step 4: Team Invitation
echo "👥 Step 4: Invite Your Team"
echo "   - Estimated time: 8 minutes"
echo "   - Required: No"
echo "   - Action: Send invitations to coaches and scouts"
echo ""

# Step 5: Branding
echo "🎨 Step 5: Customize Branding"
echo "   - Estimated time: 5 minutes"
echo "   - Required: No"
echo "   - Action: Upload logo and set colors"
echo ""

# Step 6: Launch
echo "🚀 Step 6: Launch Your Chapter"
echo "   - Estimated time: 3 minutes"
echo "   - Required: Yes"
echo "   - Action: Go live and start serving your community"
echo ""

echo "✅ Onboarding script generated successfully!"
echo "📊 Total estimated time: ${flow.averageTime} minutes"
echo "🔗 Access your chapter at: https://sportbeacon.ai/chapters/${flow.chapterId}"
echo ""
echo "Need help? Contact support@sportbeacon.ai"`;

    return script;
  }
} 