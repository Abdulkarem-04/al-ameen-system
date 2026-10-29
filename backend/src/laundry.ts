import { Hono } from 'hono';
import { writeAuditLog } from './core';

type Bindings = {
  DB: D1Database;
};

const laundry = new Hono<{ Bindings: Bindings }>();

const resolveBranch = (branchId?: string | null) => {
  return !branchId ||
    branchId === 'ALL' ||
    branchId === 'BR001' ||
    branchId === 'BR002'
    ? 'BR003'
    : branchId;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 8);

const VALID_STATUSES = [
  'Dropped Off',
  'Washing',
  'Ready for Pickup',
  'Collected',
  'Cancelled',
];

// 1. SETTINGS (Garment Item Price List)
laundry.get('/settings', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM laundry_settings WHERE branch_id = ? ORDER BY item_type ASC`,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

laundry.post('/settings', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const name = String(body.itemType || '').trim();
  const price = Number(body.defaultPrice);
  if (!name || isNaN(price) || price < 0) {
    return c.json(
      {
        success: false,
        error: 'Item type name and valid default price are required.',
      },
      400,
    );
  }

  await c.env.DB.prepare(
    `INSERT INTO laundry_settings (id, branch_id, item_type, default_price) VALUES (?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), branchId, name, price)
    .run();

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Owner',
    'Add Laundry Item Type',
    `${name} — ₦${price.toLocaleString()}`,
  );
  return c.json({ success: true });
});

laundry.put('/settings/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const price = Number(body.defaultPrice);
  if (isNaN(price) || price < 0) {
    return c.json({ success: false, error: 'Enter a valid price.' }, 400);
  }
  await c.env.DB.prepare(
    `UPDATE laundry_settings SET default_price = ? WHERE id = ?`,
  )
    .bind(price, id)
    .run();
  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Owner',
    'Update Laundry Price',
    `Updated item ${id} -> ₦${price.toLocaleString()}`,
  );
  return c.json({ success: true });
});

laundry.delete('/settings/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM laundry_settings WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 2. ORDERS (Drop-off Intake, Items Lookup, Status Pipeline, Balance Payments)
laundry.get('/orders', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM laundry_orders WHERE branch_id = ? ORDER BY date_received DESC, time_received DESC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

laundry.get('/orders/:id/items', async (c) => {
  const orderId = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM laundry_order_items WHERE order_id = ?`,
  )
    .bind(orderId)
    .all();
  return c.json({ success: true, data: results || [] });
});

laundry.post('/orders', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const items: any[] = body.items || [];
    const customerName = String(body.customerName || '').trim();

    if (!customerName)
      return c.json(
        { success: false, error: 'Customer name is required.' },
        400,
      );
    if (items.length === 0)
      return c.json(
        {
          success: false,
          error: 'Add at least one garment item to the order.',
        },
        400,
      );

    let totalAmount = 0;
    const validatedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const subtotal = qty * unitPrice;
      totalAmount += subtotal;
      return {
        itemType: item.itemType,
        quantity: qty,
        unitPrice,
        subtotal,
        specialInstructions: item.specialInstructions || '',
      };
    });

    let amountPaid =
      body.amountPaid === '' || body.amountPaid === undefined
        ? totalAmount
        : Number(body.amountPaid);
    if (isNaN(amountPaid) || amountPaid < 0) amountPaid = 0;
    if (amountPaid > totalAmount + 0.01) {
      return c.json(
        {
          success: false,
          error: 'Amount paid cannot exceed the total order amount.',
        },
        400,
      );
    }

    const balance = Math.round((totalAmount - amountPaid) * 100) / 100;
    const orderId = crypto.randomUUID();
    const orderNumber = `LDY-${Math.floor(10000 + Math.random() * 90000)}`;
    const today = todayStr();
    const nowTime = nowTimeStr();

    const statements = [
      c.env.DB.prepare(
        `
        INSERT INTO laundry_orders (
          id, branch_id, order_number, date_received, time_received,
          customer_id, customer_name, customer_phone,
          total_amount, amount_paid, balance, payment_method,
          order_status, expected_ready_date, received_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dropped Off', ?, ?, ?)
      `,
      ).bind(
        orderId,
        branchId,
        orderNumber,
        today,
        nowTime,
        body.customerId || '',
        customerName,
        body.customerPhone || '',
        totalAmount,
        amountPaid,
        balance,
        body.paymentMethod || 'Cash',
        body.expectedReadyDate || '',
        body.employeeName || 'Staff',
        body.notes || '',
      ),
    ];

    validatedItems.forEach((item) => {
      statements.push(
        c.env.DB.prepare(
          `
          INSERT INTO laundry_order_items (id, order_id, branch_id, item_type, quantity, unit_price, subtotal, special_instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          orderId,
          branchId,
          item.itemType,
          item.quantity,
          item.unitPrice,
          item.subtotal,
          item.specialInstructions,
        ),
      );
    });

    // If up-front payment was made at drop-off, log to cash-basis payment ledger
    if (amountPaid > 0) {
      statements.push(
        c.env.DB.prepare(
          `
          INSERT INTO laundry_payments (id, branch_id, order_id, order_number, tx_date, tx_time, amount, payment_method, recorded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        ).bind(
          crypto.randomUUID(),
          branchId,
          orderId,
          orderNumber,
          today,
          nowTime,
          amountPaid,
          body.paymentMethod || 'Cash',
          body.employeeName || 'Staff',
        ),
      );
    }

    // Update customer visit stats if customerId provided
    if (body.customerId) {
      statements.push(
        c.env.DB.prepare(
          `
          UPDATE laundry_customers
          SET total_orders = total_orders + 1, total_spent = total_spent + ?, last_visit_date = ?
          WHERE id = ?
        `,
        ).bind(totalAmount, today, body.customerId),
      );
    }

    await c.env.DB.batch(statements);
    await writeAuditLog(
      c.env.DB,
      body.employeeName || 'Staff',
      'Add Laundry Order',
      `${orderNumber} — ${customerName} (₦${totalAmount.toLocaleString()})`,
    );

    return c.json({
      success: true,
      data: {
        orderId,
        orderNumber,
        saleDate: today,
        saleTime: nowTime,
        totalAmount,
        amountPaid,
        balance,
        validatedItems,
      },
    });
  } catch (error: any) {
    console.error('Add Order Error:', error);
    return c.json(
      { success: false, error: 'Failed to save laundry order.' },
      500,
    );
  }
});

laundry.patch('/orders/:id/status', async (c) => {
  const orderId = c.req.param('id');
  const body = await c.req.json();
  const newStatus = body.status;

  if (!VALID_STATUSES.includes(newStatus)) {
    return c.json({ success: false, error: 'Invalid order status.' }, 400);
  }

  const order: any = await c.env.DB.prepare(
    `SELECT * FROM laundry_orders WHERE id = ?`,
  )
    .bind(orderId)
    .first();
  if (!order) return c.json({ success: false, error: 'Order not found.' }, 404);

  if (newStatus === 'Collected') {
    const collectedBy = String(body.collectedBy || '').trim();
    if (!collectedBy) {
      return c.json(
        {
          success: false,
          error: 'Enter the name of the person collecting the order.',
        },
        400,
      );
    }
    await c.env.DB.prepare(
      `
      UPDATE laundry_orders
      SET order_status = 'Collected', date_collected = ?, time_collected = ?, collected_by = ?
      WHERE id = ?
    `,
    )
      .bind(todayStr(), nowTimeStr(), collectedBy, orderId)
      .run();
  } else {
    await c.env.DB.prepare(
      `UPDATE laundry_orders SET order_status = ? WHERE id = ?`,
    )
      .bind(newStatus, orderId)
      .run();
  }

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Staff',
    'Update Laundry Status',
    `${order.order_number} -> ${newStatus}`,
  );
  return c.json({ success: true });
});

laundry.post('/orders/:id/payment', async (c) => {
  const orderId = c.req.param('id');
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const amt = Number(body.amount);

  if (!amt || amt <= 0) {
    return c.json(
      {
        success: false,
        error: 'Enter a valid payment amount greater than zero.',
      },
      400,
    );
  }

  const order: any = await c.env.DB.prepare(
    `SELECT * FROM laundry_orders WHERE id = ?`,
  )
    .bind(orderId)
    .first();
  if (!order) return c.json({ success: false, error: 'Order not found.' }, 404);

  if (amt > Number(order.balance) + 0.01) {
    return c.json(
      {
        success: false,
        error: `Payment cannot exceed the outstanding balance (₦${Number(order.balance).toLocaleString()}).`,
      },
      400,
    );
  }

  const newPaid = Number(order.amount_paid) + amt;
  const newBalance = Math.max(
    0,
    Math.round((Number(order.balance) - amt) * 100) / 100,
  );

  await c.env.DB.batch([
    c.env.DB.prepare(
      `
      UPDATE laundry_orders SET amount_paid = ?, balance = ?, payment_method = ? WHERE id = ?
    `,
    ).bind(
      newPaid,
      newBalance,
      body.paymentMethod || order.payment_method,
      orderId,
    ),
    c.env.DB.prepare(
      `
      INSERT INTO laundry_payments (id, branch_id, order_id, order_number, tx_date, tx_time, amount, payment_method, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).bind(
      crypto.randomUUID(),
      branchId,
      orderId,
      order.order_number,
      todayStr(),
      nowTimeStr(),
      amt,
      body.paymentMethod || 'Cash',
      body.employeeName || 'Staff',
    ),
  ]);

  await writeAuditLog(
    c.env.DB,
    body.employeeName || 'Staff',
    'Laundry Order Payment',
    `${order.order_number} — paid ₦${amt.toLocaleString()}`,
  );
  return c.json({ success: true, data: { newPaid, newBalance } });
});

laundry.delete('/orders/:id', async (c) => {
  const orderId = c.req.param('id');
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM laundry_orders WHERE id = ?`).bind(orderId),
    c.env.DB.prepare(`DELETE FROM laundry_order_items WHERE order_id = ?`).bind(
      orderId,
    ),
  ]);
  return c.json({ success: true });
});

// 3. CUSTOMERS & LEDGER
laundry.get('/customers', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM laundry_customers WHERE branch_id = ? ORDER BY total_orders DESC, name ASC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

laundry.post('/customers', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const name = String(body.name || '').trim();
  if (!name)
    return c.json({ success: false, error: 'Customer name is required.' }, 400);

  const id = crypto.randomUUID();
  const customerCode = `LCUS-${Math.floor(10000 + Math.random() * 90000)}`;
  await c.env.DB.prepare(
    `
    INSERT INTO laundry_customers (id, branch_id, customer_code, name, phone, total_orders, total_spent, last_visit_date)
    VALUES (?, ?, ?, ?, ?, 0, 0, '')
  `,
  )
    .bind(id, branchId, customerCode, name, body.phone || '')
    .run();

  return c.json({
    success: true,
    data: { id, customerCode, name, phone: body.phone || '' },
  });
});

laundry.get('/ledger', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const [outstandingRes, paymentsRes] = await Promise.all([
    c.env.DB.prepare(
      `
      SELECT * FROM laundry_orders
      WHERE branch_id = ? AND order_status != 'Cancelled' AND balance > 0
      ORDER BY balance DESC
    `,
    )
      .bind(branchId)
      .all(),
    c.env.DB.prepare(
      `
      SELECT * FROM laundry_payments WHERE branch_id = ? ORDER BY tx_date DESC, tx_time DESC LIMIT 200
    `,
    )
      .bind(branchId)
      .all(),
  ]);

  return c.json({
    success: true,
    data: {
      outstandingOrders: outstandingRes.results || [],
      payments: paymentsRes.results || [],
    },
  });
});

// 4. EXPENSES
laundry.get('/expenses', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM laundry_expenses WHERE branch_id = ? ORDER BY tx_date DESC, tx_time DESC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

laundry.post('/expenses', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const amount = Number(body.amount);
  if (!body.category || !amount || amount <= 0) {
    return c.json(
      { success: false, error: 'Category and a positive amount are required.' },
      400,
    );
  }
  const expenseCode = `EXP-${Math.floor(10000 + Math.random() * 90000)}`;
  await c.env.DB.prepare(
    `
    INSERT INTO laundry_expenses (id, branch_id, expense_code, tx_date, tx_time, category, description, amount, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      crypto.randomUUID(),
      branchId,
      expenseCode,
      todayStr(),
      nowTimeStr(),
      body.category,
      body.description || '',
      amount,
      body.employeeName || 'Owner',
    )
    .run();

  return c.json({ success: true, data: { expenseCode } });
});

laundry.delete('/expenses/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM laundry_expenses WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 5. DASHBOARD & REPORTS (Cash-Basis Revenue + Overdue Engine)
laundry.get('/dashboard', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const today = todayStr();
  const currentMonth = today.slice(0, 7);

  const [ordersRes, paymentsRes, expensesRes, itemsRes] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM laundry_orders WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM laundry_payments WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM laundry_expenses WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM laundry_order_items WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
  ]);

  const allOrders = ordersRes.results || [];
  const activeOrders = allOrders.filter((o) => o.order_status !== 'Cancelled');
  const payments = paymentsRes.results || [];
  const expenses = expensesRes.results || [];
  const items = itemsRes.results || [];

  const sum = (arr: any[], k: string) =>
    arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);

  const paymentsToday = payments.filter((p) => p.tx_date === today);
  const paymentsMonth = payments.filter(
    (p) => String(p.tx_date).slice(0, 7) === currentMonth,
  );
  const expensesToday = expenses.filter((e) => e.tx_date === today);
  const expensesMonth = expenses.filter(
    (e) => String(e.tx_date).slice(0, 7) === currentMonth,
  );

  const pendingOrders = activeOrders.filter(
    (o) => o.order_status !== 'Collected',
  );
  const overdueOrders = pendingOrders.filter(
    (o) => o.expected_ready_date && String(o.expected_ready_date) < today,
  );

  const itemMap: Record<string, number> = {};
  items.forEach((i) => {
    itemMap[i.item_type] =
      (itemMap[i.item_type] || 0) + (Number(i.subtotal) || 0);
  });
  const revenueByItemType = Object.keys(itemMap)
    .map((label) => ({ label, amount: itemMap[label] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const todayRevenue = sum(paymentsToday, 'amount');
  const todayExpenses = sum(expensesToday, 'amount');
  const monthRevenue = sum(paymentsMonth, 'amount');
  const monthExpenses = sum(expensesMonth, 'amount');

  return c.json({
    success: true,
    data: {
      todayRevenue,
      todayExpenses,
      todayProfit: todayRevenue - todayExpenses,
      ordersReceivedToday: activeOrders.filter((o) => o.date_received === today)
        .length,
      ordersCollectedToday: allOrders.filter((o) => o.date_collected === today)
        .length,
      pendingCount: pendingOrders.length,
      pendingValue: sum(activeOrders, 'balance'),
      overdueCount: overdueOrders.length,
      overdueItems: overdueOrders.map(
        (o) =>
          `${o.order_number} — ${o.customer_name} (Due: ${o.expected_ready_date})`,
      ),
      monthRevenue,
      monthExpenses,
      monthNetProfit: monthRevenue - monthExpenses,
      revenueByItemType,
    },
  });
});

laundry.get('/reports', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const startDate = c.req.query('startDate') || '2000-01-01';
  const endDate = c.req.query('endDate') || '2099-12-31';

  const [ordersRes, expensesRes, itemsRes] = await Promise.all([
    c.env.DB.prepare(
      `
      SELECT * FROM laundry_orders
      WHERE branch_id = ? AND date_received >= ? AND date_received <= ? AND order_status != 'Cancelled'
      ORDER BY date_received DESC, time_received DESC
    `,
    )
      .bind(branchId, startDate, endDate)
      .all<any>(),
    c.env.DB.prepare(
      `
      SELECT * FROM laundry_expenses WHERE branch_id = ? AND tx_date >= ? AND tx_date <= ?
    `,
    )
      .bind(branchId, startDate, endDate)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM laundry_order_items WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
  ]);

  const orders = ordersRes.results || [];
  const expenses = expensesRes.results || [];
  const orderIds = new Set(orders.map((o) => o.id));
  const items = (itemsRes.results || []).filter((i) =>
    orderIds.has(i.order_id),
  );

  const sum = (arr: any[], k: string) =>
    arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
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

  const totalRevenue = sum(orders, 'total_amount');
  const totalCollected = sum(orders, 'amount_paid');
  const totalOutstanding = sum(orders, 'balance');
  const totalExpenses = sum(expenses, 'amount');

  return c.json({
    success: true,
    data: {
      orderCount: orders.length,
      collectedCount: orders.filter((o) => o.order_status === 'Collected')
        .length,
      totalRevenue,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      byItemType: groupSum(items, 'item_type', 'subtotal'),
      byEmployee: groupSum(orders, 'received_by', 'total_amount'),
      byPaymentMethod: groupSum(orders, 'payment_method', 'amount_paid'),
      expenseBreakdown: groupSum(expenses, 'category', 'amount'),
      orders,
    },
  });
});

export default laundry;
