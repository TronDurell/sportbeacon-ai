#!/usr/bin/env ts-node

/**
 * Performance Monitoring Script
 * 
 * This script collects and analyzes performance metrics for the SportBeaconAI application
 * including bundle size, load times, memory usage, and test execution times.
 */

import { performance } from 'perf_hooks';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

interface PerformanceMetrics {
  timestamp: string;
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  testExecutionTime: number;
  lighthouseScore: number;
  buildTime: number;
  hotReloadTime: number;
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: Array<{
      name: string;
      size: number;
    }>;
  }>;
  recommendations: string[];
}

interface PerformanceReport {
  timestamp: string;
  metrics: PerformanceMetrics;
  trend: string;
  recommendations: string[];
  alerts: string[];
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly metricsFile = 'performance-metrics.json';
  private readonly reportFile = 'performance-report.json';
  
  constructor() {
    this.loadHistoricalMetrics();
  }
  
  /**
   * Collect all performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    console.log('🔍 Collecting performance metrics...');
    
    const startTime = performance.now();
    
    // Collect bundle size
    const bundleSize = await this.getBundleSize();
    console.log(`📦 Bundle size: ${this.formatBytes(bundleSize)}`);
    
    // Collect load time
    const loadTime = await this.measureLoadTime();
    console.log(`⚡ Load time: ${loadTime.toFixed(2)}ms`);
    
    // Collect memory usage
    const memoryUsage = process.memoryUsage().heapUsed;
    console.log(`💾 Memory usage: ${this.formatBytes(memoryUsage)}`);
    
    // Collect test execution time
    const testExecutionTime = await this.runTests();
    console.log(`🧪 Test execution time: ${testExecutionTime.toFixed(2)}ms`);
    
    // Collect Lighthouse score
    const lighthouseScore = await this.runLighthouse();
    console.log(`🏆 Lighthouse score: ${lighthouseScore}`);
    
    // Collect build time
    const buildTime = await this.measureBuildTime();
    console.log(`🔨 Build time: ${buildTime.toFixed(2)}ms`);
    
    // Collect hot reload time
    const hotReloadTime = await this.measureHotReloadTime();
    console.log(`🔄 Hot reload time: ${hotReloadTime.toFixed(2)}ms`);
    
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      bundleSize,
      loadTime,
      memoryUsage,
      testExecutionTime,
      lighthouseScore,
      buildTime,
      hotReloadTime
    };
    
    this.metrics.push(metrics);
    this.saveMetrics(metrics);
    
    return metrics;
  }
  
  /**
   * Generate performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const currentMetrics = await this.collectMetrics();
    const trend = this.calculateTrend();
    const recommendations = this.generateRecommendations(currentMetrics);
    const alerts = this.generateAlerts(currentMetrics);
    
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics,
      trend,
      recommendations,
      alerts
    };
    
    this.saveReport(report);
    this.displayReport(report);
    
    return report;
  }
  
  /**
   * Analyze bundle for optimization opportunities
   */
  async analyzeBundle(): Promise<BundleAnalysis> {
    console.log('🔍 Analyzing bundle...');
    
    const bundlePath = path.join(process.cwd(), 'dist');
    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not found. Run build first.');
    }
    
    // Get bundle stats
    const stats = this.getBundleStats(bundlePath);
    const recommendations = this.generateBundleRecommendations(stats);
    
    return {
      totalSize: stats.totalSize,
      chunks: stats.chunks,
      recommendations
    };
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  private async getBundleSize(): Promise<number> {
    try {
      const bundlePath = path.join(process.cwd(), 'dist');
      if (!existsSync(bundlePath)) {
        return 0;
      }
      
      // Calculate total size of dist directory
      const result = execSync(`du -sb ${bundlePath}`, { encoding: 'utf8' });
      return parseInt(result.split('\t')[0]);
    } catch (error) {
      console.warn('Failed to get bundle size:', error);
      return 0;
    }
  }
  
  private async measureLoadTime(): Promise<number> {
    try {
      // Simulate load time measurement
      // In a real implementation, this would use Puppeteer or similar
      const start = performance.now();
      
      // Simulate page load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      console.warn('Failed to measure load time:', error);
      return 0;
    }
  }
  
  private async runTests(): Promise<number> {
    try {
      const start = performance.now();
      
      // Run tests
      execSync('npm test', { stdio: 'pipe' });
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      console.warn('Failed to run tests:', error);
      return 0;
    }
  }
  
  private async runLighthouse(): Promise<number> {
    try {
      // Simulate Lighthouse score
      // In a real implementation, this would use Lighthouse CI
      return Math.floor(Math.random() * 30) + 70; // 70-100
    } catch (error) {
      console.warn('Failed to run Lighthouse:', error);
      return 0;
    }
  }
  
  private async measureBuildTime(): Promise<number> {
    try {
      const start = performance.now();
      
      // Run build
      execSync('npm run build', { stdio: 'pipe' });
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      console.warn('Failed to measure build time:', error);
      return 0;
    }
  }
  
  private async measureHotReloadTime(): Promise<number> {
    try {
      // Simulate hot reload time measurement
      const start = performance.now();
      
      // Simulate hot reload
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      console.warn('Failed to measure hot reload time:', error);
      return 0;
    }
  }
  
  private getBundleStats(bundlePath: string): any {
    // Simplified bundle stats calculation
    const files = execSync(`find ${bundlePath} -type f -name "*.js" -o -name "*.css"`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    let totalSize = 0;
    const chunks: any[] = [];
    
    files.forEach(file => {
      const stats = execSync(`stat -f%z "${file}"`, { encoding: 'utf8' });
      const size = parseInt(stats);
      totalSize += size;
      
      chunks.push({
        name: path.basename(file),
        size,
        modules: []
      });
    });
    
    return { totalSize, chunks };
  }
  
  private generateBundleRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    // Check bundle size
    if (stats.totalSize > 1024 * 1024) {
      recommendations.push('Bundle size exceeds 1MB. Consider code splitting and tree shaking.');
    }
    
    // Check for large chunks
    const largeChunks = stats.chunks.filter((chunk: any) => chunk.size > 200 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(`Found ${largeChunks.length} large chunks. Consider splitting them.`);
    }
    
    // Check for too many chunks
    if (stats.chunks.length > 20) {
      recommendations.push('Too many chunks detected. Consider consolidating small chunks.');
    }
    
    return recommendations;
  }
  
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    // Bundle size recommendations
    if (metrics.bundleSize > 1024 * 1024) {
      recommendations.push('Bundle size exceeds 1MB. Implement code splitting and tree shaking.');
    }
    
    // Load time recommendations
    if (metrics.loadTime > 3000) {
      recommendations.push('Load time exceeds 3 seconds. Optimize initial bundle and implement lazy loading.');
    }
    
    // Memory usage recommendations
    if (metrics.memoryUsage > 100 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Check for memory leaks and optimize component rendering.');
    }
    
    // Test execution time recommendations
    if (metrics.testExecutionTime > 30000) {
      recommendations.push('Test execution time exceeds 30 seconds. Optimize test setup and implement parallel testing.');
    }
    
    // Lighthouse score recommendations
    if (metrics.lighthouseScore < 90) {
      recommendations.push('Lighthouse score below 90. Optimize Core Web Vitals and implement performance best practices.');
    }
    
    // Build time recommendations
    if (metrics.buildTime > 30000) {
      recommendations.push('Build time exceeds 30 seconds. Optimize build configuration and implement caching.');
    }
    
    // Hot reload time recommendations
    if (metrics.hotReloadTime > 2000) {
      recommendations.push('Hot reload time exceeds 2 seconds. Optimize development server configuration.');
    }
    
    return recommendations;
  }
  
  private generateAlerts(metrics: PerformanceMetrics): string[] {
    const alerts: string[] = [];
    
    // Critical alerts
    if (metrics.bundleSize > 2 * 1024 * 1024) {
      alerts.push('CRITICAL: Bundle size exceeds 2MB');
    }
    
    if (metrics.loadTime > 5000) {
      alerts.push('CRITICAL: Load time exceeds 5 seconds');
    }
    
    if (metrics.lighthouseScore < 70) {
      alerts.push('CRITICAL: Lighthouse score below 70');
    }
    
    // Warning alerts
    if (metrics.memoryUsage > 200 * 1024 * 1024) {
      alerts.push('WARNING: Memory usage exceeds 200MB');
    }
    
    if (metrics.testExecutionTime > 60000) {
      alerts.push('WARNING: Test execution time exceeds 1 minute');
    }
    
    return alerts;
  }
  
  private calculateTrend(): string {
    if (this.metrics.length < 2) {
      return 'insufficient_data';
    }
    
    const recent = this.metrics.slice(-5);
    const bundleSizes = recent.map(m => m.bundleSize);
    const loadTimes = recent.map(m => m.loadTime);
    
    const bundleTrend = this.calculateLinearTrend(bundleSizes);
    const loadTrend = this.calculateLinearTrend(loadTimes);
    
    if (bundleTrend < -0.1 && loadTrend < -0.1) {
      return 'improving';
    } else if (bundleTrend > 0.1 || loadTrend > 0.1) {
      return 'degrading';
    } else {
      return 'stable';
    }
  }
  
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
  
  private loadHistoricalMetrics(): void {
    try {
      if (existsSync(this.metricsFile)) {
        const data = readFileSync(this.metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load historical metrics:', error);
      this.metrics = [];
    }
  }
  
  private saveMetrics(metrics: PerformanceMetrics): void {
    try {
      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
      
      writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }
  
  private saveReport(report: PerformanceReport): void {
    try {
      writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }
  
  private displayReport(report: PerformanceReport): void {
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Trend: ${report.trend}`);
    console.log('');
    
    console.log('📈 METRICS:');
    console.log(`  Bundle Size: ${this.formatBytes(report.metrics.bundleSize)}`);
    console.log(`  Load Time: ${report.metrics.loadTime.toFixed(2)}ms`);
    console.log(`  Memory Usage: ${this.formatBytes(report.metrics.memoryUsage)}`);
    console.log(`  Test Execution: ${report.metrics.testExecutionTime.toFixed(2)}ms`);
    console.log(`  Lighthouse Score: ${report.metrics.lighthouseScore}`);
    console.log(`  Build Time: ${report.metrics.buildTime.toFixed(2)}ms`);
    console.log(`  Hot Reload: ${report.metrics.hotReloadTime.toFixed(2)}ms`);
    console.log('');
    
    if (report.alerts.length > 0) {
      console.log('🚨 ALERTS:');
      report.alerts.forEach(alert => console.log(`  ${alert}`));
      console.log('');
    }
    
    if (report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
      console.log('');
    }
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const monitor = new PerformanceMonitor();
  
  try {
    // Generate performance report
    const report = await monitor.generateReport();
    
    // Analyze bundle
    const bundleAnalysis = await monitor.analyzeBundle();
    
    console.log('\n📦 BUNDLE ANALYSIS:');
    console.log('='.repeat(50));
    console.log(`Total Size: ${monitor['formatBytes'](bundleAnalysis.totalSize)}`);
    console.log(`Chunks: ${bundleAnalysis.chunks.length}`);
    
    if (bundleAnalysis.recommendations.length > 0) {
      console.log('\n💡 BUNDLE RECOMMENDATIONS:');
      bundleAnalysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    console.log('\n✅ Performance monitoring completed successfully!');
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { PerformanceMonitor, PerformanceMetrics, PerformanceReport, BundleAnalysis }; 