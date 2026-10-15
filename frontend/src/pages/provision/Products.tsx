import React, { useState, useEffect } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import {
  getProvisionProducts,
  createProvisionProduct,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Products() {
  const { session } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    reorderLevel: 0,
    openingStock: 0,
    buyingPrice: 0,
    sellingPrice: 0,
    bulkEnabled: false,
    bulkType: '',
    unitsPerBulk: 0,
    bulkPrice: 0,
    expiryTracking: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getProvisionProducts(session?.branchId || 'BR001');
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProvisionProduct({
        ...formData,
        branchId: session?.branchId,
      });
      setIsAdding(false);
      fetchProducts(); // Refresh list
    } catch (error) {
      alert('Failed to save product');
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
            Manage your provision store inventory catalog.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-brand-provision text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm active:scale-95"
        >
          {isAdding ? (
            'Cancel'
          ) : (
            <>
              <Plus size={18} /> Add New Product
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Add New Product
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Milo 400g"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Unit *
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="e.g. Tin, Bottle"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Opening Stock
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
                  value={formData.openingStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openingStock: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Buying Price (₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
                  value={formData.buyingPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      buyingPrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Selling Price (₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-provision/50 outline-none transition-all"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sellingPrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-provision/50 transition-shadow"
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
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock_quantity <= p.reorder_level ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      ₦{p.buying_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-provision">
                      ₦{p.selling_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {p.status}
                      </span>
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
