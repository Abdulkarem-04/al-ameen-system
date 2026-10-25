import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const provision = new Hono<{ Bindings: Bindings }>();

// Helper: If user is Owner ('ALL') or branchId is missing, default Provision Store to 'BR001'
const resolveBranch = (branchId?: string | null) => {
  return !branchId || branchId === 'ALL' ? 'BR001' : branchId;
};

// GET: List all products for a branch
provision.get('/products', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM provision_products WHERE branch_id = ? ORDER BY name ASC`,
    )
      .bind(branchId)
      .all();
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Failed to fetch products' }, 500);
  }
});

// POST: Add a new product
provision.post('/products', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
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
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          crypto.randomUUID(),
          branchId,
          id,
          body.name,
          'Opening Stock',
          body.openingStock,
          'System',
        )
        .run();
    }

    return c.json({ success: true, data: { id, code } });
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// // POST: Process Checkout (Atomic Transaction)
// provision.post('/checkout', async (c) => {
//   try {
//     const body = await c.req.json();
//     const { cart, payment, employeeName } = body;
//     const branchId = resolveBranch(body.branchId);
//
//     if (!cart || cart.length === 0) {
//       return c.json({ success: false, error: 'Cart is empty' }, 400);
//     }
//
//     const saleId = crypto.randomUUID();
//     const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
//     const statements = [];
//
//     // 1. Insert Sale record
//     statements.push(
//       c.env.DB.prepare(
//         `
//         INSERT INTO provision_sales (id, branch_id, invoice_number, customer_id, customer_name, total_amount, amount_paid, balance, payment_method, employee_name)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `,
//       ).bind(
//         saleId,
//         branchId,
//         invoiceNumber,
//         payment.customerId || null,
//         payment.customerName || 'Walk-in',
//         payment.totalAmount,
//         payment.amountPaid,
//         payment.balance,
//         payment.method,
//         employeeName,
//       ),
//     );
//
//     // 2. Deduct stock, add sale items, and log movements
//     for (const item of cart) {
//       statements.push(
//         c.env.DB.prepare(
//           `
//           INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
//           VALUES (?, ?, ?, ?, ?, ?, ?)
//         `,
//         ).bind(
//           crypto.randomUUID(),
//           saleId,
//           item.id,
//           item.name,
//           item.quantity,
//           item.price,
//           item.quantity * item.price,
//         ),
//       );
//
//       statements.push(
//         c.env.DB.prepare(
//           `
//           UPDATE provision_products SET stock_quantity = stock_quantity - ? WHERE id = ?
//         `,
//         ).bind(item.quantity, item.id),
//       );
//
//       statements.push(
//         c.env.DB.prepare(
//           `
//           INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_out, reference, employee_name)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//         ).bind(
//           crypto.randomUUID(),
//           branchId,
//           item.id,
//           item.name,
//           'Sale',
//           item.quantity,
//           invoiceNumber,
//           employeeName,
//         ),
//       );
//     }
//
//     // 3. Update Customer Balance AND log to Ledger if there is a debt (Partial Payment)
//     if (payment.balance > 0 && payment.customerId) {
//       statements.push(
//         c.env.DB.prepare(
//           `
//           UPDATE provision_customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?
//         `,
//         ).bind(payment.balance, payment.customerId),
//       );
//       statements.push(
//         c.env.DB.prepare(
//           `
//           INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by)
//           VALUES (?, ?, ?, ?, 'Sale (Credit)', ?, 0, ?, ?)
//         `,
//         ).bind(
//           crypto.randomUUID(),
//           branchId,
//           payment.customerId,
//           payment.customerName,
//           payment.balance,
//           invoiceNumber,
//           employeeName,
//         ),
//       );
//     }
//
//     await c.env.DB.batch(statements);
//
//     return c.json({ success: true, data: { invoiceNumber } });
//   } catch (error: any) {
//     console.error('Checkout Error:', error);
//     return c.json(
//       { success: false, error: 'Checkout failed. Please try again.' },
//       500,
//     );
//   }
// });

// POST: Process Checkout (Atomic Transaction with Bulk & Profit calculation)
provision.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { cart, payment, employeeName } = body;
    const branchId = resolveBranch(body.branchId);

    if (!cart || cart.length === 0) {
      return c.json({ success: false, error: 'Cart is empty' }, 400);
    }

    const saleId = crypto.randomUUID();
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const statements = [];

    let totalCost = 0;
    for (const item of cart) {
      const pieces = (Number(item.quantity) || 1) * (Number(item.piecesPerUnit) || 1);
      totalCost += pieces * (Number(item.buyingPriceUnit) || 0);
    }
    const profit = (Number(payment.totalAmount) || 0) - totalCost;

    // 1. Insert Sale record
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO provision_sales (id, branch_id, invoice_number, customer_id, customer_name, total_amount, total_cost, profit, amount_paid, balance, payment_method, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        saleId, branchId, invoiceNumber, payment.customerId || null, payment.customerName || 'Walk-in',
        payment.totalAmount, totalCost, profit, payment.amountPaid, payment.balance, payment.method, employeeName
      )
    );

    // 2. Deduct stock (in base units), add sale items, and log movements
    for (const item of cart) {
      const pieceQty = (Number(item.quantity) || 1) * (Number(item.piecesPerUnit) || 1);
      const displayName = item.tier === 'Bulk' ? `${item.name} (${item.tierLabel})` : item.name;

      statements.push(
        c.env.DB.prepare(`
          INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), saleId, item.id, displayName, item.quantity, item.price, item.quantity * item.price)
      );

      statements.push(
        c.env.DB.prepare(`
          UPDATE provision_products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `).bind(pieceQty, item.id)
      );

      statements.push(
        c.env.DB.prepare(`
          INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_out, reference, employee_name)
          VALUES (?, ?, ?, ?, 'Sale', ?, ?, ?)
        `).bind(crypto.randomUUID(), branchId, item.id, item.name, pieceQty, invoiceNumber, employeeName)
      );
    }

    // 3. Update Customer Balance AND log to Ledger if there is a debt
    if (payment.balance > 0 && payment.customerId) {
      statements.push(
        c.env.DB.prepare(`
          UPDATE provision_customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?
        `).bind(payment.balance, payment.customerId)
      );
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO provision_ledger (id, branch_id, customer_id, customer_name, transaction_type, debit_amount, credit_amount, reference, recorded_by)
          VALUES (?, ?, ?, ?, 'Sale (Credit)', ?, 0, ?, ?)
        `).bind(crypto.randomUUID(), branchId, payment.customerId, payment.customerName, payment.balance, invoiceNumber, employeeName)
      );
    }

    await c.env.DB.batch(statements);

    return c.json({ success: true, data: { invoiceNumber } });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return c.json({ success: false, error: 'Checkout failed. Please try again.' }, 500);
  }
});

// GET: Fetch Inventory Status
provision.get('/inventory', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT id, product_code, name, unit, stock_quantity, reorder_level, status 
      FROM provision_products 
      WHERE branch_id = ? AND status = 'Active'
      ORDER BY name ASC
    `,
    )
      .bind(branchId)
      .all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch inventory' }, 500);
  }
});

// POST: Record a Purchase (Restock)
provision.post('/purchases', async (c) => {
  try {
    const body = await c.req.json();
    const { productId, productName, quantity, costPerUnit, employeeName } =
      body;
    const branchId = resolveBranch(body.branchId);

    if (!productId || quantity <= 0 || costPerUnit < 0) {
      return c.json({ success: false, error: 'Invalid purchase data' }, 400);
    }

    const purchaseId = crypto.randomUUID();
    const purchaseCode = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = quantity * costPerUnit;

    const statements = [
      c.env.DB.prepare(
        `
        INSERT INTO provision_purchases (id, branch_id, purchase_code, product_id, product_name, quantity, cost_per_unit, total_amount, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).bind(
        purchaseId,
        branchId,
        purchaseCode,
        productId,
        productName,
        quantity,
        costPerUnit,
        totalAmount,
        employeeName,
      ),

      c.env.DB.prepare(
        `
        UPDATE provision_products SET stock_quantity = stock_quantity + ? WHERE id = ?
      `,
      ).bind(quantity, productId),

      c.env.DB.prepare(
        `
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, reference, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).bind(
        crypto.randomUUID(),
        branchId,
        productId,
        productName,
        'Purchase',
        quantity,
        purchaseCode,
        employeeName,
      ),
    ];

    await c.env.DB.batch(statements);

    return c.json({ success: true, data: { purchaseCode, totalAmount } });
  } catch (error: any) {
    console.error('Purchase Error:', error);
    return c.json({ success: false, error: 'Failed to record purchase.' }, 500);
  }
});

// GET: List Purchase History
provision.get('/purchases', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT id, purchase_code, product_name, quantity, cost_per_unit, total_amount, employee_name, created_at
      FROM provision_purchases
      WHERE branch_id = ?
      ORDER BY created_at DESC
    `,
    )
      .bind(branchId)
      .all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Fetch Purchases Error:', error);
    return c.json(
      { success: false, error: 'Failed to fetch purchase history' },
      500,
    );
  }
});

// GET: List Customers
provision.get('/customers', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `
      SELECT * FROM provision_customers WHERE branch_id = ? ORDER BY name ASC
    `,
    )
      .bind(branchId)
      .all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch customers' }, 500);
  }
});

// POST: Add Customer
provision.post('/customers', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const { name, phone } = body;
    if (!name || !name.trim()) {
      return c.json(
        { success: false, error: 'Customer name is required' },
        400,
      );
    }
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
  } catch (error) {
    return c.json({ success: false, error: 'Failed to add customer' }, 500);
  }
});

// GET: List Ledger (All or filtered by customerId)
provision.get('/ledger', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const customerId = c.req.query('customerId');
  try {
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
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch ledger' }, 500);
  }
});

// POST: Record Customer Debt Payment
provision.post('/customers/payment', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const { customerId, amount, paymentMethod, employeeName } = body;
    const amt = Number(amount);
    if (!customerId || !amt || amt <= 0) {
      return c.json(
        {
          success: false,
          error: 'Enter a valid payment amount greater than zero.',
        },
        400,
      );
    }

    const customer: any = await c.env.DB.prepare(
      `SELECT * FROM provision_customers WHERE id = ?`,
    )
      .bind(customerId)
      .first();

    if (!customer) {
      return c.json({ success: false, error: 'Customer not found.' }, 404);
    }

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

    return c.json({ success: true, data: { newBalance } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to record payment' }, 500);
  }
});

// PUT: Edit an existing product (Owner)
provision.put('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE provision_products 
      SET name = ?, unit = ?, reorder_level = ?, buying_price = ?, selling_price = ?,
          bulk_enabled = ?, bulk_type = ?, units_per_bulk = ?, bulk_price = ?, expiry_tracking = ?
      WHERE id = ?
    `).bind(
      body.name, body.unit, Number(body.reorderLevel) || 0,
      Number(body.buyingPrice) || 0, Number(body.sellingPrice) || 0,
      body.bulkEnabled ? 1 : 0, body.bulkEnabled ? body.bulkType : null,
      body.bulkEnabled ? Number(body.unitsPerBulk) : 0,
      body.bulkEnabled ? Number(body.bulkPrice) : 0,
      body.expiryTracking ? 1 : 0, id
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Failed to update product' }, 500);
  }
});

// PATCH: Toggle Product Status (Active / Inactive)
provision.patch('/products/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    await c.env.DB.prepare(`UPDATE provision_products SET status = ? WHERE id = ?`).bind(status, id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update status' }, 500);
  }
});

// GET: List Expenses
provision.get('/expenses', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM provision_expenses WHERE branch_id = ? ORDER BY created_at DESC`
    ).bind(branchId).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch expenses' }, 500);
  }
});

// POST: Add Expense
provision.post('/expenses', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const amount = Number(body.amount);
    if (!body.category || !amount || amount <= 0) {
      return c.json({ success: false, error: 'Category and a positive amount are required.' }, 400);
    }
    const id = crypto.randomUUID();
    const expenseCode = `EXP-${Math.floor(10000 + Math.random() * 90000)}`;
    await c.env.DB.prepare(`
      INSERT INTO provision_expenses (id, branch_id, expense_code, category, description, amount, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, branchId, expenseCode, body.category, body.description || '', amount, body.employeeName || 'Owner').run();

    return c.json({ success: true, data: { id, expenseCode } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to save expense' }, 500);
  }
});

// DELETE: Delete Expense
provision.delete('/expenses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM provision_expenses WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete expense' }, 500);
  }
});

// POST: Manual Stock Adjustment
provision.post('/stock-adjust', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const { productId, deltaPieces, reason, employeeName } = body;
    const delta = Number(deltaPieces);

    if (!productId || !delta || delta === 0) {
      return c.json({ success: false, error: 'Enter a non-zero adjustment amount.' }, 400);
    }
    if (!reason || !String(reason).trim()) {
      return c.json({ success: false, error: 'A reason is required for every stock adjustment.' }, 400);
    }

    const product: any = await c.env.DB.prepare(`SELECT * FROM provision_products WHERE id = ?`).bind(productId).first();
    if (!product) return c.json({ success: false, error: 'Product not found.' }, 404);

    const newStock = (Number(product.stock_quantity) || 0) + delta;
    if (newStock < 0) {
      return c.json({ success: false, error: `Adjustment would make stock negative (Current: ${product.stock_quantity}).` }, 400);
    }

    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE provision_products SET stock_quantity = ? WHERE id = ?`).bind(newStock, productId),
      c.env.DB.prepare(`
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, quantity_out, reference, employee_name)
        VALUES (?, ?, ?, ?, 'Adjustment', ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), branchId, productId, product.name,
        delta > 0 ? delta : 0, delta < 0 ? -delta : 0, reason.trim(), employeeName || 'Owner'
      )
    ]);

    return c.json({ success: true, data: { newStock } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to adjust stock' }, 500);
  }
});

// GET: List Expiry Batches
provision.get('/expiry-batches', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM provision_expiry_batches WHERE branch_id = ? ORDER BY expiry_date ASC`
    ).bind(branchId).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch expiry batches' }, 500);
  }
});

// POST: Add Expiry Batch
provision.post('/expiry-batches', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const { productId, productName, batchNumber, quantity, expiryDate } = body;
    if (!productId || !expiryDate || !(Number(quantity) > 0)) {
      return c.json({ success: false, error: 'Product, positive quantity, and expiry date are required.' }, 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO provision_expiry_batches (id, branch_id, product_id, product_name, batch_number, quantity, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), branchId, productId, productName, batchNumber || '', Number(quantity), expiryDate).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to add expiry batch' }, 500);
  }
});

// DELETE: Remove Expiry Batch
provision.delete('/expiry-batches/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM provision_expiry_batches WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete batch' }, 500);
  }
});

// GET: Provision Dashboard Analytics
provision.get('/dashboard', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  try {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);

    const [salesRes, expensesRes, productsRes, customersRes, movementsRes] = await Promise.all([
      c.env.DB.prepare(`SELECT * FROM provision_sales WHERE branch_id = ?`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_expenses WHERE branch_id = ?`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_products WHERE branch_id = ? AND status = 'Active'`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_customers WHERE branch_id = ?`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_movements WHERE branch_id = ? AND movement_type = 'Sale'`).bind(branchId).all(),
    ]);

    const sales: any[] = salesRes.results || [];
    const expenses: any[] = expensesRes.results || [];
    const products: any[] = productsRes.results || [];
    const customers: any[] = customersRes.results || [];
    const movements: any[] = movementsRes.results || [];

    const todaySales = sales.filter((s) => String(s.created_at).slice(0, 10) === today);
    const monthSales = sales.filter((s) => String(s.created_at).slice(0, 7) === currentMonth);
    const monthExpensesRows = expenses.filter((e) => String(e.created_at).slice(0, 7) === currentMonth);

    const sum = (arr: any[], key: string) => arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

    const todayRevenue = sum(todaySales, 'total_amount');
    const todayProfit = sum(todaySales, 'profit');
    const monthRevenue = sum(monthSales, 'total_amount');
    const monthProfit = sum(monthSales, 'profit');
    const monthExpenses = sum(monthExpensesRows, 'amount');

    let inStock = 0, lowStock = 0, outOfStock = 0;
    let inventoryCostValue = 0, inventoryRetailValue = 0;
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
      prodQtyMap[m.product_name] = (prodQtyMap[m.product_name] || 0) + (Number(m.quantity_out) || 0);
    });
    const topProducts = Object.keys(prodQtyMap)
      .map((name) => ({ name, qty: prodQtyMap[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    return c.json({
      success: true,
      data: {
        todayRevenue,
        todayProfit,
        todaySalesCount: todaySales.length,
        monthRevenue,
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
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Failed to load dashboard' }, 500);
  }
});

// GET: Provision Reports (Date Range Filtered)
provision.get('/reports', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const startDate = c.req.query('startDate') || '2000-01-01';
  const endDate = c.req.query('endDate') || '2099-12-31';

  try {
    const [salesRes, expensesRes, purchasesRes, movementsRes] = await Promise.all([
      c.env.DB.prepare(`SELECT * FROM provision_sales WHERE branch_id = ? ORDER BY created_at DESC`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_expenses WHERE branch_id = ?`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_purchases WHERE branch_id = ?`).bind(branchId).all(),
      c.env.DB.prepare(`SELECT * FROM provision_movements WHERE branch_id = ? AND movement_type = 'Sale'`).bind(branchId).all(),
    ]);

    const inRange = (dt: string) => {
      const d = String(dt).slice(0, 10);
      return d >= startDate && d <= endDate;
    };

    const sales = (salesRes.results || []).filter((s: any) => inRange(s.created_at));
    const expenses = (expensesRes.results || []).filter((e: any) => inRange(e.created_at));
    const purchases = (purchasesRes.results || []).filter((p: any) => inRange(p.created_at));
    const movements = (movementsRes.results || []).filter((m: any) => inRange(m.created_at));

    const sum = (arr: any[], key: string) => arr.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
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
    const totalPurchasesCost = sum(purchases, 'total_amount');
    const totalCreditGiven = sum(sales, 'balance');

    return c.json({
      success: true,
      data: {
        salesCount: sales.length,
        totalRevenue,
        totalProfit,
        totalExpenses,
        netProfit: totalProfit - totalExpenses,
        profitMarginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        totalPurchasesCost,
        totalCreditGiven,
        topProducts: groupSum(movements, 'product_name', 'quantity_out').slice(0, 10),
        expenseBreakdown: groupSum(expenses, 'category', 'amount'),
        paymentMethods: groupSum(sales, 'payment_method', 'amount_paid'),
        byEmployee: groupSum(sales, 'employee_name', 'total_amount'),
        transactions: sales,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: 'Failed to load report' }, 500);
  }
});

export default provision;
