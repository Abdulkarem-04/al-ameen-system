import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AuthGuard from './components/AuthGuard';
import AppLayout from './layouts/AppLayout';
import Products from './pages/provision/Products';
import POS from './pages/provision/POS';
import Inventory from './pages/provision/Inventory';
import Purchases from './pages/provision/Purchases';
import Customers from './pages/provision/Customers';
import Ledger from './pages/provision/Ledger';
import Expenses from './pages/provision/Expenses';
import StockTools from './pages/provision/StockTools';
import ProvisionDashboard from './pages/provision/ProvisionDashboard';
import ProvisionReports from './pages/provision/ProvisionReports';
import CashFloat from './pages/banking/CashFloat';
import Transactions from './pages/banking/Transactions';
import BankingSettings from './pages/banking/Settings';
import BankingDashboard from './pages/banking/BankingDashboard';
import BankingCustomers from './pages/banking/BankingCustomers';
import BankingExpenses from './pages/banking/BankingExpenses';
import BankingReports from './pages/banking/BankingReports';

// Temporary Dashboard Component
const DashboardHome = () => (
  <div>
    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
      Welcome back!
    </h1>
    <p className="text-gray-500 mb-6">
      Select a module from the sidebar to begin.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-brand-provision">
        <h3 className="font-bold text-lg mb-1">Provision Store</h3>
        <p className="text-sm text-gray-500">
          Manage sales, inventory, and purchases.
        </p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-brand-banking">
        <h3 className="font-bold text-lg mb-1">POS Banking</h3>
        <p className="text-sm text-gray-500">
          Track cash, float, and transfers.
        </p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-brand-laundry">
        <h3 className="font-bold text-lg mb-1">Laundry Service</h3>
        <p className="text-sm text-gray-500">
          Manage orders and pickup statuses.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Wrapped in AuthGuard & AppLayout) */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardHome />} />

            {/* We will add actual module pages here later */}
            <Route
              path="/provision"
              element={<Navigate to="/provision/products" replace />}
            />
            <Route path="/provision/products" element={<Products />} />
            <Route path="/provision/pos" element={<POS />} />
            <Route path="/provision/inventory" element={<Inventory />} />
            <Route path="/provision/purchases" element={<Purchases />} />
            <Route path="/provision/customers" element={<Customers />} />
            <Route path="/provision/ledger" element={<Ledger />} />
            <Route path="/provision/expenses" element={<Expenses />} />
            <Route path="/provision/stocktools" element={<StockTools />} />
            <Route
              path="/provision/dashboard"
              element={<ProvisionDashboard />}
            />
            <Route path="/provision/reports" element={<ProvisionReports />} />
            {/*<Route*/}
            {/*  path="/banking"*/}
            {/*  element={<div className="p-4">Banking Module Loading...</div>}*/}
            {/*/>*/}
            <Route
              path="/banking"
              element={<Navigate to="/banking/transactions" replace />}
            />
            <Route path="/banking/transactions" element={<Transactions />} />
            <Route path="/banking/cashfloat" element={<CashFloat />} />
            <Route path="/banking/settings" element={<BankingSettings />} />
            <Route path="/banking/dashboard" element={<BankingDashboard />} />
            <Route path="/banking/customers" element={<BankingCustomers />} />
            <Route path="/banking/expenses" element={<BankingExpenses />} />
            <Route path="/banking/reports" element={<BankingReports />} />

            <Route
              path="/laundry"
              element={<div className="p-4">Laundry Module Loading...</div>}
            />
          </Route>
        </Route>

        {/* Catch all invalid routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
