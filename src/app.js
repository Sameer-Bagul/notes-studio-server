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
  app.get('/', (req, res) => {
    res.send('Notes Studio API server is up and running!');
  });
  app.use(helmet());
  // CORS configuration using CORS_ORIGIN environment variable
  const corsOrigin = process.env.CORS_ORIGIN;
  console.log('🔧 CORS_ORIGIN env var:', corsOrigin);
  let origin;
  if (!corsOrigin) {
    console.log('⚠️  CORS_ORIGIN not set, allowing all origins');
    origin = true; // Allow all origins if CORS_ORIGIN is not set
  } else {
    origin = corsOrigin.split(',').map(o => o.trim()); // Parse as comma-separated list
    console.log('✅ CORS Origin configured:', origin);
  }
  app.use(
    cors({
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }
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
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', noteRoutes);
  app.use('/api/folders', folderRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/uploads', express.static('uploads'));
  app.use(notFound);
  app.use(errorHandler);
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
