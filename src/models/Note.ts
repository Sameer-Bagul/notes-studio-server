import mongoose, { Schema, Document } from 'mongoose'
import { INote } from '../types'

export interface INoteDocument extends INote, Document {}

const noteSchema = new Schema<INoteDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Note slug is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  content_html: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  order: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id
      ret.content = ret.content_html // Map content_html to content for frontend
      delete ret._id
      delete ret.__v
      delete ret.content_html // Remove the original content_html field
      return ret
    }
  }
})

// Compound indexes for faster queries
noteSchema.index({ userId: 1, folderId: 1, order: 1 })
noteSchema.index({ userId: 1, slug: 1 }, { unique: true })
noteSchema.index({ userId: 1, createdAt: -1 })
noteSchema.index({ userId: 1, updatedAt: -1 })
noteSchema.index({ userId: 1, isPinned: -1, order: 1 })
noteSchema.index({ userId: 1, tags: 1 })
noteSchema.index({ userId: 1, title: 'text', content_html: 'text' }) // Full-text search

// Generate slug from title if not provided
noteSchema.pre('save', function(this: INoteDocument, next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  next()
})

export default mongoose.model<INoteDocument>('Note', noteSchema)
