import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getProvisionReport } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ProvisionReports() {
  const { session } = useAuthStore();
  const branchId = session?.branchId || 'BR001';

  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('today');
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
      const data = await getProvisionReport(branchId, startDate, endDate);
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report || !report.transactions.length) {
      alert('No transactions in this range to export.');
      return;
    }
    const headers = [
      'Invoice',
      'Date',
      'Customer',
      'Total Amount',
      'Profit',
      'Amount Paid',
      'Balance',
      'Payment Method',
      'Employee',
    ];
    const rows = report.transactions.map((t: any) => [
      t.invoice_number,
      t.created_at,
      `"${(t.customer_name || '').replace(/"/g, '""')}"`,
      t.total_amount,
      t.profit,
      t.amount_paid,
      t.balance,
      t.payment_method,
      `"${(t.employee_name || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r: any[]) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Provision_Sales_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Provision Store Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Filter financial performance by date range and export to Excel/CSV.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
        >
          <Download size={16} /> Export Sales CSV
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
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
                  ? 'bg-brand-provision text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setActivePreset('custom');
              setStartDate(e.target.value);
            }}
            className="p-2 border border-gray-200 rounded-lg text-xs font-bold"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setActivePreset('custom');
              setEndDate(e.target.value);
            }}
            className="p-2 border border-gray-200 rounded-lg text-xs font-bold"
          />
        </div>
      </div>

      {isLoading || !report ? (
        <div className="p-12 text-center text-gray-400">Loading report...</div>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-brand-provision">
              <div className="text-xs font-bold text-gray-400 uppercase">
                Revenue
              </div>
              <div className="text-2xl font-black text-brand-provision mt-1">
                ₦{report.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <div className="text-xs font-bold text-gray-400 uppercase">
                Gross Profit ({report.profitMarginPct.toFixed(1)}%)
              </div>
              <div className="text-2xl font-black text-green-600 mt-1">
                ₦{report.totalProfit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
              <div className="text-xs font-bold text-gray-400 uppercase">
                Expenses
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                ₦{report.totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
              <div className="text-xs font-bold text-gray-400 uppercase">
                Net Profit
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                ₦{report.netProfit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Breakdown Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm mb-3">
                Payment Methods
              </h3>
              {report.paymentMethods.length === 0 ? (
                <p className="text-xs text-gray-400">No payments in range.</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.paymentMethods.map((m: any) => (
                    <div key={m.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{m.label}</span>
                      <span className="font-bold text-gray-900">
                        ₦{m.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm mb-3">
                Expenses by Category
              </h3>
              {report.expenseBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400">No expenses in range.</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.expenseBreakdown.map((e: any) => (
                    <div key={e.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{e.label}</span>
                      <span className="font-bold text-amber-600">
                        ₦{e.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm mb-3">
                Sales by Employee
              </h3>
              {report.byEmployee.length === 0 ? (
                <p className="text-xs text-gray-400">No sales in range.</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.byEmployee.map((emp: any) => (
                    <div key={emp.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{emp.label}</span>
                      <span className="font-bold text-brand-provision">
                        ₦{emp.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-sm">
                Transactions ({report.salesCount})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Invoice</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Total</th>
                    <th className="px-6 py-3.5">Profit</th>
                    <th className="px-6 py-3.5">Payment</th>
                    <th className="px-6 py-3.5">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No transactions in this range.
                      </td>
                    </tr>
                  ) : (
                    report.transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3.5 font-mono text-xs">
                          {t.invoice_number}
                        </td>
                        <td className="px-6 py-3.5">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-gray-900">
                          {t.customer_name}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          ₦{Number(t.total_amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-green-600">
                          ₦{Number(t.profit).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">{t.payment_method}</td>
                        <td className="px-6 py-3.5 text-gray-500">
                          {t.employee_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
