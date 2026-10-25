import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  getProvisionCustomers,
  createProvisionCustomer,
  getProvisionLedger,
  recordCustomerPayment,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Customers() {
  const { session } = useAuthStore();
  const branchId = session?.branchId || 'BR001';

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Customer Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Selected Customer Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerLedger, setCustomerLedger] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionCustomers(branchId);
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await createProvisionCustomer({
        branchId,
        name: newName.trim(),
        phone: newPhone.trim(),
      });
      setNewName('');
      setNewPhone('');
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'Failed to add customer');
    } finally {
      setIsAdding(false);
    }
  };

  const openCustomerModal = async (customer: any) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setIsLedgerLoading(true);
    try {
      const rows = await getProvisionLedger(branchId, customer.id);
      setCustomerLedger(rows);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }

    setIsPaying(true);
    try {
      await recordCustomerPayment({
        branchId,
        customerId: selectedCustomer.id,
        amount: amt,
        paymentMethod,
        employeeName: session?.name || 'Owner',
      });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'Failed to record payment');
    } finally {
      setIsPaying(false);
    }
  };

  const totalDebt = customers.reduce(
    (sum, c) => sum + (Number(c.outstanding_balance) || 0),
    0,
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.toLowerCase().includes(search.toLowerCase())) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Customers & Debt
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage store customers and track outstanding credit balances.
          </p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${totalDebt > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Customer Debt
            </div>
            <div
              className={`text-lg font-black ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              ₦{totalDebt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-provision">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-brand-provision" /> Add New
          Customer
        </h3>
        <form
          onSubmit={handleAddCustomer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Customer Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Musa Ibrahim"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="e.g. 0803 123 4567"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-brand-provision text-white py-2.5 px-4 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : '+ Add Customer'}
            </button>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, phone or code..."
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
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Outstanding Balance</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <Users className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p>No customers found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const balance = Number(c.outstanding_balance) || 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {c.code}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.phone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            balance > 0
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {balance > 0
                            ? `Owes ₦${balance.toLocaleString()}`
                            : 'Cleared (₦0)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCustomerModal(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye size={14} />{' '}
                          {balance > 0 ? 'View / Pay' : 'View History'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Repayment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  {selectedCustomer.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedCustomer.code} •{' '}
                  {selectedCustomer.phone || 'No phone'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`p-4 rounded-xl mb-5 border flex items-center justify-between ${
                Number(selectedCustomer.outstanding_balance) > 0
                  ? 'bg-red-50 border-red-100'
                  : 'bg-green-50 border-green-100'
              }`}
            >
              <span className="text-sm font-bold text-gray-700">
                Outstanding Balance:
              </span>
              <span
                className={`text-2xl font-black ${
                  Number(selectedCustomer.outstanding_balance) > 0
                    ? 'text-red-600'
                    : 'text-green-700'
                }`}
              >
                ₦
                {(
                  Number(selectedCustomer.outstanding_balance) || 0
                ).toLocaleString()}
              </span>
            </div>

            {Number(selectedCustomer.outstanding_balance) > 0 && (
              <form
                onSubmit={handleRecordPayment}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Record a Debt Repayment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Amount (₦)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max={selectedCustomer.outstanding_balance}
                      step="0.01"
                      placeholder="e.g. 1000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-brand-provision/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
                    >
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>POS/Card</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full py-2.5 bg-brand-provision text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />{' '}
                  {isPaying ? 'Recording...' : 'Record Payment'}
                </button>
              </form>
            )}

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Transaction History
            </h4>
            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
              {isLedgerLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Loading history...
                </div>
              ) : customerLedger.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No credit transactions yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 font-bold text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Debit (+)</th>
                      <th className="p-3">Credit (-)</th>
                      <th className="p-3">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerLedger.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium text-gray-900">
                          {r.transaction_type}
                        </td>
                        <td className="p-3 font-bold text-red-600">
                          {r.debit_amount > 0
                            ? `₦${r.debit_amount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="p-3 font-bold text-green-600">
                          {r.credit_amount > 0
                            ? `₦${r.credit_amount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="p-3 text-gray-500">
                          {r.reference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
