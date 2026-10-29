import { useState, useEffect } from 'react';
import {
  Trophy,
  AlertTriangle,
  Package,
  Users,
  Wallet,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { getProvisionDashboard } from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';

export default function ProvisionDashboard() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = session?.branchId || 'BR001';

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProvisionDashboard(branchId)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading store dashboard...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Sales Today',
      value: formatCurrency(data.todayRevenue),
      sub: `${data.todaySalesCount} invoice(s) today`,
      accent: 'text-[#0088FF] dark:text-[#38BDF8]',
    },
    {
      label: 'Profit Today',
      value: formatCurrency(data.todayProfit),
      sub: 'Gross margin today',
      accent: 'text-emerald-500',
    },
    {
      label: 'Sales This Month',
      value: formatCurrency(data.monthRevenue),
      sub: 'Current calendar month',
      accent: 'text-[#0088FF] dark:text-[#38BDF8]',
    },
    {
      label: 'Net Profit (Month)',
      value: formatCurrency(data.monthNetProfit),
      sub: `Less ${formatCurrency(data.monthExpenses)} expenses`,
      accent: 'text-emerald-500',
    },
    {
      label: 'Inventory Cost Value',
      value: formatCurrency(data.inventoryCostValue),
      sub: 'Capital tied up on shelves',
      accent: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Retail Value (All Sold)',
      value: formatCurrency(data.inventoryRetailValue),
      sub: `Potential Profit: ${formatCurrency(data.inventoryPotentialProfit)}`,
      accent: 'text-[#0088FF] dark:text-[#38BDF8]',
    },
    {
      label: 'Active Products',
      value: data.totalProducts,
      sub: `${data.inStock} healthy in stock`,
      accent: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Customer Credit Debt',
      value: formatCurrency(data.customerDebtTotal),
      sub: `Credit today: ${formatCurrency(data.creditToday)}`,
      accent: 'text-rose-500',
    },
  ];

  const monthlyTrend: Array<{
    month: string;
    revenue: number;
    profit: number;
  }> = data.monthlyTrend || [];
  const maxMonthRev = Math.max(1, ...monthlyTrend.map((m) => m.revenue));
  const maxTopQty =
    data.topProducts?.length > 0
      ? Math.max(1, ...data.topProducts.map((p: any) => p.qty))
      : 1;

  const totalInvCount = Math.max(
    1,
    (data.inStock || 0) +
      (data.lowStockCount || 0) +
      (data.outOfStockCount || 0),
  );
  const inStockPct = Math.round(((data.inStock || 0) / totalInvCount) * 100);
  const lowStockPct = Math.round(
    ((data.lowStockCount || 0) / totalInvCount) * 100,
  );
  const outStockPct = Math.round(
    ((data.outOfStockCount || 0) / totalInvCount) * 100,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Header + Live Physical Drawer Cash Pill */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] border border-[#38BDF8]/20">
            Provision Store Analytics
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1.5">
            Provision Store Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time sales, profit trends, drawer cash position, and stock
            valuation.
          </p>
        </div>

        {/* Physical Drawer Cash Status Card */}
        <div className="bg-white dark:bg-[#111318] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8]">
            <Wallet size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Physical Drawer Cash
            </div>
            <div className="text-sm font-black tabular-nums">
              {data.drawer?.dayOpened ? (
                <>
                  {formatCurrency(data.drawer.expectedCash)}{' '}
                  <span
                    className={`text-[11px] font-bold ml-1 ${data.drawer.dayClosed ? 'text-amber-500' : 'text-emerald-500'}`}
                  >
                    ● {data.drawer.dayClosed ? 'Closed' : 'Open'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  Drawer Not Opened Today
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 8-Card Bento KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{k.label}</span>
              <ArrowUpRight
                size={13}
                className="text-slate-300 dark:text-slate-600"
              />
            </div>
            <div
              className={`text-2xl font-black tabular-nums mt-2 ${k.accent}`}
            >
              {k.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Interactive Monthly Sales & Profit Trend Chart + Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart3
                  size={17}
                  className="text-[#0088FF] dark:text-[#38BDF8]"
                />
                Monthly Sales & Profit Trend ({new Date().getFullYear()})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Jan – Dec revenue vs. gross profit performance
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0088FF]" />{' '}
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{' '}
                Profit
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 pt-6 px-1 border-b border-slate-100 dark:border-slate-800">
            {monthlyTrend.map((m) => {
              const revH =
                m.revenue > 0
                  ? Math.max(8, Math.round((m.revenue / maxMonthRev) * 100))
                  : 2;
              const profH =
                m.profit > 0
                  ? Math.max(6, Math.round((m.profit / maxMonthRev) * 100))
                  : 0;
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      className="w-full max-w-[16px] bg-[#0088FF] hover:bg-[#38BDF8] rounded-t transition-all"
                      style={{ height: `${revH}%` }}
                      title={`${m.month} Revenue: ${formatCurrency(m.revenue)}`}
                    />
                    {profH > 0 && (
                      <div
                        className="w-full max-w-[12px] bg-emerald-500 rounded-t transition-all"
                        style={{ height: `${profH}%` }}
                        title={`${m.month} Profit: ${formatCurrency(m.profit)}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-12 pt-2 text-center text-[10px] font-mono text-slate-400">
            {monthlyTrend.map((m) => (
              <span key={m.month}>{m.month}</span>
            ))}
          </div>
        </div>

        {/* Inventory Health Distribution */}
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2 mb-1">
              <Package
                size={17}
                className="text-[#0088FF] dark:text-[#38BDF8]"
              />{' '}
              Inventory Status
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Stock health across {data.totalProducts} active product(s)
            </p>

            <div className="space-y-4">
              {[
                {
                  label: 'In Stock (Healthy)',
                  count: data.inStock,
                  pct: inStockPct,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Low Stock Alert',
                  count: data.lowStockCount,
                  pct: lowStockPct,
                  color: 'bg-amber-500',
                },
                {
                  label: 'Out of Stock',
                  count: data.outOfStockCount,
                  pct: outStockPct,
                  color: 'bg-rose-500',
                },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      {row.label}
                    </span>
                    <span className="tabular-nums">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
            <span className="text-slate-400 flex items-center gap-1.5">
              <Users size={14} /> Customer Debt:
            </span>
            <span className="font-black text-rose-500 tabular-nums">
              {formatCurrency(data.customerDebtTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Selling Products & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Trophy size={17} className="text-amber-500" /> Top Selling Products
            (Units Sold)
          </h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No sales recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p: any, idx: number) => (
                <div key={p.name} className="flex items-center gap-3 text-xs">
                  <span className="w-6 h-6 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold w-40 truncate">{p.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0088FF] rounded-full"
                      style={{ width: `${(p.qty / maxTopQty) * 100}%` }}
                    />
                  </div>
                  <span className="font-black tabular-nums w-10 text-right">
                    {p.qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={17} className="text-rose-500" /> Low & Out of
            Stock Alerts
          </h3>
          {data.outOfStockItems.length === 0 &&
          data.lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              All stock levels look healthy! 🎉
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-56 overflow-y-auto">
              {data.outOfStockItems.map((name: string) => (
                <div
                  key={name}
                  className="py-2.5 flex justify-between items-center"
                >
                  <span className="font-bold">{name}</span>
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-full font-bold">
                    OUT OF STOCK
                  </span>
                </div>
              ))}
              {data.lowStockItems.map((label: string) => (
                <div
                  key={label}
                  className="py-2.5 flex justify-between items-center"
                >
                  <span className="font-medium">{label}</span>
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full font-bold">
                    LOW STOCK
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
