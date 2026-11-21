import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPatientInvoices, getPatientPayments } from '@/services/billing.service';
import db from '@/lib/db';
import {
  Receipt,
  CreditCard,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  AlertCircle,
  Download,
  Calendar,
} from 'lucide-react';
import { PortalSandboxPaymentButton } from './PortalSandboxPaymentButton';

export default async function PortalBillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Find linked approved patient record
  const link = await db.portalPatientLink.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    include: { patient: true },
  });

  if (!link) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-[#D8E0DC] text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#123B67]">Billing Account Verification Pending</h2>
          <p className="text-xs text-[#526574] leading-relaxed">
            Your online account is not yet linked to an active clinical record. Please present your National ID to the receptionist during your visit to view your statements.
          </p>
          <Link
            href="/portal"
            className="inline-block px-5 py-2.5 bg-[#1F6FB2] hover:bg-[#13558C] text-white rounded-xl text-xs font-bold transition-colors"
          >
            Return to Portal
          </Link>
        </div>
      </div>
    );
  }

  const [invoices, payments] = await Promise.all([
    getPatientInvoices(link.patientId),
    getPatientPayments(link.patientId),
  ]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmountPiasters, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPiasters, 0);
  const totalBalanceDue = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div className="min-h-screen bg-[#F6F8FC] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-[#D8E0DC] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="p-2 text-[#526574] hover:text-[#123B67] hover:bg-[#EAF3FF] rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-[#123B67]">Patient Billing & Receipts</h1>
              <p className="text-xs text-[#526574]">
                Patient: <span className="font-semibold text-[#123B67]">{link.patient.fullName}</span> ({link.patient.patientNumber})
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Patient Account</span>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Account Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-[11px] font-bold text-[#526574] uppercase tracking-wider block">
              Total Invoiced Procedures
            </span>
            <div className="text-2xl font-extrabold text-[#123B67] mt-1 tabular-nums">
              {(totalInvoiced / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#526574]">EGP</span>
            </div>
            <span className="text-[11px] text-[#526574] mt-1 block">
              {invoices.length} Invoices Issued
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-[11px] font-bold text-[#1F6FB2] uppercase tracking-wider block">
              Total Payments Settled
            </span>
            <div className="text-2xl font-extrabold text-[#1F6FB2] mt-1 tabular-nums">
              {(totalPaid / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#1F6FB2]">EGP</span>
            </div>
            <span className="text-[11px] text-[#1F6FB2]/80 mt-1 block">
              {payments.length} Receipts Reconciled
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-[11px] font-bold text-[#F28C28] uppercase tracking-wider block">
              Current Outstanding Balance
            </span>
            <div className="text-2xl font-extrabold text-[#123B67] mt-1 tabular-nums">
              {(totalBalanceDue / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#526574]">EGP</span>
            </div>
            <span className="text-[11px] text-[#526574] mt-1 block">
              {totalBalanceDue === 0 ? 'All charges fully settled' : 'Payable at clinic desk or online sandbox'}
            </span>
          </div>
        </div>

        {/* Accepted Payment Channels Banner */}
        <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-[#1F6FB2]/20 flex flex-wrap items-center justify-between gap-3 text-xs text-[#1F6FB2]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              Accepted Payment Channels: Cash (Front Desk) • Visa / Mastercard • InstaPay Direct
            </span>
          </div>
          <span className="text-[11px] bg-white px-2.5 py-1 rounded-full font-bold shadow-2xs">
            EGP Minor Unit Accounting
          </span>
        </div>

        {/* Issued Invoices */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D8E0DC] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#123B67] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1F6FB2]" />
              <span>Invoiced Dental Procedures & Receipts</span>
            </h3>
            <span className="text-xs font-semibold text-[#526574] px-3 py-1 rounded-full bg-[#F6F8FC] border border-[#D8E0DC]">
              {invoices.length} invoices
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#526574]">
              No treatment invoices have been generated for your record yet.
            </div>
          ) : (
            <div className="divide-y divide-[#E8ECE9]">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#F6F8FC]/60 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#123B67] text-sm">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-[#EAF3FF] text-[#1F6FB2]'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#526574] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#1F6FB2]" />
                      <span>Issued on {new Date(inv.issuedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <Building2 className="w-3.5 h-3.5 text-[#1F6FB2]" />
                      <span>{inv.branch?.name}</span>
                    </p>

                    <div className="space-y-1 pt-1">
                      {inv.lines?.map((line: any, idx: number) => (
                        <div key={idx} className="text-[#123B67] text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FB2]" />
                          <span>{line.description}</span>
                          {line.toothNumber && (
                            <span className="font-bold text-[#1F6FB2]">
                              (Tooth #{line.toothNumber})
                            </span>
                          )}
                          <span className="text-[#526574]">
                            — {(line.lineTotalPiasters / 100).toLocaleString()} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-6 border-[#D8E0DC] space-y-1.5">
                    <span className="text-[10px] text-[#526574] block uppercase font-bold tracking-wider">
                      Total Invoiced
                    </span>
                    <span className="text-lg font-extrabold text-[#123B67] block tabular-nums">
                      {(inv.totalAmountPiasters / 100).toLocaleString()} EGP
                    </span>
                    <span className="text-xs text-[#1F6FB2] font-semibold block tabular-nums">
                      Settled: {(inv.paidAmountPiasters / 100).toLocaleString()} EGP
                    </span>
                    <div className="pt-2">
                      <PortalSandboxPaymentButton
                        patientId={link.patientId}
                        invoiceId={inv.id}
                        invoiceNumber={inv.invoiceNumber}
                        branchId={inv.branchId}
                        remainingPiasters={Math.max(
                          0,
                          inv.totalAmountPiasters - inv.paidAmountPiasters
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
