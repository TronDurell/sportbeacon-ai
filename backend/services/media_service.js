const AWS = require('aws-sdk');
const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

class MediaService {
    constructor() {
        this.s3 = new AWS.S3({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.bucketName = process.env.S3_BUCKET_NAME || 'sportsbeacon-media-bucket';
        this.cdnBaseUrl = process.env.MEDIA_CDN_BASE || 'https://default-cdn-url.com';
    }

    async uploadMedia(file, type = 'misc') {
        try {
            const fileExt = path.extname(file.originalname);
            const mimeType = mime.lookup(fileExt) || 'application/octet-stream';
            const fileName = `${type}/${uuidv4()}${fileExt}`;

            const uploadParams = {
                Bucket: this.bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: mimeType,
                ACL: 'public-read'
            };

            const result = await this.s3.upload(uploadParams).promise();

            return {
                url: this.getCdnUrl(fileName),
                key: fileName,
                type: this.getMediaType(mimeType),
                originalName: file.originalname
            };
        } catch (error) {
            console.error('Error uploading media:', error);
            throw new Error('Failed to upload media');
        }
    }

    async deleteMedia(key) {
        try {
            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: key
            }).promise();

            return true;
        } catch (error) {
            console.error('Error deleting media:', error);
            throw new Error('Failed to delete media');
        }
    }

    getCdnUrl(key) {
        return `${this.cdnBaseUrl}/${key}`;
    }

    getMediaType(mimeType) {
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('image/')) return 'image';
        return 'misc';
    }

    getSignedUrl(key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Expires: expiresIn
            };

            return this.s3.getSignedUrl('getObject', params);
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    async listMediaByType(type, prefix = '') {
        try {
            const params = {
                Bucket: this.bucketName,
                Prefix: `${type}/${prefix}`
            };

            const data = await this.s3.listObjectsV2(params).promise();
            
            return data.Contents.map(item => ({
                key: item.Key,
                url: this.getCdnUrl(item.Key),
                lastModified: item.LastModified,
                size: item.Size,
                type: this.getMediaType(mime.lookup(item.Key) || '')
            }));
        } catch (error) {
            console.error('Error listing media:', error);
            throw new Error('Failed to list media');
        }
    }

    validateMediaType(file, allowedTypes = ['image', 'video']) {
        const mimeType = mime.lookup(file.originalname);
        if (!mimeType) return false;

        const type = this.getMediaType(mimeType);
        return allowedTypes.includes(type);
    }
}

module.exports = new MediaService(); 