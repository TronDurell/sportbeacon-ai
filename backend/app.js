const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const mediaRoutes = require('./routes/media');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/media', mediaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

module.exports = app; 