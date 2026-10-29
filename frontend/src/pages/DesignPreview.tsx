import { useState } from 'react';
import {
  Store,
  Landmark,
  WashingMachine,
  LayoutDashboard,
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
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Globe,
  Plus,
  Search,
  Printer,
  RotateCcw,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

type PreviewTab = 'dashboard' | 'pos' | 'permissions' | 'login';
type ActiveModule = 'provision' | 'banking' | 'laundry';

export default function DesignPreview() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<'en' | 'ha'>('en');
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(2);
  const [activeModule, setActiveModule] = useState<ActiveModule>('provision');
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Module Accent Palettes (Curated so tenants never break contrast)
  const moduleTheme = {
    provision: {
      name: lang === 'ha' ? 'Shagon Kaya' : 'Provision Store',
      badge:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeNav: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    banking: {
      name: lang === 'ha' ? 'Bankin POS' : 'POS Banking',
      badge:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      activeNav: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white',
      accentText: 'text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    laundry: {
      name: lang === 'ha' ? 'Sabis na Wanki' : 'Laundry Service',
      badge:
        'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      activeNav: 'bg-violet-600 text-white shadow-sm shadow-violet-600/20',
      btn: 'bg-violet-600 hover:bg-violet-500 text-white',
      accentText: 'text-violet-600 dark:text-violet-400',
      dot: 'bg-violet-500',
    },
  }[activeModule];

  const t = (en: string, ha: string) => (lang === 'ha' ? ha : en);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200 flex flex-col">
        {/* =========================================================
            FLOATING DESIGN STUDIO CONTROLLER (FOR KAREM'S REVIEW)
           ========================================================= */}
        <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
              <Sparkles size={12} /> AmanaHQ Design System v2
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Interactive UI/UX Prototype
            </span>
          </div>

          {/* Screen Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {[
              { id: 'dashboard', label: '1. Executive Dashboard' },
              { id: 'pos', label: '2. POS & Thermal Receipt' },
              { id: 'permissions', label: '3. V/A/E/D Matrix' },
              { id: 'login', label: '4. Login & PIN Recovery' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PreviewTab)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Environment Simulators */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 border transition-all ${
                isOffline
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-emerald-400'
              }`}
            >
              {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
              {isOffline
                ? `Offline (${offlineQueueCount} Queued)`
                : 'Online Mode'}
            </button>

            <button
              onClick={() => setLang(lang === 'en' ? 'ha' : 'en')}
              className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold flex items-center gap-1 hover:bg-slate-700"
            >
              <Globe size={13} />{' '}
              {lang === 'en' ? 'EN ✓ · Hausa' : 'Hausa ✓ · EN'}
            </button>

            <button
              onClick={() => setDark(!dark)}
              className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold flex items-center gap-1 hover:bg-slate-700"
            >
              {dark ? (
                <Sun size={13} className="text-amber-400" />
              ) : (
                <Moon size={13} />
              )}
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* =========================================================
            VIEW 4: LOGIN & PIN RECOVERY SCREEN (STANDALONE)
           ========================================================= */}
        {activeTab === 'login' ? (
          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-[380px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-900/5 relative z-10">
              <div className="flex flex-col items-center text-center mb-7">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-600/25 mb-3">
                  A
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                  AmanaHQ Verified Tenant
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Al Ameen Provision Store
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t(
                    'Sign in with your employee code and 4-digit PIN.',
                    "Shiga da lambar ma'aikaci da PIN mai lamba 4.",
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t('Employee Code', "Lambar Ma'aikaci")}
                  </label>
                  <input
                    type="text"
                    defaultValue="OWN001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t('4-Digit Security PIN', 'PIN mai Lamba 4')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {t('Forgot PIN?', 'Ka manta PIN?')}
                    </button>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    defaultValue="0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-[0.6em] font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {t('Sign In to Workspace →', 'Shiga Cikin Shago →')}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Powered by{' '}
                  <strong className="text-slate-600 dark:text-slate-300">
                    AmanaHQ
                  </strong>
                </span>
                <span className="font-mono">v2.0-PWA</span>
              </div>
            </div>

            {/* Forgot PIN Recovery Modal */}
            {showRecoveryModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-base mb-2">
                    <KeyRound size={20} /> Reset PIN via Recovery Key
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Cashiers should ask the Shop Owner to reset their PIN. If
                    you are the <strong>Shop Owner</strong>, enter your
                    12-character AmanaHQ Master Recovery Key below:
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Employee Code (e.g. OWN001)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Recovery Key (e.g. AMANA-8F3K-99PL)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="New 4-Digit PIN"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setShowRecoveryModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        alert('Owner PIN reset successfully!');
                        setShowRecoveryModal(false);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Reset Owner PIN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================
              MAIN APP SHELL (SIDEBAR + WORKSPACE)
             ========================================================= */
          <div className="flex-1 flex overflow-hidden">
            {/* MINIMALIST COMMAND SIDEBAR */}
            <aside className="w-64 bg-white dark:bg-[#0D1320] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shrink-0">
              {/* Tenant Identity Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${moduleTheme.btn} flex items-center justify-center font-black text-base shadow-xs`}
                  >
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      My Provision Store
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                      />
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {isOffline
                          ? `${offlineQueueCount} pending sync`
                          : 'Synced · Cloud D1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tenant Module Switcher Pill */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mt-3.5 text-[11px] font-bold">
                  <button
                    onClick={() => setActiveModule('provision')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      activeModule === 'provision'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Store size={12} /> Shop
                  </button>
                  <button
                    onClick={() => setActiveModule('banking')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      activeModule === 'banking'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Landmark size={12} /> POS
                  </button>
                  <button
                    onClick={() => setActiveModule('laundry')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      activeModule === 'laundry'
                        ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <WashingMachine size={12} /> Wash
                  </button>
                </div>
              </div>

              {/* Navigation Tree */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 text-[13px]">
                <div>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('Overview', 'Bayyani')}
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-semibold transition-all ${
                      activeTab === 'dashboard'
                        ? moduleTheme.activeNav
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutDashboard size={16} /> {t('Dashboard', 'Dashbod')}
                    </span>
                    <ChevronRight size={14} className="opacity-60" />
                  </button>
                </div>

                <div>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('Operations', 'Ayyuka')}
                  </div>
                  <div className="space-y-0.5">
                    {[
                      {
                        id: 'pos',
                        icon: ShoppingCart,
                        label: t('POS Terminal', 'POS Terminal'),
                        badge: 'F2',
                      },
                      {
                        id: 'saleshistory',
                        icon: History,
                        label: t('Sales & Refunds', 'Tarihin Sayarwa'),
                        badge: 'New',
                      },
                      {
                        id: 'inventory',
                        icon: Package,
                        label: t('Inventory', 'Ajiyar Kaya'),
                      },
                      {
                        id: 'products',
                        icon: Store,
                        label: t('Products', 'Kayayyaki'),
                      },
                      {
                        id: 'customers',
                        icon: Users,
                        label: t('Customers', 'Kwastamomi'),
                      },
                      {
                        id: 'ledger',
                        icon: BookOpen,
                        label: t('Credit Ledger', 'Littafin Bashi'),
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'pos') setActiveTab('pos');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-medium transition-all ${
                            isCurrent
                              ? moduleTheme.activeNav
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon size={16} /> {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                isCurrent
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('Management & System', 'Gudanarwa & Tsari')}
                  </div>
                  <div className="space-y-0.5">
                    {[
                      {
                        id: 'expenses',
                        icon: Receipt,
                        label: t('Expenses', 'Kashe Kuɗi'),
                      },
                      {
                        id: 'stocktools',
                        icon: Sliders,
                        label: t('Stock & Expiry', 'Kaya da Ƙarewa'),
                      },
                      {
                        id: 'reports',
                        icon: BarChart3,
                        label: t('Reports', 'Rahotanni'),
                      },
                      {
                        id: 'permissions',
                        icon: ShieldCheck,
                        label: t('Roles & Permissions', 'Matsayi da Izini'),
                      },
                      {
                        id: 'settings',
                        icon: Settings,
                        label: t('Shop Settings', 'Saitunan Shago'),
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'permissions')
                              setActiveTab('permissions');
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium transition-all ${
                            isCurrent
                              ? moduleTheme.activeNav
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon size={16} /> {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </nav>

              {/* Unified Bottom Control Dock */}
              <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setLang(lang === 'en' ? 'ha' : 'en')}
                    className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:border-slate-300"
                  >
                    <Globe size={12} />{' '}
                    {lang === 'en' ? 'EN · Hausa' : 'HA · English'}
                  </button>
                  <button
                    onClick={() => setDark(!dark)}
                    className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:border-slate-300"
                  >
                    {dark ? (
                      <Sun size={12} className="text-amber-400" />
                    ) : (
                      <Moon size={12} />
                    )}
                    {dark ? t('Light', 'Haske') : t('Dark', 'Duhu')}
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Al Ameen
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Owner · OWN001
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    v2.0
                  </span>
                </div>
              </div>
            </aside>

            {/* =========================================================
                MAIN WORKSPACE CONTENT AREA
               ========================================================= */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              {/* OFFLINE QUEUE BANNER (SHOWS AUTOMATICALLY WHEN INTERNET DROPS) */}
              {isOffline && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <WifiOff size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                        Offline Mode Active — Internet Connection Lost
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-400/80">
                        You can continue ringing up sales and printing receipts.{' '}
                        <strong>{offlineQueueCount} sale(s)</strong> are safely
                        saved in the device Outbox and will auto-sync when
                        internet returns.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOffline(false);
                      setOfflineQueueCount(0);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500"
                  >
                    Simulate Reconnect & Sync Now
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------------
                  TAB 1: EXECUTIVE DASHBOARD (WITH CHARTS & DRAWER CASH)
                 --------------------------------------------------------- */}
              {activeTab === 'dashboard' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${moduleTheme.badge}`}
                        >
                          {moduleTheme.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Wednesday, 28 Oct 2026
                        </span>
                      </div>
                      <h1 className="text-2xl font-extrabold tracking-tight mt-1">
                        {t('Executive Dashboard', 'Dashbod na Gudanarwa')}
                      </h1>
                    </div>

                    {/* POS Cash Drawer Quick Pill */}
                    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {t('Physical Drawer Cash', 'Kuɗin Drawer Yanzu')}
                        </div>
                        <div className="text-sm font-black tabular-nums">
                          ₦48,500{' '}
                          <span className="text-[11px] font-normal text-emerald-500 ml-1">
                            ● Open
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Minimalist Bento KPI Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: t('Sales Today', 'Sayarwar Yau'),
                        value: '₦66,715',
                        sub: '14 invoices · +18%',
                        accent: 'text-emerald-600 dark:text-emerald-400',
                      },
                      {
                        label: t('Net Profit (Month)', 'Ribar Wata'),
                        value: '₦18,625',
                        sub: '27.9% margin',
                        accent: 'text-blue-600 dark:text-blue-400',
                      },
                      {
                        label: t('Inventory Value', 'Darajar Kaya'),
                        value: '₦111,160',
                        sub: 'Cost · ₦142,800 Retail',
                        accent: 'text-violet-600 dark:text-violet-400',
                      },
                      {
                        label: t('Customer Debt', 'Bashin Kwastama'),
                        value: '₦4,700',
                        sub: '2 active debtors',
                        accent: 'text-rose-600 dark:text-rose-400',
                      },
                    ].map((kpi, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{kpi.label}</span>
                          <ArrowUpRight
                            size={14}
                            className="text-slate-300 dark:text-slate-600"
                          />
                        </div>
                        <div
                          className={`text-2xl font-black tabular-nums mt-2 ${kpi.accent}`}
                        >
                          {kpi.value}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {kpi.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row (Minimalist Vector Area Chart + Inventory Ring) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-sm">
                            {t(
                              'Monthly Sales & Profit Trend (2026)',
                              'Tarihin Sayarwa da Riba (2026)',
                            )}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Jan – Dec performance across all payment methods
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{' '}
                            Revenue
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{' '}
                            Profit
                          </span>
                        </div>
                      </div>

                      {/* Clean Minimalist Bar/Trend Visual */}
                      <div className="h-48 flex items-end gap-3 pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
                        {[
                          { m: 'May', rev: 35, prof: 12 },
                          { m: 'Jun', rev: 48, prof: 18 },
                          { m: 'Jul', rev: 42, prof: 15 },
                          { m: 'Aug', rev: 65, prof: 24 },
                          { m: 'Sep', rev: 58, prof: 21 },
                          { m: 'Oct', rev: 92, prof: 34 },
                        ].map((bar) => (
                          <div
                            key={bar.m}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="w-full flex items-end justify-center gap-1.5 h-36">
                              <div
                                className="w-full max-w-[22px] bg-emerald-500/90 hover:bg-emerald-500 rounded-t-md transition-all"
                                style={{ height: `${bar.rev}%` }}
                                title={`Revenue: ${bar.rev}%`}
                              />
                              <div
                                className="w-full max-w-[14px] bg-blue-500/80 hover:bg-blue-500 rounded-t-md transition-all"
                                style={{ height: `${bar.prof}%` }}
                                title={`Profit: ${bar.prof}%`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between px-4 pt-2 text-[11px] font-mono text-slate-400">
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                        <span>Aug</span>
                        <span>Sep</span>
                        <span className="font-bold text-emerald-500">Oct</span>
                      </div>
                    </div>

                    {/* Inventory Health & Payment Split */}
                    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm mb-1">
                          {t('Inventory Health', 'Matsayin Kaya')}
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                          Live stock distribution against reorder levels
                        </p>

                        <div className="space-y-3.5">
                          {[
                            {
                              label: t('In Stock', 'A Ajiye'),
                              count: 42,
                              pct: 78,
                              color: 'bg-emerald-500',
                            },
                            {
                              label: t('Low Stock Alert', 'Ƙarancin Kaya'),
                              count: 8,
                              pct: 15,
                              color: 'bg-amber-500',
                            },
                            {
                              label: t('Out of Stock', 'Ya Ƙare'),
                              count: 4,
                              pct: 7,
                              color: 'bg-rose-500',
                            },
                          ].map((row) => (
                            <div key={row.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-600 dark:text-slate-300">
                                  {row.label}
                                </span>
                                <span className="tabular-nums">
                                  {row.count} items ({row.pct}%)
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${row.color} rounded-full`}
                                  style={{ width: `${row.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Refunds Today:</span>
                        <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                          0 (₦0)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------
                  TAB 2: POS TERMINAL + 80MM THERMAL RECEIPT PREVIEW
                 --------------------------------------------------------- */}
              {activeTab === 'pos' && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Product Catalog & Quick Refund Bar (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
                      <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                          <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            placeholder={t(
                              'Scan barcode or search product...',
                              'Nemi sunan kaya ko lamba...',
                            )}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none"
                          />
                        </div>
                        <button className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5">
                          <RotateCcw size={14} />{' '}
                          {t('Process Refund', 'Mayar da Kaya')}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            name: 'Milo 400g Tin',
                            code: 'PRD-001',
                            stock: '45 Tins',
                            unit: 'Tin',
                            price: 550,
                            bulk: 'Carton (12)',
                            bulkPrice: 6300,
                          },
                          {
                            name: 'Peak Milk 160g',
                            code: 'PRD-004',
                            stock: '32 Tins',
                            unit: 'Tin',
                            price: 650,
                            bulk: 'Carton (24)',
                            bulkPrice: 15000,
                          },
                          {
                            name: 'Dangote Sugar 1kg',
                            code: 'PRD-005',
                            stock: '18 Bags',
                            unit: 'Bag',
                            price: 1500,
                            bulk: null,
                            bulkPrice: 0,
                          },
                          {
                            name: 'Maggi Star Cube',
                            code: 'PRD-003',
                            stock: '8 Sachets (Low)',
                            unit: 'Sachet',
                            price: 40,
                            bulk: 'Pack (20)',
                            bulkPrice: 750,
                          },
                        ].map((p) => (
                          <div
                            key={p.code}
                            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {p.stock}
                                </span>
                              </div>
                              <div className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                                ₦{p.price.toLocaleString()}{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                  / {p.unit}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                              <button className="py-1.5 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex justify-between items-center">
                                <span>+ 1 {p.unit}</span>
                                <span className="tabular-nums">
                                  ₦{p.price.toLocaleString()}
                                </span>
                              </button>
                              {p.bulk && (
                                <button className="py-1.5 px-2.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex justify-between items-center">
                                  <span>+ {p.bulk}</span>
                                  <span className="tabular-nums">
                                    ₦{p.bulkPrice.toLocaleString()}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Authentic 80mm Thermal Receipt Preview (5 cols) */}
                  <div className="lg:col-span-5">
                    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          80mm Thermal Receipt Engine
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Printer size={13} /> Print Receipt
                        </button>
                      </div>

                      {/* Thermal Paper Container */}
                      <div className="bg-white text-slate-900 font-mono text-xs p-5 rounded-xl border border-slate-200 max-w-[310px] mx-auto shadow-inner">
                        <div className="text-center space-y-0.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-black text-base flex items-center justify-center mx-auto mb-1.5">
                            A
                          </div>
                          <div className="font-bold text-sm tracking-wide uppercase">
                            My Provision Store
                          </div>
                          <div className="text-[11px] text-slate-500">
                            12 Market Road, Kano
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tel: 0803 123 4567
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-400 my-3" />

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span>Invoice:</span>
                            <strong>INV-00042</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span>28 Oct 2026, 2:15 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span>Al Ameen</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customer:</span>
                            <span>Musa Ibrahim</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-400 my-3" />

                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px]">
                              <th className="text-left pb-1">Item</th>
                              <th className="text-right pb-1">Qty</th>
                              <th className="text-right pb-1">Amt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dotted divide-slate-200">
                            <tr>
                              <td className="py-1.5">Milo 400g</td>
                              <td className="text-right py-1.5">x1 (Carton)</td>
                              <td className="text-right py-1.5 font-bold">
                                ₦6,300
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5">Dangote Sugar</td>
                              <td className="text-right py-1.5">x2 (Bag)</td>
                              <td className="text-right py-1.5 font-bold">
                                ₦3,000
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="border-t border-dashed border-slate-400 my-3" />

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between text-sm font-bold">
                            <span>TOTAL</span>
                            <span>₦9,300</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Paid (Cash):</span>
                            <span>₦10,000</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Change Given:</span>
                            <span>₦700</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Balance Owed:</span>
                            <span>₦0</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-400 my-3" />

                        <div className="text-center text-[10px] text-slate-500 space-y-1">
                          <div>Thank you for your patronage!</div>
                          <div className="font-bold text-slate-400">
                            Powered by AmanaHQ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------
                  TAB 3: ROLES & PERMISSIONS (V/A/E/D MATRIX)
                 --------------------------------------------------------- */}
              {activeTab === 'permissions' && (
                <div className="max-w-5xl mx-auto space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-xl font-extrabold tracking-tight">
                        Roles & Permissions Matrix
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>V</strong> = View · <strong>A</strong> = Add ·{' '}
                        <strong>E</strong> = Edit · <strong>D</strong> = Delete.
                        Owner is locked ON. Yellow cells indicate custom
                        overrides.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-4 font-bold">
                            Page / Module Function
                          </th>
                          <th
                            className="p-4 text-center border-l border-slate-200 dark:border-slate-800"
                            colSpan={4}
                          >
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                              Al Ameen{' '}
                              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] flex items-center gap-1">
                                <Lock size={10} /> Owner
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                              <span>V</span>
                              <span>A</span>
                              <span>E</span>
                              <span>D</span>
                            </div>
                          </th>
                          <th
                            className="p-4 text-center border-l border-slate-200 dark:border-slate-800"
                            colSpan={4}
                          >
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                              Sani Bello{' '}
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px]">
                                Cashier · CSH001
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                              <span>V</span>
                              <span>A</span>
                              <span>E</span>
                              <span>D</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {[
                          {
                            page: 'POS Terminal & Checkout',
                            cashier: [true, true, false, false],
                            custom: false,
                          },
                          {
                            page: 'Sales History & Refunds',
                            cashier: [true, true, false, false],
                            custom: true,
                          },
                          {
                            page: 'Products Master Catalog',
                            cashier: [false, false, false, false],
                            custom: false,
                          },
                          {
                            page: 'Store Expenses',
                            cashier: [true, false, false, false],
                            custom: true,
                          },
                        ].map((row) => (
                          <tr
                            key={row.page}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                          >
                            <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {row.page}
                            </td>
                            {[true, true, true, true].map((_, idx) => (
                              <td
                                key={idx}
                                className="p-2 text-center border-l border-slate-100 dark:border-slate-800/50 opacity-50"
                              >
                                <input
                                  type="checkbox"
                                  checked
                                  readOnly
                                  className="w-4 h-4 accent-emerald-600 rounded"
                                />
                              </td>
                            ))}
                            {row.cashier.map((val, idx) => (
                              <td
                                key={idx}
                                className={`p-2 text-center border-l border-slate-100 dark:border-slate-800/50 ${
                                  row.custom ? 'bg-amber-500/10' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  defaultChecked={val}
                                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
