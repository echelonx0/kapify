
// 2. PERFORMANCE MONITORING
// backend/src/middleware/performance.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { promisify } from 'util';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: string;
  userId?: string;
}

class PerformanceMonitor {
  private slowQueryThreshold = 1000; // 1 second
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  logPerformance(metrics: PerformanceMetrics) {
    const { responseTime, memoryUsage, endpoint, statusCode } = metrics;
    
    // Log slow requests
    if (responseTime > this.slowQueryThreshold) {
      logger.warn('Slow request detected', {
        type: 'performance',
        ...metrics,
        severity: 'slow_request'
      });
    }

    // Log high memory usage
    if (memoryUsage.heapUsed > this.memoryThreshold) {
      logger.warn('High memory usage detected', {
        type: 'performance',
        memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        severity: 'high_memory'
      });
    }

    // Log error responses
    if (statusCode >= 400) {
      logger.error('Error response', {
        type: 'performance',
        ...metrics,
        severity: statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }

    // Log to performance file
    logger.info('Request performance', {
      type: 'performance',
      ...metrics
    });
  }
}

const performanceMonitor = new PerformanceMonitor();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const endMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: Math.round(responseTime * 100) / 100,
      memoryUsage: endMemory,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id
    };

    performanceMonitor.logPerformance(metrics);
  });

  next();
};
