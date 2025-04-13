const PlayerProfile = require('../models/player_profile');
const UserStats = require('../models/user_stats');

class CommunityFeed {
    constructor(io) {
        this.io = io;
        this.feedTypes = {
            TEAM_UPDATE: 'team_update',
            NEW_FOLLOWER: 'new_follower',
            POST_COMMENT: 'post_comment',
            ACHIEVEMENT: 'achievement',
            MILESTONE: 'milestone'
        };
    }

    async getTrainerFeed(trainerId, options = {}) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        });

        if (!trainerProfile) {
            throw new Error('Trainer profile not found');
        }

        const feed = await this._aggregateTrainerFeed(
            trainerProfile,
            options.limit || 20,
            options.offset || 0
        );

        return {
            items: feed,
            meta: {
                total: await this._countTrainerFeedItems(trainerProfile),
                hasMore: feed.length === options.limit
            }
        };
    }

    async getTeamFeed(teamId, options = {}) {
        const feed = await this._aggregateTeamFeed(
            teamId,
            options.limit || 20,
            options.offset || 0
        );

        return {
            items: feed,
            meta: {
                total: await this._countTeamFeedItems(teamId),
                hasMore: feed.length === options.limit
            }
        };
    }

    async addTeamUpdate(trainerId, teamId, update) {
        const hasAccess = await this._validateTrainerTeamAccess(trainerId, teamId);
        if (!hasAccess) {
            throw new Error('Unauthorized access to team');
        }

        const feedItem = {
            type: this.feedTypes.TEAM_UPDATE,
            teamId,
            trainerId,
            content: update.content,
            media: update.media || [],
            timestamp: new Date(),
            visibility: update.visibility || 'team',
            reactions: []
        };

        await this._saveFeedItem(feedItem);
        await this._notifyTeamMembers(teamId, feedItem);

        return feedItem;
    }

    async addComment(userId, itemId, comment) {
        const feedItem = await this._getFeedItem(itemId);
        if (!feedItem) {
            throw new Error('Feed item not found');
        }

        const hasAccess = await this._validateFeedAccess(userId, feedItem);
        if (!hasAccess) {
            throw new Error('Unauthorized access to feed item');
        }

        const commentObj = {
            userId,
            content: comment.content,
            timestamp: new Date()
        };

        await this._addCommentToFeedItem(itemId, commentObj);
        await this._notifyFeedItemParticipants(feedItem, commentObj);

        return commentObj;
    }

    async addReaction(userId, itemId, reaction) {
        const feedItem = await this._getFeedItem(itemId);
        if (!feedItem) {
            throw new Error('Feed item not found');
        }

        const hasAccess = await this._validateFeedAccess(userId, feedItem);
        if (!hasAccess) {
            throw new Error('Unauthorized access to feed item');
        }

        await this._addReactionToFeedItem(itemId, {
            userId,
            type: reaction,
            timestamp: new Date()
        });

        return true;
    }

    async _aggregateTrainerFeed(trainerProfile, limit, offset) {
        const rosterIds = trainerProfile.trainerInfo.roster.map(p => p.playerId);
        const teamIds = trainerProfile.teams.map(t => t.teamId);

        // Combine feed items from multiple sources
        const feedItems = await Promise.all([
            this._getTeamUpdates(teamIds, limit),
            this._getPlayerAchievements(rosterIds, limit),
            this._getFollowerUpdates(trainerProfile.userId, limit),
            this._getCommentUpdates(trainerProfile.userId, limit)
        ]);

        // Merge, sort by timestamp, and apply limit/offset
        return this._mergeFeedItems(feedItems)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(offset, offset + limit);
    }

    async _aggregateTeamFeed(teamId, limit, offset) {
        const team = await this._getTeam(teamId);
        const memberIds = team.members.map(m => m.userId);

        const feedItems = await Promise.all([
            this._getTeamUpdates([teamId], limit),
            this._getPlayerAchievements(memberIds, limit),
            this._getMilestoneUpdates(teamId, limit)
        ]);

        return this._mergeFeedItems(feedItems)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(offset, offset + limit);
    }

    _mergeFeedItems(itemArrays) {
        return itemArrays.flat().reduce((merged, item) => {
            const existing = merged.find(m => m.id === item.id);
            if (!existing) {
                merged.push(item);
            }
            return merged;
        }, []);
    }

    async _getTeamUpdates(teamIds, limit) {
        // Implementation depends on your database schema
        return [];
    }

    async _getPlayerAchievements(playerIds, limit) {
        // Implementation depends on your database schema
        return [];
    }

    async _getFollowerUpdates(userId, limit) {
        // Implementation depends on your database schema
        return [];
    }

    async _getCommentUpdates(userId, limit) {
        // Implementation depends on your database schema
        return [];
    }

    async _getMilestoneUpdates(teamId, limit) {
        // Implementation depends on your database schema
        return [];
    }

    async _validateTrainerTeamAccess(trainerId, teamId) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        });

        return trainerProfile?.teams.some(
            team => team.teamId.equals(teamId) && 
                   ['COACH', 'ADMIN'].includes(team.role)
        );
    }

    async _validateFeedAccess(userId, feedItem) {
        // Implementation depends on your visibility rules
        return true;
    }

    async _notifyTeamMembers(teamId, feedItem) {
        const team = await this._getTeam(teamId);
        team.members.forEach(member => {
            this.io.to(`user_${member.userId}`).emit('feed_update', {
                type: 'new_team_update',
                data: feedItem
            });
        });
    }

    async _notifyFeedItemParticipants(feedItem, update) {
        // Notify relevant users based on feed item type
        switch (feedItem.type) {
            case this.feedTypes.TEAM_UPDATE:
                await this._notifyTeamMembers(feedItem.teamId, update);
                break;
            // Add other notification types as needed
        }
    }

    async _getTeam(teamId) {
        // Implementation depends on your database schema
        return null;
    }
}

module.exports = CommunityFeed; 