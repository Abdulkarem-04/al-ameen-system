DROP TABLE IF EXISTS branches;
CREATE TABLE branches (
                          id TEXT PRIMARY KEY,
                          name TEXT NOT NULL,
                          business_type TEXT NOT NULL, -- 'Provision', 'Banking', 'Laundry'
                          status TEXT DEFAULT 'Active',
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
                           id TEXT PRIMARY KEY,
                           code TEXT UNIQUE NOT NULL,
                           name TEXT NOT NULL,
                           role TEXT NOT NULL, -- 'Owner' or 'Cashier'
                           phone TEXT,
                           pin_hash TEXT NOT NULL,
                           branch_id TEXT NOT NULL, -- 'ALL' or specific branch ID
                           status TEXT DEFAULT 'Active',
                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data (So we can test login)
INSERT INTO branches (id, name, business_type) VALUES
                                                   ('BR001', 'Al Ameen Provision Store', 'Provision'),
                                                   ('BR002', 'Al Ameen POS Banking', 'Banking'),
                                                   ('BR003', 'Al Ameen Laundry Service', 'Laundry');

-- Seed the default Owner (PIN: 0000)
-- The old system accepts plain text if it doesn't start with 'sha256:', we will upgrade this logic in code.
INSERT INTO employees (id, code, name, role, pin_hash, branch_id) VALUES
    ('EMP-OWNER-001', 'OWN001', 'Al Ameen (Owner)', 'Owner', '0000', 'ALL');

-- PROVISION STORE TABLES

DROP TABLE IF EXISTS provision_products;
CREATE TABLE provision_products (
                                    id TEXT PRIMARY KEY,
                                    branch_id TEXT NOT NULL,
                                    product_code TEXT UNIQUE NOT NULL,
                                    name TEXT NOT NULL,
                                    unit TEXT NOT NULL,
                                    reorder_level INTEGER DEFAULT 0,
                                    stock_quantity INTEGER DEFAULT 0,
                                    buying_price REAL DEFAULT 0,
                                    selling_price REAL DEFAULT 0,
                                    bulk_enabled BOOLEAN DEFAULT 0, -- SQLite uses 0/1 for booleans
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
                                     branch_id TEXT NOT NULL,
                                     product_id TEXT NOT NULL,
                                     product_name TEXT NOT NULL,
                                     movement_type TEXT NOT NULL, -- 'Opening Stock', 'Sale', 'Purchase', 'Adjustment'
                                     quantity_in INTEGER DEFAULT 0,
                                     quantity_out INTEGER DEFAULT 0,
                                     reference TEXT,
                                     employee_name TEXT,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS & LEDGER
DROP TABLE IF EXISTS provision_customers;
CREATE TABLE provision_customers (
                                     id TEXT PRIMARY KEY,
                                     branch_id TEXT NOT NULL,
                                     code TEXT UNIQUE NOT NULL,
                                     name TEXT NOT NULL,
                                     phone TEXT,
                                     outstanding_balance REAL DEFAULT 0,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SALES TRANSACTIONS
DROP TABLE IF EXISTS provision_sales;
-- CREATE TABLE provision_sales (
--                                  id TEXT PRIMARY KEY,
--                                  branch_id TEXT NOT NULL,
--                                  invoice_number TEXT UNIQUE NOT NULL,
--                                  customer_id TEXT, -- Nullable for walk-in cash customers
--                                  customer_name TEXT,
--                                  total_amount REAL DEFAULT 0,
--                                  amount_paid REAL DEFAULT 0,
--                                  balance REAL DEFAULT 0,
--                                  payment_method TEXT NOT NULL, -- 'Cash', 'POS/Card', 'Bank Transfer'
--                                  employee_name TEXT NOT NULL,
--                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE provision_sales (
                                 id TEXT PRIMARY KEY,
                                 branch_id TEXT NOT NULL,
                                 invoice_number TEXT UNIQUE NOT NULL,
                                 customer_id TEXT,
                                 customer_name TEXT,
                                 total_amount REAL DEFAULT 0,
                                 total_cost REAL DEFAULT 0,
                                 profit REAL DEFAULT 0,
                                 amount_paid REAL DEFAULT 0,
                                 balance REAL DEFAULT 0,
                                 payment_method TEXT NOT NULL,
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

-- PURCHASES (RESTOCKING)
DROP TABLE IF EXISTS provision_purchases;
CREATE TABLE provision_purchases (
                                     id TEXT PRIMARY KEY,
                                     branch_id TEXT NOT NULL,
                                     purchase_code TEXT UNIQUE NOT NULL,
                                     product_id TEXT NOT NULL,
                                     product_name TEXT NOT NULL,
                                     quantity INTEGER NOT NULL,
                                     cost_per_unit REAL NOT NULL,
                                     total_amount REAL NOT NULL,
                                     employee_name TEXT NOT NULL,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMER CREDIT LEDGER
DROP TABLE IF EXISTS provision_ledger;
CREATE TABLE provision_ledger (
                                  id TEXT PRIMARY KEY,
                                  branch_id TEXT NOT NULL,
                                  customer_id TEXT NOT NULL,
                                  customer_name TEXT NOT NULL,
                                  transaction_type TEXT NOT NULL, -- 'Sale (Credit)' or 'Payment'
                                  debit_amount REAL DEFAULT 0,    -- Money owed added
                                  credit_amount REAL DEFAULT 0,   -- Money paid back
                                  reference TEXT,                 -- Invoice number or payment method
                                  recorded_by TEXT NOT NULL,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- STORE EXPENSES
DROP TABLE IF EXISTS provision_expenses;
CREATE TABLE provision_expenses (
                                    id TEXT PRIMARY KEY,
                                    branch_id TEXT NOT NULL,
                                    expense_code TEXT UNIQUE NOT NULL,
                                    category TEXT NOT NULL,
                                    description TEXT,
                                    amount REAL NOT NULL,
                                    recorded_by TEXT NOT NULL,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- EXPIRY BATCHES
DROP TABLE IF EXISTS provision_expiry_batches;
CREATE TABLE provision_expiry_batches (
                                          id TEXT PRIMARY KEY,
                                          branch_id TEXT NOT NULL,
                                          product_id TEXT NOT NULL,
                                          product_name TEXT NOT NULL,
                                          batch_number TEXT,
                                          quantity INTEGER NOT NULL,
                                          expiry_date TEXT NOT NULL, -- 'YYYY-MM-DD'
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);