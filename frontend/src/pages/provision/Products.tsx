import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit2, Power } from 'lucide-react';
import {
  getProvisionProducts,
  createProvisionProduct,
  updateProvisionProduct,
  setProvisionProductStatus,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const emptyForm = {
  name: '',
  unit: '',
  reorderLevel: 10,
  openingStock: 0,
  buyingPrice: 0,
  sellingPrice: 0,
  bulkEnabled: false,
  bulkType: 'Carton',
  unitsPerBulk: 12,
  bulkPrice: 0,
  expiryTracking: false,
};

export default function Products() {
  const { session } = useAuthStore();
  const branchId = session?.branchId || 'BR001';

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionProducts(branchId);
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      unit: p.unit,
      reorderLevel: p.reorder_level,
      openingStock: p.stock_quantity,
      buyingPrice: p.buying_price,
      sellingPrice: p.selling_price,
      bulkEnabled: Boolean(p.bulk_enabled),
      bulkType: p.bulk_type || 'Carton',
      unitsPerBulk: p.units_per_bulk || 12,
      bulkPrice: p.bulk_price || 0,
      expiryTracking: Boolean(p.expiry_tracking),
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProvisionProduct(editingId, formData);
      } else {
        await createProvisionProduct({ ...formData, branchId });
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Failed to save product');
    }
  };

  const handleToggleStatus = async (p: any) => {
    const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Change "${p.name}" status to ${newStatus}?`)) return;
    try {
      await setProvisionProductStatus(p.id, newStatus);
      fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Could not update status');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Products Master
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your provision store catalog, pricing, and bulk tiers.
          </p>
        </div>
        <button
          onClick={() => (isFormOpen ? setIsFormOpen(false) : startAdd())}
          className="flex items-center gap-2 bg-brand-provision text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm"
        >
          {isFormOpen ? (
            'Close Form'
          ) : (
            <>
              <Plus size={18} /> Add New Product
            </>
          )}
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-provision">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Milo 400g"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Unit *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tin, Bottle, Sachet"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Reorder Level (Units) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderLevel: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Opening Stock {editingId && '(Locked on Edit)'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={Boolean(editingId)}
                  value={formData.openingStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openingStock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Buying Price (Per Unit ₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.buyingPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      buyingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Selling Price (Per Unit ₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none"
                />
              </div>
            </div>

            {/* Bulk Pack Selling Tier */}
            <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-brand-provision">
                    Bulk Pack Selling
                  </h4>
                  <p className="text-xs text-gray-500">
                    Can this product also be sold as a pack, carton, roll or
                    dozen?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, bulkEnabled: true })
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      formData.bulkEnabled
                        ? 'bg-green-100 border-brand-provision text-brand-provision'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, bulkEnabled: false })
                    }
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      !formData.bulkEnabled
                        ? 'bg-red-100 border-red-500 text-red-600'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {formData.bulkEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Bulk Type *
                    </label>
                    <select
                      value={formData.bulkType}
                      onChange={(e) =>
                        setFormData({ ...formData, bulkType: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none"
                    >
                      <option value="Pack">Pack</option>
                      <option value="Carton">Carton</option>
                      <option value="Roll">Roll</option>
                      <option value="Dozen">Dozen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Units per {formData.bulkType} *
                    </label>
                    <input
                      required
                      type="number"
                      min="2"
                      value={formData.unitsPerBulk}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitsPerBulk: parseInt(e.target.value) || 2,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Selling Price (Per {formData.bulkType} ₦) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.bulkPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bulkPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={formData.expiryTracking}
                onChange={(e) =>
                  setFormData({ ...formData, expiryTracking: e.target.checked })
                }
                className="w-4 h-4 accent-brand-provision rounded"
              />
              Track expiry batches for this product
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-brand-provision text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                {editingId ? 'Update Product' : 'Save Product'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-provision/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Buy (₦)</th>
                <th className="px-6 py-4">Sell (₦)</th>
                <th className="px-6 py-4">Bulk Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <Package className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                    <p>No products found.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {p.product_code}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {p.name}{' '}
                      <span className="text-gray-400 font-normal ml-1">
                        ({p.unit})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.stock_quantity <= p.reorder_level
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      ₦{p.buying_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-provision">
                      ₦{p.selling_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {p.bulk_enabled
                        ? `${p.bulk_type} · ${p.units_per_bulk} × ₦${Number(p.bulk_price).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'Active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                          p.status === 'Active'
                            ? 'bg-red-50 hover:bg-red-100 text-red-600'
                            : 'bg-green-50 hover:bg-green-100 text-green-700'
                        }`}
                      >
                        <Power size={12} />{' '}
                        {p.status === 'Active' ? 'Deactivate' : 'Activate'}
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
