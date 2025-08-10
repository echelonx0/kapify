
// 3. APPLICATION HEALTH MONITORING
// backend/src/middleware/health.ts

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
}

class HealthMonitor {
  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error });
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error
      };
    }
  }

  async checkSupabaseStorage(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      
      return {
        service: 'storage',
        status: 'healthy',
        responseTime: Date.now() - start,
        details: { buckets: data?.length || 0 }
      };
    } catch (error) {
      logger.error('Storage health check failed', { error: error });
      return {
        service: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error
      };
    }
  }

  checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const memoryMB = memUsage.heapUsed / 1024 / 1024;
    const threshold = 200; // 200MB threshold
    
    return {
      service: 'memory',
      status: memoryMB > threshold ? 'degraded' : 'healthy',
      responseTime: 0,
      details: {
        heapUsedMB: Math.round(memoryMB),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024)
      }
    };
  }

  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    checks: HealthCheck[];
  }> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkSupabaseStorage(),
      Promise.resolve(this.checkMemory())
    ]);

    const unhealthyServices = checks.filter(check => check.status === 'unhealthy');
    const degradedServices = checks.filter(check => check.status === 'degraded');

    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
  }
}

const healthMonitor = new HealthMonitor();

export const healthEndpoint = async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthMonitor.performHealthCheck();
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 
                      healthStatus.overall === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
    // Log health check results
    if (healthStatus.overall !== 'healthy') {
      logger.warn('Health check detected issues', healthStatus);
    }
  } catch (error) {
    logger.error('Health check endpoint failed', { error: error });
    res.status(503).json({
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};
