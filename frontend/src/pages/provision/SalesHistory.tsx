import React, { useState, useEffect } from 'react';
import { History, Search, Printer, RotateCcw, X } from 'lucide-react';
import {
  getProvisionSalesHistory,
  refundProvisionSale,
} from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';
import ThermalReceiptModal, {
  type ReceiptData,
} from '../../components/ThermalReceiptModal';

export default function SalesHistory() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR001';

  const [sales, setSales] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Reprint Receipt Modal
  const [reprintReceipt, setReprintReceipt] = useState<ReceiptData | null>(
    null,
  );

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<any | null>(null);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [refundQty, setRefundQty] = useState('1');
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionSalesHistory(branchId);
      setSales(data.sales || []);
      setReturns(data.returns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseItems = (sale: any) => {
    try {
      const parsed = JSON.parse(sale.items_json || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return String(sale.items_summary || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({
        id: '',
        name: s,
        qty: 1,
        tier: 'Unit',
        piecesPerUnit: 1,
        unitPrice: sale.total_amount,
        lineTotal: sale.total_amount,
      }));
  };

  const handleOpenReprint = (sale: any) => {
    const details = parseItems(sale);
    const dt = String(sale.created_at || '');
    setReprintReceipt({
      invoiceNumber: sale.invoice_number,
      saleDate: dt.slice(0, 10),
      saleTime: dt.slice(11, 19),
      cashier: sale.employee_name,
      customerName: sale.customer_name || 'Walk-in',
      itemDetails: details,
      totalAmount: Number(sale.total_amount) || 0,
      amountPaid: Number(sale.amount_paid) || 0,
      changeGiven: Number(sale.change_given) || 0,
      balance: Number(sale.balance) || 0,
      paymentMethod: sale.payment_method || 'Cash',
    });
  };

  const handleOpenRefund = (sale: any) => {
    setRefundTarget(sale);
    setSelectedItemIdx(0);
    setRefundQty('1');
    setRefundReason('');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    const items = parseItems(refundTarget);
    const item = items[selectedItemIdx];
    if (!item) return;

    const qty = parseInt(refundQty) || 1;
    const pieces = qty * (Number(item.piecesPerUnit) || 1);
    const refundAmount =
      qty * (Number(item.unitPrice) || Number(refundTarget.total_amount));

    setIsRefunding(true);
    try {
      await refundProvisionSale(refundTarget.id, {
        branchId,
        productId: item.id || 'PRD-001',
        productName: item.name,
        quantityPieces: pieces,
        refundAmount,
        reason: refundReason.trim(),
        employeeName: session?.name || 'Owner',
      });
      setRefundTarget(null);
      fetchSales();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const d = String(s.created_at || '').slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(s.invoice_number || '')
        .toLowerCase()
        .includes(q) ||
      String(s.customer_name || '')
        .toLowerCase()
        .includes(q) ||
      String(s.employee_name || '')
        .toLowerCase()
        .includes(q)
    );
  });

  const totalFilteredRevenue = filteredSales.reduce(
    (acc, s) => acc + (Number(s.total_amount) || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <History className="text-[#0088FF] dark:text-[#38BDF8]" /> Sales
            History & Refunds
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every recorded invoice with date and time. Reprint thermal receipts
            or process stock-restoring refunds.
          </p>
        </div>
        <div className="bg-white dark:bg-[#111318] px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Filtered Sales Total
          </div>
          <div className="text-xl font-black tabular-nums text-[#0088FF] dark:text-[#38BDF8]">
            {formatCurrency(totalFilteredRevenue)}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({filteredSales.length})
            </span>
          </div>
        </div>
      </div>

      {/* Search & Date Filters */}
      <div className="bg-white dark:bg-[#111318] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Search Invoice, Customer or Cashier
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="e.g. INV-100001 or Musa Ibrahim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
          />
        </div>

        {(search || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch('');
              setFromDate('');
              setToDate('');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Date & Time</th>
                <th className="px-5 py-4">Invoice</th>
                <th className="px-5 py-4">Customer & Cashier</th>
                <th className="px-5 py-4">Items Sold</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Paid / Balance</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading sales history...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const items = parseItems(s);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <div className="font-bold">
                          {String(s.created_at).slice(0, 10)}
                        </div>
                        <div className="text-slate-400 font-mono">
                          {String(s.created_at).slice(11, 19)}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                        {s.invoice_number}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold">
                          {s.customer_name || 'Walk-in'}
                        </div>
                        <div className="text-xs text-slate-400">
                          By {s.employee_name} · {s.payment_method}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                        {items.map((it: any, idx: number) => (
                          <div key={idx}>
                            {it.name} x{it.qty} ({it.tier || 'Unit'})
                          </div>
                        ))}
                      </td>
                      <td className="px-5 py-4 font-black tabular-nums">
                        {formatCurrency(s.total_amount)}
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums">
                        <div>Paid: {formatCurrency(s.amount_paid)}</div>
                        {Number(s.balance) > 0 && (
                          <div className="text-rose-500 font-bold">
                            Owes: {formatCurrency(s.balance)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            s.status === 'Refunded'
                              ? 'bg-rose-500/10 text-rose-500'
                              : s.status === 'Partial Refund'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {s.status || 'Completed'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReprint(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                        >
                          <Printer size={13} /> Reprint
                        </button>
                        {s.status !== 'Refunded' && (
                          <button
                            onClick={() => handleOpenRefund(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold"
                          >
                            <RotateCcw size={13} /> Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Log Table (If any refunds exist) */}
      {returns.length > 0 && (
        <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-rose-500 flex items-center gap-2">
              <RotateCcw size={16} /> Processed Refunds & Stock Returns (
              {returns.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0C0E12] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Invoice</th>
                  <th className="p-3.5">Product Returned</th>
                  <th className="p-3.5">Stock Restored</th>
                  <th className="p-3.5">Refund Amount</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-mono">
                      {String(r.created_at).slice(0, 16)}
                    </td>
                    <td className="p-3.5 font-mono font-bold">
                      {r.invoice_number}
                    </td>
                    <td className="p-3.5 font-bold">{r.product_name}</td>
                    <td className="p-3.5 text-emerald-500 font-bold">
                      +{r.quantity_pieces} units
                    </td>
                    <td className="p-3.5 text-rose-500 font-bold">
                      {formatCurrency(r.refund_amount)}
                    </td>
                    <td className="p-3.5 text-slate-400">{r.reason}</td>
                    <td className="p-3.5 text-slate-400">{r.recorded_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      {reprintReceipt && (
        <ThermalReceiptModal
          receipt={reprintReceipt}
          heading="Receipt Reprint"
          onClose={() => setReprintReceipt(null)}
        />
      )}

      {/* Refund / Return Modal */}
      {refundTarget && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-rose-500">
                <RotateCcw size={18} /> Refund Invoice{' '}
                {refundTarget.invoice_number}
              </h3>
              <button
                onClick={() => setRefundTarget(null)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Select Item to Return *
                </label>
                <select
                  value={selectedItemIdx}
                  onChange={(e) => setSelectedItemIdx(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                >
                  {parseItems(refundTarget).map((it: any, idx: number) => (
                    <option key={idx} value={idx}>
                      {it.name} — Sold x{it.qty} ({it.tier || 'Unit'}) @{' '}
                      {formatCurrency(it.unitPrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Quantity Returned *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={parseItems(refundTarget)[selectedItemIdx]?.qty || 1}
                  value={refundQty}
                  onChange={(e) => setRefundQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Reason for Refund (Required) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Customer returned item, or wrong item rung up"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold flex justify-between">
                <span>Refund Amount & Stock Restoration:</span>
                <span>
                  {formatCurrency(
                    (parseInt(refundQty) || 1) *
                      (Number(
                        parseItems(refundTarget)[selectedItemIdx]?.unitPrice,
                      ) || Number(refundTarget.total_amount)),
                  )}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {isRefunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
