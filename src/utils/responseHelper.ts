import { Response } from 'express'
import { ApiResponse } from '../types'

export const successResponse = <T>(
  data: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  pagination
})

export const errorResponse = (
  error: string,
  message?: string
): ApiResponse => ({
  success: false,
  message,
  error
})

// Express response helpers
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

export const sendErrorResponse = (
  res: Response,
  error: string,
  statusCode: number = 400,
  message?: string
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error
  })
}

export const paginationHelper = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit)
})
