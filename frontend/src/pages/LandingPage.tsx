import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Landmark,
  WashingMachine,
  ShieldCheck,
  WifiOff,
  Printer,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles,
  Smartphone,
  Activity,
  Lock,
  Zap,
} from 'lucide-react';
import AmanaHQLogo from '../components/AmanaHQLogo';
import { useAmanaUI } from '../store/authStore';

export default function LandingPage() {
  const { theme, toggleTheme } = useAmanaUI();

  // Interactive Mouse Parallax State for the Giant Hero Ribbon
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 24;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-slate-50 font-sans antialiased transition-colors overflow-x-hidden relative"
    >
      {/* Custom Keyframes for the Giant Ribbon Light-Stream & Levitation */}
      <style>{`
        @keyframes ribbonFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-14px) scale(1.02); }
        }
        @keyframes beamFlow {
          0% { stroke-dashoffset: 240; opacity: 0.2; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        .animate-ribbon-float {
          animation: ribbonFloat 7s ease-in-out infinite;
        }
        .animate-beam-flow {
          stroke-dasharray: 60 180;
          animation: beamFlow 4.5s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 6s ease-in-out infinite;
        }
      `}</style>

      {/* Architectural Grid Mesh Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Public Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-[#09090B]/75 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AmanaHQLogo size={34} />
            <span className="font-extrabold tracking-tight text-lg">
              Amana
              <span className="text-[#0088FF] dark:text-[#38BDF8]">HQ</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a
              href="#modules"
              className="hover:text-[#0088FF] transition-colors"
            >
              Modules
            </a>
            <a
              href="#architecture"
              className="hover:text-[#0088FF] transition-colors"
            >
              Architecture
            </a>
            <a
              href="#pricing"
              className="hover:text-[#0088FF] transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/design-preview"
              className="hover:text-[#0088FF] transition-colors"
            >
              Interactive Demo
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#14171F] border border-slate-200 dark:border-slate-800"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} />
              )}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088FF]/20 transition-all"
            >
              Sign In to Workspace <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ====================================================================
          HERO SECTION WITH GIANT INTERACTIVE ANIMATED Λ RIBBON MONOLITH
         ==================================================================== */}
      <section className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center overflow-visible">
        {/* GIANT INTERACTIVE BACKGROUND Λ MONOLITH */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-visible"
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Ambient Cyan/Blue Halo Behind the Giant Logo */}
          <div className="absolute w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full bg-gradient-to-tr from-[#0088FF]/20 via-[#38BDF8]/15 to-transparent blur-3xl animate-pulse-glow" />

          {/* Giant 580px Animated Isometric Ribbon SVG */}
          <div className="animate-ribbon-float relative flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-[380px] h-[380px] sm:w-[560px] sm:h-[560px] opacity-[0.14] dark:opacity-[0.22] select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="leftRibbonGrad"
                  x1="20"
                  y1="84"
                  x2="62"
                  y2="16"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#0088FF" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                <linearGradient
                  id="rightLegGrad"
                  x1="50"
                  y1="16"
                  x2="68"
                  y2="84"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient
                  id="laserBeam"
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Outer Wireframe Halo Geometry */}
              <circle
                cx="50"
                cy="52"
                r="44"
                stroke="#38BDF8"
                strokeWidth="0.25"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              <circle
                cx="50"
                cy="52"
                r="34"
                stroke="#0088FF"
                strokeWidth="0.2"
                opacity="0.35"
              />

              {/* Right Leg Shadow */}
              <path
                d="M 50 16 L 68 84 L 54 84 L 42 40 Z"
                fill="url(#rightLegGrad)"
              />

              {/* Left Ascending Ribbon */}
              <path
                d="M 20 84 L 50 16 L 62 16 L 34 84 Z"
                fill="url(#leftRibbonGrad)"
              />

              {/* Apex Fold */}
              <path d="M 44 26 L 50 16 L 62 16 L 56 26 Z" fill="#94A3B8" />

              {/* Animated Glowing Energy Beams Flowing Along the Ribbon Edges */}
              <path
                d="M 20 84 L 50 16 L 62 16 L 34 84 Z"
                stroke="url(#laserBeam)"
                strokeWidth="0.9"
                className="animate-beam-flow"
              />
              <path
                d="M 50 16 L 68 84 L 54 84 L 42 40 Z"
                stroke="#38BDF8"
                strokeWidth="0.6"
                className="animate-beam-flow"
                style={{ animationDelay: '2.2s' }}
              />
            </svg>
          </div>
        </div>

        {/* Floating Live Telemetry Pills (Desktop Ambience) */}
        <div
          className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#111318]/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-[11px] font-bold absolute left-6 top-24 z-10"
          style={{
            transform: `translate3d(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px, 0)`,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <Activity size={13} className="text-[#0088FF] dark:text-[#38BDF8]" />
          <span className="font-mono">Cloud D1 Atomic Sync · 0ms Cache</span>
        </div>

        <div
          className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#111318]/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-[11px] font-bold absolute right-8 top-32 z-10"
          style={{
            transform: `translate3d(${mousePos.x * 0.6}px, ${-mousePos.y * 0.4}px, 0)`,
          }}
        >
          <Lock size={13} className="text-emerald-500" />
          <span className="font-mono">Salted SHA-256 + V/A/E/D Matrix</span>
        </div>

        <div
          className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#111318]/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-[11px] font-bold absolute left-16 bottom-12 z-10"
          style={{
            transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.5}px, 0)`,
          }}
        >
          <Zap size={13} className="text-amber-500" />
          <span className="font-mono">Offline Outbox Queue · PWA Ready</span>
        </div>

        {/* Foreground Hero Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#111318]/90 backdrop-blur-md text-[#0088FF] dark:text-[#38BDF8] border border-[#38BDF8]/30 text-xs font-bold mb-7 shadow-sm">
            <Sparkles size={13} /> AmanaHQ Cloud ERP v2.0 · The Continuous
            Ribbon Covenant
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Run Your Store, POS & Service Business with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0088FF] via-[#38BDF8] to-[#0088FF]">
              Complete Trust.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed font-medium">
            Stop losing money to paper ledgers, uncounted stock, and slow
            spreadsheets. AmanaHQ gives you an instant, offline-capable POS,
            real-time inventory, agency banking float tracker, and staff
            permission matrix in one unified workspace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-9">
            <Link
              to="/login"
              className="px-7 py-4 rounded-2xl bg-[#0088FF] hover:bg-[#0284C7] text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-[#0088FF]/30 hover:scale-[1.02] transition-all"
            >
              Sign In to Workspace <ArrowRight size={16} />
            </Link>
            <Link
              to="/design-preview"
              className="px-7 py-4 rounded-2xl bg-white/90 dark:bg-[#111318]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 font-bold text-sm hover:border-[#38BDF8] transition-all"
            >
              Explore Interactive UI Studio
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Modular Business Suites */}
      <section
        id="modules"
        className="max-w-6xl mx-auto px-5 py-14 relative z-10"
      >
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0088FF] dark:text-[#38BDF8]">
            Modular B2B Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Subscribe Only to the Modules Your Business Needs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Store,
              title: 'Provision & Retail Store',
              desc: 'Sell by single unit or bulk carton, track live shelf stock & expiry batches, manage customer credit ledgers, process stock-restoring refunds, and reconcile drawer cash.',
              bullets: [
                'Unit & Bulk Carton POS',
                'Customer Debt & Credit Ledger',
                'Sales History, Reprints & Refunds',
                'Physical Drawer Cash Tracking',
              ],
            },
            {
              icon: Landmark,
              title: 'POS Agent Banking',
              desc: 'Built specifically for Opay, Moniepoint, and PalmPay agents. Automatically calculates live physical drawer cash vs. digital terminal float on every transaction.',
              bullets: [
                'Live Cash vs. Float Engine',
                'Deducted vs. Cash-on-Top Math',
                'End-of-Day Variance Lock',
                'Automatic Repeat Customer Ranking',
              ],
            },
            {
              icon: WashingMachine,
              title: 'Laundry & Dry Cleaning',
              desc: 'Itemized garment drop-off intake, configurable price list, stage-by-stage status pipeline, automatic overdue pickup alerts, and cash-basis payment ledger.',
              bullets: [
                'Multi-Garment Drop-Off Tags',
                'Dropped Off → Collected Pipeline',
                'Automatic Overdue Red Alerts',
                'Partial Deposit & Balance Ledger',
              ],
            },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-[#38BDF8]/60 hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#0088FF]/10 text-[#0088FF] dark:text-[#38BDF8] flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-extrabold mb-2">{mod.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                    {mod.desc}
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                  {mod.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-[#0088FF] dark:text-[#38BDF8] shrink-0"
                      />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architectural Advantages */}
      <section
        id="architecture"
        className="max-w-6xl mx-auto px-5 py-14 relative z-10"
      >
        <div className="bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-10">
          <div className="max-w-xl mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0088FF] dark:text-[#38BDF8]">
              Engineered for Reliability
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">
              Built for Real-World Shops, Phones & Unstable Networks
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            {[
              {
                icon: WifiOff,
                title: 'Offline Outbox Sync',
                text: 'Internet down? Keep ringing up sales and printing receipts. Transactions queue safely on the device and auto-sync when connection returns.',
              },
              {
                icon: ShieldCheck,
                title: 'V/A/E/D Staff Matrix',
                text: 'Control exactly what each cashier can View, Add, Edit, or Delete. Every action is recorded in a tamper-evident Audit Log.',
              },
              {
                icon: Printer,
                title: '80mm Thermal Receipts',
                text: 'Print crisp, custom-branded 80mm receipts with your shop logo, address, invoice prefix, and custom footer message.',
              },
              {
                icon: Smartphone,
                title: 'Installable PWA & Bilingual',
                text: 'Install directly to Android, iOS, or Desktop. Switch between English and Hausa or Light and Dark mode in one tap.',
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="space-y-2">
                  <div className="p-2.5 w-fit rounded-xl bg-slate-100 dark:bg-[#14171F] text-[#0088FF] dark:text-[#38BDF8]">
                    <Icon size={18} />
                  </div>
                  <h4 className="font-extrabold text-sm">{feat.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="max-w-5xl mx-auto px-5 py-14 relative z-10"
      >
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0088FF] dark:text-[#38BDF8]">
            Simple B2B Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Start With One Module or Run Your Entire Group
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">
                Single Business Module
              </span>
              <div className="text-3xl font-black mt-2">
                Single Module{' '}
                <span className="text-xs font-normal text-slate-400">
                  / Shop
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Perfect for a standalone Provision Store, POS Agent Stand, or
                Laundry Shop.
              </p>
              <div className="space-y-2.5 mt-6 text-xs font-medium">
                <div>✓ Choose 1 Module (Provision, POS, or Laundry)</div>
                <div>✓ Unlimited Products, Sales & Receipts</div>
                <div>✓ Staff Accounts & V/A/E/D Permission Matrix</div>
                <div>✓ Custom Shop Logo & Thermal Receipt Branding</div>
              </div>
            </div>
            <Link
              to="/login"
              className="mt-8 w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-center text-xs font-bold"
            >
              Get Started →
            </Link>
          </div>

          <div className="bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border-2 border-[#0088FF] rounded-2xl p-7 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-[#0088FF] text-white text-[10px] font-black uppercase">
              Full Multi-Business Suite
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-[#0088FF] dark:text-[#38BDF8]">
                All 3 Modules Unlocked
              </span>
              <div className="text-3xl font-black mt-2">
                Complete Suite{' '}
                <span className="text-xs font-normal text-slate-400">
                  / All-in-One
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                For entrepreneurs running Retail, POS Banking, and Laundry under
                one roof.
              </p>
              <div className="space-y-2.5 mt-6 text-xs font-medium">
                <div>✓ All 3 Modules (Provision + POS Banking + Laundry)</div>
                <div>✓ Unified Executive Home Summary</div>
                <div>✓ Offline Outbox Sync & CSV Accountant Exports</div>
                <div>✓ Priority Onboarding & Setup Support</div>
              </div>
            </div>
            <Link
              to="/login"
              className="mt-8 w-full py-3 rounded-xl bg-[#0088FF] hover:bg-[#0284C7] text-white text-center text-xs font-bold shadow-lg shadow-[#0088FF]/25"
            >
              Access Workspace →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-8 mt-12 relative z-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <AmanaHQLogo size={22} withContainer={false} />
            <span className="font-bold text-slate-700 dark:text-slate-200">
              AmanaHQ
            </span>
            <span>· The Continuous Ribbon Covenant</span>
          </div>
          <div>
            © {new Date().getFullYear()} AmanaHQ Cloud ERP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
