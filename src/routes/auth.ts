import express, { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { protect } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { 
  registerValidation, 
  loginValidation, 
  updateProfileValidation 
} from '../utils/validation'
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper'
import { AuthRequest } from '../types'

const router = express.Router()

// Register new user
router.post('/register', validate(registerValidation), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return sendErrorResponse(res, 'User already exists with this email', 400)
    }

    const user = new User({ name, email, password })
    await user.save()

    const secret = process.env.JWT_SECRET as string
    const token = jwt.sign(
      { userId: (user._id as any).toString() },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    return sendSuccessResponse(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }, 'User registered successfully', 201)

  } catch (error: any) {
    console.error('Registration error:', error)
    return sendErrorResponse(res, 'Registration failed', 500)
  }
})

// Login user
router.post('/login', validate(loginValidation), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return sendErrorResponse(res, 'Invalid email or password', 401)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return sendErrorResponse(res, 'Invalid email or password', 401)
    }

    if (user.lastLoginAt !== undefined) {
      user.lastLoginAt = new Date()
      await user.save()
    }

    const secret = process.env.JWT_SECRET as string
    const token = jwt.sign(
      { userId: (user._id as any).toString() },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    return sendSuccessResponse(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }, 'Login successful')

  } catch (error: any) {
    console.error('Login error:', error)
    return sendErrorResponse(res, 'Login failed', 500)
  }
})

// Get current user profile
router.get('/me', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return sendErrorResponse(res, 'Unauthorized', 401)
    }

    const user = await User.findById(authReq.user.id)
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404)
    }

    return sendSuccessResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    })

  } catch (error: any) {
    console.error('Get profile error:', error)
    return sendErrorResponse(res, 'Failed to get user profile', 500)
  }
})

// Update user profile
router.put('/me', protect, validate(updateProfileValidation), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return sendErrorResponse(res, 'Unauthorized', 401)
    }

    const { name, preferences } = req.body
    
    const user = await User.findById(authReq.user.id)
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404)
    }

    if (name) user.name = name
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences }
    }

    await user.save()

    return sendSuccessResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }, 'Profile updated successfully')

  } catch (error: any) {
    console.error('Update profile error:', error)
    return sendErrorResponse(res, 'Failed to update profile', 500)
  }
})

// Change password
router.put('/change-password', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return sendErrorResponse(res, 'Unauthorized', 401)
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return sendErrorResponse(res, 'Current password and new password are required', 400)
    }

    if (newPassword.length < 6) {
      return sendErrorResponse(res, 'New password must be at least 6 characters long', 400)
    }

    const user = await User.findById(authReq.user.id).select('+password')
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404)
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return sendErrorResponse(res, 'Current password is incorrect', 400)
    }

    user.password = newPassword
    await user.save()

    return sendSuccessResponse(res, {}, 'Password changed successfully')

  } catch (error: any) {
    console.error('Change password error:', error)
    return sendErrorResponse(res, 'Failed to change password', 500)
  }
})

// Delete account
router.delete('/me', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    if (!authReq.user) {
      return sendErrorResponse(res, 'Unauthorized', 401)
    }

    const user = await User.findById(authReq.user.id)
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404)
    }

    await User.findByIdAndDelete(authReq.user.id)
    
    return sendSuccessResponse(res, {}, 'Account deleted successfully')

  } catch (error: any) {
    console.error('Delete account error:', error)
    return sendErrorResponse(res, 'Failed to delete account', 500)
  }
})

export default router
