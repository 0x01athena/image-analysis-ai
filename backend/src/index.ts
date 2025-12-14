import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { openAIService } from './services/OpenAIService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
console.log(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY');
console.log(process.env.CORS_ORIGIN, 'CORS_ORIGIN');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Image Analysis AI API',
            version: '1.0.0',
            description: 'Backend API for Image Analysis AI application',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Get allowed origins from environment variable (comma-separated)
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:5173'];

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            // In development, be more permissive
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use(express.static(path.join(__dirname, '../dist')));

app.use('/public', express.static(path.join(__dirname, '../public')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Image Analysis AI API Documentation',
}));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const openAIConnected = await openAIService.testConnection();

        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                openai: openAIConnected ? 'connected' : 'disconnected'
            }
        });
    } catch (error) {
        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                openai: 'error'
            }
        });
    }
});

// API routes
import batchRoutes from './routes/batchRoutes';
import userRoutes from './routes/userRoutes';
app.use('/api/batch', batchRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📚 API Documentation available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api-docs`);
    console.log(`🏥 Health check available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health`);
});

export default app;
