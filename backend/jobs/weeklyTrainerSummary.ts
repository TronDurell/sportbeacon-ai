import { CronJob } from 'cron';
import sgMail from '@sendgrid/mail';
import { TrainerService } from '../services/TrainerService';
import { PlayerService } from '../services/PlayerService';
import { DrillService } from '../services/DrillService';
import { formatDate } from '../utils/dateUtils';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface WeeklySummary {
    totalDrillsAssigned: number;
    totalDrillsCompleted: number;
    completionRate: number;
    averagePerformance: number;
    topPerformers: Array<{
        playerId: string;
        name: string;
        completionRate: number;
        averageScore: number;
    }>;
    needsAttention: Array<{
        playerId: string;
        name: string;
        lastActive: Date;
        pendingDrills: number;
    }>;
}

async function generateTrainerSummary(trainerId: string): Promise<WeeklySummary> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const playerService = new PlayerService();
    const drillService = new DrillService();

    // Get all players for this trainer
    const players = await playerService.getTrainerPlayers(trainerId);
    
    // Get drill activity for the past week
    const drillActivity = await Promise.all(
        players.map(async (player) => {
            const drills = await drillService.getPlayerDrillHistory(player.id, {
                startDate: oneWeekAgo,
                endDate: new Date()
            });

            const assigned = drills.length;
            const completed = drills.filter(d => d.status === 'completed').length;
            const scores = drills
                .filter(d => d.performance?.score)
                .map(d => d.performance.score);

            return {
                player,
                assigned,
                completed,
                completionRate: assigned ? (completed / assigned) * 100 : 0,
                averageScore: scores.length ? 
                    scores.reduce((a, b) => a + b, 0) / scores.length : 0,
                lastActive: drills.length ? 
                    new Date(Math.max(...drills.map(d => d.updatedAt.getTime()))) :
                    player.lastActive
            };
        })
    );

    // Calculate summary statistics
    const totalAssigned = drillActivity.reduce((sum, p) => sum + p.assigned, 0);
    const totalCompleted = drillActivity.reduce((sum, p) => sum + p.completed, 0);

    // Sort players by completion rate and score
    const sortedByPerformance = [...drillActivity]
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);

    // Find players needing attention (low completion rate or inactive)
    const needingAttention = drillActivity
        .filter(p => p.completionRate < 50 || 
            (p.lastActive && p.lastActive < oneWeekAgo))
        .slice(0, 5);

    return {
        totalDrillsAssigned: totalAssigned,
        totalDrillsCompleted: totalCompleted,
        completionRate: totalAssigned ? (totalCompleted / totalAssigned) * 100 : 0,
        averagePerformance: drillActivity.reduce((sum, p) => sum + p.averageScore, 0) / drillActivity.length,
        topPerformers: sortedByPerformance.map(p => ({
            playerId: p.player.id,
            name: p.player.name,
            completionRate: p.completionRate,
            averageScore: p.averageScore
        })),
        needsAttention: needingAttention.map(p => ({
            playerId: p.player.id,
            name: p.player.name,
            lastActive: p.lastActive,
            pendingDrills: p.assigned - p.completed
        }))
    };
}

function generateEmailContent(summary: WeeklySummary, trainerName: string): string {
    return `
        <h2>Weekly Training Summary for ${trainerName}</h2>
        <p>Here's your weekly overview of player performance and engagement.</p>

        <h3>Overview</h3>
        <ul>
            <li>Total Drills Assigned: ${summary.totalDrillsAssigned}</li>
            <li>Completion Rate: ${summary.completionRate.toFixed(1)}%</li>
            <li>Average Performance: ${summary.averagePerformance.toFixed(1)}%</li>
        </ul>

        <h3>Top Performers</h3>
        <ul>
            ${summary.topPerformers.map(player => `
                <li>${player.name}
                    <ul>
                        <li>Completion Rate: ${player.completionRate.toFixed(1)}%</li>
                        <li>Average Score: ${player.averageScore.toFixed(1)}%</li>
                    </ul>
                </li>
            `).join('')}
        </ul>

        <h3>Needs Attention</h3>
        <ul>
            ${summary.needsAttention.map(player => `
                <li>${player.name}
                    <ul>
                        <li>Last Active: ${formatDate(player.lastActive)}</li>
                        <li>Pending Drills: ${player.pendingDrills}</li>
                    </ul>
                </li>
            `).join('')}
        </ul>
    `;
}

// Create the cron job
const weeklyTrainerSummary = new CronJob('0 8 * * MON', async () => {
    try {
        const trainerService = new TrainerService();
        const trainers = await trainerService.getAllActiveTrainers();

        for (const trainer of trainers) {
            const summary = await generateTrainerSummary(trainer.id);
            const emailContent = generateEmailContent(summary, trainer.name);

            await sgMail.send({
                to: trainer.email,
                from: 'notifications@sportbeacon.ai',
                subject: 'Weekly Player Performance Summary',
                html: emailContent,
            });

            console.log(`Sent weekly summary to trainer ${trainer.id}`);
        }
    } catch (error) {
        console.error('Error sending weekly summaries:', error);
    }
}, null, true, 'UTC');

export default weeklyTrainerSummary; 