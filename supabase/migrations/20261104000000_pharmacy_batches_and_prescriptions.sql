-- Migration: Add product_batches and prescriptions tables for Pharmacy management
-- Supports lot-wise tracking, expiry dates, MRP, and doctor prescription records.

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    manufacturing_date TIMESTAMPTZ DEFAULT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    mrp NUMERIC(15, 2) NOT NULL DEFAULT 0,
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_batches_batch UNIQUE (business_id, product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches(business_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(business_id, product_id);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    prescription_number TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_reg_number TEXT DEFAULT '',
    hospital_name TEXT DEFAULT '',
    patient_name TEXT NOT NULL,
    patient_phone TEXT DEFAULT '',
    patient_age INT DEFAULT NULL,
    patient_gender TEXT DEFAULT '',
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Dispensed', 'Expired', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_business ON prescriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(business_id, patient_phone);

DROP TRIGGER IF EXISTS update_product_batches_updated_at ON product_batches;
CREATE TRIGGER update_product_batches_updated_at
    BEFORE UPDATE ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

