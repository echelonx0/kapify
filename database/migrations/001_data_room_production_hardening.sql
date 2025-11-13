-- ============================================
-- Data Room Production Hardening Migration
-- Version: 001
-- Date: 2025-01-13
-- ============================================

-- CRITICAL: Run these migrations in a transaction on production
BEGIN;

-- ============================================
-- 1. ADD UNIQUE CONSTRAINTS (Prevent race conditions)
-- ============================================

-- Prevent duplicate active shares for same user
-- Addresses: Race condition in share creation
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_room_shares_unique_active
ON data_room_shares(data_room_id, shared_with_user_id)
WHERE status = 'active';

COMMENT ON INDEX idx_data_room_shares_unique_active IS
'Prevents duplicate active shares for the same data room and user. Partial index on active shares only.';

-- Prevent duplicate pending access requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_unique_pending
ON data_room_access_requests(data_room_id, requester_id)
WHERE status = 'pending';

COMMENT ON INDEX idx_access_requests_unique_pending IS
'Prevents duplicate pending access requests from the same user.';

-- ============================================
-- 2. SHARE EXPIRATION ENFORCEMENT
-- ============================================

-- Function to automatically revoke expired shares
CREATE OR REPLACE FUNCTION auto_revoke_expired_shares()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if share has expired
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    NEW.revoked_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check expiration on select (read operations)
CREATE OR REPLACE FUNCTION check_share_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Update expired shares to 'expired' status
  UPDATE data_room_shares
  SET status = 'expired', revoked_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND status = 'active';

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available in your Supabase instance
-- SELECT cron.schedule(
--   'auto-revoke-expired-shares',
--   '*/5 * * * *', -- Every 5 minutes
--   $$
--     UPDATE data_room_shares
--     SET status = 'expired', revoked_at = NOW()
--     WHERE expires_at IS NOT NULL
--       AND expires_at <= NOW()
--       AND status = 'active'
--   $$
-- );

-- Alternative: Create a function to be called by application or edge function
CREATE OR REPLACE FUNCTION revoke_expired_shares()
RETURNS TABLE(revoked_count bigint) AS $$
  UPDATE data_room_shares
  SET status = 'expired', revoked_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND status = 'active'
  RETURNING count(*);
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 3. AUDIT LOGGING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  user_id uuid,
  performed_by text DEFAULT 'user',
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

COMMENT ON TABLE audit_logs IS
'Audit trail for sensitive operations, especially service role operations.';

-- ============================================
-- 4. PERFORMANCE INDEXES
-- ============================================

-- Index for checking active shares by user (optimization)
CREATE INDEX IF NOT EXISTS idx_data_room_shares_shared_with_active
ON data_room_shares(shared_with_user_id, status)
WHERE status = 'active';

-- Index for access log queries
CREATE INDEX IF NOT EXISTS idx_access_logs_data_room_created
ON data_room_access_logs(data_room_id, created_at DESC);

-- Index for document queries with filters
CREATE INDEX IF NOT EXISTS idx_data_room_documents_section_shareable
ON data_room_documents(data_room_id, section_id, is_shareable);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) ENHANCEMENTS
-- ============================================

-- Enable RLS on critical tables if not already enabled
ALTER TABLE data_room_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own shares (as owner or recipient)
DROP POLICY IF EXISTS select_own_shares ON data_room_shares;
CREATE POLICY select_own_shares ON data_room_shares
  FOR SELECT
  USING (
    shared_with_user_id = auth.uid()
    OR shared_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM data_rooms
      WHERE data_rooms.id = data_room_shares.data_room_id
      AND data_rooms.organization_id = auth.uid()
    )
  );

-- Policy: Only data room owners can create shares
DROP POLICY IF EXISTS insert_own_shares ON data_room_shares;
CREATE POLICY insert_own_shares ON data_room_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM data_rooms
      WHERE data_rooms.id = data_room_id
      AND data_rooms.organization_id = auth.uid()
    )
  );

-- Policy: Only share creators can update shares
DROP POLICY IF EXISTS update_own_shares ON data_room_shares;
CREATE POLICY update_own_shares ON data_room_shares
  FOR UPDATE
  USING (shared_by_user_id = auth.uid());

-- Audit logs: Only service role can write, users can read their own
DROP POLICY IF EXISTS insert_audit_logs ON audit_logs;
CREATE POLICY insert_audit_logs ON audit_logs
  FOR INSERT
  WITH CHECK (performed_by = 'service_role');

DROP POLICY IF EXISTS select_own_audit_logs ON audit_logs;
CREATE POLICY select_own_audit_logs ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 6. DATA INTEGRITY CONSTRAINTS
-- ============================================

-- Ensure share permission levels are valid
ALTER TABLE data_room_shares
ADD CONSTRAINT check_permission_level
CHECK (permission_level IN ('view', 'download', 'full'));

-- Ensure share status is valid
ALTER TABLE data_room_shares
ADD CONSTRAINT check_share_status
CHECK (status IN ('active', 'revoked', 'expired', 'pending'));

-- Ensure access request status is valid
ALTER TABLE data_room_access_requests
ADD CONSTRAINT check_request_status
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));

-- Ensure expires_at is in the future when set
ALTER TABLE data_room_shares
ADD CONSTRAINT check_expires_at_future
CHECK (expires_at IS NULL OR expires_at > created_at);

-- ============================================
-- 7. STORAGE BUCKET POLICIES (Supabase specific)
-- ============================================

-- Note: These need to be run in Supabase dashboard or via Supabase CLI
-- Storage policy to allow authenticated users to upload to their own folders

-- CREATE POLICY "Users can upload to own folder" ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'platform-documents'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- CREATE POLICY "Users can read own documents" ON storage.objects
--   FOR SELECT
--   USING (
--     bucket_id = 'platform-documents'
--     AND (
--       (storage.foldername(name))[1] = auth.uid()::text
--       OR EXISTS (
--         SELECT 1 FROM data_room_shares drs
--         JOIN data_room_documents drd ON drd.data_room_id = drs.data_room_id
--         WHERE drs.shared_with_user_id = auth.uid()
--         AND drs.status = 'active'
--       )
--     )
--   );

-- ============================================
-- 8. HELPER FUNCTIONS FOR MONITORING
-- ============================================

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  total_files bigint,
  total_size_bytes bigint,
  average_file_size_bytes numeric
) AS $$
SELECT
  COUNT(*)::bigint as total_files,
  COALESCE(SUM(file_size), 0)::bigint as total_size_bytes,
  COALESCE(AVG(file_size), 0)::numeric as average_file_size_bytes
FROM documents;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get share statistics
CREATE OR REPLACE FUNCTION get_share_stats(p_data_room_id uuid)
RETURNS TABLE (
  active_shares bigint,
  expired_shares bigint,
  revoked_shares bigint,
  total_access_count bigint,
  total_download_count bigint
) AS $$
SELECT
  COUNT(*) FILTER (WHERE status = 'active')::bigint as active_shares,
  COUNT(*) FILTER (WHERE status = 'expired')::bigint as expired_shares,
  COUNT(*) FILTER (WHERE status = 'revoked')::bigint as revoked_shares,
  COALESCE(SUM(access_count), 0)::bigint as total_access_count,
  COALESCE(SUM(download_count), 0)::bigint as total_download_count
FROM data_room_shares
WHERE data_room_id = p_data_room_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these after migration to verify
-- SELECT * FROM pg_indexes WHERE tablename LIKE 'data_room%';
-- SELECT conname, contype FROM pg_constraint WHERE conrelid::regclass::text LIKE 'data_room%';

COMMIT;

-- ============================================
-- POST-MIGRATION TASKS
-- ============================================

-- 1. Run ANALYZE to update query planner statistics
ANALYZE data_room_shares;
ANALYZE data_room_documents;
ANALYZE data_room_access_logs;
ANALYZE data_room_access_requests;

-- 2. Revoke any existing expired shares
SELECT revoke_expired_shares();

COMMENT ON MIGRATION IS '
Production Hardening Migration for Data Room Feature

Changes:
- Added unique constraints to prevent race conditions
- Implemented share expiration enforcement
- Added audit logging infrastructure
- Created performance indexes
- Enhanced Row Level Security policies
- Added data integrity constraints
- Created monitoring helper functions

Critical: This migration should be tested on staging before production deployment.
';
