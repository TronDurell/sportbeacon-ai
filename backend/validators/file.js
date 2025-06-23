const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            errors: ['No file uploaded']
        });
    }

    const { mimetype, size } = req.file;
    const errors = [];

    // Validate file type
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo'
    ];

    if (!allowedMimeTypes.includes(mimetype)) {
        errors.push(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (size > maxSize) {
        errors.push('File size exceeds 100MB limit');
    }

    if (errors.length > 0) {
        // Clean up the uploaded file if validation fails
        if (req.file.path) {
            require('fs').unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};

const validateFileDelete = (req, res, next) => {
    const { key } = req.params;
    const errors = [];

    if (!key) {
        errors.push('File key is required');
    } else if (typeof key !== 'string') {
        errors.push('File key must be a string');
    } else if (key.length > 1024) {
        errors.push('File key is too long');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};

module.exports = {
    validateFileUpload,
    validateFileDelete
}; 