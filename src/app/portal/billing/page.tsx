

import {TranslatedText} from '@/components/TranslatedText';
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
import FinanceCenterPhaseTwo from '@/components/phase2/FinanceCenterPhaseTwo';
import LabManagementPhaseTwo from '@/components/phase2/LabManagementPhaseTwo';

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
      <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-[#D8E0DC] text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#4169E1] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#102A5E]"><TranslatedText text="Billing Account Verification Pending" /></h2>
          <p className="text-xs text-[#526574] leading-relaxed"> <TranslatedText text="Your online account is not yet linked to an active clinical record. Please present your National ID to the receptionist during your visit to view your statements." /> </p>
          <Link
            href="/portal"
            className="inline-block px-5 py-2.5 bg-[#4169E1] hover:bg-[#2446A6] text-white rounded-xl text-xs font-bold transition-colors"
          > <TranslatedText text="Return to Portal" /> </Link>
        </div>
      </div>
    );
  }

  const [invoices, payments] = await Promise.all([
    getPatientInvoices(link.patientId),
    getPatientPayments(link.patientId),
  ]);

  const attempts=await db.paymentAttempt.findMany({where:{invoice:{patientId:link.patientId}},orderBy:{attemptedAt:'desc'}});
  const totalInvoiced = invoices.filter(i=>!['DRAFT','VOIDED'].includes(i.status)).reduce((sum, inv) => sum + inv.totalAmountPiasters, 0);
  const totalPaid = payments.filter(p=>p.status==='POSTED').reduce((sum, p) => sum + p.amountPiasters, 0);
  const totalBalanceDue = invoices.filter(i=>!['DRAFT','VOIDED'].includes(i.status)).reduce((sum,i)=>sum+i.totalAmountPiasters-i.paidAmountPiasters,0);

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {attempts.length>0&&<section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5"><h2 className="font-bold"><TranslatedText text="Payment attempts"/></h2><p className="text-sm text-slate-600"><TranslatedText text="Only successful posted payments reduce your balance."/></p>{attempts.map(a=><div key={a.id} className="flex flex-wrap items-center gap-3 mt-2 rounded-2xl border bg-white p-3.5"><span className={a.status==='FAILED'?'text-red-800 font-bold':'text-teal-800 font-bold'}><TranslatedText text={a.status==='FAILED'?'Failed — no money collected':a.status==='SUCCEEDED'?'Successful':'Pending'}/></span><span className="tabular-nums">EGP {(a.amountPiasters/100).toLocaleString()}</span><time>{a.attemptedAt.toISOString().slice(0,10)}</time></div>)}</section>}
      {/* Top Header */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bento-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="p-2.5 text-slate-600 hover:text-[#0B2528] hover:bg-[#F7F6F2] rounded-full transition-colors border border-slate-200/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-[#0B2528]"><TranslatedText text="Patient Billing & Receipts" /></h1>
              <p className="text-xs text-slate-500"> <TranslatedText text="Patient:" /> <span className="font-semibold text-[#0B2528]">{link.patient.fullName}</span> ({link.patient.patientNumber})
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F9F5EB] text-[#0B2528] border border-[#C8A96E]/40 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C8A96E]" />
            <span><TranslatedText text="Verified Patient Account" /></span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* PHASE 2 PATIENT BILLING & INSTALLMENTS SCHEDULE + LAB STATUS VIEW */}
        <FinanceCenterPhaseTwo role="patient" />
        <LabManagementPhaseTwo role="patient" />

        {/* Account Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-xs font-bold text-[#526574] uppercase tracking-wider block"> <TranslatedText text="Total Invoiced Procedures" /> </span>
            <div className="text-2xl font-extrabold text-[#102A5E] mt-1 tabular-nums">
              {(totalInvoiced / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#526574]"><TranslatedText text="EGP" /></span>
            </div>
            <span className="text-xs text-[#526574] mt-1 block">
              {invoices.length} <TranslatedText text="Invoices Issued" /> </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-xs font-bold text-[#4169E1] uppercase tracking-wider block"> <TranslatedText text="Total Payments Settled" /> </span>
            <div className="text-2xl font-extrabold text-[#4169E1] mt-1 tabular-nums">
              {(totalPaid / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#4169E1]"><TranslatedText text="EGP" /></span>
            </div>
            <span className="text-xs text-[#4169E1]/80 mt-1 block">
              {payments.length} <TranslatedText text="Receipts Reconciled" /> </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#D8E0DC] shadow-2xs">
            <span className="text-xs font-bold text-[#8A5300] uppercase tracking-wider block"> <TranslatedText text="Current Outstanding Balance" /> </span>
            <div className="text-2xl font-extrabold text-[#102A5E] mt-1 tabular-nums">
              {(totalBalanceDue / 100).toLocaleString()}{' '}
              <span className="text-xs font-semibold text-[#526574]"><TranslatedText text="EGP" /></span>
            </div>
            <span className="text-xs text-[#526574] mt-1 block">
              <TranslatedText text={String(totalBalanceDue === 0 ? 'All charges fully settled' : 'Payable at clinic desk or online sandbox')}/>
            </span>
          </div>
        </div>

        {/* Accepted Payment Channels Banner */}
        <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-[#4169E1]/20 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4169E1]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="font-semibold"> <TranslatedText text="Accepted Payment Channels: Cash (Front Desk) • Visa / Mastercard • InstaPay Direct" /> </span>
          </div>
          <span className="text-xs bg-white px-2.5 py-1 rounded-full font-bold shadow-2xs"> <TranslatedText text="EGP Minor Unit Accounting" /> </span>
        </div>

        {/* Issued Invoices */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D8E0DC] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#102A5E] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#4169E1]" />
              <span><TranslatedText text="Invoiced Dental Procedures & Receipts" /></span>
            </h3>
            <span className="text-xs font-semibold text-[#526574] px-3 py-1 rounded-full bg-[#F7FAFF] border border-[#D8E0DC]">
              {invoices.length} <TranslatedText text="invoices" /> </span>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#526574]"> <TranslatedText text="No treatment invoices have been generated for your record yet." /> </div>
          ) : (
            <div className="divide-y divide-[#E8ECE9]">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#F7FAFF]/60 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#102A5E] text-sm">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-[#EAF3FF] text-[#4169E1]'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <TranslatedText text={String(inv.status)}/>
                      </span>
                    </div>

                    <p className="text-xs text-[#526574] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#4169E1]" />
                      <span><TranslatedText text="Issued on" /> {new Date(inv.issuedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <Building2 className="w-3.5 h-3.5 text-[#4169E1]" />
                      <span><TranslatedText text={String(inv.branch?.name)}/></span>
                    </p>

                    <div className="space-y-1 pt-1">
                      {inv.lines?.map((line: any, idx: number) => (
                        <div key={idx} className="text-[#102A5E] text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4169E1]" />
                          <span><TranslatedText text={String(line.description)}/></span>
                          {line.toothNumber && (
                            <span className="font-bold text-[#4169E1]"> <TranslatedText text="(Tooth #" />{line.toothNumber})
                            </span>
                          )}
                          <span className="text-[#526574]">
                            — {(line.lineTotalPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-6 border-[#D8E0DC] space-y-1.5">
                    <span className="text-xs text-[#526574] block uppercase font-bold tracking-wider"> <TranslatedText text="Total Invoiced" /> </span>
                    <span className="text-lg font-extrabold text-[#102A5E] block tabular-nums">
                      {(inv.totalAmountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
                    <span className="text-xs text-[#4169E1] font-semibold block tabular-nums"> <TranslatedText text="Settled:" /> {(inv.paidAmountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
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
