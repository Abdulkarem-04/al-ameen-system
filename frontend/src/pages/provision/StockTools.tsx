import React, { useState, useEffect } from 'react';
import { Sliders, CalendarClock, Trash2 } from 'lucide-react';
import {
  getProvisionProducts,
  adjustProvisionStock,
  getProvisionExpiryBatches,
  createProvisionExpiryBatch,
  deleteProvisionExpiryBatch,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function StockTools() {
  const { session } = useAuthStore();
  const branchId = session?.branchId || 'BR001';

  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stock Adjustment State
  const [adjProductId, setAdjProductId] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Expiry Batch State
  const [batchProductId, setBatchProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prods, expBatches] = await Promise.all([
        getProvisionProducts(branchId),
        getProvisionExpiryBatches(branchId),
      ]);
      setProducts(prods);
      setBatches(expBatches);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId || !adjDelta || !adjReason.trim()) {
      alert(
        'Please select a product, enter a non-zero adjustment, and provide a reason.',
      );
      return;
    }
    try {
      const res = await adjustProvisionStock({
        branchId,
        productId: adjProductId,
        deltaPieces: parseInt(adjDelta),
        reason: adjReason.trim(),
        employeeName: session?.name || 'Owner',
      });
      alert(`Stock updated! New stock level: ${res.newStock}`);
      setAdjProductId('');
      setAdjDelta('');
      setAdjReason('');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to adjust stock');
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === batchProductId);
    if (!prod || !batchQty || !batchExpiry) return;
    try {
      await createProvisionExpiryBatch({
        branchId,
        productId: prod.id,
        productName: prod.name,
        batchNumber: batchNumber.trim(),
        quantity: parseInt(batchQty),
        expiryDate: batchExpiry,
      });
      setBatchProductId('');
      setBatchNumber('');
      setBatchQty('');
      setBatchExpiry('');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to add expiry batch');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Remove this expiry batch record?')) return;
    try {
      await deleteProvisionExpiryBatch(id);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getExpiryBadge = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    const daysLeft = Math.floor(
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft < 0) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
          Expired
        </span>
      );
    }
    if (daysLeft <= 30) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
          {daysLeft}d left
        </span>
      );
    }
    return (
      <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold">
        {daysLeft}d left
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Stock & Expiry Tools
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Perform manual stock count adjustments and monitor product expiry
          batches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Stock Adjustment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-provision">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sliders size={20} className="text-brand-provision" /> Manual Stock
            Adjustment
          </h3>
          <form onSubmit={handleAdjustment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Product *
              </label>
              <select
                required
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stock_quantity} {p.unit}s in stock)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Adjustment (Use negative number to reduce stock) *
              </label>
              <input
                required
                type="number"
                step="1"
                placeholder="e.g. -5 or 20"
                value={adjDelta}
                onChange={(e) => setAdjDelta(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Reason (Required) *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Damaged goods, stock count correction"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-brand-provision text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Apply Adjustment
            </button>
          </form>
        </div>

        {/* Add Expiry Batch */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-amber-500">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarClock size={20} className="text-amber-600" /> Add Expiry
            Batch
          </h3>
          <form onSubmit={handleAddBatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Product *
              </label>
              <select
                required
                value={batchProductId}
                onChange={(e) => setBatchProductId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Batch Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ML-2026-B"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Quantity *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={batchQty}
                  onChange={(e) => setBatchQty(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Expiry Date *
              </label>
              <input
                required
                type="date"
                value={batchExpiry}
                onChange={(e) => setBatchExpiry(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Add Expiry Batch
            </button>
          </form>
        </div>
      </div>

      {/* Expiry Batches Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800">Tracked Expiry Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Batch Number</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Expiry Date</th>
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
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No expiry batches recorded.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {b.product_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {b.batch_number || '—'}
                    </td>
                    <td className="px-6 py-4 font-bold">{b.quantity}</td>
                    <td className="px-6 py-4 font-medium">
                      {b.expiry_date}
                      {getExpiryBadge(b.expiry_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteBatch(b.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
