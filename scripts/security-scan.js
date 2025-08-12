#!/usr/bin/env node

/**
 * Security Scanner for SportBeaconAI
 * Automated vulnerability detection and security auditing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityScanner {
    constructor() {
        this.scanResults = {
            timestamp: new Date().toISOString(),
            project: 'SportBeaconAI',
            vulnerabilities: [],
            warnings: [],
            info: [],
            summary: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        };
    }

    async runFullScan() {
        console.log('🔒 Starting comprehensive security scan...\n');
        
        try {
            await this.scanDependencies();
            await this.scanCodeQuality();
            await this.scanSecrets();
            await this.scanFirebaseRules();
            await this.scanUnrealAssets();
            await this.generateReport();
        } catch (error) {
            console.error('❌ Security scan failed:', error.message);
            process.exit(1);
        }
    }

    async scanDependencies() {
        console.log('📦 Scanning dependencies for vulnerabilities...');
        
        try {
            // Run npm audit
            const auditResult = execSync('npm audit --json', { 
                cwd: path.join(__dirname, '../frontend'),
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            const audit = JSON.parse(auditResult);
            
            if (audit.vulnerabilities) {
                Object.entries(audit.vulnerabilities).forEach(([packageName, vuln]) => {
                    this.addVulnerability({
                        type: 'dependency',
                        package: packageName,
                        severity: vuln.severity,
                        title: vuln.title,
                        description: vuln.description,
                        recommendation: vuln.recommendation
                    });
                });
            }
            
            console.log(`✅ Dependency scan completed`);
        } catch (error) {
            console.warn('⚠️  Could not run npm audit:', error.message);
        }
    }

    async scanCodeQuality() {
        console.log('🔍 Scanning code quality and security patterns...');
        
        const patterns = [
            {
                name: 'Hardcoded Secrets',
                pattern: /(api_key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/gi,
                severity: 'high'
            },
            {
                name: 'Console Logs in Production',
                pattern: /console\.(log|warn|error|info)\(/g,
                severity: 'low'
            },
            {
                name: 'SQL Injection Risk',
                pattern: /query\s*\(\s*['"`][^'"`]*\$\{[^}]*\}[^'"`]*['"`]/g,
                severity: 'critical'
            },
            {
                name: 'XSS Risk',
                pattern: /innerHTML\s*=\s*[^;]+/g,
                severity: 'high'
            },
            {
                name: 'Insecure HTTP',
                pattern: /http:\/\//g,
                severity: 'medium'
            }
        ];
        
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];
        const scanDirs = ['frontend', 'backend', 'functions'];
        
        for (const dir of scanDirs) {
            if (fs.existsSync(path.join(__dirname, '..', dir))) {
                this.scanDirectory(path.join(__dirname, '..', dir), patterns, extensions);
            }
        }
        
        console.log(`✅ Code quality scan completed`);
    }

    scanDirectory(dirPath, patterns, extensions) {
        const files = this.getFilesRecursively(dirPath, extensions);
        
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                patterns.forEach(pattern => {
                    const matches = content.match(pattern.pattern);
                    if (matches) {
                        this.addVulnerability({
                            type: 'code_quality',
                            file: path.relative(path.join(__dirname, '..'), file),
                            pattern: pattern.name,
                            severity: pattern.severity,
                            matches: matches.length,
                            description: `Found ${matches.length} instances of ${pattern.name}`
                        });
                    }
                });
            } catch (error) {
                console.warn(`⚠️  Could not read file ${file}:`, error.message);
            }
        });
    }

    getFilesRecursively(dir, extensions) {
        const files = [];
        
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                files.push(...this.getFilesRecursively(fullPath, extensions));
            } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    async scanSecrets() {
        console.log('🔐 Scanning for exposed secrets...');
        
        const secretPatterns = [
            /sk_live_[a-zA-Z0-9]{24}/g,
            /pk_live_[a-zA-Z0-9]{24}/g,
            /sk_test_[a-zA-Z0-9]{24}/g,
            /pk_test_[a-zA-Z0-9]{24}/g,
            /[a-zA-Z0-9]{32,}/g, // Generic long strings
            /[a-zA-Z0-9]{8,}@[a-zA-Z0-9]{8,}\.[a-zA-Z]{2,}/g // Email-like patterns
        ];
        
        const scanDirs = ['frontend', 'backend', 'functions'];
        
        for (const dir of scanDirs) {
            if (fs.existsSync(path.join(__dirname, '..', dir))) {
                this.scanDirectoryForSecrets(path.join(__dirname, '..', dir), secretPatterns);
            }
        }
        
        console.log(`✅ Secrets scan completed`);
    }

    scanDirectoryForSecrets(dirPath, patterns) {
        const files = this.getFilesRecursively(dirPath, ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.env']);
        
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                patterns.forEach(pattern => {
                    const matches = content.match(pattern);
                    if (matches) {
                        this.addVulnerability({
                            type: 'exposed_secret',
                            file: path.relative(path.join(__dirname, '..'), file),
                            severity: 'critical',
                            description: `Potential secret found: ${matches[0].substring(0, 10)}...`,
                            recommendation: 'Review and remove or secure this secret'
                        });
                    }
                });
            } catch (error) {
                console.warn(`⚠️  Could not read file ${file}:`, error.message);
            }
        });
    }

    async scanFirebaseRules() {
        console.log('🔥 Scanning Firebase security rules...');
        
        const rulesFile = path.join(__dirname, '..', 'firestore.rules');
        
        if (fs.existsSync(rulesFile)) {
            try {
                const rules = fs.readFileSync(rulesFile, 'utf8');
                
                // Check for common security issues
                const checks = [
                    {
                        name: 'Missing Authentication',
                        pattern: /allow\s+(read|write|create|update|delete)\s*:\s*if\s+true/g,
                        severity: 'critical'
                    },
                    {
                        name: 'Overly Permissive Rules',
                        pattern: /allow\s+(read|write|create|update|delete)\s*:\s*if\s+isAuthenticated\(\)/g,
                        severity: 'medium'
                    },
                    {
                        name: 'Missing Input Validation',
                        pattern: /request\.resource\.data/g,
                        severity: 'medium'
                    }
                ];
                
                checks.forEach(check => {
                    const matches = rules.match(check.pattern);
                    if (matches) {
                        this.addVulnerability({
                            type: 'firebase_rules',
                            file: 'firestore.rules',
                            pattern: check.name,
                            severity: check.severity,
                            description: `Found ${matches.length} instances of ${check.name}`,
                            recommendation: 'Review and tighten Firebase security rules'
                        });
                    }
                });
                
                console.log(`✅ Firebase rules scan completed`);
            } catch (error) {
                console.warn('⚠️  Could not read Firebase rules:', error.message);
            }
        }
    }

    async scanUnrealAssets() {
        console.log('🎮 Scanning Unreal Engine assets...');
        
        const unrealDir = path.join(__dirname, '..', 'unreal');
        
        if (fs.existsSync(unrealDir)) {
            // Check for basic asset structure
            const requiredDirs = ['Content', 'Source'];
            const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(unrealDir, dir)));
            
            if (missingDirs.length > 0) {
                this.addVulnerability({
                    type: 'unreal_assets',
                    severity: 'medium',
                    description: `Missing required Unreal directories: ${missingDirs.join(', ')}`,
                    recommendation: 'Create missing Unreal Engine directory structure'
                });
            }
            
            // Check for asset files
            const assetFiles = this.getFilesRecursively(path.join(unrealDir, 'Content'), ['.uasset', '.umap']);
            
            if (assetFiles.length === 0) {
                this.addVulnerability({
                    type: 'unreal_assets',
                    severity: 'high',
                    description: 'No Unreal Engine assets found',
                    recommendation: 'Create basic Unreal Engine assets for the project'
                });
            }
            
            console.log(`✅ Unreal assets scan completed`);
        }
    }

    addVulnerability(vuln) {
        this.scanResults.vulnerabilities.push({
            ...vuln,
            timestamp: new Date().toISOString()
        });
        
        // Update summary
        this.scanResults.summary.total++;
        this.scanResults.summary[vuln.severity]++;
    }

    async generateReport() {
        console.log('\n📊 Generating security report...');
        
        const report = {
            ...this.scanResults,
            summary: {
                ...this.scanResults.summary,
                riskScore: this.calculateRiskScore()
            }
        };
        
        // Save detailed report
        const reportDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const reportFile = path.join(reportDir, `security-scan-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n🔒 Security Scan Summary:');
        console.log(`Total Issues: ${report.summary.total}`);
        console.log(`Critical: ${report.summary.critical}`);
        console.log(`High: ${report.summary.high}`);
        console.log(`Medium: ${report.summary.medium}`);
        console.log(`Low: ${report.summary.low}`);
        console.log(`Risk Score: ${report.summary.riskScore}/100`);
        
        if (report.summary.critical > 0 || report.summary.high > 0) {
            console.log('\n🚨 CRITICAL/HIGH ISSUES FOUND:');
            report.vulnerabilities
                .filter(v => v.severity === 'critical' || v.severity === 'high')
                .forEach(v => {
                    console.log(`  ${v.severity.toUpperCase()}: ${v.description}`);
                });
        }
        
        return report;
    }

    calculateRiskScore() {
        const weights = {
            critical: 10,
            high: 5,
            medium: 2,
            low: 1
        };
        
        const totalWeight = Object.entries(this.scanResults.summary)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [severity, count]) => sum + (count * weights[severity]), 0);
        
        // Convert to 0-100 scale (higher is worse)
        return Math.min(100, Math.max(0, 100 - totalWeight));
    }
}

// CLI Usage
if (require.main === module) {
    const scanner = new SecurityScanner();
    scanner.runFullScan();
}

module.exports = SecurityScanner; 