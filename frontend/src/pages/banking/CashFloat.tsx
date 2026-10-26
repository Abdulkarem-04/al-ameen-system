import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Landmark,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getBankingFloatData,
  openBankingDay,
  closeBankingDay,
  reopenBankingDay,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function CashFloat() {
  const { session } = useAuthStore();
  const branchId = 'BR002';

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Open Day Form
  const [openingCash, setOpeningCash] = useState('');
  const [openingFloat, setOpeningFloat] = useState('');

  // Close Day Form
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => {
    fetchFloatData();
  }, []);

  const fetchFloatData = async () => {
    setIsLoading(true);
    try {
      const res = await getBankingFloatData(branchId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await openBankingDay({
        branchId,
        openingCash: parseFloat(openingCash) || 0,
        openingFloat: parseFloat(openingFloat) || 0,
        employeeName: session?.name || 'Owner',
      });
      fetchFloatData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash === '') return;
    if (
      !confirm(
        `Close today with counted cash ₦${Number(countedCash).toLocaleString()}? No new transactions can be recorded after closing.`,
      )
    ) {
      return;
    }
    try {
      await closeBankingDay({
        branchId,
        countedCash: parseFloat(countedCash),
        notes: closeNotes.trim(),
        employeeName: session?.name || 'Owner',
      });
      setCountedCash('');
      setCloseNotes('');
      fetchFloatData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReopenDay = async () => {
    if (
      !confirm(
        'Reopen today? The day-close lock will be removed so corrections can be made.',
      )
    )
      return;
    try {
      await reopenBankingDay(branchId);
      fetchFloatData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading Cash & Float status...
      </div>
    );
  }

  const { status, openHistory, closeHistory } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Cash & Float Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Open the day, monitor live physical cash vs. POS float, and
            reconcile at close.
          </p>
        </div>
        <button
          onClick={fetchFloatData}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refresh Balances
        </button>
      </div>

      {/* State 1: Day Not Opened Yet */}
      {!status.dayOpened ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-brand-banking max-w-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Open Today's Day
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Enter how much physical cash and POS terminal float balance you are
            starting the day with.
          </p>
          <form onSubmit={handleOpenDay} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Opening Cash (₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="e.g. 200000"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-brand-banking/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Opening Float (₦) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="e.g. 350000"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-brand-banking/50"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-brand-banking text-white rounded-xl font-bold hover:bg-blue-800 transition-colors"
            >
              Open Banking Day
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Live Cash Now & Float Now Gradient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl text-white bg-gradient-to-br from-[#0a7c3e] to-[#16a34a] shadow-lg shadow-green-900/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-85">
                  Physical Cash Now (In Drawer)
                </div>
                <div className="text-3xl font-black mt-2">
                  ₦{(status.cashNow || 0).toLocaleString()}
                </div>
                <div className="text-xs opacity-85 mt-2">
                  Opened with ₦{(status.openingCash || 0).toLocaleString()} •
                  Less ₦{(status.todayExpenses || 0).toLocaleString()} expenses
                </div>
              </div>
              <div className="p-4 bg-white/15 rounded-2xl">
                <Wallet size={32} />
              </div>
            </div>

            <div className="p-6 rounded-2xl text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] shadow-lg shadow-blue-900/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-85">
                  Digital Float Now (In POS Wallet)
                </div>
                <div className="text-3xl font-black mt-2">
                  ₦{(status.floatNow || 0).toLocaleString()}
                </div>
                <div className="text-xs opacity-85 mt-2">
                  Opened with ₦{(status.openingFloat || 0).toLocaleString()} •{' '}
                  {status.todayTransactionCount} successful tx(s) today
                </div>
              </div>
              <div className="p-4 bg-white/15 rounded-2xl">
                <Landmark size={32} />
              </div>
            </div>
          </div>

          {/* Close Day / Reopen Day Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {status.dayClosed ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Today's Banking Day is Closed
                    </h3>
                    <p className="text-xs text-gray-500">
                      Counted Cash:{' '}
                      <strong>
                        ₦
                        {Number(
                          status.closeDetails?.counted_cash || 0,
                        ).toLocaleString()}
                      </strong>{' '}
                      • Variance:{' '}
                      <strong
                        className={
                          Number(status.closeDetails?.variance) === 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        ₦
                        {Number(
                          status.closeDetails?.variance || 0,
                        ).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </div>
                {session?.role === 'Owner' && (
                  <button
                    onClick={handleReopenDay}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Unlock size={15} /> Reopen Today (Owner Only)
                  </button>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Close Today's Day (End-of-Day Reconciliation)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Count the physical cash in the drawer and enter it below.
                  Expected Cash Now is{' '}
                  <strong className="text-gray-900">
                    ₦{(status.cashNow || 0).toLocaleString()}
                  </strong>
                  .
                </p>
                <form
                  onSubmit={handleCloseDay}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Counted Physical Cash (₦) *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder={String(status.cashNow || 0)}
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-bold outline-none focus:bg-white focus:ring-2 focus:ring-brand-banking/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Balanced, or ₦500 short for fuel"
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                  >
                    Close Banking Day
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {/* History Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">
              Day-Open History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/50 uppercase font-bold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Opening Cash</th>
                  <th className="p-3.5">Opening Float</th>
                  <th className="p-3.5">Opened By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {openHistory.map((r: any) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-medium text-gray-900">
                      {r.tx_date}{' '}
                      <span className="text-gray-400">{r.tx_time}</span>
                    </td>
                    <td className="p-3.5 font-bold text-green-700">
                      ₦{Number(r.opening_cash).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-brand-banking">
                      ₦{Number(r.opening_float).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-gray-500">{r.opened_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">
              Day-Close & Variance History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/50 uppercase font-bold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Expected</th>
                  <th className="p-3.5">Counted</th>
                  <th className="p-3.5">Variance</th>
                  <th className="p-3.5">Closed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {closeHistory.map((r: any) => {
                  const v = Number(r.variance) || 0;
                  return (
                    <tr key={r.id}>
                      <td className="p-3.5 font-medium text-gray-900">
                        {r.tx_date}
                      </td>
                      <td className="p-3.5">
                        ₦{Number(r.expected_cash).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        ₦{Number(r.counted_cash).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${v === 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {v === 0 ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <AlertTriangle size={13} />
                          )}
                          ₦{v.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500">{r.closed_by}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
