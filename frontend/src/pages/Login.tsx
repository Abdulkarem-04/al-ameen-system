import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Sun, Moon, Globe } from 'lucide-react';
import { loginApi, recoverOwnerPin } from '../services/api';
import { useAuthStore, useAmanaUI } from '../store/authStore';
import AmanaHQLogo from '../components/AmanaHQLogo';

export default function Login() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showRecovery, setShowRecovery] = useState(false);
  const [recCode, setRecCode] = useState('OWN001');
  const [recKey, setRecKey] = useState('');
  const [recNewPin, setRecNewPin] = useState('');
  const [recMsg, setRecMsg] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, lang, t, toggleTheme, toggleLang } = useAmanaUI();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || !pin.trim()) {
      setError('Please enter both your employee code and 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginApi(code.trim(), pin.trim());
      setAuth(data.token, data.session, data.tenant);
      if (data.session?.role === 'SuperAdmin') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecMsg('');
    try {
      await recoverOwnerPin(recCode, recKey, recNewPin);
      alert(
        'Owner PIN reset successfully! You can now sign in with your new PIN.',
      );
      setShowRecovery(false);
      setCode(recCode);
      setPin('');
    } catch (err: any) {
      setRecMsg(err.message || 'Recovery failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-slate-50 p-5 relative overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#38BDF8]/12 via-transparent to-transparent pointer-events-none" />

      {/* Top Utility Bar */}
      <div className="max-w-5xl w-full mx-auto flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <AmanaHQLogo size={32} />
          <span className="font-extrabold tracking-tight text-base">
            Amana<span className="text-[#0088FF] dark:text-[#38BDF8]">HQ</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#14171F] border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <Globe size={13} className="text-[#0088FF] dark:text-[#38BDF8]" />
            {lang === 'en' ? 'EN · Hausa' : 'Hausa · EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#14171F] border border-slate-200 dark:border-slate-800 text-xs font-bold"
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} />
            )}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[390px] mx-auto bg-white dark:bg-[#111318] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-8 shadow-2xl shadow-slate-950/10 relative z-10">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="mb-3">
            <AmanaHQLogo size={54} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#0088FF] dark:text-[#38BDF8] border border-[#38BDF8]/25 mb-2 flex items-center gap-1">
            <ShieldCheck size={11} /> AmanaHQ Cloud ERP
          </span>

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign in to AmanaHQ
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t(
              'Enter your workspace employee code and 4-digit PIN.',
              "Shiga da lambar ma'aikaci da PIN mai lamba 4.",
            )}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('Employee Code', "Lambar Ma'aikaci")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. OWN001 or CSH001"
              autoComplete="off"
              className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('4-Digit Security PIN', 'PIN mai Lamba 4')}
              </label>
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="text-[11px] font-bold text-[#0088FF] dark:text-[#38BDF8] hover:underline"
              >
                {t('Forgot PIN?', 'Ka manta PIN?')}
              </button>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-[0.6em] font-mono text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#0088FF] hover:bg-[#0284C7] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#0088FF]/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading
              ? 'Signing in...'
              : t('Sign In to Workspace →', 'Shiga Cikin Shago →')}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <AmanaHQLogo size={16} withContainer={false} />
            <span>
              Powered by{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                AmanaHQ
              </strong>
            </span>
          </span>
          <span className="font-mono">v2.0-Cloud</span>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 relative z-10">
        AmanaHQ · The Continuous Ribbon Covenant
      </div>

      {showRecovery && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#0088FF] dark:text-[#38BDF8] font-bold text-base mb-2">
              <KeyRound size={20} /> Owner PIN Recovery
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Cashiers should ask their Shop Owner to reset their PIN. Shop
              Owners can reset their PIN below using their 12-character{' '}
              <strong>AmanaHQ Master Recovery Key</strong>:
            </p>
            <form onSubmit={handleRecoverPin} className="space-y-3">
              <input
                required
                type="text"
                value={recCode}
                onChange={(e) => setRecCode(e.target.value)}
                placeholder="Owner Code (e.g. OWN001)"
                className="w-full p-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
              <input
                required
                type="text"
                value={recKey}
                onChange={(e) => setRecKey(e.target.value)}
                placeholder="Master Recovery Key"
                className="w-full p-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
              <input
                required
                type="password"
                maxLength={4}
                value={recNewPin}
                onChange={(e) => setRecNewPin(e.target.value)}
                placeholder="New 4-Digit PIN"
                className="w-full p-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
              {recMsg && (
                <div className="text-xs text-rose-500 font-bold">{recMsg}</div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0088FF] text-white rounded-xl text-xs font-bold"
                >
                  Reset PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
