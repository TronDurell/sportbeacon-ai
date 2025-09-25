"use strict";
/* SportBeaconAI - Memory Consolidation Cron
   Nightly function to consolidate user memory events into snapshots
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyConsolidate = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const client_1 = require("./client");
exports.nightlyConsolidate = (0, scheduler_1.onSchedule)({
    schedule: 'every 24 hours',
    timeZone: 'America/New_York',
    memory: '1GiB',
    timeoutSeconds: 540
}, async () => {
    const db = (0, firestore_1.getFirestore)();
    const memoryClient = (0, client_1.adminMemoryClient)();
    console.log('Starting nightly memory consolidation...');
    try {
        // Get all users (in production, you might want to paginate this)
        const usersSnap = await db.collection('users').select().get();
        const consolidationStats = {
            usersProcessed: 0,
            snapshotsCreated: 0,
            errors: 0
        };
        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;
            consolidationStats.usersProcessed++;
            try {
                // Get events from the last 24 hours
                const since = new Date(Date.now() - 24 * 3600 * 1000);
                const eventsRef = db.collection('memories').doc(uid).collection('events')
                    .where('t', '>=', since)
                    .orderBy('t', 'desc');
                const eventsSnap = await eventsRef.get();
                if (eventsSnap.empty) {
                    console.log(`No events found for user ${uid} in the last 24 hours`);
                    continue;
                }
                // Generate summary from events
                const events = eventsSnap.docs.map(doc => doc.data());
                const summary = generateSummary(events);
                if (!summary) {
                    console.log(`No meaningful summary generated for user ${uid}`);
                    continue;
                }
                // Create snapshot
                await memoryClient.writeSnapshot(uid, {
                    version: 1,
                    summary,
                    vector: null // Will be populated by embedding service later
                });
                consolidationStats.snapshotsCreated++;
                console.log(`Created snapshot for user ${uid}`);
            }
            catch (error) {
                consolidationStats.errors++;
                console.error(`Error processing user ${uid}:`, error);
            }
        }
        console.log('Memory consolidation completed:', consolidationStats);
        // Capture consolidation stats
        await memoryClient.writeEvent({
            tenantId: 'system',
            userId: 'system',
            kind: 'observation',
            payload: {
                scope: 'functions',
                tags: ['memory', 'consolidation', 'stats'],
                data: consolidationStats
            }
        });
    }
    catch (error) {
        console.error('Memory consolidation failed:', error);
        throw error;
    }
});
// Simple extractive summarization (can be enhanced with AI later)
function generateSummary(events) {
    if (events.length === 0)
        return null;
    const summary = [];
    // Group events by kind
    const eventsByKind = events.reduce((acc, event) => {
        const kind = event.kind || 'unknown';
        if (!acc[kind])
            acc[kind] = [];
        acc[kind].push(event);
        return acc;
    }, {});
    // Generate summary for each kind
    if (eventsByKind.feedback && eventsByKind.feedback.length > 0) {
        const positiveFeedback = eventsByKind.feedback.filter(e => e.data?.message?.toLowerCase().includes('helpful') ||
            e.data?.message?.toLowerCase().includes('good') ||
            e.data?.message?.toLowerCase().includes('great')).length;
        const totalFeedback = eventsByKind.feedback.length;
        summary.push(`User provided ${totalFeedback} feedback items, ${positiveFeedback} positive`);
    }
    if (eventsByKind.result && eventsByKind.result.length > 0) {
        const resultTypes = eventsByKind.result.map(e => e.data?.functionName || 'unknown');
        const uniqueTypes = [...new Set(resultTypes)];
        summary.push(`Successfully completed ${eventsByKind.result.length} operations: ${uniqueTypes.join(', ')}`);
    }
    if (eventsByKind.observation && eventsByKind.observation.length > 0) {
        const sessionEvents = eventsByKind.observation.filter(e => e.tags?.includes('session:start')).length;
        if (sessionEvents > 0) {
            summary.push(`User had ${sessionEvents} active sessions`);
        }
    }
    if (eventsByKind.note && eventsByKind.note.length > 0) {
        summary.push(`User created ${eventsByKind.note.length} notes`);
    }
    // Add activity level assessment
    const totalEvents = events.length;
    if (totalEvents > 10) {
        summary.push('High activity user');
    }
    else if (totalEvents > 5) {
        summary.push('Medium activity user');
    }
    else {
        summary.push('Low activity user');
    }
    return summary.length > 0 ? summary.join('. ') + '.' : null;
}
