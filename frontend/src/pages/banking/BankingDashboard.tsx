import { useState, useEffect } from 'react';
import {
  Wallet,
  Landmark,
  Smartphone,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { getBankingDashboard } from '../../services/api';
import { Link } from 'react-router-dom';

export default function BankingDashboard() {
  const branchId = 'BR002';
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBankingDashboard(branchId)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading banking overview...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Charges Today (Revenue)',
      value: `₦${data.todayCharges.toLocaleString()}`,
      color: 'text-green-600',
      border: 'border-l-green-600',
    },
    {
      label: 'Volume Today',
      value: `₦${data.todayVolume.toLocaleString()}`,
      color: 'text-brand-banking',
      border: 'border-l-brand-banking',
    },
    {
      label: 'Transactions Today',
      value: data.todayTransactionCount,
      color: 'text-gray-900',
      border: 'border-l-gray-700',
    },
    {
      label: 'Charges This Month',
      value: `₦${data.monthCharges.toLocaleString()}`,
      color: 'text-green-600',
      border: 'border-l-green-600',
    },
    {
      label: 'Expenses This Month',
      value: `₦${data.monthExpenses.toLocaleString()}`,
      color: 'text-amber-600',
      border: 'border-l-amber-500',
    },
    {
      label: 'Net Profit (Month)',
      value: `₦${data.monthNetProfit.toLocaleString()}`,
      color: 'text-brand-banking',
      border: 'border-l-brand-banking',
    },
  ];

  const maxTypeAmt =
    data.typeBreakdownToday.length > 0
      ? Math.max(...data.typeBreakdownToday.map((r: any) => r.amount))
      : 1;
  const maxProvAmt =
    data.providerBreakdownToday.length > 0
      ? Math.max(...data.providerBreakdownToday.map((r: any) => r.amount))
      : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            POS Banking Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live cash & float position, charges collected, and daily volume
            breakdown.
          </p>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
          {new Date().toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Live Cash & Float Banner */}
      {!data.dayOpened ? (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={24} />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">
                Today's Banking Day Has Not Been Opened Yet
              </h3>
              <p className="text-xs text-amber-700">
                Open the day with your starting cash and float balances to track
                live positions.
              </p>
            </div>
          </div>
          <Link
            to="/banking/cashfloat"
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
          >
            Open Day →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl text-white bg-gradient-to-br from-[#0a7c3e] to-[#16a34a] shadow-lg shadow-green-900/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-85">
                Cash Now (In Drawer)
              </div>
              <div className="text-3xl font-black mt-2">
                ₦{(data.cashNow || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white/15 rounded-2xl">
              <Wallet size={30} />
            </div>
          </div>

          <div className="p-6 rounded-2xl text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] shadow-lg shadow-blue-900/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-85">
                Float Now (In POS Wallet)
              </div>
              <div className="text-3xl font-black mt-2">
                ₦{(data.floatNow || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-white/15 rounded-2xl">
              <Landmark size={30} />
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${k.border}`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {k.label}
            </div>
            <div className={`text-2xl font-black mt-1.5 ${k.color}`}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdowns: Today by Type & Today by Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Smartphone size={18} className="text-brand-banking" /> Today's
            Volume by Transaction Type
          </h3>
          {data.typeBreakdownToday.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No successful transactions today yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.typeBreakdownToday.map((r: any) => (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-700">{r.label}</span>
                    <span className="text-gray-900">
                      ₦{r.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-banking rounded-full"
                      style={{ width: `${(r.amount / maxTypeAmt) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-blue-500" /> Today's Volume by
            POS Provider
          </h3>
          {data.providerBreakdownToday.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No successful transactions today yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.providerBreakdownToday.map((r: any) => (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-700">{r.label}</span>
                    <span className="text-gray-900">
                      ₦{r.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${(r.amount / maxProvAmt) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
