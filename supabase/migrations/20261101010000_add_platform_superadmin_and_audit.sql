-- Migration: Add platform_role to users and create platform_audit_events table
-- Supports platform-wide Super Admin identity, authorization, and audit logging.

-- 1. Add platform_role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS platform_role TEXT NOT NULL DEFAULT 'user' 
CHECK (platform_role IN ('user', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role) WHERE platform_role = 'super_admin';

COMMENT ON COLUMN users.platform_role IS 'Platform-level role: "user" for normal tenant accounts, "super_admin" for SaaS platform administrators';

-- 2. Create platform_audit_events table
CREATE TABLE IF NOT EXISTS platform_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT NULL,
    target_id UUID DEFAULT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient filtering and timeline inspection
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_created_at 
    ON platform_audit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_events_actor 
    ON platform_audit_events(actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_events_target 
    ON platform_audit_events(target_type, target_id, created_at DESC);

-- Enable Row Level Security (RLS) matching server-only policy pattern
ALTER TABLE platform_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_platform_audit_events" ON platform_audit_events;
CREATE POLICY "service_role_all_platform_audit_events" ON platform_audit_events 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

COMMENT ON TABLE platform_audit_events IS 'Immutable ledger of privileged platform administration events executed by Super Admins';

