import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/did';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    statusCode: 500
  };

  // Handle specific error types
  if (error.message.includes('not found')) {
    errorResponse.error = 'Not Found';
    errorResponse.message = error.message;
    errorResponse.statusCode = 404;
  } else if (error.message.includes('validation') || error.message.includes('Validation')) {
    errorResponse.error = 'Validation Error';
    errorResponse.message = error.message;
    errorResponse.statusCode = 400;
  } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
    errorResponse.error = 'Conflict';
    errorResponse.message = error.message;
    errorResponse.statusCode = 409;
  }

  res.status(errorResponse.statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  };

  res.status(404).json(errorResponse);
};
