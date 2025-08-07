import mongoose, { Schema, Document } from 'mongoose'
import { IFolder } from '../types'

export interface IFolderDocument extends IFolder, Document {}

const folderSchema = new Schema<IFolderDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Folder slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6366f1',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  order: {
    type: Number,
    default: 0
  },
  isDeployed: {
    type: Boolean,
    default: false,
    index: true // Add index for faster queries of deployed folders
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Index for faster queries
folderSchema.index({ userId: 1, slug: 1 }, { unique: true })
folderSchema.index({ userId: 1, createdAt: -1 })
folderSchema.index({ userId: 1, order: 1 })
folderSchema.index({ isDeployed: 1, createdAt: -1 }) // For public deployed folders

// Generate slug from name if not provided
folderSchema.pre('save', function(this: IFolderDocument, next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  next()
})

export default mongoose.model<IFolderDocument>('Folder', folderSchema)
