import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { AuthRequest, OptionalAuthRequest, JWTPayload } from '../types'
import { errorResponse } from '../utils/responseHelper'

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Access denied. No token provided.'))
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(401).json(errorResponse('Invalid token. User not found.'))
    }

    // Add user to request object
    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name
    }
    return next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json(errorResponse('Invalid token.'))
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(errorResponse('Token expired.'))
    }

    console.error('Auth middleware error:', error)
    return res.status(500).json(errorResponse('Server error in authentication.'))
  }
}

// Export as protect for consistency with route imports
export const protect = auth

export const optionalAuth = async (req: OptionalAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // Continue without user
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId).select('-password')
    
    if (user) {
      req.user = {
        id: (user._id as any).toString(),
        email: user.email,
        name: user.name
      }
    }
    
    return next()
  } catch (error) {
    // If token is invalid, continue without user (optional auth)
    return next()
  }
}
