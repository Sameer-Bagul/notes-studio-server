import { errorResponse } from '../utils/responseHelper.js';

export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  console.error(err);
  if (err.name === 'CastError') {
    error = { name: 'CastError', message: 'Invalid ID format', statusCode: 400 };
  }
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0];
    error = { name: 'DuplicateError', message: `${duplicateField} already exists`, statusCode: 400 };
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join('. ');
    error = { name: 'ValidationError', message, statusCode: 400 };
  }
  res.status(error.statusCode || 500).json(
    errorResponse(
      error.message || 'Server Error',
      'An error occurred while processing your request'
    )
  );
}

export function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}
