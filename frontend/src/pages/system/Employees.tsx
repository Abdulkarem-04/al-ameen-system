import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  Power,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  resetEmployeePin,
  setEmployeeStatus,
  migratePinsToHash,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Employees() {
  const { session } = useAuthStore();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Employee Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Cashier');
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState('ALL');

  // Edit / Reset PIN Modals
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [pinResetEmp, setPinResetEmp] = useState<any | null>(null);
  const [newPinVal, setNewPinVal] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee({
        code: code.trim(),
        name: name.trim(),
        phone: phone.trim(),
        role,
        pin: pin.trim(),
        branchId,
        actorName: session?.name,
      });
      setCode('');
      setName('');
      setPhone('');
      setPin('');
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    try {
      await updateEmployee(editingEmp.id, {
        name: editingEmp.name,
        phone: editingEmp.phone,
        role: editingEmp.role,
        branchId: editingEmp.branch_id,
        actorName: session?.name,
      });
      setEditingEmp(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetEmp) return;
    try {
      await resetEmployeePin(pinResetEmp.id, newPinVal, session?.name);
      alert(`PIN updated for ${pinResetEmp.name}!`);
      setPinResetEmp(null);
      setNewPinVal('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (emp: any) => {
    const next = emp.status === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Change ${emp.name} status to ${next}?`)) return;
    try {
      await setEmployeeStatus(emp.id, next, session?.name);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMigratePins = async () => {
    try {
      const res = await migratePinsToHash();
      alert(
        `PIN Security Check Complete: ${res.migrated} PIN(s) newly hashed, ${res.alreadySecure} already salted SHA-256.`,
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="text-[#0088FF] dark:text-[#38BDF8]" /> Staff & PIN
            Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add staff accounts, assign roles, reset 4-digit PINs, or deactivate
            accounts.
          </p>
        </div>
        <button
          onClick={handleMigratePins}
          className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5"
        >
          <ShieldAlert size={15} /> Secure All Plaintext PINs
        </button>
      </div>

      {/* Add Employee Card */}
      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-[#0088FF] dark:text-[#38BDF8]" />{' '}
          Add New Staff Member
        </h3>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Employee Code *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. CSH003"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Full Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Ibrahim Musa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
            >
              <option value="Cashier">Cashier</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              4-Digit PIN *
            </label>
            <input
              required
              type="password"
              maxLength={4}
              placeholder="1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-bold text-xs"
          >
            + Add Staff
          </button>
        </form>
      </div>

      {/* Staff List Table */}
      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <input
            type="text"
            placeholder="Search staff by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Full Name</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading staff...
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-[#0088FF] dark:text-[#38BDF8]">
                      {e.code}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {e.name}{' '}
                      {e.id === session?.employeeId && (
                        <span className="text-[10px] font-normal text-slate-400 ml-1">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8]">
                        {e.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {e.phone || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          e.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setEditingEmp({ ...e })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setPinResetEmp(e);
                          setNewPinVal('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold"
                      >
                        <KeyRound size={12} /> Reset PIN
                      </button>
                      <button
                        onClick={() => handleToggleStatus(e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                          e.status === 'Active'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        <Power size={12} />{' '}
                        {e.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingEmp && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">
                Edit {editingEmp.code}
              </h3>
              <button
                onClick={() => setEditingEmp(null)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={editingEmp.name}
                  onChange={(e) =>
                    setEditingEmp({ ...editingEmp, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={editingEmp.phone || ''}
                  onChange={(e) =>
                    setEditingEmp({ ...editingEmp, phone: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Role
                </label>
                <select
                  value={editingEmp.role}
                  onChange={(e) =>
                    setEditingEmp({ ...editingEmp, role: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0088FF] text-white font-bold"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {pinResetEmp && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">
                Reset PIN — {pinResetEmp.name}
              </h3>
              <button
                onClick={() => setPinResetEmp(null)}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPin} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  New 4-Digit PIN *
                </label>
                <input
                  required
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={newPinVal}
                  onChange={(e) => setNewPinVal(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center tracking-[0.5em] font-mono text-base font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0088FF] text-white font-bold"
              >
                Set New PIN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
