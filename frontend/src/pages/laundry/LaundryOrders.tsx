import React, { useState, useEffect } from 'react';
import {
  WashingMachine,
  Plus,
  Trash2,
  Printer,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  getLaundrySettings,
  getLaundryCustomers,
  getLaundryOrders,
  getLaundryOrderItems,
  createLaundryOrder,
  updateLaundryOrderStatus,
  recordLaundryOrderPayment,
  deleteLaundryOrder,
} from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';
import ThermalReceiptModal, {
  type ReceiptData,
} from '../../components/ThermalReceiptModal';

const STATUSES = [
  'Dropped Off',
  'Washing',
  'Ready for Pickup',
  'Collected',
  'Cancelled',
];

export default function LaundryOrders() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR003';

  const [priceList, setPriceList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Drop-off Intake Form
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [custPhone, setCustPhone] = useState('');
  const [expectedReadyDate, setExpectedReadyDate] = useState('');
  const [items, setItems] = useState<
    Array<{ itemType: string; quantity: number; unitPrice: number }>
  >([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Order Modal
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [activeOrderItems, setActiveOrderItems] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  // Thermal Tag / Receipt Modal
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setIsLoading(true);
    try {
      const [settingsData, custsData, ordersData] = await Promise.all([
        getLaundrySettings(branchId),
        getLaundryCustomers(branchId),
        getLaundryOrders(branchId),
      ]);
      setPriceList(settingsData || []);
      setCustomers(custsData || []);
      setOrders(ordersData || []);

      if (settingsData && settingsData.length > 0 && items.length === 0) {
        setItems([
          {
            itemType: settingsData[0].item_type,
            quantity: 1,
            unitPrice: Number(settingsData[0].default_price) || 0,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addItemRow = () => {
    const first = priceList[0];
    setItems((prev) => [
      ...prev,
      {
        itemType: first ? first.item_type : 'Shirt',
        quantity: 1,
        unitPrice: first ? Number(first.default_price) : 500,
      },
    ]);
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === 'itemType') {
          const found = priceList.find((p) => p.item_type === value);
          return {
            ...row,
            itemType: value,
            unitPrice: found ? Number(found.default_price) : row.unitPrice,
          };
        }
        return { ...row, [field]: value };
      }),
    );
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsTotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const paidNum = amountPaid === '' ? itemsTotal : parseFloat(amountPaid) || 0;
  const balanceOwed = Math.max(0, itemsTotal - paidNum);

  const matchingCustomers = custSearch.trim()
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(custSearch)),
        )
        .slice(0, 5)
    : [];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custSearch.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createLaundryOrder({
        branchId,
        customerId: selectedCustomer?.id || '',
        customerName: custSearch.trim(),
        customerPhone: custPhone.trim(),
        items,
        amountPaid: paidNum,
        paymentMethod,
        expectedReadyDate,
        notes: notes.trim(),
        employeeName: session?.name || 'Staff',
      });

      setReceipt({
        invoiceNumber: res.orderNumber,
        saleDate: res.saleDate,
        saleTime: res.saleTime,
        cashier: session?.name || 'Staff',
        customerName: custSearch.trim(),
        itemDetails: items.map((i) => ({
          name: i.itemType,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.quantity * i.unitPrice,
        })),
        totalAmount: itemsTotal,
        amountPaid: paidNum,
        changeGiven: 0,
        balance: balanceOwed,
        paymentMethod,
      });

      setCustSearch('');
      setSelectedCustomer(null);
      setCustPhone('');
      setExpectedReadyDate('');
      setAmountPaid('');
      setNotes('');
      const updatedOrders = await getLaundryOrders(branchId);
      setOrders(updatedOrders);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = async (order: any) => {
    setActiveOrder(order);
    setNewStatus(order.order_status);
    setCollectedBy(order.collected_by || '');
    setPayAmount('');
    setPayMethod('Cash');
    try {
      const orderItems = await getLaundryOrderItems(order.id);
      setActiveOrderItems(orderItems || []);
    } catch {
      setActiveOrderItems([]);
    }
  };

  const handleStatusUpdate = async () => {
    if (!activeOrder) return;
    try {
      await updateLaundryOrderStatus(
        activeOrder.id,
        newStatus,
        collectedBy,
        session?.name || 'Staff',
      );
      setActiveOrder(null);
      const updatedOrders = await getLaundryOrders(branchId);
      setOrders(updatedOrders);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPayment = async () => {
    if (!activeOrder) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    try {
      await recordLaundryOrderPayment(activeOrder.id, {
        branchId,
        amount: amt,
        paymentMethod: payMethod,
        employeeName: session?.name || 'Staff',
      });
      setActiveOrder(null);
      const updatedOrders = await getLaundryOrders(branchId);
      setOrders(updatedOrders);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Delete this laundry order permanently?')) return;
    try {
      await deleteLaundryOrder(orderId);
      setActiveOrder(null);
      const updatedOrders = await getLaundryOrders(branchId);
      setOrders(updatedOrders);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const filteredOrders =
    activeFilter === 'All'
      ? orders
      : orders.filter((o) => o.order_status === activeFilter);

  const statusColor = (status: string) => {
    switch (status) {
      case 'Dropped Off':
        return 'bg-slate-500/10 text-slate-500';
      case 'Washing':
        return 'bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8]';
      case 'Ready for Pickup':
        return 'bg-amber-500/10 text-amber-500';
      case 'Collected':
        return 'bg-emerald-500/10 text-emerald-500';
      default:
        return 'bg-rose-500/10 text-rose-500';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <WashingMachine className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Laundry Orders & Intake
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Record garment drop-offs, track washing & pickup statuses, and print
          thermal tags.
        </p>
      </div>

      {/* New Order (Drop-Off) Card */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold mb-4">
          New Order (Drop-Off Intake)
        </h3>
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Customer Name *
              </label>
              <input
                required
                type="text"
                placeholder="Search or type customer name..."
                value={custSearch}
                onChange={(e) => {
                  setCustSearch(e.target.value);
                  setSelectedCustomer(null);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
              />
              {!selectedCustomer && matchingCustomers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-xl mt-1 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {matchingCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustSearch(c.name);
                        setCustPhone(c.phone || '');
                      }}
                      className="p-2.5 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
                    >
                      <span className="font-bold">{c.name}</span>
                      <span className="text-slate-400">{c.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Customer Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 0803 777 1111"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Expected Ready Date
              </label>
              <input
                type="date"
                value={expectedReadyDate}
                onChange={(e) => setExpectedReadyDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm outline-none"
              />
            </div>
          </div>

          {/* Garment Line Items */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase text-slate-400">
              Garment Items *
            </label>
            {items.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select
                    value={row.itemType}
                    onChange={(e) =>
                      updateItemRow(idx, 'itemType', e.target.value)
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    {priceList.map((p) => (
                      <option key={p.id} value={p.item_type}>
                        {p.item_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      updateItemRow(
                        idx,
                        'quantity',
                        parseInt(e.target.value) || 1,
                      )
                    }
                    placeholder="Qty"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateItemRow(
                        idx,
                        'unitPrice',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="Price"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1"
              >
                <Plus size={14} /> Add Another Item
              </button>
              <div className="text-base font-black text-[#0088FF] dark:text-[#38BDF8] tabular-nums">
                Order Total: {formatCurrency(itemsTotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Amount Paid Up-Front (Leave blank if paid in full)
              </label>
              <input
                type="number"
                min="0"
                placeholder={String(itemsTotal)}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold"
              />
              <div className="text-[11px] font-bold mt-1">
                {balanceOwed > 0 ? (
                  <span className="text-amber-500">
                    Balance owed at pickup: {formatCurrency(balanceOwed)}
                  </span>
                ) : (
                  <span className="text-emerald-500">Fully paid.</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium"
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>POS/Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Special Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Light starch, express wash"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-sm"
          >
            {isSubmitting ? 'Saving Order...' : 'Save Drop-Off Order'}
          </button>
        </form>
      </div>

      {/* Orders Pipeline Table */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
          {['All', ...STATUSES].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-[#0088FF] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Order # & Date</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Balance</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Expected Ready</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No orders in this status.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isOverdue =
                    o.order_status !== 'Collected' &&
                    o.order_status !== 'Cancelled' &&
                    o.expected_ready_date &&
                    o.expected_ready_date < today;
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                          {o.order_number}
                        </div>
                        <div className="text-xs text-slate-400">
                          {o.date_received}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold">{o.customer_name}</div>
                        <div className="text-xs text-slate-400">
                          {o.customer_phone}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold tabular-nums">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="px-5 py-4 font-bold tabular-nums">
                        <span
                          className={
                            Number(o.balance) > 0
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          }
                        >
                          {formatCurrency(o.balance)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(o.order_status)}`}
                        >
                          {o.order_status}
                        </span>
                        {isOverdue && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-black">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {o.expected_ready_date || '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openManageModal(o)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                        >
                          Manage
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

      {/* Manage Order Modal */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold">
                  {activeOrder.order_number}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeOrder.customer_name}{' '}
                  {activeOrder.customer_phone
                    ? `• ${activeOrder.customer_phone}`
                    : ''}
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-400 uppercase text-[10px] mb-1">
                Garment Items
              </div>
              {activeOrderItems.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.item_type}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(it.subtotal)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between font-bold text-sm">
                <span>Total: {formatCurrency(activeOrder.total_amount)}</span>
                <span
                  className={
                    Number(activeOrder.balance) > 0
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  }
                >
                  Balance: {formatCurrency(activeOrder.balance)}
                </span>
              </div>
            </div>

            {/* Record Balance Payment */}
            {Number(activeOrder.balance) > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="font-bold uppercase text-slate-400">
                  Record Payment (Owed: {formatCurrency(activeOrder.balance)})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    max={activeOrder.balance}
                    placeholder="Amount (₦)"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-bold"
                  />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>POS/Card</option>
                  </select>
                </div>
                <button
                  onClick={handleRecordPayment}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={14} /> Record Payment
                </button>
              </div>
            )}

            {/* Update Order Status */}
            <div className="space-y-2.5 text-xs">
              <label className="block font-bold uppercase text-slate-400">
                Update Order Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {newStatus === 'Collected' && (
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Collected By (Name of person picking up) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer or Driver name"
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
              )}

              <button
                onClick={handleStatusUpdate}
                className="w-full py-2.5 rounded-xl bg-[#0088FF] text-white font-bold"
              >
                Update Status
              </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const ord = activeOrder;
                  const ordItems = activeOrderItems;
                  setActiveOrder(null);
                  setReceipt({
                    invoiceNumber: ord.order_number,
                    saleDate: ord.date_received,
                    saleTime: ord.time_received,
                    cashier: ord.received_by,
                    customerName: ord.customer_name,
                    itemDetails: ordItems.map((i) => ({
                      name: i.item_type,
                      qty: i.quantity,
                      unitPrice: i.unit_price,
                      lineTotal: i.subtotal,
                    })),
                    totalAmount: Number(ord.total_amount),
                    amountPaid: Number(ord.amount_paid),
                    changeGiven: 0,
                    balance: Number(ord.balance),
                    paymentMethod: ord.payment_method,
                  });
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Printer size={14} /> Print Tag
              </button>
              {session?.role === 'Owner' && (
                <button
                  onClick={() => handleDeleteOrder(activeOrder.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <ThermalReceiptModal
          receipt={receipt}
          heading="Laundry Order Tag"
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
