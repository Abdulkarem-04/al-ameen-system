import React, { useState, useEffect } from 'react';
import { Truck, Search, PlusCircle } from 'lucide-react';
import {
  getProvisionProducts,
  getProvisionPurchases,
  recordPurchase,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Purchases() {
  const { session } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const branchId = session?.branchId || 'BR001';
      const [prods, purcs] = await Promise.all([
        getProvisionProducts(branchId),
        getProvisionPurchases(branchId),
      ]);
      setProducts(prods);
      setPurchases(purcs);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPreview = (Number(quantity) || 0) * (Number(costPerUnit) || 0);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !costPerUnit) {
      alert('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProduct = products.find((p) => p.id === productId);
      await recordPurchase({
        branchId: session?.branchId || 'BR001',
        employeeName: session?.name || 'Owner',
        productId,
        productName: selectedProduct?.name,
        quantity: Number(quantity),
        costPerUnit: Number(costPerUnit),
      });

      // Reset form and refresh data
      setProductId('');
      setQuantity('');
      setCostPerUnit('');
      fetchData();
      alert('Restock recorded successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to record purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Supplier Purchases
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Record restocks to automatically update your inventory.
        </p>
      </div>

      {/* Restock Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-provision">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Truck size={20} className="text-brand-provision" /> Record a Restock
        </h3>

        <form
          onSubmit={handleRestock}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Select Product *
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all font-medium text-gray-700"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock_quantity} left)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Quantity *
            </label>
            <input
              required
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Cost Per Unit (₦) *
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || '')}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">
              Total Cost
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-gray-900">
                ₦{totalPreview.toLocaleString()}
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-provision text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <PlusCircle size={18} /> Save
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Purchase History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Cost/Unit</th>
                <th className="px-6 py-4">Total Amount</th>
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
                    Loading history...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No purchases recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {p.purchase_code}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {p.product_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-bold">
                        +{p.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      ₦{p.cost_per_unit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      ₦{p.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {p.employee_name}
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
