import { Request, Response, NextFunction } from 'express'
import { errorResponse } from '../utils/responseHelper'

export interface CustomError extends Error {
  statusCode?: number
  code?: number
  keyValue?: any
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error(err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format'
    error = { name: 'CastError', message, statusCode: 400 } as CustomError
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0]
    const message = `${duplicateField} already exists`
    error = { name: 'DuplicateError', message, statusCode: 400 } as CustomError
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join('. ')
    error = { name: 'ValidationError', message, statusCode: 400 } as CustomError
  }

  res.status(error.statusCode || 500).json(
    errorResponse(
      error.message || 'Server Error',
      'An error occurred while processing your request'
    )
  )
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as CustomError
  error.statusCode = 404
  next(error)
}
