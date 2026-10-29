import React, { useState, useEffect } from 'react';
import { Receipt, PlusCircle, Trash2 } from 'lucide-react';
import {
  getLaundryExpenses,
  createLaundryExpense,
  deleteLaundryExpense,
} from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';

const CATEGORIES = [
  'Detergent/Supplies',
  'Electricity',
  'Water',
  'Salary',
  'Equipment Repair/Maintenance',
  'Transport',
  'Miscellaneous',
];

export default function LaundryExpenses() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';

  const [expenses, setExpenses] = useState<any[]>([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getLaundryExpenses(branchId);
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    setIsSaving(true);
    try {
      await createLaundryExpense({
        branchId,
        category,
        description: description.trim(),
        amount: amt,
        employeeName: session?.name || 'Owner',
      });
      setDescription('');
      setAmount('');
      fetchExpenses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this laundry expense record?')) return;
    try {
      await deleteLaundryExpense(id);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const total = expenses.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Receipt className="text-[#0088FF] dark:text-[#38BDF8]" /> Laundry
            Expenses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record detergents, water, electricity, and machine maintenance
            costs.
          </p>
        </div>
        <div className="bg-white dark:bg-[#111318] px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Expenses
          </div>
          <div className="text-xl font-black text-amber-500 tabular-nums">
            {formatCurrency(total)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <PlusCircle
            size={18}
            className="text-[#0088FF] dark:text-[#38BDF8]"
          />{' '}
          Record an Expense
        </h3>
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial detergent & starch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Amount (₦) *
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0088FF] text-white font-bold text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold">{r.tx_date}</div>
                      <div className="text-slate-400 font-mono">
                        {r.tx_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {r.expense_code}
                    </td>
                    <td className="px-6 py-4 font-bold">{r.category}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {r.description || '—'}
                    </td>
                    <td className="px-6 py-4 font-black text-amber-500 tabular-nums">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {r.recorded_by}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
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
