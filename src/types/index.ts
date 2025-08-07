import { Types } from 'mongoose'
import { Request } from 'express'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthRequest extends Request {
  user: AuthUser
}

export interface IUser {
  email: string
  password: string
  name: string
  avatar?: string
  preferences: {
    theme: 'light' | 'dark'
    defaultView: 'grid' | 'list'
    autoSave: boolean
  }
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface INote {
  userId: Types.ObjectId
  folderId?: Types.ObjectId
  title: string
  content: string
  content_html?: string
  slug: string
  tags: string[]
  order: number
  isPinned: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IFolder {
  userId: Types.ObjectId
  name: string
  slug: string
  description?: string
  color: string
  order: number
  isDeployed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OptionalAuthRequest extends Request {
  user?: AuthUser
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface CreateUserData {
  email: string
  password: string
  name: string
}

export interface LoginData {
  email: string
  password: string
}

export interface CreateNoteData {
  title: string
  content_html?: string
  folderId?: string
  tags?: string[]
}

export interface UpdateNoteData {
  title?: string
  content_html?: string
  folderId?: string
  tags?: string[]
  isPinned?: boolean
  isArchived?: boolean
}

export interface CreateFolderData {
  name: string
  description?: string
  color?: string
}

export interface UpdateFolderData {
  name?: string
  description?: string
  color?: string
}
