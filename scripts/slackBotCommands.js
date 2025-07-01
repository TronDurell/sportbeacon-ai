const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const axios = require('axios');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs, Timestamp } = require('firebase/firestore');

// Slack configuration
const slackToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const githubToken = process.env.GITHUB_TOKEN;
const cursorWebhookUrl = process.env.CURSOR_WEBHOOK_URL;

const slack = new WebClient(slackToken);
const slackEvents = createEventAdapter(slackSigningSecret);

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Mock analytics
const analytics = {
  track: async (event, data) => {
    console.log(`📊 Analytics: ${event}`, data);
  }
};

// Command handlers
const commandHandlers = {
  /**
   * Build specific file or component
   */
  async build(args, channel, user) {
    try {
      const target = args[0];
      if (!target) {
        return '❌ Please specify a file or component to build. Usage: `/cursor build <filename>`';
      }

      // Trigger GitHub Action for building
      const response = await axios.post(
        `https://api.github.com/repos/TronDurell/sportbeacon-ai/dispatches`,
        {
          event_type: 'cursor_build',
          client_payload: {
            target: target,
            user: user,
            channel: channel
          }
        },
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      // Send initial response
      await slack.chat.postMessage({
        channel: channel,
        text: `🚀 Building \`${target}\`...\nRequested by <@${user}>`,
        thread_ts: null
      });

      return `✅ Build request submitted for \`${target}\`. Check the thread for updates.`;

    } catch (error) {
      console.error('Build command error:', error);
      return '❌ Failed to trigger build. Please check logs.';
    }
  },

  /**
   * Deploy to specific environment
   */
  async deploy(args, channel, user) {
    try {
      const environment = args[0] || 'staging';
      const branch = args[1] || 'main';

      if (!['staging', 'production', 'development'].includes(environment)) {
        return '❌ Invalid environment. Use: staging, production, or development';
      }

      // Trigger deployment
      const response = await axios.post(
        `https://api.github.com/repos/TronDurell/sportbeacon-ai/dispatches`,
        {
          event_type: 'deploy',
          client_payload: {
            environment: environment,
            branch: branch,
            user: user,
            channel: channel
          }
        },
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      await slack.chat.postMessage({
        channel: channel,
        text: `🚀 Deploying to \`${environment}\` from branch \`${branch}\`...\nRequested by <@${user}>`,
        thread_ts: null
      });

      return `✅ Deployment to \`${environment}\` initiated. Check the thread for progress.`;

    } catch (error) {
      console.error('Deploy command error:', error);
      return '❌ Failed to trigger deployment. Please check logs.';
    }
  },

  /**
   * Manage user badges
   */
  async badge(args, channel, user) {
    try {
      const action = args[0];
      const targetUser = args[1];
      const badgeLevel = args[2];

      if (!action || !targetUser) {
        return '❌ Usage: `/cursor badge <action> <user> [level]`\nActions: check, upgrade, downgrade, reset';
      }

      switch (action) {
        case 'check':
          const userBadge = await getUserBadge(targetUser);
          return `🏆 <@${targetUser}> current badge: \`${userBadge.level}\` (${userBadge.title})`;

        case 'upgrade':
          if (!badgeLevel) {
            return '❌ Please specify badge level: Bronze, Silver, Gold, Platinum, Diamond';
          }
          await updateUserBadge(targetUser, badgeLevel, 'upgrade');
          return `✅ Upgraded <@${targetUser}> to \`${badgeLevel}\` badge`;

        case 'downgrade':
          if (!badgeLevel) {
            return '❌ Please specify badge level: Bronze, Silver, Gold, Platinum, Diamond';
          }
          await updateUserBadge(targetUser, badgeLevel, 'downgrade');
          return `⬇️ Downgraded <@${targetUser}> to \`${badgeLevel}\` badge`;

        case 'reset':
          await updateUserBadge(targetUser, 'Bronze', 'reset');
          return `🔄 Reset <@${targetUser}> to Bronze badge`;

        default:
          return '❌ Invalid action. Use: check, upgrade, downgrade, reset';
      }

    } catch (error) {
      console.error('Badge command error:', error);
      return '❌ Failed to manage badge. Please check logs.';
    }
  },

  /**
   * Invite user to project
   */
  async invite(args, channel, user) {
    try {
      const email = args[0];
      const role = args[1] || 'member';

      if (!email) {
        return '❌ Please provide an email address. Usage: `/cursor invite <email> [role]`';
      }

      if (!['member', 'admin', 'viewer'].includes(role)) {
        return '❌ Invalid role. Use: member, admin, or viewer';
      }

      // Invite to GitHub repository
      const response = await axios.post(
        `https://api.github.com/repos/TronDurell/sportbeacon-ai/collaborators`,
        {
          permission: role
        },
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      // Send invitation email
      await sendInvitationEmail(email, role, user);

      return `✅ Invitation sent to \`${email}\` with \`${role}\` role.`;

    } catch (error) {
      console.error('Invite command error:', error);
      return '❌ Failed to send invitation. Please check logs.';
    }
  },

  /**
   * Get system status
   */
  async status(args, channel, user) {
    try {
      const status = await getSystemStatus();
      
      const statusMessage = {
        text: '📊 System Status',
        attachments: [
          {
            color: status.overall === 'healthy' ? 'good' : 'danger',
            fields: [
              {
                title: 'Overall Status',
                value: status.overall,
                short: true
              },
              {
                title: 'API Health',
                value: status.api,
                short: true
              },
              {
                title: 'Database',
                value: status.database,
                short: true
              },
              {
                title: 'AI Services',
                value: status.aiServices,
                short: true
              },
              {
                title: 'Last Updated',
                value: status.lastUpdated,
                short: false
              }
            ]
          }
        ]
      };

      await slack.chat.postMessage({
        channel: channel,
        ...statusMessage
      });

      return '✅ Status report sent to channel.';

    } catch (error) {
      console.error('Status command error:', error);
      return '❌ Failed to get system status. Please check logs.';
    }
  },

  /**
   * Run creator economy audit
   */
  async audit(args, channel, user) {
    try {
      const action = args[0] || 'run';
      
      if (action === 'run') {
        // Send initial response
        await slack.chat.postMessage({
          channel: channel,
          text: `🔍 Running Creator Economy Audit...\nRequested by <@${user}>`,
          thread_ts: null
        });

        // Run diagnostics
        const alerts = await useDiagnosticsAlerts();
        
        // Get top creators by payout
        const payoutsRef = collection(firestore, 'payouts');
        const topPayoutsQuery = query(
          payoutsRef,
          where('status', '==', 'completed'),
          orderBy('amount', 'desc'),
          limit(3)
        );
        
        const topPayoutsSnapshot = await getDocs(topPayoutsQuery);
        const topCreators = topPayoutsSnapshot.docs.map(doc => ({
          creatorId: doc.data().creatorId,
          amount: doc.data().amount,
          date: doc.data().processedAt
        }));

        // Generate audit summary
        const summary = {
          alerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.type === 'critical').length,
          topCreators: topCreators.length,
          flaggedIssues: alerts.filter(a => a.type === 'critical' || a.type === 'high').length
        };

        // Send audit results
        const attachments = [
          {
            color: summary.criticalAlerts > 0 ? '#FF4444' : '#00CC00',
            title: 'Audit Summary',
            text: `Alerts: ${summary.alerts}\nCritical: ${summary.criticalAlerts}\nTop Creators: ${summary.topCreators}\nFlagged Issues: ${summary.flaggedIssues}`,
            footer: 'Creator Economy Audit',
            ts: Math.floor(Date.now() / 1000)
          }
        ];

        // Add top creators
        if (topCreators.length > 0) {
          attachments.push({
            color: '#007AFF',
            title: 'Top Creators by Payout',
            text: topCreators.map((creator, index) => 
              `${index + 1}. <@${creator.creatorId}> - $${creator.amount}`
            ).join('\n'),
            footer: 'Payout Analysis',
            ts: Math.floor(Date.now() / 1000)
          });
        }

        // Add flagged issues
        const flaggedIssues = alerts.filter(a => a.type === 'critical' || a.type === 'high');
        if (flaggedIssues.length > 0) {
          attachments.push({
            color: '#FF8800',
            title: 'Flagged Issues',
            text: flaggedIssues.map(issue => 
              `• ${issue.title}: ${issue.message}`
            ).join('\n'),
            footer: 'Issue Tracking',
            ts: Math.floor(Date.now() / 1000)
          });
        }

        await slack.chat.postMessage({
          channel: channel,
          text: `✅ Creator Economy Audit completed`,
          attachments: attachments
        });

        return `✅ Audit completed with ${summary.alerts} alerts and ${summary.flaggedIssues} flagged issues.`;

      } else {
        return '❌ Invalid audit action. Use: run';
      }

    } catch (error) {
      console.error('Audit command error:', error);
      return '❌ Failed to run audit. Please check logs.';
    }
  },

  /**
   * Show help
   */
  async help(args, channel, user) {
    const helpText = `
🤖 *Cursor Bot Commands*

*Build Commands:*
• \`/cursor build <filename>\` - Build specific file/component
• \`/cursor build DrillLab.tsx\` - Build DrillLab component

*Deployment:*
• \`/cursor deploy [environment] [branch]\` - Deploy to environment
• \`/cursor deploy production main\` - Deploy to production

*User Management:*
• \`/cursor badge check <user>\` - Check user's badge
• \`/cursor badge upgrade <user> <level>\` - Upgrade user badge
• \`/cursor invite <email> [role]\` - Invite user to project

*System:*
• \`/cursor status\` - Get system health status
• \`/cursor audit run\` - Run creator economy audit
• \`/cursor help\` - Show this help message

*Examples:*
• \`/cursor build RangeReport.tsx\`
• \`/cursor deploy staging vanguard-stable-v1\`
• \`/cursor badge upgrade U1234567890 Gold\`
• \`/cursor invite developer@example.com admin\`
• \`/cursor tip audit run\`
    `;

    return helpText;
  }
};

/**
 * Handle Slack slash commands
 */
slackEvents.on('app_mention', async (event) => {
  try {
    const text = event.text.replace(/<@[^>]+>/, '').trim();
    const args = text.split(' ');
    const command = args[0]?.toLowerCase();
    const commandArgs = args.slice(1);

    let response = '';

    if (commandHandlers[command]) {
      response = await commandHandlers[command](commandArgs, event.channel, event.user);
    } else {
      response = await commandHandlers.help([], event.channel, event.user);
    }

    await slack.chat.postMessage({
      channel: event.channel,
      text: response,
      thread_ts: event.ts
    });

  } catch (error) {
    console.error('Error handling app mention:', error);
    
    await slack.chat.postMessage({
      channel: event.channel,
      text: '❌ An error occurred while processing your command. Please try again.',
      thread_ts: event.ts
    });
  }
});

/**
 * Handle GitHub webhook events
 */
slackEvents.on('url_verification', (challenge) => {
  return challenge.challenge;
});

/**
 * Get user badge from Firestore
 */
async function getUserBadge(userId) {
  try {
    // This would connect to Firestore to get user badge
    // For now, return mock data
    return {
      level: 'Silver',
      title: 'Silver Marksman',
      description: 'Demonstrating consistent improvement'
    };
  } catch (error) {
    console.error('Failed to get user badge:', error);
    throw error;
  }
}

/**
 * Update user badge
 */
async function updateUserBadge(userId, badgeLevel, action) {
  try {
    // This would update Firestore
    console.log(`${action} badge for user ${userId} to ${badgeLevel}`);
    
    // Send notification to user
    await slack.chat.postMessage({
      channel: userId,
      text: `🏆 Your badge has been ${action}ed to \`${badgeLevel}\`!`
    });
  } catch (error) {
    console.error('Failed to update user badge:', error);
    throw error;
  }
}

/**
 * Send invitation email
 */
async function sendInvitationEmail(email, role, invitedBy) {
  try {
    // This would send an actual email
    console.log(`Sending invitation to ${email} with role ${role} by ${invitedBy}`);
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

/**
 * Get system status
 */
async function getSystemStatus() {
  try {
    // This would check actual system health
    return {
      overall: 'healthy',
      api: 'operational',
      database: 'operational',
      aiServices: 'operational',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get system status:', error);
    return {
      overall: 'degraded',
      api: 'operational',
      database: 'operational',
      aiServices: 'degraded',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Handle GitHub webhook for build completion
 */
async function handleBuildCompletion(payload) {
  try {
    const { target, user, channel, status, logs } = payload;
    
    const statusEmoji = status === 'success' ? '✅' : '❌';
    const statusText = status === 'success' ? 'completed successfully' : 'failed';
    
    await slack.chat.postMessage({
      channel: channel,
      text: `${statusEmoji} Build for \`${target}\` ${statusText}.\nRequested by <@${user}>`,
      attachments: logs ? [{ text: logs }] : []
    });
  } catch (error) {
    console.error('Failed to handle build completion:', error);
  }
}

/**
 * Handle GitHub webhook for deployment completion
 */
async function handleDeploymentCompletion(payload) {
  try {
    const { environment, branch, user, channel, status, url } = payload;
    
    const statusEmoji = status === 'success' ? '🚀' : '💥';
    const statusText = status === 'success' ? 'deployed successfully' : 'deployment failed';
    
    const message = {
      text: `${statusEmoji} Deployment to \`${environment}\` ${statusText}.\nBranch: \`${branch}\`\nRequested by <@${user}>`,
      attachments: []
    };

    if (url) {
      message.attachments.push({
        text: `🔗 <${url}|View deployment>`
      });
    }

    await slack.chat.postMessage({
      channel: channel,
      ...message
    });
  } catch (error) {
    console.error('Failed to handle deployment completion:', error);
  }
}

// Diagnostics Alerts System
const useDiagnosticsAlerts = async () => {
  const alerts = [];
  
  try {
    // Check for failed payouts (3+ in last 24 hours)
    const payoutsRef = collection(firestore, 'payouts');
    const failedPayoutsQuery = query(
      payoutsRef,
      where('status', '==', 'failed'),
      where('requestedAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)),
      orderBy('requestedAt', 'desc')
    );
    
    const failedPayoutsSnapshot = await getDocs(failedPayoutsQuery);
    const failedPayouts = failedPayoutsSnapshot.docs;
    
    if (failedPayouts.length >= 3) {
      alerts.push({
        type: 'critical',
        title: 'High Failed Payout Rate',
        message: `${failedPayouts.length} failed payouts in the last 24 hours`,
        data: {
          failedCount: failedPayouts.length,
          timeWindow: '24 hours',
          topCreators: failedPayouts.slice(0, 3).map(doc => doc.data().creatorId)
        }
      });
    }

    // Check for analytics spike in refund/dropoff rate
    const eventsRef = collection(firestore, 'monetization_events');
    const recentEventsQuery = query(
      eventsRef,
      where('timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      orderBy('timestamp', 'desc')
    );
    
    const eventsSnapshot = await getDocs(recentEventsQuery);
    const recentEvents = eventsSnapshot.docs.map(doc => doc.data());
    
    const refundEvents = recentEvents.filter(event => event.type === 'refund');
    const totalEvents = recentEvents.length;
    const refundRate = totalEvents > 0 ? refundEvents.length / totalEvents : 0;
    
    if (refundRate > 0.15) { // 15% threshold
      alerts.push({
        type: 'warning',
        title: 'High Refund Rate Detected',
        message: `${(refundRate * 100).toFixed(1)}% refund rate in the last 7 days`,
        data: {
          refundRate,
          refundCount: refundEvents.length,
          totalEvents,
          timeWindow: '7 days'
        }
      });
    }

    // Check for dropoff rate spike
    const dropoffEvents = recentEvents.filter(event => 
      event.data?.dropoffCause || event.type === 'leaderboard_change'
    );
    const dropoffRate = totalEvents > 0 ? dropoffEvents.length / totalEvents : 0;
    
    if (dropoffRate > 0.25) { // 25% threshold
      alerts.push({
        type: 'warning',
        title: 'High Dropoff Rate Detected',
        message: `${(dropoffRate * 100).toFixed(1)}% dropoff rate in the last 7 days`,
        data: {
          dropoffRate,
          dropoffCount: dropoffEvents.length,
          totalEvents,
          timeWindow: '7 days',
          topDropoffCauses: dropoffEvents
            .map(event => event.data?.dropoffCause)
            .filter(Boolean)
            .slice(0, 3)
        }
      });
    }

    // Check if any badge never triggers in 7 days
    const badgesRef = collection(firestore, 'badges');
    const recentBadgesQuery = query(
      badgesRef,
      where('earnedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      orderBy('earnedAt', 'desc')
    );
    
    const badgesSnapshot = await getDocs(recentBadgesQuery);
    const recentBadges = badgesSnapshot.docs.map(doc => doc.data());
    
    // Get all badge types that should be auto-generated
    const expectedBadgeTypes = [
      'first_tip', 'tipping_streak_7', 'tipping_streak_30', 
      'big_tipper', 'creator_supporter', 'earnings_milestone_100'
    ];
    
    const triggeredBadgeTypes = [...new Set(recentBadges.map(badge => badge.type))];
    const missingBadgeTypes = expectedBadgeTypes.filter(type => 
      !triggeredBadgeTypes.includes(type)
    );
    
    if (missingBadgeTypes.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Inactive Badge Types',
        message: `${missingBadgeTypes.length} badge types haven't been triggered in 7 days`,
        data: {
          missingBadgeTypes,
          triggeredBadgeTypes,
          timeWindow: '7 days'
        }
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error in diagnostics alerts:', error);
    alerts.push({
      type: 'error',
      title: 'Diagnostics Error',
      message: 'Failed to run diagnostics checks',
      data: { error: error.message }
    });
    return alerts;
  }
};

// Send alert to Slack
const sendSlackAlert = async (alert) => {
  try {
    const colorMap = {
      critical: '#FF4444',
      warning: '#FF8800',
      info: '#007AFF',
      error: '#FF0000'
    };

    const attachment = {
      color: colorMap[alert.type] || '#666666',
      title: alert.title,
      text: alert.message,
      fields: Object.entries(alert.data || {}).map(([key, value]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
        short: true
      })),
      footer: 'Creator Economy Diagnostics',
      ts: Math.floor(Date.now() / 1000)
    };

    await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID || 'C1234567890',
      text: `🚨 ${alert.title}: ${alert.message}`,
      attachments: [attachment]
    });

    console.log(`✅ Alert sent to Slack: ${alert.title}`);
  } catch (error) {
    console.error('Error sending Slack alert:', error);
  }
};

// Main diagnostics function
const runDiagnostics = async () => {
  console.log('🔍 Running Creator Economy Diagnostics...');
  
  const alerts = await useDiagnosticsAlerts();
  
  if (alerts.length === 0) {
    console.log('✅ No alerts generated - system is healthy');
    return;
  }

  console.log(`🚨 Generated ${alerts.length} alerts:`);
  
  for (const alert of alerts) {
    console.log(`- ${alert.type.toUpperCase()}: ${alert.title}`);
    await sendSlackAlert(alert);
  }

  // Track analytics
  await analytics.track('diagnostics_completed', {
    alertCount: alerts.length,
    alertTypes: alerts.map(a => a.type),
    timestamp: new Date().toISOString()
  });
};

// Export for use in other modules
module.exports = {
  slackEvents,
  commandHandlers,
  handleBuildCompletion,
  handleDeploymentCompletion,
  useDiagnosticsAlerts,
  sendSlackAlert,
  runDiagnostics
};

// Start the server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  
  slackEvents.start(port).then(() => {
    console.log(`🚀 Slack bot listening on port ${port}`);
  }).catch((error) => {
    console.error('Failed to start Slack bot:', error);
    process.exit(1);
  });
} 