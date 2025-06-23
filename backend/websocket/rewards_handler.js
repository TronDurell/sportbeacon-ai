const RewardsService = require('../services/rewards_service');

class RewardsHandler {
    constructor(io) {
        this.io = io;
        this.rewardsService = new RewardsService(io);
        this.setupHandlers();
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected to rewards system');

            // Handle joining user-specific room for rewards
            socket.on('join_rewards_room', async (userId) => {
                if (!userId) return;
                socket.join(`rewards_${userId}`);
                
                // Send initial progress summary
                try {
                    const summary = await this.rewardsService.getProgressSummary(userId);
                    socket.emit('progress_update', summary);
                } catch (error) {
                    console.error('Error sending progress summary:', error);
                }
            });

            // Handle workout completion
            socket.on('workout_completed', async (data) => {
                try {
                    const { userId, workoutData } = data;
                    const rewards = await this.rewardsService.processWorkoutCompletion(userId, workoutData);
                    
                    // Emit rewards to user's room
                    this.io.to(`rewards_${userId}`).emit('rewards_earned', {
                        ...rewards,
                        animations: this._getRewardAnimations(rewards)
                    });

                    // Update leaderboard if significant changes
                    if (rewards.levelUp || rewards.newBadges.length > 0) {
                        const leaderboard = await this.rewardsService.getLeaderboard();
                        this.io.emit('leaderboard_update', leaderboard);
                    }
                } catch (error) {
                    console.error('Error processing workout completion:', error);
                    socket.emit('rewards_error', {
                        message: 'Failed to process workout rewards'
                    });
                }
            });

            // Handle leaderboard requests
            socket.on('get_leaderboard', async (category) => {
                try {
                    const leaderboard = await this.rewardsService.getLeaderboard(category);
                    socket.emit('leaderboard_update', leaderboard);
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    socket.emit('rewards_error', {
                        message: 'Failed to fetch leaderboard'
                    });
                }
            });

            // Handle progress summary requests
            socket.on('get_progress', async (userId) => {
                try {
                    const summary = await this.rewardsService.getProgressSummary(userId);
                    socket.emit('progress_update', summary);
                } catch (error) {
                    console.error('Error fetching progress:', error);
                    socket.emit('rewards_error', {
                        message: 'Failed to fetch progress summary'
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected from rewards system');
            });
        });
    }

    _getRewardAnimations(rewards) {
        const animations = [];

        // XP gain animation
        if (rewards.xp > 0) {
            animations.push({
                type: 'xp_gain',
                value: rewards.xp,
                duration: 2000
            });
        }

        // Level up animation
        if (rewards.levelUp) {
            animations.push({
                type: 'level_up',
                value: rewards.levelUp.newLevel,
                duration: 3000,
                tier: rewards.levelUp.newTier
            });
        }

        // New badges animations
        rewards.newBadges.forEach(badgeId => {
            animations.push({
                type: 'badge_earned',
                badgeId,
                duration: 2500
            });
        });

        // Streak animation
        if (rewards.streakUpdated) {
            animations.push({
                type: 'streak_update',
                duration: 2000
            });
        }

        return animations;
    }

    // Helper method to broadcast achievements to all connected clients
    broadcastAchievement(userId, achievement) {
        this.io.emit('global_achievement', {
            userId,
            achievement,
            timestamp: Date.now()
        });
    }
}

module.exports = RewardsHandler; 