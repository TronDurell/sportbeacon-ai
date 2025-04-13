const path = require('path');
const sanitize = require('sanitize-filename');
const mime = require('mime-types');

const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: ['application/pdf']
};

const MAX_FILE_SIZE = {
    image: 5 * 1024 * 1024,    // 5MB
    video: 100 * 1024 * 1024,  // 100MB
    document: 10 * 1024 * 1024 // 10MB
};

const validateFile = (file, allowedTypes = ['image', 'video']) => {
    const errors = [];
    
    // Check if file exists
    if (!file) {
        errors.push('No file provided');
        return { valid: false, errors };
    }

    // Get file type
    const mimeType = mime.lookup(file.originalname);
    const fileType = getFileType(mimeType);

    // Check file type
    if (!fileType || !allowedTypes.includes(fileType)) {
        errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (fileType && file.size > MAX_FILE_SIZE[fileType]) {
        errors.push(`File too large. Maximum size for ${fileType}: ${MAX_FILE_SIZE[fileType] / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (fileType && !ALLOWED_TYPES[fileType].includes(mimeType)) {
        errors.push(`Invalid file format. Allowed formats for ${fileType}: ${ALLOWED_TYPES[fileType].join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        fileType
    };
};

const sanitizeFileName = (originalName) => {
    const sanitizedName = sanitize(originalName);
    const ext = path.extname(sanitizedName);
    const name = path.basename(sanitizedName, ext);
    
    // Replace spaces and special characters
    const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return `${cleanName}${ext}`;
};

const validateMetadata = (metadata) => {
    const errors = [];
    const validatedMetadata = {};

    // Validate type
    if (!metadata.type || !['drills', 'highlights', 'tutorials'].includes(metadata.type)) {
        errors.push('Invalid or missing content type');
    } else {
        validatedMetadata.type = metadata.type;
    }

    // Validate tags
    if (metadata.tags) {
        if (Array.isArray(metadata.tags)) {
            validatedMetadata.tags = metadata.tags
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0)
                .slice(0, 10); // Limit to 10 tags
        } else if (typeof metadata.tags === 'string') {
            validatedMetadata.tags = metadata.tags
                .split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0)
                .slice(0, 10);
        }
    }

    // Validate title
    if (metadata.title) {
        if (typeof metadata.title === 'string' && metadata.title.length <= 100) {
            validatedMetadata.title = metadata.title.trim();
        } else {
            errors.push('Title must be a string with maximum length of 100 characters');
        }
    }

    // Validate description
    if (metadata.description) {
        if (typeof metadata.description === 'string' && metadata.description.length <= 1000) {
            validatedMetadata.description = metadata.description.trim();
        } else {
            errors.push('Description must be a string with maximum length of 1000 characters');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        metadata: validatedMetadata
    };
};

const getFileType = (mimeType) => {
    for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
        if (mimes.includes(mimeType)) {
            return type;
        }
    }
    return null;
};

module.exports = {
    validateFile,
    sanitizeFileName,
    validateMetadata,
    ALLOWED_TYPES,
    MAX_FILE_SIZE
}; 