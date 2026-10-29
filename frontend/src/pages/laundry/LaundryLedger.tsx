import React, { useState, useEffect } from 'react';
import { BookOpen, Search, CheckCircle2, X } from 'lucide-react';
import {
  getLaundryLedger,
  recordLaundryOrderPayment,
} from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';

export default function LaundryLedger() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';

  const [outstandingOrders, setOutstandingOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const data = await getLaundryLedger(branchId);
      setOutstandingOrders(data.outstandingOrders || []);
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;

    setIsPaying(true);
    try {
      await recordLaundryOrderPayment(selectedOrder.id, {
        branchId,
        amount: amt,
        paymentMethod: payMethod,
        employeeName: session?.name || 'Staff',
      });
      setSelectedOrder(null);
      setPayAmount('');
      fetchLedger();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const totalOutstanding = outstandingOrders.reduce(
    (s, o) => s + (Number(o.balance) || 0),
    0,
  );
  const filteredPayments = payments.filter((p) =>
    String(p.order_number || '')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="text-[#0088FF] dark:text-[#38BDF8]" /> Laundry
            Payment Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track orders with unpaid balances (including collected orders) and
            full cash-basis payment history.
          </p>
        </div>
        <div className="bg-white dark:bg-[#111318] px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Unpaid Balance
          </div>
          <div className="text-xl font-black tabular-nums text-rose-500">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Section 1: Orders With Outstanding Balance */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm">
            Orders With Outstanding Balance ({outstandingOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Balance Owed</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {outstandingOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No outstanding balances! 🎉
                  </td>
                </tr>
              ) : (
                outstandingOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                      {o.order_number}
                    </td>
                    <td className="px-5 py-3.5 font-bold">{o.customer_name}</td>
                    <td className="px-5 py-3.5 tabular-nums">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 font-black text-rose-500 tabular-nums">
                      {formatCurrency(o.balance)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold">
                      {o.order_status}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setPayAmount(String(o.balance));
                          setPayMethod('Cash');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0088FF] text-white text-xs font-bold"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Payment History */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-bold text-sm">Cash-Basis Payment History</h3>
          <div className="relative w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Amount Paid</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold">{p.tx_date}</div>
                      <div className="text-slate-400 font-mono">
                        {p.tx_time}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                      {p.order_number}
                    </td>
                    <td className="px-5 py-3.5 font-black text-emerald-500 tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold">
                      {p.payment_method}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {p.recorded_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-base">
                {selectedOrder.order_number}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Customer: <strong>{selectedOrder.customer_name}</strong> • Balance
              Owed:{' '}
              <strong className="text-rose-500">
                {formatCurrency(selectedOrder.balance)}
              </strong>
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Amount Paid (₦) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={selectedOrder.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>POS/Card</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isPaying}
                className="w-full py-2.5 rounded-xl bg-[#0088FF] text-white font-bold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={15} />{' '}
                {isPaying ? 'Saving...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
