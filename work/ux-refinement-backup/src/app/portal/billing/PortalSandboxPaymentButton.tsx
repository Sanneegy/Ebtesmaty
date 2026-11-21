'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PortalSandboxPaymentProps {
  patientId: string;
  invoiceId: string;
  invoiceNumber: string;
  branchId: string;
  remainingPiasters: number;
}

export function PortalSandboxPaymentButton({
  patientId,
  invoiceId,
  invoiceNumber,
  branchId,
  remainingPiasters,
}: PortalSandboxPaymentProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'CARD' | 'INSTAPAY'>('CARD');
  const [amountEgp, setAmountEgp] = useState<number>(Math.round(remainingPiasters / 100));
  const [loading, setLoading] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (remainingPiasters <= 0) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const piasters = Math.min(remainingPiasters, Math.round(amountEgp * 100));
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          collectionBranchId: branchId,
          amountPiasters: piasters,
          paymentMethod: method,
          idempotencyKey: `portal-sandbox-${invoiceId}-${Date.now()}`,
          invoiceAllocations: [{ invoiceId, amountPiasters: piasters }],
          notes: `[SANDBOX ONLINE PORTAL PAYMENT — ${method}] Settled by patient for ${invoiceNumber}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      setReceiptNo(data.payment?.receiptNumber || 'RCP-SANDBOX');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#176C5B] hover:bg-[#125648] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pay Online (Sandbox)</span>
        </button>
      ) : (
        <form
          onSubmit={handlePay}
          className="mt-3 p-4 rounded-2xl bg-[#F7F8F5] border border-[#176C5B]/30 text-left space-y-3 max-w-sm ml-auto"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#176C5B] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sandbox Online Payment Gateway</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          {receiptNo ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment posted! Receipt: {receiptNo}</span>
            </div>
          ) : (
            <>
              {error && <div className="text-[11px] text-red-600">{error}</div>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Amount (EGP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Math.round(remainingPiasters / 100)}
                    value={amountEgp}
                    onChange={(e) => setAmountEgp(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="CARD">Card (Sandbox)</option>
                    <option value="INSTAPAY">InstaPay (Sandbox)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" size="sm" fullWidth isLoading={loading}>
                Confirm Sandbox Payment ({amountEgp.toLocaleString()} EGP)
              </Button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
