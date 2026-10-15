import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Store,
  Landmark,
  WashingMachine,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function AppLayout() {
  const { session, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to highlight active menu items
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-[#f4f6f5] font-sans text-gray-900">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* Brand Area */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-provision to-green-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            A
          </div>
          <div>
            <h2 className="font-bold text-brand-provision leading-tight">
              Al Ameen
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              Business System
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2 px-3">
            Overview
          </div>

          <Link
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-green-50 text-brand-provision font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-3">
            Modules
          </div>

          {/* Add ChevronDown and ChevronRight to your lucide-react imports at the top! */}

          <div className="space-y-1">
            <Link
              to="/provision/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/provision')
                  ? 'bg-green-50 text-brand-provision font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store size={18} />
                Provision Store
              </div>
            </Link>

            {/* Sub-menu visible only when in the provision module */}
            {isActive('/provision') && (
              <div className="ml-9 space-y-1 mt-1 border-l-2 border-green-100 pl-2">
                <Link
                  to="/provision/pos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive('/provision/pos') ? 'bg-green-100/50 text-green-800 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  POS Terminal
                </Link>
                <Link
                  to="/provision/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive('/provision/products') ? 'bg-green-100/50 text-green-800 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Products
                </Link>
                <Link
                  to="/provision/inventory"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive('/provision/inventory') ? 'bg-green-100/50 text-green-800 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Inventory
                </Link>

                <Link
                  to="/provision/purchases"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive('/provision/purchases') ? 'bg-green-100/50 text-green-800 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Purchases
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/banking"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/banking')
                ? 'bg-blue-50 text-brand-banking font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Landmark size={18} />
            POS Banking
          </Link>

          <Link
            to="/laundry"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/laundry')
                ? 'bg-purple-50 text-brand-laundry font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <WashingMachine size={18} />
            Laundry Service
          </Link>
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {session?.name || 'User'}
              </p>
              <span className="inline-block px-2 py-0.5 bg-green-100 text-brand-provision text-[10px] font-bold rounded-full">
                {session?.role || 'Staff'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 shrink-0">
          <div className="font-bold text-brand-provision">Al Ameen</div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-600"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />{' '}
          {/* This is where our actual page components will be rendered */}
        </main>
      </div>
    </div>
  );
}
