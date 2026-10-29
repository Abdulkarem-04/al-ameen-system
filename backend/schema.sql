-- ============================================================================
-- AMANAHQ V2.0 — UNIFIED MULTI-TENANT ERP & POS DATABASE SCHEMA (CLOUDFLARE D1)
-- ============================================================================

-- 1. SAAS CONTROL PLANE & TENANT BRANDING
DROP TABLE IF EXISTS tenants;
CREATE TABLE tenants (
                         id TEXT PRIMARY KEY,
                         slug TEXT UNIQUE NOT NULL,
                         shop_name TEXT NOT NULL DEFAULT 'My Provision Store',
                         tagline TEXT DEFAULT 'Quality goods at fair prices',
                         phone TEXT DEFAULT '',
                         address TEXT DEFAULT '',
                         currency_symbol TEXT NOT NULL DEFAULT '₦',
                         receipt_footer TEXT DEFAULT 'Thank you for your patronage!',
                         invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
                         receipt_prefix TEXT NOT NULL DEFAULT 'RCP-',
                         low_stock_default INTEGER NOT NULL DEFAULT 5,
                         logo_data_url TEXT DEFAULT '',
                         enabled_modules TEXT NOT NULL DEFAULT '["provision","banking","laundry"]',
                         master_recovery_key TEXT NOT NULL DEFAULT 'AMANA-2026-HQ99',
                         subscription_status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Trial', 'Suspended'
                         subscription_expires_at TEXT, -- 'YYYY-MM-DD' or NULL for lifetime
                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS branches;
CREATE TABLE branches (
                          id TEXT PRIMARY KEY,
                          tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
                          name TEXT NOT NULL,
                          business_type TEXT NOT NULL, -- 'Provision', 'Banking', 'Laundry'
                          status TEXT DEFAULT 'Active',
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPLOYEES, RBAC PERMISSIONS & AUDIT LOG
DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
                           id TEXT PRIMARY KEY,
                           tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
                           code TEXT UNIQUE NOT NULL,
                           name TEXT NOT NULL,
                           role TEXT NOT NULL, -- 'SuperAdmin', 'Owner', 'Cashier'
                           phone TEXT DEFAULT '',
                           pin_hash TEXT NOT NULL,
                           branch_id TEXT NOT NULL DEFAULT 'ALL',
                           status TEXT DEFAULT 'Active',
                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS permission_overrides;
CREATE TABLE permission_overrides (
                                      id TEXT PRIMARY KEY,
                                      tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
                                      employee_id TEXT NOT NULL,
                                      page_key TEXT NOT NULL,
                                      can_view INTEGER NOT NULL DEFAULT 0,
                                      can_add INTEGER NOT NULL DEFAULT 0,
                                      can_edit INTEGER NOT NULL DEFAULT 0,
                                      can_delete INTEGER NOT NULL DEFAULT 0,
                                      updated_by TEXT,
                                      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                      UNIQUE(employee_id, page_key)
);

DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
                            id TEXT PRIMARY KEY,
                            tenant_id TEXT NOT NULL DEFAULT 'TENANT-001',
                            tx_date TEXT NOT NULL,
                            tx_time TEXT NOT NULL,
                            employee_name TEXT NOT NULL,
                            action_type TEXT NOT NULL,
                            details TEXT DEFAULT '',
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. MODULE 1: PROVISION STORE TABLES (BR001)
DROP TABLE IF EXISTS provision_products;
CREATE TABLE provision_products (
                                    id TEXT PRIMARY KEY,
                                    branch_id TEXT NOT NULL DEFAULT 'BR001',
                                    product_code TEXT UNIQUE NOT NULL,
                                    name TEXT NOT NULL,
                                    unit TEXT NOT NULL,
                                    reorder_level INTEGER DEFAULT 5,
                                    stock_quantity INTEGER DEFAULT 0,
                                    buying_price REAL DEFAULT 0,
                                    selling_price REAL DEFAULT 0,
                                    bulk_enabled BOOLEAN DEFAULT 0,
                                    bulk_type TEXT,
                                    units_per_bulk INTEGER DEFAULT 0,
                                    bulk_price REAL DEFAULT 0,
                                    expiry_tracking BOOLEAN DEFAULT 0,
                                    status TEXT DEFAULT 'Active',
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_movements;
CREATE TABLE provision_movements (
                                     id TEXT PRIMARY KEY,
                                     branch_id TEXT NOT NULL DEFAULT 'BR001',
                                     product_id TEXT NOT NULL,
                                     product_name TEXT NOT NULL,
                                     movement_type TEXT NOT NULL, -- 'Opening Stock', 'Sale', 'Purchase', 'Adjustment', 'Return'
                                     quantity_in INTEGER DEFAULT 0,
                                     quantity_out INTEGER DEFAULT 0,
                                     reference TEXT,
                                     employee_name TEXT,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_customers;
CREATE TABLE provision_customers (
                                     id TEXT PRIMARY KEY,
                                     branch_id TEXT NOT NULL DEFAULT 'BR001',
                                     code TEXT UNIQUE NOT NULL,
                                     name TEXT NOT NULL,
                                     phone TEXT,
                                     outstanding_balance REAL DEFAULT 0,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_sales;
CREATE TABLE provision_sales (
                                 id TEXT PRIMARY KEY,
                                 branch_id TEXT NOT NULL DEFAULT 'BR001',
                                 invoice_number TEXT UNIQUE NOT NULL,
                                 customer_id TEXT,
                                 customer_name TEXT,
                                 items_summary TEXT DEFAULT '',
                                 items_json TEXT DEFAULT '[]',
                                 total_amount REAL DEFAULT 0,
                                 total_cost REAL DEFAULT 0,
                                 profit REAL DEFAULT 0,
                                 amount_paid REAL DEFAULT 0,
                                 change_given REAL DEFAULT 0,
                                 balance REAL DEFAULT 0,
                                 payment_method TEXT NOT NULL,
                                 status TEXT DEFAULT 'Completed', -- 'Completed', 'Refunded', 'Partial Refund'
                                 employee_name TEXT NOT NULL,
                                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_sale_items;
CREATE TABLE provision_sale_items (
                                      id TEXT PRIMARY KEY,
                                      sale_id TEXT NOT NULL,
                                      product_id TEXT NOT NULL,
                                      product_name TEXT NOT NULL,
                                      quantity INTEGER NOT NULL,
                                      unit_price REAL NOT NULL,
                                      subtotal REAL NOT NULL
);

DROP TABLE IF EXISTS provision_returns;
CREATE TABLE provision_returns (
                                   id TEXT PRIMARY KEY,
                                   branch_id TEXT NOT NULL DEFAULT 'BR001',
                                   sale_id TEXT NOT NULL,
                                   invoice_number TEXT NOT NULL,
                                   product_id TEXT NOT NULL,
                                   product_name TEXT NOT NULL,
                                   quantity_pieces INTEGER NOT NULL,
                                   refund_amount REAL NOT NULL,
                                   reason TEXT NOT NULL,
                                   recorded_by TEXT NOT NULL,
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_drawer_sessions;
CREATE TABLE provision_drawer_sessions (
                                           id TEXT PRIMARY KEY,
                                           branch_id TEXT NOT NULL DEFAULT 'BR001',
                                           tx_date TEXT NOT NULL,
                                           open_time TEXT NOT NULL,
                                           opening_cash REAL NOT NULL,
                                           opened_by TEXT NOT NULL,
                                           close_time TEXT,
                                           expected_cash REAL,
                                           counted_cash REAL,
                                           variance REAL,
                                           notes TEXT,
                                           closed_by TEXT,
                                           status TEXT DEFAULT 'Open', -- 'Open' | 'Closed'
                                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_purchases;
CREATE TABLE provision_purchases (
                                     id TEXT PRIMARY KEY,
                                     branch_id TEXT NOT NULL DEFAULT 'BR001',
                                     purchase_code TEXT UNIQUE NOT NULL,
                                     product_id TEXT NOT NULL,
                                     product_name TEXT NOT NULL,
                                     unit TEXT DEFAULT 'Unit',
                                     quantity INTEGER NOT NULL,
                                     cost_per_unit REAL NOT NULL,
                                     total_amount REAL NOT NULL,
                                     employee_name TEXT NOT NULL,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_ledger;
CREATE TABLE provision_ledger (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR001',
                                  customer_id TEXT NOT NULL,
                                  customer_name TEXT NOT NULL,
                                  transaction_type TEXT NOT NULL,
                                  debit_amount REAL DEFAULT 0,
                                  credit_amount REAL DEFAULT 0,
                                  reference TEXT,
                                  recorded_by TEXT NOT NULL,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_expenses;
CREATE TABLE provision_expenses (
                                    id TEXT PRIMARY KEY,
                                    branch_id TEXT NOT NULL DEFAULT 'BR001',
                                    expense_code TEXT UNIQUE NOT NULL,
                                    category TEXT NOT NULL,
                                    description TEXT,
                                    amount REAL NOT NULL,
                                    recorded_by TEXT NOT NULL,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS provision_expiry_batches;
CREATE TABLE provision_expiry_batches (
                                          id TEXT PRIMARY KEY,
                                          branch_id TEXT NOT NULL DEFAULT 'BR001',
                                          product_id TEXT NOT NULL,
                                          product_name TEXT NOT NULL,
                                          batch_number TEXT,
                                          quantity INTEGER NOT NULL,
                                          expiry_date TEXT NOT NULL,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. MODULE 2: POS AGENT BANKING TABLES (BR002)
DROP TABLE IF EXISTS banking_settings;
CREATE TABLE banking_settings (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR002',
                                  transaction_type TEXT NOT NULL,
                                  default_charge REAL DEFAULT 0
);

DROP TABLE IF EXISTS banking_providers;
CREATE TABLE banking_providers (
                                   id TEXT PRIMARY KEY,
                                   branch_id TEXT NOT NULL DEFAULT 'BR002',
                                   provider_name TEXT NOT NULL
);

DROP TABLE IF EXISTS banking_float;
CREATE TABLE banking_float (
                               id TEXT PRIMARY KEY,
                               branch_id TEXT NOT NULL DEFAULT 'BR002',
                               tx_date TEXT NOT NULL,
                               tx_time TEXT NOT NULL,
                               opening_cash REAL NOT NULL,
                               opening_float REAL NOT NULL,
                               opened_by TEXT NOT NULL,
                               created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS banking_day_close;
CREATE TABLE banking_day_close (
                                   id TEXT PRIMARY KEY,
                                   branch_id TEXT NOT NULL DEFAULT 'BR002',
                                   tx_date TEXT NOT NULL,
                                   tx_time TEXT NOT NULL,
                                   expected_cash REAL NOT NULL,
                                   counted_cash REAL NOT NULL,
                                   variance REAL NOT NULL,
                                   expected_float REAL NOT NULL,
                                   notes TEXT,
                                   closed_by TEXT NOT NULL,
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS banking_transactions;
CREATE TABLE banking_transactions (
                                      id TEXT PRIMARY KEY,
                                      branch_id TEXT NOT NULL DEFAULT 'BR002',
                                      transaction_code TEXT UNIQUE NOT NULL,
                                      tx_date TEXT NOT NULL,
                                      tx_time TEXT NOT NULL,
                                      customer_name TEXT,
                                      customer_phone TEXT,
                                      type TEXT NOT NULL,
                                      provider TEXT NOT NULL,
                                      amount REAL NOT NULL,
                                      charge REAL NOT NULL,
                                      charge_source TEXT,
                                      cash_delta REAL NOT NULL,
                                      float_delta REAL NOT NULL,
                                      status TEXT DEFAULT 'Successful',
                                      notes TEXT,
                                      recorded_by TEXT NOT NULL,
                                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS banking_expenses;
CREATE TABLE banking_expenses (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR002',
                                  expense_code TEXT UNIQUE NOT NULL,
                                  tx_date TEXT NOT NULL,
                                  tx_time TEXT NOT NULL,
                                  category TEXT NOT NULL,
                                  description TEXT,
                                  amount REAL NOT NULL,
                                  recorded_by TEXT NOT NULL,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. MODULE 3: LAUNDRY SERVICE TABLES (BR003)
DROP TABLE IF EXISTS laundry_settings;
CREATE TABLE laundry_settings (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR003',
                                  item_type TEXT NOT NULL,
                                  default_price REAL NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS laundry_customers;
CREATE TABLE laundry_customers (
                                   id TEXT PRIMARY KEY,
                                   branch_id TEXT NOT NULL DEFAULT 'BR003',
                                   customer_code TEXT UNIQUE NOT NULL,
                                   name TEXT NOT NULL,
                                   phone TEXT DEFAULT '',
                                   total_orders INTEGER DEFAULT 0,
                                   total_spent REAL DEFAULT 0,
                                   last_visit_date TEXT DEFAULT '',
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS laundry_orders;
CREATE TABLE laundry_orders (
                                id TEXT PRIMARY KEY,
                                branch_id TEXT NOT NULL DEFAULT 'BR003',
                                order_number TEXT UNIQUE NOT NULL,
                                date_received TEXT NOT NULL,
                                time_received TEXT NOT NULL,
                                customer_id TEXT,
                                customer_name TEXT NOT NULL,
                                customer_phone TEXT DEFAULT '',
                                total_amount REAL NOT NULL DEFAULT 0,
                                amount_paid REAL NOT NULL DEFAULT 0,
                                balance REAL NOT NULL DEFAULT 0,
                                payment_method TEXT NOT NULL DEFAULT 'Cash',
                                order_status TEXT NOT NULL DEFAULT 'Dropped Off', -- 'Dropped Off', 'Washing', 'Ready for Pickup', 'Collected', 'Cancelled'
                                expected_ready_date TEXT DEFAULT '',
                                date_collected TEXT DEFAULT '',
                                time_collected TEXT DEFAULT '',
                                collected_by TEXT DEFAULT '',
                                received_by TEXT NOT NULL,
                                notes TEXT DEFAULT '',
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS laundry_order_items;
CREATE TABLE laundry_order_items (
                                     id TEXT PRIMARY KEY,
                                     order_id TEXT NOT NULL,
                                     branch_id TEXT NOT NULL DEFAULT 'BR003',
                                     item_type TEXT NOT NULL,
                                     quantity INTEGER NOT NULL,
                                     unit_price REAL NOT NULL,
                                     subtotal REAL NOT NULL,
                                     special_instructions TEXT DEFAULT ''
);

DROP TABLE IF EXISTS laundry_payments;
CREATE TABLE laundry_payments (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR003',
                                  order_id TEXT NOT NULL,
                                  order_number TEXT NOT NULL,
                                  tx_date TEXT NOT NULL,
                                  tx_time TEXT NOT NULL,
                                  amount REAL NOT NULL,
                                  payment_method TEXT NOT NULL,
                                  recorded_by TEXT NOT NULL,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS laundry_expenses;
CREATE TABLE laundry_expenses (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL DEFAULT 'BR003',
                                  expense_code TEXT UNIQUE NOT NULL,
                                  tx_date TEXT NOT NULL,
                                  tx_time TEXT NOT NULL,
                                  category TEXT NOT NULL,
                                  description TEXT DEFAULT '',
                                  amount REAL NOT NULL,
                                  recorded_by TEXT NOT NULL,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);