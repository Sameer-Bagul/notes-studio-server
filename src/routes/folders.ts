import express from 'express'
import { Request, Response } from 'express'
import Folder from '../models/Folder'
import Note from '../models/Note'
import { protect } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { 
  createFolderValidation, 
  updateFolderValidation 
} from '../utils/validation'
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper'
import { generateSlug } from '../utils/slugify'
import { AuthRequest } from '../types'

const router = express.Router()

// All routes are protected
router.use(protect as any)

// Get all folders for the user
router.get('/', async (req: any, res: Response) => {
  try {
    const { includeNoteCount = 'false' } = req.query

    let folders = await Folder.find({ userId: req.user.id })
      .sort({ order: 1, createdAt: 1 })

    if (folders.length > 0) {
      console.log('🔍 Server: First folder from DB:', folders[0])
    } else {
      console.log('🔍 Server: No folders found in database')
    }

    // Include note count for each folder if requested
    if (includeNoteCount === 'true') {
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const noteCount = await Note.countDocuments({ 
            folderId: folder._id, 
            userId: req.user.id,
            isArchived: false 
          })
          const folderJson = folder.toJSON()
          return { ...folderJson, noteCount }
        })
      )

      // Also get count for notes without folder (root)
      const rootNoteCount = await Note.countDocuments({ 
        folderId: null, 
        userId: req.user.id,
        isArchived: false 
      })

      // Add virtual root folder
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
      } as any)

      if (foldersWithCount.length > 0) {
        console.log('🔍 Server: First folder with count:', foldersWithCount[0])
      } else {
        console.log('🔍 Server: No folders with count to display')
      }
      sendSuccessResponse(res, { folders: foldersWithCount })
    } else {
      // Convert to JSON to apply toJSON transform
      const foldersJson = folders.map(folder => folder.toJSON())
      if (foldersJson.length > 0) {
        console.log('🔍 Server: First folder JSON:', foldersJson[0])
      } else {
        console.log('🔍 Server: No folders to convert to JSON')
      }
      sendSuccessResponse(res, { folders: foldersJson })
    }

  } catch (error: any) {
    console.error('Get folders error:', error)
    sendErrorResponse(res, 'Failed to fetch folders', 500)
  }
})

// Get a single folder
router.get('/:id', async (req: any, res: Response) => {
  try {
    const { includeNotes = 'false' } = req.query

    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404)
    }

    let result: any = { folder }

    // Include notes in the folder if requested
    if (includeNotes === 'true') {
      const notes = await Note.find({ 
        folderId: folder._id, 
        userId: req.user.id 
      })
        .sort({ isPinned: -1, updatedAt: -1 })
        .lean()

      result.notes = notes
    }

    return sendSuccessResponse(res, result)

  } catch (error: any) {
    console.error('Get folder error:', error)
    return sendErrorResponse(res, 'Failed to fetch folder', 500)
  }
})

// Create a new folder
router.post('/', validate(createFolderValidation), async (req: any, res: Response) => {
  try {
    const { name, color = '#6366f1', order } = req.body

    // Generate unique slug
    const baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1
    
    while (await Folder.findOne({ slug, userId: req.user.id })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Determine order if not provided
    let folderOrder = order
    if (folderOrder === undefined) {
      const lastFolder = await Folder.findOne({ userId: req.user.id })
        .sort({ order: -1 })
        .select('order')
      
      folderOrder = lastFolder ? lastFolder.order + 1 : 1
    }

    // Create folder
    const folder = new Folder({
      name,
      slug,
      color,
      order: folderOrder,
      userId: req.user.id
    })

    await folder.save()

    sendSuccessResponse(res, { folder }, 'Folder created successfully', 201)

  } catch (error: any) {
    console.error('Create folder error:', error)
    sendErrorResponse(res, 'Failed to create folder', 500)
  }
})

// Update a folder
router.put('/:id', validate(updateFolderValidation), async (req: any, res: Response) => {
  try {
    const { name, color, order } = req.body

    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404)
    }

    // Update slug if name changed
    if (name && name !== folder.name) {
      const baseSlug = generateSlug(name)
      let slug = baseSlug
      let counter = 1
      
      while (await Folder.findOne({ slug, userId: req.user.id, _id: { $ne: folder._id } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      folder.slug = slug
    }

    // Update fields
    if (name !== undefined) folder.name = name
    if (color !== undefined) folder.color = color
    if (order !== undefined) folder.order = order

    await folder.save()

    return sendSuccessResponse(res, { folder }, 'Folder updated successfully')

  } catch (error: any) {
    console.error('Update folder error:', error)
    return sendErrorResponse(res, 'Failed to update folder', 500)
  }
})

// Delete a folder
router.delete('/:id', async (req: any, res: Response) => {
  try {
    const { moveNotesToFolder } = req.query

    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404)
    }

    // Handle notes in the folder
    const notesInFolder = await Note.find({ 
      folderId: folder._id, 
      userId: req.user.id 
    })

    if (notesInFolder.length > 0) {
      if (moveNotesToFolder) {
        // Validate target folder
        if (moveNotesToFolder !== 'root') {
          const targetFolder = await Folder.findOne({ 
            _id: moveNotesToFolder, 
            userId: req.user.id 
          })
          if (!targetFolder) {
            return sendErrorResponse(res, 'Target folder not found', 404)
          }
        }

        // Move notes to target folder
        await Note.updateMany(
          { folderId: folder._id, userId: req.user.id },
          { folderId: moveNotesToFolder === 'root' ? null : moveNotesToFolder }
        )
      } else {
        // Move notes to root (no folder)
        await Note.updateMany(
          { folderId: folder._id, userId: req.user.id },
          { folderId: null }
        )
      }
    }

    // Delete the folder
    await Folder.findByIdAndDelete(folder._id)

    return sendSuccessResponse(res, { 
      deletedFolder: folder._id,
      movedNotesCount: notesInFolder.length 
    }, 'Folder deleted successfully')

  } catch (error: any) {
    console.error('Delete folder error:', error)
    return sendErrorResponse(res, 'Failed to delete folder', 500)
  }
})

// Reorder folders
router.put('/reorder', async (req: any, res: Response) => {
  try {
    const { folderOrders } = req.body

    if (!Array.isArray(folderOrders)) {
      return sendErrorResponse(res, 'folderOrders must be an array', 400)
    }

    // Update each folder's order
    const updatePromises = folderOrders.map(({ folderId, order }) => 
      Folder.findOneAndUpdate(
        { _id: folderId, userId: req.user.id },
        { order },
        { new: true }
      )
    )

    const updatedFolders = await Promise.all(updatePromises)

    // Filter out null results (folders not found)
    const validFolders = updatedFolders.filter(folder => folder !== null)

    return sendSuccessResponse(res, { 
      folders: validFolders,
      updatedCount: validFolders.length 
    }, 'Folders reordered successfully')

  } catch (error: any) {
    console.error('Reorder folders error:', error)
    return sendErrorResponse(res, 'Failed to reorder folders', 500)
  }
})

// Get folder statistics
router.get('/:id/stats', async (req: any, res: Response) => {
  try {
    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404)
    }

    // Get various statistics
    const [
      totalNotes,
      pinnedNotes,
      archivedNotes,
      recentNotes
    ] = await Promise.all([
      Note.countDocuments({ folderId: folder._id, userId: req.user.id }),
      Note.countDocuments({ folderId: folder._id, userId: req.user.id, isPinned: true }),
      Note.countDocuments({ folderId: folder._id, userId: req.user.id, isArchived: true }),
      Note.countDocuments({ 
        folderId: folder._id, 
        userId: req.user.id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
    ])

    // Get all unique tags in this folder
    const tagPipeline = [
      { $match: { folderId: folder._id, userId: req.user.id } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]

    const tagStats = await Note.aggregate(tagPipeline as any)

    const stats = {
      folder: {
        id: folder._id,
        name: folder.name,
        color: folder.color
      },
      notes: {
        total: totalNotes,
        pinned: pinnedNotes,
        archived: archivedNotes,
        recent: recentNotes,
        active: totalNotes - archivedNotes
      },
      tags: tagStats.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    }

    return sendSuccessResponse(res, { stats })

  } catch (error: any) {
    console.error('Get folder stats error:', error)
    return sendErrorResponse(res, 'Failed to get folder statistics', 500)
  }
})

// Toggle folder deployment (deploy/undeploy)
router.put('/:id/deploy', async (req: any, res: Response) => {
  try {
    const { isDeployed } = req.body

    if (typeof isDeployed !== 'boolean') {
      return sendErrorResponse(res, 'isDeployed must be a boolean', 400)
    }

    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    })

    if (!folder) {
      return sendErrorResponse(res, 'Folder not found', 404)
    }

    folder.isDeployed = isDeployed
    await folder.save()

    const action = isDeployed ? 'deployed' : 'undeployed'
    return sendSuccessResponse(res, { folder }, `Folder ${action} successfully`)

  } catch (error: any) {
    console.error('Toggle deployment error:', error)
    return sendErrorResponse(res, 'Failed to toggle folder deployment', 500)
  }
})

export default router
