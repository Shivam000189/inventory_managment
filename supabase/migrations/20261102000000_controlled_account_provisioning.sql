-- Controlled platform account provisioning and account/business lifecycle state.
-- Existing accounts remain ordinary active users; this migration never promotes them.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_status_check') THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_status_check
      CHECK (status IN ('active', 'suspended', 'deactivated'));
  END IF;
END;
$$;

ALTER TABLE platform_audit_events
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM businesses GROUP BY owner_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one business per Business Admin: duplicate businesses.owner_id values exist';
  END IF;
  IF EXISTS (
    SELECT 1 FROM members WHERE account_id IS NOT NULL
    GROUP BY account_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one business membership per account: duplicate members.account_id values exist';
  END IF;
  IF EXISTS (
    SELECT 1 FROM users GROUP BY lower(email) HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce case-insensitive email uniqueness: duplicate user emails exist';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_one_per_owner
  ON businesses(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_one_business_per_account
  ON members(account_id) WHERE account_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_case_insensitive
  ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_status_business
  ON users(status, business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status
  ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_business
  ON platform_audit_events(business_id, created_at DESC);

COMMENT ON COLUMN businesses.status IS
  'active permits access; suspended is a temporary hold; deactivated is an administratively closed business. Both non-active states block all access.';
COMMENT ON COLUMN users.must_change_password IS
  'Forces replacement of an operator-generated temporary password before normal API use.';
