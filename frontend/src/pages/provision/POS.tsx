import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, CreditCard, Trash2 } from 'lucide-react';
import { getProvisionProducts, processCheckout } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function POS() {
  const { session } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProvisionProducts(session?.branchId || 'BR001');
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Prevent selling more than stock
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      if (product.stock_quantity <= 0) return prev;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
          stock: product.stock_quantity,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    const paid = parseFloat(amountPaid) || cartTotal;
    const balance = Math.max(0, cartTotal - paid);

    // If there is a balance, we technically need a customer selected.
    // For this iteration, we will block partial payments without a customer feature implemented.
    if (balance > 0) {
      alert(
        'Partial payments require a selected customer. Please pay in full for walk-in sales.',
      );
      return;
    }

    try {
      const payload = {
        branchId: session?.branchId || 'BR001',
        employeeName: session?.name || 'Cashier',
        cart,
        payment: {
          totalAmount: cartTotal,
          amountPaid: paid,
          balance,
          method: paymentMethod,
        },
      };

      const result = await processCheckout(payload);
      alert(`Sale Successful! Invoice: ${result.invoiceNumber}`);
      setCart([]);
      setIsCheckoutModalOpen(false);
      setAmountPaid('');
      fetchProducts(); // Refresh stock levels
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
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
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-provision/50 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:border-brand-provision/50 ${p.stock_quantity <= 0 ? 'opacity-50 grayscale' : 'bg-white border-gray-100'}`}
              >
                <h3 className="font-bold text-gray-900 leading-tight mb-1">
                  {p.name}
                </h3>
                <div className="text-brand-provision font-extrabold mb-3">
                  ₦{p.selling_price.toLocaleString()}
                </div>
                <div
                  className={`text-xs font-semibold ${p.stock_quantity <= p.reorder_level ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {p.stock_quantity} {p.unit}s left
                </div>
              </div>
            ))}
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
            {cart.length} items
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
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.quantity} x ₦{item.price.toLocaleString()}
                  </div>
                </div>
                <div className="font-extrabold text-gray-900 mr-4">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
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
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full py-4 bg-brand-provision text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard size={20} /> Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              Complete Sale
            </h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex justify-between items-center border border-gray-100">
              <span className="text-gray-600 font-medium">Amount Due:</span>
              <span className="text-2xl font-black text-gray-900">
                ₦{cartTotal.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Amount Paid (₦)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={cartTotal.toString()}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-provision/50 outline-none text-lg font-bold"
                />
              </div>

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
                  <option>POS/Card</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
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
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
