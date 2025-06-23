const validateMediaMetadata = (req, res, next) => {
    const { type, tags, title, description } = req.body;
    const errors = [];

    // Validate media type
    const validTypes = ['drills', 'highlights', 'training', 'games', 'misc'];
    if (!type || !validTypes.includes(type)) {
        errors.push(`Invalid media type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate tags
    if (tags) {
        if (!Array.isArray(tags)) {
            errors.push('Tags must be an array');
        } else if (tags.some(tag => typeof tag !== 'string')) {
            errors.push('All tags must be strings');
        } else if (tags.some(tag => tag.length > 50)) {
            errors.push('Tags must be 50 characters or less');
        }
    }

    // Validate title
    if (!title) {
        errors.push('Title is required');
    } else if (typeof title !== 'string') {
        errors.push('Title must be a string');
    } else if (title.length > 100) {
        errors.push('Title must be 100 characters or less');
    }

    // Validate description
    if (description) {
        if (typeof description !== 'string') {
            errors.push('Description must be a string');
        } else if (description.length > 500) {
            errors.push('Description must be 500 characters or less');
        }
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
    validateMediaMetadata
}; 