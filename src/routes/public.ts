import express from 'express'
import { Request, Response } from 'express'
import Folder from '../models/Folder'
import Note from '../models/Note'
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper'

const router = express.Router()

// Get all deployed (public) folders
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const { includeNoteCount = 'true' } = req.query

    // Find all deployed folders
    const folders = await Folder.find({ isDeployed: true })
      .populate('userId', 'name email') // Include owner info
      .sort({ createdAt: -1 })
      .lean()

    if (!folders || folders.length === 0) {
      return sendSuccessResponse(res, { folders: [] })
    }

    // Include note count for each folder if requested
    if (includeNoteCount === 'true') {
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const noteCount = await Note.countDocuments({ 
            folderId: folder._id,
            isArchived: false 
          })
          return { ...folder, noteCount }
        })
      )

      return sendSuccessResponse(res, { folders: foldersWithCount })
    }

    sendSuccessResponse(res, { folders })

  } catch (error: any) {
    console.error('Get public folders error:', error)
    sendErrorResponse(res, 'Failed to fetch public folders', 500)
  }
})

// Get public folder by slug with notes
router.get('/folders/:slug', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, search = '', sortBy = 'updatedAt', order = 'desc' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    // Find the deployed folder by slug
    const folder = await Folder.findOne({ 
      slug: req.params.slug,
      isDeployed: true 
    })
      .populate('userId', 'name email')
      .lean()

    if (!folder) {
      return sendErrorResponse(res, 'Public folder not found', 404)
    }

    // Build notes query
    const notesQuery: any = { 
      folderId: folder._id,
      isArchived: false 
    }

    // Add search functionality
    if (search) {
      notesQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content_html: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ]
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1
    const sortObj: any = {}
    sortObj[sortBy as string] = sortOrder

    // Get notes with pagination
    const [notes, total] = await Promise.all([
      Note.find(notesQuery)
        .populate('userId', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Note.countDocuments(notesQuery)
    ])

    const response = {
      folder: {
        ...folder,
        owner: folder.userId
      },
      notes,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: skip + notes.length < total,
        hasPrev: parseInt(page as string) > 1
      }
    }

    sendSuccessResponse(res, response)

  } catch (error: any) {
    console.error('Get public folder error:', error)
    sendErrorResponse(res, 'Failed to fetch public folder', 500)
  }
})

// Get public note by folder slug and note slug
router.get('/folders/:folderSlug/notes/:noteSlug', async (req: Request, res: Response) => {
  try {
    const { folderSlug, noteSlug } = req.params

    // Find the deployed folder first
    const folder = await Folder.findOne({ 
      slug: folderSlug,
      isDeployed: true 
    }).lean()

    if (!folder) {
      return sendErrorResponse(res, 'Public folder not found', 404)
    }

    // Find the note in the folder
    const note = await Note.findOne({
      slug: noteSlug,
      folderId: folder._id,
      isArchived: false
    })
      .populate('userId', 'name email')
      .populate('folderId', 'name slug description color')
      .lean()

    if (!note) {
      return sendErrorResponse(res, 'Public note not found', 404)
    }

    sendSuccessResponse(res, { 
      note: {
        ...note,
        author: note.userId,
        folder: note.folderId
      }
    })

  } catch (error: any) {
    console.error('Get public note error:', error)
    sendErrorResponse(res, 'Failed to fetch public note', 500)
  }
})

// Search public notes across all deployed folders
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = 20, page = 1 } = req.query

    if (!q || typeof q !== 'string') {
      return sendErrorResponse(res, 'Search query is required', 400)
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    // First, get all deployed folder IDs
    const deployedFolders = await Folder.find({ isDeployed: true }).select('_id').lean()
    const deployedFolderIds = deployedFolders.map(f => f._id)

    // Search notes only in deployed folders
    const searchQuery = {
      folderId: { $in: deployedFolderIds },
      isArchived: false,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content_html: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }

    const [notes, total] = await Promise.all([
      Note.find(searchQuery)
        .populate('userId', 'name email')
        .populate('folderId', 'name slug color')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Note.countDocuments(searchQuery)
    ])

    sendSuccessResponse(res, {
      notes: notes.map(note => ({
        ...note,
        author: note.userId,
        folder: note.folderId
      })),
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        hasNext: skip + notes.length < total,
        hasPrev: parseInt(page as string) > 1
      },
      searchQuery: q
    })

  } catch (error: any) {
    console.error('Search public notes error:', error)
    sendErrorResponse(res, 'Failed to search public notes', 500)
  }
})

export default router
