import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, RotateCcw, Search } from 'lucide-react';
import {
  getPermissionMatrix,
  setPermissionCell,
  resetEmployeePermissions,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ACTIONS: Array<{
  key: 'view' | 'add' | 'edit' | 'delete';
  letter: string;
}> = [
  { key: 'view', letter: 'V' },
  { key: 'add', letter: 'A' },
  { key: 'edit', letter: 'E' },
  { key: 'delete', letter: 'D' },
];

export default function PermissionsMatrix() {
  const { session } = useAuthStore();
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setIsLoading(true);
    try {
      const data = await getPermissionMatrix();
      setMatrixData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (
    employeeId: string,
    pageKey: string,
    action: 'view' | 'add' | 'edit' | 'delete',
    currentVal: boolean,
  ) => {
    const nextVal = !currentVal;
    // Optimistic UI update
    setMatrixData((prev: any) => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [employeeId]: {
          ...prev.matrix[employeeId],
          [pageKey]: {
            ...prev.matrix[employeeId][pageKey],
            [action]: nextVal,
            overridden: true,
          },
        },
      },
    }));

    try {
      await setPermissionCell({
        employeeId,
        pageKey,
        action,
        value: nextVal,
        actorName: session?.name,
      });
      setStatusMsg(
        'Saved immediately — takes effect on staff member’s next action.',
      );
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
      loadMatrix();
    }
  };

  const handleResetStaff = async (employeeId: string, empName: string) => {
    if (!confirm(`Return ${empName} to the normal Cashier defaults?`)) return;
    try {
      await resetEmployeePermissions(employeeId, session?.name);
      loadMatrix();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !matrixData) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading permissions matrix...
      </div>
    );
  }

  const filteredPages = matrixData.pages.filter(
    (p: any) =>
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.section.toLowerCase().includes(search.toLowerCase()),
  );

  let lastSection = '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-[#0088FF] dark:text-[#38BDF8]" /> Roles
            & Permissions Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong>V</strong> = View · <strong>A</strong> = Add ·{' '}
            <strong>E</strong> = Edit · <strong>D</strong> = Delete. Owner is
            locked ON. Yellow cells indicate custom overrides.
          </p>
        </div>
        {statusMsg && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
            {statusMsg}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search page or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            {matrixData.employees.length} active staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold min-w-[200px]">Page / Function</th>
                {matrixData.employees.map((emp: any) => (
                  <th
                    key={emp.employeeId}
                    colSpan={4}
                    className="p-3 text-center border-l border-slate-200 dark:border-slate-800 min-w-[170px]"
                  >
                    <div className="font-extrabold flex items-center justify-center gap-1.5">
                      <span>{emp.name}</span>
                      {emp.locked ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] inline-flex items-center gap-1">
                          <Lock size={10} /> Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] text-[10px]">
                          {emp.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {emp.employeeCode}
                    </div>
                    {!emp.locked && (
                      <button
                        onClick={() =>
                          handleResetStaff(emp.employeeId, emp.name)
                        }
                        className="mt-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold inline-flex items-center gap-1 hover:bg-amber-500/20"
                      >
                        <RotateCcw size={10} /> Reset to defaults
                      </button>
                    )}
                  </th>
                ))}
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <th className="px-4 py-2"></th>
                {matrixData.employees.map((emp: any) =>
                  ACTIONS.map((act) => (
                    <th
                      key={`${emp.employeeId}_${act.key}`}
                      className="py-1.5 text-center font-mono text-[10px] text-slate-400 border-l border-slate-100 dark:border-slate-800/60"
                    >
                      {act.letter}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPages.map((p: any) => {
                const showSectionHeader = p.section !== lastSection;
                lastSection = p.section;
                return (
                  <>
                    {showSectionHeader && (
                      <tr
                        key={`sec_${p.section}`}
                        className="bg-slate-100/70 dark:bg-[#09090B]"
                      >
                        <td
                          colSpan={1 + matrixData.employees.length * 4}
                          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#0088FF] dark:text-[#38BDF8]"
                        >
                          {p.section}
                        </td>
                      </tr>
                    )}
                    <tr
                      key={p.key}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 font-bold">{p.label}</td>
                      {matrixData.employees.map((emp: any) => {
                        const perm = (matrixData.matrix[emp.employeeId] || {})[
                          p.key
                        ] || {
                          view: false,
                          add: false,
                          edit: false,
                          delete: false,
                        };
                        return ACTIONS.map((act) => {
                          const checked = Boolean(perm[act.key]);
                          return (
                            <td
                              key={`${emp.employeeId}_${p.key}_${act.key}`}
                              className={`p-2 text-center border-l border-slate-100 dark:border-slate-800/60 ${
                                perm.overridden ? 'bg-amber-500/10' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={emp.locked}
                                onChange={() =>
                                  handleToggle(
                                    emp.employeeId,
                                    p.key,
                                    act.key,
                                    checked,
                                  )
                                }
                                className="w-4 h-4 accent-[#0088FF] rounded cursor-pointer disabled:opacity-40"
                              />
                            </td>
                          );
                        });
                      })}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
