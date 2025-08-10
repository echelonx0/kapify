
// 7. PRODUCTION STARTUP SCRIPT
// backend/src/scripts/production-start.ts

import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { supabase } from '../config/supabase';
import { businessMetrics } from '@/services/metrics';
 

async function performStartupChecks() {
  logger.info('Starting production startup checks...');

  try {
    // Check database connection
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // Check Supabase connection
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    logger.info('✅ Supabase storage connection verified');

    // Verify required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SENDGRID_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }
    logger.info('✅ Environment variables verified');

    // Schedule daily metrics reset
    setInterval(() => {
      businessMetrics.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    logger.info('🚀 Production startup checks completed successfully');
  } catch (error) {
    logger.error('❌ Production startup checks failed', { error: error });
    process.exit(1);
  }
}

// Export for use in main server file
export { performStartupChecks };