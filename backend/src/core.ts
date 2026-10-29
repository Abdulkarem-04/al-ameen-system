import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const core = new Hono<{ Bindings: Bindings }>();

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 8);

// In-memory brute-force login throttle (5 failed attempts -> 15 min lock)
const loginFailures: Record<string, { count: number; lockedUntil: number }> =
  {};

// ============================================================================
// 1. SALTED SHA-256 PIN CRYPTOGRAPHY (Web Crypto API)
// ============================================================================
async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function makePinHash(pin: string): Promise<string> {
  const salt = (crypto.randomUUID() + crypto.randomUUID())
    .replace(/-/g, '')
    .slice(0, 32);
  const digest = await sha256Hex(salt + String(pin).trim());
  return `sha256$${salt}$${digest}`;
}

export function isPinHashed(stored: string): boolean {
  return String(stored || '').startsWith('sha256$');
}

export async function verifyPin(
  pin: string,
  stored: string,
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  const cleanPin = String(pin || '').trim();
  const cleanStored = String(stored || '').trim();

  if (cleanStored.startsWith('sha256$')) {
    const parts = cleanStored.split('$');
    if (parts.length !== 3) return { ok: false, needsUpgrade: false };
    const digest = await sha256Hex(parts[1] + cleanPin);
    return { ok: digest === parts[2], needsUpgrade: false };
  }

  // Legacy plaintext PIN fallback -> upgrades automatically on login
  return {
    ok: cleanPin === cleanStored,
    needsUpgrade: cleanPin === cleanStored,
  };
}

// ============================================================================
// 2. AUDIT LOG HELPER
// ============================================================================
export async function writeAuditLog(
  db: D1Database,
  employeeName: string,
  actionType: string,
  details: string,
  tenantId = 'TENANT-001',
) {
  try {
    await db
      .prepare(
        `
      INSERT INTO audit_logs (id, tenant_id, tx_date, tx_time, employee_name, action_type, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        crypto.randomUUID(),
        tenantId,
        todayStr(),
        nowTimeStr(),
        employeeName || 'System',
        actionType,
        details,
      )
      .run();
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// ============================================================================
// 3. GRANULAR RBAC PERMISSION CATALOG & EFFECTIVE RESOLVER
// ============================================================================
export const PERMISSION_PAGES = [
  { key: 'home', section: 'OVERVIEW', label: 'Home / Shift Summary' },
  { key: 'dashboard', section: 'OVERVIEW', label: 'Executive Dashboard' },
  { key: 'pos', section: 'PROVISION STORE', label: 'POS Terminal & Drawer' },
  {
    key: 'saleshistory',
    section: 'PROVISION STORE',
    label: 'Sales History & Refunds',
  },
  { key: 'inventory', section: 'PROVISION STORE', label: 'Inventory Status' },
  { key: 'products', section: 'PROVISION STORE', label: 'Products Master' },
  { key: 'purchases', section: 'PROVISION STORE', label: 'Supplier Purchases' },
  { key: 'customers', section: 'PROVISION STORE', label: 'Customers & Debt' },
  {
    key: 'ledger',
    section: 'PROVISION STORE',
    label: 'Customer Credit Ledger',
  },
  { key: 'expenses', section: 'PROVISION STORE', label: 'Store Expenses' },
  {
    key: 'stocktools',
    section: 'PROVISION STORE',
    label: 'Stock & Expiry Tools',
  },
  { key: 'reports', section: 'PROVISION STORE', label: 'Provision Reports' },
  {
    key: 'banking_dashboard',
    section: 'POS AGENT BANKING',
    label: 'Banking Overview',
  },
  {
    key: 'banking_transactions',
    section: 'POS AGENT BANKING',
    label: 'Banking Transactions',
  },
  {
    key: 'banking_cashfloat',
    section: 'POS AGENT BANKING',
    label: 'Cash & Float Management',
  },
  {
    key: 'banking_customers',
    section: 'POS AGENT BANKING',
    label: 'Banking Repeat Customers',
  },
  {
    key: 'banking_expenses',
    section: 'POS AGENT BANKING',
    label: 'Banking Expenses',
  },
  {
    key: 'banking_settings',
    section: 'POS AGENT BANKING',
    label: 'Banking Settings',
  },
  {
    key: 'banking_reports',
    section: 'POS AGENT BANKING',
    label: 'Banking Reports',
  },
  {
    key: 'laundry_dashboard',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Overview',
  },
  {
    key: 'laundry_orders',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Orders',
  },
  {
    key: 'laundry_customers',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Customers',
  },
  {
    key: 'laundry_ledger',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Payment Ledger',
  },
  {
    key: 'laundry_expenses',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Expenses',
  },
  {
    key: 'laundry_settings',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Price List',
  },
  {
    key: 'laundry_reports',
    section: 'LAUNDRY SERVICE',
    label: 'Laundry Reports',
  },
  { key: 'employees', section: 'SYSTEM', label: 'Staff Management' },
  { key: 'permissions', section: 'SYSTEM', label: 'Roles & Permissions' },
  { key: 'auditlog', section: 'SYSTEM', label: 'Audit Log' },
  { key: 'settings', section: 'SYSTEM', label: 'Shop Settings & Branding' },
  { key: 'about', section: 'SYSTEM', label: 'About & System Rules' },
];

const CASHIER_DEFAULTS: Record<
  string,
  { view: boolean; add: boolean; edit: boolean; delete: boolean }
> = {
  home: { view: true, add: false, edit: false, delete: false },
  pos: { view: true, add: true, edit: false, delete: false },
  saleshistory: { view: true, add: false, edit: false, delete: false },
  inventory: { view: true, add: false, edit: false, delete: false },
  purchases: { view: true, add: true, edit: false, delete: false },
  customers: { view: true, add: true, edit: false, delete: false },
  ledger: { view: true, add: true, edit: false, delete: false },
  banking_transactions: { view: true, add: true, edit: true, delete: false },
  banking_cashfloat: { view: true, add: true, edit: false, delete: false },
  banking_customers: { view: true, add: false, edit: false, delete: false },
  laundry_orders: { view: true, add: true, edit: true, delete: false },
  laundry_customers: { view: true, add: true, edit: false, delete: false },
  laundry_ledger: { view: true, add: true, edit: false, delete: false },
  about: { view: true, add: false, edit: false, delete: false },
};

async function computeEffectivePermissions(
  db: D1Database,
  employeeId: string,
  role: string,
) {
  const isOwnerOrSuper = role === 'Owner' || role === 'SuperAdmin';
  const { results } = await db
    .prepare(`SELECT * FROM permission_overrides WHERE employee_id = ?`)
    .bind(employeeId)
    .all<any>();

  const overrideMap: Record<string, any> = {};
  (results || []).forEach((r) => {
    overrideMap[r.page_key] = {
      view: Boolean(r.can_view),
      add: Boolean(r.can_add),
      edit: Boolean(r.can_edit),
      delete: Boolean(r.can_delete),
    };
  });

  const matrix: Record<string, any> = {};
  PERMISSION_PAGES.forEach((p) => {
    if (isOwnerOrSuper) {
      matrix[p.key] = {
        view: true,
        add: true,
        edit: true,
        delete: true,
        overridden: false,
        locked: true,
      };
    } else if (overrideMap[p.key]) {
      const o = overrideMap[p.key];
      matrix[p.key] = { ...o, overridden: true, locked: false };
    } else {
      const d = CASHIER_DEFAULTS[p.key] || {
        view: false,
        add: false,
        edit: false,
        delete: false,
      };
      matrix[p.key] = { ...d, overridden: false, locked: false };
    }
  });

  return matrix;
}

// ============================================================================
// 4. AUTHENTICATION, LOGIN & OWNER PIN RECOVERY
// ============================================================================
core.post('/login', async (c) => {
  try {
    const { code, pin } = await c.req.json();
    const cleanCode = String(code || '')
      .trim()
      .toUpperCase();
    const cleanPin = String(pin || '').trim();

    if (!cleanCode || !cleanPin) {
      return c.json(
        { success: false, error: 'Employee code and PIN are required.' },
        400,
      );
    }

    const lock = loginFailures[cleanCode];
    if (lock && lock.count >= 5 && Date.now() < lock.lockedUntil) {
      return c.json(
        {
          success: false,
          error: 'Too many wrong attempts. Try again in 15 minutes.',
        },
        429,
      );
    }

    const employee: any = await c.env.DB.prepare(
      `SELECT * FROM employees WHERE UPPER(code) = ?`,
    )
      .bind(cleanCode)
      .first();

    if (!employee) {
      loginFailures[cleanCode] = {
        count: (lock?.count || 0) + 1,
        lockedUntil: Date.now() + 15 * 60 * 1000,
      };
      return c.json(
        { success: false, error: 'Invalid employee code or PIN.' },
        401,
      );
    }

    if (employee.status !== 'Active') {
      return c.json(
        {
          success: false,
          error: 'This account has been deactivated. Contact the shop owner.',
        },
        403,
      );
    }

    const check = await verifyPin(cleanPin, employee.pin_hash);
    if (!check.ok) {
      loginFailures[cleanCode] = {
        count: (lock?.count || 0) + 1,
        lockedUntil: Date.now() + 15 * 60 * 1000,
      };
      return c.json(
        { success: false, error: 'Invalid employee code or PIN.' },
        401,
      );
    }

    // Clear failed attempts
    delete loginFailures[cleanCode];

    // Seamless upgrade: hash legacy plaintext PIN on login
    if (check.needsUpgrade) {
      const hashed = await makePinHash(cleanPin);
      await c.env.DB.prepare(`UPDATE employees SET pin_hash = ? WHERE id = ?`)
        .bind(hashed, employee.id)
        .run();
    }

    const tenantId = employee.tenant_id || 'TENANT-001';
    const tenant: any = await c.env.DB.prepare(
      `SELECT * FROM tenants WHERE id = ?`,
    )
      .bind(tenantId)
      .first();

    if (
      tenant &&
      tenant.subscription_status === 'Suspended' &&
      employee.role !== 'SuperAdmin'
    ) {
      return c.json(
        {
          success: false,
          error:
            'This workspace subscription is currently suspended. Contact AmanaHQ support.',
        },
        403,
      );
    }

    const permissions = await computeEffectivePermissions(
      c.env.DB,
      employee.id,
      employee.role,
    );
    const token = crypto.randomUUID();

    await writeAuditLog(
      c.env.DB,
      employee.name,
      'Login',
      `Logged in (role: ${employee.role})`,
      tenantId,
    );

    return c.json({
      success: true,
      data: {
        token,
        session: {
          employeeId: employee.id,
          employeeCode: employee.code,
          name: employee.name,
          role: employee.role,
          branchId: employee.branch_id,
          tenantId,
          permissions,
        },
        tenant: tenant
          ? {
              id: tenant.id,
              shopName: tenant.shop_name,
              tagline: tenant.tagline,
              phone: tenant.phone,
              address: tenant.address,
              currencySymbol: tenant.currency_symbol || '₦',
              receiptFooter: tenant.receipt_footer,
              invoicePrefix: tenant.invoice_prefix,
              receiptPrefix: tenant.receipt_prefix,
              lowStockDefault: tenant.low_stock_default,
              logoDataUrl: tenant.logo_data_url,
              enabledModules: JSON.parse(
                tenant.enabled_modules || '["provision"]',
              ),
              subscriptionStatus: tenant.subscription_status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Internal server error.' }, 500);
  }
});

// POST: Owner PIN Recovery via Master Recovery Key
core.post('/recover-pin', async (c) => {
  try {
    const { code, recoveryKey, newPin } = await c.req.json();
    const cleanCode = String(code || '')
      .trim()
      .toUpperCase();
    const cleanKey = String(recoveryKey || '')
      .trim()
      .toUpperCase();
    const cleanPin = String(newPin || '').trim();

    if (!cleanCode || !cleanKey || !/^\d{4}$/.test(cleanPin)) {
      return c.json(
        {
          success: false,
          error:
            'Enter your Employee Code, Master Recovery Key, and a valid 4-digit new PIN.',
        },
        400,
      );
    }

    const emp: any = await c.env.DB.prepare(
      `SELECT * FROM employees WHERE UPPER(code) = ?`,
    )
      .bind(cleanCode)
      .first();
    if (!emp || (emp.role !== 'Owner' && emp.role !== 'SuperAdmin')) {
      return c.json(
        {
          success: false,
          error:
            'Master Recovery Key can only reset an Owner account. Cashiers should ask their Shop Owner.',
        },
        403,
      );
    }

    const tenant: any = await c.env.DB.prepare(
      `SELECT * FROM tenants WHERE id = ?`,
    )
      .bind(emp.tenant_id || 'TENANT-001')
      .first();
    if (
      !tenant ||
      String(tenant.master_recovery_key).trim().toUpperCase() !== cleanKey
    ) {
      return c.json(
        { success: false, error: 'Invalid Master Recovery Key.' },
        401,
      );
    }

    const hashed = await makePinHash(cleanPin);
    await c.env.DB.prepare(`UPDATE employees SET pin_hash = ? WHERE id = ?`)
      .bind(hashed, emp.id)
      .run();
    delete loginFailures[cleanCode];

    await writeAuditLog(
      c.env.DB,
      emp.name,
      'Owner PIN Recovery',
      `Owner PIN reset using Master Recovery Key`,
      tenant.id,
    );

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to recover PIN.' }, 500);
  }
});

// GET: Public Branding (Used on Login screen before sign-in)
core.get('/public-branding', async (c) => {
  const tenantId = c.req.query('tenantId') || 'TENANT-001';
  const tenant: any = await c.env.DB.prepare(
    `SELECT shop_name, tagline, logo_data_url, currency_symbol FROM tenants WHERE id = ?`,
  )
    .bind(tenantId)
    .first();

  return c.json({
    success: true,
    data: tenant || {
      shop_name: 'Al Ameen Business System',
      tagline: '',
      logo_data_url: '',
      currency_symbol: '₦',
    },
  });
});

// Helper: Resolve active Tenant ID from header, query, or body
const getTenantId = (c: any, body?: any) => {
  return c.req.header('X-Tenant-Id') || body?.tenantId || c.req.query('tenantId') || 'TENANT-001';
};

// ============================================================================
// 5. UNIFIED HOME SUMMARY (STRICTLY ISOLATED BY TENANT)
// ============================================================================
core.get('/home-summary', async (c) => {
  const tenantId = getTenantId(c);
  const provBranch = tenantId === 'TENANT-001' ? 'BR001' : `${tenantId}_PROV`;
  const bankBranch = tenantId === 'TENANT-001' ? 'BR002' : `${tenantId}_BANK`;
  const launBranch = tenantId === 'TENANT-001' ? 'BR003' : `${tenantId}_LAUN`;
  const today = todayStr();

  try {
    const [salesRes, prodsRes, custsRes, bankFloat, bankTxRes, lauOrdRes, lauPayRes] = await Promise.all([
      c.env.DB.prepare(`SELECT * FROM provision_sales WHERE branch_id = ? AND date(created_at) = ? AND status != 'Refunded'`).bind(provBranch, today).all<any>(),
      c.env.DB.prepare(`SELECT * FROM provision_products WHERE branch_id = ? AND status = 'Active'`).bind(provBranch).all<any>(),
      c.env.DB.prepare(`SELECT * FROM provision_customers WHERE branch_id = ?`).bind(provBranch).all<any>(),
      c.env.DB.prepare(`SELECT * FROM banking_float WHERE branch_id = ? AND tx_date = ?`).bind(bankBranch, today).first<any>(),
      c.env.DB.prepare(`SELECT * FROM banking_transactions WHERE branch_id = ? AND tx_date = ? AND status = 'Successful'`).bind(bankBranch, today).all<any>(),
      c.env.DB.prepare(`SELECT * FROM laundry_orders WHERE branch_id = ? AND order_status != 'Cancelled'`).bind(launBranch).all<any>(),
      c.env.DB.prepare(`SELECT * FROM laundry_payments WHERE branch_id = ? AND tx_date = ?`).bind(launBranch, today).all<any>(),
    ]);

    const todaySales = salesRes.results || [];
    const prods = prodsRes.results || [];
    const custs = custsRes.results || [];
    const bankTxs = bankTxRes.results || [];
    const lauOrders = lauOrdRes.results || [];
    const lauPays = lauPayRes.results || [];

    const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);

    const lowStock = prods.filter((p) => Number(p.stock_quantity) <= Number(p.reorder_level)).length;
    const outOfStock = prods.filter((p) => Number(p.stock_quantity) <= 0).length;

    const cashDelta = sum(bankTxs, 'cash_delta');
    const floatDelta = sum(bankTxs, 'float_delta');

    const lauOutstandingOrders = lauOrders.filter((o) => Number(o.balance) > 0);
    const lauOverdueOrders = lauOrders.filter(
      (o) => o.order_status !== 'Collected' && o.expected_ready_date && o.expected_ready_date < today
    );

    return c.json({
      success: true,
      data: {
        date: today,
        provision: {
          todaySales: sum(todaySales, 'total_amount'),
          todayProfit: sum(todaySales, 'profit'),
          todaySalesCount: todaySales.length,
          lowStock,
          outOfStock,
          customerDebtTotal: sum(custs, 'outstanding_balance'),
        },
        banking: {
          dayOpened: Boolean(bankFloat),
          cashNow: bankFloat ? Number(bankFloat.opening_cash) + cashDelta : null,
          floatNow: bankFloat ? Number(bankFloat.opening_float) + floatDelta : null,
          todayTxCount: bankTxs.length,
          todayCharges: sum(bankTxs, 'charge'),
        },
        laundry: {
          todayOrders: lauOrders.filter((o) => o.date_received === today).length,
          todayRevenue: sum(lauPays, 'amount'),
          outstandingBalance: sum(lauOutstandingOrders, 'balance'),
          outstandingCount: lauOutstandingOrders.length,
          overdueCount: lauOverdueOrders.length,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Failed to load home summary' }, 500);
  }
});

// ============================================================================
// 6. EMPLOYEE MANAGEMENT (STRICTLY SCOPED TO TENANT_ID)
// ============================================================================
core.get('/employees', async (c) => {
  const tenantId = getTenantId(c);
  const { results } = await c.env.DB.prepare(
    `SELECT id, tenant_id, code, name, role, phone, branch_id, status, created_at
     FROM employees
     WHERE tenant_id = ? AND role != 'SuperAdmin'
     ORDER BY created_at ASC`
  ).bind(tenantId).all();
  return c.json({ success: true, data: results || [] });
});

core.post('/employees', async (c) => {
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const code = String(body.code || '').trim().toUpperCase();
  const name = String(body.name || '').trim();
  const role = body.role === 'Owner' ? 'Owner' : 'Cashier';
  const pin = String(body.pin || '').trim();

  if (!code || !name || !/^\d{4}$/.test(pin)) {
    return c.json({ success: false, error: 'Code, Name, and a 4-digit PIN are required.' }, 400);
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM employees WHERE UPPER(code) = ?`).bind(code).first();
  if (existing) return c.json({ success: false, error: 'An employee with this code already exists.' }, 400);

  const id = crypto.randomUUID();
  const pinHash = await makePinHash(pin);

  await c.env.DB.prepare(`
    INSERT INTO employees (id, tenant_id, code, name, role, phone, pin_hash, branch_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `).bind(id, tenantId, code, name, role, body.phone || '', pinHash, body.branchId || 'ALL').run();

  await writeAuditLog(c.env.DB, body.actorName || 'Owner', 'Add Employee', `${code} — ${name} (${role})`, tenantId);
  return c.json({ success: true, data: { id } });
});

core.put('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  await c.env.DB.prepare(`
    UPDATE employees SET name = ?, role = ?, phone = ?, branch_id = ? WHERE id = ? AND tenant_id = ?
  `).bind(body.name, body.role, body.phone || '', body.branchId || 'ALL', id, tenantId).run();

  await writeAuditLog(c.env.DB, body.actorName || 'Owner', 'Edit Employee', `Updated ${body.name}`, tenantId);
  return c.json({ success: true });
});

core.patch('/employees/:id/pin', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const { newPin, actorName } = body;
  if (!/^\d{4}$/.test(String(newPin || '').trim())) {
    return c.json({ success: false, error: 'PIN must be exactly 4 digits.' }, 400);
  }
  const hashed = await makePinHash(String(newPin).trim());
  await c.env.DB.prepare(`UPDATE employees SET pin_hash = ? WHERE id = ? AND tenant_id = ?`).bind(hashed, id, tenantId).run();
  await writeAuditLog(c.env.DB, actorName || 'Owner', 'Reset Employee PIN', `Reset PIN for employee ${id}`, tenantId);
  return c.json({ success: true });
});

core.patch('/employees/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const { status, actorName } = body;

  if (status === 'Inactive') {
    const emp: any = await c.env.DB.prepare(`SELECT * FROM employees WHERE id = ? AND tenant_id = ?`).bind(id, tenantId).first();
    if (emp && emp.role === 'Owner') {
      const otherOwners = await c.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM employees WHERE tenant_id = ? AND role = 'Owner' AND status = 'Active' AND id != ?`
      ).bind(tenantId, id).first<any>();
      if (!otherOwners || Number(otherOwners.cnt) === 0) {
        return c.json({ success: false, error: 'Cannot deactivate the last Active Owner of this business.' }, 400);
      }
    }
  }

  await c.env.DB.prepare(`UPDATE employees SET status = ? WHERE id = ? AND tenant_id = ?`).bind(status, id, tenantId).run();
  await writeAuditLog(c.env.DB, actorName || 'Owner', 'Set Employee Status', `Status -> ${status}`, tenantId);
  return c.json({ success: true });
});

core.post('/employees/migrate-pins', async (c) => {
  const tenantId = getTenantId(c);
  const { results } = await c.env.DB.prepare(`SELECT id, pin_hash FROM employees WHERE tenant_id = ?`).bind(tenantId).all<any>();
  let migrated = 0;
  let alreadySecure = 0;

  for (const emp of results || []) {
    if (isPinHashed(emp.pin_hash)) {
      alreadySecure++;
    } else if (/^\d{4}$/.test(String(emp.pin_hash).trim())) {
      const hashed = await makePinHash(String(emp.pin_hash).trim());
      await c.env.DB.prepare(`UPDATE employees SET pin_hash = ? WHERE id = ?`).bind(hashed, emp.id).run();
      migrated++;
    }
  }
  await writeAuditLog(c.env.DB, 'Owner', 'Migrate PINs to Hash', `${migrated} secured, ${alreadySecure} already secure`, tenantId);
  return c.json({ success: true, data: { migrated, alreadySecure } });
});

// ============================================================================
// 7. ROLES & PERMISSIONS MATRIX (SCOPED TO TENANT_ID)
// ============================================================================
core.get('/permissions/matrix', async (c) => {
  const tenantId = getTenantId(c);
  const { results: emps } = await c.env.DB.prepare(
    `SELECT id, code, name, role, branch_id FROM employees WHERE tenant_id = ? AND status = 'Active' AND role != 'SuperAdmin' ORDER BY created_at ASC`
  ).bind(tenantId).all<any>();

  const employees = (emps || []).map((e) => ({
    employeeId: e.id,
    employeeCode: e.code,
    name: e.name,
    role: e.role,
    branchId: e.branch_id,
    locked: e.role === 'Owner',
  }));

  const matrix: Record<string, any> = {};
  for (const emp of employees) {
    matrix[emp.employeeId] = await computeEffectivePermissions(c.env.DB, emp.employeeId, emp.role);
  }

  return c.json({ success: true, data: { pages: PERMISSION_PAGES, employees, matrix } });
});

core.put('/permissions/cell', async (c) => {
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const { employeeId, pageKey, action, value, actorName } = body;

  const emp: any = await c.env.DB.prepare(`SELECT * FROM employees WHERE id = ? AND tenant_id = ?`).bind(employeeId, tenantId).first();
  if (!emp) return c.json({ success: false, error: 'Employee not found.' }, 404);
  if (emp.role === 'Owner') return c.json({ success: false, error: 'Owner permissions are locked.' }, 400);

  const current = (await computeEffectivePermissions(c.env.DB, employeeId, emp.role))[pageKey];
  if (!current) return c.json({ success: false, error: 'Unknown page key.' }, 400);

  current[action] = Boolean(value);

  await c.env.DB.prepare(`
    INSERT INTO permission_overrides (id, tenant_id, employee_id, page_key, can_view, can_add, can_edit, can_delete, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id, page_key) DO UPDATE SET
      can_view = excluded.can_view,
      can_add = excluded.can_add,
      can_edit = excluded.can_edit,
      can_delete = excluded.can_delete,
      updated_by = excluded.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    crypto.randomUUID(), tenantId, employeeId, pageKey,
    current.view ? 1 : 0, current.add ? 1 : 0, current.edit ? 1 : 0, current.delete ? 1 : 0,
    actorName || 'Owner'
  ).run();

  await writeAuditLog(c.env.DB, actorName || 'Owner', 'Set Permission', `${emp.name} — ${pageKey}/${String(action).toUpperCase()} -> ${value ? 'ON' : 'OFF'}`, tenantId);
  return c.json({ success: true, data: current });
});

core.post('/permissions/reset', async (c) => {
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const { employeeId, actorName } = body;
  await c.env.DB.prepare(`DELETE FROM permission_overrides WHERE employee_id = ? AND tenant_id = ?`).bind(employeeId, tenantId).run();
  await writeAuditLog(c.env.DB, actorName || 'Owner', 'Reset Permissions', `Reset employee ${employeeId} to Cashier defaults`, tenantId);
  return c.json({ success: true });
});

// ============================================================================
// 8. AUDIT LOGS & SHOP SETTINGS (SCOPED TO TENANT_ID)
// ============================================================================
core.get('/audit-logs', async (c) => {
  const tenantId = getTenantId(c);
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY tx_date DESC, tx_time DESC, created_at DESC LIMIT 300`
  ).bind(tenantId).all();
  return c.json({ success: true, data: results || [] });
});

core.get('/settings', async (c) => {
  const tenantId = getTenantId(c);
  const tenant = await c.env.DB.prepare(`SELECT * FROM tenants WHERE id = ?`).bind(tenantId).first();
  return c.json({ success: true, data: tenant });
});

core.put('/settings', async (c) => {
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  if (!String(body.shop_name || '').trim()) {
    return c.json({ success: false, error: 'Shop name is required.' }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE tenants SET
      shop_name = ?, tagline = ?, phone = ?, address = ?,
      currency_symbol = ?, receipt_footer = ?, invoice_prefix = ?,
      receipt_prefix = ?, low_stock_default = ?
    WHERE id = ?
  `).bind(
    body.shop_name.trim(), body.tagline || '', body.phone || '', body.address || '',
    body.currency_symbol || '₦', body.receipt_footer || '', body.invoice_prefix || 'INV-',
    body.receipt_prefix || 'RCP-', Number(body.low_stock_default) || 5, tenantId
  ).run();

  await writeAuditLog(c.env.DB, body.actorName || 'Owner', 'Update Shop Settings', `Shop name: ${body.shop_name}`, tenantId);
  return c.json({ success: true });
});

core.post('/settings/logo', async (c) => {
  const body = await c.req.json();
  const tenantId = getTenantId(c, body);
  const { logoDataUrl, actorName } = body;
  await c.env.DB.prepare(`UPDATE tenants SET logo_data_url = ? WHERE id = ?`).bind(logoDataUrl || '', tenantId).run();
  await writeAuditLog(c.env.DB, actorName || 'Owner', 'Update Shop Logo', logoDataUrl ? 'Uploaded new logo' : 'Removed logo', tenantId);
  return c.json({ success: true });
});

// ============================================================================
// 9. KAREM'S SUPERADMIN B2B TENANT CONTROL PLANE & CREDENTIALS
// ============================================================================
core.get('/superadmin/tenants', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT * FROM tenants ORDER BY created_at DESC`).all();
  return c.json({ success: true, data: results || [] });
});

core.post('/superadmin/tenants', async (c) => {
  try {
    const body = await c.req.json();
    const id = `TENANT-${Math.floor(100 + Math.random() * 900)}`;
    const slug = String(body.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const recoveryKey = `AMANA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ownerCode = String(body.ownerCode || `OWN-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();
    const ownerName = String(body.ownerName || `${body.shopName} (Owner)`).trim();
    const ownerPin = String(body.ownerPin || '0000').trim();

    const existingEmp = await c.env.DB.prepare(`SELECT id FROM employees WHERE UPPER(code) = ?`).bind(ownerCode).first();
    if (existingEmp) {
      return c.json({ success: false, error: `Employee code ${ownerCode} is already in use. Choose another Owner Code.` }, 400);
    }

    const pinHash = await makePinHash(ownerPin);
    const bankBranch = `${id}_BANK`;
    const launBranch = `${id}_LAUN`;

    const statements = [
      c.env.DB.prepare(`
        INSERT INTO tenants (id, slug, shop_name, phone, address, enabled_modules, master_recovery_key, subscription_status, subscription_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, `${slug}-${Date.now().toString().slice(-3)}`, body.shopName, body.phone || '', body.address || '',
        JSON.stringify(body.enabledModules || ['provision']), recoveryKey,
        body.subscriptionStatus || 'Active', body.subscriptionExpiresAt || null
      ),
      c.env.DB.prepare(`
        INSERT INTO employees (id, tenant_id, code, name, role, phone, pin_hash, branch_id, status)
        VALUES (?, ?, ?, ?, 'Owner', ?, ?, 'ALL', 'Active')
      `).bind(crypto.randomUUID(), id, ownerCode, ownerName, body.phone || '', pinHash),
    ];

    // Seed default Banking charges & providers for this new tenant
    const defaultCharges: Array<[string, number]> = [
      ['Deposit', 100], ['Withdrawal', 100], ['Transfer', 50], ['Airtime', 0], ['Data', 0], ['Bill Payment', 100]
    ];
    defaultCharges.forEach(([type, chg]) => {
      statements.push(
        c.env.DB.prepare(`INSERT INTO banking_settings (id, branch_id, transaction_type, default_charge) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), bankBranch, type, chg)
      );
    });
    ['Opay', 'Moniepoint', 'PalmPay', 'FirstMonie', 'Baxi', 'Others'].forEach((prov) => {
      statements.push(
        c.env.DB.prepare(`INSERT INTO banking_providers (id, branch_id, provider_name) VALUES (?, ?, ?)`).bind(crypto.randomUUID(), bankBranch, prov)
      );
    });

    // Seed default Laundry garment types for this new tenant
    const defaultGarments: Array<[string, number]> = [
      ['Shirt', 500], ['Trouser', 500], ['Native Wear (Agbada/Kaftan)', 1000], ['Suit', 1500], ['Bedsheet', 1000], ['Blanket / Duvet', 2500]
    ];
    defaultGarments.forEach(([item, price]) => {
      statements.push(
        c.env.DB.prepare(`INSERT INTO laundry_settings (id, branch_id, item_type, default_price) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), launBranch, item, price)
      );
    });

    await c.env.DB.batch(statements);
    await writeAuditLog(c.env.DB, 'Abdulkarem (SuperAdmin)', 'Provision Tenant', `Created ${body.shopName} (${id}) — Owner: ${ownerCode}`, id);

    return c.json({ success: true, data: { id, recoveryKey, ownerCode, ownerPin } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Failed to provision tenant' }, 500);
  }
});

core.patch('/superadmin/tenants/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await c.env.DB.prepare(`
    UPDATE tenants SET
      enabled_modules = COALESCE(?, enabled_modules),
      subscription_status = COALESCE(?, subscription_status),
      subscription_expires_at = ?
    WHERE id = ?
  `).bind(
    body.enabledModules ? JSON.stringify(body.enabledModules) : null,
    body.subscriptionStatus || null,
    body.subscriptionExpiresAt ?? null,
    id
  ).run();

  return c.json({ success: true });
});

// PUT: Update SuperAdmin (KAREM) Own Login Code, Name, or 4-Digit PIN
core.put('/superadmin/credentials', async (c) => {
  try {
    const { newCode, newName, newPin } = await c.req.json();
    const cleanCode = String(newCode || '').trim().toUpperCase();
    const cleanName = String(newName || '').trim();

    if (!cleanCode || !cleanName) {
      return c.json({ success: false, error: 'SuperAdmin Code and Name are required.' }, 400);
    }

    const superEmp: any = await c.env.DB.prepare(`SELECT * FROM employees WHERE role = 'SuperAdmin' LIMIT 1`).first();
    if (!superEmp) return c.json({ success: false, error: 'SuperAdmin account not found.' }, 404);

    if (newPin && String(newPin).trim() !== '') {
      if (!/^\d{4}$/.test(String(newPin).trim())) {
        return c.json({ success: false, error: 'New PIN must be exactly 4 digits.' }, 400);
      }
      const hashed = await makePinHash(String(newPin).trim());
      await c.env.DB.prepare(`UPDATE employees SET code = ?, name = ?, pin_hash = ? WHERE id = ?`).bind(cleanCode, cleanName, hashed, superEmp.id).run();
    } else {
      await c.env.DB.prepare(`UPDATE employees SET code = ?, name = ? WHERE id = ?`).bind(cleanCode, cleanName, superEmp.id).run();
    }

    return c.json({ success: true, data: { code: cleanCode, name: cleanName } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update SuperAdmin credentials' }, 500);
  }
});

export default core;