# SportBeaconAI GitHub Automation Workflows

## 🔄 Automated Issue Management

### Workflow 1: Issue Auto-Labeling
**File**: `.github/workflows/auto-label.yml`

```yaml
name: Auto-Label Issues

on:
  issues:
    types: [opened, edited, labeled, unlabeled]

jobs:
  auto-label:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-label based on title
        uses: actions/github-script@v6
        with:
          script: |
            const title = context.payload.issue.title.toLowerCase();
            const labels = [];
            
            // Platform labels
            if (title.includes('ios') || title.includes('iphone') || title.includes('testflight')) {
              labels.push('ios');
            }
            if (title.includes('android')) {
              labels.push('android');
            }
            
            // Feature labels
            if (title.includes('ai') || title.includes('machine learning')) {
              labels.push('ai');
            }
            if (title.includes('react native') || title.includes('frontend')) {
              labels.push('frontend');
            }
            if (title.includes('backend') || title.includes('api') || title.includes('firebase')) {
              labels.push('backend');
            }
            if (title.includes('stripe') || title.includes('payment')) {
              labels.push('backend');
            }
            if (title.includes('ci/cd') || title.includes('fastlane') || title.includes('github actions')) {
              labels.push('ci-cd');
            }
            if (title.includes('growth') || title.includes('marketing') || title.includes('social')) {
              labels.push('growth');
            }
            
            // Add labels if not already present
            for (const label of labels) {
              if (!context.payload.issue.labels.some(l => l.name === label)) {
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: context.payload.issue.number,
                  labels: [label]
                });
              }
            }
```

### Workflow 2: Auto-Assignment Based on Labels
**File**: `.github/workflows/auto-assign.yml`

```yaml
name: Auto-Assign Issues

on:
  issues:
    types: [opened, labeled]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-assign based on labels
        uses: actions/github-script@v6
        with:
          script: |
            const labels = context.payload.issue.labels.map(l => l.name);
            let assignee = null;
            
            // Determine assignee based on labels
            if (labels.includes('frontend')) {
              assignee = 'frontend-team';
            } else if (labels.includes('backend')) {
              assignee = 'backend-team';
            } else if (labels.includes('ai')) {
              assignee = 'ai-team';
            } else if (labels.includes('infra') || labels.includes('ci-cd')) {
              assignee = 'infra-team';
            } else if (labels.includes('growth')) {
              assignee = 'growth-team';
            }
            
            // Assign if not already assigned
            if (assignee && !context.payload.issue.assignees.length) {
              await github.rest.issues.addAssignees({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.issue.number,
                assignees: [assignee]
              });
            }
```

### Workflow 3: Milestone Management
**File**: `.github/workflows/milestone-management.yml`

```yaml
name: Milestone Management

on:
  issues:
    types: [opened, labeled, unlabeled]

jobs:
  milestone-management:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-add to milestone based on phase
        uses: actions/github-script@v6
        with:
          script: |
            const labels = context.payload.issue.labels.map(l => l.name);
            const phaseLabels = [
              'Phase 1: Core Setup',
              'Phase 2: Mobile UI',
              'Phase 3: AI Feedback',
              'Phase 4: Firebase + Stripe',
              'Phase 5: Infra + Monitoring',
              'Phase 6: TestFlight',
              'Phase 7: Growth Stack',
              'Phase 8: Monetization'
            ];
            
            const phaseLabel = labels.find(l => phaseLabels.includes(l));
            
            if (phaseLabel && !context.payload.issue.milestone) {
              // Get or create milestone
              const milestoneTitle = 'v1.0 iOS Public Launch';
              let milestone;
              
              try {
                const milestones = await github.rest.issues.listMilestones({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  state: 'open'
                });
                
                milestone = milestones.data.find(m => m.title === milestoneTitle);
                
                if (!milestone) {
                  milestone = await github.rest.issues.createMilestone({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    title: milestoneTitle,
                    description: 'Complete iOS public launch of SportBeaconAI',
                    due_on: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString() // 12 weeks
                  });
                }
                
                // Add issue to milestone
                await github.rest.issues.update({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: context.payload.issue.number,
                  milestone: milestone.number
                });
              } catch (error) {
                console.error('Error managing milestone:', error);
              }
            }
```

---

## 📊 Project Board Automation

### Workflow 4: Project Board Sync
**File**: `.github/workflows/project-board-sync.yml`

```yaml
name: Project Board Sync

on:
  issues:
    types: [opened, closed, reopened, transferred]
  pull_request:
    types: [opened, closed, reopened, ready_for_review]

jobs:
  project-board-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync with project board
        uses: actions/github-script@v6
        with:
          script: |
            const projectNumber = 1; // iOS Launch Pipeline board
            const itemType = context.eventName === 'pull_request' ? 'PullRequest' : 'Issue';
            const itemId = context.payload[itemType.toLowerCase()].node_id;
            
            // Get project board
            const projects = await github.graphql(`
              query {
                organization(login: "${context.repo.owner}") {
                  projects(first: 10) {
                    nodes {
                      number
                      title
                    }
                  }
                }
              }
            `);
            
            const project = projects.data.organization.projects.nodes.find(p => p.number === projectNumber);
            
            if (project) {
              // Add item to project board
              await github.graphql(`
                mutation {
                  addProjectV2Item(input: {
                    projectId: "${project.id}"
                    contentId: "${itemId}"
                  }) {
                    item {
                      id
                    }
                  }
                }
              `);
            }
```

---

## 🚀 Launch Checklist Automation

### Workflow 5: Launch Checklist Generator
**File**: `.github/workflows/launch-checklist.yml`

```yaml
name: Launch Checklist Generator

on:
  issues:
    types: [opened, labeled]

jobs:
  launch-checklist:
    runs-on: ubuntu-latest
    steps:
      - name: Generate launch checklist
        uses: actions/github-script@v6
        with:
          script: |
            const labels = context.payload.issue.labels.map(l => l.name);
            
            if (labels.includes('launch-critical')) {
              const checklist = `
### 🚀 Launch Checklist
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] App Store metadata ready
- [ ] Marketing materials prepared
- [ ] TestFlight build uploaded
- [ ] Beta testing completed
- [ ] App Store submission ready
- [ ] Launch announcement prepared
              `;
              
              // Add checklist to issue body
              const currentBody = context.payload.issue.body || '';
              const updatedBody = currentBody + '\n\n' + checklist;
              
              await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.issue.number,
                body: updatedBody
              });
            }
```

---

## 📈 Reporting Automation

### Workflow 6: Weekly Sprint Report
**File**: `.github/workflows/weekly-report.yml`

```yaml
name: Weekly Sprint Report

on:
  schedule:
    - cron: '0 17 * * 5' # Every Friday at 5 PM

jobs:
  weekly-report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate weekly report
        uses: actions/github-script@v6
        with:
          script: |
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            // Get issues closed in the last week
            const closedIssues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'closed',
              since: oneWeekAgo.toISOString()
            });
            
            // Get issues opened in the last week
            const openedIssues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              since: oneWeekAgo.toISOString()
            });
            
            // Generate report
            const report = `
## 📊 Weekly Sprint Report - ${new Date().toLocaleDateString()}

### ✅ Completed This Week
${closedIssues.data.map(issue => `- ${issue.title} (#${issue.number})`).join('\n')}

### 🔄 New Issues This Week
${openedIssues.data.map(issue => `- ${issue.title} (#${issue.number})`).join('\n')}

### 📈 Metrics
- **Issues Closed**: ${closedIssues.data.length}
- **Issues Opened**: ${openedIssues.data.length}
- **Net Progress**: ${closedIssues.data.length - openedIssues.data.length}

### 🎯 Next Week Priorities
- Focus on high-priority issues
- Complete current sprint goals
- Prepare for next milestone
            `;
            
            // Create report issue
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📊 Weekly Sprint Report - ${new Date().toLocaleDateString()}`,
              body: report,
              labels: ['report', 'automated']
            });
```

### Workflow 7: Monthly Launch Progress Report
**File**: `.github/workflows/monthly-progress.yml`

```yaml
name: Monthly Launch Progress Report

on:
  schedule:
    - cron: '0 9 1 * *' # First day of each month at 9 AM

jobs:
  monthly-progress:
    runs-on: ubuntu-latest
    steps:
      - name: Generate monthly progress report
        uses: actions/github-script@v6
        with:
          script: |
            // Get all issues in the v1.0 milestone
            const milestoneIssues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              milestone: 'v1.0 iOS Public Launch',
              state: 'all'
            });
            
            const totalIssues = milestoneIssues.data.length;
            const closedIssues = milestoneIssues.data.filter(issue => issue.state === 'closed').length;
            const progress = Math.round((closedIssues / totalIssues) * 100);
            
            // Group by phase
            const phaseProgress = {};
            const phases = [
              'Phase 1: Core Setup',
              'Phase 2: Mobile UI',
              'Phase 3: AI Feedback',
              'Phase 4: Firebase + Stripe',
              'Phase 5: Infra + Monitoring',
              'Phase 6: TestFlight',
              'Phase 7: Growth Stack',
              'Phase 8: Monetization'
            ];
            
            phases.forEach(phase => {
              const phaseIssues = milestoneIssues.data.filter(issue => 
                issue.labels.some(label => label.name === phase)
              );
              const phaseClosed = phaseIssues.filter(issue => issue.state === 'closed').length;
              phaseProgress[phase] = {
                total: phaseIssues.length,
                closed: phaseClosed,
                progress: phaseIssues.length > 0 ? Math.round((phaseClosed / phaseIssues.length) * 100) : 0
              };
            });
            
            // Generate report
            const report = `
## 🚀 Monthly Launch Progress Report - ${new Date().toLocaleDateString()}

### 📊 Overall Progress
- **Total Issues**: ${totalIssues}
- **Completed**: ${closedIssues}
- **Progress**: ${progress}%

### 📋 Phase Breakdown
${phases.map(phase => {
  const data = phaseProgress[phase];
  return `#### ${phase}
- Progress: ${data.progress}% (${data.closed}/${data.total})
- Status: ${data.progress === 100 ? '✅ Complete' : data.progress > 50 ? '🟡 In Progress' : '🔴 Not Started'}`;
}).join('\n\n')}

### 🎯 Next Month Goals
- Complete remaining Phase 2 and 3 items
- Begin Phase 4 Firebase integration
- Set up CI/CD pipeline
- Prepare TestFlight deployment

### ⚠️ Risks & Blockers
- Monitor resource allocation
- Track external dependencies
- Review timeline projections
            `;
            
            // Create report issue
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚀 Monthly Launch Progress Report - ${new Date().toLocaleDateString()}`,
              body: report,
              labels: ['report', 'automated', 'milestone']
            });
```

---

## 🔔 Notification Automation

### Workflow 8: Slack Notifications
**File**: `.github/workflows/slack-notifications.yml`

```yaml
name: Slack Notifications

on:
  issues:
    types: [opened, closed, labeled]
  pull_request:
    types: [opened, closed, merged]

jobs:
  slack-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#sportbeacon-ios'
          text: |
            ${{ github.event_name }}: ${{ github.event.issue.title || github.event.pull_request.title }}
            By: ${{ github.actor }}
            Repository: ${{ github.repository }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
```

---

## 📋 Issue Template Automation

### Workflow 9: Template Validation
**File**: `.github/workflows/template-validation.yml`

```yaml
name: Validate Issue Templates

on:
  pull_request:
    paths:
      - '.github/ISSUE_TEMPLATE/**'

jobs:
  validate-templates:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Validate YAML syntax
        run: |
          for file in .github/ISSUE_TEMPLATE/*.yml; do
            echo "Validating $file"
            python -c "import yaml; yaml.safe_load(open('$file'))"
          done
          
      - name: Check required fields
        run: |
          for file in .github/ISSUE_TEMPLATE/*.yml; do
            echo "Checking required fields in $file"
            python -c "
            import yaml
            with open('$file') as f:
              data = yaml.safe_load(f)
              for field in data.get('body', []):
                if field.get('validations', {}).get('required'):
                  print(f'Required field: {field.get(\"id\", \"unknown\")}')
            "
          done
```

---

## 🎯 Summary

These automation workflows provide:

1. **Auto-labeling** - Automatically categorize issues based on content
2. **Auto-assignment** - Route issues to appropriate team members
3. **Milestone management** - Track progress towards launch goals
4. **Project board sync** - Keep boards updated automatically
5. **Launch checklists** - Ensure quality gates are met
6. **Reporting** - Automated progress tracking and insights
7. **Notifications** - Keep team informed of important events
8. **Template validation** - Ensure issue templates are properly configured

**All workflows are ready for deployment and will streamline the SportBeaconAI iOS launch process! 🚀** 