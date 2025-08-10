import { generateSlug } from '../utils/slugify.js';

import express from 'express';
import Note from '../models/Note.js';
import Folder from '../models/Folder.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createNoteSchema, updateNoteSchema } from '../utils/validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notes for the user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, folderId, tags, sortBy, sortOrder = 'asc', isPinned, isArchived } = req.query;
    const query = { userId: req.user.id };
    if (folderId) query.folderId = folderId;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    // Default sort by 'order' unless sortBy is specified
    const sortField = sortBy || 'order';
    const sortConfig = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    const notes = await Note.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);
    const totalCount = await Note.countDocuments(query);
    return res.json({
      success: true,
      message: 'Notes fetched successfully',
      data: {
        notes: notes.map(n => n.toJSON()),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum * limitNum < totalCount,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notes', error: error.message });
  }
});

// Get a single note by ID
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return sendErrorResponse(res, 'Note not found', 404);
    }
    sendSuccessResponse(res, { note: note.toJSON() });
  } catch (error) {
    sendErrorResponse(res, 'Failed to fetch note', 500);
  }
});

// Create note
router.post('/', validate(createNoteSchema), async (req, res) => {
  try {
    const { title, content, folderId, tags, color } = req.body;
    const slugBase = title || '';
    const slug = generateSlug(slugBase);
    // Convert empty string folderId to null for root notes
    const safeFolderId = !folderId || folderId === '' ? null : folderId;
    // Find the max order for notes in the same folder (or root)
    const maxOrderNote = await Note.findOne({ userId: req.user.id, folderId: safeFolderId }).sort({ order: -1 });
    const nextOrder = typeof maxOrderNote?.order === 'number' ? maxOrderNote.order + 1 : 0;
    const note = new Note({
      title,
      content,
      folderId: safeFolderId,
      userId: req.user.id,
      slug,
      tags: tags || [],
      color: color || null,
      order: nextOrder,
    });
    await note.save();
    const noteObj = note.toObject();
    noteObj.id = noteObj._id;
    noteObj._id = noteObj._id;
    sendSuccessResponse(res, { note: noteObj }, 'Note created', 201);
  } catch (error) {
    console.error('Note creation error:', error);
    sendErrorResponse(res, error.message || 'Failed to create note', 500);
  }
});

// Update note
router.put('/:id', validate(updateNoteSchema), async (req, res) => {
  try {
    console.log('🔄 Update Note Request:', {
      id: req.params.id,
      userId: req.user.id,
      body: req.body
    });
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!note) {
      console.log('❌ Note not found for update:', req.params.id);
      return sendErrorResponse(res, 'Note not found', 404);
    }
    console.log('✅ Note updated:', note);
    sendSuccessResponse(res, { note: note.toJSON() }, 'Note updated');
  } catch (error) {
    console.error('❌ Note update error:', error);
    sendErrorResponse(res, 'Failed to update note', 500);
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return sendErrorResponse(res, 'Note not found', 404);
    }
    sendSuccessResponse(res, { note: note.toJSON() }, 'Note deleted');
  } catch (error) {
    sendErrorResponse(res, 'Failed to delete note', 500);
  }
});

// Bulk reorder notes
router.post('/bulk', async (req, res) => {
  try {
    const { action, noteIds, data } = req.body;
    if (action !== 'reorder' || !Array.isArray(data.noteOrders)) {
      return sendErrorResponse(res, 'Invalid bulk reorder request', 400);
    }
    // Only update notes belonging to the current user
    const bulkOps = data.noteOrders.map(({ noteId, order }) => ({
      updateOne: {
        filter: { _id: noteId, userId: req.user.id },
        update: { $set: { order } }
      }
    }));
    if (bulkOps.length === 0) {
      return sendErrorResponse(res, 'No notes to reorder', 400);
    }
    await Note.bulkWrite(bulkOps);
    // Return reordered notes for confirmation
    const reorderedNotes = await Note.find({ _id: { $in: data.noteOrders.map(n => n.noteId) }, userId: req.user.id }).sort({ order: 1 });
    sendSuccessResponse(res, { notes: reorderedNotes.map(n => n.toJSON()) }, 'Notes reordered');
  } catch (error) {
    sendErrorResponse(res, 'Failed to reorder notes', 500);
  }
});
// Search notes
router.get('/search', async (req, res) => {
  try {
    const { q, folder, tags, limit = '20', page = '1' } = req.query;
    const query = { userId: req.user.id };
    if (folder) query.folderId = folder;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Note.countDocuments(query);
    sendSuccessResponse(res, {
      notes: notes.map(n => n.toJSON()),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    sendErrorResponse(res, 'Failed to search notes', 500);
  }
});
export default router;



