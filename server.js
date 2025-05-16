require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import dependencies
const SupabaseSIRS = require('./src/infrastructure/database/vercel/SupabaseSIRS');
const SIRSService = require('./src/application/services/SIRSService');
const SIRSController = require('./src/presentation/controllers/SIRSController');
const createSIRSRouter = require('./src/presentation/routes/sirsRoutes');
const exportToFHIR = require('./src/utils/dataExport');

// Initialize application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Initialize repository and service instances
let sirsRepository;
let sirsService;
let sirsController;

// Initialize repository
async function initialize() {
    try {
        if (!sirsRepository) {
            sirsRepository = new SupabaseSIRS();
            await sirsRepository.initialize();
            sirsService = new SIRSService(sirsRepository);
            sirsController = new SIRSController(sirsService);
            console.log('Repository initialized successfully');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Middleware to ensure initialization
app.use(async (req, res, next) => {
    try {
        if (!sirsRepository) {
            await initialize();
        }
        next();
    } catch (error) {
        console.error('Middleware initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Server initialization failed'
        });
    }
});

// Routes
app.use('/api/sirs', (req, res, next) => {
    if (!sirsController) {
        return res.status(500).json({
            success: false,
            error: 'Server not initialized'
        });
    }
    return createSIRSRouter(sirsController)(req, res, next);
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Initialize on startup for development
if (process.env.NODE_ENV !== 'production') {
    initialize().catch(console.error);
}

// Export for serverless
module.exports = app;
