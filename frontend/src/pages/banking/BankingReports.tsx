import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getBankingReport } from '../../services/api';

export default function BankingReports() {
  const branchId = 'BR002';
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
      const data = await getBankingReport(branchId, startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error(err);
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
      'Transaction ID',
      'Date',
      'Time',
      'Type',
      'Provider',
      'Customer',
      'Phone',
      'Amount',
      'Charge',
      'Charge Source',
      'Cash Delta',
      'Float Delta',
      'Status',
      'Employee',
    ];
    const rows = report.transactions.map((t: any) => [
      t.transaction_code,
      t.tx_date,
      t.tx_time,
      t.type,
      `"${(t.provider || '').replace(/"/g, '""')}"`,
      `"${(t.customer_name || '').replace(/"/g, '""')}"`,
      `"${(t.customer_phone || '').replace(/"/g, '""')}"`,
      t.amount,
      t.charge,
      `"${(t.charge_source || '').replace(/"/g, '""')}"`,
      t.cash_delta,
      t.float_delta,
      t.status,
      `"${(t.recorded_by || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r: any[]) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Banking_Transactions_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            POS Banking Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyze transaction volume, service charges earned, and export to
            CSV.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
        >
          <Download size={16} /> Export Transactions CSV
        </button>
      </div>

      {/* Date Presets */}
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
                  ? 'bg-brand-banking text-white'
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-brand-banking">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Successful Tx
              </div>
              <div className="text-xl font-black text-brand-banking mt-1">
                {report.transactionCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-400">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Volume
              </div>
              <div className="text-xl font-black text-gray-900 mt-1">
                ₦{report.totalVolume.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-600">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Charges Earned
              </div>
              <div className="text-xl font-black text-green-600 mt-1">
                ₦{report.totalCharges.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Expenses
              </div>
              <div className="text-xl font-black text-amber-600 mt-1">
                ₦{report.totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-600">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Net Profit
              </div>
              <div className="text-xl font-black text-green-600 mt-1">
                ₦{report.netProfit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Failed
              </div>
              <div className="text-xl font-black text-red-600 mt-1">
                {report.failedCount}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Reversed
              </div>
              <div className="text-xl font-black text-amber-600 mt-1">
                {report.reversedCount}
              </div>
            </div>
          </div>

          {/* 4 Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Charges by Type
              </h3>
              {report.byType.length === 0 ? (
                <p className="text-xs text-gray-400">No data</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.byType.map((r: any) => (
                    <div key={r.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-bold text-gray-900">
                        ₦{r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Charges by Provider
              </h3>
              {report.byProvider.length === 0 ? (
                <p className="text-xs text-gray-400">No data</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.byProvider.map((r: any) => (
                    <div key={r.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-bold text-brand-banking">
                        ₦{r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Charges by Employee
              </h3>
              {report.byEmployee.length === 0 ? (
                <p className="text-xs text-gray-400">No data</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.byEmployee.map((r: any) => (
                    <div key={r.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-bold text-green-600">
                        ₦{r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Expenses by Category
              </h3>
              {report.expenseBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400">No expenses</p>
              ) : (
                <div className="divide-y divide-gray-100 text-sm">
                  {report.expenseBreakdown.map((r: any) => (
                    <div key={r.label} className="py-2 flex justify-between">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-bold text-amber-600">
                        ₦{r.amount.toLocaleString()}
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
                Transactions in Range ({report.transactions.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">ID & Date</th>
                    <th className="px-5 py-3.5">Type & Provider</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Charge</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-bold text-gray-900">
                          {t.transaction_code}
                        </div>
                        <div className="text-xs text-gray-400">
                          {t.tx_date} {t.tx_time}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900">{t.type}</div>
                        <div className="text-xs text-gray-500">
                          {t.provider}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{t.customer_name || '—'}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        ₦{Number(t.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-green-600">
                        ₦{Number(t.charge).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-xs">
                        {t.status}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {t.recorded_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
