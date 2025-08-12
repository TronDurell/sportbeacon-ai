#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  status: '✅' | '❌';
  message: string;
}

class DeploymentHealthChecker {
  private results: CheckResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  private addResult(name: string, passed: boolean, message: string) {
    this.results.push({
      name,
      status: passed ? '✅' : '❌',
      message
    });
  }

  checkKeyFiles(): void {
    
    const keyFiles = [
      'frontend/src/App.tsx',
      'frontend/src/index.tsx',
      'frontend/src/providers/RootProviders.tsx',
      'frontend/src/routes/AdminRoutes.tsx',
      'frontend/tsconfig.json',
      'frontend/package.json',
      'env.example'
    ];

    keyFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      const exists = fs.existsSync(filePath);
      this.addResult(
        `File: ${file}`,
        exists,
        exists ? 'Found' : 'Missing'
      );
    });
  }

  checkTypeScriptCompilation(): void {
    
    try {
      execSync('cd frontend && npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        timeout: 30000 
      });
      this.addResult('TypeScript Compilation', true, 'No errors found');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('TypeScript Compilation', false, `Compilation failed: ${errorMessage}`);
    }
  }

  checkEnvironmentVariables(): void {
    
    const envExamplePath = path.join(this.projectRoot, 'env.example');
    if (!fs.existsSync(envExamplePath)) {
      this.addResult('Environment Variables', false, 'env.example file missing');
      return;
    }

    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const envVars = envContent
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(Boolean);

    this.addResult(
      'Environment Variables',
      envVars.length > 0,
      `Found ${envVars.length} environment variables in env.example`
    );
  }

  checkImportPaths(): void {
    
    const srcPath = path.join(this.projectRoot, 'frontend/src');
    if (!fs.existsSync(srcPath)) {
      this.addResult('Import Paths', false, 'frontend/src directory not found');
      return;
    }

    let hasDeepImports = false;
    const deepImportPattern = /from ['"]\.\.\/\.\.\/\.\.\//;

    const checkFile = (filePath: string) => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (deepImportPattern.test(content)) {
          hasDeepImports = true;
        }
      }
    };

    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          checkFile(filePath);
        }
      });
    };

    walkDir(srcPath);

    this.addResult(
      'Import Paths',
      !hasDeepImports,
      hasDeepImports ? 'Found deep relative imports' : 'All imports use proper paths'
    );
  }

  checkPackageDependencies(): void {
    
    const packagePath = path.join(this.projectRoot, 'frontend/package.json');
    if (!fs.existsSync(packagePath)) {
      this.addResult('Package Dependencies', false, 'package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasRequiredDeps = packageJson.dependencies && 
        packageJson.dependencies['react'] && 
        packageJson.dependencies['react-router-dom'];

      this.addResult(
        'Package Dependencies',
        hasRequiredDeps,
        hasRequiredDeps ? 'Required dependencies found' : 'Missing required dependencies'
      );
    } catch (error) {
      this.addResult('Package Dependencies', false, 'Invalid package.json');
    }
  }

  checkBuildScripts(): void {
    
    const packagePath = path.join(this.projectRoot, 'frontend/package.json');
    if (!fs.existsSync(packagePath)) {
      this.addResult('Build Scripts', false, 'package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;

      this.addResult(
        'Build Scripts',
        hasBuildScript && hasTestScript,
        hasBuildScript && hasTestScript ? 'Build and test scripts found' : 'Missing build or test scripts'
      );
    } catch (error) {
      this.addResult('Build Scripts', false, 'Invalid package.json');
    }
  }

  checkTestFiles(): void {
    
    const testFiles = [
      'frontend/src/App.test.tsx',
      'frontend/src/routes/AdminRoutes.test.tsx'
    ];

    let allTestsExist = true;
    testFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        allTestsExist = false;
      }
    });

    this.addResult(
      'Test Files',
      allTestsExist,
      allTestsExist ? 'All test files found' : 'Missing test files'
    );
  }

  async runAllChecks(): Promise<void> {

    this.checkKeyFiles();
    this.checkTypeScriptCompilation();
    this.checkEnvironmentVariables();
    this.checkImportPaths();
    this.checkPackageDependencies();
    this.checkBuildScripts();
    this.checkTestFiles();

    
    this.results.forEach(result => {
    });

    const passed = this.results.filter(r => r.status === '✅').length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run the health check
const checker = new DeploymentHealthChecker();
checker.runAllChecks().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
}); 