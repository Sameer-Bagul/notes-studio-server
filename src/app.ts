import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './middleware/errorHandler'

// Routes
import authRoutes from './routes/auth'
import noteRoutes from './routes/notes'
import folderRoutes from './routes/folders'
import publicRoutes from './routes/public'

const createApp = () => {
  const app = express()

  // Security middleware
  app.use(helmet())
  
  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? [
          'http://localhost:3000', 
          'http://localhost:8080', 
          'http://localhost:8081',
          'http://localhost:5173', 
          'http://localhost:4173'
        ]
      : process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Compression middleware
  app.use(compression())

  // Logging middleware
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW!) || 15) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX!) || 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
  })

  // Apply rate limiting to all requests
  app.use(limiter)

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  })

  // Favicon route to prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
  })

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/notes', noteRoutes)
  app.use('/api/folders', folderRoutes)
  
  // Public routes (no authentication required)
  app.use('/api/public', publicRoutes)

  // Upload directory for static files
  app.use('/uploads', express.static('uploads'))

  // 404 handler
  app.use(notFound)

  // Error handler
  app.use(errorHandler)

  return app
}

export default createApp
