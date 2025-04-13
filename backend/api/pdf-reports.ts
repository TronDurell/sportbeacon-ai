import { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!global.firebase) {
    global.firebase = initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}')),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

const db = getFirestore();
const reportsCollection = db.collection('pdf-reports');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return handleGet(req, res);
        case 'POST':
            return handlePost(req, res);
        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { organizationId, playerId, limit = 50, offset = 0 } = req.query;
        let query = reportsCollection.orderBy('timestamp', 'desc');

        if (organizationId) {
            query = query.where('organizationId', '==', organizationId);
        }

        if (playerId) {
            query = query.where('playerId', '==', playerId);
        }

        const snapshot = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .get();

        const reports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({ reports });
    } catch (error) {
        console.error('Error fetching PDF reports:', error);
        return res.status(500).json({ error: 'Failed to fetch reports' });
    }
}

interface PDFReportMetadata {
    playerId: string;
    playerName: string;
    organizationId: string;
    scoutId: string;
    url: string;
    timestamp: Date;
    stats: {
        goalsScored?: number;
        assists?: number;
        passAccuracy?: number;
        shotAccuracy?: number;
        [key: string]: number | undefined;
    };
    tags: string[];
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const metadata: PDFReportMetadata = req.body;

        // Validate required fields
        if (!metadata.playerId || !metadata.organizationId || !metadata.url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Add timestamp if not provided
        if (!metadata.timestamp) {
            metadata.timestamp = new Date();
        }

        // Create new report document
        const docRef = await reportsCollection.add({
            ...metadata,
            timestamp: new Date(metadata.timestamp), // Ensure timestamp is a Firestore timestamp
        });

        return res.status(201).json({
            id: docRef.id,
            ...metadata
        });
    } catch (error) {
        console.error('Error creating PDF report:', error);
        return res.status(500).json({ error: 'Failed to create report' });
    }
}

// Helper function to get reports by player ID
export async function getReportsByPlayer(playerId: string) {
    try {
        const snapshot = await reportsCollection
            .where('playerId', '==', playerId)
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching player reports:', error);
        throw error;
    }
}

// Helper function to get recent reports for an organization
export async function getRecentReports(organizationId: string, limit = 10) {
    try {
        const snapshot = await reportsCollection
            .where('organizationId', '==', organizationId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching recent reports:', error);
        throw error;
    }
} 