-- Migration: Add inventory metadata columns to stock_transactions table
-- Ensures batch, expiry, location, and unit cost remain associated with each stock movement.

ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS batch_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS warehouse TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS rack_location TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(15, 2) DEFAULT NULL;

COMMENT ON COLUMN stock_transactions.batch_number IS 'Batch or lot identifier associated with this stock movement';
COMMENT ON COLUMN stock_transactions.expiry_date IS 'Expiration timestamp for the batch associated with this movement';
COMMENT ON COLUMN stock_transactions.warehouse IS 'Warehouse name or facility where movement occurred';
COMMENT ON COLUMN stock_transactions.rack_location IS 'Specific aisle, shelf, or rack location';
COMMENT ON COLUMN stock_transactions.unit_cost IS 'Unit acquisition/purchase cost at the time of movement';

