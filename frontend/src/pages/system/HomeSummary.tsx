import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  Landmark,
  WashingMachine,
  Users,
  ShieldCheck,
  History,
  Settings,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { getHomeSummary } from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';

export default function HomeSummary() {
  const { session } = useAuthStore();
  const { tenant, formatCurrency } = useAmanaUI();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getHomeSummary()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const enabled = tenant.enabledModules || ['provision', 'banking', 'laundry'];
  const isOwner = session?.role === 'Owner' || session?.role === 'SuperAdmin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] border border-[#38BDF8]/20">
            {session?.role} Workspace
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">
            Welcome back, {session?.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            • {tenant.shopName}
          </p>
        </div>

        {session?.role === 'SuperAdmin' && (
          <Link
            to="/superadmin"
            className="px-4 py-2.5 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8] border border-[#0088FF]/20 text-xs font-bold flex items-center gap-2 hover:bg-[#0088FF] hover:text-white transition-all"
          >
            <Crown size={15} /> Open SaaS Control Plane
          </Link>
        )}
      </div>

      {isLoading || !data ? (
        <div className="p-12 text-center text-slate-400">
          Loading today's business summary...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Provision Store Card */}
          {enabled.includes('provision') && (
            <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8]">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Provision Store</h3>
                    <span className="text-[11px] text-slate-400">
                      Retail & Inventory
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Today's Sales
                    </div>
                    <div className="text-lg font-black text-[#0088FF] dark:text-[#38BDF8] tabular-nums mt-0.5">
                      {formatCurrency(data.provision.todaySales)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {data.provision.todaySalesCount} sale(s)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Low / Out Stock
                    </div>
                    <div
                      className={`text-lg font-black tabular-nums mt-0.5 ${
                        data.provision.lowStock > 0
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {data.provision.lowStock} / {data.provision.outOfStock}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Debt: {formatCurrency(data.provision.customerDebtTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(isOwner ? '/provision/dashboard' : '/provision/pos')
                }
                className="w-full py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Provision Store <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* 2. POS Agent Banking Card */}
          {enabled.includes('banking') && (
            <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8]">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">
                      POS Agent Banking
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Cash & Float Terminal
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Cash Now
                    </div>
                    <div className="text-lg font-black text-emerald-500 tabular-nums mt-0.5">
                      {data.banking.dayOpened
                        ? formatCurrency(data.banking.cashNow)
                        : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {data.banking.dayOpened
                        ? `${data.banking.todayTxCount} tx(s)`
                        : 'Day not opened'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Float Now
                    </div>
                    <div className="text-lg font-black text-[#0088FF] dark:text-[#38BDF8] tabular-nums mt-0.5">
                      {data.banking.dayOpened
                        ? formatCurrency(data.banking.floatNow)
                        : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Charges: {formatCurrency(data.banking.todayCharges)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(
                    isOwner ? '/banking/dashboard' : '/banking/transactions',
                  )
                }
                className="w-full py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Open POS Banking <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* 3. Laundry Service Card */}
          {enabled.includes('laundry') && (
            <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8]">
                    <WashingMachine size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Laundry Service</h3>
                    <span className="text-[11px] text-slate-400">
                      Drop-Off & Pickup Pipeline
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Orders Today
                    </div>
                    <div className="text-lg font-black text-[#0088FF] dark:text-[#38BDF8] tabular-nums mt-0.5">
                      {data.laundry.todayOrders}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Paid: {formatCurrency(data.laundry.todayRevenue)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Outstanding
                    </div>
                    <div
                      className={`text-lg font-black tabular-nums mt-0.5 ${
                        data.laundry.outstandingBalance > 0
                          ? 'text-rose-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {formatCurrency(data.laundry.outstandingBalance)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {data.laundry.overdueCount > 0
                        ? `⚠️ ${data.laundry.overdueCount} overdue`
                        : `${data.laundry.outstandingCount} order(s)`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(isOwner ? '/laundry/dashboard' : '/laundry/orders')
                }
                className="w-full py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Open Laundry Service <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner System Administration Quick Bar */}
      {isOwner && (
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            System & Security Administration
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/system/employees"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200/70 dark:border-slate-800 hover:border-[#38BDF8] flex items-center gap-2.5 text-xs font-bold transition-all"
            >
              <Users size={16} className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
              Staff Accounts
            </Link>
            <Link
              to="/system/permissions"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200/70 dark:border-slate-800 hover:border-[#38BDF8] flex items-center gap-2.5 text-xs font-bold transition-all"
            >
              <ShieldCheck
                size={16}
                className="text-[#0088FF] dark:text-[#38BDF8]"
              />{' '}
              V/A/E/D Permissions
            </Link>
            <Link
              to="/system/auditlog"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200/70 dark:border-slate-800 hover:border-[#38BDF8] flex items-center gap-2.5 text-xs font-bold transition-all"
            >
              <History
                size={16}
                className="text-[#0088FF] dark:text-[#38BDF8]"
              />{' '}
              Audit Trail
            </Link>
            <Link
              to="/system/settings"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200/70 dark:border-slate-800 hover:border-[#38BDF8] flex items-center gap-2.5 text-xs font-bold transition-all"
            >
              <Settings
                size={16}
                className="text-[#0088FF] dark:text-[#38BDF8]"
              />{' '}
              Shop Branding
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
