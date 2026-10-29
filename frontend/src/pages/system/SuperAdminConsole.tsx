import React, { useState, useEffect } from 'react';
import { Crown, Plus, Building2, KeyRound, CheckCircle2 } from 'lucide-react';
import {
  getSuperAdminTenants,
  createSuperAdminTenant,
  updateSuperAdminTenant,
  updateSuperAdminCredentials,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';

const ALL_MODULES = ['provision', 'banking', 'laundry'];

export default function SuperAdminConsole() {
  const { session, setTenant } = useAuthStore();
  const [tenants, setTenants] = useState<any[]>([]);
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerCode, setOwnerCode] = useState('');
  const [ownerPin, setOwnerPin] = useState('0000');
  const [selectedMods, setSelectedMods] = useState<string[]>(['provision']);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  if (session?.role !== 'SuperAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const data = await getSuperAdminTenants();
      setTenants(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNewMod = (mod: string) => {
    setSelectedMods((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || selectedMods.length === 0) {
      alert('Enter a shop name and select at least one module.');
      return;
    }
    try {
      const res = await createSuperAdminTenant({
        shopName: shopName.trim(),
        phone: phone.trim(),
        ownerCode: ownerCode.trim().toUpperCase(),
        ownerPin: ownerPin.trim() || '0000',
        enabledModules: selectedMods,
        subscriptionStatus: 'Active',
        subscriptionExpiresAt: expiresAt || null,
      });
      setCreatedCredentials({
        shopName: shopName.trim(),
        tenantId: res.id,
        ownerCode: res.ownerCode,
        ownerPin: res.ownerPin,
        recoveryKey: res.recoveryKey,
      });
      setShopName('');
      setPhone('');
      setOwnerCode('');
      fetchTenants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleTenantModule = async (tRow: any, mod: string) => {
    const current: string[] = JSON.parse(
      tRow.enabled_modules || '["provision"]',
    );
    const next = current.includes(mod)
      ? current.filter((m) => m !== mod)
      : [...current, mod];
    if (next.length === 0) return;

    await updateSuperAdminTenant(tRow.id, {
      enabledModules: next,
      subscriptionStatus: tRow.subscription_status,
      subscriptionExpiresAt: tRow.subscription_expires_at,
    });
    if (tRow.id === 'TENANT-001') {
      setTenant({ enabledModules: next });
    }
    fetchTenants();
  };

  const handleStatusChange = async (tRow: any, newStatus: string) => {
    await updateSuperAdminTenant(tRow.id, {
      subscriptionStatus: newStatus,
      subscriptionExpiresAt: tRow.subscription_expires_at,
    });
    fetchTenants();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          Founder Control Plane · Restricted to {session?.employeeCode}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 mt-1.5">
          <Crown className="text-amber-500" /> AmanaHQ B2B SaaS Tenant Manager
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Onboard new business clients, generate their Owner login credentials,
          and control their active modules.
        </p>
      </div>

      {createdCredentials && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-500 font-extrabold text-sm flex items-center gap-2">
              <CheckCircle2 size={18} /> Client Workspace Provisioned:{' '}
              {createdCredentials.shopName}
            </span>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-xs text-slate-400 underline"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white dark:bg-[#09090B] border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">
                Owner Login Code
              </div>
              <div className="text-base font-black text-[#0088FF] dark:text-[#38BDF8]">
                {createdCredentials.ownerCode}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#09090B] border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">
                Initial 4-Digit PIN
              </div>
              <div className="text-base font-black">
                {createdCredentials.ownerPin}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#09090B] border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">
                Master Recovery Key
              </div>
              <div className="text-base font-black text-emerald-500">
                {createdCredentials.recoveryKey}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Business Tenant */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <Plus size={18} className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Onboard New Business Client
        </h3>
        <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label className="block font-bold uppercase text-slate-400 mb-1">
                Business / Shop Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Danjuma Superstore"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-400 mb-1">
                Owner Login Code *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. DANJUMA01"
                value={ownerCode}
                onChange={(e) => setOwnerCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-400 mb-1">
                Initial PIN *
              </label>
              <input
                required
                type="text"
                maxLength={4}
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-400 mb-1">
                Subscription Expiry
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="font-bold uppercase text-slate-400">
                Subscribed Modules:
              </span>
              {ALL_MODULES.map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-1.5 font-bold capitalize cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMods.includes(m)}
                    onChange={() => toggleNewMod(m)}
                    className="w-4 h-4 accent-[#0088FF] rounded"
                  />
                  {m}
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold"
            >
              + Provision Business & Owner Account
            </button>
          </div>
        </form>
      </div>

      {/* Active B2B Tenants Table */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Building2
              size={16}
              className="text-[#0088FF] dark:text-[#38BDF8]"
            />{' '}
            Provisioned Business Tenants ({tenants.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Tenant & ID</th>
                <th className="p-4">Enabled Modules (Click to Toggle)</th>
                <th className="p-4">Master Recovery Key</th>
                <th className="p-4">Subscription</th>
                <th className="p-4">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading tenants...
                  </td>
                </tr>
              ) : (
                tenants.map((tRow) => {
                  const mods: string[] = JSON.parse(
                    tRow.enabled_modules || '["provision"]',
                  );
                  return (
                    <tr key={tRow.id}>
                      <td className="p-4">
                        <div className="font-extrabold text-sm">
                          {tRow.shop_name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {tRow.id}
                        </div>
                      </td>
                      <td className="p-4 space-x-1.5">
                        {ALL_MODULES.map((m) => {
                          const on = mods.includes(m);
                          return (
                            <button
                              key={m}
                              onClick={() => handleToggleTenantModule(tRow, m)}
                              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                                on
                                  ? 'bg-[#0088FF] text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {m} {on ? '✓' : '✕'}
                            </button>
                          );
                        })}
                      </td>
                      <td className="p-4 font-mono font-bold text-[#0088FF] dark:text-[#38BDF8]">
                        <span className="inline-flex items-center gap-1">
                          <KeyRound size={12} /> {tRow.master_recovery_key}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={tRow.subscription_status}
                          onChange={(e) =>
                            handleStatusChange(tRow, e.target.value)
                          }
                          className={`px-2.5 py-1 rounded-lg font-bold outline-none ${
                            tRow.subscription_status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : tRow.subscription_status === 'Trial'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Trial">Trial</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {tRow.subscription_expires_at || 'Lifetime Free'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Founder Self-Service Credentials Card */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="font-bold text-base mb-1 flex items-center gap-2">
          <KeyRound size={18} className="text-amber-500" /> Founder Security &
          Login Credentials
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Update your SuperAdmin Employee Code (currently{' '}
          <strong>{session?.employeeCode}</strong>) or set a new 4-digit PIN
          before going live.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newCode = String(formData.get('newCode') || '').trim();
            const newName = String(formData.get('newName') || '').trim();
            const newPin = String(formData.get('newPin') || '').trim();
            try {
              await updateSuperAdminCredentials({ newCode, newName, newPin });
              alert(
                `SuperAdmin credentials updated! Next time you log in, use Code: ${newCode.toUpperCase()}`,
              );
            } catch (err: any) {
              alert(err.message);
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs"
        >
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              SuperAdmin Code *
            </label>
            <input
              name="newCode"
              required
              defaultValue={session?.employeeCode || 'KAREM'}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              Display Name *
            </label>
            <input
              name="newName"
              required
              defaultValue={session?.name || 'Abdulkarem (Founder)'}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-400 mb-1">
              New 4-Digit PIN (Optional)
            </label>
            <input
              name="newPin"
              type="password"
              maxLength={4}
              placeholder="Leave blank to keep current"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-extrabold"
          >
            Update My Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
