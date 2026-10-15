import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getProvisionInventory } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Inventory() {
  const { session } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionInventory(session?.branchId || 'BR001');
      setInventory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (qty: number, reorder: number) => {
    if (qty <= 0)
      return {
        label: 'Out of Stock',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle size={14} />,
      };
    if (qty <= reorder)
      return {
        label: 'Low Stock',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <AlertTriangle size={14} />,
      };
    return {
      label: 'In Stock',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle size={14} />,
    };
  };

  const stats = {
    out: inventory.filter((i) => i.stock_quantity <= 0).length,
    low: inventory.filter(
      (i) => i.stock_quantity > 0 && i.stock_quantity <= i.reorder_level,
    ).length,
    ok: inventory.filter((i) => i.stock_quantity > i.reorder_level).length,
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product_code.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(
      item.stock_quantity,
      item.reorder_level,
    ).label;
    const matchesFilter = filter === 'All' || status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Inventory Status
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor stock levels and reorder alerts.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Out of Stock
            </p>
            <h3 className="text-2xl font-black text-red-600">{stats.out}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-500">
            <XCircle size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Low Stock
            </p>
            <h3 className="text-2xl font-black text-amber-600">{stats.low}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-green-500">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              In Stock
            </p>
            <h3 className="text-2xl font-black text-green-600">{stats.ok}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-500">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-provision/50 outline-none font-medium text-gray-700 min-w-[160px]"
          >
            <option value="All">All Statuses</option>
            <option value="Out of Stock">Out of Stock Only</option>
            <option value="Low Stock">Low Stock Only</option>
            <option value="In Stock">In Stock Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Stock (pieces)</th>
                <th className="px-6 py-4">Reorder Lvl</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No inventory matches found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(
                    item.stock_quantity,
                    item.reorder_level,
                  );
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {item.product_code}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                      <td className="px-6 py-4 font-black text-gray-900">
                        {item.stock_quantity}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {item.reorder_level}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color} ${status.border}`}
                        >
                          {status.icon} {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
