#!/usr/bin/env node

/**
 * SportBeaconAI Production Monitoring Setup Script
 * 
 * This script sets up comprehensive production monitoring including
 * Grafana dashboards, Firebase Analytics, and real-time alerting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  production: {
    firebaseProject: 'sportbeacon-ai-production',
    grafanaUrl: 'https://grafana.sportbeacon.ai',
    grafanaApiKey: process.env.GRAFANA_API_KEY,
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    alerting: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL,
      pagerduty: process.env.PAGERDUTY_API_KEY
    }
  },
  monitoring: {
    metrics: [
      'response_time',
      'error_rate',
      'throughput',
      'memory_usage',
      'cpu_usage',
      'active_users',
      'database_connections',
      'cache_hit_rate'
    ],
    alerts: [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 0.05',
        duration: '5m',
        severity: 'critical'
      },
      {
        name: 'High Response Time',
        condition: 'response_time > 2s',
        duration: '5m',
        severity: 'warning'
      },
      {
        name: 'Service Down',
        condition: 'up == 0',
        duration: '1m',
        severity: 'critical'
      },
      {
        name: 'High Memory Usage',
        condition: 'memory_usage > 80%',
        duration: '5m',
        severity: 'warning'
      },
      {
        name: 'High CPU Usage',
        condition: 'cpu_usage > 90%',
        duration: '5m',
        severity: 'critical'
      }
    ]
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
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
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

// Setup Firebase Analytics
const setupFirebaseAnalytics = async () => {
  logStep('Firebase Analytics Setup', 'Configuring Firebase Analytics for production monitoring...');
  
  // Create Firebase Analytics configuration
  const analyticsConfig = {
    projectId: CONFIG.production.firebaseProject,
    apiKey: CONFIG.production.firebaseApiKey,
    customEvents: [
      'user_registration',
      'user_login',
      'tip_created',
      'payment_processed',
      'profile_updated',
      'media_uploaded',
      'error_occurred',
      'performance_metric'
    ],
    userProperties: [
      'user_type',
      'subscription_tier',
      'location',
      'device_type'
    ]
  };
  
  // Create analytics configuration file
  const analyticsPath = path.join('monitoring', 'firebase-analytics.json');
  fs.mkdirSync('monitoring', { recursive: true });
  fs.writeFileSync(analyticsPath, JSON.stringify(analyticsConfig, null, 2));
  
  logSuccess('Firebase Analytics configuration created');
  
  // Test Firebase Analytics connection
  logInfo('Testing Firebase Analytics connection...');
  const testResult = await makeRequest(`https://firebase.googleapis.com/v1/projects/${CONFIG.production.firebaseProject}`, {
    headers: {
      'Authorization': `Bearer ${CONFIG.production.firebaseApiKey}`
    }
  });
  
  if (testResult.success) {
    logSuccess('Firebase Analytics connection verified');
  } else {
    logWarning('Firebase Analytics connection test failed');
  }
  
  return true;
};

// Setup Grafana Dashboard
const setupGrafanaDashboard = async () => {
  logStep('Grafana Dashboard Setup', 'Creating comprehensive Grafana dashboard...');
  
  if (!CONFIG.production.grafanaApiKey) {
    logWarning('Grafana API key not configured. Skipping Grafana setup.');
    return false;
  }
  
  // Create comprehensive Grafana dashboard
  const dashboard = {
    dashboard: {
      title: 'SportBeaconAI Production Dashboard',
      tags: ['sportbeacon', 'production', 'monitoring'],
      timezone: 'browser',
      refresh: '30s',
      schemaVersion: 30,
      version: 1,
      panels: [
        // System Overview Panel
        {
          title: 'System Overview',
          type: 'row',
          gridPos: { h: 1, w: 24, x: 0, y: 0 }
        },
        {
          title: 'Response Time',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 1 },
          targets: [
            {
              expr: 'rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])',
              legendFormat: '{{method}} {{route}}',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'Response Time (seconds)',
              min: 0
            }
          ]
        },
        {
          title: 'Error Rate',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 12, y: 1 },
          targets: [
            {
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])',
              legendFormat: '{{method}} {{route}}',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'Error Rate (%)',
              min: 0,
              max: 100
            }
          ]
        },
        {
          title: 'Throughput',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 9 },
          targets: [
            {
              expr: 'rate(http_requests_total[5m])',
              legendFormat: '{{method}} {{route}}',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'Requests per Second',
              min: 0
            }
          ]
        },
        {
          title: 'Active Users',
          type: 'stat',
          gridPos: { h: 8, w: 12, x: 12, y: 9 },
          targets: [
            {
              expr: 'sum(active_users_total)',
              legendFormat: 'Active Users',
              refId: 'A'
            }
          ],
          fieldConfig: {
            defaults: {
              color: {
                mode: 'thresholds'
              },
              thresholds: {
                steps: [
                  { color: 'green', value: null },
                  { color: 'yellow', value: 100 },
                  { color: 'red', value: 1000 }
                ]
              }
            }
          }
        },
        // User Activity Panel
        {
          title: 'User Activity',
          type: 'row',
          gridPos: { h: 1, w: 24, x: 0, y: 17 }
        },
        {
          title: 'User Registrations',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 18 },
          targets: [
            {
              expr: 'rate(user_registrations_total[5m])',
              legendFormat: 'Registrations per Second',
              refId: 'A'
            }
          ]
        },
        {
          title: 'User Logins',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 12, y: 18 },
          targets: [
            {
              expr: 'rate(user_logins_total[5m])',
              legendFormat: 'Logins per Second',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Tips Created',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 26 },
          targets: [
            {
              expr: 'rate(tips_created_total[5m])',
              legendFormat: 'Tips per Second',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Payments Processed',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 12, y: 26 },
          targets: [
            {
              expr: 'rate(payments_processed_total[5m])',
              legendFormat: 'Payments per Second',
              refId: 'A'
            }
          ]
        },
        // System Resources Panel
        {
          title: 'System Resources',
          type: 'row',
          gridPos: { h: 1, w: 24, x: 0, y: 34 }
        },
        {
          title: 'Memory Usage',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 35 },
          targets: [
            {
              expr: 'memory_usage_percent',
              legendFormat: 'Memory Usage (%)',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'Memory Usage (%)',
              min: 0,
              max: 100
            }
          ]
        },
        {
          title: 'CPU Usage',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 12, y: 35 },
          targets: [
            {
              expr: 'cpu_usage_percent',
              legendFormat: 'CPU Usage (%)',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'CPU Usage (%)',
              min: 0,
              max: 100
            }
          ]
        },
        {
          title: 'Database Connections',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 0, y: 43 },
          targets: [
            {
              expr: 'database_connections_active',
              legendFormat: 'Active Connections',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Cache Hit Rate',
          type: 'graph',
          gridPos: { h: 8, w: 12, x: 12, y: 43 },
          targets: [
            {
              expr: 'cache_hit_rate',
              legendFormat: 'Cache Hit Rate (%)',
              refId: 'A'
            }
          ],
          yAxes: [
            {
              label: 'Cache Hit Rate (%)',
              min: 0,
              max: 100
            }
          ]
        }
      ]
    },
    folderId: 0,
    overwrite: true
  };
  
  // Create dashboard configuration file
  const dashboardPath = path.join('monitoring', 'grafana-dashboard.json');
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
  
  // Upload dashboard to Grafana
  logInfo('Uploading dashboard to Grafana...');
  const uploadResult = await makeRequest(`${CONFIG.production.grafanaUrl}/api/dashboards/db`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.production.grafanaApiKey}`,
      'Content-Type': 'application/json'
    },
    body: dashboard
  });
  
  if (uploadResult.success) {
    logSuccess('Grafana dashboard uploaded successfully');
    logInfo(`Dashboard URL: ${CONFIG.production.grafanaUrl}/d/${uploadResult.data.uid}`);
  } else {
    logError(`Failed to upload dashboard: ${uploadResult.error || uploadResult.statusCode}`);
  }
  
  return uploadResult.success;
};

// Setup Alerting
const setupAlerting = async () => {
  logStep('Alerting Setup', 'Configuring real-time alerting and notifications...');
  
  const alertingConfig = {
    alerts: CONFIG.monitoring.alerts,
    notifications: {
      slack: CONFIG.production.alerting.slack ? {
        webhook_url: CONFIG.production.alerting.slack,
        channel: '#sportbeacon-alerts',
        username: 'SportBeaconAI Monitor'
      } : null,
      email: CONFIG.production.alerting.email ? {
        to: CONFIG.production.alerting.email,
        from: 'alerts@sportbeacon.ai',
        subject: 'SportBeaconAI Alert'
      } : null,
      pagerduty: CONFIG.production.alerting.pagerduty ? {
        api_key: CONFIG.production.alerting.pagerduty,
        service_id: 'sportbeacon-ai-production'
      } : null
    }
  };
  
  // Create alerting configuration file
  const alertingPath = path.join('monitoring', 'alerting-config.json');
  fs.writeFileSync(alertingPath, JSON.stringify(alertingConfig, null, 2));
  
  logSuccess('Alerting configuration created');
  
  // Test alerting channels
  if (CONFIG.production.alerting.slack) {
    logInfo('Testing Slack alerting...');
    const slackTest = await makeRequest(CONFIG.production.alerting.slack, {
      method: 'POST',
      body: {
        text: '🔔 SportBeaconAI monitoring setup completed successfully!',
        channel: '#sportbeacon-alerts'
      }
    });
    
    if (slackTest.success) {
      logSuccess('Slack alerting configured');
    } else {
      logWarning('Slack alerting test failed');
    }
  }
  
  return true;
};

// Setup Metrics Collection
const setupMetricsCollection = async () => {
  logStep('Metrics Collection Setup', 'Configuring metrics collection and aggregation...');
  
  const metricsConfig = {
    collection: {
      interval: '30s',
      retention: '30d',
      aggregation: {
        response_time: ['avg', 'p95', 'p99'],
        error_rate: ['avg', 'max'],
        throughput: ['sum', 'avg'],
        memory_usage: ['avg', 'max'],
        cpu_usage: ['avg', 'max'],
        active_users: ['current', 'max'],
        database_connections: ['current', 'max'],
        cache_hit_rate: ['avg', 'min']
      }
    },
    exporters: [
      {
        name: 'prometheus',
        endpoint: 'http://localhost:9090',
        metrics: CONFIG.monitoring.metrics
      },
      {
        name: 'firebase_analytics',
        project_id: CONFIG.production.firebaseProject,
        metrics: ['user_activity', 'performance', 'errors']
      }
    ]
  };
  
  // Create metrics configuration file
  const metricsPath = path.join('monitoring', 'metrics-config.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metricsConfig, null, 2));
  
  logSuccess('Metrics collection configuration created');
  return true;
};

// Setup Logging
const setupLogging = async () => {
  logStep('Logging Setup', 'Configuring comprehensive logging and log aggregation...');
  
  const loggingConfig = {
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    },
    transports: [
      {
        name: 'console',
        level: 'info',
        format: 'json'
      },
      {
        name: 'file',
        level: 'debug',
        filename: 'logs/sportbeacon-ai.log',
        maxsize: '10m',
        maxfiles: '5'
      },
      {
        name: 'firebase',
        level: 'error',
        project_id: CONFIG.production.firebaseProject
      }
    ],
    filters: [
      {
        name: 'sensitive_data',
        pattern: '(password|token|secret|key)',
        replacement: '[REDACTED]'
      }
    ]
  };
  
  // Create logging configuration file
  const loggingPath = path.join('monitoring', 'logging-config.json');
  fs.writeFileSync(loggingPath, JSON.stringify(loggingConfig, null, 2));
  
  // Create logs directory
  fs.mkdirSync('logs', { recursive: true });
  
  logSuccess('Logging configuration created');
  return true;
};

// Test Monitoring Setup
const testMonitoringSetup = async () => {
  logStep('Monitoring Test', 'Testing monitoring setup and connectivity...');
  
  const tests = [
    {
      name: 'Firebase Analytics',
      test: async () => {
        const result = await makeRequest(`https://firebase.googleapis.com/v1/projects/${CONFIG.production.firebaseProject}`, {
          headers: {
            'Authorization': `Bearer ${CONFIG.production.firebaseApiKey}`
          }
        });
        return result.success;
      }
    },
    {
      name: 'Grafana API',
      test: async () => {
        if (!CONFIG.production.grafanaApiKey) return true;
        const result = await makeRequest(`${CONFIG.production.grafanaUrl}/api/health`, {
          headers: {
            'Authorization': `Bearer ${CONFIG.production.grafanaApiKey}`
          }
        });
        return result.success;
      }
    },
    {
      name: 'Alerting Channels',
      test: async () => {
        let allWorking = true;
        
        if (CONFIG.production.alerting.slack) {
          const slackTest = await makeRequest(CONFIG.production.alerting.slack, {
            method: 'POST',
            body: { text: 'Test alert' }
          });
          if (!slackTest.success) allWorking = false;
        }
        
        return allWorking;
      }
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of tests) {
    logInfo(`Testing ${test.name}...`);
    const result = await test.test();
    
    if (result) {
      logSuccess(`${test.name} test passed`);
    } else {
      logError(`${test.name} test failed`);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
};

// Generate monitoring report
const generateMonitoringReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    components: {
      firebaseAnalytics: results.firebaseAnalytics,
      grafanaDashboard: results.grafanaDashboard,
      alerting: results.alerting,
      metricsCollection: results.metricsCollection,
      logging: results.logging,
      monitoringTest: results.monitoringTest
    },
    summary: {
      totalComponents: 6,
      configuredComponents: Object.values(results).filter(result => result).length,
      failedComponents: Object.values(results).filter(result => !result).length
    },
    urls: {
      grafana: CONFIG.production.grafanaUrl,
      firebase: `https://console.firebase.google.com/project/${CONFIG.production.firebaseProject}`
    }
  };
  
  // Save report
  const reportPath = path.join('reports', `monitoring-setup-${Date.now()}.json`);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Monitoring setup report saved to: ${reportPath}`);
  return report;
};

// Main setup function
const setupMonitoring = async () => {
  const startTime = Date.now();
  const results = {};
  
  try {
    log(`📊 Starting SportBeaconAI Production Monitoring Setup`, 'bright');
    
    // Step 1: Setup Firebase Analytics
    results.firebaseAnalytics = await setupFirebaseAnalytics();
    
    // Step 2: Setup Grafana Dashboard
    results.grafanaDashboard = await setupGrafanaDashboard();
    
    // Step 3: Setup Alerting
    results.alerting = await setupAlerting();
    
    // Step 4: Setup Metrics Collection
    results.metricsCollection = await setupMetricsCollection();
    
    // Step 5: Setup Logging
    results.logging = await setupLogging();
    
    // Step 6: Test Monitoring Setup
    results.monitoringTest = await testMonitoringSetup();
    
    // Generate report
    const report = generateMonitoringReport(results);
    
    // Summary
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log(`\n${colors.bright}Monitoring Setup Summary:${colors.reset}`, 'cyan');
    log(`Duration: ${Math.round(duration / 1000)}s`, 'blue');
    log(`Components Configured: ${report.summary.configuredComponents}/${report.summary.totalComponents}`, 'green');
    log(`Components Failed: ${report.summary.failedComponents}/${report.summary.totalComponents}`, 'red');
    
    if (report.summary.failedComponents === 0) {
      logSuccess('🎉 All monitoring components configured successfully!');
      logInfo(`Grafana Dashboard: ${report.urls.grafana}`);
      logInfo(`Firebase Console: ${report.urls.firebase}`);
      return true;
    } else {
      logWarning('⚠️  Some monitoring components failed to configure. Check the report for details.');
      return false;
    }
    
  } catch (error) {
    logError(`Monitoring setup failed: ${error.message}`);
    return false;
  }
};

// CLI execution
if (require.main === module) {
  setupMonitoring().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  setupMonitoring,
  CONFIG,
  log,
  logStep,
  logSuccess,
  logWarning,
  logError,
  logInfo
}; 