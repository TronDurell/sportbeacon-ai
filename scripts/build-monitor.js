#!/usr/bin/env node

/**
 * Build Time Monitor for SportBeaconAI CI/CD Pipeline
 * Monitors build times and alerts on slow builds
 */

const fs = require('fs');
const path = require('path');

class BuildMonitor {
    constructor() {
        this.startTime = Date.now();
        this.thresholds = {
            build: 300000, // 5 minutes in ms
            test: 600000,  // 10 minutes in ms
            lint: 120000,  // 2 minutes in ms
            deploy: 600000 // 10 minutes in ms
        };
        this.metrics = {
            build: 0,
            test: 0,
            lint: 0,
            deploy: 0
        };
    }

    startPhase(phase) {
        console.log(`🚀 Starting ${phase} phase...`);
        this.phaseStartTime = Date.now();
    }

    endPhase(phase) {
        const duration = Date.now() - this.phaseStartTime;
        this.metrics[phase] = duration;
        
        const threshold = this.thresholds[phase];
        const isSlow = duration > threshold;
        
        console.log(`⏱️  ${phase} completed in ${this.formatDuration(duration)}`);
        
        if (isSlow) {
            console.warn(`⚠️  ${phase} took longer than expected (${this.formatDuration(threshold)})`);
            this.alertSlowBuild(phase, duration, threshold);
        }
        
        return duration;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    }

    alertSlowBuild(phase, duration, threshold) {
        const message = {
            type: 'slow_build_alert',
            phase: phase,
            duration: duration,
            threshold: threshold,
            timestamp: new Date().toISOString(),
            project: 'SportBeaconAI'
        };
        
        // Log to file for analysis
        this.logMetric(message);
        
        // Could send to Slack, email, etc.
        console.error(`🚨 SLOW BUILD ALERT: ${phase} took ${this.formatDuration(duration)} (threshold: ${this.formatDuration(threshold)})`);
    }

    logMetric(metric) {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, 'build-metrics.json');
        let metrics = [];
        
        if (fs.existsSync(logFile)) {
            try {
                metrics = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            } catch (error) {
                console.warn('Could not parse existing metrics file, starting fresh');
            }
        }
        
        metrics.push(metric);
        
        // Keep only last 100 entries
        if (metrics.length > 100) {
            metrics = metrics.slice(-100);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(metrics, null, 2));
    }

    generateReport() {
        const totalTime = Date.now() - this.startTime;
        const report = {
            timestamp: new Date().toISOString(),
            project: 'SportBeaconAI',
            totalDuration: totalTime,
            phases: this.metrics,
            summary: {
                totalTime: this.formatDuration(totalTime),
                slowPhases: Object.entries(this.metrics)
                    .filter(([phase, duration]) => duration > this.thresholds[phase])
                    .map(([phase, duration]) => ({
                        phase,
                        duration: this.formatDuration(duration),
                        threshold: this.formatDuration(this.thresholds[phase])
                    }))
            }
        };
        
        console.log('\n📊 Build Report:');
        console.log(`Total Time: ${report.summary.totalTime}`);
        console.log(`Phases:`);
        Object.entries(this.metrics).forEach(([phase, duration]) => {
            const status = duration > this.thresholds[phase] ? '⚠️' : '✅';
            console.log(`  ${status} ${phase}: ${this.formatDuration(duration)}`);
        });
        
        if (report.summary.slowPhases.length > 0) {
            console.log('\n🚨 Slow Phases:');
            report.summary.slowPhases.forEach(phase => {
                console.log(`  - ${phase.phase}: ${phase.duration} (threshold: ${phase.threshold})`);
            });
        }
        
        // Save report
        const reportDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const reportFile = path.join(reportDir, `build-report-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        return report;
    }
}

// CLI Usage
if (require.main === module) {
    const monitor = new BuildMonitor();
    
    const args = process.argv.slice(2);
    const command = args[0];
    const phase = args[1];
    
    switch (command) {
        case 'start':
            if (phase) {
                monitor.startPhase(phase);
            } else {
                console.error('Usage: node build-monitor.js start <phase>');
                process.exit(1);
            }
            break;
            
        case 'end':
            if (phase) {
                const duration = monitor.endPhase(phase);
                console.log(`Duration: ${duration}ms`);
            } else {
                console.error('Usage: node build-monitor.js end <phase>');
                process.exit(1);
            }
            break;
            
        case 'report':
            monitor.generateReport();
            break;
            
        default:
            console.log('Build Monitor Usage:');
            console.log('  node build-monitor.js start <phase>  - Start monitoring a phase');
            console.log('  node build-monitor.js end <phase>    - End monitoring a phase');
            console.log('  node build-monitor.js report         - Generate build report');
            console.log('');
            console.log('Phases: build, test, lint, deploy');
    }
}

module.exports = BuildMonitor; 