import { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { getAuditLogs } from '../../services/api';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then((res) => setLogs(res || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const actionTypes = Array.from(
    new Set(logs.map((l) => l.action_type).filter(Boolean)),
  ).sort();

  const filtered = logs.filter((l) => {
    if (typeFilter && l.action_type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(l.employee_name || '')
        .toLowerCase()
        .includes(q) ||
      String(l.action_type || '')
        .toLowerCase()
        .includes(q) ||
      String(l.details || '')
        .toLowerCase()
        .includes(q)
    );
  });

  const badgeClass = (action: string) => {
    const a = String(action || '').toLowerCase();
    if (/sale|add|open|payment/.test(a))
      return 'bg-emerald-500/10 text-emerald-500';
    if (/refund|delete|deactiv|remove/.test(a))
      return 'bg-rose-500/10 text-rose-500';
    if (/permission|pin|setting|recover/.test(a))
      return 'bg-amber-500/10 text-amber-500';
    return 'bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8]';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <History className="text-[#0088FF] dark:text-[#38BDF8]" /> System
          Audit Log
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Every important action in the system — who did it, when, and what
          changed. Newest first.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111318] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search staff name, action or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
          >
            <option value="">All Action Types ({actionTypes.length})</option>
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0C0E12] text-xs uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Who</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No activity entries match.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      <span className="font-bold">{r.tx_date}</span>{' '}
                      <span className="text-slate-400 font-mono">
                        {r.tx_time}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-xs">
                      {r.employee_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass(r.action_type)}`}
                      >
                        {r.action_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-300">
                      {r.details}
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
