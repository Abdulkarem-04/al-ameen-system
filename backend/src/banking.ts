import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const banking = new Hono<{ Bindings: Bindings }>();

// Default Banking branch to 'BR002'
const resolveBranch = (branchId?: string | null) => {
  return !branchId || branchId === 'ALL' || branchId === 'BR001'
    ? 'BR002'
    : branchId;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTimeStr = () => new Date().toTimeString().slice(0, 8);

// Exact Cash & Float Delta Math from Original Specification
function computeBankingDeltas(
  type: string,
  amount: number,
  charge: number,
  chargeSource?: string,
) {
  const cashOnTop = chargeSource === 'Cash on top';
  if (!cashOnTop && charge > amount) {
    throw new Error(
      'Charge cannot be more than the amount when deducted from the amount sent.',
    );
  }

  let cashDelta = 0;
  let floatDelta = 0;

  if (type === 'Deposit') {
    if (cashOnTop) {
      cashDelta = amount + charge;
      floatDelta = -amount;
    } else {
      cashDelta = amount;
      floatDelta = -(amount - charge);
    }
  } else if (type === 'Withdrawal') {
    if (cashOnTop) {
      cashDelta = -amount;
      floatDelta = amount + charge;
    } else {
      cashDelta = -(amount - charge);
      floatDelta = amount;
    }
  } else if (type === 'Transfer') {
    if (cashOnTop) {
      cashDelta = charge;
      floatDelta = -amount;
    } else {
      cashDelta = 0;
      floatDelta = -(amount - charge);
    }
  } else if (['Airtime', 'Data', 'Bill Payment'].includes(type)) {
    cashDelta = 0;
    floatDelta = -(amount - charge);
  } else {
    throw new Error(`Unknown transaction type: ${type}`);
  }

  return { cashDelta, floatDelta };
}

// Shared helper to compute live Cash Now & Float Now for today
async function computeCashFloatStatus(db: D1Database, branchId: string) {
  const today = todayStr();

  const [opening, txRes, expRes, closeRow] = await Promise.all([
    db
      .prepare(
        `SELECT * FROM banking_float WHERE branch_id = ? AND tx_date = ?`,
      )
      .bind(branchId, today)
      .first<any>(),
    db
      .prepare(
        `SELECT * FROM banking_transactions WHERE branch_id = ? AND tx_date = ? AND status = 'Successful'`,
      )
      .bind(branchId, today)
      .all<any>(),
    db
      .prepare(
        `SELECT * FROM banking_expenses WHERE branch_id = ? AND tx_date = ?`,
      )
      .bind(branchId, today)
      .all<any>(),
    db
      .prepare(
        `SELECT * FROM banking_day_close WHERE branch_id = ? AND tx_date = ?`,
      )
      .bind(branchId, today)
      .first<any>(),
  ]);

  const txs = txRes.results || [];
  const exps = expRes.results || [];

  const cashDeltaSum = txs.reduce((s, t) => s + (Number(t.cash_delta) || 0), 0);
  const floatDeltaSum = txs.reduce(
    (s, t) => s + (Number(t.float_delta) || 0),
    0,
  );
  const cashExpenseTotal = exps.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0,
  );

  if (!opening) {
    return {
      dayOpened: false,
      dayClosed: Boolean(closeRow),
      openingCash: null,
      openingFloat: null,
      cashNow: null,
      floatNow: null,
      todayTransactionCount: txs.length,
      todayExpenses: cashExpenseTotal,
      openedBy: null,
      openedTime: null,
    };
  }

  const openingCash = Number(opening.opening_cash) || 0;
  const openingFloat = Number(opening.opening_float) || 0;

  return {
    dayOpened: true,
    dayClosed: Boolean(closeRow),
    openingCash,
    openingFloat,
    cashNow: openingCash + cashDeltaSum - cashExpenseTotal,
    floatNow: openingFloat + floatDeltaSum,
    todayTransactionCount: txs.length,
    todayExpenses: cashExpenseTotal,
    openedBy: opening.opened_by,
    openedTime: opening.tx_time,
    closeDetails: closeRow || null,
  };
}

// 1. SETTINGS: Charges & Providers
banking.get('/settings', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const [chargesRes, providersRes] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM banking_settings WHERE branch_id = ?`)
      .bind(branchId)
      .all(),
    c.env.DB.prepare(`SELECT * FROM banking_providers WHERE branch_id = ?`)
      .bind(branchId)
      .all(),
  ]);
  return c.json({
    success: true,
    data: {
      charges: chargesRes.results || [],
      providers: providersRes.results || [],
    },
  });
});

banking.put('/settings/charge', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const charge = Number(body.defaultCharge);
  if (isNaN(charge) || charge < 0) {
    return c.json(
      { success: false, error: 'Enter a valid charge amount.' },
      400,
    );
  }
  await c.env.DB.prepare(
    `UPDATE banking_settings SET default_charge = ? WHERE branch_id = ? AND transaction_type = ?`,
  )
    .bind(charge, branchId, body.transactionType)
    .run();

  return c.json({ success: true });
});

banking.post('/settings/providers', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const name = String(body.providerName || '').trim();
  if (!name)
    return c.json({ success: false, error: 'Provider name is required.' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO banking_providers (id, branch_id, provider_name) VALUES (?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), branchId, name)
    .run();

  return c.json({ success: true });
});

banking.delete('/settings/providers/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM banking_providers WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 2. CASH & FLOAT
banking.get('/float', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const [status, openHistory, closeHistory] = await Promise.all([
    computeCashFloatStatus(c.env.DB, branchId),
    c.env.DB.prepare(
      `SELECT * FROM banking_float WHERE branch_id = ? ORDER BY tx_date DESC LIMIT 30`,
    )
      .bind(branchId)
      .all(),
    c.env.DB.prepare(
      `SELECT * FROM banking_day_close WHERE branch_id = ? ORDER BY tx_date DESC LIMIT 30`,
    )
      .bind(branchId)
      .all(),
  ]);

  return c.json({
    success: true,
    data: {
      status,
      openHistory: openHistory.results || [],
      closeHistory: closeHistory.results || [],
    },
  });
});

banking.post('/float/open', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const today = todayStr();
  const time = nowTimeStr();

  const existing = await c.env.DB.prepare(
    `SELECT id FROM banking_float WHERE branch_id = ? AND tx_date = ?`,
  )
    .bind(branchId, today)
    .first();

  if (existing) {
    return c.json(
      {
        success: false,
        error: `The day has already been opened for ${today}.`,
      },
      400,
    );
  }

  const cash = Number(body.openingCash);
  const float = Number(body.openingFloat);
  if (isNaN(cash) || cash < 0 || isNaN(float) || float < 0) {
    return c.json(
      { success: false, error: 'Enter valid opening cash and float amounts.' },
      400,
    );
  }

  await c.env.DB.prepare(
    `
    INSERT INTO banking_float (id, branch_id, tx_date, tx_time, opening_cash, opening_float, opened_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      crypto.randomUUID(),
      branchId,
      today,
      time,
      cash,
      float,
      body.employeeName || 'Owner',
    )
    .run();

  return c.json({ success: true, data: { date: today, time } });
});

banking.post('/float/close', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const today = todayStr();
  const time = nowTimeStr();

  const status = await computeCashFloatStatus(c.env.DB, branchId);
  if (!status.dayOpened) {
    return c.json(
      { success: false, error: 'Open the banking day before closing it.' },
      400,
    );
  }
  if (status.dayClosed) {
    return c.json(
      {
        success: false,
        error:
          'Today has already been closed. Reopen it first to make corrections.',
      },
      400,
    );
  }

  const countedCash = Number(body.countedCash);
  if (isNaN(countedCash) || countedCash < 0) {
    return c.json(
      { success: false, error: 'Enter the counted physical cash amount.' },
      400,
    );
  }

  const expectedCash = status.cashNow || 0;
  const variance = Math.round((countedCash - expectedCash) * 100) / 100;

  await c.env.DB.prepare(
    `
    INSERT INTO banking_day_close (id, branch_id, tx_date, tx_time, expected_cash, counted_cash, variance, expected_float, notes, closed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  )
    .bind(
      crypto.randomUUID(),
      branchId,
      today,
      time,
      expectedCash,
      countedCash,
      variance,
      status.floatNow || 0,
      body.notes || '',
      body.employeeName || 'Owner',
    )
    .run();

  return c.json({
    success: true,
    data: {
      date: today,
      expectedCash,
      countedCash,
      variance,
      floatNow: status.floatNow,
    },
  });
});

banking.post('/float/reopen', async (c) => {
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const today = todayStr();

  await c.env.DB.prepare(
    `DELETE FROM banking_day_close WHERE branch_id = ? AND tx_date = ?`,
  )
    .bind(branchId, today)
    .run();

  return c.json({ success: true });
});

// 3. TRANSACTIONS
banking.get('/transactions', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const dateFilter = c.req.query('date') || todayStr();

  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM banking_transactions 
    WHERE branch_id = ? AND tx_date = ?
    ORDER BY tx_time DESC, created_at DESC
  `,
  )
    .bind(branchId, dateFilter)
    .all();

  return c.json({ success: true, data: results || [] });
});

banking.post('/transactions', async (c) => {
  try {
    const body = await c.req.json();
    const branchId = resolveBranch(body.branchId);
    const today = todayStr();
    const time = nowTimeStr();

    const closed = await c.env.DB.prepare(
      `SELECT id FROM banking_day_close WHERE branch_id = ? AND tx_date = ?`,
    )
      .bind(branchId, today)
      .first();

    if (closed) {
      return c.json(
        {
          success: false,
          error:
            "Today's banking day is closed. Reopen it on Cash & Float to record more transactions.",
        },
        400,
      );
    }

    const amount = Number(body.amount);
    const charge = Number(body.charge) || 0;
    if (!body.type || !amount || amount <= 0) {
      return c.json(
        {
          success: false,
          error: 'Transaction type and a positive amount are required.',
        },
        400,
      );
    }

    const deltas = computeBankingDeltas(
      body.type,
      amount,
      charge,
      body.chargeSource,
    );
    const id = crypto.randomUUID();
    const transactionCode = `TRX-${Math.floor(10000 + Math.random() * 90000)}`;

    await c.env.DB.prepare(
      `
      INSERT INTO banking_transactions (
        id, branch_id, transaction_code, tx_date, tx_time, customer_name, customer_phone,
        type, provider, amount, charge, charge_source, cash_delta, float_delta, status, notes, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Successful', ?, ?)
    `,
    )
      .bind(
        id,
        branchId,
        transactionCode,
        today,
        time,
        body.customerName || '',
        body.customerPhone || '',
        body.type,
        body.provider || 'Others',
        amount,
        charge,
        body.chargeSource || '',
        deltas.cashDelta,
        deltas.floatDelta,
        body.notes || '',
        body.employeeName || 'Staff',
      )
      .run();

    return c.json({
      success: true,
      data: {
        id,
        transactionCode,
        cashDelta: deltas.cashDelta,
        floatDelta: deltas.floatDelta,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to record transaction',
      },
      400,
    );
  }
});

banking.patch('/transactions/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const branchId = resolveBranch(body.branchId);
  const today = todayStr();

  const closed = await c.env.DB.prepare(
    `SELECT id FROM banking_day_close WHERE branch_id = ? AND tx_date = ?`,
  )
    .bind(branchId, today)
    .first();

  if (closed) {
    return c.json(
      {
        success: false,
        error:
          "Today's banking day is closed. Reopen it to change transaction statuses.",
      },
      400,
    );
  }

  await c.env.DB.prepare(
    `UPDATE banking_transactions SET status = ?, notes = COALESCE(?, notes) WHERE id = ?`,
  )
    .bind(body.status, body.notes ?? null, id)
    .run();

  return c.json({ success: true });
});

banking.delete('/transactions/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM banking_transactions WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 4. CUSTOMERS (Live repeat-customer aggregation from transaction history)
banking.get('/customers', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM banking_transactions WHERE branch_id = ?
  `,
  )
    .bind(branchId)
    .all<any>();

  const map: Record<string, any> = {};
  (results || []).forEach((t) => {
    if (!t.customer_name && !t.customer_phone) return;
    const key = String(t.customer_phone || t.customer_name)
      .trim()
      .toLowerCase();
    if (!key) return;
    if (!map[key]) {
      map[key] = {
        name: t.customer_name || '(No name)',
        phone: t.customer_phone || '',
        transactionCount: 0,
        totalAmount: 0,
        totalCharges: 0,
        lastVisitDate: t.tx_date,
      };
    }
    const cust = map[key];
    cust.transactionCount += 1;
    cust.totalAmount += Number(t.amount) || 0;
    cust.totalCharges += Number(t.charge) || 0;
    if (t.tx_date > cust.lastVisitDate) cust.lastVisitDate = t.tx_date;
    if (t.customer_name && cust.name === '(No name)')
      cust.name = t.customer_name;
  });

  const list = Object.values(map).sort(
    (a: any, b: any) => b.transactionCount - a.transactionCount,
  );
  return c.json({ success: true, data: list });
});

// 5. EXPENSES
banking.get('/expenses', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const { results } = await c.env.DB.prepare(
    `
    SELECT * FROM banking_expenses WHERE branch_id = ? ORDER BY tx_date DESC, tx_time DESC
  `,
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results || [] });
});

banking.post('/expenses', async (c) => {
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
    INSERT INTO banking_expenses (id, branch_id, expense_code, tx_date, tx_time, category, description, amount, recorded_by)
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

banking.delete('/expenses/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM banking_expenses WHERE id = ?`)
    .bind(id)
    .run();
  return c.json({ success: true });
});

// 6. DASHBOARD & REPORTS
banking.get('/dashboard', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const today = todayStr();
  const currentMonth = today.slice(0, 7);

  const [txRes, expRes, cashFloat] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM banking_transactions WHERE branch_id = ? AND status = 'Successful'`,
    )
      .bind(branchId)
      .all<any>(),
    c.env.DB.prepare(`SELECT * FROM banking_expenses WHERE branch_id = ?`)
      .bind(branchId)
      .all<any>(),
    computeCashFloatStatus(c.env.DB, branchId),
  ]);

  const txs = txRes.results || [];
  const exps = expRes.results || [];

  const todayTx = txs.filter((t) => t.tx_date === today);
  const monthTx = txs.filter(
    (t) => String(t.tx_date).slice(0, 7) === currentMonth,
  );
  const monthExp = exps.filter(
    (e) => String(e.tx_date).slice(0, 7) === currentMonth,
  );

  const sum = (arr: any[], k: string) =>
    arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const groupSum = (arr: any[], gKey: string, sKey: string) => {
    const map: Record<string, number> = {};
    arr.forEach((r) => {
      const key = r[gKey] || 'Other';
      map[key] = (map[key] || 0) + (Number(r[sKey]) || 0);
    });
    return Object.keys(map)
      .map((label) => ({ label, amount: map[label] }))
      .sort((a, b) => b.amount - a.amount);
  };

  const monthCharges = sum(monthTx, 'charge');
  const monthExpenses = sum(monthExp, 'amount');

  return c.json({
    success: true,
    data: {
      dayOpened: cashFloat.dayOpened,
      dayClosed: cashFloat.dayClosed,
      cashNow: cashFloat.cashNow,
      floatNow: cashFloat.floatNow,
      openingCash: cashFloat.openingCash,
      openingFloat: cashFloat.openingFloat,
      todayCharges: sum(todayTx, 'charge'),
      todayVolume: sum(todayTx, 'amount'),
      todayTransactionCount: todayTx.length,
      monthCharges,
      monthExpenses,
      monthNetProfit: monthCharges - monthExpenses,
      typeBreakdownToday: groupSum(todayTx, 'type', 'amount'),
      providerBreakdownToday: groupSum(todayTx, 'provider', 'amount'),
    },
  });
});

banking.get('/reports', async (c) => {
  const branchId = resolveBranch(c.req.query('branchId'));
  const startDate = c.req.query('startDate') || '2000-01-01';
  const endDate = c.req.query('endDate') || '2099-12-31';

  const [txRes, expRes] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM banking_transactions WHERE branch_id = ? AND tx_date >= ? AND tx_date <= ? ORDER BY tx_date DESC, tx_time DESC`,
    )
      .bind(branchId, startDate, endDate)
      .all<any>(),
    c.env.DB.prepare(
      `SELECT * FROM banking_expenses WHERE branch_id = ? AND tx_date >= ? AND tx_date <= ?`,
    )
      .bind(branchId, startDate, endDate)
      .all<any>(),
  ]);

  const allTx = txRes.results || [];
  const successfulTx = allTx.filter((t) => t.status === 'Successful');
  const failedTx = allTx.filter((t) => t.status === 'Failed');
  const reversedTx = allTx.filter((t) => t.status === 'Reversed');
  const exps = expRes.results || [];

  const sum = (arr: any[], k: string) =>
    arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const groupSum = (arr: any[], gKey: string, sKey: string) => {
    const map: Record<string, number> = {};
    arr.forEach((r) => {
      const key = r[gKey] || 'Other';
      map[key] = (map[key] || 0) + (Number(r[sKey]) || 0);
    });
    return Object.keys(map)
      .map((label) => ({ label, amount: map[label] }))
      .sort((a, b) => b.amount - a.amount);
  };

  const totalVolume = sum(successfulTx, 'amount');
  const totalCharges = sum(successfulTx, 'charge');
  const totalExpenses = sum(exps, 'amount');

  return c.json({
    success: true,
    data: {
      transactionCount: successfulTx.length,
      failedCount: failedTx.length,
      reversedCount: reversedTx.length,
      totalVolume,
      totalCharges,
      totalExpenses,
      netProfit: totalCharges - totalExpenses,
      byType: groupSum(successfulTx, 'type', 'charge'),
      byProvider: groupSum(successfulTx, 'provider', 'charge'),
      byEmployee: groupSum(successfulTx, 'recorded_by', 'charge'),
      expenseBreakdown: groupSum(exps, 'category', 'amount'),
      transactions: allTx,
    },
  });
});

export default banking;
