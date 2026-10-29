import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  CreditCard,
  Trash2,
  UserPlus,
  Package,
  Wallet,
  X,
  Lock,
} from 'lucide-react';
import {
  getProvisionProducts,
  getProvisionCustomers,
  createProvisionCustomer,
  processCheckout,
  getProvisionDrawer,
  openProvisionDrawer,
  closeProvisionDrawer,
} from '../../services/api';
import { useAuthStore, useAmanaUI } from '../../store/authStore';
import ThermalReceiptModal, {
  type ReceiptData,
} from '../../components/ThermalReceiptModal';

export default function POS() {
  const { session } = useAuthStore();
  const { formatCurrency } = useAmanaUI();
  const branchId = 'BR001';

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Drawer Modal State
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [drawerCashInput, setDrawerCashInput] = useState('');
  const [drawerNotes, setDrawerNotes] = useState('');

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Inline Add Customer
  const [showAddCustForm, setShowAddCustForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Receipt Modal State
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchPOSData();
  }, []);

  const fetchPOSData = async () => {
    try {
      const [prods, custs, drw] = await Promise.all([
        getProvisionProducts(branchId),
        getProvisionCustomers(branchId),
        getProvisionDrawer(branchId),
      ]);
      setProducts((prods || []).filter((p: any) => p.status === 'Active'));
      setCustomers(custs || []);
      setDrawer(drw?.status || null);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (product: any, tier: 'Unit' | 'Bulk' = 'Unit') => {
    const isBulk = tier === 'Bulk' && Boolean(product.bulk_enabled);
    const piecesPerUnit = isBulk ? Number(product.units_per_bulk) || 1 : 1;
    const unitPrice = isBulk
      ? Number(product.bulk_price)
      : Number(product.selling_price);
    const tierLabel = isBulk ? product.bulk_type : product.unit;
    const cartKey = `${product.id}_${tier}`;

    setCart((prev) => {
      const piecesAlreadyInCart = prev
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.quantity * item.piecesPerUnit, 0);

      if (piecesAlreadyInCart + piecesPerUnit > product.stock_quantity) {
        alert(
          `Not enough stock! Available: ${product.stock_quantity} ${product.unit}s.`,
        );
        return prev;
      }

      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          cartKey,
          id: product.id,
          name: product.name,
          tier,
          tierLabel,
          piecesPerUnit,
          price: unitPrice,
          buyingPriceUnit: Number(product.buying_price) || 0,
          quantity: 1,
          stock: product.stock_quantity,
          unit: product.unit,
        },
      ];
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const openCheckout = () => {
    setAmountPaid(cartTotal.toString());
    setPaymentMethod('Cash');
    setSelectedCustomer(null);
    setCustSearch('');
    setShowAddCustForm(false);
    setCheckoutError('');
    setIsMobileCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const paidNum = amountPaid === '' ? 0 : parseFloat(amountPaid) || 0;
  const changeGiven = paidNum > cartTotal ? paidNum - cartTotal : 0;
  const balanceOwed = paidNum < cartTotal ? cartTotal - paidNum : 0;

  const matchingCustomers = custSearch.trim()
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(custSearch)),
        )
        .slice(0, 5)
    : [];

  const exactCustomerMatch = customers.some(
    (c) => c.name.toLowerCase() === custSearch.trim().toLowerCase(),
  );

  const handleQuickAddCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setCheckoutError('Customer name and phone number are both required.');
      return;
    }
    try {
      const created = await createProvisionCustomer({
        branchId,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
      });
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomer(created);
      setCustSearch(created.name);
      setShowAddCustForm(false);
      setCheckoutError('');
    } catch (err: any) {
      setCheckoutError(err.message || 'Could not add customer.');
    }
  };

  const handleCheckout = async () => {
    setCheckoutError('');
    if (balanceOwed > 0 && !selectedCustomer) {
      setCheckoutError(
        'Please select or add a customer for a partial (credit) payment.',
      );
      return;
    }

    try {
      const payload = {
        branchId,
        employeeName: session?.name || 'Cashier',
        cart,
        payment: {
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || 'Walk-in',
          totalAmount: cartTotal,
          amountPaid: paidNum,
          balance: balanceOwed,
          method: paymentMethod,
        },
      };

      const result = await processCheckout(payload);
      setIsCheckoutModalOpen(false);
      setReceipt({
        invoiceNumber: result.invoiceNumber,
        saleDate: result.saleDate || new Date().toISOString().slice(0, 10),
        saleTime: result.saleTime || new Date().toTimeString().slice(0, 8),
        cashier: session?.name || 'Cashier',
        customerName: selectedCustomer?.name || '',
        itemDetails: cart.map((c) => ({
          name: c.name,
          qty: c.quantity,
          tier: c.tierLabel,
          unitPrice: c.price,
          lineTotal: c.price * c.quantity,
        })),
        totalAmount: cartTotal,
        amountPaid: paidNum,
        changeGiven,
        balance: balanceOwed,
        paymentMethod,
        queuedOffline: result.queuedOffline,
      });
      setCart([]);
      fetchPOSData();
    } catch (error: any) {
      setCheckoutError(error.message || 'Checkout failed.');
    }
  };

  const handleDrawerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!drawer?.dayOpened) {
        await openProvisionDrawer({
          branchId,
          openingCash: parseFloat(drawerCashInput) || 0,
          employeeName: session?.name || 'Cashier',
        });
      } else {
        await closeProvisionDrawer({
          branchId,
          countedCash: parseFloat(drawerCashInput) || 0,
          notes: drawerNotes,
          employeeName: session?.name || 'Cashier',
        });
      }
      setShowDrawerModal(false);
      setDrawerCashInput('');
      setDrawerNotes('');
      fetchPOSData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Top Bar: Search & Physical Cash Drawer Status Pill */}
      <div className="bg-white dark:bg-[#111318] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
          />
        </div>

        {/* Physical Drawer Cash Button */}
        <button
          onClick={() => setShowDrawerModal(true)}
          className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200 dark:border-slate-800 flex items-center gap-3 hover:border-[#38BDF8]/50 transition-all"
        >
          <Wallet size={18} className="text-[#0088FF] dark:text-[#38BDF8]" />
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Physical Drawer Cash
            </div>
            <div className="text-xs font-black tabular-nums">
              {drawer?.dayOpened ? (
                <>
                  {formatCurrency(drawer.expectedCash)}{' '}
                  <span
                    className={
                      drawer.dayClosed ? 'text-amber-500' : 'text-emerald-500'
                    }
                  >
                    ● {drawer.dayClosed ? 'Closed' : 'Open'}
                  </span>
                </>
              ) : (
                <span className="text-amber-500">Click to Open Drawer</span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12.5rem)]">
        {/* LEFT: Product Grid */}
        <div className="flex-1 bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map((p) => {
              const outOfStock = p.stock_quantity <= 0;
              const canBulk =
                Boolean(p.bulk_enabled) &&
                p.units_per_bulk > 0 &&
                p.bulk_price > 0;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    outOfStock
                      ? 'opacity-45 grayscale border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50/40 dark:bg-[#0C0E12] border-slate-200/80 dark:border-slate-800 hover:border-[#38BDF8]/60'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-sm leading-tight">
                        {p.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          p.stock_quantity <= p.reorder_level
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p.stock_quantity} {p.unit}s
                      </span>
                    </div>
                    <div className="text-[#0088FF] dark:text-[#38BDF8] font-black text-base tabular-nums mb-3">
                      {formatCurrency(p.selling_price)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      disabled={outOfStock}
                      onClick={() => addToCart(p, 'Unit')}
                      className="w-full py-2 px-3 bg-[#0088FF] hover:bg-[#0284C7] text-white rounded-lg text-xs font-bold transition-colors flex justify-between items-center"
                    >
                      <span>+ 1 {p.unit}</span>
                      <span className="tabular-nums">
                        {formatCurrency(p.selling_price)}
                      </span>
                    </button>

                    {canBulk && (
                      <button
                        disabled={p.stock_quantity < p.units_per_bulk}
                        onClick={() => addToCart(p, 'Bulk')}
                        className="w-full py-2 px-3 bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold transition-colors flex justify-between items-center"
                      >
                        <span className="flex items-center gap-1">
                          <Package size={12} /> + 1 {p.bulk_type} (
                          {p.units_per_bulk})
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(p.bulk_price)}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Desktop Shopping Cart */}
        <div className="hidden lg:flex w-96 flex-col bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shrink-0">
          <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <ShoppingCart size={17} className="text-[#38BDF8]" /> Current
              Order
            </h2>
            <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {cart.length} lines
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart size={42} className="opacity-20" />
                <p className="text-xs">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-center justify-between p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-[#0C0E12]"
                >
                  <div className="flex-1">
                    <div className="font-bold text-xs">
                      {item.name}{' '}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 ml-1">
                        {item.tierLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                      {item.quantity} x {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="font-black text-sm tabular-nums mr-3">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartKey)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-end mb-4">
              <span className="text-slate-400 font-bold uppercase text-xs">
                Total
              </span>
              <span className="text-2xl font-black text-[#0088FF] dark:text-[#38BDF8] tabular-nums leading-none">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={openCheckout}
              className="w-full py-3.5 bg-[#0088FF] hover:bg-[#0284C7] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard size={18} /> Checkout
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM CART BAR (For Phone Users) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#0088FF] text-white shadow-xl flex items-center justify-between font-bold text-sm"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={18} /> {cart.length} item(s) in Cart
            </span>
            <span className="font-black tabular-nums">
              {formatCurrency(cartTotal)} →
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <div className="bg-white dark:bg-[#111318] rounded-t-2xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">
                Current Cart ({cart.length})
              </h3>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  <div>
                    <div className="font-bold text-xs">
                      {item.name} ({item.tierLabel})
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.quantity} x {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-rose-500 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={openCheckout}
              className="w-full py-3.5 bg-[#0088FF] text-white rounded-xl font-bold text-sm"
            >
              Proceed to Checkout ({formatCurrency(cartTotal)})
            </button>
          </div>
        </div>
      )}

      {/* Physical Cash Drawer Modal */}
      {showDrawerModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Wallet
                  className="text-[#0088FF] dark:text-[#38BDF8]"
                  size={20}
                />
                {drawer?.dayOpened
                  ? 'POS Cash Drawer Status'
                  : 'Open Today’s Cash Drawer'}
              </h3>
              <button
                onClick={() => setShowDrawerModal(false)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {drawer?.dayOpened && (
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0C0E12] border border-slate-200 dark:border-slate-800 text-xs mb-4">
                <div className="flex justify-between">
                  <span>Opening Cash:</span>
                  <strong>{formatCurrency(drawer.openingCash)}</strong>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>+ Today’s Cash Sales:</span>
                  <strong>+{formatCurrency(drawer.cashSalesNet)}</strong>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>+ Cash Debt Repayments:</span>
                  <strong>+{formatCurrency(drawer.cashDebtRepayments)}</strong>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>- Cash Refunds:</span>
                  <strong>-{formatCurrency(drawer.cashRefunds)}</strong>
                </div>
                <div className="flex justify-between text-amber-500">
                  <span>- Store Cash Expenses:</span>
                  <strong>-{formatCurrency(drawer.cashExpenses)}</strong>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-black">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-[#0088FF] dark:text-[#38BDF8]">
                    {formatCurrency(drawer.expectedCash)}
                  </span>
                </div>
              </div>
            )}

            {drawer?.dayClosed ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-500 font-bold">
                <Lock size={16} /> Today’s drawer is closed (Counted:{' '}
                {formatCurrency(drawer.countedCash)}, Variance:{' '}
                {formatCurrency(drawer.variance)}).
              </div>
            ) : (
              <form onSubmit={handleDrawerSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    {drawer?.dayOpened
                      ? 'Counted Physical Cash in Drawer (₦) *'
                      : 'Starting Physical Cash in Drawer (₦) *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder={
                      drawer?.dayOpened
                        ? String(drawer.expectedCash)
                        : 'e.g. 25000'
                    }
                    value={drawerCashInput}
                    onChange={(e) => setDrawerCashInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm"
                  />
                </div>
                {drawer?.dayOpened && (
                  <div>
                    <label className="block font-bold uppercase text-slate-400 mb-1">
                      Close Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Balanced"
                      value={drawerNotes}
                      onChange={(e) => setDrawerNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0088FF] text-white font-bold"
                >
                  {drawer?.dayOpened
                    ? 'Close & Reconcile Drawer'
                    : 'Open Drawer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-extrabold mb-4">
              Checkout — {formatCurrency(cartTotal)}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Customer (Optional — required for credit)
                </label>
                <input
                  type="text"
                  placeholder="Search or type new customer name..."
                  value={custSearch}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setSelectedCustomer(null);
                  }}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none"
                />

                {!selectedCustomer && matchingCustomers.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl mt-1 max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {matchingCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustSearch(c.name);
                        }}
                        className="p-2.5 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="text-slate-400">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="mt-1.5 text-xs font-bold text-[#0088FF] dark:text-[#38BDF8] flex items-center justify-between bg-[#38BDF8]/10 px-3 py-1.5 rounded-lg">
                    <span>Selected: {selectedCustomer.name}</span>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustSearch('');
                      }}
                      className="text-rose-500 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {custSearch.trim() &&
                  !exactCustomerMatch &&
                  !selectedCustomer &&
                  !showAddCustForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustName(custSearch.trim());
                        setNewCustPhone('');
                        setShowAddCustForm(true);
                      }}
                      className="mt-2 w-full py-2 px-3 bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={14} /> + Add "{custSearch.trim()}" as new
                      customer
                    </button>
                  )}

                {showAddCustForm && (
                  <div className="mt-2 p-3 border border-dashed border-[#38BDF8] rounded-xl space-y-2">
                    <div className="text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                      Add New Customer
                    </div>
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQuickAddCustomer}
                        className="flex-1 py-1.5 bg-[#0088FF] text-white rounded-lg text-xs font-bold"
                      >
                        Save Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustForm(false)}
                        className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-bold outline-none"
                />
                <div className="mt-1.5 text-xs font-bold">
                  {changeGiven > 0 && (
                    <span className="text-[#0088FF] dark:text-[#38BDF8]">
                      Change to give customer: {formatCurrency(changeGiven)}
                    </span>
                  )}
                  {balanceOwed > 0 && (
                    <span className="text-amber-500">
                      Balance owed: {formatCurrency(balanceOwed)} — customer
                      required.
                    </span>
                  )}
                  {changeGiven === 0 && balanceOwed === 0 && (
                    <span className="text-emerald-500">
                      Fully paid. Change: {formatCurrency(0)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-medium outline-none"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>POS/Card</option>
                  <option>Other</option>
                </select>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">
                  {checkoutError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 py-3 bg-[#0088FF] hover:bg-[#0284C7] text-white rounded-xl font-bold text-sm"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared 80mm Thermal Receipt Modal */}
      {receipt && (
        <ThermalReceiptModal
          receipt={receipt}
          heading="Sale Complete"
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
