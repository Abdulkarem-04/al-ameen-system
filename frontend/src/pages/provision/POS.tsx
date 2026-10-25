import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  CreditCard,
  Trash2,
  UserPlus,
  Printer,
  CheckCircle2,
  Package,
} from 'lucide-react';
import {
  getProvisionProducts,
  getProvisionCustomers,
  createProvisionCustomer,
  processCheckout,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function POS() {
  const { session } = useAuthStore();
  const branchId = session?.branchId || 'BR001';

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Inline Add Customer inside Checkout
  const [showAddCustForm, setShowAddCustForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Receipt Modal State
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchPOSData();
  }, []);

  const fetchPOSData = async () => {
    try {
      const [prods, custs] = await Promise.all([
        getProvisionProducts(branchId),
        getProvisionCustomers(branchId),
      ]);
      setProducts(prods.filter((p: any) => p.status === 'Active'));
      setCustomers(custs);
    } catch (error) {
      console.error(error);
    }
  };

  // Supports adding either 'Unit' or 'Bulk' tier while checking total underlying pieces in cart!
  const addToCart = (product: any, tier: 'Unit' | 'Bulk' = 'Unit') => {
    const isBulk = tier === 'Bulk' && Boolean(product.bulk_enabled);
    const piecesPerUnit = isBulk ? Number(product.units_per_bulk) || 1 : 1;
    const unitPrice = isBulk
      ? Number(product.bulk_price)
      : Number(product.selling_price);
    const tierLabel = isBulk ? product.bulk_type : product.unit;
    const cartKey = `${product.id}_${tier}`;

    setCart((prev) => {
      // Calculate how many total pieces of this product are already in the cart across both Unit and Bulk lines
      const piecesAlreadyInCart = prev
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.quantity * item.piecesPerUnit, 0);

      if (piecesAlreadyInCart + piecesPerUnit > product.stock_quantity) {
        alert(
          `Not enough stock! Available: ${product.stock_quantity} ${product.unit}s (${piecesAlreadyInCart} already in cart).`,
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
        customerName: selectedCustomer?.name || '',
        items: cart.map(
          (c) =>
            `${c.name} x${c.quantity} (${c.tierLabel}) — ₦${(c.price * c.quantity).toLocaleString()}`,
        ),
        totalAmount: cartTotal,
        amountPaid: paidNum,
        changeGiven,
        balance: balanceOwed,
        paymentMethod,
      });
      setCart([]);
      fetchPOSData();
    } catch (error: any) {
      setCheckoutError(error.message || 'Checkout failed.');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      ? 'opacity-50 grayscale bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-100 hover:border-brand-provision/40 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight">
                        {p.name}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          p.stock_quantity <= p.reorder_level
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.stock_quantity} {p.unit}s
                      </span>
                    </div>
                    <div className="text-brand-provision font-extrabold text-base mb-3">
                      ₦{p.selling_price.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-gray-400">
                        / {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <button
                      disabled={outOfStock}
                      onClick={() => addToCart(p, 'Unit')}
                      className="w-full py-2 px-3 bg-green-50 hover:bg-brand-provision hover:text-white text-brand-provision rounded-lg text-xs font-bold transition-colors text-left flex justify-between items-center"
                    >
                      <span>+ 1 {p.unit}</span>
                      <span>₦{p.selling_price.toLocaleString()}</span>
                    </button>

                    {canBulk && (
                      <button
                        disabled={p.stock_quantity < p.units_per_bulk}
                        onClick={() => addToCart(p, 'Bulk')}
                        className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 disabled:opacity-40 rounded-lg text-xs font-bold transition-colors text-left flex justify-between items-center"
                      >
                        <span className="flex items-center gap-1">
                          <Package size={12} /> + 1 {p.bulk_type} (
                          {p.units_per_bulk})
                        </span>
                        <span>₦{Number(p.bulk_price).toLocaleString()}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Shopping Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={18} /> Current Order
          </h2>
          <span className="bg-gray-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {cart.length} lines
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartKey}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm">
                    {item.name}{' '}
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 ml-1">
                      {item.tierLabel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.quantity} x ₦{item.price.toLocaleString()}
                    {item.piecesPerUnit > 1 &&
                      ` (${item.quantity * item.piecesPerUnit} ${item.unit}s)`}
                  </div>
                </div>
                <div className="font-extrabold text-gray-900 mr-3">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
                <button
                  onClick={() => removeFromCart(item.cartKey)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">
              Total Amount
            </span>
            <span className="text-3xl font-black text-brand-provision leading-none">
              ₦{cartTotal.toLocaleString()}
            </span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={openCheckout}
            className="w-full py-4 bg-brand-provision text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard size={20} /> Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">
              Checkout — ₦{cartTotal.toLocaleString()}
            </h2>

            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
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
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-provision/50"
                />

                {!selectedCustomer && matchingCustomers.length > 0 && (
                  <div className="border border-gray-200 rounded-xl mt-1 max-h-32 overflow-y-auto divide-y divide-gray-100">
                    {matchingCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustSearch(c.name);
                        }}
                        className="p-2.5 text-sm cursor-pointer hover:bg-green-50 flex justify-between"
                      >
                        <span className="font-bold text-gray-800">
                          {c.name}
                        </span>
                        <span className="text-xs text-gray-500">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="mt-1.5 text-xs font-bold text-brand-provision flex items-center justify-between bg-green-50 px-3 py-1.5 rounded-lg">
                    <span>Selected: {selectedCustomer.name}</span>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustSearch('');
                      }}
                      className="text-red-500 underline"
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
                      className="mt-2 w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100"
                    >
                      <UserPlus size={14} /> + Add "{custSearch.trim()}" as new
                      customer
                    </button>
                  )}

                {showAddCustForm && (
                  <div className="mt-2 p-3 border border-dashed border-brand-provision rounded-xl bg-green-50/40 space-y-2">
                    <div className="text-xs font-bold text-brand-provision">
                      Add New Customer
                    </div>
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQuickAddCustomer}
                        className="flex-1 py-1.5 bg-brand-provision text-white rounded-lg text-xs font-bold"
                      >
                        Save Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustForm(false)}
                        className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Amount Paid (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-provision/50 outline-none text-lg font-bold"
                />
                <div className="mt-1.5 text-xs font-bold">
                  {changeGiven > 0 && (
                    <span className="text-blue-600">
                      Change to give customer: ₦{changeGiven.toLocaleString()}
                    </span>
                  )}
                  {balanceOwed > 0 && (
                    <span className="text-amber-600">
                      Balance owed: ₦{balanceOwed.toLocaleString()} — a customer
                      must be selected.
                    </span>
                  )}
                  {changeGiven === 0 && balanceOwed === 0 && (
                    <span className="text-green-600">
                      Fully paid. Change: ₦0
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-provision/50 outline-none font-medium text-gray-800"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>POS/Card</option>
                  <option>Other</option>
                </select>
              </div>

              {checkoutError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {checkoutError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 py-3 bg-brand-provision text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-brand-provision font-extrabold text-lg mb-4">
              <CheckCircle2 size={22} /> Sale Complete
            </div>
            <div className="font-mono text-xs bg-gray-50 p-4 rounded-xl border border-gray-200 whitespace-pre-wrap space-y-1">
              <div>
                <strong>Invoice:</strong> {receipt.invoiceNumber}
              </div>
              {receipt.customerName && (
                <div>
                  <strong>Customer:</strong> {receipt.customerName}
                </div>
              )}
              <div className="pt-2 font-bold">Items:</div>
              {receipt.items.map((line: string, i: number) => (
                <div key={i}> {line}</div>
              ))}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div>Total: ₦{receipt.totalAmount.toLocaleString()}</div>
                <div>Paid: ₦{receipt.amountPaid.toLocaleString()}</div>
                {receipt.changeGiven > 0 && (
                  <div>Change: ₦{receipt.changeGiven.toLocaleString()}</div>
                )}
                <div>Balance: ₦{receipt.balance.toLocaleString()}</div>
                <div>Method: {receipt.paymentMethod}</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={() => setReceipt(null)}
              className="w-full mt-2 py-2.5 bg-brand-provision hover:bg-green-700 text-white rounded-xl font-bold text-sm"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
