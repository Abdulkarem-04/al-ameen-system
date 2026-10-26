import { Hono } from 'hono';
import { cors } from 'hono/cors';
import provisionRoutes from './provision';
import bankingRoutes from './banking';

// 1. Tell TypeScript about our Cloudflare D1 Database binding
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 2. Enable CORS so our Vite frontend (port 5173) can talk to this API (port 8787) safely
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    // allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// A simple health check route
app.get('/', (c) => c.text('Al Ameen API is running!'));

// 3. The Login Endpoint
app.post('/api/login', async (c) => {
  try {
    const body = await c.req.json();
    const { code, pin } = body;

    if (!code || !pin) {
      return c.json(
        { success: false, error: 'Employee code and PIN are required.' },
        400,
      );
    }

    // 4. Query the D1 database for the employee
    const stmt = c.env.DB.prepare(
      `SELECT * FROM employees WHERE code = ? AND status = 'Active'`,
    );
    const employee = await stmt.bind(code).first();

    // Deliberately vague error for security (don't reveal if code OR pin was wrong)
    if (!employee) {
      return c.json(
        { success: false, error: 'Invalid employee code or PIN.' },
        401,
      );
    }

    // 5. Check PIN (Handling the plain text '0000' we seeded for now)
    // Note: We will add the proper SHA-256 hashing logic later to match the old system
    let isValid = false;
    if (employee.pin_hash === pin) {
      isValid = true;
    }

    if (!isValid) {
      return c.json(
        { success: false, error: 'Invalid employee code or PIN.' },
        401,
      );
    }

    // 6. Generate a simple session token
    const token = crypto.randomUUID();

    // Return the exact JSON structure the old frontend expects
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
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return c.json({ success: false, error: 'Internal server error.' }, 500);
  }
});

app.route('/api/provision', provisionRoutes);
app.route('/api/banking', bankingRoutes);

export default app;
