import React, { useState, useEffect } from 'react';
import { Receipt, PlusCircle, Trash2 } from 'lucide-react';
import {
  getBankingExpenses,
  createBankingExpense,
  deleteBankingExpense,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  'Rent',
  'Electricity',
  'Transport',
  'Salary',
  'Airtime/Data (business)',
  'Equipment/Maintenance',
  'Miscellaneous',
];

export default function BankingExpenses() {
  const { session } = useAuthStore();
  const branchId = 'BR002';

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
      const data = await getBankingExpenses(branchId);
      setExpenses(data);
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
      await createBankingExpense({
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
    if (!confirm('Delete this expense record?')) return;
    try {
      await deleteBankingExpense(id);
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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            POS Banking Expenses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Today's cash expenses recorded here are automatically deducted from
            Physical Cash Now on Cash & Float.
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Receipt size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Expenses
            </div>
            <div className="text-lg font-black text-amber-600">
              ₦{total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Record Expense Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-banking">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle size={20} className="text-brand-banking" /> Record an
          Expense
        </h3>
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. POS terminal thermal paper rolls"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Amount (₦) *
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand-banking text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-800 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Expense History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Expense History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
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
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {r.tx_date}
                      </div>
                      <div className="text-xs text-gray-400">{r.tx_time}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {r.expense_code}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {r.category}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {r.description || '—'}
                    </td>
                    <td className="px-6 py-4 font-black text-amber-600">
                      ₦{Number(r.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{r.recorded_by}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
