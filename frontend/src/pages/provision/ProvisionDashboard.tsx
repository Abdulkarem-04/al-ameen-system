import { useState, useEffect } from 'react';
import { Trophy, AlertTriangle, Package, Users } from 'lucide-react';
import { getProvisionDashboard } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ProvisionDashboard() {
  const { session } = useAuthStore();
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
      <div className="p-8 text-center text-gray-400">
        Loading store dashboard...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Sales Today',
      value: `₦${data.todayRevenue.toLocaleString()}`,
      color: 'text-brand-provision',
      border: 'border-l-brand-provision',
    },
    {
      label: 'Profit Today',
      value: `₦${data.todayProfit.toLocaleString()}`,
      color: 'text-green-600',
      border: 'border-l-green-600',
    },
    {
      label: 'Sales This Month',
      value: `₦${data.monthRevenue.toLocaleString()}`,
      color: 'text-blue-600',
      border: 'border-l-blue-600',
    },
    {
      label: 'Profit This Month',
      value: `₦${data.monthProfit.toLocaleString()}`,
      color: 'text-blue-600',
      border: 'border-l-blue-600',
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
      color: 'text-purple-600',
      border: 'border-l-purple-600',
    },
    {
      label: 'Total Products',
      value: data.totalProducts,
      color: 'text-gray-900',
      border: 'border-l-gray-700',
    },
    {
      label: 'Low / Out of Stock',
      value: `${data.lowStockCount} / ${data.outOfStockCount}`,
      color: 'text-red-600',
      border: 'border-l-red-500',
    },
  ];

  const maxTopQty =
    data.topProducts.length > 0
      ? Math.max(...data.topProducts.map((p: any) => p.qty))
      : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Provision Store Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time sales, profit, and stock valuation metrics.
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Inventory Valuation Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package size={18} className="text-brand-provision" /> Current
          Inventory Valuation{' '}
          <span className="text-xs font-normal text-gray-400">
            (Unsold stock on shelves)
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="text-xs font-bold text-blue-600 uppercase">
              Cost Value (Capital Tied Up)
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              ₦{data.inventoryCostValue.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
            <div className="text-xs font-bold text-brand-provision uppercase">
              Retail Value (If All Sold)
            </div>
            <div className="text-2xl font-black text-brand-provision mt-1">
              ₦{data.inventoryRetailValue.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="text-xs font-bold text-purple-600 uppercase">
              Potential Profit
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              ₦{data.inventoryPotentialProfit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" /> Top Selling Products
            (Units Sold)
          </h3>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No sales recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p: any, idx: number) => (
                <div key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-50 text-brand-provision font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-gray-800 w-40 truncate">
                    {p.name}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-provision rounded-full"
                      style={{ width: `${(p.qty / maxTopQty) * 100}%` }}
                    />
                  </div>
                  <span className="font-black text-gray-900 w-10 text-right">
                    {p.qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Low & Out of
              Stock Alerts
            </h3>
            {data.outOfStockItems.length === 0 &&
            data.lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                All stock levels look healthy!
              </p>
            ) : (
              <div className="divide-y divide-gray-100 text-sm max-h-52 overflow-y-auto">
                {data.outOfStockItems.map((name: string) => (
                  <div
                    key={name}
                    className="py-2.5 flex justify-between items-center"
                  >
                    <span className="font-bold text-gray-800">{name}</span>
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      OUT OF STOCK
                    </span>
                  </div>
                ))}
                {data.lowStockItems.map((label: string) => (
                  <div
                    key={label}
                    className="py-2.5 flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">{label}</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      LOW STOCK
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Users size={16} /> Total Customer Debt:
            </div>
            <span className="text-xl font-black text-red-600">
              ₦{data.customerDebtTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
