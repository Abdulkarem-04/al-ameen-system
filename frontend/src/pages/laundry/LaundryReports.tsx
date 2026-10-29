import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getLaundryReport } from '../../services/api';
import { useAmanaUI } from '../../store/authStore';

export default function LaundryReports() {
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';
  const todayStr = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('all');
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyPreset = (type: string) => {
    setActivePreset(type);
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    let start = end;

    if (type === 'week') {
      start = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
    } else if (type === 'all') {
      start = '2020-01-01';
    }
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await getLaundryReport(branchId, startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report || !report.orders.length) {
      alert('No orders in this range to export.');
      return;
    }
    const headers = [
      'Order Number',
      'Date Received',
      'Customer',
      'Phone',
      'Total Amount',
      'Amount Paid',
      'Balance',
      'Status',
      'Expected Ready',
      'Received By',
    ];
    const rows = report.orders.map((o: any) => [
      o.order_number,
      o.date_received,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${(o.customer_phone || '').replace(/"/g, '""')}"`,
      o.total_amount,
      o.amount_paid,
      o.balance,
      o.order_status,
      o.expected_ready_date,
      `"${(o.received_by || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r: any[]) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Laundry_Orders_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Laundry Service Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze garment revenue, collected payments, outstanding balances,
            and export to CSV.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-[#0088FF] text-white px-4 py-2.5 rounded-xl font-bold text-xs"
        >
          <Download size={15} /> Export Orders CSV
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-[#111318] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activePreset === p.id
                  ? 'bg-[#0088FF] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setActivePreset('custom');
              setStartDate(e.target.value);
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setActivePreset('custom');
              setEndDate(e.target.value);
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg"
          />
        </div>
      </div>

      {isLoading || !report ? (
        <div className="p-12 text-center text-slate-400">Loading report...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Orders (Collected)
              </div>
              <div className="text-2xl font-black mt-1 tabular-nums">
                {report.orderCount}{' '}
                <span className="text-xs text-emerald-500">
                  ({report.collectedCount} collected)
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Order Value (Collected ₦)
              </div>
              <div className="text-2xl font-black text-[#0088FF] dark:text-[#38BDF8] mt-1 tabular-nums">
                {formatCurrency(report.totalRevenue)}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Outstanding Balance
              </div>
              <div className="text-2xl font-black text-rose-500 mt-1 tabular-nums">
                {formatCurrency(report.totalOutstanding)}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Net Profit
              </div>
              <div className="text-2xl font-black text-emerald-500 mt-1 tabular-nums">
                {formatCurrency(report.netProfit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'By Garment Type', rows: report.byItemType },
              { title: 'By Employee', rows: report.byEmployee },
              { title: 'By Payment Method', rows: report.byPaymentMethod },
              { title: 'Expenses by Category', rows: report.expenseBreakdown },
            ].map((panel) => (
              <div
                key={panel.title}
                className="bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800"
              >
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                  {panel.title}
                </h3>
                {panel.rows.length === 0 ? (
                  <p className="text-xs text-slate-400">No data</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {panel.rows.map((r: any) => (
                      <div key={r.label} className="py-2 flex justify-between">
                        <span>{r.label}</span>
                        <span className="font-bold tabular-nums">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
