import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
import folderRoutes from './routes/folders.js';
import publicRoutes from './routes/public.js';

const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  // ✅ Root route
  app.get('/', (req, res) => {
    res.send('Notes Studio API server is up and running!');
  });

  // ✅ Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ✅ Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // ✅ Rate Limiting
  const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // ✅ CORS Setup
  const corsOrigin = process.env.CORS_ORIGIN;
  console.log('🔧 CORS_ORIGIN env var:', corsOrigin);

  let allowedOrigins;
  if (!corsOrigin) {
    console.log('⚠️  CORS_ORIGIN not set — using safe defaults');
    allowedOrigins = [
      'https://www.sameerbagul.me',
      'https://notesync.sameerbagul.me',
      'https://sameerbagul.vercel.app',
      'http://localhost:8080',
      'http://localhost:3000'
    ];
  } else {
    allowedOrigins = corsOrigin.split(',').map(o => o.trim());
  }
  console.log('✅ CORS allowed origins:', allowedOrigins);

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow Postman / server-to-server
        if (!origin) return callback(null, true);
        if (allowedOrigins === true || allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.log(`🚫 Blocked by CORS: ${origin}`);
          return callback(new Error(`CORS policy: Not allowed - ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ✅ Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // ✅ Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', noteRoutes);
  app.use('/api/folders', folderRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/uploads', express.static('uploads'));

  // ✅ Error handlers
  app.use(notFound);
  app.use(errorHandler);

  // ✅ Fallback 404
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: `Not Found - ${req.originalUrl}`
    });
  });

  return app;
};

export default createApp;
