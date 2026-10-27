-- ============================================================================
-- Supabase / PostgreSQL Schema for Inventory Management System (Stockroom / IMB)
-- Designed for seamless migration and merge from MongoDB to Supabase.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. CORE MULTI-TENANT TABLES
-- ----------------------------------------------------------------------------

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'team')),
    business_id UUID,
    onboarding JSONB DEFAULT NULL,
    token_version INT NOT NULL DEFAULT 0,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lock_until TIMESTAMPTZ DEFAULT NULL,
    reset_password_token_hash TEXT DEFAULT NULL,
    reset_password_expires TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    business_type TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    country TEXT DEFAULT 'India',
    currency TEXT DEFAULT 'INR',
    gstin TEXT DEFAULT '',
    enabled_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "lowStockLimit": 10,
        "allowNegativeStock": false,
        "defaultPaymentMethod": "Cash",
        "taxEnabled": true,
        "invoicePrefix": "INV",
        "defaultGstRate": 5,
        "upiId": "",
        "allowPriceOverride": false,
        "loyaltySpendPerPoint": 100,
        "loyaltyPointValue": 1,
        "disabledModules": [],
        "paymentOffers": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint from users back to businesses
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS fk_users_business,
    ADD CONSTRAINT fk_users_business 
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_business_role_id UNIQUE (business_id, role_id)
);

-- TEAM MEMBERS (Distinct from accounts)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    account_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role_id TEXT NOT NULL DEFAULT 'ROLE-STAFF',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_members_business_email UNIQUE (business_id, email)
);

-- SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    tax_number TEXT DEFAULT '',
    payment_terms TEXT NOT NULL DEFAULT 'Due on receipt',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_suppliers_business_normalized_name UNIQUE (business_id, normalized_name)
);

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    customer_type TEXT NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'dealer', 'contractor')),
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_terms TEXT NOT NULL DEFAULT 'Due on receipt',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    total_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
    outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    loyalty_points NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS & INVENTORY
-- ----------------------------------------------------------------------------

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT DEFAULT '',
    generic_name TEXT DEFAULT '',
    manufacturer TEXT DEFAULT '',
    batch_number TEXT DEFAULT '',
    manufacturing_date TIMESTAMPTZ DEFAULT NULL,
    expiry_date TIMESTAMPTZ DEFAULT NULL,
    mrp NUMERIC(15, 2) NOT NULL DEFAULT 0,
    model TEXT DEFAULT '',
    serial_number TEXT DEFAULT '',
    imei TEXT DEFAULT '',
    warranty_months INT NOT NULL DEFAULT 0,
    size TEXT DEFAULT '',
    dimensions TEXT DEFAULT '',
    material TEXT DEFAULT '',
    color TEXT DEFAULT '',
    weight NUMERIC(15, 3) NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) NOT NULL,
    wholesale_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wholesale_min_quantity NUMERIC(15, 2) NOT NULL DEFAULT 10,
    dealer_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    barcode TEXT DEFAULT '',
    hsn_code TEXT DEFAULT '',
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    current_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    non_sellable_stock JSONB NOT NULL DEFAULT '{"damaged": 0, "defective": 0, "openedUsed": 0, "other": 0}'::jsonb,
    minimum_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(15, 3) NOT NULL DEFAULT 0,
    warehouse TEXT DEFAULT '',
    rack_location TEXT DEFAULT '',
    conversion_factor NUMERIC(15, 2) NOT NULL DEFAULT 1,
    purchase_unit TEXT DEFAULT '',
    unit TEXT NOT NULL DEFAULT 'piece',
    supplier TEXT DEFAULT '',
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_business_sku UNIQUE (business_id, sku)
);

-- PARTIAL UNIQUE INDEX FOR PRODUCT BARCODE (Only when barcode is not empty)
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_business_barcode 
ON products (business_id, barcode) 
WHERE barcode IS NOT NULL AND barcode <> '';

-- PRODUCT VARIANTS TABLE (Relational normalization for variant matrix)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT DEFAULT '',
    selling_price NUMERIC(15, 2) DEFAULT NULL,
    purchase_price NUMERIC(15, 2) DEFAULT NULL,
    current_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    non_sellable_stock JSONB NOT NULL DEFAULT '{"damaged": 0, "defective": 0, "openedUsed": 0, "other": 0}'::jsonb,
    minimum_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    reorder_point NUMERIC(15, 3) NOT NULL DEFAULT 0,
    target_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    reorder_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
    preferred_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    replenishment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    rfid_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rfid_identifier TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_variants_business_sku UNIQUE (business_id, sku)
);

-- COLORS TABLE
CREATE TABLE IF NOT EXISTS colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    hex_code TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_colors_business_normalized_name UNIQUE (business_id, normalized_name)
);

-- ----------------------------------------------------------------------------
-- 5. RETAIL & PROMOTIONS (Clothing, Discounts, Loyalty, Shift)
-- ----------------------------------------------------------------------------

-- PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'product', 'category', 'variant', 'seasonal', 'buy_x_get_y', 'bulk')),
    discount_value NUMERIC(15, 2) NOT NULL,
    minimum_quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    buy_quantity NUMERIC(15, 2) NOT NULL DEFAULT 1,
    get_quantity NUMERIC(15, 2) NOT NULL DEFAULT 0,
    product_ids UUID[] DEFAULT ARRAY[]::UUID[],
    category_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    variant_ids UUID[] DEFAULT ARRAY[]::UUID[],
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INT NOT NULL DEFAULT 0,
    discount_granted NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_promotions_business_name UNIQUE (business_id, name)
);

-- COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(15, 2) NOT NULL,
    minimum_order_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    maximum_discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NULL,
    valid_until TIMESTAMPTZ DEFAULT NULL,
    total_usage_limit INT NOT NULL DEFAULT 0,
    per_customer_usage_limit INT NOT NULL DEFAULT 0,
    product_ids UUID[] DEFAULT ARRAY[]::UUID[],
    category_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    variant_ids UUID[] DEFAULT ARRAY[]::UUID[],
    active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INT NOT NULL DEFAULT 0,
    usages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupons_business_code UNIQUE (business_id, code)
);

-- GIFT CARDS TABLE
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    initial_value NUMERIC(15, 2) NOT NULL,
    current_balance NUMERIC(15, 2) NOT NULL,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ DEFAULT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT '',
    transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gift_cards_business_code UNIQUE (business_id, code)
);

-- LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID DEFAULT NULL,
    type TEXT NOT NULL CHECK (type IN ('Earn', 'Redeem', 'Adjustment')),
    points NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    processed_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STORE CREDIT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS store_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID DEFAULT NULL,
    refund_id UUID DEFAULT NULL,
    type TEXT NOT NULL CHECK (type IN ('Credit', 'Redeem', 'Adjustment')),
    amount NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    processed_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CASHIER SHIFTS TABLE
CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cashier_name TEXT DEFAULT '',
    opening_cash NUMERIC(15, 2) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ DEFAULT NULL,
    actual_closing_cash NUMERIC(15, 2) DEFAULT NULL,
    expected_closing_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    difference NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cash_in NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cash_out NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    closed_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. ORDERS, PURCHASES, RECEIVINGS & PAYMENTS
-- ----------------------------------------------------------------------------

-- SALES ORDERS TABLE
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    invoice_number TEXT DEFAULT '',
    channel TEXT NOT NULL DEFAULT 'Order' CHECK (channel IN ('Order', 'POS')),
    billing_type TEXT NOT NULL DEFAULT 'retail' CHECK (billing_type IN ('retail', 'wholesale')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT '',
    customer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sgst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    igst NUMERIC(15, 2) NOT NULL DEFAULT 0,
    offer_discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    promotion_name TEXT DEFAULT '',
    coupon_code TEXT DEFAULT '',
    round_off NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid')),
    notes TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name TEXT DEFAULT '',
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    cancelled_at TIMESTAMPTZ DEFAULT NULL,
    refunded_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    returned_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    return_adjustment_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX FOR INVOICE NUMBER
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_orders_invoice 
ON sales_orders (business_id, invoice_number) 
WHERE invoice_number IS NOT NULL AND invoice_number <> '';

-- PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    shipping_charges NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid')),
    expected_delivery_date TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RECEIVINGS TABLE
CREATE TABLE IF NOT EXISTS receivings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    received_by TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RETURNS TABLE
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    order_id UUID NOT NULL,
    order_model TEXT NOT NULL CHECK (order_model IN ('SalesOrder', 'PurchaseOrder')),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID DEFAULT NULL,
    variant_sku TEXT DEFAULT '',
    variant_size TEXT DEFAULT '',
    variant_color TEXT DEFAULT '',
    product_name TEXT DEFAULT '',
    product_sku TEXT DEFAULT '',
    product_variant TEXT DEFAULT '',
    order_number TEXT DEFAULT '',
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT '',
    quantity NUMERIC(15, 3) NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Other',
    reason_details TEXT DEFAULT '',
    condition TEXT NOT NULL DEFAULT 'Sellable',
    sold_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
    unit_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    line_discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    line_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    return_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    outstanding_before NUMERIC(15, 2) NOT NULL DEFAULT 0,
    outstanding_adjustment NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_required NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_refund NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_method TEXT DEFAULT '',
    refund_status TEXT NOT NULL DEFAULT 'Not Required' CHECK (refund_status IN ('Not Required', 'Pending', 'Partially Refunded', 'Refunded', 'Failed', 'Cancelled')),
    inventory_action TEXT NOT NULL DEFAULT 'sellable' CHECK (inventory_action IN ('sellable', 'damaged', 'defective', 'openedUsed', 'other')),
    status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    processed_by TEXT DEFAULT '',
    completed_at TIMESTAMPTZ DEFAULT NULL,
    cancelled_at TIMESTAMPTZ DEFAULT NULL,
    idempotency_key TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX FOR RETURN IDEMPOTENCY KEY
CREATE UNIQUE INDEX IF NOT EXISTS uq_returns_idempotency 
ON returns (business_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- REFUNDS TABLE
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT '',
    amount NUMERIC(15, 2) NOT NULL,
    method TEXT NOT NULL,
    resolved_method TEXT DEFAULT '',
    allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Refunded', 'Failed', 'Cancelled')),
    transaction_reference TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    processed_by TEXT DEFAULT '',
    processed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    reference_id UUID NOT NULL,
    reference_model TEXT NOT NULL CHECK (reference_model IN ('SalesOrder', 'PurchaseOrder')),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    payment_date TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    recorded_by TEXT DEFAULT '',
    transaction_reference TEXT DEFAULT '',
    offer_code TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STOCK TRANSACTIONS (Audit ledger)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID DEFAULT NULL,
    variant_sku TEXT DEFAULT '',
    variant_size TEXT DEFAULT '',
    variant_color TEXT DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'purchase_return', 'sales_return', 'non_sellable_return')),
    quantity NUMERIC(15, 3) NOT NULL,
    previous_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    new_stock NUMERIC(15, 3) NOT NULL DEFAULT 0,
    stock_bucket TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    reference_id TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('inventory', 'purchases', 'sales', 'payments', 'suppliers', 'returns', 'users', 'system')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity TEXT DEFAULT '',
    related_entity_id TEXT DEFAULT '',
    navigation_target TEXT NOT NULL,
    dedupe_key TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NULL,
    dismissed_at TIMESTAMPTZ DEFAULT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notifications_dedupe UNIQUE (business_id, recipient_id, dedupe_key)
);

-- PRODUCT IMPORTS TABLE
CREATE TABLE IF NOT EXISTS product_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'csv', 'xlsx')),
    purchase_reference TEXT DEFAULT '',
    variant_mode BOOLEAN NOT NULL DEFAULT FALSE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT DEFAULT '',
    imported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    imported_by_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
    total_rows INT NOT NULL DEFAULT 0,
    created_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    merged_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    failures JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_business ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_roles_business ON roles(business_id);
CREATE INDEX IF NOT EXISTS idx_members_business ON members(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_business ON product_variants(business_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_business ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_business ON coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_business ON gift_cards(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_business ON loyalty_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_business ON store_credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON cashier_shifts(business_id, cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_business ON sales_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_channel ON sales_orders(business_id, channel);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(business_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_business ON purchase_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(business_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_receivings_business ON receivings(business_id);
CREATE INDEX IF NOT EXISTS idx_receivings_po ON receivings(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_returns_business ON returns(business_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_business ON refunds(business_id);
CREATE INDEX IF NOT EXISTS idx_refunds_return ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_business ON stock_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_product ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(business_id, recipient_id, dismissed_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_imports_business ON product_imports(business_id);

-- ----------------------------------------------------------------------------
-- 8. AUTOMATIC UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_update_updated_at_%1$I ON %1$I;
            CREATE TRIGGER trg_update_updated_at_%1$I
            BEFORE UPDATE ON %1$I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', tbl);
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. SUPABASE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Enable RLS on all public tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivings ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_imports ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (allows backend node server to query anything securely)
-- If querying directly with authenticated user client, these policies scope to business_id:
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        -- Full access for service_role (Node.js API backend)
        EXECUTE format('
            DROP POLICY IF EXISTS "service_role_all_%1$I" ON %1$I;
            CREATE POLICY "service_role_all_%1$I" ON %1$I 
            FOR ALL 
            TO service_role 
            USING (true) 
            WITH CHECK (true);
        ', tbl);
    END LOOP;
END;
$$;

-- ============================================================================
-- Schema initialization complete!
-- ============================================================================
