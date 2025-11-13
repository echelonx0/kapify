/**
 * Production Environment Configuration
 */

export const environment = {
  production: true,

  // Supabase Configuration (from environment variables)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseProjectRef: import.meta.env.VITE_SUPABASE_PROJECT_REF || '',

  // Storage Configuration
  storage: {
    bucket: import.meta.env.VITE_STORAGE_BUCKET || 'platform-documents',
    dataRoomBucket: import.meta.env.VITE_DATA_ROOM_BUCKET || 'platform-documents',
    maxFileSize: 52428800, // 50MB
    allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xls', 'xlsx', 'csv', 'txt'],
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
    virusScanEnabled: true, // Enable in production
    signedUrlExpiry: 3600
  },

  // Rate Limiting (stricter in production)
  rateLimit: {
    enabled: true,
    documentUpload: {
      maxRequests: 5,
      windowMs: 60000
    },
    shareCreation: {
      maxRequests: 10,
      windowMs: 60000
    },
    accessRequests: {
      maxRequests: 3,
      windowMs: 300000
    }
  },

  // Cache Configuration
  cache: {
    dataRoomTTL: 5 * 60 * 1000,
    documentTTL: 5 * 60 * 1000,
    shareTTL: 5 * 60 * 1000,
    maxCacheSize: 200
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableOperations: ['read', 'upload'],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },

  // Monitoring (enabled in production)
  monitoring: {
    errorTracking: {
      enabled: true,
      sampleRate: 1.0
    },
    performanceMonitoring: {
      enabled: true,
      sampleRate: 0.2 // 20% sampling
    },
    logLevel: 'warn' // Less verbose in production
  },

  // Feature Flags
  features: {
    dataRoomSharing: true,
    documentAnalysis: true,
    virusScanning: true,
    realTimeNotifications: true
  },

  // Notifications (enabled in production)
  notifications: {
    email: {
      enabled: true,
      provider: 'supabase-edge-function'
    },
    inApp: {
      enabled: true
    }
  }
};

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
