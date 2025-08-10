
// backend/src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
 

// Simple metrics collection
interface Metrics {
  requests: {
    total: number;
    byStatus: { [key: number]: number };
    byRoute: { [key: string]: number };
  };
  errors: number;
  uptime: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    requests: {
      total: 0,
      byStatus: {},
      byRoute: {}
    },
    errors: 0,
    uptime: Date.now()
  };

  collectRequest(req: Request, res: Response) {
    this.metrics.requests.total++;
    
    const status = res.statusCode;
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;
    
    const route = `${req.method} ${req.route?.path || req.path}`;
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1;
    
    if (status >= 400) {
      this.metrics.errors++;
    }
  }

  getMetrics(): Metrics & { uptimeSeconds: number } {
    return {
      ...this.metrics,
      uptimeSeconds: Math.floor((Date.now() - this.metrics.uptime) / 1000)
    };
  }
}

export const metricsCollector = new MetricsCollector();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    metricsCollector.collectRequest(req, res);
  });
  next();
};

export const metricsEndpoint = (req: Request, res: Response) => {
  res.json(metricsCollector.getMetrics());
};
