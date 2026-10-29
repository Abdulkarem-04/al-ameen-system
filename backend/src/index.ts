import { Hono } from 'hono';
import { cors } from 'hono/cors';
import coreRoutes from './core';
import provisionRoutes from './provision';
import bankingRoutes from './banking';
import laundryRoutes from './laundry';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// Always return JSON on any unhandled backend error so the frontend never gets "Unexpected token 'I'"
app.onError((err, c) => {
  console.error('Backend Error:', err);
  return c.json(
    { success: false, error: err.message || 'Internal server error' },
    500,
  );
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: `API route not found: ${c.req.method} ${c.req.path}`,
    },
    404,
  );
});

app.get('/', (c) => c.text('AmanaHQ v2.0 Edge API is running!'));

app.route('/api', coreRoutes);
app.route('/api/provision', provisionRoutes);
app.route('/api/banking', bankingRoutes);
app.route('/api/laundry', laundryRoutes);

export default app;
