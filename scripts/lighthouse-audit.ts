#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
}

interface AuditReport {
  timestamp: string;
  url: string;
  scores: LighthouseResult;
  issues: string[];
  recommendations: string[];
}

class LighthouseAuditor {
  private readonly outputDir = path.join(process.cwd(), 'audit');
  private readonly reportFile = path.join(this.outputDir, 'FRONTEND_LIGHTHOUSE_REPORT.md');

  constructor(private readonly targetUrl: string = 'http://localhost:3000') {}

  async runAudit(): Promise<void> {
    
    // Create audit directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    try {
      // Run Lighthouse audit
      const result = await this.runLighthouse();
      
      // Generate report
      const report = this.generateReport(result);
      
      // Save report
      this.saveReport(report);
      
      
    } catch (error) {
      console.error('❌ Lighthouse audit failed:', error);
      process.exit(1);
    }
  }

  private async runLighthouse(): Promise<LighthouseResult> {
    
    const command = `npx lighthouse ${this.targetUrl} --output=json --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo`;
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      const data = JSON.parse(output);
      
      return {
        performance: Math.round(data.lhr.categories.performance.score * 100),
        accessibility: Math.round(data.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(data.lhr.categories['best-practices'].score * 100),
        seo: Math.round(data.lhr.categories.seo.score * 100),
        firstContentfulPaint: Math.round(data.lhr.audits['first-contentful-paint'].numericValue),
        largestContentfulPaint: Math.round(data.lhr.audits['largest-contentful-paint'].numericValue),
        cumulativeLayoutShift: Math.round(data.lhr.audits['cumulative-layout-shift'].numericValue * 1000) / 1000,
        totalBlockingTime: Math.round(data.lhr.audits['total-blocking-time'].numericValue),
        speedIndex: Math.round(data.lhr.audits['speed-index'].numericValue)
      };
    } catch (error) {
      throw new Error(`Lighthouse command failed: ${error}`);
    }
  }

  private generateReport(result: LighthouseResult): AuditReport {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for issues
    if (result.performance < 90) {
      issues.push(`Performance score is ${result.performance}/100 (below 90 threshold)`);
      recommendations.push('Optimize bundle size and implement code splitting');
      recommendations.push('Enable compression and caching headers');
      recommendations.push('Optimize images and use modern formats (WebP)');
    }

    if (result.accessibility < 90) {
      issues.push(`Accessibility score is ${result.accessibility}/100 (below 90 threshold)`);
      recommendations.push('Add proper ARIA labels and roles');
      recommendations.push('Ensure proper color contrast ratios');
      recommendations.push('Add keyboard navigation support');
    }

    if (result.bestPractices < 90) {
      issues.push(`Best Practices score is ${result.bestPractices}/100 (below 90 threshold)`);
      recommendations.push('Use HTTPS and secure headers');
      recommendations.push('Implement proper error handling');
      recommendations.push('Follow modern web development practices');
    }

    if (result.seo < 90) {
      issues.push(`SEO score is ${result.seo}/100 (below 90 threshold)`);
      recommendations.push('Add proper meta tags and descriptions');
      recommendations.push('Implement structured data markup');
      recommendations.push('Optimize for mobile-first indexing');
    }

    // Performance metrics analysis
    if (result.firstContentfulPaint > 2000) {
      issues.push(`First Contentful Paint is ${result.firstContentfulPaint}ms (above 2000ms threshold)`);
      recommendations.push('Optimize critical rendering path');
      recommendations.push('Reduce server response time');
    }

    if (result.largestContentfulPaint > 2500) {
      issues.push(`Largest Contentful Paint is ${result.largestContentfulPaint}ms (above 2500ms threshold)`);
      recommendations.push('Optimize images and fonts');
      recommendations.push('Implement lazy loading for non-critical resources');
    }

    if (result.cumulativeLayoutShift > 0.1) {
      issues.push(`Cumulative Layout Shift is ${result.cumulativeLayoutShift} (above 0.1 threshold)`);
      recommendations.push('Set explicit dimensions for images and videos');
      recommendations.push('Avoid inserting content above existing content');
    }

    if (result.totalBlockingTime > 300) {
      issues.push(`Total Blocking Time is ${result.totalBlockingTime}ms (above 300ms threshold)`);
      recommendations.push('Split long tasks into smaller chunks');
      recommendations.push('Optimize JavaScript execution');
    }

    return {
      timestamp: new Date().toISOString(),
      url: this.targetUrl,
      scores: result,
      issues,
      recommendations
    };
  }

  private saveReport(report: AuditReport): void {
    const markdown = this.generateMarkdown(report);
    fs.writeFileSync(this.reportFile, markdown, 'utf8');
  }

  private generateMarkdown(report: AuditReport): string {
    const { scores, issues, recommendations } = report;
    
    const getScoreColor = (score: number): string => {
      if (score >= 90) return '🟢';
      if (score >= 50) return '🟡';
      return '🔴';
    };

    const getScoreStatus = (score: number): string => {
      if (score >= 90) return 'PASS';
      if (score >= 50) return 'NEEDS IMPROVEMENT';
      return 'FAIL';
    };

    return `# SportBeaconAI Frontend - Lighthouse Performance Audit

## 📊 Audit Summary

**Date:** ${new Date(report.timestamp).toLocaleString()}
**URL:** ${report.url}
**Status:** ${issues.length === 0 ? '✅ All metrics passing' : '⚠️ Issues detected'}

## 🎯 Performance Scores

| Category | Score | Status | Details |
|----------|-------|--------|---------|
| Performance | ${scores.performance}/100 ${getScoreColor(scores.performance)} | ${getScoreStatus(scores.performance)} | Core Web Vitals and loading performance |
| Accessibility | ${scores.accessibility}/100 ${getScoreColor(scores.accessibility)} | ${getScoreStatus(scores.accessibility)} | WCAG compliance and usability |
| Best Practices | ${scores.bestPractices}/100 ${getScoreColor(scores.bestPractices)} | ${getScoreStatus(scores.bestPractices)} | Modern web development standards |
| SEO | ${scores.seo}/100 ${getScoreColor(scores.seo)} | ${getScoreStatus(scores.seo)} | Search engine optimization |

## ⚡ Core Web Vitals

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| First Contentful Paint | ${scores.firstContentfulPaint}ms | < 2000ms | ${scores.firstContentfulPaint < 2000 ? '✅' : '❌'} |
| Largest Contentful Paint | ${scores.largestContentfulPaint}ms | < 2500ms | ${scores.largestContentfulPaint < 2500 ? '✅' : '❌'} |
| Cumulative Layout Shift | ${scores.cumulativeLayoutShift} | < 0.1 | ${scores.cumulativeLayoutShift < 0.1 ? '✅' : '❌'} |
| Total Blocking Time | ${scores.totalBlockingTime}ms | < 300ms | ${scores.totalBlockingTime < 300 ? '✅' : '❌'} |
| Speed Index | ${scores.speedIndex}ms | < 3400ms | ${scores.speedIndex < 3400 ? '✅' : '❌'} |

## 🚨 Issues Detected

${issues.length === 0 ? '✅ No issues detected - all metrics are within acceptable ranges.' : issues.map(issue => `- ${issue}`).join('\n')}

## 💡 Recommendations

${recommendations.length === 0 ? '🎉 No specific recommendations needed - performance is optimal!' : recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔧 Next Steps

1. **Immediate Actions:**
   ${issues.length > 0 ? '- Address critical issues identified above' : '- Monitor performance metrics regularly'}
   - Set up automated performance monitoring
   - Implement performance budgets

2. **Ongoing Optimization:**
   - Regular Lighthouse audits (weekly/monthly)
   - Performance regression testing
   - User experience monitoring

3. **Team Processes:**
   - Include performance checks in CI/CD pipeline
   - Performance review in code reviews
   - Regular team training on performance best practices

---

*Report generated by Lighthouse CI on ${new Date(report.timestamp).toLocaleString()}*
`;
  }
}

// CLI execution
if (require.main === module) {
  const targetUrl = process.argv[2] || 'http://localhost:3000';
  const auditor = new LighthouseAuditor(targetUrl);
  
  auditor.runAudit()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export default LighthouseAuditor; 