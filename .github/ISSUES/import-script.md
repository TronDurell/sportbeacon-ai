# SportBeaconAI GitHub Issues Import Script

## 🚀 Automated Import Process

### Prerequisites
- GitHub Personal Access Token with `repo` and `project` permissions
- Node.js installed
- Repository access to SportBeaconAI

### Import Script
**File**: `scripts/import-github-issues.js`

```javascript
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  owner: 'your-github-username',
  repo: 'sportbeacon-ai',
  token: process.env.GITHUB_TOKEN,
  milestone: 'v1.0 iOS Public Launch'
};

const octokit = new Octokit({
  auth: config.token
});

// Issue definitions
const issues = [
  {
    title: "✅ Convert all major web components to React Native",
    body: `Port all required frontend components like \`Header.tsx\`, \`HomePage.tsx\`, and navigation to \`mobile/components/\` using \`react-navigation\`, \`tailwind-rn\`, and native layout standards. Ensure complete parity.

### ✅ Task Checklist:
- [ ] **Implement Header.tsx React Native component** with navigation menu, user avatar, and notification bell using \`react-native-vector-icons\`
- [ ] **Create HomePage.tsx native layout** with ScrollView, FlatList for feed, and proper safe area handling
- [ ] **Set up React Navigation stack** with tab navigation for main sections (Dashboard, Drills, Profile, Social)
- [ ] **Convert PlayerDashboard.tsx** to use native components (View, Text, TouchableOpacity, LinearGradient)
- [ ] **Implement responsive design** using Dimensions API and responsive breakpoints for different iPhone sizes
- [ ] **Add native animations** using Animated API for smooth transitions and micro-interactions
- [ ] **Test component rendering** on iPhone 11 simulator and physical device for visual parity
- [ ] **Validate navigation flow** and ensure deep linking works correctly with React Navigation`,
    labels: ['frontend', 'ios', 'feature', 'Phase 2: Mobile UI'],
    assignee: 'frontend-team'
  },
  {
    title: "🧪 Validate all mobile screens for responsiveness",
    body: `Ensure React Native views match original web layout for UX/UI parity. Perform device testing and record visual deltas or bugs.

### ✅ Task Checklist:
- [ ] **Test on iPhone 11 (6.1")** and verify all components render correctly with proper spacing and typography
- [ ] **Validate iPhone SE (4.7")** compatibility and ensure no overflow or layout issues on smaller screens
- [ ] **Check iPhone 12 Pro Max (6.7")** for proper scaling and safe area handling with notch
- [ ] **Test landscape orientation** for all screens and ensure proper rotation handling
- [ ] **Validate dark mode support** using \`@react-native-community/appearance\` and theme switching
- [ ] **Test accessibility features** including VoiceOver, Dynamic Type, and high contrast mode
- [ ] **Record visual regression tests** using screenshots and compare with web version for parity
- [ ] **Document any UI/UX differences** between web and mobile versions for future iteration`,
    labels: ['frontend', 'ios', 'bug', 'Phase 2: Mobile UI'],
    assignee: 'frontend-team'
  },
  {
    title: "📸 Prepare App Store screenshots and marketing copy",
    body: `Generate screenshots in iPhone 11 dimensions (portrait and landscape), write App Store text blocks (short desc, full desc, what's new), and commit them to \`mobile/ios/assets/appstore/\`.

### ✅ Task Checklist:
- [ ] **Generate iPhone 11 screenshots** (1170x2532px) for all major app screens using Xcode Simulator
- [ ] **Create landscape screenshots** (2532x1170px) for iPad compatibility and App Store display
- [ ] **Write App Store short description** (30 characters max) highlighting AI coaching and performance tracking
- [ ] **Draft full App Store description** (4000 characters max) with feature list, benefits, and call-to-action
- [ ] **Create "What's New" text** for v1.0 launch highlighting key features and improvements
- [ ] **Research and add relevant keywords** for App Store optimization (ASO) in description and metadata
- [ ] **Design app icon variations** for different device sizes and ensure proper scaling
- [ ] **Upload assets to App Store Connect** and verify they display correctly in preview`,
    labels: ['ios', 'growth', 'feature', 'Phase 6: TestFlight Deployment'],
    assignee: 'growth-team'
  },
  {
    title: "🔑 Fill in App Store and Firebase credentials",
    body: `Add \`GoogleService-Info.plist\` and App Store credentials to GitHub Actions secrets. Confirm they're referenced in Fastlane and Xcode workspace.

### ✅ Task Checklist:
- [ ] **Download GoogleService-Info.plist** from Firebase Console and add to \`mobile/ios/SportBeaconAI/\`
- [ ] **Generate App Store Connect API key** (.p8 file) and add to GitHub repository secrets
- [ ] **Add Apple Developer Team ID** and Bundle Identifier to GitHub Actions environment variables
- [ ] **Configure Fastlane Appfile** with App Store Connect API credentials and team information
- [ ] **Set up code signing certificates** using Fastlane Match or manual certificate management
- [ ] **Add Firebase configuration** to AppDelegate.swift and verify initialization works correctly
- [ ] **Test credentials in CI/CD** by running a test build and ensuring all secrets are accessible
- [ ] **Document credential management** process for future team members and deployment automation`,
    labels: ['ios', 'infra', 'security'],
    assignee: 'infra-team'
  },
  {
    title: "✅ Ensure Fastlane + GitHub Actions CI pass for iOS",
    body: `CI pipeline should lint, build, test, and archive the iOS app using Fastlane. Block if any steps fail in CI.

### ✅ Task Checklist:
- [ ] **Configure GitHub Actions workflow** for iOS builds using macOS runners and Xcode 15
- [ ] **Set up Fastlane lanes** for build, test, and archive with proper error handling and notifications
- [ ] **Add linting step** using ESLint and TypeScript checking for React Native code quality
- [ ] **Implement automated testing** with Jest and React Native Testing Library for component validation
- [ ] **Configure code signing** in CI environment using Fastlane Match or certificate management
- [ ] **Add build artifact upload** to GitHub Actions for debugging and distribution
- [ ] **Set up Slack/email notifications** for build success/failure with detailed error reporting
- [ ] **Test full CI pipeline** end-to-end and ensure it blocks merges on any failure`,
    labels: ['ci-cd', 'ios', 'priority-high', 'Phase 5: Infra + Monitoring'],
    assignee: 'infra-team'
  },
  {
    title: "📱 Run full regression test on iPhone 11",
    body: `Log into TestFlight, run through onboarding, login, navigation, media, and push notifications. Confirm all Firebase + Stripe services respond correctly.

### ✅ Task Checklist:
- [ ] **Test app installation** from TestFlight and verify no crashes on launch
- [ ] **Validate onboarding flow** including permissions (camera, microphone, location) and user registration
- [ ] **Test authentication** with Firebase Auth including email/password and Apple Sign-In
- [ ] **Verify navigation** between all screens and ensure no memory leaks or performance issues
- [ ] **Test media functionality** including video upload, playback, and camera integration
- [ ] **Validate push notifications** using Firebase Cloud Messaging and ensure proper delivery
- [ ] **Test payment flows** with Stripe including Apple Pay and 3D Secure authentication
- [ ] **Document all bugs** found during testing and create follow-up issues for fixes`,
    labels: ['ios', 'bug', 'priority-high', 'Phase 6: TestFlight Deployment'],
    assignee: 'frontend-team'
  },
  {
    title: "📦 Scaffold Android project & Firebase integration",
    body: `Kick off Android parity by initializing React Native Android build. Add CI step to match iOS pipeline. Confirm Firebase keys included.

### ✅ Task Checklist:
- [ ] **Initialize React Native Android project** using \`npx react-native init\` with TypeScript template
- [ ] **Set up Android Studio** and configure Gradle build system with proper dependencies
- [ ] **Add Firebase configuration** by downloading \`google-services.json\` and adding to Android project
- [ ] **Configure Android permissions** in \`AndroidManifest.xml\` for camera, microphone, and location
- [ ] **Set up React Navigation** for Android with proper back button handling and gesture navigation
- [ ] **Add Android CI step** to GitHub Actions workflow using Ubuntu runners and Android SDK
- [ ] **Test on Android emulator** and verify all components render correctly on different screen sizes
- [ ] **Validate Firebase services** work correctly on Android including Auth, Firestore, and Analytics`,
    labels: ['android', 'ci-cd', 'feature', 'Phase 7: Local Growth Stack'],
    assignee: 'frontend-team'
  },
  {
    title: "🧠 Implement AI drill feedback engine",
    body: `Build AI-powered drill analysis system using TensorFlow.js for movement recognition and LLM for personalized feedback generation.

### ✅ Task Checklist:
- [ ] **Set up TensorFlow.js** in React Native using \`@tensorflow/tfjs-react-native\` for movement detection
- [ ] **Train movement recognition model** for common sports drills (basketball, soccer, football) using pose estimation
- [ ] **Implement video analysis pipeline** to extract key frames and movement patterns from uploaded videos
- [ ] **Create LLM integration** using OpenAI API or local model for generating personalized feedback
- [ ] **Build feedback scoring system** that rates technique, form, and performance metrics
- [ ] **Add real-time feedback** during video playback with visual overlays and audio cues
- [ ] **Implement feedback storage** in Firestore with user progress tracking and historical analysis
- [ ] **Test AI accuracy** with diverse user videos and refine model based on feedback quality`,
    labels: ['ai', 'backend', 'feature', 'Phase 3: AI Feedback Pipeline'],
    assignee: 'ai-team'
  },
  {
    title: "📊 Develop trend analysis engine",
    body: `Create AI-powered trend detection system to analyze user performance patterns and provide insights for improvement.

### ✅ Task Checklist:
- [ ] **Implement data aggregation** from user drills, performance metrics, and historical data
- [ ] **Create trend detection algorithms** using time series analysis and statistical modeling
- [ ] **Build performance prediction model** to forecast user improvement and set realistic goals
- [ ] **Develop insight generation** using natural language processing to create actionable recommendations
- [ ] **Add comparative analysis** to benchmark user performance against similar athletes
- [ ] **Implement trend visualization** with charts and graphs for performance tracking over time
- [ ] **Create automated reporting** system that generates weekly/monthly performance summaries
- [ ] **Test trend accuracy** with historical data and validate prediction models with real user feedback`,
    labels: ['ai', 'backend', 'feature', 'Phase 3: AI Feedback Pipeline'],
    assignee: 'ai-team'
  },
  {
    title: "🎯 Build highlight tagging engine",
    body: `Develop AI-powered system to automatically identify and tag highlights in user videos for easy sharing and analysis.

### ✅ Task Checklist:
- [ ] **Implement highlight detection** using computer vision to identify key moments in sports videos
- [ ] **Create automatic tagging system** that labels highlights with relevant metadata (skill type, difficulty, etc.)
- [ ] **Build highlight extraction** pipeline to create short clips from longer videos
- [ ] **Add social sharing integration** to easily post highlights to social media platforms
- [ ] **Implement highlight organization** with folders, playlists, and search functionality
- [ ] **Create highlight analytics** to track which moments are most popular and engaging
- [ ] **Add manual tagging override** allowing users to customize AI-generated tags
- [ ] **Test highlight accuracy** with various sports and video qualities to ensure reliable detection`,
    labels: ['ai', 'backend', 'feature', 'Phase 3: AI Feedback Pipeline'],
    assignee: 'ai-team'
  },
  {
    title: "🚀 Implement FastAPI backend endpoints",
    body: `Build comprehensive REST API using FastAPI for user management, drill data, analytics, and AI integration.

### ✅ Task Checklist:
- [ ] **Set up FastAPI project structure** with proper routing, middleware, and dependency injection
- [ ] **Implement user authentication endpoints** for registration, login, and profile management
- [ ] **Create drill management API** for CRUD operations on drills, assignments, and progress tracking
- [ ] **Build analytics endpoints** for performance metrics, trends, and user insights
- [ ] **Add AI integration endpoints** for feedback generation, trend analysis, and highlight detection
- [ ] **Implement file upload endpoints** for video storage and processing with proper validation
- [ ] **Add rate limiting and caching** using Redis for API performance optimization
- [ ] **Create comprehensive API documentation** using FastAPI's automatic OpenAPI generation`,
    labels: ['backend', 'api', 'feature', 'Phase 4: Firebase + Stripe'],
    assignee: 'backend-team'
  },
  {
    title: "🔐 Set up authentication and authorization",
    body: `Implement secure authentication system with Firebase Auth integration and role-based access control.

### ✅ Task Checklist:
- [ ] **Integrate Firebase Auth** with custom backend for user authentication and session management
- [ ] **Implement JWT token handling** for secure API access and token refresh mechanisms
- [ ] **Create role-based access control** for different user types (athletes, coaches, admins)
- [ ] **Add OAuth integration** for Apple Sign-In, Google, and other social login providers
- [ ] **Implement password reset** and email verification flows with proper security measures
- [ ] **Add session management** with proper logout, token invalidation, and security monitoring
- [ ] **Create audit logging** for authentication events and security monitoring
- [ ] **Test authentication flows** end-to-end and validate security measures against common attacks`,
    labels: ['backend', 'security', 'feature', 'Phase 4: Firebase + Stripe'],
    assignee: 'backend-team'
  },
  {
    title: "📈 Implement performance metrics system",
    body: `Build comprehensive metrics collection and analysis system for app performance, user engagement, and business intelligence.

### ✅ Task Checklist:
- [ ] **Set up metrics collection** using Prometheus for system performance and application metrics
- [ ] **Implement user engagement tracking** for app usage, feature adoption, and retention metrics
- [ ] **Create business intelligence dashboard** with key performance indicators and user analytics
- [ ] **Add error tracking and alerting** using Sentry for crash reporting and performance monitoring
- [ ] **Implement A/B testing framework** for feature experimentation and user experience optimization
- [ ] **Create automated reporting** system for daily/weekly/monthly metrics summaries
- [ ] **Add real-time monitoring** with Grafana dashboards for system health and performance
- [ ] **Test metrics accuracy** and validate data collection across all platforms and user scenarios`,
    labels: ['backend', 'monitoring', 'feature', 'Phase 5: Infra + Monitoring'],
    assignee: 'backend-team'
  },
  {
    title: "📱 Migrate Header component to React Native",
    body: `Convert the web Header component to React Native with proper navigation, user menu, and mobile-optimized layout.

### ✅ Task Checklist:
- [ ] **Analyze web Header component** and identify all functionality to be migrated
- [ ] **Create React Native Header component** using View, Text, and TouchableOpacity for native feel
- [ ] **Implement navigation menu** with React Navigation drawer or modal for mobile navigation
- [ ] **Add user avatar and profile menu** with proper touch handling and visual feedback
- [ ] **Implement notification bell** with badge count and push notification integration
- [ ] **Add search functionality** with native search input and keyboard handling
- [ ] **Test header responsiveness** on different iPhone sizes and orientations
- [ ] **Validate accessibility** with VoiceOver and ensure proper semantic markup`,
    labels: ['frontend', 'ios', 'feature', 'Phase 2: Mobile UI'],
    assignee: 'frontend-team'
  },
  {
    title: "🗺️ Convert Map component to React Native",
    body: `Migrate the web map component to React Native using react-native-maps for location-based features and venue discovery.

### ✅ Task Checklist:
- [ ] **Set up react-native-maps** with proper iOS configuration and API key management
- [ ] **Implement venue discovery** with map markers, clustering, and search functionality
- [ ] **Add location services** with proper permissions and GPS integration for user location
- [ ] **Create venue detail cards** with information, ratings, and booking capabilities
- [ ] **Implement route planning** with directions and estimated travel time to venues
- [ ] **Add offline map support** for areas with poor connectivity using map caching
- [ ] **Test map performance** on different devices and ensure smooth scrolling and zooming
- [ ] **Validate location accuracy** and test with real-world venue data and user locations`,
    labels: ['frontend', 'ios', 'feature', 'Phase 2: Mobile UI'],
    assignee: 'frontend-team'
  },
  {
    title: "💳 Integrate payment system in React Native",
    body: `Implement Stripe payment integration in React Native with Apple Pay support and secure payment processing.

### ✅ Task Checklist:
- [ ] **Set up Stripe React Native SDK** with proper iOS configuration and API key management
- [ ] **Implement Apple Pay integration** with merchant ID and payment sheet configuration
- [ ] **Create payment flow UI** with product selection, cart management, and checkout process
- [ ] **Add 3D Secure authentication** for secure payment processing and fraud prevention
- [ ] **Implement subscription management** for recurring payments and membership tiers
- [ ] **Add payment history** with transaction details and receipt generation
- [ ] **Test payment flows** with Stripe test cards and validate error handling
- [ ] **Validate Apple Pay** on physical devices and ensure proper certification compliance`,
    labels: ['frontend', 'ios', 'feature', 'Phase 4: Firebase + Stripe'],
    assignee: 'frontend-team'
  },
  {
    title: "🔄 Set up automated iOS build pipeline",
    body: `Configure GitHub Actions with Fastlane for automated iOS builds, testing, and TestFlight deployment.

### ✅ Task Checklist:
- [ ] **Configure GitHub Actions workflow** for iOS builds using macOS runners and Xcode 15
- [ ] **Set up Fastlane lanes** for build, test, archive, and upload to TestFlight
- [ ] **Add code signing automation** using Fastlane Match for certificate and provisioning profile management
- [ ] **Implement automated testing** with Jest and React Native Testing Library in CI pipeline
- [ ] **Add build artifact management** with proper versioning and release notes generation
- [ ] **Configure TestFlight upload** with automatic build processing and tester notification
- [ ] **Set up deployment notifications** via Slack, email, or webhook for build status updates
- [ ] **Test full pipeline** end-to-end and ensure it handles errors gracefully with proper rollback`,
    labels: ['ci-cd', 'ios', 'feature', 'Phase 5: Infra + Monitoring'],
    assignee: 'infra-team'
  },
  {
    title: "🏪 Configure App Store Connect integration",
    body: `Set up automated App Store Connect integration for metadata management, screenshots, and release automation.

### ✅ Task Checklist:
- [ ] **Set up App Store Connect API** with proper authentication and API key management
- [ ] **Configure Fastlane deliver** for automated metadata and screenshot uploads
- [ ] **Create metadata templates** for app description, keywords, and release notes
- [ ] **Implement screenshot automation** using Fastlane snapshot for consistent app store images
- [ ] **Add localization support** for multiple languages and regional app store optimization
- [ ] **Set up release automation** with proper versioning and changelog generation
- [ ] **Configure review automation** with automatic submission and status tracking
- [ ] **Test App Store integration** with beta releases and validate metadata accuracy`,
    labels: ['ci-cd', 'ios', 'feature', 'Phase 6: TestFlight Deployment'],
    assignee: 'infra-team'
  },
  {
    title: "🌐 Launch marketing landing page",
    body: `Create and deploy a compelling landing page for SportBeaconAI with app download links, testimonials, and conversion optimization.

### ✅ Task Checklist:
- [ ] **Design landing page layout** with hero section, features, testimonials, and call-to-action
- [ ] **Create responsive design** that works on desktop, tablet, and mobile devices
- [ ] **Add app download links** for TestFlight and App Store with proper tracking
- [ ] **Implement lead capture** with email signup and newsletter subscription
- [ ] **Add social proof** with user testimonials, download counts, and media mentions
- [ ] **Optimize for conversion** with A/B testing and analytics tracking
- [ ] **Deploy to hosting platform** (Framer, Firebase Hosting, or Vercel) with custom domain
- [ ] **Set up analytics** with Google Analytics and conversion tracking for performance monitoring`,
    labels: ['growth', 'frontend', 'feature', 'Phase 7: Local Growth Stack'],
    assignee: 'growth-team'
  },
  {
    title: "📱 Set up social media presence",
    body: `Create and launch official social media accounts for SportBeaconAI with content strategy and community engagement.

### ✅ Task Checklist:
- [ ] **Create Instagram business account** with branded profile and bio optimization
- [ ] **Set up TikTok creator account** with content strategy for sports and fitness audience
- [ ] **Launch Facebook business page** with community features and engagement tools
- [ ] **Develop content calendar** with daily posts, stories, and reels for consistent engagement
- [ ] **Create branded visual assets** including logos, templates, and video content
- [ ] **Implement social media automation** with scheduling tools and cross-platform posting
- [ ] **Set up community management** with response templates and engagement guidelines
- [ ] **Launch influencer partnership program** with local athletes and coaches for authentic promotion`,
    labels: ['growth', 'feature', 'Phase 7: Local Growth Stack'],
    assignee: 'growth-team'
  },
  {
    title: "📋 Generate QR codes and local launch materials",
    body: `Create QR codes for app download and feedback, plus local marketing materials for grassroots launch in Cary/Raleigh/Durham.

### ✅ Task Checklist:
- [ ] **Generate QR codes** for TestFlight download, feedback form, and social media links
- [ ] **Design local marketing materials** including flyers, posters, and business cards
- [ ] **Create venue partnership materials** for local gyms, sports facilities, and schools
- [ ] **Develop email templates** for outreach to local sports organizations and coaches
- [ ] **Set up local event calendar** with meetups, demos, and community engagement activities
- [ ] **Create press kit** with app screenshots, company information, and media contacts
- [ ] **Implement local SEO** with Google My Business and local directory listings
- [ ] **Plan launch event** with venue booking, invitations, and promotional materials`,
    labels: ['growth', 'feature', 'Phase 7: Local Growth Stack'],
    assignee: 'growth-team'
  },
  {
    title: "💼 Implement creator dashboard",
    body: `Build comprehensive dashboard for content creators with earnings tracking, analytics, and payout management.

### ✅ Task Checklist:
- [ ] **Design creator dashboard UI** with earnings overview, content analytics, and performance metrics
- [ ] **Implement earnings tracking** with real-time revenue calculations and historical data
- [ ] **Add content performance analytics** with views, engagement, and audience insights
- [ ] **Create payout management** with Stripe Connect integration and automated transfers
- [ ] **Build content management tools** for organizing videos, highlights, and drill libraries
- [ ] **Add audience insights** with demographic data, engagement patterns, and growth metrics
- [ ] **Implement notification system** for earnings milestones, new followers, and important updates
- [ ] **Test dashboard functionality** with real creator accounts and validate all financial calculations`,
    labels: ['frontend', 'backend', 'feature', 'Phase 8: Monetization Tools'],
    assignee: 'frontend-team'
  },
  {
    title: "💳 Set up Stripe Connect for creator payouts",
    body: `Configure Stripe Connect platform for secure creator onboarding, payment processing, and automated payouts.

### ✅ Task Checklist:
- [ ] **Configure Stripe Connect platform** with proper account types and verification requirements
- [ ] **Implement creator onboarding** with identity verification and bank account setup
- [ ] **Set up payment processing** with platform fees, creator payouts, and tax handling
- [ ] **Add automated payout scheduling** with configurable intervals and minimum thresholds
- [ ] **Implement dispute handling** with proper documentation and resolution workflows
- [ ] **Create financial reporting** with detailed transaction history and tax documentation
- [ ] **Add compliance features** for KYC/AML requirements and regulatory reporting
- [ ] **Test payout system** with test accounts and validate all financial flows and calculations`,
    labels: ['backend', 'feature', 'Phase 8: Monetization Tools'],
    assignee: 'backend-team'
  },
  {
    title: "🎁 Build tipping and reward system",
    body: `Implement user tipping system with badges, rewards, and gamification elements to increase creator engagement.

### ✅ Task Checklist:
- [ ] **Design tipping UI** with preset amounts, custom tips, and payment confirmation
- [ ] **Implement badge system** with achievement tracking and visual rewards for creators
- [ ] **Create reward mechanics** with points, levels, and unlockable content or features
- [ ] **Add social features** with public recognition and leaderboards for top creators
- [ ] **Implement notification system** for tips received, badges earned, and milestone achievements
- [ ] **Build analytics dashboard** for creators to track tips, engagement, and audience growth
- [ ] **Add gamification elements** with streaks, challenges, and community competitions
- [ ] **Test reward system** with real users and validate engagement metrics and retention impact`,
    labels: ['frontend', 'backend', 'feature', 'Phase 8: Monetization Tools'],
    assignee: 'frontend-team'
  }
];

// Main import function
async function importIssues() {
  try {
    console.log('🚀 Starting SportBeaconAI GitHub Issues Import...');
    
    // Create milestone if it doesn't exist
    const milestone = await createMilestone();
    
    // Import all issues
    for (const issue of issues) {
      await createIssue(issue, milestone.number);
      console.log(`✅ Created issue: ${issue.title}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 All issues imported successfully!');
    
  } catch (error) {
    console.error('❌ Error importing issues:', error);
    process.exit(1);
  }
}

// Create milestone
async function createMilestone() {
  try {
    const { data: milestones } = await octokit.issues.listMilestones({
      owner: config.owner,
      repo: config.repo,
      state: 'open'
    });
    
    let milestone = milestones.find(m => m.title === config.milestone);
    
    if (!milestone) {
      const { data } = await octokit.issues.createMilestone({
        owner: config.owner,
        repo: config.repo,
        title: config.milestone,
        description: 'Complete iOS public launch of SportBeaconAI',
        due_on: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString() // 12 weeks
      });
      milestone = data;
      console.log(`📅 Created milestone: ${milestone.title}`);
    }
    
    return milestone;
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

// Create individual issue
async function createIssue(issueData, milestoneNumber) {
  try {
    const { data } = await octokit.issues.create({
      owner: config.owner,
      repo: config.repo,
      title: issueData.title,
      body: issueData.body,
      labels: issueData.labels,
      assignees: issueData.assignee ? [issueData.assignee] : undefined,
      milestone: milestoneNumber
    });
    
    return data;
  } catch (error) {
    console.error(`Error creating issue "${issueData.title}":`, error);
    throw error;
  }
}

// Run import if called directly
if (require.main === module) {
  if (!config.token) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  importIssues();
}

module.exports = { importIssues, issues };
```

### Setup Instructions

1. **Install dependencies**:
```bash
npm install @octokit/rest
```

2. **Set up GitHub token**:
```bash
export GITHUB_TOKEN=your_personal_access_token_here
```

3. **Update configuration**:
Edit the `config` object in the script to match your repository:
```javascript
const config = {
  owner: 'your-github-username',
  repo: 'sportbeacon-ai',
  token: process.env.GITHUB_TOKEN,
  milestone: 'v1.0 iOS Public Launch'
};
```

4. **Run the import**:
```bash
node scripts/import-github-issues.js
```

### Expected Output

```
🚀 Starting SportBeaconAI GitHub Issues Import...
📅 Created milestone: v1.0 iOS Public Launch
✅ Created issue: ✅ Convert all major web components to React Native
✅ Created issue: 🧪 Validate all mobile screens for responsiveness
✅ Created issue: 📸 Prepare App Store screenshots and marketing copy
...
🎉 All issues imported successfully!
```

### Post-Import Setup

After running the import script:

1. **Create project boards** manually in GitHub or use the GitHub CLI:
```bash
gh project create "SportBeaconAI iOS Launch Pipeline" --owner your-username --repo sportbeacon-ai
```

2. **Set up automation workflows** by copying the workflow files to `.github/workflows/`

3. **Configure team assignments** by updating the assignee values in the script

4. **Review and adjust** issue priorities and labels as needed

### Verification

Check that all issues were created correctly:

1. Visit your repository's Issues page
2. Verify all 24 issues are present with proper labels
3. Confirm the milestone is created and populated
4. Check that team assignments are correct
5. Validate that all checklists are properly formatted

---

## 🎯 Summary

This import script will automatically create all 24 GitHub issues for the SportBeaconAI iOS launch with:

- ✅ Proper titles and descriptions
- ✅ Detailed task checklists
- ✅ Appropriate labels and assignees
- ✅ Milestone association
- ✅ Rate limiting protection
- ✅ Error handling and logging

**Ready to run and import all issues for the complete iOS launch plan! 🚀** 