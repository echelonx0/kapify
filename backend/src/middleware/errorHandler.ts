// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { message, stack, statusCode = 500 } = error;
  
  // Log error
  logger.error('Application Error', {
    message,
    stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          error: 'A record with this information already exists',
          code: 'DUPLICATE_RECORD'
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: 'Record not found',
          code: 'NOT_FOUND'
        });
        return;
      default:
        res.status(500).json({
          error: 'Database operation failed',
          code: 'DATABASE_ERROR'
        });
        return;
    }
  }

  // Handle other Prisma errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'Invalid data provided',
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(500).json({
      error: 'Database connection failed',
      code: 'DATABASE_CONNECTION_ERROR'
    });
    return;
  }

  // Handle custom app errors
  if (error.isOperational) {
    res.status(statusCode).json({
      error: message,
      code: 'OPERATIONAL_ERROR'
    });
    return;
  }

  // Send generic error response for unknown errors
  const response = {
    error: message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack })
  };

  res.status(statusCode).json(response);
};

// Custom error classes for better error handling
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};