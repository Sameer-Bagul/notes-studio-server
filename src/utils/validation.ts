import Joi from 'joi'

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    })
})

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
})

// Note validation schemas
export const createNoteSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  content: Joi.string().allow('').default(''),
  folderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10)
})

export const updateNoteSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  content: Joi.string().allow(''),
  folderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
  isPinned: Joi.boolean(),
  isArchived: Joi.boolean()
})

// Folder validation schemas
export const createFolderSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Folder name cannot be empty',
      'string.max': 'Folder name cannot exceed 100 characters',
      'any.required': 'Folder name is required'
    }),
  description: Joi.string().max(500).allow(''),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6366f1')
})

export const updateFolderSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Folder name cannot be empty',
      'string.max': 'Folder name cannot exceed 100 characters'
    }),
  description: Joi.string().max(500).allow(''),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i)
})

// Search validation schema
export const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('notes', 'folders', 'all').default('all'),
  folderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
  tags: Joi.array().items(Joi.string()),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
})

// User profile update schema
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system'),
    defaultView: Joi.string().valid('grid', 'list'),
    sortBy: Joi.string().valid('title', 'created', 'updated'),
    sortOrder: Joi.string().valid('asc', 'desc')
  })
})

// Export functions that match the route imports
export const registerValidation = registerSchema
export const loginValidation = loginSchema
export const createNoteValidation = createNoteSchema
export const updateNoteValidation = updateNoteSchema
export const createFolderValidation = createFolderSchema
export const updateFolderValidation = updateFolderSchema
export const searchNotesValidation = searchSchema
export const updateProfileValidation = updateProfileSchema
