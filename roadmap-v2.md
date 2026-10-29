```
================================================================================
AMANAHQ V2.0 — MASTER ROADMAP
================================================================================

[MILESTONE 1] Multi-Tenant Database & Core Security Engine
├── 1.1 Unified SQL Schema (Tenants, RBAC Overrides, AuditLog, Refunds,
│       Drawer Cash, Provision, Banking, and Laundry tables).
├── 1.2 Rich Multi-Module Seed Data (Tenant #1: Al Ameen Business System).
└── 1.3 Core Backend API: Salted SHA-256 PINs, Brute-force lock, Owner
Master Recovery Key, Public Branding API, and RBAC Gateway.

[MILESTONE 2] The AmanaHQ v2 App Shell, I18n, Theme & Offline PWA
├── 2.1 Global UI & Branding Store (Light/Dark class toggle, EN <-> Hausa
│       translation engine, Dynamic Shop Name/Logo/Currency).
├── 2.2 Offline Outbox Engine (0ms cached reads + offline queue for sales).
├── 2.3 Responsive Command Rail Layout (Desktop Sidebar + Mobile Bottom Bar
│       + Module Switcher Pill filtered by Tenant's enabled modules).
└── 2.4 Upgraded Login Screen (Public Tenant Logo + "Forgot PIN?" Recovery).

[MILESTONE 3] Provision Store v2 Upgrade (All New Store Features)
├── 3.1 POS Terminal v2: Physical Drawer Cash (Open/Close/Variance),
│       Mobile Bottom Cart Drawer, and 80mm Print-Isolated Thermal Receipt.
├── 3.2 Sales History, Receipt Reprints & Atomic Refunds/Returns Page.
└── 3.3 Executive Dashboard & Reports v2 (Interactive Trend & Doughnut Charts).

[MILESTONE 4] Laundry Service Module (Completing Module #3)
├── 4.1 Laundry Backend Router (Orders, Multi-Item Pricing, Status Pipeline,
│       Cash-Basis Payment Ledger, Overdue Engine, Settings & Reports).
└── 4.2 Laundry Frontend Views (Overview with Overdue Banner, Order Intake
& Status Manager, Customers, Ledger, Expenses, Settings, Reports).

[MILESTONE 5] System Admin, RBAC Matrix, White-Label Settings & SuperAdmin
├── 5.1 Staff Management (Add/Edit Staff, Reset PIN, Last-Owner Lock Guard).
├── 5.2 Interactive Roles & Permissions Matrix (V/A/E/D Toggles per Staff).
├── 5.3 Audit Log (Searchable, Action-Tag Color Coded, Paginated).
├── 5.4 White-Label Shop Settings (256px Logo Uploader, Receipt/Currency
│       Customizer, PIN Hash Migrator) + Built-in About/Rules Page.
└── 5.5 Karem's SuperAdmin Console (/superadmin — Create Business Tenants,
Toggle Enabled Modules, Manage Subscriptions & Recovery Keys).
================================================================================
```