import { Printer, X, CheckCircle2 } from 'lucide-react';
import { useAmanaUI } from '../store/authStore';
import AmanaHQLogo from './AmanaHQLogo';

export interface ReceiptData {
  invoiceNumber: string;
  saleDate?: string;
  saleTime?: string;
  cashier?: string;
  customerName?: string;
  itemDetails: Array<{
    name: string;
    qty: number | string;
    tier?: string;
    unitPrice?: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  amountPaid: number;
  changeGiven: number;
  balance: number;
  paymentMethod: string;
  queuedOffline?: boolean;
}

export default function ThermalReceiptModal({
  receipt,
  heading = 'Sale Complete',
  onClose,
}: {
  receipt: ReceiptData;
  heading?: string;
  onClose: () => void;
}) {
  const { tenant, formatCurrency } = useAmanaUI();

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2 text-[#0088FF] dark:text-[#38BDF8] font-extrabold text-base">
            <CheckCircle2 size={20} /> {heading}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {receipt.queuedOffline && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold print:hidden">
            Saved in Offline Outbox — will auto-sync to Cloud D1 when internet
            returns.
          </div>
        )}

        {/* 80mm Printable Paper Surface (Always crisp black-on-white for thermal printers) */}
        <div className="bg-white text-slate-900 font-mono text-xs p-5 rounded-xl border border-slate-200 mx-auto shadow-inner">
          <div className="text-center space-y-0.5">
            {tenant.logoDataUrl ? (
              <img
                src={tenant.logoDataUrl}
                alt="Logo"
                className="max-h-14 max-w-[160px] object-contain mx-auto mb-1.5"
              />
            ) : (
              <div className="flex justify-center mb-1.5">
                <AmanaHQLogo size={34} withContainer={false} />
              </div>
            )}
            <div className="font-bold text-sm tracking-wide uppercase">
              {tenant.shopName || 'Al Ameen Provision Store'}
            </div>
            {tenant.address && (
              <div className="text-[11px] text-slate-500">{tenant.address}</div>
            )}
            {tenant.phone && (
              <div className="text-[11px] text-slate-500">
                Tel: {tenant.phone}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-3" />

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <strong>{receipt.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>
                {receipt.saleDate || new Date().toISOString().slice(0, 10)}{' '}
                {receipt.saleTime || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{receipt.cashier || 'Staff'}</span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span>{receipt.customerName}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-3" />

          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px]">
                <th className="text-left pb-1">Item</th>
                <th className="text-right pb-1">Qty</th>
                <th className="text-right pb-1">Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-slate-200">
              {receipt.itemDetails.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 pr-1">{item.name}</td>
                  <td className="text-right py-1.5 whitespace-nowrap">
                    x{item.qty} {item.tier ? `(${item.tier})` : ''}
                  </td>
                  <td className="text-right py-1.5 font-bold whitespace-nowrap pl-2">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-slate-400 my-3" />

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-sm font-bold border-b border-slate-200 pb-1 mb-1">
              <span>TOTAL</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid ({receipt.paymentMethod}):</span>
              <span>{formatCurrency(receipt.amountPaid)}</span>
            </div>
            {receipt.changeGiven > 0 && (
              <div className="flex justify-between font-bold">
                <span>Change Given:</span>
                <span>{formatCurrency(receipt.changeGiven)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Balance Owed:</span>
              <span>{formatCurrency(receipt.balance)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-400 my-3" />

          <div className="text-center text-[10px] text-slate-500 space-y-1">
            <div>{tenant.receiptFooter || 'Thank you for your patronage!'}</div>
            <div className="font-bold text-slate-400 pt-1">
              Powered by AmanaHQ
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#0088FF] hover:bg-[#0284C7] text-white rounded-xl font-bold text-xs"
          >
            Done / New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
