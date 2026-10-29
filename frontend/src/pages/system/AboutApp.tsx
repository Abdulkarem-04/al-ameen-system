import { ShieldCheck } from 'lucide-react';
import AmanaHQLogo from '../../components/AmanaHQLogo';
import { useAmanaUI } from '../../store/authStore';

export default function AboutApp() {
  const { tenant } = useAmanaUI();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
        <div className="flex justify-center">
          <AmanaHQLogo size={56} />
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] text-[11px] font-bold">
          <ShieldCheck size={12} /> AmanaHQ Cloud ERP v2.0
        </span>
        <h1 className="text-2xl font-extrabold">{tenant.shopName}</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          AmanaHQ is a multi-tenant, offline-capable retail POS, inventory,
          agency banking, and laundry management operating system powered by
          Cloudflare Edge Workers and D1 SQLite.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111318] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
        <h3 className="font-bold text-sm uppercase tracking-wider text-[#0088FF] dark:text-[#38BDF8]">
          Core Accounting & Security Guarantees
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            [
              'Atomic POS Sales',
              'Every checkout deducts underlying unit/bulk stock, records the invoice, and logs a movement atomically.',
            ],
            [
              'Sales Returns & Refunds',
              'Refunding an invoice automatically restores product stock, adjusts profit & customer credit, and logs the reason.',
            ],
            [
              'POS Agent Banking Engine',
              'Live Cash Now and Float Now are calculated dynamically from today’s opening balances, transaction deltas, and expenses.',
            ],
            [
              'Cash-Basis Laundry Ledger',
              'Laundry revenue counts actual cash/transfer payments received each day while tracking unpaid balances across all orders.',
            ],
            [
              'Granular V/A/E/D RBAC',
              'Owners have full access; Cashiers are governed per page by View, Add, Edit, and Delete toggles.',
            ],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <strong className="w-52 shrink-0">{title}</strong>
              <span className="text-slate-500 dark:text-slate-400 flex-1">
                {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
