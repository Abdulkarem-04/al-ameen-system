import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useAmanaUI } from '../store/authStore';
import { getOfflineOutbox, syncOfflineOutbox } from '../services/api';
import AmanaHQLogo from '../components/AmanaHQLogo';
import {
  LayoutDashboard,
  Store,
  Landmark,
  WashingMachine,
  ShoppingCart,
  Package,
  History,
  Users,
  BookOpen,
  Receipt,
  Sliders,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  WifiOff,
  RefreshCw,
  Truck,
  CreditCard,
  Wallet,
  Info,
  Crown,
} from 'lucide-react';

export default function AppLayout() {
  const { session, logout, canView } = useAuthStore();
  const { tenant, lang, theme, t, toggleTheme, toggleLang } = useAmanaUI();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [outboxCount, setOutboxCount] = useState(getOfflineOutbox().length);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSuperAdmin = session?.role === 'SuperAdmin';

  const currentModule: 'provision' | 'banking' | 'laundry' | 'system' =
    location.pathname.startsWith('/banking')
      ? 'banking'
      : location.pathname.startsWith('/laundry')
        ? 'laundry'
        : location.pathname.startsWith('/system') ||
            location.pathname.startsWith('/superadmin')
          ? 'system'
          : 'provision';

  useEffect(() => {
    const updateOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online && getOfflineOutbox().length > 0) {
        handleSyncOutbox();
      }
    };
    const updateOutbox = () => setOutboxCount(getOfflineOutbox().length);

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('amanahq-outbox-changed', updateOutbox);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('amanahq-outbox-changed', updateOutbox);
    };
  }, []);

  const handleSyncOutbox = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineOutbox();
      setOutboxCount(getOfflineOutbox().length);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
  const enabledModules = tenant.enabledModules || [
    'provision',
    'banking',
    'laundry',
  ];

  const navGroups = {
    provision: [
      {
        group: t('Overview'),
        items: [
          {
            path: '/dashboard',
            label: t('All-Business Home', 'Gida'),
            icon: LayoutDashboard,
            perm: 'home',
          },
          {
            path: '/provision/dashboard',
            label: t('Store Dashboard', 'Dashbod na Shago'),
            icon: BarChart3,
            perm: 'dashboard',
          },
        ],
      },
      {
        group: t('Operations'),
        items: [
          {
            path: '/provision/pos',
            label: t('POS Terminal'),
            icon: ShoppingCart,
            perm: 'pos',
          },
          {
            path: '/provision/sales-history',
            label: t('Sales & Refunds', 'Tarihin Sayarwa'),
            icon: History,
            perm: 'saleshistory',
          },
          {
            path: '/provision/inventory',
            label: t('Inventory'),
            icon: Package,
            perm: 'inventory',
          },
          {
            path: '/provision/products',
            label: t('Products'),
            icon: Store,
            perm: 'products',
          },
          {
            path: '/provision/purchases',
            label: t('Purchases'),
            icon: Truck,
            perm: 'purchases',
          },
          {
            path: '/provision/customers',
            label: t('Customers'),
            icon: Users,
            perm: 'customers',
          },
          {
            path: '/provision/ledger',
            label: t('Credit Ledger'),
            icon: BookOpen,
            perm: 'ledger',
          },
        ],
      },
      {
        group: t('Management'),
        items: [
          {
            path: '/provision/expenses',
            label: t('Expenses'),
            icon: Receipt,
            perm: 'expenses',
          },
          {
            path: '/provision/stocktools',
            label: t('Stock & Expiry'),
            icon: Sliders,
            perm: 'stocktools',
          },
          {
            path: '/provision/reports',
            label: t('Reports'),
            icon: BarChart3,
            perm: 'reports',
          },
        ],
      },
    ],
    banking: [
      {
        group: t('Overview'),
        items: [
          {
            path: '/dashboard',
            label: t('All-Business Home', 'Gida'),
            icon: LayoutDashboard,
            perm: 'home',
          },
          {
            path: '/banking/dashboard',
            label: t('Banking Overview', 'Dashbod na Banki'),
            icon: BarChart3,
            perm: 'banking_dashboard',
          },
        ],
      },
      {
        group: t('Operations'),
        items: [
          {
            path: '/banking/transactions',
            label: t('Transactions'),
            icon: CreditCard,
            perm: 'banking_transactions',
          },
          {
            path: '/banking/cashfloat',
            label: t('Cash & Float'),
            icon: Wallet,
            perm: 'banking_cashfloat',
          },
          {
            path: '/banking/customers',
            label: t('Customers'),
            icon: Users,
            perm: 'banking_customers',
          },
        ],
      },
      {
        group: t('Management'),
        items: [
          {
            path: '/banking/expenses',
            label: t('Expenses'),
            icon: Receipt,
            perm: 'banking_expenses',
          },
          {
            path: '/banking/settings',
            label: t('Settings'),
            icon: Settings,
            perm: 'banking_settings',
          },
          {
            path: '/banking/reports',
            label: t('Reports'),
            icon: BarChart3,
            perm: 'banking_reports',
          },
        ],
      },
    ],
    laundry: [
      {
        group: t('Overview'),
        items: [
          {
            path: '/dashboard',
            label: t('All-Business Home', 'Gida'),
            icon: LayoutDashboard,
            perm: 'home',
          },
          {
            path: '/laundry/dashboard',
            label: t('Laundry Overview', 'Dashbod na Wanki'),
            icon: BarChart3,
            perm: 'laundry_dashboard',
          },
        ],
      },
      {
        group: t('Operations'),
        items: [
          {
            path: '/laundry/orders',
            label: t('Orders'),
            icon: WashingMachine,
            perm: 'laundry_orders',
          },
          {
            path: '/laundry/customers',
            label: t('Customers'),
            icon: Users,
            perm: 'laundry_customers',
          },
          {
            path: '/laundry/ledger',
            label: t('Payment Ledger'),
            icon: BookOpen,
            perm: 'laundry_ledger',
          },
        ],
      },
      {
        group: t('Management'),
        items: [
          {
            path: '/laundry/expenses',
            label: t('Expenses'),
            icon: Receipt,
            perm: 'laundry_expenses',
          },
          {
            path: '/laundry/settings',
            label: t('Price List Settings'),
            icon: Settings,
            perm: 'laundry_settings',
          },
          {
            path: '/laundry/reports',
            label: t('Reports'),
            icon: BarChart3,
            perm: 'laundry_reports',
          },
        ],
      },
    ],
    system: [
      {
        group: t('System Administration', 'Tsarin Gudanarwa'),
        items: [
          {
            path: '/dashboard',
            label: t('All-Business Home', 'Gida'),
            icon: LayoutDashboard,
            perm: 'home',
          },
          {
            path: '/system/employees',
            label: t('Employees'),
            icon: Users,
            perm: 'employees',
          },
          {
            path: '/system/permissions',
            label: t('Roles & Permissions'),
            icon: ShieldCheck,
            perm: 'permissions',
          },
          {
            path: '/system/auditlog',
            label: t('Audit Log'),
            icon: History,
            perm: 'auditlog',
          },
          {
            path: '/system/settings',
            label: t('Shop Settings'),
            icon: Settings,
            perm: 'settings',
          },
          {
            path: '/system/about',
            label: t('About'),
            icon: Info,
            perm: 'about',
          },
        ],
      },
    ],
  }[currentModule];

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-slate-50 font-sans antialiased overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* COMMAND RAIL SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0C0E12] border-r border-slate-200/80 dark:border-slate-800/90 flex flex-col transition-transform duration-200 ${
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={isSuperAdmin ? '/superadmin' : '/dashboard'}
              className="flex items-center gap-3 min-w-0"
            >
              {!isSuperAdmin && tenant.logoDataUrl ? (
                <img
                  src={tenant.logoDataUrl}
                  alt="Shop logo"
                  className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <AmanaHQLogo size={36} />
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {isSuperAdmin
                    ? 'AmanaHQ Cloud'
                    : tenant.shopName || 'AmanaHQ'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !isOnline || outboxCount > 0
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-[#38BDF8]'
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {isSuperAdmin
                      ? 'Founder Control Plane'
                      : 'AmanaHQ · Cloud D1'}
                  </span>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          {/* Module Switcher Pill (Hidden when logged in as SuperAdmin) */}
          {!isSuperAdmin && (
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-[#14171F] p-1 rounded-xl mt-3.5 text-[10px] font-bold border border-transparent dark:border-slate-800/80">
              {enabledModules.includes('provision') && (
                <button
                  onClick={() => navigate('/provision/pos')}
                  className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                    currentModule === 'provision'
                      ? 'bg-white dark:bg-[#0088FF] text-[#0088FF] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Store size={13} />
                  <span>Shop</span>
                </button>
              )}
              {enabledModules.includes('banking') && (
                <button
                  onClick={() => navigate('/banking/transactions')}
                  className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                    currentModule === 'banking'
                      ? 'bg-white dark:bg-[#0088FF] text-[#0088FF] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Landmark size={13} />
                  <span>POS</span>
                </button>
              )}
              {enabledModules.includes('laundry') && (
                <button
                  onClick={() => navigate('/laundry/orders')}
                  className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                    currentModule === 'laundry'
                      ? 'bg-white dark:bg-[#0088FF] text-[#0088FF] dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <WashingMachine size={13} />
                  <span>Wash</span>
                </button>
              )}
              <button
                onClick={() => navigate('/system/settings')}
                className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                  currentModule === 'system'
                    ? 'bg-white dark:bg-[#0088FF] text-[#0088FF] dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings size={13} />
                <span>Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-[13px]">
          {isSuperAdmin ? (
            <div className="space-y-1">
              <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Founder Control Plane
              </div>
              <Link
                to="/superadmin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl font-bold transition-all ${
                  isActive('/superadmin')
                    ? 'bg-[#0088FF] text-white shadow-sm shadow-[#0088FF]/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14171F]'
                }`}
              >
                <Crown size={16} /> B2B Tenant Manager
              </Link>
              <Link
                to="/system/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl font-medium transition-all ${
                  isActive('/system/about')
                    ? 'bg-[#0088FF] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14171F]'
                }`}
              >
                <Info size={16} /> About AmanaHQ
              </Link>
            </div>
          ) : (
            navGroups.map((grp) => {
              const visibleItems = grp.items.filter((item) =>
                canView(item.perm),
              );
              if (visibleItems.length === 0) return null;
              return (
                <div key={grp.group}>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {grp.group}
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium transition-all ${
                            active
                              ? 'bg-[#0088FF] text-white font-semibold shadow-sm shadow-[#0088FF]/25'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14171F] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* Bottom Control Dock */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/90 space-y-2.5 bg-slate-50/50 dark:bg-[#09090B]">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={toggleLang}
              className="py-1.5 px-2 rounded-lg bg-white dark:bg-[#14171F] border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5"
            >
              <Globe size={12} className="text-[#0088FF] dark:text-[#38BDF8]" />
              {lang === 'en' ? 'EN · Hausa' : 'HA · English'}
            </button>
            <button
              onClick={toggleTheme}
              className="py-1.5 px-2 rounded-lg bg-white dark:bg-[#14171F] border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5"
            >
              {theme === 'dark' ? (
                <Sun size={12} className="text-amber-400" />
              ) : (
                <Moon size={12} className="text-slate-600" />
              )}
              {theme === 'dark' ? t('Light') : t('Dark')}
            </button>
          </div>

          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white dark:bg-[#14171F] border border-slate-200/60 dark:border-slate-800">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {session?.name || 'User'}
              </div>
              <div className="text-[10px] font-bold text-[#0088FF] dark:text-[#38BDF8]">
                {session?.role} · {session?.employeeCode}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t('Log Out')}
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white dark:bg-[#0C0E12] border-b border-slate-200/80 dark:border-slate-800 h-14 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <AmanaHQLogo size={30} />
            <span className="font-extrabold text-sm truncate">
              {isSuperAdmin ? 'AmanaHQ Console' : tenant.shopName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-300"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-200"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {(!isOnline || outboxCount > 0) && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <WifiOff size={15} className="shrink-0" />
              <span>
                {!isOnline
                  ? `Offline Mode — Sales are being queued safely on this device (${outboxCount} pending).`
                  : `${outboxCount} offline transaction(s) ready to sync to Cloud D1.`}
              </span>
            </div>
            {isOnline && outboxCount > 0 && (
              <button
                onClick={handleSyncOutbox}
                disabled={isSyncing}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold flex items-center gap-1 shrink-0"
              >
                <RefreshCw
                  size={12}
                  className={isSyncing ? 'animate-spin' : ''}
                />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
