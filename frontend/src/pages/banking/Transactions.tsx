import React, { useState, useEffect } from 'react';
import { CreditCard, Trash2, RefreshCw } from 'lucide-react';
import {
  getBankingSettings,
  getBankingTransactions,
  createBankingTransaction,
  updateBankingTransactionStatus,
  deleteBankingTransaction,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TX_TYPES = [
  'Deposit',
  'Withdrawal',
  'Transfer',
  'Airtime',
  'Data',
  'Bill Payment',
];
const STATUSES = ['Successful', 'Failed', 'Reversed', 'Pending'];

export default function Transactions() {
  const { session } = useAuthStore();
  const branchId = 'BR002';

  const [providers, setProviders] = useState<any[]>([]);
  const [chargeDefaults, setChargeDefaults] = useState<Record<string, number>>(
    {},
  );
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [type, setType] = useState('Deposit');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [charge, setCharge] = useState('100');
  const [chargeSource, setChargeSource] = useState('Deducted from float sent');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setIsLoading(true);
    try {
      const [settings, txs] = await Promise.all([
        getBankingSettings(branchId),
        getBankingTransactions(branchId),
      ]);
      setProviders(settings.providers || []);
      if (settings.providers?.length > 0) {
        setProvider(settings.providers[0].provider_name);
      }
      const map: Record<string, number> = {};
      (settings.charges || []).forEach((c: any) => {
        map[c.transaction_type] = Number(c.default_charge) || 0;
      });
      setChargeDefaults(map);
      if (map['Deposit'] !== undefined) setCharge(String(map['Deposit']));
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (chargeDefaults[newType] !== undefined) {
      setCharge(String(chargeDefaults[newType]));
    }
    if (newType === 'Transfer') {
      setChargeSource('Cash on top');
    } else if (newType === 'Deposit' || newType === 'Withdrawal') {
      setChargeSource('Deducted from float sent');
    }
  };

  // Live Cash & Float Delta Preview
  const amtNum = parseFloat(amount) || 0;
  const chgNum = parseFloat(charge) || 0;
  const showChargeSource = ['Deposit', 'Withdrawal', 'Transfer'].includes(type);
  const isCashOnTop = chargeSource === 'Cash on top';

  let cashDelta = 0;
  let floatDelta = 0;
  if (type === 'Deposit') {
    cashDelta = isCashOnTop ? amtNum + chgNum : amtNum;
    floatDelta = isCashOnTop ? -amtNum : -(amtNum - chgNum);
  } else if (type === 'Withdrawal') {
    cashDelta = isCashOnTop ? -amtNum : -(amtNum - chgNum);
    floatDelta = isCashOnTop ? amtNum + chgNum : amtNum;
  } else if (type === 'Transfer') {
    cashDelta = isCashOnTop ? chgNum : 0;
    floatDelta = isCashOnTop ? -amtNum : -(amtNum - chgNum);
  } else {
    cashDelta = 0;
    floatDelta = -(amtNum - chgNum);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amtNum || amtNum <= 0) return;
    setIsSubmitting(true);
    try {
      await createBankingTransaction({
        branchId,
        type,
        provider,
        amount: amtNum,
        charge: chgNum,
        chargeSource: showChargeSource ? chargeSource : '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        employeeName: session?.name || 'Staff',
      });
      setAmount('');
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      const txs = await getBankingTransactions(branchId);
      setTransactions(txs);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (tx: any, newStatus: string) => {
    try {
      await updateBankingTransactionStatus(tx.id, branchId, newStatus);
      const txs = await getBankingTransactions(branchId);
      setTransactions(txs);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction permanently?')) return;
    try {
      await deleteBankingTransaction(id);
      const txs = await getBankingTransactions(branchId);
      setTransactions(txs);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Successful':
        return 'bg-blue-50 text-brand-banking border-blue-200';
      case 'Failed':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'Reversed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          POS Banking Transactions
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Record deposits, withdrawals, transfers, and bill payments with live
          cash/float previews.
        </p>
      </div>

      {/* New Transaction Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-banking">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-brand-banking" /> New
          Transaction
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Transaction Type *
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-banking/50"
              >
                {TX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                POS Provider *
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:bg-white"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.provider_name}>
                    {p.provider_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Amount (₦) *
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="e.g. 20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:bg-white focus:ring-2 focus:ring-brand-banking/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Service Charge (₦)
              </label>
              <input
                type="number"
                min="0"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {showChargeSource && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Charge Source
                </label>
                <select
                  value={chargeSource}
                  onChange={(e) => setChargeSource(e.target.value)}
                  className="w-full p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-bold text-brand-banking outline-none"
                >
                  <option value="Deducted from float sent">
                    Deducted from amount sent
                  </option>
                  <option value="Cash on top">
                    Cash on top (paid separately)
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ibrahim Lawal"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Customer Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. 0803 444 1122"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Live Cash & Float Delta Preview Box */}
          {amtNum > 0 && (
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Live Balance Impact Preview:
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500 mr-2">
                    Drawer Cash Change:
                  </span>
                  <strong
                    className={
                      cashDelta >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {cashDelta >= 0 ? '+' : ''}₦{cashDelta.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 mr-2">POS Float Change:</span>
                  <strong
                    className={
                      floatDelta >= 0 ? 'text-brand-banking' : 'text-amber-600'
                    }
                  >
                    {floatDelta >= 0 ? '+' : ''}₦{floatDelta.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-banking text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>

      {/* Today's Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">
            Today's Transaction History ({transactions.length})
          </h3>
          <button
            onClick={initPage}
            className="text-xs font-bold text-brand-banking flex items-center gap-1"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4">Time & ID</th>
                <th className="px-5 py-4">Type & Provider</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Charge</th>
                <th className="px-5 py-4">Cash / Float Δ</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No transactions recorded today yet.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{t.tx_time}</div>
                      <div className="font-mono text-xs text-gray-400">
                        {t.transaction_code}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">{t.type}</div>
                      <div className="text-xs text-gray-500">{t.provider}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {t.customer_name || '—'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.customer_phone}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-black text-gray-900">
                      ₦{Number(t.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-bold text-green-600">
                      ₦{Number(t.charge).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">
                      <div
                        className={
                          t.cash_delta >= 0 ? 'text-green-600' : 'text-red-500'
                        }
                      >
                        Cash: {t.cash_delta >= 0 ? '+' : ''}₦
                        {Number(t.cash_delta).toLocaleString()}
                      </div>
                      <div
                        className={
                          t.float_delta >= 0
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }
                      >
                        Float: {t.float_delta >= 0 ? '+' : ''}₦
                        {Number(t.float_delta).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${statusBadge(t.status)}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {session?.role === 'Owner' && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
