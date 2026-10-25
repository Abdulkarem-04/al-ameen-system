import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { getProvisionLedger } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Ledger() {
  const { session } = useAuthStore();
  const [ledger, setLedger] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionLedger(session?.branchId || 'BR001');
      setLedger(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = ledger.filter(
    (r) =>
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.reference && r.reference.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Customer Credit Ledger
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete log of all credit sales (debits) and customer repayments
          (credits).
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by customer name or invoice ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Debit (Owed)</th>
                <th className="px-6 py-4">Credit (Paid)</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <BookOpen className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p>No ledger entries yet.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {r.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.transaction_type === 'Payment'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      {r.debit_amount > 0
                        ? `₦${r.debit_amount.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {r.credit_amount > 0
                        ? `₦${r.credit_amount.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {r.reference || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{r.recorded_by}</td>
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
