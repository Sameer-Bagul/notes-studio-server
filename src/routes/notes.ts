import express from 'express'
import { Request, Response } from 'express'
import Note from '../models/Note'
import Folder from '../models/Folder'
import { protect } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { 
  createNoteValidation, 
  updateNoteValidation,
  searchNotesValidation 
} from '../utils/validation'
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper'
import { generateSlug } from '../utils/slugify'

const router = express.Router()

// All routes are protected
router.use(protect as any)

// Get all notes for the user
router.get('/', async (req: any, res: Response) => {
  try {
    const { 
      folder, 
      tag, 
      archived = 'false', 
      pinned,
      sort = 'updatedAt',
      order = 'desc',
      limit = '50',
      page = '1'
    } = req.query

    // Build query
    const query: any = { userId: req.user.id }
    
    if (folder && folder !== 'root') {
      query.folderId = folder
    } else if (folder === 'root') {
      query.folderId = null
    }
    
    if (tag) {
      query.tags = { $in: [tag] }
    }
    
    query.isArchived = archived === 'true'
    
    if (pinned !== undefined) {
      query.isPinned = pinned === 'true'
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))
    const skip = (pageNum - 1) * limitNum

    // Get notes with pagination - prioritize order field for consistent positioning
    let sortConfig: any
    if (sort === 'order' || (sort === 'updatedAt' && order === 'desc')) {
      // For order sort or default sort, sort by order first, then by date
      sortConfig = { order: 1, updatedAt: -1 }
    } else {
      sortConfig = { [sort as string]: order === 'desc' ? -1 : 1 }
    }
    
    const notes = await Note.find(query)
      .populate('folderId', 'name color slug')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)

    console.log('🔍 Server: First note from DB (with toJSON):', notes[0])
    
    // Only try to parse JSON if we have notes
    if (notes.length > 0) {
      console.log('🔍 Server: First note JSON serialized:', JSON.parse(JSON.stringify(notes[0])))
    } else {
      console.log('🔍 Server: No notes found in database')
    }

    // Get total count for pagination
    const total = await Note.countDocuments(query)

    // Manually serialize notes to ensure toJSON transform is applied
    const serializedNotes = notes.map(note => note.toJSON())
    
    if (serializedNotes.length > 0) {
      console.log('🔍 Server: First serialized note:', serializedNotes[0])
    } else {
      console.log('🔍 Server: No notes to serialize')
    }

    sendSuccessResponse(res, {
      notes: serializedNotes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error: any) {
    console.error('Get notes error:', error)
    sendErrorResponse(res, 'Failed to fetch notes', 500)
  }
})

// Search notes
router.get('/search', validate(searchNotesValidation), async (req: any, res: Response) => {
  try {
    const { q, folder, tags, limit = '20' } = req.query

    if (!q) {
      return sendErrorResponse(res, 'Search query is required', 400)
    }

    // Build search query
    const query: any = {
      userId: req.user.id,
      $text: { $search: q as string }
    }

    if (folder && folder !== 'root') {
      query.folderId = folder
    } else if (folder === 'root') {
      query.folderId = null
    }

    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim())
      query.tags = { $in: tagArray }
    }

    // Exclude archived notes from search by default
    query.isArchived = false

    const notes = await Note.find(query, { score: { $meta: 'textScore' } })
      .populate('folderId', 'name color slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit as string))
      .lean()

    sendSuccessResponse(res, { notes })

  } catch (error: any) {
    console.error('Search notes error:', error)
    sendErrorResponse(res, 'Failed to search notes', 500)
  }
})

// Get a single note
router.get('/:id', async (req: any, res: Response) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    }).populate('folderId', 'name color slug')

    if (!note) {
      return sendErrorResponse(res, 'Note not found', 404)
    }

    sendSuccessResponse(res, { note })

  } catch (error: any) {
    console.error('Get note error:', error)
    sendErrorResponse(res, 'Failed to fetch note', 500)
  }
})

// Create a new note
router.post('/', validate(createNoteValidation), async (req: any, res: Response) => {
  try {
    const { title, content, folderId, tags = [], isPinned = false } = req.body

    // Validate folder ownership if provided
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId: req.user.id })
      if (!folder) {
        return sendErrorResponse(res, 'Folder not found', 404)
      }
    }

    // Generate unique slug
    const baseSlug = generateSlug(title)
    let slug = baseSlug
    let counter = 1
    
    while (await Note.findOne({ slug, userId: req.user.id })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create note
    const note = new Note({
      title,
      content_html: content, // Map content to content_html for schema consistency
      slug,
      userId: req.user.id,
      folderId: folderId || null,
      tags,
      isPinned
    })

    await note.save()

    // Populate folder information
    await note.populate('folderId', 'name color slug')

    sendSuccessResponse(res, { note }, 'Note created successfully', 201)

  } catch (error: any) {
    console.error('Create note error:', error)
    sendErrorResponse(res, 'Failed to create note', 500)
  }
})

// Update a note
router.put('/:id', validate(updateNoteValidation), async (req: any, res: Response) => {
  try {
    console.log('📝 Update note request - ID:', req.params.id)
    console.log('📝 Update note payload:', JSON.stringify(req.body, null, 2))
    
    const { title, content, folderId, tags, isPinned, isArchived } = req.body

    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!note) {
      return sendErrorResponse(res, 'Note not found', 404)
    }

    // Validate folder ownership if provided
    if (folderId !== undefined && folderId !== null) {
      const folder = await Folder.findOne({ _id: folderId, userId: req.user.id })
      if (!folder) {
        return sendErrorResponse(res, 'Folder not found', 404)
      }
    }

    // Update slug if title changed
    if (title && title !== note.title) {
      const baseSlug = generateSlug(title)
      let slug = baseSlug
      let counter = 1
      
      while (await Note.findOne({ slug, userId: req.user.id, _id: { $ne: note._id } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      note.slug = slug
    }

    // Update fields
    console.log('📝 Updating folderId from:', note.folderId, 'to:', folderId)
    if (title !== undefined) note.title = title
    if (content !== undefined) note.content_html = content // Map content to content_html
    if (folderId !== undefined) note.folderId = folderId
    if (tags !== undefined) note.tags = tags
    if (isPinned !== undefined) note.isPinned = isPinned
    if (isArchived !== undefined) note.isArchived = isArchived

    console.log('📝 Note before save:', note.folderId)
    await note.save()
    console.log('📝 Note after save - folderId:', note.folderId)

    // Populate folder information
    await note.populate('folderId', 'name color slug')

    sendSuccessResponse(res, { note }, 'Note updated successfully')

  } catch (error: any) {
    console.error('Update note error:', error)
    sendErrorResponse(res, 'Failed to update note', 500)
  }
})

// Delete a note
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!note) {
      return sendErrorResponse(res, 'Note not found', 404)
    }

    sendSuccessResponse(res, {}, 'Note deleted successfully')

  } catch (error: any) {
    console.error('Delete note error:', error)
    sendErrorResponse(res, 'Failed to delete note', 500)
  }
})

// Bulk operations
router.post('/bulk', async (req: any, res: Response) => {
  try {
    const { action, noteIds, data } = req.body

    if (!action || !Array.isArray(noteIds) || noteIds.length === 0) {
      return sendErrorResponse(res, 'Action and noteIds are required', 400)
    }

    const query = { 
      _id: { $in: noteIds }, 
      userId: req.user.id 
    }

    let result
    switch (action) {
      case 'delete':
        result = await Note.deleteMany(query)
        break
      
      case 'archive':
        result = await Note.updateMany(query, { isArchived: true })
        break
      
      case 'unarchive':
        result = await Note.updateMany(query, { isArchived: false })
        break
      
      case 'pin':
        result = await Note.updateMany(query, { isPinned: true })
        break
      
      case 'unpin':
        result = await Note.updateMany(query, { isPinned: false })
        break
      
      case 'move':
        if (!data || data.folderId === undefined) {
          return sendErrorResponse(res, 'Folder ID is required for move operation', 400)
        }
        
        // Validate folder ownership if provided
        if (data.folderId) {
          const folder = await Folder.findOne({ _id: data.folderId, userId: req.user.id })
          if (!folder) {
            return sendErrorResponse(res, 'Folder not found', 404)
          }
        }
         
        result = await Note.updateMany(query, { folderId: data.folderId })
        break
      
      case 'reorder':
        if (!data || !Array.isArray(data.noteOrders)) {
          return sendErrorResponse(res, 'Note orders array is required for reorder operation', 400)
        }
        
        console.log('📝 Reordering notes:', data.noteOrders)
        
        // Update each note's order
        const bulkOps = data.noteOrders.map((item: { noteId: string; order: number }) => ({
          updateOne: {
            filter: { _id: item.noteId, userId: req.user.id },
            update: { $set: { order: item.order } }
          }
        }))
        
        result = await Note.bulkWrite(bulkOps)
        console.log('📝 Reorder result:', result)
        break
      
      default:
        return sendErrorResponse(res, 'Invalid action', 400)
    }

    sendSuccessResponse(res, { 
      modifiedCount: (result as any).modifiedCount || (result as any).deletedCount 
    }, `Bulk ${action} completed successfully`)

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    sendErrorResponse(res, 'Bulk operation failed', 500)
  }
})

export default router
