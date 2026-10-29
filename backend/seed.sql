-- ============================================================================
-- AMANAHQ V2.0 — COMPLETE MULTI-TENANT & 3-MODULE SEED DATA
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

-- 1. Tenants (Al Ameen as Lifetime Anchor Tenant + 1 Sample Trial Tenant)
INSERT INTO tenants (
    id, slug, shop_name, tagline, phone, address, currency_symbol, receipt_footer,
    invoice_prefix, receipt_prefix, low_stock_default, enabled_modules, master_recovery_key, subscription_status, subscription_expires_at
) VALUES
      ('TENANT-001', 'al-ameen', 'Al Ameen Provision Store', 'Quality goods & trusted POS services', '0803 123 4567', '12 Market Road, Kano', '₦', 'Thank you for your patronage!', 'INV-', 'RCP-', 5, '["provision","banking","laundry"]', 'AMANA-2026-HQ99', 'Active', NULL),
      ('TENANT-002', 'kano-minimart', 'Kano City Mini-Mart', 'Everyday essentials at wholesale prices', '0806 555 1234', '45 Zoo Road, Kano', '₦', 'Goods sold in good condition are not returnable.', 'KMM-', 'RCP-', 10, '["provision"]', 'AMANA-KANO-4410', 'Trial', date('now', '+30 days'));

-- 2. Branches
INSERT INTO branches (id, tenant_id, name, business_type, status) VALUES
                                                                      ('BR001', 'TENANT-001', 'Al Ameen Provision Store', 'Provision', 'Active'),
                                                                      ('BR002', 'TENANT-001', 'Al Ameen POS Banking', 'Banking', 'Active'),
                                                                      ('BR003', 'TENANT-001', 'Al Ameen Laundry Service', 'Laundry', 'Active');

-- 3. Employees
-- SuperAdmin: Code KAREM / PIN 0000
-- Owner:      Code OWN001 / PIN 0000
-- Cashier 1:  Code CSH001 / PIN 1234
-- Cashier 2:  Code CSH002 / PIN 5678
INSERT INTO employees (id, tenant_id, code, name, role, phone, pin_hash, branch_id, status) VALUES
                                                                                                ('EMP-SUPER-001', 'TENANT-001', 'KAREM', 'Abdulkarem (Founder)', 'SuperAdmin', '0800 000 0001', '0000', 'ALL', 'Active'),
                                                                                                ('EMP-OWNER-001', 'TENANT-001', 'OWN001', 'Al Ameen (Owner)', 'Owner', '0803 000 0001', '0000', 'ALL', 'Active'),
                                                                                                ('EMP-CASH-001', 'TENANT-001', 'CSH001', 'Sani Bello', 'Cashier', '0803 000 0002', '1234', 'BR001', 'Active'),
                                                                                                ('EMP-CASH-002', 'TENANT-001', 'CSH002', 'Aisha Musa', 'Cashier', '0803 000 0003', '5678', 'BR001', 'Active');

-- 4. Sample Permission Overrides (Yellow cells in Matrix for Sani Bello)
INSERT INTO permission_overrides (id, tenant_id, employee_id, page_key, can_view, can_add, can_edit, can_delete, updated_by) VALUES
                                                                                                                                 ('PERM-001', 'TENANT-001', 'EMP-CASH-001', 'expenses', 1, 1, 0, 0, 'Al Ameen (Owner)'),
                                                                                                                                 ('PERM-002', 'TENANT-001', 'EMP-CASH-001', 'stocktools', 1, 0, 0, 0, 'Al Ameen (Owner)');

-- 5. Audit Logs
INSERT INTO audit_logs (id, tenant_id, tx_date, tx_time, employee_name, action_type, details) VALUES
                                                                                                  ('AUD-001', 'TENANT-001', date('now'), '08:00:05', 'Al Ameen (Owner)', 'Login', 'Logged in (role: Owner)'),
                                                                                                  ('AUD-002', 'TENANT-001', date('now'), '08:02:10', 'Al Ameen (Owner)', 'Open Banking Day', 'Opened POS Banking day — Cash: ₦200,000, Float: ₦350,000'),
                                                                                                  ('AUD-003', 'TENANT-001', date('now'), '09:15:22', 'Sani Bello', 'Sale', 'INV-100001 — ₦2,750 (Milo 400g x5)'),
                                                                                                  ('AUD-004', 'TENANT-001', date('now'), '10:30:00', 'Al Ameen (Owner)', 'Set Permission', 'Sani Bello — expenses / ADD -> ON'),
                                                                                                  ('AUD-005', 'TENANT-001', date('now'), '11:45:19', 'Al Ameen (Owner)', 'Update Shop Settings', 'Shop name: Al Ameen Provision Store');

-- 6. Provision Products
INSERT INTO provision_products (
    id, branch_id, product_code, name, unit, reorder_level, stock_quantity,
    buying_price, selling_price, bulk_enabled, bulk_type, units_per_bulk, bulk_price, expiry_tracking, status
) VALUES
      ('PRD-001', 'BR001', 'PRD-10001', 'Milo 400g', 'Tin', 10, 45, 450, 550, 1, 'Carton', 12, 6300, 1, 'Active'),
      ('PRD-002', 'BR001', 'PRD-10002', 'Indomie Instant Noodles', 'Pack', 20, 0, 180, 230, 1, 'Carton', 40, 8800, 1, 'Active'),
      ('PRD-003', 'BR001', 'PRD-10003', 'Maggi Star Seasoning', 'Sachet', 15, 8, 30, 40, 1, 'Pack', 20, 750, 0, 'Active'),
      ('PRD-004', 'BR001', 'PRD-10004', 'Peak Full Cream Milk 160g', 'Tin', 10, 32, 500, 650, 1, 'Carton', 24, 15000, 1, 'Active'),
      ('PRD-005', 'BR001', 'PRD-10005', 'Dangote Refined Sugar 1kg', 'Bag', 5, 18, 1200, 1500, 0, NULL, 0, 0, 0, 'Active'),
      ('PRD-006', 'BR001', 'PRD-10006', 'Golden Penny Semovita 2kg', 'Bag', 8, 4, 2100, 2500, 0, NULL, 0, 0, 1, 'Active');

-- 7. Provision Drawer Session (Today Open)
INSERT INTO provision_drawer_sessions (id, branch_id, tx_date, open_time, opening_cash, opened_by, status) VALUES
    ('DRW-001', 'BR001', date('now'), '08:00:00', 25000, 'Sani Bello', 'Open');

-- 8. Provision Customers
INSERT INTO provision_customers (id, branch_id, code, name, phone, outstanding_balance) VALUES
                                                                                            ('CUS-001', 'BR001', 'CUS-10001', 'Musa Ibrahim', '0803 123 4567', 1500),
                                                                                            ('CUS-002', 'BR001', 'CUS-10002', 'Hajiya Amina Yusuf', '0806 987 6543', 0),
                                                                                            ('CUS-003', 'BR001', 'CUS-10003', 'Bello Danjuma', '0701 555 8899', 3200);

-- 9. Provision Purchases
INSERT INTO provision_purchases (id, branch_id, purchase_code, product_id, product_name, unit, quantity, cost_per_unit, total_amount, employee_name) VALUES
                                                                                                                                                         ('PUR-001', 'BR001', 'PUR-10001', 'PRD-001', 'Milo 400g', 'Tin', 50, 450, 22500, 'Al Ameen (Owner)'),
                                                                                                                                                         ('PUR-002', 'BR001', 'PUR-10002', 'PRD-004', 'Peak Full Cream Milk 160g', 'Tin', 35, 500, 17500, 'Al Ameen (Owner)');

-- 10. Provision Sales & Items (With items_json for Thermal Receipt Reprints!)
INSERT INTO provision_sales (
    id, branch_id, invoice_number, customer_id, customer_name, items_summary, items_json,
    total_amount, total_cost, profit, amount_paid, change_given, balance, payment_method, status, employee_name
) VALUES
      ('SAL-001', 'BR001', 'INV-100001', NULL, 'Walk-in', 'Milo 400g x5 (Tin)', '[{"id":"PRD-001","name":"Milo 400g","qty":5,"tier":"Tin","piecesPerUnit":1,"unitPrice":550,"lineTotal":2750}]', 2750, 2250, 500, 3000, 250, 0, 'Cash', 'Completed', 'Sani Bello'),
      ('SAL-002', 'BR001', 'INV-100002', 'CUS-001', 'Musa Ibrahim', 'Dangote Refined Sugar 1kg x1 (Bag); Peak Full Cream Milk 160g x2 (Tin)', '[{"id":"PRD-005","name":"Dangote Refined Sugar 1kg","qty":1,"tier":"Bag","piecesPerUnit":1,"unitPrice":1500,"lineTotal":1500},{"id":"PRD-004","name":"Peak Full Cream Milk 160g","qty":2,"tier":"Tin","piecesPerUnit":1,"unitPrice":650,"lineTotal":1300}]', 2800, 2200, 600, 1300, 0, 1500, 'Bank Transfer', 'Completed', 'Al Ameen (Owner)'),
      ('SAL-003', 'BR001', 'INV-100003', 'CUS-003', 'Bello Danjuma', 'Golden Penny Semovita 2kg x2 (Bag)', '[{"id":"PRD-006","name":"Golden Penny Semovita 2kg","qty":2,"tier":"Bag","piecesPerUnit":1,"unitPrice":2500,"lineTotal":5000}]', 5000, 4200, 800, 1000, 0, 4000, 'Cash', 'Completed', 'Al Ameen (Owner)');

INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
                                                                                                             ('SIT-001', 'SAL-001', 'PRD-001', 'Milo 400g', 5, 550, 2750),
                                                                                                             ('SIT-002', 'SAL-002', 'PRD-005', 'Dangote Refined Sugar 1kg', 1, 1500, 1500),
                                                                                                             ('SIT-003', 'SAL-002', 'PRD-004', 'Peak Full Cream Milk 160g', 2, 650, 1300),
                                                                                                             ('SIT-004', 'SAL-003', 'PRD-006', 'Golden Penny Semovita 2kg', 2, 2500, 5000);

-- 11. Provision Ledger, Expenses, Movements, Expiry Batches
INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by) VALUES
                                                                                                                                                    ('LED-001', 'BR001', 'CUS-001', 'Musa Ibrahim', 'Sale (Credit)', 1500, 0, 'INV-100002', 'Al Ameen (Owner)'),
                                                                                                                                                    ('LED-002', 'BR001', 'CUS-003', 'Bello Danjuma', 'Sale (Credit)', 4000, 0, 'INV-100003', 'Al Ameen (Owner)'),
                                                                                                                                                    ('LED-003', 'BR001', 'CUS-003', 'Bello Danjuma', 'Payment', 0, 800, 'Cash', 'Sani Bello');

INSERT INTO provision_expenses (id, branch_id, expense_code, category, description, amount, recorded_by) VALUES
                                                                                                             ('EXP-001', 'BR001', 'EXP-10001', 'Electricity', 'Prepaid meter token for shop', 2500, 'Al Ameen (Owner)'),
                                                                                                             ('EXP-002', 'BR001', 'EXP-10002', 'Transport', 'Tricycle (Keke) fare for market restock', 1500, 'Al Ameen (Owner)');

INSERT INTO provision_expiry_batches (id, branch_id, product_id, product_name, batch_number, quantity, expiry_date) VALUES
                                                                                                                        ('BAT-001', 'BR001', 'PRD-004', 'Peak Full Cream Milk 160g', 'PK-2026-A', 12, date('now', '-5 days')),
                                                                                                                        ('BAT-002', 'BR001', 'PRD-001', 'Milo 400g', 'ML-2026-B', 20, date('now', '+14 days')),
                                                                                                                        ('BAT-003', 'BR001', 'PRD-001', 'Milo 400g', 'ML-2027-C', 25, date('now', '+180 days'));

INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, quantity_out, reference, employee_name) VALUES
                                                                                                                                                  ('MOV-001', 'BR001', 'PRD-001', 'Milo 400g', 'Purchase', 50, 0, 'PUR-10001', 'Al Ameen (Owner)'),
                                                                                                                                                  ('MOV-002', 'BR001', 'PRD-001', 'Milo 400g', 'Sale', 0, 5, 'INV-100001', 'Sani Bello');

-- 12. POS Agent Banking Seed Data (BR002)
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

INSERT INTO banking_float (id, branch_id, tx_date, tx_time, opening_cash, opening_float, opened_by) VALUES
                                                                                                        ('BFLT-1', 'BR002', date('now', '-1 day'), '08:05:12', 150000, 250000, 'Al Ameen (Owner)'),
                                                                                                        ('BFLT-2', 'BR002', date('now'), '08:00:00', 200000, 350000, 'Al Ameen (Owner)');

INSERT INTO banking_day_close (id, branch_id, tx_date, tx_time, expected_cash, counted_cash, variance, expected_float, notes, closed_by) VALUES
    ('BCLS-1', 'BR002', date('now', '-1 day'), '20:15:00', 185000, 185000, 0, 218000, 'Balanced perfectly', 'Al Ameen (Owner)');

INSERT INTO banking_transactions (
    id, branch_id, transaction_code, tx_date, tx_time, customer_name, customer_phone,
    type, provider, amount, charge, charge_source, cash_delta, float_delta, status, notes, recorded_by
) VALUES
      ('BTX-1', 'BR002', 'TRX-1001', date('now'), '09:15:22', 'Ibrahim Lawal', '0803 444 1122', 'Withdrawal', 'Moniepoint', 20000, 200, 'Deducted from float sent', -19800, 20000, 'Successful', '', 'Al Ameen (Owner)'),
      ('BTX-2', 'BR002', 'TRX-1002', date('now'), '10:02:45', 'Fatima Sani', '0806 222 9988', 'Deposit', 'Opay', 50000, 300, 'Cash on top', 50300, -50000, 'Successful', '', 'Al Ameen (Owner)'),
      ('BTX-3', 'BR002', 'TRX-1003', date('now'), '11:30:10', 'Ibrahim Lawal', '0803 444 1122', 'Transfer', 'PalmPay', 15000, 100, 'Cash on top', 100, -15000, 'Successful', '', 'Al Ameen (Owner)'),
      ('BTX-4', 'BR002', 'TRX-1004', date('now'), '12:10:05', 'Usman Garba', '0701 888 7766', 'Withdrawal', 'Moniepoint', 10000, 100, 'Deducted from float sent', -9900, 10000, 'Failed', 'Network timeout on POS', 'Al Ameen (Owner)');

INSERT INTO banking_expenses (id, branch_id, expense_code, tx_date, tx_time, category, description, amount, recorded_by) VALUES
    ('BEXP-1', 'BR002', 'EXP-20001', date('now'), '11:00:00', 'Airtime/Data (business)', 'POS terminal SIM data bundle', 1500, 'Al Ameen (Owner)');

-- 13. Laundry Service Seed Data (BR003)
INSERT INTO laundry_settings (id, branch_id, item_type, default_price) VALUES
                                                                           ('LSET-1', 'BR003', 'Shirt', 500),
                                                                           ('LSET-2', 'BR003', 'Trouser', 500),
                                                                           ('LSET-3', 'BR003', 'Native Wear (Agbada/Kaftan)', 1000),
                                                                           ('LSET-4', 'BR003', 'Suit', 1500),
                                                                           ('LSET-5', 'BR003', 'Bedsheet (Single)', 800),
                                                                           ('LSET-6', 'BR003', 'Bedsheet (Double)', 1200),
                                                                           ('LSET-7', 'BR003', 'Blanket (Large/Duvet)', 2500),
                                                                           ('LSET-8', 'BR003', 'Curtain', 1500),
                                                                           ('LSET-9', 'BR003', 'Towel', 400);

INSERT INTO laundry_customers (id, branch_id, customer_code, name, phone, total_orders, total_spent, last_visit_date) VALUES
                                                                                                                          ('LCUS-1', 'BR003', 'LCUS-00001', 'Alhaji Kabiru Musa', '0803 777 1111', 2, 6500, date('now')),
                                                                                                                          ('LCUS-2', 'BR003', 'LCUS-00002', 'Dr. Zainab Bello', '0809 333 4444', 1, 3500, date('now', '-3 days'));

INSERT INTO laundry_orders (
    id, branch_id, order_number, date_received, time_received, customer_id, customer_name, customer_phone,
    total_amount, amount_paid, balance, payment_method, order_status, expected_ready_date, received_by, notes
) VALUES
      ('LORD-1', 'BR003', 'LDY-00001', date('now', '-3 days'), '10:15:00', 'LCUS-2', 'Dr. Zainab Bello', '0809 333 4444', 3500, 2000, 1500, 'Bank Transfer', 'Ready for Pickup', date('now', '-1 day'), 'Al Ameen (Owner)', 'Starch lightly — OVERDUE order example'),
      ('LORD-2', 'BR003', 'LDY-00002', date('now'), '09:30:00', 'LCUS-1', 'Alhaji Kabiru Musa', '0803 777 1111', 4000, 4000, 0, 'Cash', 'Washing', date('now', '+2 days'), 'Al Ameen (Owner)', 'Express wash');

INSERT INTO laundry_order_items (id, order_id, branch_id, item_type, quantity, unit_price, subtotal, special_instructions) VALUES
                                                                                                                               ('LITEM-1', 'LORD-1', 'BR003', 'Native Wear (Agbada/Kaftan)', 2, 1000, 2000, ''),
                                                                                                                               ('LITEM-2', 'LORD-1', 'BR003', 'Suit', 1, 1500, 1500, 'Dry clean only'),
                                                                                                                               ('LITEM-3', 'LORD-2', 'BR003', 'Native Wear (Agbada/Kaftan)', 4, 1000, 4000, '');

INSERT INTO laundry_payments (id, branch_id, order_id, order_number, tx_date, tx_time, amount, payment_method, recorded_by) VALUES
                                                                                                                                ('LPAY-1', 'BR003', 'LORD-1', 'LDY-00001', date('now', '-3 days'), '10:15:00', 2000, 'Bank Transfer', 'Al Ameen (Owner)'),
                                                                                                                                ('LPAY-2', 'BR003', 'LORD-2', 'LDY-00002', date('now'), '09:30:00', 4000, 'Cash', 'Al Ameen (Owner)');

INSERT INTO laundry_expenses (id, branch_id, expense_code, tx_date, tx_time, category, description, amount, recorded_by) VALUES
    ('LEXP-1', 'BR003', 'EXP-30001', date('now'), '11:20:00', 'Detergent/Supplies', 'Industrial detergent & starch packs', 3000, 'Al Ameen (Owner)');