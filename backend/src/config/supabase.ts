
// backend/src/config/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * PRODUCTION SECURITY REQUIREMENTS:
 *
 * 1. SERVICE_ROLE_KEY Security:
 *    - NEVER expose service role key to client
 *    - Rotate keys regularly (quarterly minimum)
 *    - Use IP allowlisting where possible
 *    - Monitor for unusual access patterns
 *    - Service role bypasses Row Level Security (RLS) - use with extreme caution
 *
 * 2. Environment Variables Required:
 *    - SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_SERVICE_ROLE_KEY: Service role key (keep secret!)
 *    - STORAGE_BUCKET: Storage bucket name (optional, defaults to 'platform-documents')
 *
 * 3. Audit Logging:
 *    - All service role operations should be logged
 *    - Include user context when available
 *    - Track data access patterns
 */

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  storageBucket: string;
}

/**
 * Validate required environment variables
 * Fails fast on application startup if configuration is invalid
 */
function validateEnvironment(): SupabaseConfig {
  const errors: string[] = [];

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageBucket = process.env.STORAGE_BUCKET || 'platform-documents';

  if (!url || url.trim() === '') {
    errors.push('SUPABASE_URL environment variable is required');
  }

  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    errors.push('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  // Validate URL format
  if (url) {
    try {
      new URL(url);
    } catch (error) {
      errors.push('SUPABASE_URL must be a valid URL');
    }
  }

  // Security: Warn if using default bucket in production
  if (process.env.NODE_ENV === 'production' && storageBucket === 'platform-documents') {
    console.warn('⚠️  Using default storage bucket name in production. Consider using environment-specific bucket.');
  }

  if (errors.length > 0) {
    const errorMessage = [
      '❌ Supabase configuration error:',
      ...errors.map(e => `   - ${e}`),
      '',
      'Please set the required environment variables and restart the application.'
    ].join('\n');

    throw new Error(errorMessage);
  }

  return {
    url: url!,
    serviceRoleKey: serviceRoleKey!,
    storageBucket
  };
}

// Validate on module load (fail fast)
const config = validateEnvironment();

/**
 * Supabase client with service role key
 *
 * WARNING: This client bypasses Row Level Security (RLS)
 * Use only in trusted backend code. Never expose to client.
 */
export const supabase: SupabaseClient = createClient(
  config.url,
  config.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-backend-service',
        'X-Service-Role': 'true'
      }
    }
  }
);

// Storage bucket configuration
export const STORAGE_BUCKET = config.storageBucket;

/**
 * Helper: Create audit log entry for service role operations
 * Implements security best practice of tracking privileged operations
 */
export async function auditServiceRoleOperation(
  operation: string,
  resourceType: string,
  resourceId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      operation,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
      performed_by: 'service_role',
      metadata: metadata || {},
      ip_address: null, // Set by trigger if available
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

// Log successful initialization
console.log('✅ Supabase backend client initialized successfully');
console.log(`   - Project URL: ${config.url}`);
console.log(`   - Storage Bucket: ${config.storageBucket}`);
console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
