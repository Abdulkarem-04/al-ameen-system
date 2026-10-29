import { Hono } from 'hono';
import { writeAuditLog } from './core';

type Bindings = {
  DB: D1Database;
};

const provision = new Hono<{ Bindings: Bindings }>();

// Safely resolves the isolated branch partition without modifying any headers
const resolveBranch = (branchId?: string | null, tenantId?: string | null) => {
  if (branchId && branchId.endsWith('_PROV')) return branchId;
  if (tenantId && tenantId !== 'TENANT-001') return `${tenantId}_PROV`;
  return !branchId || branchId === 'ALL' ? 'BR001' : branchId;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 8);

// Helper: Compute Live POS Drawer Cash for Today
async function computeDrawerStatus(db: D1Database, branchId: string) {
  const today = todayStr();

  const [session, salesRes, ledgerRes, returnsRes, expensesRes] =
    await Promise.all([
      db
        .prepare(
          `SELECT * FROM provision_drawer_sessions WHERE branch_id = ? AND tx_date = ?`,
        )
        .bind(branchId, today)
        .first<any>(),
      db
        .prepare(
          `SELECT * FROM provision_sales WHERE branch_id = ? AND date(created_at) = ? AND payment_method = 'Cash'`,
        )
        .bind(branchId, today)
        .all<any>(),
      db
        .prepare(
          `SELECT * FROM provision_ledger WHERE branch_id = ? AND date(created_at) = ? AND transaction_type = 'Payment' AND reference = 'Cash'`,
        )
        .bind(branchId, today)
        .all<any>(),
      db
        .prepare(
          `SELECT * FROM provision_returns WHERE branch_id = ? AND date(created_at) = ?`,
        )
        .bind(branchId, today)
        .all<any>(),
      db
        .prepare(
          `SELECT * FROM provision_expenses WHERE branch_id = ? AND date(created_at) = ?`,
        )
        .bind(branchId, today)
        .all<any>(),
    ]);

  const cashSalesNet = (salesRes.results || []).reduce((sum, s) => {
    const net = Math.max(
      0,
      (Number(s.amount_paid) || 0) - (Number(s.change_given) || 0),
    );
    return sum + net;
  }, 0);

  const cashDebtRepayments = (ledgerRes.results || []).reduce(
    (sum, l) => sum + (Number(l.credit_amount) || 0),
    0,
  );
  const cashRefunds = (returnsRes.results || []).reduce(
    (sum, r) => sum + (Number(r.refund_amount) || 0),
    0,
  );
  const cashExpenses = (expensesRes.results || []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

  const openingCash = session ? Number(session.opening_cash) || 0 : 0;
  const expectedCash =
    openingCash +
    cashSalesNet +
    cashDebtRepayments -
    cashRefunds -
    cashExpenses;

  return {
    dayOpened: Boolean(session),
    dayClosed: session?.status === 'Closed',
    openingCash,
    cashSalesNet,
    cashDebtRepayments,
    cashRefunds,
    cashExpenses,
    expectedCash,
    countedCash: session?.counted_cash ?? null,
    variance: session?.variance ?? null,
    openedBy: session?.opened_by || null,
    openTime: session?.open_time || null,
    closedBy: session?.closed_by || null,
    notes: session?.notes || '',
  };
}

// 1. PRODUCTS
provision.get('/products', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM provision_products WHERE branch_id = ? ORDER BY name ASC`,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/products', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId, c.req.header('X-Tenant-Id'));
    const id = crypto.randomUUID();
    const code = `PRD-${Math.floor(10000 + Math.random() * 90000)}`;

    await c.env.DB.prepare(
      `
      INSERT INTO provision_products (
        id, branch_id, product_code, name, unit, reorder_level, stock_quantity, 
        buying_price, selling_price, bulk_enabled, bulk_type, units_per_bulk, 
        bulk_price, expiry_tracking
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        id,
        branchId,
        code,
        body.name,
        body.unit,
        body.reorderLevel || 0,
        body.openingStock || 0,
        body.buyingPrice,
        body.sellingPrice,
        body.bulkEnabled ? 1 : 0,
        body.bulkType || null,
        body.unitsPerBulk || 0,
        body.bulkPrice || 0,
        body.expiryTracking ? 1 : 0,
      )
      .run();

    if (body.openingStock > 0) {
      await c.env.DB.prepare(
        `
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, employee_name)
        VALUES (?, ?, ?, ?, 'Opening Stock', ?, ?)
      `,
      )
        .bind(
          crypto.randomUUID(),
          branchId,
          id,
          body.name,
          body.openingStock,
          body.employeeName || 'Owner',
        )
        .run();
    }

    await writeAuditLog(
      c.env.DB,
      body.employeeName || 'Owner',
      'Add Product',
      `${code} — ${body.name}`,
      body.tenantId,
    );
    return c.json({ success: true, data: { id, code } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

provision.put('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(
      `
      UPDATE provision_products 
      SET name = ?, unit = ?, reorder_level = ?, buying_price = ?, selling_price = ?,
          bulk_enabled = ?, bulk_type = ?, units_per_bulk = ?, bulk_price = ?, expiry_tracking = ?
      WHERE id = ?
    `,
    )
      .bind(
        body.name,
        body.unit,
        Number(body.reorderLevel) || 0,
        Number(body.buyingPrice) || 0,
        Number(body.sellingPrice) || 0,
        body.bulkEnabled ? 1 : 0,
        body.bulkEnabled ? body.bulkType : null,
        body.bulkEnabled ? Number(body.unitsPerBulk) : 0,
        body.bulkEnabled ? Number(body.bulkPrice) : 0,
        body.expiryTracking ? 1 : 0,
        id,
      )
      .run();

    await writeAuditLog(
      c.env.DB,
      body.employeeName || 'Owner',
      'Edit Product',
      `Updated ${body.name}`,
      body.tenantId,
    );
    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      { success: false, error: error.message || 'Failed to update product' },
      500,
    );
  }
});

provision.patch('/products/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE provision_products SET status = ? WHERE id = ?`,
  )
    .bind(body.status, id)
    .run();
  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Owner',
    'Set Product Status',
    `${id} -> ${body.status}`,
    body.tenantId,
  );
  return c.json({ success: true });
});

// 2. POS CHECKOUT
provision.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { cart, payment, employeeName } = body;
    const tenantId =
      c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
    const branchId = resolveBranch(body.branchId, tenantId);

    if (!cart || cart.length === 0) {
      return c.json({ success: false, error: 'Cart is empty' }, 400);
    }

    const tenant: any = await c.env.DB.prepare(
      `SELECT invoice_prefix FROM tenants WHERE id = ?`,
    )
      .bind(tenantId)
      .first();
    const prefix = String(tenant?.invoice_prefix || 'INV-').replace(/-+$/, '');
    const invoiceNumber = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const saleId = crypto.randomUUID();
    const statements = [];

    let totalCost = 0;
    const itemSummaries: string[] = [];
    const itemDetails: any[] = [];

    for (const item of cart) {
      const qty = Number(item.quantity) || 1;
      const piecesPerUnit = Number(item.piecesPerUnit) || 1;
      const pieces = qty * piecesPerUnit;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = qty * unitPrice;

      totalCost += pieces * (Number(item.buyingPriceUnit) || 0);
      itemSummaries.push(
        `${item.name} x${qty} (${item.tierLabel || item.unit || 'Unit'})`,
      );
      itemDetails.push({
        id: item.id,
        name: item.name,
        qty,
        tier: item.tierLabel || item.unit || 'Unit',
        piecesPerUnit,
        unitPrice,
        lineTotal,
      });
    }

    const totalAmount = Number(payment.totalAmount) || 0;
    const amountPaid = Number(payment.amountPaid) || 0;
    const changeGiven =
      amountPaid > totalAmount
        ? Math.round((amountPaid - totalAmount) * 100) / 100
        : 0;
    const balance =
      changeGiven > 0 ? 0 : Math.round((totalAmount - amountPaid) * 100) / 100;
    const profit = totalAmount - totalCost;

    statements.push(
      c.env.DB.prepare(
        `
        INSERT INTO provision_sales (
          id, branch_id, invoice_number, customer_id, customer_name, items_summary, items_json,
          total_amount, total_cost, profit, amount_paid, change_given, balance, payment_method, status, employee_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?)
      `,
      ).bind(
        saleId,
        branchId,
        invoiceNumber,
        payment.customerId || null,
        payment.customerName || 'Walk-in',
        itemSummaries.join('; '),
        JSON.stringify(itemDetails),
        totalAmount,
        totalCost,
        profit,
        amountPaid,
        changeGiven,
        balance,
        payment.method || 'Cash',
        employeeName || 'Cashier',
      ),
    );

    for (const item of cart) {
      const pieceQty =
        (Number(item.quantity) || 1) * (Number(item.piecesPerUnit) || 1);
      const displayName =
        item.tier === 'Bulk' ? `${item.name} (${item.tierLabel})` : item.name;

      statements.push(
        c.env.DB.prepare(
          `
          INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          saleId,
          item.id,
          displayName,
          item.quantity,
          item.price,
          item.quantity * item.price,
        ),
      );

      statements.push(
        c.env.DB.prepare(
          `
          UPDATE provision_products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `,
        ).bind(pieceQty, item.id),
      );

      statements.push(
        c.env.DB.prepare(
          `
          INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_out, reference, employee_name)
          VALUES (?, ?, ?, ?, 'Sale', ?, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          branchId,
          item.id,
          item.name,
          pieceQty,
          invoiceNumber,
          employeeName || 'Cashier',
        ),
      );
    }

    if (balance > 0 && payment.customerId) {
      statements.push(
        c.env.DB.prepare(
          `
          UPDATE provision_customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?
        `,
        ).bind(balance, payment.customerId),
      );
      statements.push(
        c.env.DB.prepare(
          `
          INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by)
          VALUES (?, ?, ?, ?, 'Sale (Credit)', ?, 0, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          branchId,
          payment.customerId,
          payment.customerName,
          balance,
          invoiceNumber,
          employeeName || 'Cashier',
        ),
      );
    }

    await c.env.DB.batch(statements);
    await writeAuditLog(
      c.env.DB,
      employeeName || 'Cashier',
      'Sale',
      `${invoiceNumber} — ₦${totalAmount.toLocaleString()}`,
      tenantId,
    );

    return c.json({
      success: true,
      data: {
        id: saleId,
        invoiceNumber,
        saleDate: todayStr(),
        saleTime: nowTimeStr(),
        cashier: employeeName || 'Cashier',
        customerName: payment.customerName || 'Walk-in',
        itemDetails,
        totalAmount,
        amountPaid,
        changeGiven,
        balance,
        paymentMethod: payment.method || 'Cash',
      },
    });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return c.json(
      { success: false, error: 'Checkout failed. Please try again.' },
      500,
    );
  }
});

// 3. SALES HISTORY & ATOMIC REFUNDS
provision.get('/sales', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const [salesRes, returnsRes] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM provision_sales WHERE branch_id = ? ORDER BY created_at DESC LIMIT 200`,
    )
      .bind(branchId)
      .all(),
    c.env.DB.prepare(
      `SELECT * FROM provision_returns WHERE branch_id = ? ORDER BY created_at DESC LIMIT 100`,
    )
      .bind(branchId)
      .all(),
  ]);
  return c.json({
    success: true,
    data: {
      sales: salesRes.results || [],
      returns: returnsRes.results || [],
    },
  });
});

provision.post('/sales/:id/refund', async (c) => {
  try {
    const saleId = c.req.param('id');
    const body = await c.req.json();
    const {
      productId,
      productName,
      quantityPieces,
      refundAmount,
      reason,
      employeeName,
    } = body;
    const tenantId =
      c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
    const branchId = resolveBranch(body.branchId, tenantId);

    if (!reason || !String(reason).trim()) {
      return c.json(
        { success: false, error: 'A reason is required to process a refund.' },
        400,
      );
    }

    const sale: any = await c.env.DB.prepare(
      `SELECT * FROM provision_sales WHERE id = ?`,
    )
      .bind(saleId)
      .first();
    if (!sale)
      return c.json({ success: false, error: 'Sale invoice not found.' }, 404);
    if (sale.status === 'Refunded') {
      return c.json(
        {
          success: false,
          error: 'This invoice has already been fully refunded.',
        },
        400,
      );
    }

    const pieces = Number(quantityPieces) || 0;
    const refAmt = Number(refundAmount) || 0;
    if (pieces <= 0 || refAmt <= 0) {
      return c.json(
        {
          success: false,
          error: 'Enter valid return quantity and refund amount.',
        },
        400,
      );
    }

    const isFullRefund = refAmt >= Number(sale.total_amount);
    const newStatus = isFullRefund ? 'Refunded' : 'Partial Refund';
    const newTotal = Math.max(0, Number(sale.total_amount) - refAmt);
    const profitReduction =
      Number(sale.total_amount) > 0
        ? (refAmt / Number(sale.total_amount)) * Number(sale.profit)
        : 0;
    const newProfit = Math.max(
      0,
      Math.round((Number(sale.profit) - profitReduction) * 100) / 100,
    );

    const statements = [
      c.env.DB.prepare(
        `
        UPDATE provision_products SET stock_quantity = stock_quantity + ? WHERE id = ?
      `,
      ).bind(pieces, productId),

      c.env.DB.prepare(
        `
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, reference, employee_name)
        VALUES (?, ?, ?, ?, 'Return', ?, ?, ?)
      `,
      ).bind(
        crypto.randomUUID(),
        branchId,
        productId,
        productName,
        pieces,
        `${sale.invoice_number} (${reason.trim()})`,
        employeeName || 'Owner',
      ),

      c.env.DB.prepare(
        `
        INSERT INTO provision_returns (id, branch_id, sale_id, invoice_number, product_id, product_name, quantity_pieces, refund_amount, reason, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).bind(
        crypto.randomUUID(),
        branchId,
        saleId,
        sale.invoice_number,
        productId,
        productName,
        pieces,
        refAmt,
        reason.trim(),
        employeeName || 'Owner',
      ),

      c.env.DB.prepare(
        `
        UPDATE provision_sales SET total_amount = ?, profit = ?, status = ? WHERE id = ?
      `,
      ).bind(newTotal, newProfit, newStatus, saleId),
    ];

    if (sale.customer_id && Number(sale.balance) > 0) {
      const creditReduction = Math.min(Number(sale.balance), refAmt);
      statements.push(
        c.env.DB.prepare(
          `
          UPDATE provision_customers SET outstanding_balance = MAX(0, outstanding_balance - ?) WHERE id = ?
        `,
        ).bind(creditReduction, sale.customer_id),
        c.env.DB.prepare(
          `
          INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by)
          VALUES (?, ?, ?, ?, 'Sales Return', 0, ?, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          branchId,
          sale.customer_id,
          sale.customer_name,
          creditReduction,
          sale.invoice_number,
          employeeName || 'Owner',
        ),
      );
    }

    await c.env.DB.batch(statements);
    await writeAuditLog(
      c.env.DB,
      employeeName || 'Owner',
      'Sales Refund',
      `${sale.invoice_number} — ${productName} (+${pieces} stock, ₦${refAmt.toLocaleString()} refunded) — ${reason}`,
      tenantId,
    );

    return c.json({ success: true, data: { newStatus } });
  } catch (error: any) {
    console.error('Refund Error:', error);
    return c.json({ success: false, error: 'Failed to process refund.' }, 500);
  }
});

// 4. POS PHYSICAL DRAWER CASH SESSIONS
provision.get('/drawer', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const [status, history] = await Promise.all([
    computeDrawerStatus(c.env.DB, branchId),
    c.env.DB.prepare(
      `SELECT * FROM provision_drawer_sessions WHERE branch_id = ? ORDER BY tx_date DESC LIMIT 20`,
    )
      .bind(branchId)
      .all(),
  ]);
  return c.json({
    success: true,
    data: { status, history: history.results || [] },
  });
});

provision.post('/drawer/open', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
  const branchId = resolveBranch(body.branchId, tenantId);
  const today = todayStr();

  const existing = await c.env.DB.prepare(
    `SELECT id FROM provision_drawer_sessions WHERE branch_id = ? AND tx_date = ?`,
  )
    .bind(branchId, today)
    .first();

  if (existing) {
    return c.json(
      { success: false, error: 'Cash drawer is already opened for today.' },
      400,
    );
  }

  const openingCash = Number(body.openingCash) || 0;
  await c.env.DB.prepare(
    `
    INSERT INTO provision_drawer_sessions (id, branch_id, tx_date, open_time, opening_cash, opened_by, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Open')
  `,
  )
    .bind(
      crypto.randomUUID(),
      branchId,
      today,
      nowTimeStr(),
      openingCash,
      body.employeeName || 'Cashier',
    )
    .run();

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Cashier',
    'Open POS Drawer',
    `Opening cash: ₦${openingCash.toLocaleString()}`,
    tenantId,
  );
  return c.json({ success: true });
});

provision.post('/drawer/close', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
  const branchId = resolveBranch(body.branchId, tenantId);
  const today = todayStr();

  const status = await computeDrawerStatus(c.env.DB, branchId);
  if (!status.dayOpened) {
    return c.json(
      { success: false, error: 'Open the cash drawer first before closing.' },
      400,
    );
  }

  const countedCash = Number(body.countedCash) || 0;
  const variance = Math.round((countedCash - status.expectedCash) * 100) / 100;

  await c.env.DB.prepare(
    `
    UPDATE provision_drawer_sessions
    SET close_time = ?, expected_cash = ?, counted_cash = ?, variance = ?, notes = ?, closed_by = ?, status = 'Closed'
    WHERE branch_id = ? AND tx_date = ?
  `,
  )
    .bind(
      nowTimeStr(),
      status.expectedCash,
      countedCash,
      variance,
      body.notes || '',
      body.employeeName || 'Cashier',
      branchId,
      today,
    )
    .run();

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Cashier',
    'Close POS Drawer',
    `Expected: ₦${status.expectedCash.toLocaleString()}, Counted: ₦${countedCash.toLocaleString()}, Variance: ₦${variance.toLocaleString()}`,
    tenantId,
  );
  return c.json({
    success: true,
    data: { expectedCash: status.expectedCash, countedCash, variance },
  });
});

// 5. INVENTORY, PURCHASES, CUSTOMERS, LEDGER, EXPENSES, STOCK TOOLS
provision.get('/inventory', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `
    SELECT id, product_code, name, unit, stock_quantity, reorder_level, status 
    FROM provision_products WHERE branch_id = ? AND status = 'Active' ORDER BY name ASC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/purchases', async (c) => {
  try {
    const body = await c.req.json();
    const {
      productId,
      productName,
      quantity,
      costPerUnit,
      employeeName,
      unit,
    } = body;
    const tenantId =
      c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
    const branchId = resolveBranch(body.branchId, tenantId);

    const prod: any = await c.env.DB.prepare(
      `SELECT * FROM provision_products WHERE id = ?`,
    )
      .bind(productId)
      .first();
    if (!prod)
      return c.json({ success: false, error: 'Product not found' }, 404);

    const isBulk = unit && unit !== 'Unit' && unit === prod.bulk_type;
    const piecesPerUnit = isBulk ? Number(prod.units_per_bulk) || 1 : 1;
    const pieceQty = (Number(quantity) || 1) * piecesPerUnit;

    const purchaseId = crypto.randomUUID();
    const purchaseCode = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = Number(quantity) * Number(costPerUnit);

    await c.env.DB.batch([
      c.env.DB.prepare(
        `
        INSERT INTO provision_purchases (id, branch_id, purchase_code, product_id, product_name, unit, quantity, cost_per_unit, total_amount, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).bind(
        purchaseId,
        branchId,
        purchaseCode,
        productId,
        productName,
        unit || prod.unit,
        quantity,
        costPerUnit,
        totalAmount,
        employeeName || 'Owner',
      ),

      c.env.DB.prepare(
        `
        UPDATE provision_products SET stock_quantity = stock_quantity + ? WHERE id = ?
      `,
      ).bind(pieceQty, productId),

      c.env.DB.prepare(
        `
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, reference, employee_name)
        VALUES (?, ?, ?, ?, 'Purchase', ?, ?, ?)
      `,
      ).bind(
        crypto.randomUUID(),
        branchId,
        productId,
        productName,
        pieceQty,
        purchaseCode,
        employeeName || 'Owner',
      ),
    ]);

    await writeAuditLog(
      c.env.DB,
      employeeName || 'Owner',
      'Add Purchase',
      `${purchaseCode} — ${productName} +${pieceQty} units`,
      tenantId,
    );
    return c.json({ success: true, data: { purchaseCode, totalAmount } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to record purchase.' }, 500);
  }
});

provision.get('/purchases', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM provision_purchases WHERE branch_id = ? ORDER BY created_at DESC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.get('/customers', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM provision_customers WHERE branch_id = ? ORDER BY name ASC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/customers', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId, c.req.header('X-Tenant-Id'));
  const { name, phone } = body;
  if (!name || !name.trim())
    return c.json({ success: false, error: 'Customer name is required' }, 400);

  const id = crypto.randomUUID();
  const code = `CUS-${Math.floor(10000 + Math.random() * 90000)}`;
  await c.env.DB.prepare(
    `
    INSERT INTO provision_customers (id, branch_id, code, name, phone, outstanding_balance)
    VALUES (?, ?, ?, ?, ?, 0)
  `,
  )
    .bind(id, branchId, code, name.trim(), phone || '')
    .run();

  return c.json({
    success: true,
    data: {
      id,
      code,
      name: name.trim(),
      phone: phone || '',
      outstanding_balance: 0,
    },
  });
});

provision.get('/ledger', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const customerId = c.req.query('customerId');
  let query = `SELECT * FROM provision_ledger WHERE branch_id = ?`;
  const params: any[] = [branchId];
  if (customerId) {
    query += ` AND customer_id = ?`;
    params.push(customerId);
  }
  query += ` ORDER BY created_at DESC`;
  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/customers/payment', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
  const branchId = resolveBranch(body.branchId, tenantId);
  const { customerId, amount, paymentMethod, employeeName } = body;
  const amt = Number(amount);

  const customer: any = await c.env.DB.prepare(
    `SELECT * FROM provision_customers WHERE id = ?`,
  )
    .bind(customerId)
    .first();
  if (!customer)
    return c.json({ success: false, error: 'Customer not found.' }, 404);
  if (amt > customer.outstanding_balance + 0.01) {
    return c.json(
      {
        success: false,
        error: `Payment cannot exceed outstanding balance (₦${customer.outstanding_balance.toLocaleString()}).`,
      },
      400,
    );
  }

  const newBalance = Math.max(0, customer.outstanding_balance - amt);
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE provision_customers SET outstanding_balance = ? WHERE id = ?`,
    ).bind(newBalance, customerId),
    c.env.DB.prepare(
      `
      INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by)
      VALUES (?, ?, ?, ?, 'Payment', 0, ?, ?, ?)
    `,
    ).bind(
      crypto.randomUUID(),
      branchId,
      customerId,
      customer.name,
      amt,
      paymentMethod || 'Cash',
      employeeName || 'Staff',
    ),
  ]);

  await writeAuditLog(
    c.env.DB,
    employeeName || 'Staff',
    'Customer Payment',
    `${customer.name} paid ₦${amt.toLocaleString()}`,
    tenantId,
  );
  return c.json({ success: true, data: { newBalance } });
});

provision.get('/expenses', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM provision_expenses WHERE branch_id = ? ORDER BY created_at DESC`,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/expenses', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
  const branchId = resolveBranch(body.branchId, tenantId);
  const amount = Number(body.amount);
  const id = crypto.randomUUID();
  const expenseCode = `EXP-${Math.floor(10000 + Math.random() * 90000)}`;
  await c.env.DB.prepare(
    `
    INSERT INTO provision_expenses (id, branch_id, expense_code, category, description, amount, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      id,
      branchId,
      expenseCode,
      body.category,
      body.description || '',
      amount,
      body.employeeName || 'Owner',
    )
    .run();

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Owner',
    'Add Expense',
    `${expenseCode} — ${body.category} ₦${amount.toLocaleString()}`,
    tenantId,
  );
  return c.json({ success: true, data: { id, expenseCode } });
});

provision.delete('/expenses/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM provision_expenses WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

provision.post('/stock-adjust', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('X-Tenant-Id') || body.tenantId || 'TENANT-001';
  const branchId = resolveBranch(body.branchId, tenantId);
  const { productId, deltaPieces, reason, employeeName } = body;
  const delta = Number(deltaPieces);

  const product: any = await c.env.DB.prepare(
    `SELECT * FROM provision_products WHERE id = ?`,
  )
    .bind(productId)
    .first();
  if (!product)
    return c.json({ success: false, error: 'Product not found.' }, 404);

  const newStock = (Number(product.stock_quantity) || 0) + delta;
  if (newStock < 0)
    return c.json(
      { success: false, error: `Adjustment would make stock negative.` },
      400,
    );

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE provision_products SET stock_quantity = ? WHERE id = ?`,
    ).bind(newStock, productId),
    c.env.DB.prepare(
      `
      INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, quantity_out, reference, employee_name)
      VALUES (?, ?, ?, ?, 'Adjustment', ?, ?, ?, ?)
    `,
    ).bind(
      crypto.randomUUID(),
      branchId,
      productId,
      product.name,
      delta > 0 ? delta : 0,
      delta < 0 ? -delta : 0,
      reason.trim(),
      employeeName || 'Owner',
    ),
  ]);

  await writeAuditLog(
    c.env.DB,
    employeeName || 'Owner',
    'Stock Adjustment',
    `${product.name} (${delta > 0 ? '+' : ''}${delta}) — ${reason}`,
    tenantId,
  );
  return c.json({ success: true, data: { newStock } });
});

provision.get('/expiry-batches', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM provision_expiry_batches WHERE branch_id = ? ORDER BY expiry_date ASC`,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

provision.post('/expiry-batches', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId, c.req.header('X-Tenant-Id'));
  const { productId, productName, batchNumber, quantity, expiryDate } = body;
  await c.env.DB.prepare(
    `
    INSERT INTO provision_expiry_batches (id, branch_id, product_id, product_name, batch_number, quantity, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      crypto.randomUUID(),
      branchId,
      productId,
      productName,
      batchNumber || '',
      Number(quantity),
      expiryDate,
    )
    .run();
  return c.json({ success: true });
});

provision.delete('/expiry-batches/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM provision_expiry_batches WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 6. EXECUTIVE DASHBOARD & REPORTS
provision.get('/dashboard', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const today = todayStr();
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);

  const [
    salesRes,
    expensesRes,
    productsRes,
    customersRes,
    movementsRes,
    drawer,
  ] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM provision_sales WHERE branch_id = ? AND status != 'Refunded'`,
    )
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM provision_expenses WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(
      `SELECT * FROM provision_products WHERE branch_id = ? AND status = 'Active'`,
    )
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM provision_customers WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(
      `SELECT * FROM provision_movements WHERE branch_id = ? AND movement_type = 'Sale'`,
    )
      .bind(branchId)
      .all<any>(),
    computeDrawerStatus(c.env.DB, branchId),
  ]);

  const sales = salesRes.results || [];
  const expenses = expensesRes.results || [];
  const products = productsRes.results || [];
  const customers = customersRes.results || [];
  const movements = movementsRes.results || [];

  const todaySales = sales.filter(
    (s) => String(s.created_at).slice(0, 10) === today,
  );
  const monthSales = sales.filter(
    (s) => String(s.created_at).slice(0, 7) === currentMonth,
  );
  const monthExpensesRows = expenses.filter(
    (e) => String(e.created_at).slice(0, 7) === currentMonth,
  );

  const sum = (arr: any[], key: string) =>
    arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

  let inStock = 0,
    lowStock = 0,
    outOfStock = 0;
  let inventoryCostValue = 0,
    inventoryRetailValue = 0;
  const lowStockItems: string[] = [];
  const outOfStockItems: string[] = [];

  products.forEach((p) => {
    const stock = Number(p.stock_quantity) || 0;
    const reorder = Number(p.reorder_level) || 0;
    inventoryCostValue += stock * (Number(p.buying_price) || 0);
    inventoryRetailValue += stock * (Number(p.selling_price) || 0);

    if (stock <= 0) {
      outOfStock++;
      outOfStockItems.push(p.name);
    } else if (stock <= reorder) {
      lowStock++;
      lowStockItems.push(`${p.name} (${stock} left)`);
    } else {
      inStock++;
    }
  });

  const prodQtyMap: Record<string, number> = {};
  movements.forEach((m) => {
    prodQtyMap[m.product_name] =
      (prodQtyMap[m.product_name] || 0) + (Number(m.quantity_out) || 0);
  });
  const topProducts = Object.keys(prodQtyMap)
    .map((name) => ({ name, qty: prodQtyMap[name] }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlySalesMap: Record<string, { revenue: number; profit: number }> =
    {};
  sales.forEach((s) => {
    const dt = String(s.created_at);
    if (dt.slice(0, 4) !== currentYear) return;
    const m = dt.slice(5, 7);
    if (!monthlySalesMap[m]) monthlySalesMap[m] = { revenue: 0, profit: 0 };
    monthlySalesMap[m].revenue += Number(s.total_amount) || 0;
    monthlySalesMap[m].profit += Number(s.profit) || 0;
  });

  const monthlyTrend = monthNames.map((month, idx) => {
    const key = String(idx + 1).padStart(2, '0');
    return {
      month,
      revenue: monthlySalesMap[key]?.revenue || 0,
      profit: monthlySalesMap[key]?.profit || 0,
    };
  });

  const monthProfit = sum(monthSales, 'profit');
  const monthExpenses = sum(monthExpensesRows, 'amount');

  return c.json({
    success: true,
    data: {
      todayRevenue: sum(todaySales, 'total_amount'),
      todayProfit: sum(todaySales, 'profit'),
      todaySalesCount: todaySales.length,
      monthRevenue: sum(monthSales, 'total_amount'),
      monthProfit,
      monthExpenses,
      monthNetProfit: monthProfit - monthExpenses,
      inventoryCostValue,
      inventoryRetailValue,
      inventoryPotentialProfit: inventoryRetailValue - inventoryCostValue,
      totalProducts: products.length,
      inStock,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      lowStockItems,
      outOfStockItems,
      customerDebtTotal: sum(customers, 'outstanding_balance'),
      creditToday: sum(todaySales, 'balance'),
      topProducts,
      monthlyTrend,
      drawer,
    },
  });
});

provision.get('/reports', async (c) => {
  const branchId = resolveBranch(
    c.req.query('branchId'),
    c.req.header('X-Tenant-Id'),
  );
  const startDate = c.req.query('startDate') || '2000-01-01';
  const endDate = c.req.query('endDate') || '2099-12-31';

  const [salesRes, expensesRes, purchasesRes, movementsRes] = await Promise.all(
    [
      c.env.DB.prepare(
        `SELECT * FROM provision_sales WHERE branch_id = ? ORDER BY created_at DESC`,
      )
        .bind(branchId)
        .all<any>(),
      c.env.DB.prepare(`SELECT * FROM provision_expenses WHERE branch_id = ?`)
        .bind(branchId)
        .all<any>(),
      c.env.DB.prepare(`SELECT * FROM provision_purchases WHERE branch_id = ?`)
        .bind(branchId)
        .all<any>(),
      c.env.DB.prepare(
        `SELECT * FROM provision_movements WHERE branch_id = ? AND movement_type = 'Sale'`,
      )
        .bind(branchId)
        .all<any>(),
    ],
  );

  const inRange = (dt: string) => {
    const d = String(dt).slice(0, 10);
    return d >= startDate && d <= endDate;
  };

  const sales = (salesRes.results || []).filter(
    (s) => inRange(s.created_at) && s.status !== 'Refunded',
  );
  const expenses = (expensesRes.results || []).filter((e) =>
    inRange(e.created_at),
  );
  const purchases = (purchasesRes.results || []).filter((p) =>
    inRange(p.created_at),
  );
  const movements = (movementsRes.results || []).filter((m) =>
    inRange(m.created_at),
  );

  const sum = (arr: any[], key: string) =>
    arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const groupSum = (arr: any[], gKey: string, sKey: string) => {
    const map: Record<string, number> = {};
    arr.forEach((r) => {
      const k = r[gKey] || 'Other';
      map[k] = (map[k] || 0) + (Number(r[sKey]) || 0);
    });
    return Object.keys(map)
      .map((label) => ({ label, amount: map[label] }))
      .sort((a, b) => b.amount - a.amount);
  };

  const totalRevenue = sum(sales, 'total_amount');
  const totalProfit = sum(sales, 'profit');
  const totalExpenses = sum(expenses, 'amount');

  return c.json({
    success: true,
    data: {
      salesCount: sales.length,
      totalRevenue,
      totalProfit,
      totalExpenses,
      netProfit: totalProfit - totalExpenses,
      profitMarginPct:
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      totalPurchasesCost: sum(purchases, 'total_amount'),
      totalCreditGiven: sum(sales, 'balance'),
      topProducts: groupSum(movements, 'product_name', 'quantity_out').slice(
        0,
        10,
      ),
      expenseBreakdown: groupSum(expenses, 'category', 'amount'),
      paymentMethods: groupSum(sales, 'payment_method', 'amount_paid'),
      byEmployee: groupSum(sales, 'employee_name', 'total_amount'),
      transactions: sales,
    },
  });
});

export default provision;
