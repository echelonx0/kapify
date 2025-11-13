import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Rate Limiting Service
 *
 * Implements client-side rate limiting to prevent abuse and reduce server load
 * Uses sliding window algorithm for accurate rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
  config: RateLimitConfig;
}

@Injectable({
  providedIn: 'root'
})
export class RateLimiterService {
  private limits = new Map<string, RateLimitEntry>();

  constructor() {
    console.log('✅ Rate limiter initialized');

    // Cleanup expired entries periodically
    if (environment.rateLimit.enabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Check if operation is rate limited
   */
  checkLimit(operation: string, config?: RateLimitConfig): { allowed: boolean; retryAfter?: number } {
    if (!environment.rateLimit.enabled) {
      return { allowed: true };
    }

    const limitConfig = config || this.getDefaultConfig(operation);
    const now = Date.now();
    const key = this.getLimitKey(operation);

    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry) {
      entry = {
        timestamps: [],
        config: limitConfig
      };
      this.limits.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(
      timestamp => now - timestamp < limitConfig.windowMs
    );

    // Check if limit exceeded
    if (entry.timestamps.length >= limitConfig.maxRequests) {
      const oldestTimestamp = Math.min(...entry.timestamps);
      const retryAfter = limitConfig.windowMs - (now - oldestTimestamp);

      console.warn(`⚠️  Rate limit exceeded for ${operation}. Retry after ${Math.ceil(retryAfter / 1000)}s`);

      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter / 1000) // Convert to seconds
      };
    }

    // Allow request and record timestamp
    entry.timestamps.push(now);

    return { allowed: true };
  }

  /**
   * Wrap an observable with rate limiting
   */
  rateLimit<T>(operation: string, source$: Observable<T>, config?: RateLimitConfig): Observable<T> {
    if (!environment.rateLimit.enabled) {
      return source$;
    }

    const result = this.checkLimit(operation, config);

    if (!result.allowed) {
      return throwError(() => new Error(
        `Rate limit exceeded for ${operation}. Please try again in ${result.retryAfter} seconds.`
      ));
    }

    return source$;
  }

  /**
   * Wrap an observable with rate limiting and automatic retry
   */
  rateLimitWithRetry<T>(
    operation: string,
    source$: Observable<T>,
    config?: RateLimitConfig
  ): Observable<T> {
    const result = this.checkLimit(operation, config);

    if (!result.allowed && result.retryAfter) {
      // Wait and retry
      return timer(result.retryAfter * 1000).pipe(
        switchMap(() => this.rateLimit(operation, source$, config))
      );
    }

    return source$;
  }

  /**
   * Get default rate limit config for operation
   */
  private getDefaultConfig(operation: string): RateLimitConfig {
    // Map operations to environment configs
    if (operation.includes('upload') || operation.includes('document')) {
      return environment.rateLimit.documentUpload;
    }

    if (operation.includes('share')) {
      return environment.rateLimit.shareCreation;
    }

    if (operation.includes('access') || operation.includes('request')) {
      return environment.rateLimit.accessRequests;
    }

    // Default fallback
    return {
      maxRequests: 10,
      windowMs: 60000
    };
  }

  /**
   * Get limit key (can include user context)
   */
  private getLimitKey(operation: string): string {
    // In production, include user ID for per-user limits
    // const userId = this.getCurrentUserId();
    // return `${userId}:${operation}`;

    return operation;
  }

  /**
   * Reset limits for an operation
   */
  resetLimit(operation: string): void {
    const key = this.getLimitKey(operation);
    this.limits.delete(key);
  }

  /**
   * Get current usage for an operation
   */
  getUsage(operation: string): { current: number; max: number; windowMs: number } {
    const config = this.getDefaultConfig(operation);
    const key = this.getLimitKey(operation);
    const entry = this.limits.get(key);

    if (!entry) {
      return {
        current: 0,
        max: config.maxRequests,
        windowMs: config.windowMs
      };
    }

    const now = Date.now();
    const validTimestamps = entry.timestamps.filter(
      timestamp => now - timestamp < config.windowMs
    );

    return {
      current: validTimestamps.length,
      max: config.maxRequests,
      windowMs: config.windowMs
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.limits.entries()) {
        // Remove timestamps outside window
        const originalLength = entry.timestamps.length;
        entry.timestamps = entry.timestamps.filter(
          timestamp => now - timestamp < entry.config.windowMs
        );

        // If no timestamps left, remove entry
        if (entry.timestamps.length === 0) {
          this.limits.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired rate limit entries`);
      }
    }, 60000); // Cleanup every minute
  }
}
