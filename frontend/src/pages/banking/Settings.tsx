import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save } from 'lucide-react';
import {
  getBankingSettings,
  updateBankingChargeDefault,
  addBankingProvider,
  deleteBankingProvider,
} from '../../services/api';

export default function BankingSettings() {
  const branchId = 'BR002';
  const [charges, setCharges] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [editCharges, setEditCharges] = useState<Record<string, number>>({});
  const [newProvider, setNewProvider] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getBankingSettings(branchId);
      setCharges(data.charges || []);
      setProviders(data.providers || []);
      const map: Record<string, number> = {};
      (data.charges || []).forEach((c: any) => {
        map[c.transaction_type] = Number(c.default_charge) || 0;
      });
      setEditCharges(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCharge = async (type: string) => {
    try {
      await updateBankingChargeDefault(
        branchId,
        type,
        Number(editCharges[type]) || 0,
      );
      alert(`${type} default charge updated!`);
      fetchSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.trim()) return;
    try {
      await addBankingProvider(branchId, newProvider.trim());
      setNewProvider('');
      fetchSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Remove this POS provider?')) return;
    try {
      await deleteBankingProvider(id);
      fetchSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-brand-banking" /> Banking Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure default transaction charges and POS terminal providers.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default Charges */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-banking">
            <h3 className="font-bold text-gray-900 mb-1">
              Default Charges by Transaction Type
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Auto-fills the Charge field on new transactions (can be overridden
              per transaction).
            </p>

            <div className="divide-y divide-gray-100">
              {charges.map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-gray-800 text-sm">
                    {c.transaction_type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">₦</span>
                    <input
                      type="number"
                      min="0"
                      value={editCharges[c.transaction_type] ?? 0}
                      onChange={(e) =>
                        setEditCharges({
                          ...editCharges,
                          [c.transaction_type]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:bg-white"
                    />
                    <button
                      onClick={() => handleSaveCharge(c.transaction_type)}
                      className="px-3 py-2 bg-brand-banking text-white rounded-lg text-xs font-bold hover:bg-blue-800 flex items-center gap-1"
                    >
                      <Save size={13} /> Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POS Providers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-400">
            <h3 className="font-bold text-gray-900 mb-1">
              POS Terminal Providers
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Manage the list of providers shown on the transaction form.
            </p>

            <form onSubmit={handleAddProvider} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New provider name (e.g. Kuda)"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-banking text-white rounded-lg text-xs font-bold hover:bg-blue-800 flex items-center gap-1"
              >
                <Plus size={15} /> Add
              </button>
            </form>

            <div className="divide-y divide-gray-100">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="py-2.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-sm">
                    {p.provider_name}
                  </span>
                  <button
                    onClick={() => handleDeleteProvider(p.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
