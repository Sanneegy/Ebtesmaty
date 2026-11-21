'use client';
import {InsightChart} from '../management/InsightChart';
import {LocalizedInput,LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Filter, 
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { 
  DonutBreakdownChart, 
  AgingBalancesChart, 
  SplineCashflowChart,
  DonutSlice, 
  AgingBucket,
  SplinePoint
} from '@/components/charts/InteractiveCharts';
import FinanceCenterPhaseTwo from '@/components/phase2/FinanceCenterPhaseTwo';
import ProfitabilityPhaseTwo from '@/components/phase2/ProfitabilityPhaseTwo';

interface Props {
  currentUser: any;
  branches: any[];
  serviceCatalog: any[];
  initialSummary: any;
  initialPatients: any[];
}

export function BillingDeskClient({
  currentUser,
  branches,
  serviceCatalog,
  initialSummary,
  initialPatients,
}: Props) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const modeParam = searchParams.get('mode');
  const queryPatientId = searchParams.get('patientId');
  const isCheckoutMode = modeParam === 'checkout' || !currentUser.roleGrants.some((g:any)=>['FINANCE','OWNER_ADMIN'].includes(g.role));
  const paymentKey=useRef<string>('');
  const [paymentError,setPaymentError]=useState('');

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'reconciliation' | 'expenses'>('invoices');
  const [summary, setSummary] = useState(initialSummary);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Invoice form state
  const [invoicePatientId, setInvoicePatientId] = useState(queryPatientId || initialPatients[0]?.id || '');
  const [invoiceLines, setInvoiceLines] = useState<Array<{ serviceItemId: string; description: string; toothNumber: string; unitPriceEgp: number; quantity: number }>>([
    { serviceItemId: serviceCatalog[0]?.id || '', description: serviceCatalog[0]?.nameEn || 'Consultation', toothNumber: '', unitPriceEgp: (serviceCatalog[0]?.basePricePiasters || 30000) / 100, quantity: 1 }
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Payment form state
  const [payInvoice,setPayInvoice]=useState(''),[openBills,setOpenBills]=useState<any[]>([]),[receipt,setReceipt]=useState<any>(null);
  const [payPatientId, setPayPatientId] = useState(queryPatientId || initialPatients[0]?.id || '');

  useEffect(() => {
    if(isCheckoutMode && (viewParam==='expenses'||viewParam==='reconciliation'))return;
    if (viewParam === 'payments') setActiveTab('payments');
    else if (viewParam === 'reconciliation') setActiveTab('reconciliation');
    else if (viewParam === 'expenses') setActiveTab('expenses');
    else setActiveTab('invoices');
  }, [viewParam]);

  useEffect(() => {
    if (queryPatientId) {
      setPayPatientId(queryPatientId);
      setInvoicePatientId(queryPatientId);
    }
  }, [queryPatientId]);
  const [payAmountEgp, setPayAmountEgp] = useState<number>(300);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CREDIT_CARD' | 'INSTAPAY' | 'FAWRY'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Reconciliation form state
  const [countedCashEgp, setCountedCashEgp] = useState<number>(0);
  const [reconNotes, setReconNotes] = useState('');
  const [savingRecon, setSavingRecon] = useState(false);

  // Expense form state
  const [expCategory, setExpCategory] = useState<'SUPPLIES' | 'MAINTENANCE' | 'UTILITIES' | 'RENT' | 'LAB_FEES' | 'OTHER'>('SUPPLIES');
  const [expPayee, setExpPayee] = useState('');
  const [expAmountEgp, setExpAmountEgp] = useState<number>(150);
  const [expNotes, setExpNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Chart data calculations
  const paymentMethodSlices: DonutSlice[] = useMemo(() => {
    const byMethod = summary?.collectedByMethod || {};
    return [
      { id: 'CASH', label: 'Cash (Physical)', value: (byMethod.CASH || 0) / 100, color: '#4169E1', formattedValue: `${((byMethod.CASH || 0) / 100).toLocaleString()} EGP` },
      { id: 'CREDIT_CARD', label: 'Credit / Debit Card', value: (byMethod.CREDIT_CARD || 0) / 100, color: '#102A5E', formattedValue: `${((byMethod.CREDIT_CARD || 0) / 100).toLocaleString()} EGP` },
      { id: 'INSTAPAY', label: 'InstaPay (Instant)', value: (byMethod.INSTAPAY || 0) / 100, color: '#0A4D8C', formattedValue: `${((byMethod.INSTAPAY || 0) / 100).toLocaleString()} EGP` },
      { id: 'FAWRY', label: 'Fawry Network', value: (byMethod.FAWRY || 0) / 100, color: '#D58B57', formattedValue: `${((byMethod.FAWRY || 0) / 100).toLocaleString()} EGP` },
    ];
  }, [summary]);

  const totalCollections = useMemo(() => {
    return paymentMethodSlices.reduce((acc, s) => acc + s.value, 0);
  }, [paymentMethodSlices]);

  const agingBuckets: AgingBucket[] = useMemo(() => {
    const now = new Date().getTime();
    let b0_30 = 0, c0_30 = 0;
    let b31_60 = 0, c31_60 = 0;
    let b61_90 = 0, c61_90 = 0;

    for (const inv of invoices) {
      if(['VOIDED','DRAFT'].includes(inv.status))continue;
      const balance = (inv.totalAmountPiasters-inv.paidAmountPiasters)/100;
      if (balance <= 0) continue;
      const invDate = new Date(inv.issuedAt).getTime();
      const days = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      if (days <= 30) {
        b0_30 += balance;
        c0_30 += 1;
      } else if (days <= 60) {
        b31_60 += balance;
        c31_60 += 1;
      } else {
        b61_90 += balance;
        c61_90 += 1;
      }
    }

    return [
      { bucket: '0–30 days since issue', amountEgp: b0_30, invoiceCount: c0_30, severity: 'normal' },
      { bucket: '31–60 days since issue', amountEgp: b31_60, invoiceCount: c31_60, severity: 'warning' },
      { bucket: '61–90+ Days (Delinquent)', amountEgp: b61_90, invoiceCount: c61_90, severity: 'critical' },
    ];
  }, [invoices]);

  const cashflowSplinePoints: SplinePoint[] = useMemo(() => {
    return summary?.monthlyCollections||[];
  }, [summary]);

  useEffect(() => {
    fetchTabData();
  }, [selectedBranchId, activeTab, viewParam]);

  async function fetchTabData() {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const res = await fetch(`/api/billing/invoices?branchId=${selectedBranchId}&balances=${viewParam==="balances"?1:0}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } else if (activeTab === 'payments') {
        const res = await fetch(`/api/billing/payments?branchId=${selectedBranchId}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } else if (activeTab === 'expenses') {
        const res = await fetch(`/api/billing/expenses?branchId=${selectedBranchId}`);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.expenses || []);
        }
      }

      // Also refresh financial summary
      const sumRes = await fetch(`/api/billing/analytics?branchId=${selectedBranchId}`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.financialSummary);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{if(!showPaymentModal)return;let active=true;setOpenBills([]);setPayInvoice('');fetch('/api/billing/invoices?'+new URLSearchParams({branchId:selectedBranchId,patientId:payPatientId})).then(async r=>{if(!r.ok)throw Error('Could not load invoices');return r.json()}).then(d=>{if(active)setOpenBills(d.invoices.filter((i:any)=>['ISSUED','PARTIALLY_PAID'].includes(i.status)&&i.totalAmountPiasters>i.paidAmountPiasters))}).catch(e=>{if(active)setPaymentError(e.message)});return()=>{active=false}},[showPaymentModal,payPatientId,selectedBranchId]);
  // Handle Invoice Creation
  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSavingInvoice(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: invoicePatientId,
          branchId: selectedBranchId,
          notes: invoiceNotes,
          lines: invoiceLines.map((l) => ({
            serviceItemId: l.serviceItemId === "OTHER" ? null : l.serviceItemId || null,
            description: l.description,
            toothNumber: l.toothNumber || null,
            unitPricePiasters: Math.round(l.unitPriceEgp * 100),
            quantity: l.quantity,
          })),
        }),
      });

      if(!res.ok){const problem=await res.json();throw Error(problem.error||'Could not issue invoice')}
      if (res.ok) {
        setShowInvoiceModal(false);
        setInvoiceNotes('');
        await fetchTabData();
      }
    } catch (err) {
      setPaymentError(err instanceof Error?err.message:'Could not complete this action.');
    } finally {
      setSavingInvoice(false);
    }
  }

  // Handle Payment Collection
  async function handleCollectPayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    setPaymentError('');
    if(!paymentKey.current)paymentKey.current=crypto.randomUUID();
    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: payPatientId,
          collectionBranchId: selectedBranchId,
          amountPiasters: Math.round(payAmountEgp * 100),
          paymentMethod: payMethod,
          idempotencyKey: paymentKey.current,invoiceAllocations:[{invoiceId:payInvoice,amountPiasters:Math.round(payAmountEgp*100)}],
          notes: payNotes,
        }),
      });

      if (!res.ok) {const d=await res.json();setPaymentError(d.error||"Could not save payment.");}
      if (res.ok) {
        const saved=await res.json();setReceipt(saved.payment);paymentKey.current="";
        setShowPaymentModal(false);
        setPayNotes('');
        await fetchTabData();
      }
    } catch (err) {
      setPaymentError(err instanceof Error?err.message:'Could not complete this action.');
    } finally {
      setSavingPayment(false);
    }
  }

  // Handle Reconciliation
  async function handleReconciliation(e: React.FormEvent) {
    e.preventDefault();
    setSavingRecon(true);
    try {
      const res = await fetch('/api/billing/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          countedCashPiasters: Math.round(countedCashEgp * 100),
          notes: reconNotes,
        }),
      });

      if (res.ok) {
        setShowReconcileModal(false);
        setReconNotes('');
        await fetchTabData();
      }
    } catch (err) {
      setPaymentError(err instanceof Error?err.message:'Could not complete this action.');
    } finally {
      setSavingRecon(false);
    }
  }

  // Handle Expense Recording
  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    setSavingExpense(true);
    try {
      const res = await fetch('/api/billing/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          category: expCategory,
          payee: expPayee,
          amountPiasters: Math.round(expAmountEgp * 100),
          notes: expNotes,
        }),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpPayee('');
        setExpNotes('');
        await fetchTabData();
      }
    } catch (err) {
      setPaymentError(err instanceof Error?err.message:'Could not complete this action.');
    } finally {
      setSavingExpense(false);
    }
  }

  return (
    <div className="eb-role-page eb-finance min-h-screen pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {paymentError && <p role="alert" className="p-4 text-red-800">{paymentError}</p>}
      {receipt&&<section role="status" className="surface-card max-w-xl mx-auto"><h2><TranslatedText text="Payment receipt"/></h2><strong>{receipt.receiptNumber}</strong><p>{receipt.paymentMethod} · EGP {receipt.amountPiasters/100}</p><p>{new Date(receipt.collectedAt).toLocaleString()}</p><button onClick={()=>setReceipt(null)} className="secondary-button"><TranslatedText text="Close"/></button></section>}
      {/* 1. TOP HEADER — frosted glass over background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <FinanceCenterPhaseTwo role={isCheckoutMode ? 'receptionist' : 'clinic_owner'} />
        <ProfitabilityPhaseTwo role={isCheckoutMode ? 'receptionist' : 'clinic_owner'} />
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
                <span><TranslatedText text={String(isCheckoutMode ? 'RECEPTION CHECKOUT & CASHIER' : 'FINANCIAL LEDGER & CASHFLOW')}/></span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text={isCheckoutMode?'Checkout & Receipts':viewParam==='balances'?'Balances & Installments':activeTab==='payments'?'Payment Recording':activeTab==='reconciliation'?'Cash Reconciliation':activeTab==='expenses'?'Expenses & Finance Reports':'Invoices'}/> </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl"> <TranslatedText text="Invoices · Payments · Reconciliation" /> </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Branch Switcher Pill */}
              <div className="p-1 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="text-xs font-bold rounded-xl border-none bg-transparent px-3 py-1.5 text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}><TranslatedText text={String(b.name)}/> ({b.code})</option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
              >
                <CreditCard className="w-4 h-4 text-[#2446A6]" />
                <span><TranslatedText text="Collect Payment" /></span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold bg-[#2446A6] hover:bg-[#0c6b65] text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span><TranslatedText text="Issue Invoice" /></span>
              </Button>
            </div>
          </div>
        </div>

        {activeTab==='expenses' && !isCheckoutMode && <>{/* 2. FINANCIAL KPIS — color-coded, minimal, click-to-expand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Good — total invoiced */}
          <div
            className="bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setExpandedKpi(expandedKpi === 'invoiced' ? null : 'invoiced')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider"><TranslatedText text="Total Invoiced" /></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {((summary?.totalInvoicedPiasters || 0) / 100).toLocaleString()} <span className="text-xs font-bold text-slate-400"><TranslatedText text="EGP" /></span>
            </div>
            <p className="text-xs text-slate-400">{summary?.invoiceCount || 0} <TranslatedText text="bills • Click for details" /></p>
            {expandedKpi === 'invoiced' && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500"><TranslatedText text="Avg Invoice Value" /></span>
                  <span className="font-bold text-slate-800 tabular-nums">{summary?.invoiceCount ? Math.round((summary.totalInvoicedPiasters || 0) / summary.invoiceCount / 100).toLocaleString() : 0} <TranslatedText text="EGP" /></span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500"><TranslatedText text="Collection Rate" /></span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {summary?.totalInvoicedPiasters ? Math.round(((summary.collectedByMethod?.CASH || 0) + (summary.collectedByMethod?.CREDIT_CARD || 0) + (summary.collectedByMethod?.INSTAPAY || 0) + (summary.collectedByMethod?.FAWRY || 0)) / summary.totalInvoicedPiasters * 100) : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Good — cash collected */}
          <div
            className="bg-[#EBF9F1]/90 backdrop-blur-md p-5 rounded-[24px] border border-emerald-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setExpandedKpi(expandedKpi === 'cash' ? null : 'cash')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider"><TranslatedText text="Cash Drawer" /></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-900 tabular-nums">
              {((summary?.todayCashPiasters || 0) / 100).toLocaleString()} <span className="text-xs font-bold text-emerald-600"><TranslatedText text="EGP" /></span>
            </div>
            <p className="text-xs text-emerald-700"><TranslatedText text="Physical cash · Click details" /></p>
            {expandedKpi === 'cash' && (
              <div className="pt-3 border-t border-emerald-200 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="text-xs text-emerald-800 font-semibold"><TranslatedText text="Current session cash total at" /> <TranslatedText text={String(branches.find(b => b.id === selectedBranchId)?.name)}/></div>
                <div className="text-xs text-emerald-700"><TranslatedText text="Reconcile against physical drawer count." /></div>
              </div>
            )}
          </div>

          {/* Good — digital payments */}
          <div
            className="bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setExpandedKpi(expandedKpi === 'digital' ? null : 'digital')}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider"><TranslatedText text="Digital & POS" /></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-blue-900 tabular-nums">
              {(((summary?.collectedByMethod?.CREDIT_CARD || 0) + (summary?.collectedByMethod?.INSTAPAY || 0) + (summary?.collectedByMethod?.FAWRY || 0)) / 100).toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-400"><TranslatedText text="EGP" /></span>
            </div>
            <p className="text-xs text-slate-400"><TranslatedText text="Digital payments · Click details" /></p>
            {expandedKpi === 'digital' && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="flex justify-between text-xs"><span className="text-slate-500"><TranslatedText text="Credit/Debit Card" /></span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.CREDIT_CARD || 0) / 100).toLocaleString()} <TranslatedText text="EGP" /></span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500"><TranslatedText text="InstaPay" /></span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.INSTAPAY || 0) / 100).toLocaleString()} <TranslatedText text="EGP" /></span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500"><TranslatedText text="Fawry" /></span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.FAWRY || 0) / 100).toLocaleString()} <TranslatedText text="EGP" /></span></div>
              </div>
            )}
          </div>

          {/* Emergent/Stand-by — expenses */}
          {(() => {
            const expenses = (summary?.totalExpensesPiasters || 0) / 100;
            const income = (((summary?.collectedByMethod?.CASH || 0) + (summary?.collectedByMethod?.CREDIT_CARD || 0) + (summary?.collectedByMethod?.INSTAPAY || 0) + (summary?.collectedByMethod?.FAWRY || 0)) / 100);
            const ratio = income > 0 ? expenses / income : 0;
            const isEmergent = ratio > 0.7;
            const isStandby = ratio > 0.4 && !isEmergent;
            return (
              <div
                className={`backdrop-blur-md p-5 rounded-[24px] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow border ${isEmergent ? 'bg-[#FEE2E2]/90 border-red-300' : isStandby ? 'bg-[#FEF9C3]/90 border-amber-300' : 'bg-white/95 border-slate-100'}`}
                onClick={() => setExpandedKpi(expandedKpi === 'expenses' ? null : 'expenses')}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isEmergent ? 'text-red-700' : isStandby ? 'text-amber-700' : 'text-rose-600'}`}><TranslatedText text="Operating Expenses" /></span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isEmergent ? 'bg-red-500' : isStandby ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div className={`text-2xl font-black tabular-nums ${isEmergent ? 'text-red-900' : isStandby ? 'text-amber-900' : 'text-rose-900'}`}>
                  {expenses.toLocaleString()} <span className="text-xs font-bold text-slate-400"><TranslatedText text="EGP" /></span>
                </div>
                <p className="text-xs text-slate-400"><TranslatedText text="Operating costs · Click details" /></p>
                {expandedKpi === 'expenses' && (
                  <div className="pt-3 border-t border-slate-200 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                    <div className="flex justify-between text-xs"><span className="text-slate-600"><TranslatedText text="Expense/Income Ratio" /></span><span className={`font-bold tabular-nums ${isEmergent ? 'text-red-700' : isStandby ? 'text-amber-700' : 'text-emerald-700'}`}>{Math.round(ratio * 100)}%</span></div>
                    {isEmergent && <p className="text-xs text-red-700 font-semibold"><TranslatedText text="Expenses exceed normal ratio." /></p>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 3. REVENUE SPLINE CHART & CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <SplineCashflowChart
              title="Revenue Trend & Realized Collections"
              subtitle="Monthly receipts and collections trajectory"
              data={cashflowSplinePoints}
              kpiValue={`${totalCollections.toLocaleString()} EGP`}
              kpiBadge="Realized Collections"
              currency="EGP"
            />
          </div>

          <div className="lg:col-span-5">
            <DonutBreakdownChart
              title="Payment Channel Distribution"
              subtitle="Physical cash vs electronic channels"
              centerLabel="Total Cash"
              centerValue={`${totalCollections.toLocaleString()} EGP`}
              slices={paymentMethodSlices}
              unitSuffix="EGP"
            />
          </div>
        </div>

        </>}
        {activeTab==='payments'&&<InsightChart mode="pie" title="Payment methods · EGP" empty="No posted payments for this selection" rows={paymentMethodSlices.map(slice=>({label:slice.label,value:slice.value}))}/>}
        {/* Aging Balances Chart */}
        {viewParam==='balances' && <><AgingBalancesChart buckets={agingBuckets} /><section className="bg-white rounded-2xl border p-5"><h2 className="font-bold text-xl"><TranslatedText text="Installment schedule"/></h2>{!invoices.some(i=>i.installmentPlans?.length>0)&&<p className="mt-3"><TranslatedText text="No installment plans for this branch."/></p>}{invoices.flatMap(i=>(i.installmentPlans||[]).map((plan:any)=><details key={plan.id} className="border-b py-3"><summary className="cursor-pointer font-semibold">{i.patient.fullName} · {i.invoiceNumber}</summary><ul>{plan.installments.map((s:any)=><li key={s.id} className="py-2 flex flex-wrap justify-between gap-2 tabular-nums"><time>{s.dueDate.slice(0,10)}</time><span>{(s.amountPiasters/100).toFixed(2)} EGP</span><TranslatedText text={s.status}/></li>)}</ul></details>))}</section></>}

        {/* 4. TABS & DATA ACTIONS */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'invoices'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span><TranslatedText text="Invoices (" />{invoices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span><TranslatedText text="Payments &amp; Receipts (" />{payments.length})</span>
              </button>
              {!isCheckoutMode && <><button
                onClick={() => setActiveTab('reconciliation')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'reconciliation'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span><TranslatedText text="Drawer Reconciliation" /></span>
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'expenses'
                    ? 'bg-[#2446A6] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span><TranslatedText text="Operating Expenses (" />{expenses.length})</span>
              </button></>}
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'reconciliation' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowReconcileModal(true)}
                  className="rounded-full bg-[#2446A6] hover:bg-[#0c6b65] text-white text-xs font-bold px-4 py-2"
                > <TranslatedText text="+ End-of-Day Drawer Count" /> </Button>
              )}
              {activeTab === 'expenses' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowExpenseModal(true)}
                  className="rounded-full bg-[#2446A6] hover:bg-[#0c6b65] text-white text-xs font-bold px-4 py-2"
                > <TranslatedText text="+ Record Expense" /> </Button>
              )}
              <button
                onClick={fetchTabData}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900"><TranslatedText text="Issued Patient Invoices" /></h3>
              <span className="text-xs text-slate-500">{invoices.length} <TranslatedText text="invoices on record" /></span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400"> <TranslatedText text="No invoices recorded yet." /> </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5"><TranslatedText text="Invoice #" /></th>
                      <th className="p-3.5"><TranslatedText text="Patient" /></th>
                      <th className="p-3.5"><TranslatedText text="Issued Date" /></th>
                      <th className="p-3.5"><TranslatedText text="Lines" /></th>
                      <th className="p-3.5"><TranslatedText text="Total Amount" /></th>
                      <th className="p-3.5"><TranslatedText text="Paid Amount" /></th>
                      <th className="p-3.5"><TranslatedText text="Status" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.filter(inv=>viewParam!=='balances'||(!['VOIDED','DRAFT'].includes(inv.status)&&inv.totalAmountPiasters>inv.paidAmountPiasters)).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                        <td className="p-3.5">
                          <span className="font-bold block text-slate-900">{inv.patient?.fullName}</span>
                          <span className="font-mono text-xs text-slate-400">{inv.patient?.patientNumber}</span>
                        </td>
                        <td className="p-3.5 text-slate-500">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                        <td className="p-3.5">
                          {inv.lines?.map((l: any, i: number) => (
                            <span key={i} className="block text-xs text-slate-600">
                              • <TranslatedText text={String(l.description)}/> ({l.quantity}x)
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {(inv.totalAmountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </td>
                        <td className="p-3.5 font-medium text-teal-700">
                          {(inv.paidAmountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </td>
                        <td className="p-3.5">
                          <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'info' : 'neutral'}>
                            <TranslatedText text={String(inv.status)}/>
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900"><TranslatedText text="Cashier Payment Collections & Receipts" /></h3>
              <span className="text-xs text-slate-500">{payments.length} <TranslatedText text="posted payments" /></span>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400"> <TranslatedText text="No payments recorded yet." /> </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5"><TranslatedText text="Receipt #" /></th>
                      <th className="p-3.5"><TranslatedText text="Patient" /></th>
                      <th className="p-3.5"><TranslatedText text="Date & Time" /></th>
                      <th className="p-3.5"><TranslatedText text="Method" /></th>
                      <th className="p-3.5"><TranslatedText text="Amount Collected" /></th>
                      <th className="p-3.5"><TranslatedText text="Status" /></th>
                      <th className="p-3.5"><TranslatedText text="Cashier" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-800"><button className="underline" onClick={()=>setReceipt(p)}>{p.receiptNumber}</button></td>
                        <td className="p-3.5 font-bold text-slate-900">{p.patient?.fullName}</td>
                        <td className="p-3.5 text-slate-500">{new Date(p.collectedAt).toLocaleString()}</td>
                        <td className="p-3.5">
                          <Badge variant={'neutral'}>
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          {(p.amountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </td>
                        <td className="p-3.5">
                          <Badge variant="success"><TranslatedText text={String(p.status)}/></Badge>
                        </td>
                        <td className="p-3.5 text-slate-600">{p.collectedByUser?.fullName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cash Drawer Reconciliation */}
        {activeTab === 'reconciliation' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Cash Drawer Reconciliation" /></h3>
                <p className="text-xs text-slate-500"><TranslatedText text="Reconcile physical cash counts." /></p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block"><TranslatedText text="System Expected Cash:" /></span>
                <span className="text-xl font-bold text-teal-800">
                  {((summary?.collectedByMethod?.CASH || 0) / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
                <p className="text-xs text-teal-700 mt-1"> <TranslatedText text="Cash receipts processed today." /> </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Operating Expenses */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900"><TranslatedText text="Branch Operating Expenses Register" /></h3>
              <span className="text-xs text-slate-500">{expenses.length} <TranslatedText text="expenses recorded" /></span>
            </div>

            {expenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400"> <TranslatedText text="No operating expenses logged." /> </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5"><TranslatedText text="Date" /></th>
                      <th className="p-3.5"><TranslatedText text="Category" /></th>
                      <th className="p-3.5"><TranslatedText text="Payee / Vendor" /></th>
                      <th className="p-3.5"><TranslatedText text="Amount" /></th>
                      <th className="p-3.5"><TranslatedText text="Notes" /></th>
                      <th className="p-3.5"><TranslatedText text="Recorded By" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 text-slate-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                        <td className="p-3.5">
                          <Badge variant="neutral">{exp.category}</Badge>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{exp.payee}</td>
                        <td className="p-3.5 font-bold text-rose-700">
                          {(exp.amountPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </td>
                        <td className="p-3.5 text-slate-500 italic">{exp.notes || '—'}</td>
                        <td className="p-3.5 text-slate-600">{exp.createdByUser?.fullName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* MODAL 1: Issue Invoice */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Issue New Patient Invoice" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Add catalog service lines." /></p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Select Patient *" /></label>
                <select
                  value={invoicePatientId}
                  onChange={(e) => setInvoicePatientId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  {initialPatients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Invoice Line Items" /></label>
                <div className="space-y-2">
                  {invoiceLines.map((line, idx) => (
                    <div key={idx} className="flex flex-wrap gap-2 items-center">
                      <select
                        value={line.serviceItemId}
                        onChange={(e) => {
                          const item = serviceCatalog.find(c => c.id === e.target.value);
                          const updated = [...invoiceLines];
                          updated[idx].serviceItemId = e.target.value;
                          if (!item) { updated[idx] = { ...line, serviceItemId: "OTHER", description: "", unitPriceEgp: 0 }; }
                          if (item) {
                            updated[idx].description = item.nameEn;
                            updated[idx].unitPriceEgp = item.basePricePiasters / 100;
                          }
                          setInvoiceLines(updated);
                        }}
                        className="flex-1 text-xs rounded-xl border border-slate-200 p-2"
                      >
                        <option value="OTHER"><TranslatedText text="Other bill type" /></option>
                        {serviceCatalog.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.nameEn} ({(cat.basePricePiasters / 100)} <TranslatedText text="EGP)" /></option>
                        ))}
                      </select>
                      {line.serviceItemId === "OTHER" && <label className="w-full"><TranslatedText text="Bill type" /><input className="field" required maxLength={180} value={line.description} onChange={e=>setInvoiceLines(lines=>lines.map((row,i)=>i===idx?{...row,description:e.target.value}:row))}/></label>}
                      <LocalizedInput
                        type="number"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => {
                          const updated = [...invoiceLines];
                          updated[idx].quantity = Number(e.target.value) || 1;
                          setInvoiceLines(updated);
                        }}
                        className="w-16 text-xs rounded-xl border border-slate-200 p-2"
                      />
                      <LocalizedInput
                        type="number"
                        placeholder="Price (EGP)"
                        value={line.unitPriceEgp}
                        onChange={(e) => {
                          const updated = [...invoiceLines];
                          updated[idx].unitPriceEgp = Number(e.target.value) || 0;
                          setInvoiceLines(updated);
                        }}
                        className="w-24 text-xs rounded-xl border border-slate-200 p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Invoice Notes" /></label>
                <LocalizedInput
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Approved discount note..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInvoiceModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingInvoice}> <TranslatedText text="Issue Invoice" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Collect Patient Payment" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Post receipt to ledger." /></p>

            <form onSubmit={handleCollectPayment} className="space-y-4">{paymentError&&<p role="alert">{paymentError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Patient *" /></label>
                <select
                  value={payPatientId}
                  onChange={(e) => setPayPatientId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  {initialPatients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Invoice to pay" /></label><select className="field" required value={payInvoice} onChange={e=>{setPayInvoice(e.target.value);const chosen=openBills.find(i=>i.id===e.target.value);if(chosen)setPayAmountEgp((chosen.totalAmountPiasters-chosen.paidAmountPiasters)/100)}}><option value="">—</option>{openBills.map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} · EGP {(i.totalAmountPiasters-i.paidAmountPiasters)/100}</option>)}</select><label><TranslatedText text="Amount to Collect (EGP) *" /></label>
                <input
                  type="number"
                  required
                  value={payAmountEgp}
                  onChange={(e) => setPayAmountEgp(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Payment Method *" /></label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="CASH"><TranslatedText text="Cash (Cashier Drawer)" /></option>
                  <option value="CREDIT_CARD"><TranslatedText text="Credit / Debit Card POS" /></option>
                  <option value="INSTAPAY"><TranslatedText text="InstaPay Electronic Transfer" /></option>
                  <option value="FAWRY"><TranslatedText text="Fawry Payment Reference" /></option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Receipt Notes / Reference" /></label>
                <LocalizedInput
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Card or InstaPay reference..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingPayment}> <TranslatedText text="Post & Print Receipt" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reconcile Cash */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="End-of-Shift Cash Reconciliation" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Verify physical drawer cash." /></p>

            <form onSubmit={handleReconciliation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Counted Cash Amount (EGP) *" /></label>
                <LocalizedInput
                  type="number"
                  required
                  value={countedCashEgp}
                  onChange={(e) => setCountedCashEgp(Number(e.target.value))}
                  placeholder="Counted cash in drawer"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Discrepancy Explanation Notes" /></label>
                <LocalizedTextarea
                  rows={2}
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  placeholder="Shortage or overage notes..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReconcileModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingRecon}> <TranslatedText text="Record Reconciliation" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Record Operating Expense" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Log clinic operating payout." /></p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Expense Category *" /></label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="SUPPLIES"><TranslatedText text="Clinical Supplies & Consumables" /></option>
                  <option value="MAINTENANCE"><TranslatedText text="Equipment Maintenance & Repairs" /></option>
                  <option value="UTILITIES"><TranslatedText text="Clinic Utilities & Internet" /></option>
                  <option value="RENT"><TranslatedText text="Branch Facility Rent" /></option>
                  <option value="LAB_FEES"><TranslatedText text="Dental Prosthetic Lab Fees" /></option>
                  <option value="OTHER"><TranslatedText text="Miscellaneous Expense" /></option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Payee / Vendor Name *" /></label>
                <LocalizedInput
                  type="text"
                  required
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  placeholder="e.g. Cairo Dental Supplies"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Amount Paid (EGP) *" /></label>
                <input
                  type="number"
                  required
                  value={expAmountEgp}
                  onChange={(e) => setExpAmountEgp(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Expense Notes / Invoice Reference" /></label>
                <LocalizedInput
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Receipt or bill reference number"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowExpenseModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingExpense}> <TranslatedText text="Record Expense" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
