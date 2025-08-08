import express from 'express';
import Folder from '../models/Folder.js';
import Note from '../models/Note.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createFolderSchema,
  updateFolderSchema
} from '../utils/validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper.js';
import { generateSlug } from '../utils/slugify.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Toggle folder deployment (public/private)
router.patch('/:id/deploy', async (req, res) => {
  try {
    const { isDeployed } = req.body;
    if (typeof isDeployed !== 'boolean') {
      return sendErrorResponse(res, 'Missing or invalid isDeployed value', 400);
    }
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeployed },
      { new: true }
    );
    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404);
    }
    sendSuccessResponse(res, { folder: folder.toJSON() }, `Folder ${isDeployed ? 'deployed' : 'undeployed'}`);
  } catch (error) {
    sendErrorResponse(res, 'Failed to toggle deployment', 500);
  }
});


// Get all folders for the user
router.get('/', async (req, res) => {
  try {
    const { includeNoteCount = 'false' } = req.query;
    let folders = await Folder.find({ userId: req.user.id })
      .sort({ order: 1, createdAt: 1 });
    if (includeNoteCount === 'true') {
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const noteCount = await Note.countDocuments({
            folderId: folder._id,
            userId: req.user.id,
            isArchived: false
          });
          const folderJson = folder.toJSON();
          return { ...folderJson, noteCount };
        })
      );
      const rootNoteCount = await Note.countDocuments({
        folderId: null,
        userId: req.user.id,
        isArchived: false
      });
      foldersWithCount.unshift({
        id: 'root',
        name: 'All Notes',
        slug: 'root',
        color: '#6366f1',
        order: -1,
        userId: req.user.id,
        noteCount: rootNoteCount,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      sendSuccessResponse(res, { folders: foldersWithCount });
    } else {
      const foldersJson = folders.map(folder => folder.toJSON());
      sendSuccessResponse(res, { folders: foldersJson });
    }
  } catch (error) {
    sendErrorResponse(res, 'Failed to fetch folders', 500);
  }
});

// Get a single folder by ID
router.get('/:id', async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404);
    }
    sendSuccessResponse(res, { folder: folder.toJSON() });
  } catch (error) {
    sendErrorResponse(res, 'Failed to fetch folder', 500);
  }
});

// Create folder
router.post('/', validate(createFolderSchema), async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const slug = generateSlug(name);
    const folder = new Folder({
      name,
      slug,
      color,
      userId: req.user.id,
      description: description || '',
    });
    await folder.save();
    sendSuccessResponse(res, { folder: folder.toJSON() }, 'Folder created', 201);
  } catch (error) {
    sendErrorResponse(res, error.message || 'Failed to create folder', 500);
  }
});

// Update folder
router.put('/:id', validate(updateFolderSchema), async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404);
    }
    sendSuccessResponse(res, { folder: folder.toJSON() }, 'Folder updated');
  } catch (error) {
    sendErrorResponse(res, 'Failed to update folder', 500);
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const { deleteNotes, moveNotesToRoot } = req.query;
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404);
    }
    let movedNotesCount = 0;
    let deletedNotesCount = 0;
    if (deleteNotes === 'true') {
      // Delete all notes in this folder
      const result = await Note.deleteMany({ folderId: folder._id, userId: req.user.id });
      deletedNotesCount = result.deletedCount || 0;
    } else if (moveNotesToRoot === 'true') {
      // Move all notes to root
      const result = await Note.updateMany({ folderId: folder._id, userId: req.user.id }, { $set: { folderId: null } });
      movedNotesCount = result.modifiedCount || 0;
    }
    await Folder.deleteOne({ _id: folder._id });
    sendSuccessResponse(res, {
      folder: folder.toJSON(),
      deletedNotesCount,
      movedNotesCount
    }, 'Folder deleted');
  } catch (error) {
    sendErrorResponse(res, 'Failed to delete folder', 500);
  }
});

// ...other folder routes (get single, create, update, delete, etc.)...

export default router;
