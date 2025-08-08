import { errorResponse } from '../utils/responseHelper.js';

export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details[0].message;
      res.status(400).json(errorResponse(errorMessage, 'Validation failed'));
      return;
    }
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      const errorMessage = error.details[0].message;
      res.status(400).json(errorResponse(errorMessage, 'Query validation failed'));
      return;
    }
    req.query = value;
    next();
  };
}
