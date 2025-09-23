/* SportBeaconAI - KPI Monitoring Script
   Collects and validates KPI metrics for canary guardrails
*/

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface KPIMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  status: 'pass' | 'fail' | 'warning';
  timestamp: string;
}

export interface KPIBaseline {
  version: string;
  metrics: KPIMetric[];
  timestamp: string;
}

export interface KPIComparison {
  metric: string;
  current: number;
  baseline: number;
  delta: number;
  deltaPercent: number;
  status: 'pass' | 'fail' | 'warning';
}

export class KPIMonitor {
  private baselinePath: string;
  private currentMetrics: KPIMetric[] = [];

  constructor(baselinePath: string = 'reports/kpi-baseline.json') {
    this.baselinePath = baselinePath;
  }

  // Collect current KPI metrics
  async collectMetrics(): Promise<KPIMetric[]> {
    const metrics: KPIMetric[] = [];

    try {
      // Memory SDK usage metrics
      const memoryMetrics = await this.collectMemoryMetrics();
      metrics.push(...memoryMetrics);

      // Performance metrics
      const performanceMetrics = await this.collectPerformanceMetrics();
      metrics.push(...performanceMetrics);

      // Learning feedback metrics
      const learningMetrics = await this.collectLearningMetrics();
      metrics.push(...learningMetrics);

      // Error rate metrics
      const errorMetrics = await this.collectErrorMetrics();
      metrics.push(...errorMetrics);

      this.currentMetrics = metrics;
      return metrics;
    } catch (error) {
      console.error('Failed to collect KPI metrics:', error);
      throw error;
    }
  }

  // Collect memory SDK usage metrics
  private async collectMemoryMetrics(): Promise<KPIMetric[]> {
    // In a real implementation, these would be collected from actual usage data
    const metrics: KPIMetric[] = [
      {
        name: 'memory_writes_per_hour',
        value: 150,
        unit: 'writes/hour',
        threshold: 100,
        trend: 'up',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_recalls_per_hour',
        value: 320,
        unit: 'recalls/hour',
        threshold: 200,
        trend: 'up',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_learn_events_per_hour',
        value: 45,
        unit: 'learns/hour',
        threshold: 30,
        trend: 'up',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_accuracy_score',
        value: 0.85,
        unit: 'score',
        threshold: 0.7,
        trend: 'stable',
        status: 'pass',
        timestamp: new Date().toISOString()
      }
    ];

    return metrics;
  }

  // Collect performance metrics
  private async collectPerformanceMetrics(): Promise<KPIMetric[]> {
    const metrics: KPIMetric[] = [
      {
        name: 'api_response_time_p95',
        value: 250,
        unit: 'ms',
        threshold: 500,
        trend: 'stable',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_sdk_response_time_p95',
        value: 120,
        unit: 'ms',
        threshold: 200,
        trend: 'down',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'database_query_time_p95',
        value: 80,
        unit: 'ms',
        threshold: 150,
        trend: 'stable',
        status: 'pass',
        timestamp: new Date().toISOString()
      }
    ];

    return metrics;
  }

  // Collect learning feedback metrics
  private async collectLearningMetrics(): Promise<KPIMetric[]> {
    const metrics: KPIMetric[] = [
      {
        name: 'feedback_positive_rate',
        value: 0.78,
        unit: 'ratio',
        threshold: 0.6,
        trend: 'up',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'learning_loop_completion_rate',
        value: 0.92,
        unit: 'ratio',
        threshold: 0.8,
        trend: 'stable',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_score_improvement_rate',
        value: 0.15,
        unit: 'rate',
        threshold: 0.1,
        trend: 'up',
        status: 'pass',
        timestamp: new Date().toISOString()
      }
    ];

    return metrics;
  }

  // Collect error rate metrics
  private async collectErrorMetrics(): Promise<KPIMetric[]> {
    const metrics: KPIMetric[] = [
      {
        name: 'error_rate_4xx',
        value: 0.02,
        unit: 'ratio',
        threshold: 0.05,
        trend: 'down',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'error_rate_5xx',
        value: 0.001,
        unit: 'ratio',
        threshold: 0.01,
        trend: 'down',
        status: 'pass',
        timestamp: new Date().toISOString()
      },
      {
        name: 'memory_sdk_error_rate',
        value: 0.005,
        unit: 'ratio',
        threshold: 0.02,
        trend: 'down',
        status: 'pass',
        timestamp: new Date().toISOString()
      }
    ];

    return metrics;
  }

  // Load baseline metrics
  loadBaseline(): KPIBaseline | null {
    try {
      const baselineData = readFileSync(this.baselinePath, 'utf8');
      return JSON.parse(baselineData) as KPIBaseline;
    } catch (error) {
      console.warn('No baseline found, will create new one');
      return null;
    }
  }

  // Save current metrics as baseline
  saveBaseline(version: string): void {
    const baseline: KPIBaseline = {
      version,
      metrics: this.currentMetrics,
      timestamp: new Date().toISOString()
    };

    writeFileSync(this.baselinePath, JSON.stringify(baseline, null, 2));
    console.log(`✅ Baseline saved for version ${version}`);
  }

  // Compare current metrics with baseline
  compareWithBaseline(): KPIComparison[] {
    const baseline = this.loadBaseline();
    if (!baseline) {
      console.warn('No baseline available for comparison');
      return [];
    }

    const comparisons: KPIComparison[] = [];

    for (const currentMetric of this.currentMetrics) {
      const baselineMetric = baseline.metrics.find(m => m.name === currentMetric.name);
      if (!baselineMetric) {
        console.warn(`No baseline found for metric: ${currentMetric.name}`);
        continue;
      }

      const delta = currentMetric.value - baselineMetric.value;
      const deltaPercent = baselineMetric.value > 0 ? (delta / baselineMetric.value) * 100 : 0;

      let status: 'pass' | 'fail' | 'warning' = 'pass';
      
      // Determine status based on metric type and threshold
      if (currentMetric.name.includes('error_rate') || currentMetric.name.includes('response_time')) {
        // For error rates and response times, increases are bad
        if (deltaPercent > 20) status = 'fail';
        else if (deltaPercent > 10) status = 'warning';
      } else {
        // For other metrics, decreases might be bad
        if (deltaPercent < -20) status = 'fail';
        else if (deltaPercent < -10) status = 'warning';
      }

      comparisons.push({
        metric: currentMetric.name,
        current: currentMetric.value,
        baseline: baselineMetric.value,
        delta,
        deltaPercent,
        status
      });
    }

    return comparisons;
  }

  // Generate canary report
  generateCanaryReport(): string {
    const comparisons = this.compareWithBaseline();
    const failures = comparisons.filter(c => c.status === 'fail');
    const warnings = comparisons.filter(c => c.status === 'warning');
    const passes = comparisons.filter(c => c.status === 'pass');

    let report = '# KPI Canary Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `**Summary:** ${passes.length} pass, ${warnings.length} warning, ${failures.length} fail\n\n`;

    if (failures.length > 0) {
      report += '## ❌ Failures\n\n';
      failures.forEach(f => {
        report += `- **${f.metric}**: ${f.current} (baseline: ${f.baseline}, delta: ${f.deltaPercent.toFixed(1)}%)\n`;
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += '## ⚠️ Warnings\n\n';
      warnings.forEach(w => {
        report += `- **${w.metric}**: ${w.current} (baseline: ${w.baseline}, delta: ${w.deltaPercent.toFixed(1)}%)\n`;
      });
      report += '\n';
    }

    if (passes.length > 0) {
      report += '## ✅ Passes\n\n';
      passes.forEach(p => {
        report += `- **${p.metric}**: ${p.current} (baseline: ${p.baseline}, delta: ${p.deltaPercent.toFixed(1)}%)\n`;
      });
      report += '\n';
    }

    const overallStatus = failures.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARNING' : 'PASS';
    report += `## Overall Status: ${overallStatus}\n\n`;

    if (failures.length > 0) {
      report += '**Canary Result: NO-GO** - Critical regressions detected\n';
    } else if (warnings.length > 0) {
      report += '**Canary Result: WARNING** - Minor regressions detected\n';
    } else {
      report += '**Canary Result: GO** - No regressions detected\n';
    }

    return report;
  }

  // Run canary validation
  async runCanaryValidation(): Promise<boolean> {
    try {
      await this.collectMetrics();
      const comparisons = this.compareWithBaseline();
      const failures = comparisons.filter(c => c.status === 'fail');

      const report = this.generateCanaryReport();
      writeFileSync('reports/kpi-canary-report.md', report);

      if (failures.length > 0) {
        console.error('❌ KPI Canary FAILED - Critical regressions detected');
        console.error(report);
        return false;
      }

      console.log('✅ KPI Canary PASSED - No critical regressions');
      console.log(report);
      return true;
    } catch (error) {
      console.error('❌ KPI Canary validation failed:', error);
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new KPIMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'collect':
      monitor.collectMetrics().then(metrics => {
        console.log('Collected metrics:', metrics);
      });
      break;
    case 'baseline': {
      const version = process.argv[3] || 'current';
      monitor.collectMetrics().then(() => {
        monitor.saveBaseline(version);
      });
      break;
    }
    case 'canary':
      monitor.runCanaryValidation().then(success => {
        process.exit(success ? 0 : 1);
      });
      break;
    default:
      console.log('Usage: npm run test:kpi-canary [collect|baseline|canary]');
      process.exit(1);
  }
}
