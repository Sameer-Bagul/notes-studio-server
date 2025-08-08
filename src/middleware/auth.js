import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/responseHelper.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Access denied. No token provided.'));
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json(errorResponse('Invalid token. User not found.'));
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json(errorResponse('Invalid token.'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(errorResponse('Token expired.'));
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json(errorResponse('Server error in authentication.'));
  }
}
export const protect = auth;
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.substring(7);
    // ...existing code...
  } catch (error) {
    return next();
  }
}
