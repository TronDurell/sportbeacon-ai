# 🚀 Cursor + Todo2 Integration Prompt

## **Automated Deployment Readiness Workflow**

> **Copy this prompt into Cursor and run it:**

---

**"Run `scripts/pre-deploy-check.js` and based on the results:**

1. **Generate a Todo2 board called `🚀 Production Readiness Fixes`**
2. **Add tasks under `Week 1 – Critical` for each Firebase function still missing validation**
3. **Add tasks under `Console Cleanup` for each file with console.log still remaining**
4. **Create a card for 'Write missing test coverage' if test count < 10**
5. **Tag all tasks with #deployment #critical #firebase or #testing**
6. **Add a completion percentage chart for Firebase validation**
7. **Highlight any `.env` files missing**

**Ready the board to update daily and notify on <80% readiness score.**

**Then create a GitHub Action that runs this check on every PR and blocks deployment if readiness < 80%."**

---

## **Expected Todo2 Board Structure**

```markdown
# 🚀 Production Readiness Fixes

## 📊 **Current Status**
- **Overall Readiness:** 65%
- **Firebase Validation:** 64% (16/25 functions)
- **Console.log Cleanup:** 100% ✅
- **Test Coverage:** Adequate ✅
- **Environment:** Missing .env files ⚠️

## 🔴 **Week 1 – Critical**
- [ ] Validate Firebase function: authRegister #deployment #critical #firebase
- [ ] Validate Firebase function: pdfReports #deployment #critical #firebase
- [ ] Validate Firebase function: uploadPdf #deployment #critical #firebase
- [ ] Validate Firebase function: voiceToken #deployment #critical #firebase
- [ ] Validate Firebase function: audioGenerate #deployment #critical #firebase
- [ ] Validate Firebase function: shareEmail #deployment #critical #firebase
- [ ] Validate Firebase function: reportsShare #deployment #critical #firebase
- [ ] Validate Firebase function: videoInit #deployment #critical #firebase
- [ ] Validate Firebase function: tipsCreate #deployment #critical #firebase
- [ ] Validate Firebase function: playerAssessment #deployment #critical #firebase

## 🧹 **Console Cleanup**
- ✅ All console.log statements removed

## 🧪 **Testing**
- ✅ Firebase functions test suite created (50+ tests)

## ⚙️ **Environment**
- [ ] Create .env file #deployment #environment
- [ ] Create .env.local file #deployment #environment
- [ ] Create .env.production file #deployment #environment

## 📈 **Progress Tracking**
- **Firebase Functions:** 16/25 (64%) → Target: 25/25 (100%)
- **Security Score:** 🟡 MEDIUM → Target: 🟢 LOW
- **Production Readiness:** 65% → Target: 95%+
```

---

## **GitHub Action Template**

```yaml
name: Pre-Deployment Readiness Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  readiness-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run Pre-Deployment Risk Scoring
      run: node scripts/pre-deployment-check.js
      env:
        CI: true
    
    - name: Upload Todo2 Data
      uses: actions/upload-artifact@v3
      with:
        name: deployment-readiness-data
        path: TODO2_DEPLOYMENT_DATA.json
    
    - name: Comment PR with Results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const data = JSON.parse(fs.readFileSync('TODO2_DEPLOYMENT_DATA.json', 'utf8'));
          
          const comment = `## 🚀 Pre-Deployment Readiness Check
          
          **Overall Readiness:** ${data.overallReadiness}%
          
          ${data.overallReadiness >= 80 ? '✅ **READY FOR DEPLOYMENT**' : '🚨 **DEPLOYMENT BLOCKED**'}
          
          ### 📊 Breakdown:
          - **Critical Tasks:** ${data.week1Critical.length} remaining
          - **Cleanup Tasks:** ${data.consoleCleanup.length} remaining
          - **Testing Tasks:** ${data.testing.length} remaining
          - **Environment Tasks:** ${data.environment.length} remaining
          
          ${data.overallReadiness < 80 ? '⚠️ **Please complete critical tasks before merging**' : '🎉 **All checks passed!**'}
          `;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

---

## **Usage Instructions**

1. **Run the script:** `node scripts/pre-deployment-check.js`
2. **Review the generated data:** `TODO2_DEPLOYMENT_DATA.json`
3. **Create Todo2 board** using the prompt above
4. **Set up GitHub Action** for automated checks
5. **Configure daily reminders** for readiness updates

---

## **Benefits**

- **Automated Risk Assessment:** No manual checking required
- **CI/CD Integration:** Blocks unsafe deployments
- **Visual Progress Tracking:** Clear metrics and charts
- **Actionable Tasks:** Specific, tagged items to complete
- **Team Collaboration:** Shared understanding of readiness status

---

*This transforms deployment readiness from a manual checklist into an automated, data-driven system.* 