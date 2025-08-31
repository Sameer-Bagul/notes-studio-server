import express from 'express';
import Folder from '../models/Folder.js';
import Note from '../models/Note.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper.js';

const router = express.Router();

// Get all deployed (public) folders
router.get('/folders', async (req, res) => {
  try {
    const { includeNoteCount = 'true', username } = req.query;
    let userFilter = {};
    if (username) {
      // Find user by username
      const user = await (await import('../models/User.js')).default.findOne({ username: username.trim() });
      if (!user) {
        return sendSuccessResponse(res, { folders: [] });
      }
      userFilter.userId = user._id;
    }
    const folders = await Folder.find({ isDeployed: true, ...userFilter })
      .populate('userId', 'name email username')
      .sort({ createdAt: -1 })
      .lean();
    if (!folders || folders.length === 0) {
      return sendSuccessResponse(res, { folders: [] });
    }
    if (includeNoteCount === 'true') {
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const noteCount = await Note.countDocuments({
            folderId: folder._id,
            isArchived: false
          });
          return { ...folder, noteCount };
        })
      );
      return sendSuccessResponse(res, { folders: foldersWithCount });
    }
    return sendSuccessResponse(res, { folders });
  } catch (error) {
    console.error('Get public folders error:', error);
    return sendErrorResponse(res, 'Failed to fetch public folders', 500);
  }
});

// Get public folder by slug with notes
router.get('/folders/:slug', async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', sortBy = 'updatedAt', order = 'desc', username } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let userFilter = {};
    if (username) {
      // Find user by username
      const user = await (await import('../models/User.js')).default.findOne({ username: username.trim() });
      if (!user) {
        return sendErrorResponse(res, 'Public folder not found', 404);
      }
      userFilter.userId = user._id;
    }
    const folder = await Folder.findOne({
      slug: req.params.slug,
      isDeployed: true,
      ...userFilter
    })
      .populate('userId', 'name email username')
      .lean();
    if (!folder) {
      return sendErrorResponse(res, 'Public folder not found', 404);
    }
    const notesQuery = {
      folderId: folder._id,
      isArchived: false
    };
    if (search) {
      notesQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content_html: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    const [notes, total] = await Promise.all([
      Note.find({ ...notesQuery, ...userFilter })
        .populate('userId', 'name email username')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Note.countDocuments({ ...notesQuery, ...userFilter })
    ]);
    const response = {
      folder: {
        ...folder,
        owner: folder.userId
      },
      notes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    return sendSuccessResponse(res, response);
  } catch (error) {
    console.error('Get public folder by slug error:', error);
    return sendErrorResponse(res, 'Failed to fetch public folder', 500);
  }
});

export default router;
