import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { Readable } from 'stream';

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET || '');

export const config = {
    api: {
        bodyParser: false,
    },
};

interface UploadedFile {
    filepath: string;
    originalFilename: string;
    mimetype: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse the multipart form data
        const form = formidable();
        const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const file = files.file as unknown as UploadedFile;
        const playerId = fields.playerId as string;

        if (!file || !playerId) {
            return res.status(400).json({ error: 'Missing file or player ID' });
        }

        // Generate a unique filename
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        const uniqueId = uuidv4();
        const filename = `player-reports/${playerId}/${timestamp}-${uniqueId}.pdf`;

        // Upload file to Google Cloud Storage
        const fileStream = Readable.from(require('fs').readFileSync(file.filepath));
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: 'application/pdf',
            },
        });

        await new Promise((resolve, reject) => {
            blobStream.on('error', reject);
            blobStream.on('finish', resolve);
            fileStream.pipe(blobStream);
        });

        // Generate signed URL that expires in 7 days
        const [url] = await blob.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Clean up the temporary file
        require('fs').unlinkSync(file.filepath);

        return res.status(200).json({
            url,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        return res.status(500).json({ error: 'Failed to upload PDF' });
    }
} 