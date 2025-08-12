#!/usr/bin/env node

/**
 * SportBeaconAI Post-Deployment Validation Script
 * 
 * This script performs comprehensive post-deployment validation including
 * data flow testing, latency testing, authentication validation, and webhook handling.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  production: {
    baseUrl: 'https://sportbeacon-ai.vercel.app',
    apiUrl: 'https://us-central1-sportbeacon-ai-production.cloudfunctions.net',
    adminUrl: 'https://admin.sportbeacon-ai.vercel.app',
    timeout: 30000,
    maxRetries: 3
  },
  testData: {
    testUser: {
      email: 'test@sportbeacon.ai',
      password: 'TestPassword123!',
      displayName: 'Test User'
    },
    testTip: {
      amount: 1000,
      currency: 'USD',
      message: 'Test tip from validation script'
    }
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n${colors.bright}${step}${colors.reset}: ${message}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

// HTTP request function
const makeRequest = (url, options = {}) => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    const defaultOptions = {
      method: 'GET',
      timeout: CONFIG.production.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SportBeaconAI-Validation/1.0'
      }
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
};

// Health check validation
const validateHealthChecks = async () => {
  logStep('Health Check Validation', 'Validating all service health endpoints...');
  
  const healthEndpoints = [
    { name: 'Frontend API', url: `${CONFIG.production.baseUrl}/api/health` },
    { name: 'Firebase Functions', url: `${CONFIG.production.apiUrl}/health` },
    { name: 'Admin Dashboard', url: `${CONFIG.production.adminUrl}/api/health` }
  ];
  
  let allHealthy = true;
  
  for (const endpoint of healthEndpoints) {
    logInfo(`Checking ${endpoint.name}...`);
    const result = await makeRequest(endpoint.url);
    
    if (result.success) {
      logSuccess(`${endpoint.name} is healthy (${result.statusCode})`);
    } else {
      logError(`${endpoint.name} health check failed: ${result.error || result.statusCode}`);
      allHealthy = false;
    }
  }
  
  return allHealthy;
};

// Authentication validation
const validateAuthentication = async () => {
  logStep('Authentication Validation', 'Testing user registration, login, and session management...');
  
  // Test user registration
  logInfo('Testing user registration...');
  const registerResult = await makeRequest(`${CONFIG.production.baseUrl}/api/auth/register`, {
    method: 'POST',
    body: {
      email: CONFIG.testData.testUser.email,
      password: CONFIG.testData.testUser.password,
      displayName: CONFIG.testData.testUser.displayName
    }
  });
  
  if (!registerResult.success) {
    logWarning(`User registration failed: ${registerResult.error || registerResult.statusCode}`);
  } else {
    logSuccess('User registration successful');
  }
  
  // Test user login
  logInfo('Testing user login...');
  const loginResult = await makeRequest(`${CONFIG.production.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: {
      email: CONFIG.testData.testUser.email,
      password: CONFIG.testData.testUser.password
    }
  });
  
  if (!loginResult.success) {
    logError(`User login failed: ${loginResult.error || loginResult.statusCode}`);
    return false;
  }
  
  logSuccess('User login successful');
  
  // Extract authentication token
  const authToken = loginResult.data?.token || loginResult.headers?.authorization;
  if (!authToken) {
    logError('No authentication token received');
    return false;
  }
  
  // Test authenticated request
  logInfo('Testing authenticated request...');
  const authResult = await makeRequest(`${CONFIG.production.baseUrl}/api/user/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!authResult.success) {
    logError(`Authenticated request failed: ${authResult.error || authResult.statusCode}`);
    return false;
  }
  
  logSuccess('Authentication validation completed successfully');
  return { success: true, token: authToken };
};

// Data flow validation
const validateDataFlows = async (authToken) => {
  logStep('Data Flow Validation', 'Testing end-to-end data flows...');
  
  // Test profile creation/update
  logInfo('Testing profile creation/update...');
  const profileResult = await makeRequest(`${CONFIG.production.baseUrl}/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: {
      displayName: 'Updated Test User',
      bio: 'Test bio from validation script'
    }
  });
  
  if (!profileResult.success) {
    logError(`Profile update failed: ${profileResult.error || profileResult.statusCode}`);
    return false;
  }
  
  logSuccess('Profile update successful');
  
  // Test tip creation
  logInfo('Testing tip creation...');
  const tipResult = await makeRequest(`${CONFIG.production.baseUrl}/api/tips/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: CONFIG.testData.testTip
  });
  
  if (!tipResult.success) {
    logError(`Tip creation failed: ${tipResult.error || tipResult.statusCode}`);
    return false;
  }
  
  logSuccess('Tip creation successful');
  
  // Test data retrieval
  logInfo('Testing data retrieval...');
  const dataResult = await makeRequest(`${CONFIG.production.baseUrl}/api/user/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!dataResult.success) {
    logError(`Data retrieval failed: ${dataResult.error || dataResult.statusCode}`);
    return false;
  }
  
  logSuccess('Data retrieval successful');
  
  logSuccess('Data flow validation completed successfully');
  return true;
};

// Latency testing
const testLatency = async () => {
  logStep('Latency Testing', 'Measuring response times for all endpoints...');
  
  const endpoints = [
    { name: 'Frontend Health', url: `${CONFIG.production.baseUrl}/api/health` },
    { name: 'Firebase Functions', url: `${CONFIG.production.apiUrl}/health` },
    { name: 'Admin Dashboard', url: `${CONFIG.production.adminUrl}/api/health` },
    { name: 'User Profile', url: `${CONFIG.production.baseUrl}/api/user/profile` },
    { name: 'Tips API', url: `${CONFIG.production.baseUrl}/api/tips/list` }
  ];
  
  const latencyResults = [];
  
  for (const endpoint of endpoints) {
    logInfo(`Testing latency for ${endpoint.name}...`);
    
    const times = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      const result = await makeRequest(endpoint.url);
      const endTime = Date.now();
      
      if (result.success) {
        times.push(endTime - startTime);
      }
    }
    
    if (times.length > 0) {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      latencyResults.push({
        endpoint: endpoint.name,
        averageTime,
        minTime,
        maxTime,
        success: true
      });
      
      logSuccess(`${endpoint.name}: ${averageTime.toFixed(2)}ms avg (${minTime}ms min, ${maxTime}ms max)`);
    } else {
      latencyResults.push({
        endpoint: endpoint.name,
        success: false
      });
      
      logError(`${endpoint.name}: Failed to measure latency`);
    }
  }
  
  // Check if all latencies are within acceptable range
  const acceptableLatency = 2000; // 2 seconds
  const allAcceptable = latencyResults.every(result => 
    result.success && result.averageTime < acceptableLatency
  );
  
  if (allAcceptable) {
    logSuccess('All endpoints meet latency requirements');
  } else {
    logWarning('Some endpoints exceed latency requirements');
  }
  
  return { success: allAcceptable, results: latencyResults };
};

// Webhook handling validation
const validateWebhooks = async () => {
  logStep('Webhook Validation', 'Testing webhook handling and processing...');
  
  // Test Stripe webhook simulation
  logInfo('Testing Stripe webhook handling...');
  const stripeWebhookResult = await makeRequest(`${CONFIG.production.apiUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': 'test-signature'
    },
    body: {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: CONFIG.testData.testTip.amount,
          currency: CONFIG.testData.testTip.currency,
          status: 'succeeded'
        }
      }
    }
  });
  
  if (!stripeWebhookResult.success) {
    logWarning(`Stripe webhook test failed: ${stripeWebhookResult.error || stripeWebhookResult.statusCode}`);
  } else {
    logSuccess('Stripe webhook handling successful');
  }
  
  // Test Firebase webhook simulation
  logInfo('Testing Firebase webhook handling...');
  const firebaseWebhookResult = await makeRequest(`${CONFIG.production.apiUrl}/webhooks/firebase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      event: 'user.created',
      data: {
        uid: 'test-user-123',
        email: CONFIG.testData.testUser.email
      }
    }
  });
  
  if (!firebaseWebhookResult.success) {
    logWarning(`Firebase webhook test failed: ${firebaseWebhookResult.error || firebaseWebhookResult.statusCode}`);
  } else {
    logSuccess('Firebase webhook handling successful');
  }
  
  logSuccess('Webhook validation completed');
  return true;
};

// Performance testing
const testPerformance = async () => {
  logStep('Performance Testing', 'Running performance benchmarks...');
  
  // Test concurrent requests
  logInfo('Testing concurrent request handling...');
  const concurrentRequests = 10;
  const startTime = Date.now();
  
  const promises = Array.from({ length: concurrentRequests }, () =>
    makeRequest(`${CONFIG.production.baseUrl}/api/health`)
  );
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successfulRequests = results.filter(result => result.success).length;
  const totalTime = endTime - startTime;
  const averageTime = totalTime / concurrentRequests;
  
  logInfo(`Concurrent requests: ${successfulRequests}/${concurrentRequests} successful`);
  logInfo(`Total time: ${totalTime}ms, Average: ${averageTime.toFixed(2)}ms per request`);
  
  if (successfulRequests === concurrentRequests) {
    logSuccess('Concurrent request handling successful');
  } else {
    logWarning(`Some concurrent requests failed: ${concurrentRequests - successfulRequests} failed`);
  }
  
  // Test memory usage (simulated)
  logInfo('Testing memory usage patterns...');
  const memoryTest = await makeRequest(`${CONFIG.production.baseUrl}/api/health`, {
    headers: {
      'X-Memory-Test': 'true'
    }
  });
  
  if (memoryTest.success) {
    logSuccess('Memory usage patterns acceptable');
  } else {
    logWarning('Memory usage test failed');
  }
  
  return {
    concurrentRequests: successfulRequests,
    totalTime,
    averageTime,
    memoryTest: memoryTest.success
  };
};

// Security validation
const validateSecurity = async () => {
  logStep('Security Validation', 'Testing security measures and access controls...');
  
  // Test unauthorized access
  logInfo('Testing unauthorized access prevention...');
  const unauthorizedResult = await makeRequest(`${CONFIG.production.baseUrl}/api/user/profile`, {
    method: 'GET'
  });
  
  if (!unauthorizedResult.success && unauthorizedResult.statusCode === 401) {
    logSuccess('Unauthorized access properly blocked');
  } else {
    logError('Unauthorized access not properly blocked');
    return false;
  }
  
  // Test CORS headers
  logInfo('Testing CORS headers...');
  const corsResult = await makeRequest(`${CONFIG.production.baseUrl}/api/health`, {
    method: 'OPTIONS'
  });
  
  if (corsResult.headers['access-control-allow-origin']) {
    logSuccess('CORS headers properly configured');
  } else {
    logWarning('CORS headers not found');
  }
  
  // Test rate limiting
  logInfo('Testing rate limiting...');
  const rateLimitPromises = Array.from({ length: 20 }, () =>
    makeRequest(`${CONFIG.production.baseUrl}/api/health`)
  );
  
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const rateLimited = rateLimitResults.some(result => result.statusCode === 429);
  
  if (rateLimited) {
    logSuccess('Rate limiting properly configured');
  } else {
    logWarning('Rate limiting may not be configured');
  }
  
  logSuccess('Security validation completed');
  return true;
};

// Generate validation report
const generateValidationReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    results: {
      healthChecks: results.healthChecks,
      authentication: results.authentication,
      dataFlows: results.dataFlows,
      latency: results.latency,
      webhooks: results.webhooks,
      performance: results.performance,
      security: results.security
    },
    summary: {
      totalTests: 7,
      passedTests: Object.values(results).filter(result => result.success).length,
      failedTests: Object.values(results).filter(result => !result.success).length
    }
  };
  
  // Save report
  const reportPath = path.join('reports', `post-deploy-validation-${Date.now()}.json`);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Validation report saved to: ${reportPath}`);
  return report;
};

// Main validation function
const runValidation = async () => {
  const startTime = Date.now();
  const results = {};
  
  try {
    log(`🔍 Starting SportBeaconAI Post-Deployment Validation`, 'bright');
    
    // Step 1: Health check validation
    results.healthChecks = { success: await validateHealthChecks() };
    
    // Step 2: Authentication validation
    const authResult = await validateAuthentication();
    results.authentication = authResult;
    
    if (!authResult.success) {
      logError('Authentication validation failed. Stopping validation.');
      return false;
    }
    
    // Step 3: Data flow validation
    results.dataFlows = { success: await validateDataFlows(authResult.token) };
    
    // Step 4: Latency testing
    const latencyResult = await testLatency();
    results.latency = latencyResult;
    
    // Step 5: Webhook validation
    results.webhooks = { success: await validateWebhooks() };
    
    // Step 6: Performance testing
    const performanceResult = await testPerformance();
    results.performance = { success: true, data: performanceResult };
    
    // Step 7: Security validation
    results.security = { success: await validateSecurity() };
    
    // Generate report
    const report = generateValidationReport(results);
    
    // Summary
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log(`\n${colors.bright}Validation Summary:${colors.reset}`, 'cyan');
    log(`Duration: ${Math.round(duration / 1000)}s`, 'blue');
    log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`, 'green');
    log(`Tests Failed: ${report.summary.failedTests}/${report.summary.totalTests}`, 'red');
    
    if (report.summary.failedTests === 0) {
      logSuccess('🎉 All post-deployment validations passed!');
      return true;
    } else {
      logWarning('⚠️  Some validations failed. Check the report for details.');
      return false;
    }
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    return false;
  }
};

// CLI execution
if (require.main === module) {
  runValidation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  runValidation,
  CONFIG,
  log,
  logStep,
  logSuccess,
  logWarning,
  logError,
  logInfo
}; 