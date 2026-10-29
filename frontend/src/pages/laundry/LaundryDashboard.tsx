import { useState, useEffect } from 'react';
import { WashingMachine, AlertTriangle, Shirt } from 'lucide-react';
import { getLaundryDashboard } from '../../services/api';
import { useAmanaUI } from '../../store/authStore';

export default function LaundryDashboard() {
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLaundryDashboard(branchId)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading laundry overview...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Cash Revenue Today',
      value: formatCurrency(data.todayRevenue),
      accent: 'text-[#0088FF] dark:text-[#38BDF8]',
    },
    {
      label: 'Profit Today',
      value: formatCurrency(data.todayProfit),
      accent: 'text-emerald-500',
    },
    {
      label: 'Orders Received Today',
      value: data.ordersReceivedToday,
      accent: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Orders Collected Today',
      value: data.ordersCollectedToday,
      accent: 'text-emerald-500',
    },
    {
      label: 'Pending / Uncollected',
      value: data.pendingCount,
      accent: 'text-amber-500',
    },
    {
      label: 'Outstanding Balances',
      value: formatCurrency(data.pendingValue),
      accent: 'text-rose-500',
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(data.monthRevenue),
      accent: 'text-[#0088FF] dark:text-[#38BDF8]',
    },
    {
      label: 'Net Profit (Month)',
      value: formatCurrency(data.monthNetProfit),
      accent: 'text-emerald-500',
    },
  ];

  const maxItemAmt =
    data.revenueByItemType.length > 0
      ? Math.max(...data.revenueByItemType.map((r: any) => r.amount))
      : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <WashingMachine className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
            Laundry Service Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cash-basis revenue, garment drop-off pipeline, and overdue pickup
            alerts.
          </p>
        </div>
      </div>

      {/* OVERDUE ORDERS RED ALERT BANNER */}
      {data.overdueCount > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-rose-500 font-extrabold text-sm">
            <AlertTriangle size={18} />
            <span>
              {data.overdueCount} Order(s) Overdue: Past Expected Ready Date &
              Not Yet Collected!
            </span>
          </div>
          <div className="space-y-1 pl-6 text-xs font-medium text-rose-600 dark:text-rose-300">
            {data.overdueItems.map((item: string, idx: number) => (
              <div key={idx}>• {item}</div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {k.label}
            </div>
            <div
              className={`text-2xl font-black tabular-nums mt-1.5 ${k.accent}`}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue by Garment Item Type */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Shirt size={18} className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Revenue by Garment / Item Type
        </h3>
        {data.revenueByItemType.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No garment items recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.revenueByItemType.map((r: any) => (
              <div key={r.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{r.label}</span>
                  <span className="tabular-nums">
                    {formatCurrency(r.amount)}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0088FF] rounded-full"
                    style={{ width: `${(r.amount / maxItemAmt) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
