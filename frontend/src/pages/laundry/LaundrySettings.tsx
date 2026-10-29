import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save } from 'lucide-react';
import {
  getLaundrySettings,
  addLaundryItemType,
  updateLaundryItemPrice,
  deleteLaundryItemType,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LaundrySettings() {
  const { session } = useAuthStore();
  const branchId = 'BR003';

  const [items, setItems] = useState<any[]>([]);
  const [editPrices, setEditPrices] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getLaundrySettings(branchId);
      setItems(data || []);
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        map[r.id] = Number(r.default_price) || 0;
      });
      setEditPrices(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrice = async (id: string) => {
    try {
      await updateLaundryItemPrice(
        id,
        Number(editPrices[id]) || 0,
        session?.name,
      );
      alert('Garment price updated!');
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addLaundryItemType(
        branchId,
        newName.trim(),
        parseFloat(newPrice) || 0,
        session?.name,
      );
      setNewName('');
      setNewPrice('');
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this garment item type?')) return;
    try {
      await deleteLaundryItemType(id);
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Laundry Garment Price List
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure default prices by garment type. These auto-fill when
          creating a new laundry order.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <input
            required
            type="text"
            placeholder="New item type (e.g. School Uniform)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Default Price (₦)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold"
          />
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-[#0088FF] text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Plus size={15} /> Add Garment Type
          </button>
        </form>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400">
              Loading price list...
            </div>
          ) : (
            items.map((r) => (
              <div
                key={r.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <span className="font-bold text-sm">{r.item_type}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editPrices[r.id] ?? 0}
                    onChange={(e) =>
                      setEditPrices({
                        ...editPrices,
                        [r.id]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-28 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold"
                  />
                  <button
                    onClick={() => handleSavePrice(r.id)}
                    className="px-3 py-2 rounded-lg bg-[#0088FF] text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Save size={13} /> Save
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
