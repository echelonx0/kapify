/**
 * Development Environment Configuration
 *
 * SECURITY: Do not commit sensitive values to version control
 * Use environment variables for production deployments
 */

export const environment = {
  production: false,

  // Supabase Configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseProjectRef: import.meta.env.VITE_SUPABASE_PROJECT_REF || '',

  // Storage Configuration (Centralized)
  storage: {
    // Single source of truth for storage bucket
    bucket: import.meta.env.VITE_STORAGE_BUCKET || 'platform-documents',

    // Data room specific bucket (optional separate bucket for data rooms)
    dataRoomBucket: import.meta.env.VITE_DATA_ROOM_BUCKET || 'platform-documents',

    maxFileSize: 52428800, // 50MB in bytes

    allowedTypes: [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'xls',
      'xlsx',
      'csv',
      'txt'
    ],

    // MIME type validation mapping
    allowedMimeTypes: {
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'xls': ['application/vnd.ms-excel'],
      'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'csv': ['text/csv'],
      'txt': ['text/plain']
    },

    // Virus scanning (future implementation)
    virusScanEnabled: false,

    // Signed URL expiry (in seconds)
    signedUrlExpiry: 3600 // 1 hour
  },

  // Rate Limiting Configuration
  rateLimit: {
    enabled: true,

    // Document operations
    documentUpload: {
      maxRequests: 10,
      windowMs: 60000 // 1 minute
    },

    // Share operations
    shareCreation: {
      maxRequests: 20,
      windowMs: 60000
    },

    // Access requests
    accessRequests: {
      maxRequests: 5,
      windowMs: 300000 // 5 minutes
    }
  },

  // Cache Configuration
  cache: {
    dataRoomTTL: 5 * 60 * 1000, // 5 minutes
    documentTTL: 5 * 60 * 1000,
    shareTTL: 5 * 60 * 1000,
    maxCacheSize: 100 // Maximum number of cached items
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,

    // Operations that should be retried
    retryableOperations: ['read', 'upload'],

    // HTTP status codes that trigger retry
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },

  // Monitoring & Logging
  monitoring: {
    errorTracking: {
      enabled: false,
      sampleRate: 1.0
    },

    performanceMonitoring: {
      enabled: true,
      sampleRate: 0.1 // 10% of requests
    },

    logLevel: 'debug' // 'error' | 'warn' | 'info' | 'debug'
  },

  // Feature Flags
  features: {
    dataRoomSharing: true,
    documentAnalysis: true,
    virusScanning: false,
    realTimeNotifications: false
  },

  // Notification Configuration
  notifications: {
    email: {
      enabled: false,
      provider: 'supabase-edge-function'
    },

    inApp: {
      enabled: false
    }
  }
};

// Validation: Check required environment variables
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!environment.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!environment.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  if (!environment.supabaseProjectRef) {
    errors.push('VITE_SUPABASE_PROJECT_REF is required');
  }

  if (!environment.storage.bucket) {
    errors.push('Storage bucket configuration is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
