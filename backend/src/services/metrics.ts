
// 4. BUSINESS METRICS TRACKING
// backend/src/services/metrics.ts

import { logger } from "@/config/logger";

interface BusinessMetrics {
  userRegistrations: number;
  profileCompletions: number;
  applicationSubmissions: number;
  documentUploads: number;
  loginSessions: number;
  errorRates: { [endpoint: string]: number };
}

class BusinessMetricsCollector {
  private metrics: BusinessMetrics = {
    userRegistrations: 0,
    profileCompletions: 0,
    applicationSubmissions: 0,
    documentUploads: 0,
    loginSessions: 0,
    errorRates: {}
  };

  trackUserRegistration() {
    this.metrics.userRegistrations++;
    logger.info('User registration tracked', { 
      type: 'business_metric',
      metric: 'user_registration',
      count: this.metrics.userRegistrations
    });
  }

  trackProfileCompletion(userId: string, completionPercentage: number) {
    if (completionPercentage === 100) {
      this.metrics.profileCompletions++;
    }
    
    logger.info('Profile completion tracked', {
      type: 'business_metric',
      metric: 'profile_completion',
      userId,
      completionPercentage,
      totalCompletions: this.metrics.profileCompletions
    });
  }

  trackApplicationSubmission(userId: string, applicationId: string) {
    this.metrics.applicationSubmissions++;
    logger.info('Application submission tracked', {
      type: 'business_metric',
      metric: 'application_submission',
      userId,
      applicationId,
      count: this.metrics.applicationSubmissions
    });
  }

  trackDocumentUpload(userId: string, category: string, fileSize: number) {
    this.metrics.documentUploads++;
    logger.info('Document upload tracked', {
      type: 'business_metric',
      metric: 'document_upload',
      userId,
      category,
      fileSizeMB: Math.round(fileSize / 1024 / 1024),
      count: this.metrics.documentUploads
    });
  }

  trackLogin(userId: string) {
    this.metrics.loginSessions++;
    logger.info('Login tracked', {
      type: 'business_metric',
      metric: 'login',
      userId,
      count: this.metrics.loginSessions
    });
  }

  trackError(endpoint: string) {
    this.metrics.errorRates[endpoint] = (this.metrics.errorRates[endpoint] || 0) + 1;
    logger.error('Error tracked', {
      type: 'business_metric',
      metric: 'error',
      endpoint,
      count: this.metrics.errorRates[endpoint]
    });
  }

  getMetrics(): BusinessMetrics & { timestamp: string } {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  resetDailyMetrics() {
    // Reset daily counters (keep error rates for trending)
    this.metrics = {
      ...this.metrics,
      userRegistrations: 0,
      profileCompletions: 0,
      applicationSubmissions: 0,
      documentUploads: 0,
      loginSessions: 0
    };
    
    logger.info('Daily metrics reset', { type: 'system' });
  }
}

export const businessMetrics = new BusinessMetricsCollector();
