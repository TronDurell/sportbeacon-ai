const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalXP: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    tier: {
        type: String,
        enum: ['ROOKIE', 'PRODIGY', 'LEGEND'],
        default: 'ROOKIE'
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    workoutsCompleted: {
        type: Number,
        default: 0
    },
    badges: [{
        id: String,
        name: String,
        description: String,
        category: {
            type: String,
            enum: ['streaks', 'intensity', 'performance', 'milestones']
        },
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    skillLevels: {
        type: Map,
        of: Number,
        default: {}
    },
    workoutHistory: [{
        date: Date,
        xpEarned: Number,
        duration: Number,
        intensity: String,
        formScore: Number,
        completionRate: Number
    }],
    lastWorkout: {
        type: Date
    },
    achievements: {
        highIntensityWorkouts: {
            type: Number,
            default: 0
        },
        perfectFormCount: {
            type: Number,
            default: 0
        },
        totalWorkoutMinutes: {
            type: Number,
            default: 0
        },
        uniqueDrillCategories: {
            type: [String],
            default: []
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ totalXP: -1 });
userStatsSchema.index({ currentStreak: -1 });
userStatsSchema.index({ 'workoutHistory.date': -1 });

// Pre-save middleware to update level and tier
userStatsSchema.pre('save', function(next) {
    // Update longest streak if current streak is longer
    if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
    }
    next();
});

// Instance methods
userStatsSchema.methods.addWorkout = function(workoutData) {
    this.workoutHistory.push(workoutData);
    this.lastWorkout = workoutData.date;
    this.workoutsCompleted += 1;
    
    // Update achievements
    if (workoutData.intensity === 'high') {
        this.achievements.highIntensityWorkouts += 1;
    }
    if (workoutData.formScore >= 0.95) {
        this.achievements.perfectFormCount += 1;
    }
    this.achievements.totalWorkoutMinutes += workoutData.duration;
    
    return this.save();
};

userStatsSchema.methods.addBadge = function(badge) {
    if (!this.badges.find(b => b.id === badge.id)) {
        this.badges.push(badge);
        return this.save();
    }
    return Promise.resolve(this);
};

userStatsSchema.methods.updateSkillLevel = function(skill, level) {
    this.skillLevels.set(skill, level);
    return this.save();
};

const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats; 