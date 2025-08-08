// server.ts

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import createApp from './app'

// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 5000
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/notes-app'

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📴 ${signal} received. Shutting down gracefully...`)
  try {
    await mongoose.connection.close()
    console.log('✅ MongoDB connection closed.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error)
    process.exit(1)
  }
}

// Start the server
const startServer = async (): Promise<void> => {
  try {
    await connectDB()

    const app = createApp()

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🩺 Health check: http://localhost:${PORT}/health`)
    })

    // Unhandled Promise Rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('❌ Unhandled Promise Rejection:', err.message)
      server.close(() => process.exit(1))
    })

    // Uncaught Exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('❌ Uncaught Exception:', err.message)
      process.exit(1)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'))
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Run only if executed directly
if (require.main === module) {
  startServer()
}

export { startServer, connectDB }
export default createApp
