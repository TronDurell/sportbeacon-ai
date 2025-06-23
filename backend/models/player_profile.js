const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['PLAYER', 'TRAINER'],
        required: true,
        default: 'PLAYER'
    },
    personalInfo: {
        displayName: String,
        bio: String,
        avatar: {
            url: String,
            customizations: Map,
            lastUpdated: Date
        },
        sports: [{
            name: String,
            level: String,
            yearsExperience: Number,
            isMain: Boolean
        }],
        location: {
            type: { type: String, default: 'Point' },
            coordinates: [Number]
        }
    },
    trainerInfo: {
        isVerified: {
            type: Boolean,
            default: false
        },
        specialties: [String],
        certifications: [{
            name: String,
            issuer: String,
            dateEarned: Date,
            expiryDate: Date,
            verificationUrl: String
        }],
        roster: [{
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: String,
                enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
                default: 'PENDING'
            },
            joinDate: Date,
            notes: String
        }]
    },
    performance: {
        weeklyFocus: [{
            skill: String,
            target: String,
            progress: Number,
            startDate: Date,
            endDate: Date
        }],
        injuries: [{
            type: String,
            location: String,
            severity: String,
            startDate: Date,
            endDate: Date,
            notes: String,
            status: {
                type: String,
                enum: ['ACTIVE', 'RECOVERED', 'MANAGING'],
                default: 'ACTIVE'
            }
        }],
        metrics: {
            type: Map,
            of: {
                current: Number,
                history: [{
                    value: Number,
                    date: Date
                }]
            }
        }
    },
    venues: [{
        venueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        },
        checkIns: [{
            date: Date,
            duration: Number,
            activities: [String]
        }],
        isHome: Boolean,
        lastVisit: Date,
        visitCount: Number
    }],
    teams: [{
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        role: {
            type: String,
            enum: ['MEMBER', 'CAPTAIN', 'COACH', 'ADMIN'],
            default: 'MEMBER'
        },
        joinDate: Date,
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
            default: 'PENDING'
        }
    }],
    social: {
        followers: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            since: Date
        }],
        following: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            since: Date
        }],
        visibility: {
            profile: {
                type: String,
                enum: ['PUBLIC', 'FOLLOWERS', 'TEAM', 'PRIVATE'],
                default: 'PUBLIC'
            },
            performance: {
                type: String,
                enum: ['PUBLIC', 'FOLLOWERS', 'TEAM', 'PRIVATE'],
                default: 'TEAM'
            },
            injuries: {
                type: String,
                enum: ['PUBLIC', 'FOLLOWERS', 'TEAM', 'PRIVATE'],
                default: 'PRIVATE'
            }
        }
    },
    preferences: {
        notifications: {
            achievements: Boolean,
            teamUpdates: Boolean,
            trainerFeedback: Boolean,
            venueAlerts: Boolean,
            challenges: Boolean
        },
        aiAssistant: {
            voiceEnabled: {
                type: Boolean,
                default: true
            },
            whisperMode: {
                type: Boolean,
                default: false
            },
            language: {
                type: String,
                default: 'en-US'
            }
        },
        displayPreferences: {
            theme: {
                type: String,
                default: 'system'
            },
            metricSystem: {
                type: String,
                enum: ['METRIC', 'IMPERIAL'],
                default: 'METRIC'
            }
        }
    },
    journal: [{
        date: Date,
        type: {
            type: String,
            enum: ['NOTE', 'INJURY', 'MILESTONE', 'FEEDBACK'],
            default: 'NOTE'
        },
        content: String,
        mood: String,
        tags: [String],
        visibility: {
            type: String,
            enum: ['PUBLIC', 'FOLLOWERS', 'TEAM', 'PRIVATE'],
            default: 'PRIVATE'
        },
        media: [{
            type: String,
            url: String
        }]
    }]
}, {
    timestamps: true
});

// Indexes
playerProfileSchema.index({ 'personalInfo.location': '2dsphere' });
playerProfileSchema.index({ 'personalInfo.sports.name': 1 });
playerProfileSchema.index({ role: 1 });
playerProfileSchema.index({ 'teams.teamId': 1 });
playerProfileSchema.index({ 'social.followers.userId': 1 });
playerProfileSchema.index({ 'social.following.userId': 1 });

// Methods
playerProfileSchema.methods.updateWeeklyFocus = async function(focus) {
    const currentDate = new Date();
    this.performance.weeklyFocus = this.performance.weeklyFocus.filter(f => 
        f.endDate > currentDate
    );
    this.performance.weeklyFocus.push(...focus);
    return this.save();
};

playerProfileSchema.methods.addJournalEntry = async function(entry) {
    this.journal.push({
        ...entry,
        date: new Date()
    });
    return this.save();
};

playerProfileSchema.methods.checkInVenue = async function(venueId, checkInData) {
    let venue = this.venues.find(v => v.venueId.equals(venueId));
    if (!venue) {
        venue = {
            venueId,
            checkIns: [],
            visitCount: 0
        };
        this.venues.push(venue);
    }
    
    venue.checkIns.push({
        ...checkInData,
        date: new Date()
    });
    venue.lastVisit = new Date();
    venue.visitCount += 1;
    
    return this.save();
};

playerProfileSchema.methods.toggleFollow = async function(userId) {
    const isFollowing = this.social.following.some(f => f.userId.equals(userId));
    if (isFollowing) {
        this.social.following = this.social.following.filter(f => !f.userId.equals(userId));
    } else {
        this.social.following.push({
            userId,
            since: new Date()
        });
    }
    return this.save();
};

// Statics
playerProfileSchema.statics.findNearbyPlayers = function(coordinates, maxDistance = 10000) {
    return this.find({
        'personalInfo.location': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: maxDistance
            }
        }
    });
};

playerProfileSchema.statics.findByTeam = function(teamId) {
    return this.find({
        'teams.teamId': teamId,
        'teams.status': 'ACTIVE'
    });
};

const PlayerProfile = mongoose.model('PlayerProfile', playerProfileSchema);

module.exports = PlayerProfile; 