import { Request, Response, NextFunction } from 'express'
import { ObjectSchema } from 'joi'
import { errorResponse } from '../utils/responseHelper'

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    
    if (error) {
      const errorMessage = error.details[0].message
      res.status(400).json(errorResponse(errorMessage, 'Validation failed'))
      return
    }
    
    next()
  }
}

export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query)
    
    if (error) {
      const errorMessage = error.details[0].message
      res.status(400).json(errorResponse(errorMessage, 'Query validation failed'))
      return
    }
    
    // Replace req.query with validated and transformed values
    req.query = value
    next()
  }
}
