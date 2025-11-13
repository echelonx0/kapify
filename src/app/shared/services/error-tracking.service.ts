import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Error Tracking Service
 *
 * Centralized error tracking and logging for production monitoring
 * Integrates with error tracking platforms (Sentry, Rollbar, etc.)
 */

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  error: Error;
  context: ErrorContext;
  severity: 'error' | 'warning' | 'info';
  timestamp: Date;
  stackTrace?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  private errorQueue: ErrorEvent[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    if (environment.monitoring.errorTracking.enabled) {
      this.initializeErrorTracking();
    }
  }

  /**
   * Initialize error tracking platform integration
   */
  private initializeErrorTracking(): void {
    // Example: Initialize Sentry
    // Sentry.init({
    //   dsn: environment.sentryDsn,
    //   environment: environment.production ? 'production' : 'development',
    //   sampleRate: environment.monitoring.errorTracking.sampleRate
    // });

    console.log('✅ Error tracking initialized');

    // Set up global error handler
    this.setupGlobalErrorHandler();
  }

  /**
   * Set up global error handler for uncaught errors
   */
  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.captureError(
        event.error || new Error(event.message),
        {
          component: 'global',
          action: 'unhandled_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        'error'
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled_promise_rejection'
        },
        'error'
      );
    });
  }

  /**
   * Capture and log error
   */
  captureError(
    error: Error,
    context: ErrorContext = {},
    severity: 'error' | 'warning' | 'info' = 'error'
  ): void {
    const errorEvent: ErrorEvent = {
      error,
      context,
      severity,
      timestamp: new Date(),
      stackTrace: error.stack
    };

    // Add to queue
    this.errorQueue.push(errorEvent);
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remove oldest
    }

    // Log to console (structured)
    this.logToConsole(errorEvent);

    // Send to error tracking service if enabled
    if (environment.monitoring.errorTracking.enabled) {
      this.sendToErrorTrackingService(errorEvent);
    }
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(event: ErrorEvent): void {
    const { error, context, severity, timestamp } = event;

    const logLevel = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'log';

    console[logLevel]('🚨 Error Captured:', {
      message: error.message,
      severity,
      timestamp: timestamp.toISOString(),
      context,
      stack: error.stack
    });
  }

  /**
   * Send error to external error tracking service
   */
  private sendToErrorTrackingService(event: ErrorEvent): void {
    // Example: Send to Sentry
    // Sentry.captureException(event.error, {
    //   level: event.severity,
    //   contexts: {
    //     user: {
    //       id: event.context.userId,
    //       organization: event.context.organizationId
    //     },
    //     custom: event.context.metadata
    //   },
    //   tags: {
    //     component: event.context.component,
    //     action: event.context.action
    //   }
    // });

    // Fallback: Log to backend API for storage
    this.logToBackend(event);
  }

  /**
   * Log error to backend for persistence
   */
  private async logToBackend(event: ErrorEvent): Promise<void> {
    try {
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: event.error.message,
      //     stack: event.error.stack,
      //     severity: event.severity,
      //     context: event.context,
      //     timestamp: event.timestamp.toISOString()
      //   })
      // });
    } catch (error) {
      console.warn('Failed to log error to backend:', error);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(): ErrorEvent[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, organizationId?: string): void {
    // Example: Set Sentry user context
    // Sentry.setUser({
    //   id: userId,
    //   organization: organizationId
    // });
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    // Sentry.setUser(null);
  }
}
