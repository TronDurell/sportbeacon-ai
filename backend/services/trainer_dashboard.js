const PlayerProfile = require('../models/player_profile');
const UserStats = require('../models/user_stats');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
}));

class TrainerDashboard {
    constructor(io) {
        this.io = io;
    }

    async getRoster(trainerId, filters = {}) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        }).populate({
            path: 'trainerInfo.roster.playerId',
            select: 'personalInfo performance'
        });

        if (!trainerProfile) {
            throw new Error('Trainer profile not found');
        }

        let roster = trainerProfile.trainerInfo.roster;

        // Apply filters
        if (filters.status) {
            roster = roster.filter(player => player.status === filters.status);
        }
        if (filters.sport) {
            roster = roster.filter(player => 
                player.playerId.personalInfo.sports.some(s => s.name === filters.sport)
            );
        }
        if (filters.level) {
            roster = roster.filter(player => 
                player.playerId.personalInfo.sports.some(s => s.level === filters.level)
            );
        }

        // Get detailed stats for each player
        const rosterWithStats = await Promise.all(roster.map(async (player) => {
            const stats = await UserStats.findOne({ userId: player.playerId._id });
            return {
                ...player.toObject(),
                stats: stats ? {
                    level: stats.level,
                    totalXP: stats.totalXP,
                    currentStreak: stats.currentStreak,
                    recentAchievements: stats.badges.slice(-3)
                } : null
            };
        }));

        return rosterWithStats;
    }

    async assignWeeklyDrills(trainerId, playerId, drills) {
        const player = await PlayerProfile.findOne({ userId: playerId });
        if (!player) {
            throw new Error('Player not found');
        }

        // Validate trainer has access to this player
        const hasAccess = await this.validateTrainerAccess(trainerId, playerId);
        if (!hasAccess) {
            throw new Error('Unauthorized access to player');
        }

        // Create weekly focus items from drills
        const weeklyFocus = drills.map(drill => ({
            skill: drill.targetSkill,
            target: drill.name,
            progress: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }));

        await player.updateWeeklyFocus(weeklyFocus);

        // Notify player through websocket
        this.io.to(`user_${playerId}`).emit('drills_assigned', {
            trainerId,
            drills,
            weeklyFocus
        });

        return weeklyFocus;
    }

    async addSessionFeedback(trainerId, playerId, sessionId, feedback) {
        const hasAccess = await this.validateTrainerAccess(trainerId, playerId);
        if (!hasAccess) {
            throw new Error('Unauthorized access to player');
        }

        const player = await PlayerProfile.findOne({ userId: playerId });
        
        // Add feedback to player's journal
        await player.addJournalEntry({
            type: 'FEEDBACK',
            content: feedback.text,
            media: feedback.media || [],
            visibility: 'TEAM',
            tags: ['trainer-feedback', sessionId]
        });

        // If voice memo is included, transcribe and summarize
        if (feedback.voiceMemo) {
            const summary = await this.summarizeVoiceFeedback(feedback.voiceMemo);
            await player.addJournalEntry({
                type: 'FEEDBACK',
                content: summary,
                tags: ['ai-summary', sessionId],
                visibility: 'TEAM'
            });
        }

        // Notify player
        this.io.to(`user_${playerId}`).emit('feedback_received', {
            trainerId,
            sessionId,
            feedback: {
                text: feedback.text,
                hasVoiceMemo: !!feedback.voiceMemo
            }
        });

        return true;
    }

    async generatePerformanceReport(trainerId, playerId, options = {}) {
        const hasAccess = await this.validateTrainerAccess(trainerId, playerId);
        if (!hasAccess) {
            throw new Error('Unauthorized access to player');
        }

        const player = await PlayerProfile.findOne({ userId: playerId });
        const stats = await UserStats.findOne({ userId: playerId });

        const doc = new PDFDocument();
        const reportPath = path.join(__dirname, '../temp', `${playerId}_report.pdf`);
        doc.pipe(fs.createWriteStream(reportPath));

        // Generate PDF content
        this._generatePDFHeader(doc, player);
        this._generatePerformanceSection(doc, stats);
        this._generateInjuryHistory(doc, player);
        this._generateWeeklyFocus(doc, player);
        
        if (options.includeNotes) {
            this._generateTrainerNotes(doc, player);
        }

        doc.end();

        // Return the file path or upload to cloud storage
        return reportPath;
    }

    async summarizeVoiceFeedback(voiceMemoUrl) {
        // Download voice memo and convert to text using Whisper API
        const transcription = await openai.createTranscription(
            fs.createReadStream(voiceMemoUrl),
            "whisper-1"
        );

        // Summarize the transcription
        const summary = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are a sports training assistant. Summarize the trainer's feedback concisely and actionably."
            }, {
                role: "user",
                content: transcription.data.text
            }]
        });

        return summary.data.choices[0].message.content;
    }

    async validateTrainerAccess(trainerId, playerId) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        });

        return trainerProfile?.trainerInfo.roster.some(
            player => player.playerId.equals(playerId) && player.status === 'ACTIVE'
        );
    }

    // Private PDF generation methods
    _generatePDFHeader(doc, player) {
        doc.fontSize(25)
           .text('Performance Report', { align: 'center' })
           .fontSize(15)
           .text(`${player.personalInfo.displayName}`, { align: 'center' })
           .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' })
           .moveDown(2);
    }

    _generatePerformanceSection(doc, stats) {
        doc.fontSize(20)
           .text('Performance Overview')
           .moveDown(1)
           .fontSize(12);

        // Add performance metrics
        if (stats) {
            doc.text(`Level: ${stats.level}`)
               .text(`Total XP: ${stats.totalXP}`)
               .text(`Current Streak: ${stats.currentStreak} days`)
               .text(`Longest Streak: ${stats.longestStreak} days`)
               .moveDown(1);

            // Add recent achievements
            doc.fontSize(14)
               .text('Recent Achievements')
               .fontSize(12);
            
            stats.badges.slice(-5).forEach(badge => {
                doc.text(`• ${badge.name} - ${badge.description}`);
            });
        }
    }

    _generateInjuryHistory(doc, player) {
        doc.moveDown(2)
           .fontSize(20)
           .text('Injury History')
           .moveDown(1)
           .fontSize(12);

        player.performance.injuries.forEach(injury => {
            doc.text(`${injury.type} - ${injury.location}`)
               .text(`Status: ${injury.status}`)
               .text(`Duration: ${injury.startDate.toLocaleDateString()} - ${
                   injury.endDate ? injury.endDate.toLocaleDateString() : 'Ongoing'
               }`)
               .moveDown(1);
        });
    }

    _generateWeeklyFocus(doc, player) {
        doc.moveDown(2)
           .fontSize(20)
           .text('Weekly Focus Areas')
           .moveDown(1)
           .fontSize(12);

        player.performance.weeklyFocus.forEach(focus => {
            doc.text(`Skill: ${focus.skill}`)
               .text(`Target: ${focus.target}`)
               .text(`Progress: ${focus.progress}%`)
               .moveDown(1);
        });
    }

    _generateTrainerNotes(doc, player) {
        doc.moveDown(2)
           .fontSize(20)
           .text('Trainer Notes')
           .moveDown(1)
           .fontSize(12);

        const trainerNotes = player.journal
            .filter(entry => entry.type === 'FEEDBACK')
            .slice(-5);

        trainerNotes.forEach(note => {
            doc.text(`Date: ${note.date.toLocaleDateString()}`)
               .text(note.content)
               .moveDown(1);
        });
    }
}

module.exports = TrainerDashboard; 