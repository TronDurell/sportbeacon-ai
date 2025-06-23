const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { validateMediaMetadata } = require('../validators/media');

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'tmp/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Upload endpoint
router.post('/upload', 
    authenticate, 
    checkRole(['coach', 'admin']), 
    upload.single('file'),
    validateMediaMetadata,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const { type, tags, title, description } = req.body;
            const fileKey = `${type}/${Date.now()}-${path.basename(req.file.originalname)}`;

            // Upload to S3
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey,
                Body: fs.createReadStream(req.file.path),
                ContentType: req.file.mimetype,
                Metadata: {
                    title,
                    description,
                    tags: JSON.stringify(tags),
                    uploadedBy: req.user.id
                }
            }));

            // Clean up temporary file
            fs.unlinkSync(req.file.path);

            res.json({
                success: true,
                data: {
                    key: fileKey,
                    type,
                    title,
                    description,
                    tags
                }
            });
        } catch (error) {
            // Clean up temporary file if it exists
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            console.error('Upload error:', error);
            res.status(500).json({ success: false, error: 'Failed to upload file' });
        }
    }
);

// List media endpoint
router.get('/list/:type?', authenticate, async (req, res) => {
    try {
        const { type } = req.params;
        const { prefix, limit = 20 } = req.query;
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Prefix: type ? `${type}/` : prefix || '',
            MaxKeys: parseInt(limit)
        };

        const data = await s3Client.listObjectsV2(params);
        
        const mediaItems = data.Contents.map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            type: path.dirname(item.Key)
        }));

        res.json({
            success: true,
            data: mediaItems,
            nextContinuationToken: data.NextContinuationToken
        });
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ success: false, error: 'Failed to list media' });
    }
});

// Delete media endpoint
router.delete('/:key', authenticate, checkRole(['coach', 'admin']), async (req, res) => {
    try {
        const { key } = req.params;

        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        }));

        res.json({ success: true, message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete media' });
    }
});

// Get signed URL endpoint
router.get('/signed-url/:key', authenticate, async (req, res) => {
    try {
        const { key } = req.params;
        const { expiresIn = 3600 } = req.query; // Default 1 hour

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: parseInt(expiresIn)
        });

        res.json({
            success: true,
            data: { signedUrl }
        });
    } catch (error) {
        console.error('Signed URL error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate signed URL' });
    }
});

module.exports = router; 