-- ============================================================================
-- AMANAHQ V2.0 — CLEAN PRODUCTION / FRESH START BOOTSTRAP (NO DUMMY TRANSACTIONS)
-- ============================================================================

DELETE FROM tenants;
DELETE FROM branches;
DELETE FROM employees;
DELETE FROM permission_overrides;
DELETE FROM audit_logs;
DELETE FROM provision_products;
DELETE FROM provision_movements;
DELETE FROM provision_customers;
DELETE FROM provision_sales;
DELETE FROM provision_sale_items;
DELETE FROM provision_returns;
DELETE FROM provision_drawer_sessions;
DELETE FROM provision_purchases;
DELETE FROM provision_ledger;
DELETE FROM provision_expenses;
DELETE FROM provision_expiry_batches;
DELETE FROM banking_settings;
DELETE FROM banking_providers;
DELETE FROM banking_float;
DELETE FROM banking_day_close;
DELETE FROM banking_transactions;
DELETE FROM banking_expenses;
DELETE FROM laundry_settings;
DELETE FROM laundry_customers;
DELETE FROM laundry_orders;
DELETE FROM laundry_order_items;
DELETE FROM laundry_payments;
DELETE FROM laundry_expenses;

-- 1. Anchor Tenant
INSERT INTO tenants (
    id, slug, shop_name, tagline, phone, address, currency_symbol, receipt_footer,
    invoice_prefix, receipt_prefix, low_stock_default, enabled_modules, master_recovery_key, subscription_status, subscription_expires_at
) VALUES
    ('TENANT-001', 'al-ameen', 'Al Ameen Business System', 'Quality goods & trusted services', '', '', '₦', 'Thank you for your patronage!', 'INV-', 'RCP-', 5, '["provision","banking","laundry"]', 'AMANA-2026-HQ99', 'Active', NULL);

-- 2. Branches
INSERT INTO branches (id, tenant_id, name, business_type, status) VALUES
                                                                      ('BR001', 'TENANT-001', 'Provision Store', 'Provision', 'Active'),
                                                                      ('BR002', 'TENANT-001', 'POS Agent Banking', 'Banking', 'Active'),
                                                                      ('BR003', 'TENANT-001', 'Laundry Service', 'Laundry', 'Active');

-- 3. Founder SuperAdmin (KAREM / 0000) & Initial Shop Owner (OWN001 / 0000)
INSERT INTO employees (id, tenant_id, code, name, role, phone, pin_hash, branch_id, status) VALUES
                                                                                                ('EMP-SUPER-001', 'TENANT-001', 'KAREM', 'Abdulkarem (Founder)', 'SuperAdmin', '', '0000', 'ALL', 'Active'),
                                                                                                ('EMP-OWNER-001', 'TENANT-001', 'OWN001', 'Al Ameen (Owner)', 'Owner', '', '0000', 'ALL', 'Active');

-- 4. Starter Banking Settings & Providers (So dropdowns are ready on Day 1)
INSERT INTO banking_settings (id, branch_id, transaction_type, default_charge) VALUES
                                                                                   ('BSET-1', 'BR002', 'Deposit', 100),
                                                                                   ('BSET-2', 'BR002', 'Withdrawal', 100),
                                                                                   ('BSET-3', 'BR002', 'Transfer', 50),
                                                                                   ('BSET-4', 'BR002', 'Airtime', 0),
                                                                                   ('BSET-5', 'BR002', 'Data', 0),
                                                                                   ('BSET-6', 'BR002', 'Bill Payment', 100);

INSERT INTO banking_providers (id, branch_id, provider_name) VALUES
                                                                 ('BPRV-1', 'BR002', 'Opay'),
                                                                 ('BPRV-2', 'BR002', 'Moniepoint'),
                                                                 ('BPRV-3', 'BR002', 'PalmPay'),
                                                                 ('BPRV-4', 'BR002', 'FirstMonie'),
                                                                 ('BPRV-5', 'BR002', 'Baxi'),
                                                                 ('BPRV-6', 'BR002', 'Others');

-- 5. Starter Laundry Garment Types
INSERT INTO laundry_settings (id, branch_id, item_type, default_price) VALUES
                                                                           ('LSET-1', 'BR003', 'Shirt', 500),
                                                                           ('LSET-2', 'BR003', 'Trouser', 500),
                                                                           ('LSET-3', 'BR003', 'Native Wear (Agbada/Kaftan)', 1000),
                                                                           ('LSET-4', 'BR003', 'Suit', 1500),
                                                                           ('LSET-5', 'BR003', 'Bedsheet', 1000),
                                                                           ('LSET-6', 'BR003', 'Blanket / Duvet', 2500);