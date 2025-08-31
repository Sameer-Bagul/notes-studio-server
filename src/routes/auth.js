
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema
} from '../utils/validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper.js';

const router = express.Router();


// Check username availability (for registration)
router.get('/username-available', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Invalid username' });
    }
    const user = await (await import('../models/User.js')).default.findOne({ username: username.trim() });
    if (user) {
      return res.json({ success: true, available: false });
    }
    return res.json({ success: true, available: true });
  } catch (error) {
    console.error('Username availability check error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check username' });
  }
});

// Register new user
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    // Validate username
    if (!username || typeof username !== 'string' || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return sendErrorResponse(res, 'Invalid or missing username', 400);
    }
    // Check for duplicate username
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return sendErrorResponse(res, 'Username already taken', 400);
    }
    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 'User already exists with this email', 400);
    }
    const user = new User({ username: username.trim(), name, email, password });
    await user.save();

    // Create default folder and welcome note for new user
    const Folder = (await import('../models/Folder.js')).default;
    const Note = (await import('../models/Note.js')).default;
    const folder = new Folder({
      name: 'Welcome',
      userId: user._id,
      color: '#6366f1',
      slug: 'welcome'
    });
    await folder.save();
    const note = new Note({
      title: 'Welcome to Notes Studio!',
      content: 'This is your first note. Edit or delete it as you wish.',
      folderId: folder._id,
      userId: user._id,
      slug: 'welcome-to-notes-studio',
      tags: ['welcome', 'demo'],
      isPinned: true
    });
    await note.save();

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id.toString() },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return sendSuccessResponse(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }, 'User registered successfully', 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendErrorResponse(res, 'Registration failed', 500);
  }
});

// Login user
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendErrorResponse(res, 'Invalid email or password', 401);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendErrorResponse(res, 'Invalid email or password', 401);
    }
    if (user.lastLoginAt !== undefined) {
      user.lastLoginAt = new Date();
      await user.save();
    }
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id.toString() },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return sendSuccessResponse(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendErrorResponse(res, 'Login failed', 500);
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    sendSuccessResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      avatar: user.avatar,
      createdAt: user.createdAt
    });
  } catch (error) {
    sendErrorResponse(res, 'Failed to fetch profile', 500);
  }
});

// Update current user profile
router.put('/me', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.preferences) updates.preferences = req.body.preferences;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    sendSuccessResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      avatar: user.avatar,
      createdAt: user.createdAt
    }, 'Profile updated');
  } catch (error) {
    sendErrorResponse(res, 'Failed to update profile', 500);
  }
});

export default router;
