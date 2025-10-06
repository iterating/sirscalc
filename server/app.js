import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import dependencies
import NeonSIRS from './src/infrastructure/database/NeonSIRS.js';
import SIRSService from './src/services/SIRSService.js';
import SIRSController from './src/presentation/controllers/SIRSController.js';
import createSIRSRouter from './src/presentation/routes/sirsRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Initialize repository and service instances
let sirsRepository;
let sirsService;
let sirsController;
let sirsRouter;

// Initialize repository
async function initialize() {
    try {
        // Initialize repository
        sirsRepository = new NeonSIRS();
        await sirsRepository.initialize();
        console.log('Repository initialized successfully');

        // Initialize service
        sirsService = new SIRSService(sirsRepository);
        console.log('Service initialized successfully');

        // Initialize controller
        sirsController = new SIRSController(sirsService);
        console.log('Controller initialized successfully');

        // Create router
        sirsRouter = express.Router();
        
        // Set up routes
        sirsRouter.post('/calculate', asyncHandler(async (req, res) => {
            await sirsController.calculate(req, res);
        }));

        sirsRouter.get('/history', asyncHandler(async (req, res) => {
            await sirsController.getHistory(req, res);
        }));

        sirsRouter.get('/:id', asyncHandler(async (req, res) => {
            await sirsController.getById(req, res);
        }));

        sirsRouter.delete('/clear', asyncHandler(async (req, res) => {
            await sirsController.clearHistory(req, res);
        }));

        console.log('Router initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to ensure initialization
app.use(async (req, res, next) => {
    try {
        if (!sirsRouter) {
            await initialize();
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Mount SIRS routes
app.use('/api/sirs', (req, res, next) => {
    if (!sirsRouter) {
        return res.status(500).json({
            success: false,
            error: 'Server not initialized'
        });
    }
    sirsRouter(req, res, next);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initialize().catch(console.error);
}

export default app;
