-- Migration: Enable Row Level Security (RLS) on pharmacy tables
-- Resolves Supabase Data API unrestricted access warning for product_batches and prescriptions.

-- 1. Enable Row Level Security
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- 2. Create Service Role Policies (Allows Node.js API backend full secure access)
DROP POLICY IF EXISTS "service_role_all_product_batches" ON product_batches;
CREATE POLICY "service_role_all_product_batches" ON product_batches
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_prescriptions" ON prescriptions;
CREATE POLICY "service_role_all_prescriptions" ON prescriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Documentation comments
COMMENT ON TABLE product_batches IS 'Lot-wise inventory batches with expiry tracking. RLS enabled: accessed exclusively via backend service_role.';
COMMENT ON TABLE prescriptions IS 'Doctor prescription records and patient metadata. RLS enabled: accessed exclusively via backend service_role.';

