import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const provision = new Hono<{ Bindings: Bindings }>();

// GET: List all products for a branch
provision.get('/products', async (c) => {
  const branchId = c.req.query('branchId') || 'BR001'; // Defaulting for now

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
    const id = crypto.randomUUID();
    // Generate a simple product code e.g. PRD-12345
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
        body.branchId || 'BR001',
        code,
        body.name,
        body.unit,
        body.reorderLevel,
        body.openingStock,
        body.buyingPrice,
        body.sellingPrice,
        body.bulkEnabled ? 1 : 0,
        body.bulkType || null,
        body.unitsPerBulk || 0,
        body.bulkPrice || 0,
        body.expiryTracking ? 1 : 0,
      )
      .run();

    // If opening stock > 0, log a movement
    if (body.openingStock > 0) {
      await c.env.DB.prepare(
        `
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          crypto.randomUUID(),
          body.branchId || 'BR001',
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

// POST: Process Checkout (Atomic Transaction)
provision.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { branchId, cart, payment, employeeName } = body;

    if (!cart || cart.length === 0) {
      return c.json({ success: false, error: 'Cart is empty' }, 400);
    }

    const saleId = crypto.randomUUID();
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const statements = [];

    // 1. Prepare the Sale record insertion
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO provision_sales (id, branch_id, invoice_number, customer_id, customer_name, total_amount, amount_paid, balance, payment_method, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        saleId, branchId, invoiceNumber, payment.customerId || null, payment.customerName || 'Walk-in',
        payment.totalAmount, payment.amountPaid, payment.balance, payment.method, employeeName
      )
    );

    // 2. Loop through cart to deduct stock, add sale items, and log movements
    for (const item of cart) {
      // Insert sale item
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO provision_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), saleId, item.id, item.name, item.quantity, item.price, item.quantity * item.price)
      );

      // Deduct Inventory
      statements.push(
        c.env.DB.prepare(`
          UPDATE provision_products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `).bind(item.quantity, item.id)
      );

      // Audit Trail (Movements)
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_out, reference, employee_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), branchId, item.id, item.name, 'Sale', item.quantity, invoiceNumber, employeeName)
      );
    }

    // 3. Update Customer Balance if there is a debt (Partial Payment)
    if (payment.balance > 0 && payment.customerId) {
      statements.push(
        c.env.DB.prepare(`
          UPDATE provision_customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?
        `).bind(payment.balance, payment.customerId)
      );
    }

    // 4. EXECUTE ALL AT ONCE (If one fails, they all fail. ACID compliance!)
    await c.env.DB.batch(statements);

    return c.json({ success: true, data: { invoiceNumber } });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return c.json({ success: false, error: 'Checkout failed. Please try again.' }, 500);
  }
});

// GET: Fetch Inventory Status
provision.get('/inventory', async (c) => {
  const branchId = c.req.query('branchId') || 'BR001';
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, product_code, name, unit, stock_quantity, reorder_level, status 
      FROM provision_products 
      WHERE branch_id = ? AND status = 'Active'
      ORDER BY name ASC
    `).bind(branchId).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch inventory' }, 500);
  }
});

// POST: Record a Purchase (Restock)
provision.post('/purchases', async (c) => {
  try {
    const body = await c.req.json();
    const { branchId, productId, productName, quantity, costPerUnit, employeeName } = body;

    if (!productId || quantity <= 0 || costPerUnit < 0) {
      return c.json({ success: false, error: 'Invalid purchase data' }, 400);
    }

    const purchaseId = crypto.randomUUID();
    const purchaseCode = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = quantity * costPerUnit;

    const statements = [
      // 1. Log the purchase
      c.env.DB.prepare(`
        INSERT INTO provision_purchases (id, branch_id, purchase_code, product_id, product_name, quantity, cost_per_unit, total_amount, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(purchaseId, branchId, purchaseCode, productId, productName, quantity, costPerUnit, totalAmount, employeeName),

      // 2. INCREASE the stock in products table
      c.env.DB.prepare(`
        UPDATE provision_products SET stock_quantity = stock_quantity + ? WHERE id = ?
      `).bind(quantity, productId),

      // 3. Audit Trail (Movements)
      c.env.DB.prepare(`
        INSERT INTO provision_movements (id, branch_id, product_id, product_name, movement_type, quantity_in, reference, employee_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), branchId, productId, productName, 'Purchase', quantity, purchaseCode, employeeName)
    ];

    // Execute atomic batch
    await c.env.DB.batch(statements);

    return c.json({ success: true, data: { purchaseCode, totalAmount } });
  } catch (error: any) {
    console.error('Purchase Error:', error);
    return c.json({ success: false, error: 'Failed to record purchase.' }, 500);
  }
});

// GET: List Purchase History
provision.get('/purchases', async (c) => {
  const branchId = c.req.query('branchId') || 'BR001';
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, purchase_code, product_name, quantity, cost_per_unit, total_amount, employee_name, created_at 
      FROM provision_purchases 
      WHERE branch_id = ? 
      ORDER BY created_at DESC
    `).bind(branchId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Fetch Purchases Error:', error);
    return c.json({ success: false, error: 'Failed to fetch purchase history' }, 500);
  }
});

export default provision;
