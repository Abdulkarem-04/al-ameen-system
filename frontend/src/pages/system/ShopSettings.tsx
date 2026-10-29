import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Upload,
  Trash2,
  Save,
  KeyRound,
} from 'lucide-react';
import {
  getShopSettings,
  saveShopSettings,
  saveShopLogo,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ShopSettings() {
  const { session, setTenant } = useAuthStore();
  const [form, setForm] = useState({
    shop_name: '',
    tagline: '',
    phone: '',
    address: '',
    currency_symbol: '₦',
    receipt_footer: '',
    invoice_prefix: 'INV-',
    receipt_prefix: 'RCP-',
    low_stock_default: 5,
    logo_data_url: '',
    master_recovery_key: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getShopSettings()
      .then((data) => {
        if (data) setForm((prev) => ({ ...prev, ...data }));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveShopSettings({ ...form, actorName: session?.name });
      setTenant({
        shopName: form.shop_name,
        tagline: form.tagline,
        phone: form.phone,
        address: form.address,
        currencySymbol: form.currency_symbol,
        receiptFooter: form.receipt_footer,
        invoicePrefix: form.invoice_prefix,
        receiptPrefix: form.receipt_prefix,
        lowStockDefault: Number(form.low_stock_default) || 5,
      });
      alert('Shop settings saved and applied across the entire app!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Client-side 256px Canvas Logo Downscaler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const scale = Math.min(
          1,
          256 / Math.max(img.width || 1, img.height || 1),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 0.85);
        try {
          await saveShopLogo(dataUrl, session?.name);
          setForm((prev) => ({ ...prev, logo_data_url: dataUrl }));
          setTenant({ logoDataUrl: dataUrl });
        } catch (err: any) {
          alert(err.message);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove custom business logo and revert to AmanaHQ Ribbon?'))
      return;
    await saveShopLogo('', session?.name);
    setForm((prev) => ({ ...prev, logo_data_url: '' }));
    setTenant({ logoDataUrl: '' });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading shop settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-[#0088FF] dark:text-[#38BDF8]" /> Shop
          Settings & Branding
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your business name, logo, currency symbol, and thermal
          receipt layout.
        </p>
      </div>

      {/* Master Recovery Key Card */}
      <div className="bg-[#0088FF]/10 border border-[#38BDF8]/30 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <KeyRound className="text-[#0088FF] dark:text-[#38BDF8]" size={22} />
          <div>
            <div className="text-xs font-extrabold">
              Owner Emergency Master Recovery Key
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Write this down safely. Used to reset the Owner PIN on the login
              screen if forgotten.
            </div>
          </div>
        </div>
        <code className="px-4 py-2 rounded-xl bg-white dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 font-mono font-black text-sm text-[#0088FF] dark:text-[#38BDF8]">
          {form.master_recovery_key || 'AMANA-2026-HQ99'}
        </code>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5"
      >
        <h3 className="font-bold text-base">
          Business Identity & Receipt Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Shop Name *
            </label>
            <input
              required
              type="text"
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Shop Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Currency Symbol *
            </label>
            <input
              required
              type="text"
              maxLength={4}
              value={form.currency_symbol}
              onChange={(e) =>
                setForm({ ...form, currency_symbol: e.target.value })
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Invoice Number Prefix *
            </label>
            <input
              required
              type="text"
              maxLength={8}
              value={form.invoice_prefix}
              onChange={(e) =>
                setForm({ ...form, invoice_prefix: e.target.value })
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Receipt Footer Message
            </label>
            <input
              type="text"
              value={form.receipt_footer}
              onChange={(e) =>
                setForm({ ...form, receipt_footer: e.target.value })
              }
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center gap-2"
        >
          <Save size={15} /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Custom Business Logo Uploader */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-base">Custom Business Logo</h3>
        <p className="text-xs text-slate-500">
          Shown on the Login screen, Sidebar header, and printed 80mm Thermal
          Receipts.
        </p>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-[#0C0E12] overflow-hidden">
            {form.logo_data_url ? (
              <img
                src={form.logo_data_url}
                alt="Logo"
                className="max-h-20 max-w-20 object-contain"
              />
            ) : (
              <span className="text-[11px] text-slate-400">Default Λ</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="px-4 py-2.5 rounded-xl bg-[#0088FF] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
              <Upload size={14} /> Upload New Logo (PNG/JPG)
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
            </label>
            {form.logo_data_url && (
              <div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Trash2 size={13} /> Remove Custom Logo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
