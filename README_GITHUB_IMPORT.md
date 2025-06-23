# SportBeaconAI GitHub Issues Import Guide

## 🚀 Complete iOS Launch Project Setup

This guide will help you import all 24 GitHub issues and set up project boards for the SportBeaconAI iOS public launch.

## 📋 What's Included

### 24 Comprehensive Issues
- **Mobile iOS Launch** (7 issues) - React Native, Xcode, TestFlight
- **AI Features** (3 issues) - Drill feedback, trend analysis, highlight tagging
- **Backend** (3 issues) - FastAPI, auth, metrics
- **Web to Native Migration** (3 issues) - Header, map, payments
- **CI/CD + App Store** (2 issues) - Fastlane, automation
- **Growth Stack** (3 issues) - Landing page, social media, local launch
- **Creator Monetization** (3 issues) - Dashboard, Stripe Connect, rewards

### Project Boards
- iOS Launch Pipeline (Kanban)
- Sprint Planning & Milestones
- Bug Triage & Quality Assurance

### Automation Workflows
- Auto-labeling and assignment
- Milestone management
- Weekly/monthly reporting
- Slack notifications

## 🛠️ Setup Instructions

### 1. Prerequisites

```bash
# Install Node.js dependencies
npm install @octokit/rest

# Set up GitHub Personal Access Token
export GITHUB_TOKEN=your_personal_access_token_here
```

**Required Token Permissions:**
- `repo` (Full control of private repositories)
- `project` (Full control of organization projects)
- `workflow` (Update GitHub Action workflows)

### 2. Configure Repository

Edit `scripts/import-github-issues.js`:

```javascript
const config = {
  owner: 'your-github-username',  // Your GitHub username
  repo: 'sportbeacon-ai',         // Repository name
  token: process.env.GITHUB_TOKEN,
  milestone: 'v1.0 iOS Public Launch'
};
```

### 3. Run Import Script

```bash
# Navigate to project root
cd sportbeacon-ai

# Run the import script
node scripts/import-github-issues.js
```

### 4. Expected Output

```
🚀 Starting SportBeaconAI GitHub Issues Import...
📅 Created milestone: v1.0 iOS Public Launch
✅ Created issue: ✅ Convert all major web components to React Native
✅ Created issue: 🧪 Validate all mobile screens for responsiveness
✅ Created issue: 📸 Prepare App Store screenshots and marketing copy
...
🎉 All issues imported successfully!
```

## 📊 Project Board Setup

### 1. Create Project Boards

**Option A: GitHub Web Interface**
1. Go to your repository
2. Click "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name: "SportBeaconAI iOS Launch Pipeline"

**Option B: GitHub CLI**
```bash
# Install GitHub CLI
gh auth login

# Create project board
gh project create "SportBeaconAI iOS Launch Pipeline" \
  --owner your-username \
  --repo sportbeacon-ai \
  --format board
```

### 2. Configure Board Columns

**iOS Launch Pipeline Board:**
1. **Backlog** - New issues and feature requests
2. **To Do** - Prioritized tasks ready for development
3. **In Progress** - Currently being worked on
4. **Review** - Code review and testing phase
5. **Done** - Completed and deployed

### 3. Add Issues to Board

```bash
# Add all issues to the project board
gh project item-add 1 --owner your-username --repo sportbeacon-ai --project-id 1
```

## 🔄 Automation Setup

### 1. Copy Workflow Files

Copy the automation workflows to `.github/workflows/`:

```bash
# Create workflows directory
mkdir -p .github/workflows

# Copy workflow files
cp .github/ISSUES/automation-workflows.md .github/workflows/
```

### 2. Configure Secrets

Add required secrets to your repository:

```bash
# Add Slack webhook (optional)
gh secret set SLACK_WEBHOOK_URL --body "your-slack-webhook-url"

# Add other required secrets
gh secret set GITHUB_TOKEN --body "$GITHUB_TOKEN"
```

### 3. Enable Workflows

The following workflows will be automatically enabled:

- **Auto-labeling** - Categorizes issues based on content
- **Auto-assignment** - Routes issues to team members
- **Milestone management** - Tracks progress towards launch
- **Weekly reporting** - Automated progress updates
- **Slack notifications** - Team communication

## 🏷️ Issue Labels and Assignees

### Labels Created
- `frontend` - React Native and UI components
- `backend` - API and server-side development
- `ai` - Machine learning and AI features
- `infra` - Infrastructure and DevOps
- `growth` - Marketing and user acquisition
- `ios` - iOS-specific features and testing
- `android` - Android development
- `ci-cd` - Continuous integration and deployment
- `security` - Security and authentication
- `monitoring` - Analytics and performance monitoring
- `feature` - New feature development
- `bug` - Bug fixes and issues
- `priority-high` - Critical path items

### Phase Labels
- `Phase 1: Core Setup`
- `Phase 2: Mobile UI`
- `Phase 3: AI Feedback Pipeline`
- `Phase 4: Firebase + Stripe`
- `Phase 5: Infra + Monitoring`
- `Phase 6: TestFlight Deployment`
- `Phase 7: Local Growth Stack`
- `Phase 8: Monetization Tools`

### Team Assignees
- `frontend-team` - React Native and UI development
- `backend-team` - API and server-side development
- `ai-team` - AI and machine learning features
- `infra-team` - Infrastructure and DevOps
- `growth-team` - Marketing and user acquisition

## 📅 12-Week Launch Timeline

### Week 1-2: Foundation
- Complete iOS project setup and file generation
- Set up CI/CD pipelines and automation
- Begin web to React Native component migration

### Week 3-4: Core Features
- Complete AI feedback pipeline implementation
- Finish Firebase and Stripe integration
- Complete mobile UI parity and testing

### Week 5-6: Testing & Polish
- Full regression testing on iPhone 11
- App Store preparation and metadata
- Performance optimization and bug fixes

### Week 7-8: Launch Preparation
- TestFlight deployment and beta testing
- Marketing materials and social media setup
- Local launch planning and community outreach

### Week 9-10: Public Launch
- App Store submission and review process
- Marketing campaign execution
- Community engagement and feedback collection

### Week 11-12: Post-Launch
- Performance monitoring and optimization
- User feedback integration and feature updates
- Android development kickoff

## 🎯 Verification Checklist

After running the import script, verify:

- [ ] **24 issues created** with proper titles and descriptions
- [ ] **Milestone created** with "v1.0 iOS Public Launch" title
- [ ] **All labels applied** correctly to issues
- [ ] **Team assignments** set appropriately
- [ ] **Task checklists** included in each issue
- [ ] **Phase labels** applied for timeline tracking
- [ ] **Project board** created and configured
- [ ] **Automation workflows** enabled and working

## 🔧 Troubleshooting

### Common Issues

**Rate Limiting**
```bash
# If you hit GitHub API rate limits, increase delay in script
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

**Permission Errors**
```bash
# Ensure token has correct permissions
gh auth status
gh token list
```

**Missing Labels**
```bash
# Create missing labels manually
gh label create "frontend" --color "0366d6" --description "React Native and UI components"
```

### Debug Mode

Enable debug logging:

```javascript
// Add to import script
const octokit = new Octokit({
  auth: config.token,
  log: console
});
```

## 📈 Post-Import Actions

### 1. Review and Adjust
- Review all issues for accuracy
- Adjust priorities and assignments
- Update timelines if needed
- Add additional context or requirements

### 2. Team Onboarding
- Share project board with team members
- Set up team notifications
- Create team-specific workflows
- Establish communication channels

### 3. Start Development
- Begin with Phase 1 issues
- Set up development environment
- Create feature branches
- Start implementing core features

### 4. Monitor Progress
- Use project board for tracking
- Review weekly reports
- Adjust priorities based on progress
- Celebrate milestones and achievements

## 🎉 Success Metrics

Track these metrics throughout the launch:

- **Issue Completion Rate** - % of issues completed on time
- **Sprint Velocity** - Issues completed per sprint
- **Code Quality** - Bug count and resolution time
- **Team Productivity** - Time to complete tasks
- **Launch Readiness** - Milestone completion percentage

## 📞 Support

For issues with the import process:

1. Check the troubleshooting section above
2. Review GitHub API documentation
3. Verify token permissions
4. Check repository access rights
5. Contact the development team

---

**Ready to launch SportBeaconAI iOS! 🚀**

This comprehensive setup provides everything needed for a successful iOS public launch with proper project management, automation, and team coordination. 