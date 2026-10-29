# SYSTEM ARCHITECTURE & SPECIFICATION DOCUMENT
**Project Working Title:** AmanaHQ (Multi-Tenant B2B Retail & Service ERP)  
**Architecture Pattern:** Decoupled Serverless SPA + Edge REST API + Multi-Tenant Relational DB  
**Tech Stack:** React 19 (Vite + TypeScript + Tailwind CSS + Zustand + Chart.js) | Hono.js (Cloudflare Workers) | Cloudflare D1 (SQLite)  
**Target Operating Cost:** $0.00 / month (100% Free-Forever Commercial Tiers)

---

## 1. EXECUTIVE SUMMARY & SAAS MODEL

This system is a **Multi-Tenant, Modular B2B SaaS Platform** designed for small-to-medium businesses (SMEs). A single deployment serves multiple independent businesses (**Tenants**).

Each Tenant can be provisioned with **one or more business modules**:
1. **Provision Store Module (`provision`)** — Retail POS, Unit/Bulk Inventory, Sales History & Refunds, POS Cash Drawer, Customer Credit Ledger, Purchases, Expiry Tracking, Expenses, Analytics.
2. **POS Agent Banking Module (`banking`)** — Deposit/Withdrawal/Transfer/Bill POS tracking, Live Cash vs. Digital Float Engine, End-of-Day Till Reconciliation & Variance, Repeat Customer Ranking.
3. **Laundry Service Module (`laundry`)** — Garment Drop-Off Intake, Itemized Pricing, Order Status Pipeline (`Dropped Off` -> `Washing` -> `Ready` -> `Collected`), Overdue Alerts, Cash-Basis Payment Ledger.
4. Possibilty of new modules in future.

### Tenant Isolation Rule
Every record in the database belongs to a `tenant_id`. A user authenticated into Tenant A can **never** read, write, or discover data belonging to Tenant B.

---

## 2. TWO-TIER ACCESS CONTROL & SECURITY ARCHITECTURE

To prevent permission complexity, access control is strictly divided into **two independent layers**:

### Layer A: Platform Control Plane (`SuperAdmin` — Karem)
- **Purpose:** Manage B2B customers (Tenants) without needing a payment gateway.
- **Capabilities:**
  - Create a new Tenant (Business).
  - Configure which modules the Tenant has access to (`["provision"]`, `["provision", "banking", "laundry"]`, etc.).
  - Set Tenant `subscription_status` (`Active`, `Trial`, `Suspended`) and `subscription_expires_at`.
  - Create or reset the initial `Owner` account for a Tenant.

### Layer B: Tenant Workspace RBAC (`Owner` & `Cashier` + Granular V/A/E/D Matrix)
Inside a Tenant workspace, there are two base roles:
1. **`Owner` (Locked):** Has full access (`View`, `Add`, `Edit`, `Delete`) to all enabled modules and pages within their Tenant. Cannot be restricted or locked out if they are the last active Owner.
2. **`Cashier` (Configurable via Permission Matrix):**
   - Starts with sensible **Role Defaults** (`AA_CASHIER_DEFAULTS`).
   - The Tenant `Owner` can open the **Roles & Permissions Matrix** and toggle **V (View)**, **A (Add)**, **E (Edit)**, and **D (Delete)** per staff member, per page.
   - **Dual Enforcement:**
     - **Frontend:** Sidebar links hide if `V` is `false`. Action buttons (`+ Add`, `Edit`, `Delete`) hide or disable if `A`, `E`, or `D` is `false`.
     - **Backend Gateway:** Every API route is mapped to a `{ pageKey, action }` requirement (`view` | `add` | `edit` | `delete`). Requests with a valid token are rejected with `403 Forbidden` if the user's effective permission is `false`.

### PIN Security & Brute-Force Protection
- **Salted SHA-256 Hashing:** Staff log in with an `Employee Code` (scoped to their Tenant or globally unique, e.g., `OWN001` or `SHOP1-CSH01`) and a `4-Digit PIN`.
- PINs are stored as `sha256$<32-hex-salt>$<64-hex-digest>`. Legacy plaintext PINs (`0000`) are seamlessly upgraded to salted hashes upon login or via the Owner's "Secure All PINs" button.
- **Brute-Force Lockout:** 5 failed PIN attempts lock the employee code for 15 minutes.

---

## 3. COMPLETE DATABASE SCHEMA (CLOUDFLARE D1 / SQLITE)

### 3.1 SaaS & Tenant Core Tables
- **`tenants`**
  - `id` (TEXT PK, e.g., `'TENANT-AL-AMEEN'`)
  - `slug` (TEXT UNIQUE, e.g., `'al-ameen'`)
  - `shop_name` (TEXT, default `'My Provision Store'`)
  - `tagline` (TEXT)
  - `phone` (TEXT)
  - `address` (TEXT)
  - `currency_symbol` (TEXT, default `'₦'`)
  - `receipt_footer` (TEXT, default `'Thank you for your patronage!'`)
  - `invoice_prefix` (TEXT, default `'INV-'`)
  - `receipt_prefix` (TEXT, default `'RCP-'`)
  - `low_stock_default` (INTEGER, default `5`)
  - `logo_data_url` (TEXT — base64 PNG/JPEG max 45KB, client-downscaled to 256px)
  - `enabled_modules` (TEXT JSON — e.g., `'["provision","banking","laundry"]'`)
  - `subscription_status` (TEXT — `'Active'`, `'Trial'`, `'Suspended'`)
  - `subscription_expires_at` (TEXT — `'YYYY-MM-DD'` or NULL for lifetime free)
  - `created_at` (DATETIME)

- **`employees`**
  - `id` (TEXT PK)
  - `tenant_id` (TEXT FK -> `tenants.id`)
  - `code` (TEXT NOT NULL — unique per tenant)
  - `name` (TEXT NOT NULL)
  - `role` (TEXT NOT NULL — `'SuperAdmin'`, `'Owner'`, `'Cashier'`)
  - `phone` (TEXT)
  - `pin_hash` (TEXT NOT NULL)
  - `status` (TEXT DEFAULT `'Active'`)
  - `created_at` (DATETIME)

- **`permission_overrides`**
  - `id` (TEXT PK)
  - `tenant_id` (TEXT NOT NULL)
  - `employee_id` (TEXT NOT NULL)
  - `page_key` (TEXT NOT NULL — e.g., `'pos'`, `'saleshistory'`, `'products'`, `'expenses'`)
  - `can_view` (INTEGER 0/1)
  - `can_add` (INTEGER 0/1)
  - `can_edit` (INTEGER 0/1)
  - `can_delete` (INTEGER 0/1)
  - `updated_by` (TEXT)
  - `updated_at` (DATETIME)

- **`audit_logs`**
  - `id` (TEXT PK)
  - `tenant_id` (TEXT NOT NULL)
  - `tx_date` (TEXT `'YYYY-MM-DD'`)
  - `tx_time` (TEXT `'HH:MM:SS'`)
  - `employee_name` (TEXT)
  - `action_type` (TEXT)
  - `details` (TEXT)

---

### 3.2 Module 1: Provision Store Tables (`provision_*`)
- **`provision_products`**
  - `id`, `tenant_id`, `product_code`, `name`, `unit`, `reorder_level`, `stock_quantity`
  - `buying_price`, `selling_price`
  - `bulk_enabled` (0/1), `bulk_type` (`'Pack'|'Carton'|'Roll'|'Dozen'`), `units_per_bulk`, `bulk_price`
  - `expiry_tracking` (0/1), `status` (`'Active'|'Inactive'`), `created_at`

- **`provision_sales`** (Supports POS Checkout, Sales History, Reprints, and Refunds)
  - `id`, `tenant_id`, `invoice_number`, `sale_date` (`'YYYY-MM-DD'`), `sale_time` (`'HH:MM:SS'`)
  - `customer_id`, `customer_name`
  - `items_summary` (TEXT), `items_json` (TEXT — structured array `[{productId, name, qty, tier, piecesPerUnit, unitPrice, lineTotal}]`)
  - `total_amount`, `total_cost`, `profit`, `amount_paid`, `change_given`, `balance`
  - `payment_method` (`'Cash'|'Bank Transfer'|'POS/Card'|'Other'`)
  - `status` (`'Completed'` | `'Refunded'` | `'Partial Refund'`)
  - `employee_name`, `created_at`

- **`provision_returns` (NEW — Refunds / Sales Returns)**
  - `id`, `tenant_id`, `sale_id`, `invoice_number`, `return_date`, `return_time`
  - `product_id`, `product_name`, `quantity_pieces`, `refund_amount`, `reason`, `recorded_by`
  - *Rule:* Refunding a sale or item atomically restores `stock_quantity` in `provision_products`, logs a `'Return'` in `provision_movements`, adjusts the sale's revenue/profit (and customer debt if bought on credit), and writes to `audit_logs`.

- **`provision_drawer_sessions` (NEW — POS Physical Drawer Cash Tracking)**
  - `id`, `tenant_id`, `tx_date` (`'YYYY-MM-DD'`), `open_time`, `opening_cash`, `opened_by`
  - `close_time`, `expected_cash`, `counted_cash`, `variance`, `notes`, `closed_by`, `status` (`'Open'|'Closed'`)
  - *Rule:* `Expected Drawer Cash = Opening Cash + Today's Cash Sales (Paid - Change) + Today's Cash Debt Repayments - Today's Cash Refunds - Today's Cash Expenses`.

- **`provision_customers`** (`id`, `tenant_id`, `code`, `name`, `phone`, `outstanding_balance`, `created_at`)
- **`provision_ledger`** (`id`, `tenant_id`, `tx_date`, `tx_time`, `customer_id`, `customer_name`, `transaction_type`, `debit_amount`, `credit_amount`, `reference`, `recorded_by`)
- **`provision_purchases`** (`id`, `tenant_id`, `purchase_code`, `tx_date`, `tx_time`, `product_id`, `product_name`, `unit`, `quantity`, `piece_quantity`, `cost_per_unit`, `total_amount`, `recorded_by`)
- **`provision_expenses`** (`id`, `tenant_id`, `expense_code`, `tx_date`, `tx_time`, `category`, `description`, `amount`, `recorded_by`)
- **`provision_expiry_batches`** (`id`, `tenant_id`, `product_id`, `product_name`, `batch_number`, `quantity`, `expiry_date`)
- **`provision_movements`** (`id`, `tenant_id`, `tx_date`, `tx_time`, `product_id`, `product_name`, `movement_type`, `quantity_in`, `quantity_out`, `reference`, `employee_name`)

---

### 3.3 Module 2: POS Agent Banking Tables (`banking_*`)
- **`banking_settings`** (`id`, `tenant_id`, `transaction_type`, `default_charge`)
- **`banking_providers`** (`id`, `tenant_id`, `provider_name`)
- **`banking_float`** (`id`, `tenant_id`, `tx_date`, `tx_time`, `opening_cash`, `opening_float`, `opened_by`)
- **`banking_day_close`** (`id`, `tenant_id`, `tx_date`, `tx_time`, `expected_cash`, `counted_cash`, `variance`, `expected_float`, `notes`, `closed_by`)
- **`banking_transactions`** (`id`, `tenant_id`, `transaction_code`, `tx_date`, `tx_time`, `customer_name`, `customer_phone`, `type`, `provider`, `amount`, `charge`, `charge_source`, `cash_delta`, `float_delta`, `status`, `notes`, `recorded_by`)
- **`banking_expenses`** (`id`, `tenant_id`, `expense_code`, `tx_date`, `tx_time`, `category`, `description`, `amount`, `recorded_by`)

---

### 3.4 Module 3: Laundry Service Tables (`laundry_*`)
- **`laundry_settings`** (`id`, `tenant_id`, `item_type`, `default_price`)
- **`laundry_orders`** (`id`, `tenant_id`, `order_number`, `date_received`, `time_received`, `customer_id`, `customer_name`, `customer_phone`, `total_amount`, `amount_paid`, `balance`, `payment_method`, `order_status`, `expected_ready_date`, `date_collected`, `time_collected`, `collected_by`, `received_by`, `notes`)
- **`laundry_order_items`** (`id`, `tenant_id`, `order_id`, `item_type`, `quantity`, `unit_price`, `subtotal`, `special_instructions`)
- **`laundry_customers`** (`id`, `tenant_id`, `customer_code`, `name`, `phone`, `total_orders`, `total_spent`, `last_visit_date`)
- **`laundry_payments`** (`id`, `tenant_id`, `order_id`, `order_number`, `tx_date`, `tx_time`, `amount`, `payment_method`, `recorded_by`)
- **`laundry_expenses`** (`id`, `tenant_id`, `expense_code`, `tx_date`, `tx_time`, `category`, `description`, `amount`, `recorded_by`)

---

## 4. SYSTEM-WIDE FEATURES & UX REQUIREMENTS

1. **White-Label Branding Engine (`Shop Settings`):**
   - Public Login screen fetches `getPublicBranding()` to display the Tenant's custom Logo and Shop Name before login.
   - Sidebar header, mobile topbar, page title, currency symbols (`₦`, `$`, `₵`), invoice prefixes (`INV-`), and thermal receipts dynamically reflect the Tenant's saved settings.
2. **Thermal Receipt Printer Engine (`320px` Print-Isolated View):**
   - Used in POS Checkout and Sales History (`Reprint`).
   - Uses `@media print` isolation so clicking `Print Receipt` prints *only* the formatted 80mm thermal receipt (Logo, Shop Name, Address, Tel, Invoice #, Date/Time, Cashier, Customer, Itemized Table, Totals, Custom Footer).
3. **Bilingual I18n Engine (`English <-> Hausa`):**
   - 1-click toggle in the sidebar (`EN | Hausa`) persisted in `localStorage`, translating navigation, labels, statuses, and table headers across the entire app.
4. **Theme Engine (`Light <-> Dark Mode`):**
   - First-class Tailwind dark mode (`dark:` classes + CSS variables) persisted in `localStorage`, automatically adapting Chart.js axes and cards.
5. **Interactive Charts (`Chart.js`):**
   - Provision Dashboard: Monthly Sales Trend (Line), Today's Payment Breakdown (Doughnut), Monthly Profit Trend (Line), Inventory Status (Doughnut).
   - Provision Reports: Sales vs. Profit (Bar), Profit Margin % (Line).

---

## 5. COMPLETE PAGE & PERMISSION CATALOG

| Section | Page Key | Page Title | Default Roles | Cashier Default (V/A/E/D) |
| :--- | :--- | :--- | :--- | :--- |
| **OVERVIEW** | `home` | Home / Shift Summary | Owner, Cashier | `V:1, A:0, E:0, D:0` |
| **OVERVIEW** | `dashboard` | Executive Dashboard | Owner | `V:0, A:0, E:0, D:0` |
| **PROVISION** | `pos` | POS Terminal & Drawer | Owner, Cashier | `V:1, A:1, E:0, D:0` |
| **PROVISION** | `saleshistory` | Sales History & Refunds | Owner, Cashier | `V:1, A:0, E:0, D:0` |
| **PROVISION** | `inventory` | Inventory Status | Owner, Cashier | `V:1, A:0, E:0, D:0` |
| **PROVISION** | `products` | Products Master | Owner | `V:0, A:0, E:0, D:0` |
| **PROVISION** | `purchases` | Supplier Purchases | Owner, Cashier | `V:1, A:1, E:0, D:0` |
| **PROVISION** | `customers` | Customers & Debt | Owner, Cashier | `V:1, A:1, E:0, D:0` |
| **PROVISION** | `ledger` | Credit Ledger | Owner, Cashier | `V:1, A:1, E:0, D:0` |
| **PROVISION** | `expenses` | Store Expenses | Owner | `V:0, A:0, E:0, D:0` |
| **PROVISION** | `stocktools` | Stock & Expiry Tools | Owner | `V:0, A:0, E:0, D:0` |
| **PROVISION** | `reports` | Financial Reports | Owner | `V:0, A:0, E:0, D:0` |
| **SYSTEM** | `employees` | Staff Management | Owner | `V:0, A:0, E:0, D:0` |
| **SYSTEM** | `permissions` | Roles & Permissions | Owner | `V:0, A:0, E:0, D:0` |
| **SYSTEM** | `auditlog` | Audit Log | Owner | `V:0, A:0, E:0, D:0` |
| **SYSTEM** | `settings` | Shop Settings & Logo | Owner | `V:0, A:0, E:0, D:0` |
| **SYSTEM** | `about` | About & System Rules | Owner, Cashier | `V:1, A:0, E:0, D:0` |

---

## 6. Offline-First PWA & Recovery Architecture
Yes! By adding a Web App Manifest (manifest.webmanifest) and a Service Worker to our Vite build:
Shop owners and cashiers can click "Install AmanaHQ" on Android, iPhone, Windows, or Linux (like your Arch KDE desktop!).
It installs a standalone app icon on their desktop/home screen, opens fullscreen without any browser URL bar, and loads the app shell even when the Wi-Fi/data is completely off!