# Automated Backup System - Technical Documentation

**Version:** 1.0  
**Last Updated:** January 24, 2026  
**Status:** Production Ready  

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Database Schema](#database-schema)
5. [Edge Function Implementation](#edge-function-implementation)
6. [Cron Job Configuration](#cron-job-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Disaster Recovery Procedures](#disaster-recovery-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance & Updates](#maintenance--updates)

---

## 📊 System Overview

### Purpose
Automated daily backup system that:
- Backs up all user and platform data tables
- Stores backups in Supabase Storage with 30-day retention
- Sends email notifications after each backup
- Provides manual backup trigger capability
- Enables point-in-time recovery

### Key Components
1. **Supabase Edge Function** (`daily-backup`) - Performs backup operations
2. **pg_cron Extension** - Schedules daily executions
3. **Supabase Storage** - Stores backup files
4. **Resend API** - Sends email notifications
5. **Admin Dashboard Component** - User interface for monitoring

### Technology Stack
- **Runtime:** Deno (Supabase Edge Functions)
- **Database:** PostgreSQL with pg_cron extension
- **Storage:** Supabase Storage (S3-compatible)
- **Email:** Resend API
- **Scheduling:** pg_cron (cron-style scheduling)

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────────┐
│   pg_cron       │  Triggers daily at 02:00 SAST
│  (Scheduler)    │
└────────┬────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────┐
│  Edge Function  │  
│  daily-backup   │  
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Supabase   │
│   Database   │  │   Storage    │
└──────┬───────┘  └──────────────┘
       │
       │ JSON exports
       │
       ▼
┌──────────────┐
│ Resend API   │  Sends email notification
│   (Email)    │  to admin@kapify.africa
└──────────────┘
```

### File Structure

```
project-root/
├── supabase/
│   └── functions/
│       └── daily-backup/
│           └── index.ts          # Edge function code
├── src/
│   └── app/
│       └── admin/
│           └── backup-management/
│               ├── backup-management.component.ts
│               └── backup-management.component.html
├── sql/
│   ├── 01_pre_cleanup_backup.sql
│   ├── 02_safe_deletion_script.sql
│   ├── 03_post_deletion_validation.sql
│   └── 04_automated_backup_setup.sql
└── docs/
    ├── 05_disaster_recovery_playbook.md
    └── BACKUP_TECHNICAL_DOCS.md (this file)
```

---

## ⚙️ Setup & Configuration

### Prerequisites

1. **Supabase Project**
   - Project Reference ID: `hsilpedhzelahseceats`
   - PostgreSQL 15+ with pg_cron extension
   - Supabase Storage bucket: `platform-backups`

2. **Resend Account**
   - API Key configured in Supabase Secrets
   - Verified sender domain

3. **Supabase CLI** (for deployment)
   ```bash
   npm install -g supabase
   ```

### Step 1: Enable Required Extensions

```sql
-- Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### Step 2: Create Storage Bucket

```sql
-- Via SQL or Supabase Dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-backups', 'platform-backups', true);
```

### Step 3: Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref hsilpedhzelahseceats

# Deploy function
supabase functions deploy daily-backup

# Set environment variables
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Step 4: Configure Cron Job

```sql
-- Schedule daily backup at 02:00 SAST (23:00 UTC previous day)
SELECT cron.schedule(
    'daily-platform-backup',
    '0 23 * * *',
    $$
    SELECT http_post(
        'https://hsilpedhzelahseceats.supabase.co/functions/v1/daily-backup',
        '{"scheduled":true}',
        'application/json'
    );
    $$
);
```

### Step 5: Verify Configuration

```sql
-- Check cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-platform-backup';

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'platform-backups';

-- Test edge function
SELECT http_post(
    'https://hsilpedhzelahseceats.supabase.co/functions/v1/daily-backup',
    '{"test":true}',
    'application/json'
);
```

---

## 🗄️ Database Schema

### Tables Backed Up

| Table Name | Record Type | Approx Size | Critical Data |
|------------|-------------|-------------|---------------|
| `auth.users` | User accounts | 1KB/user | ✅ Yes |
| `users` | User profiles | 2KB/user | ✅ Yes |
| `user_profiles` | Extended profiles | 5KB/user | ✅ Yes |
| `organizations` | Organizations | 3KB/org | ✅ Yes |
| `organization_users` | Memberships | 500B/record | ✅ Yes |
| `applications` | Funding apps | 10KB/app | ✅ Yes |
| `opportunities` | Funding opps | 5KB/opp | ✅ Yes |
| `documents` | Document metadata | 1KB/doc | ✅ Yes |
| `message_threads` | Thread headers | 1KB/thread | ⚠️ Medium |
| `messages` | Messages | 2KB/msg | ⚠️ Medium |
| `activities` | Activity logs | 500B/activity | ❌ No |

### Backup Format

Each backup creates:
```
platform-backups/
└── backups/
    └── 2026-01-24T02-00-15/
        ├── manifest.json          # Backup metadata
        ├── auth_users.json        # All tables as JSON
        ├── users.json
        ├── user_profiles.json
        ├── organizations.json
        ├── organization_users.json
        ├── applications.json
        ├── opportunities.json
        ├── documents.json
        ├── message_threads.json
        ├── messages.json
        └── activities.json
```

### Manifest Schema

```typescript
interface BackupManifest {
  timestamp: string;          // ISO 8601
  backupFolder: string;       // Folder path
  totalTables: number;        // Number of tables
  successCount: number;       // Successful backups
  failureCount: number;       // Failed backups
  duration: number;           // Milliseconds
  tables: Array<{
    name: string;
    status: 'fulfilled' | 'rejected';
    recordCount: number;
    error: string | null;
  }>;
}
```

---

## 🔧 Edge Function Implementation

### Function Location
`supabase/functions/daily-backup/index.ts`

### Key Features

1. **Parallel Table Exports** - Uses `Promise.allSettled()` for concurrent exports
2. **Error Resilience** - Continues even if individual tables fail
3. **Storage Upload** - Automatically uploads to Supabase Storage
4. **Email Notifications** - Sends summary via Resend
5. **30-Day Cleanup** - Automatically deletes old backups

### Environment Variables

```typescript
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
```

### Request/Response Format

**Request:**
```typescript
POST /functions/v1/daily-backup
Content-Type: application/json

{
  "manual": true,        // Optional: marks as manual trigger
  "scheduled": true,     // Optional: marks as scheduled run
  "test": true          // Optional: test mode
}
```

**Success Response:**
```typescript
{
  "success": true,
  "message": "Backup completed successfully",
  "summary": {
    "timestamp": "2026-01-24T02:00:15.000Z",
    "backupFolder": "backups/2026-01-24T02-00-15",
    "totalTables": 11,
    "successCount": 11,
    "failureCount": 0,
    "duration": 970,
    "tables": [...]
  }
}
```

**Error Response:**
```typescript
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Performance Metrics

- **Typical Duration:** 0.5-2 seconds (depends on data size)
- **Memory Usage:** ~50MB peak
- **Network Transfer:** ~1MB per 100 records
- **Concurrent Requests:** Supports parallel table exports

---

## ⏰ Cron Job Configuration

### Schedule Format

```
0 23 * * *
│ │  │ │ │
│ │  │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │  │ └───── Month (1-12)
│ │  └─────── Day of month (1-31)
│ └────────── Hour (0-23)
└──────────── Minute (0-59)
```

### Current Schedule
- **Time:** 02:00 SAST (11:00 PM UTC previous day)
- **Frequency:** Daily
- **Execution:** Via HTTP POST to edge function

### Management Commands

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View execution history
SELECT 
    start_time AT TIME ZONE 'Africa/Johannesburg' as sast_time,
    status,
    return_message,
    end_time - start_time as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-platform-backup')
ORDER BY start_time DESC
LIMIT 10;

-- Disable cron job (emergency stop)
UPDATE cron.job 
SET active = false 
WHERE jobname = 'daily-platform-backup';

-- Re-enable cron job
UPDATE cron.job 
SET active = true 
WHERE jobname = 'daily-platform-backup';

-- Delete cron job
SELECT cron.unschedule('daily-platform-backup');
```

---

## 📊 Monitoring & Logging

### Edge Function Logs

**Access via Supabase Dashboard:**
1. Navigate to Edge Functions → daily-backup
2. Click "Logs" tab
3. Filter by time range

**Log Levels:**
- `INFO`: Normal operation messages
- `WARN`: Non-critical issues (e.g., empty table)
- `ERROR`: Failures (e.g., upload failed)

### Cron Job Monitoring

```sql
-- Check recent executions
SELECT 
    jobid,
    runid,
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-platform-backup')
ORDER BY start_time DESC
LIMIT 5;

-- Check for failures
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-platform-backup')
  AND status = 'failed'
ORDER BY start_time DESC;
```

### Email Notifications

**Expected Email Format:**
- **Subject:** `✅ Daily Backup Successful` or `🚨 Daily Backup Failed`
- **From:** `Kapify Backup System <backups@kapify.africa>`
- **To:** `admin@kapify.africa`
- **Frequency:** After each backup (daily + manual triggers)

**Email Content:**
- Backup timestamp
- Duration
- Table count (success/failure)
- Record counts per table
- Next scheduled backup

### Storage Monitoring

```sql
-- Check storage usage
SELECT 
    SUM(metadata->>'size')::bigint as total_bytes,
    COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id = 'platform-backups';

-- List recent backups
SELECT 
    name,
    created_at,
    (metadata->>'size')::bigint as size_bytes
FROM storage.objects
WHERE bucket_id = 'platform-backups'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 Disaster Recovery Procedures

### Scenario 1: Accidental Data Deletion

**Recovery Steps:**

1. **Identify Affected Data**
   ```sql
   -- Check what's missing
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM organizations;
   ```

2. **Find Appropriate Backup**
   - Go to Supabase Storage → platform-backups
   - Identify backup from before deletion
   - Download required JSON files

3. **Restore Data**
   ```sql
   -- Example: Restore users table
   INSERT INTO users (id, first_name, last_name, email, ...)
   SELECT * FROM json_populate_recordset(
       NULL::users,
       '[...JSON content from backup...]'::json
   )
   ON CONFLICT (id) DO NOTHING;
   ```

4. **Verify Restoration**
   ```sql
   -- Validate record counts
   SELECT COUNT(*) FROM users;
   
   -- Check foreign key integrity
   SELECT COUNT(*) FROM organization_users ou
   LEFT JOIN users u ON u.id = ou.user_id
   WHERE u.id IS NULL;
   ```

### Scenario 2: Database Corruption

**Recovery Steps:**

1. **Use Supabase Point-in-Time Recovery (PITR)**
   - Supabase Dashboard → Database → Backups
   - Choose restore point (available for 7 days)
   - Create new project or restore in place

2. **Alternative: JSON Restore**
   - Download all JSON files from latest backup
   - Run restoration scripts table by table
   - Rebuild indexes and constraints

### Scenario 3: Full Database Restore

**See:** `docs/05_disaster_recovery_playbook.md` for detailed procedures

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Edge Function Not Triggered

**Symptoms:**
- No backup created at scheduled time
- No email received

**Diagnosis:**
```sql
-- Check if cron job ran
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-platform-backup')
ORDER BY start_time DESC LIMIT 1;

-- Check cron job configuration
SELECT * FROM cron.job WHERE jobname = 'daily-platform-backup';
```

**Solutions:**
- Verify cron job is active: `UPDATE cron.job SET active = true WHERE jobname = 'daily-platform-backup'`
- Check HTTP extension: `CREATE EXTENSION IF NOT EXISTS http;`
- Validate edge function URL
- Review edge function logs for errors

#### 2. Backup Files Not Created

**Symptoms:**
- Edge function runs but no files in Storage
- Success message but empty bucket

**Diagnosis:**
```typescript
// Check edge function logs for storage errors
// Look for: "Failed to upload to storage"
```

**Solutions:**
- Verify storage bucket exists
- Check service role key has storage permissions
- Ensure bucket is not at capacity
- Validate file paths in edge function code

#### 3. Email Not Received

**Symptoms:**
- Backup succeeds but no email notification

**Diagnosis:**
```bash
# Check Resend API key is set
supabase secrets list | grep RESEND_API_KEY
```

**Solutions:**
- Verify Resend API key: `supabase secrets set RESEND_API_KEY=...`
- Check domain verification in Resend dashboard
- Review edge function logs for email errors
- Test email delivery with manual backup

#### 4. Out of Storage Space

**Symptoms:**
- Upload failures
- "Storage quota exceeded" errors

**Solutions:**
```sql
-- Check current storage usage
SELECT 
    SUM((metadata->>'size')::bigint) / 1024 / 1024 as mb_used
FROM storage.objects
WHERE bucket_id = 'platform-backups';

-- Manually clean old backups
DELETE FROM storage.objects
WHERE bucket_id = 'platform-backups'
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

**Weekly:**
- [ ] Verify backup email received
- [ ] Check cron job execution logs
- [ ] Review edge function error logs

**Monthly:**
- [ ] Download and verify one backup file
- [ ] Check storage usage trends
- [ ] Review backup duration metrics
- [ ] Test manual backup trigger

**Quarterly:**
- [ ] Perform full disaster recovery drill
- [ ] Update disaster recovery playbook
- [ ] Review backup retention policy
- [ ] Train team on recovery procedures

### Updating Edge Function

```bash
# 1. Make changes to supabase/functions/daily-backup/index.ts

# 2. Test locally (if needed)
supabase functions serve daily-backup

# 3. Deploy update
supabase functions deploy daily-backup

# 4. Test manually
curl -X POST https://hsilpedhzelahseceats.supabase.co/functions/v1/daily-backup \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 5. Monitor logs for issues
```

### Changing Backup Schedule

```sql
-- Update cron schedule (example: change to 03:00 SAST)
SELECT cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'daily-platform-backup'),
    schedule := '0 0 * * *'  -- 00:00 UTC = 02:00 SAST
);
```

### Adding New Tables to Backup

1. **Update Edge Function:**
   ```typescript
   // Add new table to TABLES_TO_BACKUP array
   const TABLES_TO_BACKUP = [
     'auth_users',
     'users',
     // ... existing tables
     'new_table_name',  // Add here
   ];
   ```

2. **Deploy Update:**
   ```bash
   supabase functions deploy daily-backup
   ```

3. **Test:**
   ```bash
   curl -X POST https://hsilpedhzelahseceats.supabase.co/functions/v1/daily-backup \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

---

## 📞 Support & Contacts

### Emergency Contacts

- **Platform Admin:** admin@kapify.africa
- **DevOps Lead:** [Your DevOps Lead]
- **Supabase Support:** https://supabase.com/support

### Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/hsilpedhzelahseceats
- **Edge Function Logs:** https://supabase.com/dashboard/project/hsilpedhzelahseceats/functions/daily-backup/logs
- **Storage Bucket:** https://supabase.com/dashboard/project/hsilpedhzelahseceats/storage/buckets/platform-backups
- **Resend Dashboard:** https://resend.com/emails

### Documentation References

- [Disaster Recovery Playbook](./05_disaster_recovery_playbook.md)
- [Backup Management UI](../src/app/admin/backup-management/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---

## 📝 Changelog

### Version 1.0 (January 24, 2026)
- ✅ Initial production deployment
- ✅ Daily automated backups at 02:00 SAST
- ✅ 30-day retention with auto-cleanup
- ✅ Email notifications via Resend
- ✅ Manual backup trigger capability
- ✅ Admin dashboard integration

---

**Last Updated:** January 24, 2026  
**Maintained By:** Kapify Development Team  
**Review Cycle:** Quarterly
