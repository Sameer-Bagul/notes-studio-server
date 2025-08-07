import { Request } from 'express'
import { IUser } from '../types'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    name: string
  }
}

export interface OptionalAuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface PaginationQuery {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface SearchQuery extends PaginationQuery {
  q?: string
  folder?: string
  tags?: string
}

export interface NotesQuery extends PaginationQuery {
  folder?: string
  tag?: string
  archived?: string
  pinned?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
      }
    }
  }
}
