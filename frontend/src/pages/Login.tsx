import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || !pin) {
      setError('Please enter both your employee code and PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginApi(code, pin);
      setAuth(data.token, data.session);
      // If login is successful, go to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f5] p-5">
      <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] w-full max-w-[360px]">
        <h1 className="text-xl font-bold text-brand-provision mb-1">
          Al Ameen Business System
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in with your employee code and PIN.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-800 mb-1.5 font-medium">
              Employee Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. OWN001"
              autoComplete="off"
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-provision/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-800 mb-1.5 font-medium">
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-provision/50 text-center tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 p-3.5 bg-brand-provision text-white rounded-lg text-base font-bold cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>

          {error && (
            <div className="text-[#c0392b] text-sm mt-1 bg-[#fdecea] p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
        </form>

        <div className="text-center text-gray-400 text-xs mt-6">
          build 2026-10-15-local
        </div>
      </div>
    </div>
  );
}
