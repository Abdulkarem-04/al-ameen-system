import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';
import { getLaundryCustomers, createLaundryCustomer } from '../../services/api';
import { useAmanaUI } from '../../store/authStore';

export default function LaundryCustomers() {
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getLaundryCustomers(branchId);
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await createLaundryCustomer({
        branchId,
        name: newName.trim(),
        phone: newPhone.trim(),
      });
      setNewName('');
      setNewPhone('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      String(c.phone || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(c.customer_code || '')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="text-[#0088FF] dark:text-[#38BDF8]" /> Laundry
          Customers
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customer directory ranked by total laundry orders and lifetime spend.
        </p>
      </div>

      {/* Add Customer Card */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Add Laundry Customer
        </h3>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Customer Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Alhaji Kabiru Musa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. 0803 777 1111"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="py-2.5 px-4 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-sm"
          >
            {isAdding ? 'Adding...' : '+ Add Customer'}
          </button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by customer name, phone or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Rank & Customer</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-bold flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {c.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {c.customer_code}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {c.phone || '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0088FF] dark:text-[#38BDF8] tabular-nums">
                      {c.total_orders || 0}
                    </td>
                    <td className="px-6 py-4 font-black tabular-nums">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {c.last_visit_date || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
