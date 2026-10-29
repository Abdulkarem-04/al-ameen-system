import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DesignPreview from './pages/DesignPreview';
import AuthGuard from './components/AuthGuard';
import AppLayout from './layouts/AppLayout';
import HausaAutoTranslator from './components/HausaAutoTranslator';

// Provision Store Pages
import ProvisionDashboard from './pages/provision/ProvisionDashboard';
import POS from './pages/provision/POS';
import SalesHistory from './pages/provision/SalesHistory';
import Products from './pages/provision/Products';
import Inventory from './pages/provision/Inventory';
import Purchases from './pages/provision/Purchases';
import Customers from './pages/provision/Customers';
import Ledger from './pages/provision/Ledger';
import Expenses from './pages/provision/Expenses';
import StockTools from './pages/provision/StockTools';
import ProvisionReports from './pages/provision/ProvisionReports';

// POS Agent Banking Pages
import BankingDashboard from './pages/banking/BankingDashboard';
import Transactions from './pages/banking/Transactions';
import CashFloat from './pages/banking/CashFloat';
import BankingCustomers from './pages/banking/BankingCustomers';
import BankingExpenses from './pages/banking/BankingExpenses';
import BankingSettings from './pages/banking/Settings';
import BankingReports from './pages/banking/BankingReports';

// Laundry Service Pages
import LaundryDashboard from './pages/laundry/LaundryDashboard';
import LaundryOrders from './pages/laundry/LaundryOrders';
import LaundryCustomers from './pages/laundry/LaundryCustomers';
import LaundryLedger from './pages/laundry/LaundryLedger';
import LaundryExpenses from './pages/laundry/LaundryExpenses';
import LaundrySettings from './pages/laundry/LaundrySettings';
import LaundryReports from './pages/laundry/LaundryReports';

// System Admin & SaaS Control Plane Pages
import HomeSummary from './pages/system/HomeSummary';
import Employees from './pages/system/Employees';
import PermissionsMatrix from './pages/system/PermissionsMatrix';
import AuditLog from './pages/system/AuditLog';
import ShopSettings from './pages/system/ShopSettings';
import AboutApp from './pages/system/AboutApp';
import SuperAdminConsole from './pages/system/SuperAdminConsole';

function App() {
  return (
    <BrowserRouter>
      <HausaAutoTranslator />
      <Routes>
        {/* Public Marketing & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/design-preview" element={<DesignPreview />} />

        {/* Protected Workspace Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<HomeSummary />} />

            {/* Module 1: Provision Store */}
            <Route
              path="/provision"
              element={<Navigate to="/provision/pos" replace />}
            />
            <Route
              path="/provision/dashboard"
              element={<ProvisionDashboard />}
            />
            <Route path="/provision/pos" element={<POS />} />
            <Route path="/provision/sales-history" element={<SalesHistory />} />
            <Route path="/provision/products" element={<Products />} />
            <Route path="/provision/inventory" element={<Inventory />} />
            <Route path="/provision/purchases" element={<Purchases />} />
            <Route path="/provision/customers" element={<Customers />} />
            <Route path="/provision/ledger" element={<Ledger />} />
            <Route path="/provision/expenses" element={<Expenses />} />
            <Route path="/provision/stocktools" element={<StockTools />} />
            <Route path="/provision/reports" element={<ProvisionReports />} />

            {/* Module 2: POS Agent Banking */}
            <Route
              path="/banking"
              element={<Navigate to="/banking/transactions" replace />}
            />
            <Route path="/banking/dashboard" element={<BankingDashboard />} />
            <Route path="/banking/transactions" element={<Transactions />} />
            <Route path="/banking/cashfloat" element={<CashFloat />} />
            <Route path="/banking/customers" element={<BankingCustomers />} />
            <Route path="/banking/expenses" element={<BankingExpenses />} />
            <Route path="/banking/settings" element={<BankingSettings />} />
            <Route path="/banking/reports" element={<BankingReports />} />

            {/* Module 3: Laundry Service */}
            <Route
              path="/laundry"
              element={<Navigate to="/laundry/orders" replace />}
            />
            <Route path="/laundry/dashboard" element={<LaundryDashboard />} />
            <Route path="/laundry/orders" element={<LaundryOrders />} />
            <Route path="/laundry/customers" element={<LaundryCustomers />} />
            <Route path="/laundry/ledger" element={<LaundryLedger />} />
            <Route path="/laundry/expenses" element={<LaundryExpenses />} />
            <Route path="/laundry/settings" element={<LaundrySettings />} />
            <Route path="/laundry/reports" element={<LaundryReports />} />

            {/* System Administration & B2B SaaS Control Plane */}
            <Route path="/system/employees" element={<Employees />} />
            <Route path="/system/permissions" element={<PermissionsMatrix />} />
            <Route path="/system/auditlog" element={<AuditLog />} />
            <Route path="/system/settings" element={<ShopSettings />} />
            <Route path="/system/about" element={<AboutApp />} />
            <Route path="/superadmin" element={<SuperAdminConsole />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
