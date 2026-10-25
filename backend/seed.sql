-- ==========================================
-- AL AMEEN V2 — REALISTIC DUMMY SEED DATA
-- ==========================================

-- Clear existing data safely so this script can be re-run anytime
DELETE FROM branches;
DELETE FROM employees;
DELETE FROM provision_products;
DELETE FROM provision_movements;
DELETE FROM provision_customers;
DELETE FROM provision_sales;
DELETE FROM provision_sale_items;
DELETE FROM provision_purchases;
DELETE FROM provision_ledger;
DELETE FROM provision_expenses;
DELETE FROM provision_expiry_batches;

-- 1. Branches
INSERT INTO branches (id, name, business_type, status) VALUES
                                                           ('BR001', 'Al Ameen Provision Store', 'Provision', 'Active'),
                                                           ('BR002', 'Al Ameen POS Banking', 'Banking', 'Active'),
                                                           ('BR003', 'Al Ameen Laundry Service', 'Laundry', 'Active');

-- 2. Employees (Owner PIN: 0000 | Cashier PIN: 1234)
INSERT INTO employees (id, code, name, role, phone, pin_hash, branch_id, status) VALUES
                                                                                     ('EMP-OWNER-001', 'OWN001', 'Al Ameen (Owner)', 'Owner', '08030000001', '0000', 'ALL', 'Active'),
                                                                                     ('EMP-CASH-001', 'CSH001', 'Sani Bello (Cashier)', 'Cashier', '08030000002', '1234', 'BR001', 'Active');

-- 3. Provision Products (In Stock, Low Stock, and Out of Stock examples)
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

-- 4. Provision Customers (With and without outstanding debt)
INSERT INTO provision_customers (id, branch_id, code, name, phone, outstanding_balance) VALUES
                                                                                            ('CUS-001', 'BR001', 'CUS-10001', 'Musa Ibrahim', '0803 123 4567', 1500),
                                                                                            ('CUS-002', 'BR001', 'CUS-10002', 'Hajiya Amina Yusuf', '0806 987 6543', 0),
                                                                                            ('CUS-003', 'BR001', 'CUS-10003', 'Bello Danjuma', '0701 555 8899', 3200);

-- 5. Provision Purchases (Restock History)
INSERT INTO provision_purchases (id, branch_id, purchase_code, product_id, product_name, quantity, cost_per_unit, total_amount, employee_name) VALUES
                                                                                                                                                   ('PUR-001', 'BR001', 'PUR-10001', 'PRD-001', 'Milo 400g', 50, 450, 22500, 'Al Ameen (Owner)'),
                                                                                                                                                   ('PUR-002', 'BR001', 'PUR-10002', 'PRD-004', 'Peak Full Cream Milk 160g', 35, 500, 17500, 'Al Ameen (Owner)');

-- -- 6. Provision Sales & Sale Items
-- INSERT INTO provision_sales (id, branch_id, invoice_number, customer_id, customer_name, total_amount, amount_paid, balance, payment_method, employee_name) VALUES
--                                                                                                                                                                ('SAL-001', 'BR001', 'INV-100001', NULL, 'Walk-in', 2750, 2750, 0, 'Cash', 'Sani Bello (Cashier)'),
--                                                                                                                                                                ('SAL-002', 'BR001', 'INV-100002', 'CUS-001', 'Musa Ibrahim', 3500, 2000, 1500, 'Bank Transfer', 'Al Ameen (Owner)'),
--                                                                                                                                                                ('SAL-003', 'BR001', 'INV-100003', 'CUS-003', 'Bello Danjuma', 5000, 1000, 4000, 'Cash', 'Al Ameen (Owner)');
--
-- INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
--                                                                                                              ('SIT-001', 'SAL-001', 'PRD-001', 'Milo 400g', 5, 550, 2750),
--                                                                                                              ('SIT-002', 'SAL-002', 'PRD-005', 'Dangote Refined Sugar 1kg', 1, 1500, 1500),
--                                                                                                              ('SIT-003', 'SAL-002', 'PRD-004', 'Peak Full Cream Milk 160g', 2, 650, 1300),
--                                                                                                              ('SIT-004', 'SAL-003', 'PRD-006', 'Golden Penny Semovita 2kg', 2, 2500, 5000);

-- 6. Provision Sales & Sale Items
INSERT INTO provision_sales (id, branch_id, invoice_number, customer_id, customer_name, total_amount, total_cost, profit, amount_paid, balance, payment_method, employee_name) VALUES
                                                                                                                                                                                   ('SAL-001', 'BR001', 'INV-100001', NULL, 'Walk-in', 2750, 2250, 500, 2750, 0, 'Cash', 'Sani Bello (Cashier)'),
                                                                                                                                                                                   ('SAL-002', 'BR001', 'INV-100002', 'CUS-001', 'Musa Ibrahim', 2800, 2200, 600, 1300, 1500, 'Bank Transfer', 'Al Ameen (Owner)'),
                                                                                                                                                                                   ('SAL-003', 'BR001', 'INV-100003', 'CUS-003', 'Bello Danjuma', 5000, 4200, 800, 1000, 4000, 'Cash', 'Al Ameen (Owner)');

INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES
                                                                                                             ('SIT-001', 'SAL-001', 'PRD-001', 'Milo 400g', 5, 550, 2750),
                                                                                                             ('SIT-002', 'SAL-002', 'PRD-005', 'Dangote Refined Sugar 1kg', 1, 1500, 1500),
                                                                                                             ('SIT-003', 'SAL-002', 'PRD-004', 'Peak Full Cream Milk 160g', 2, 650, 1300),
                                                                                                             ('SIT-004', 'SAL-003', 'PRD-006', 'Golden Penny Semovita 2kg', 2, 2500, 5000);

-- 7. Customer Credit Ledger
INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by) VALUES
                                                                                                                                                    ('LED-001', 'BR001', 'CUS-001', 'Musa Ibrahim', 'Sale (Credit)', 1500, 0, 'INV-100002', 'Al Ameen (Owner)'),
                                                                                                                                                    ('LED-002', 'BR001', 'CUS-003', 'Bello Danjuma', 'Sale (Credit)', 4000, 0, 'INV-100003', 'Al Ameen (Owner)'),
                                                                                                                                                    ('LED-003', 'BR001', 'CUS-003', 'Bello Danjuma', 'Payment', 0, 800, 'Cash', 'Sani Bello (Cashier)');

-- 8. Stock Movements Audit Trail
INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, quantity_out, reference, employee_name) VALUES
                                                                                                                                                  ('MOV-001', 'BR001', 'PRD-001', 'Milo 400g', 'Purchase', 50, 0, 'PUR-10001', 'Al Ameen (Owner)'),
                                                                                                                                                  ('MOV-002', 'BR001', 'PRD-001', 'Milo 400g', 'Sale', 0, 5, 'INV-100001', 'Sani Bello (Cashier)');

-- 9. Provision Expenses
INSERT INTO provision_expenses (id, branch_id, expense_code, category, description, amount, recorded_by) VALUES
                                                                                                             ('EXP-001', 'BR001', 'EXP-10001', 'Electricity', 'Prepaid meter token for shop', 5000, 'Al Ameen (Owner)'),
                                                                                                             ('EXP-002', 'BR001', 'EXP-10002', 'Transport', 'Tricycle (Keke) fare for market restock', 1500, 'Al Ameen (Owner)');

-- 10. Expiry Batches (1 Expired, 1 Near Expiry, 1 Healthy)
INSERT INTO provision_expiry_batches (id, branch_id, product_id, product_name, batch_number, quantity, expiry_date) VALUES
                                                                                                                        ('BAT-001', 'BR001', 'PRD-004', 'Peak Full Cream Milk 160g', 'PK-2026-A', 12, date('now', '-5 days')),
                                                                                                                        ('BAT-002', 'BR001', 'PRD-001', 'Milo 400g', 'ML-2026-B', 20, date('now', '+14 days')),
                                                                                                                        ('BAT-003', 'BR001', 'PRD-001', 'Milo 400g', 'ML-2027-C', 25, date('now', '+180 days'));