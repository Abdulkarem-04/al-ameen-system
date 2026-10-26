import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { getBankingCustomers } from '../../services/api';

export default function BankingCustomers() {
  const branchId = 'BR002';
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBankingCustomers(branchId)
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      String(c.phone).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Repeat POS Customers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Built automatically from transaction history — repeat customers ranked
          by number of visits.
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
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-banking/50 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Rank & Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Visits</th>
                <th className="px-6 py-4">Total Volume</th>
                <th className="px-6 py-4">Charges Paid</th>
                <th className="px-6 py-4">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <Users className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p>No repeat customers found yet.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-brand-banking text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.phone || '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-banking">
                      {c.transactionCount}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₦{Number(c.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      ₦{Number(c.totalCharges).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.lastVisitDate}
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
