const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const axios = require('axios');
const crypto = require('crypto');

// Slack configuration
const slackToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const githubToken = process.env.GITHUB_TOKEN;
const cursorWebhookUrl = process.env.CURSOR_WEBHOOK_URL;

const slack = new WebClient(slackToken);
const slackEvents = createEventAdapter(slackSigningSecret);

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
• \`/cursor help\` - Show this help message

*Examples:*
• \`/cursor build RangeReport.tsx\`
• \`/cursor deploy staging vanguard-stable-v1\`
• \`/cursor badge upgrade U1234567890 Gold\`
• \`/cursor invite developer@example.com admin\`
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

// Export for use in other modules
module.exports = {
  slackEvents,
  commandHandlers,
  handleBuildCompletion,
  handleDeploymentCompletion
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