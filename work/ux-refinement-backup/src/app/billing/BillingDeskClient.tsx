'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  const isCheckoutMode = modeParam === 'checkout';

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
  const [payPatientId, setPayPatientId] = useState(queryPatientId || initialPatients[0]?.id || '');

  useEffect(() => {
    if (viewParam === 'payments') setActiveTab('payments');
    else if (viewParam === 'reconciliation') setActiveTab('reconciliation');
    else if (viewParam === 'expenses') setActiveTab('expenses');
    else if (viewParam === 'balances') setActiveTab('invoices');
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
      { id: 'CASH', label: 'Cash (Physical)', value: (byMethod.CASH || 0) / 100, color: '#1F6FB2', formattedValue: `${((byMethod.CASH || 0) / 100).toLocaleString()} EGP` },
      { id: 'CREDIT_CARD', label: 'Credit / Debit Card', value: (byMethod.CREDIT_CARD || 0) / 100, color: '#163447', formattedValue: `${((byMethod.CREDIT_CARD || 0) / 100).toLocaleString()} EGP` },
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
      const balance = (inv.balancePiasters || 0) / 100;
      if (balance <= 0) continue;
      const invDate = new Date(inv.createdAt).getTime();
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
      { bucket: '0–30 Days (Current)', amountEgp: b0_30, invoiceCount: c0_30, severity: 'normal' },
      { bucket: '31–60 Days (Overdue)', amountEgp: b31_60, invoiceCount: c31_60, severity: 'warning' },
      { bucket: '61–90+ Days (Delinquent)', amountEgp: b61_90, invoiceCount: c61_90, severity: 'critical' },
    ];
  }, [invoices]);

  const cashflowSplinePoints: SplinePoint[] = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const totalColl = ((summary?.collectedByMethod?.CASH || 0) + (summary?.collectedByMethod?.CREDIT_CARD || 0) + (summary?.collectedByMethod?.INSTAPAY || 0)) / 100;
    const baseVal = Math.max(15000, Math.floor((totalColl || 75000) / 2.8));
    return months.map((m, idx) => ({
      label: m,
      value: Math.round(baseVal * (0.8 + idx * 0.16)),
    }));
  }, [summary]);

  useEffect(() => {
    fetchTabData();
  }, [selectedBranchId, activeTab]);

  async function fetchTabData() {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const res = await fetch(`/api/billing/invoices?branchId=${selectedBranchId}`);
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
            serviceItemId: l.serviceItemId || null,
            description: l.description,
            toothNumber: l.toothNumber || null,
            unitPricePiasters: Math.round(l.unitPriceEgp * 100),
            quantity: l.quantity,
          })),
        }),
      });

      if (res.ok) {
        setShowInvoiceModal(false);
        setInvoiceNotes('');
        await fetchTabData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInvoice(false);
    }
  }

  // Handle Payment Collection
  async function handleCollectPayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: payPatientId,
          collectionBranchId: selectedBranchId,
          amountPiasters: Math.round(payAmountEgp * 100),
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setPayNotes('');
        await fetchTabData();
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
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
      console.error(err);
    } finally {
      setSavingExpense(false);
    }
  }

  return (
    <div className="eb-role-page eb-finance min-h-screen pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER — frosted glass over background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
                <span>{isCheckoutMode ? 'RECEPTION CHECKOUT & CASHIER' : 'FINANCIAL LEDGER & CASHFLOW'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Finance & Cashier Desk
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Invoices · Payments · Reconciliation
              </p>
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
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
              >
                <CreditCard className="w-4 h-4 text-[#0F827B]" />
                <span>Collect Payment</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold bg-[#0F827B] hover:bg-[#0c6b65] text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Invoice</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. FINANCIAL KPIS — color-coded, minimal, click-to-expand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Good — total invoiced */}
          <div
            className="bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setExpandedKpi(expandedKpi === 'invoiced' ? null : 'invoiced')}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {((summary?.totalInvoicedPiasters || 0) / 100).toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
            </div>
            <p className="text-[11px] text-slate-400">{summary?.invoiceCount || 0} bills • Click for details</p>
            {expandedKpi === 'invoiced' && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Avg Invoice Value</span>
                  <span className="font-bold text-slate-800 tabular-nums">{summary?.invoiceCount ? Math.round((summary.totalInvoicedPiasters || 0) / summary.invoiceCount / 100).toLocaleString() : 0} EGP</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Collection Rate</span>
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
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Cash Drawer</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-900 tabular-nums">
              {((summary?.collectedByMethod?.CASH || 0) / 100).toLocaleString()} <span className="text-xs font-bold text-emerald-600">EGP</span>
            </div>
            <p className="text-[11px] text-emerald-700">Physical cash · Click details</p>
            {expandedKpi === 'cash' && (
              <div className="pt-3 border-t border-emerald-200 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="text-[11px] text-emerald-800 font-semibold">Current session cash total at {branches.find(b => b.id === selectedBranchId)?.name}</div>
                <div className="text-[11px] text-emerald-700">Reconcile against physical drawer count.</div>
              </div>
            )}
          </div>

          {/* Good — digital payments */}
          <div
            className="bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setExpandedKpi(expandedKpi === 'digital' ? null : 'digital')}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Digital & POS</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-blue-900 tabular-nums">
              {(((summary?.collectedByMethod?.CREDIT_CARD || 0) + (summary?.collectedByMethod?.INSTAPAY || 0) + (summary?.collectedByMethod?.FAWRY || 0)) / 100).toLocaleString()}{' '}
              <span className="text-xs font-bold text-slate-400">EGP</span>
            </div>
            <p className="text-[11px] text-slate-400">Digital payments · Click details</p>
            {expandedKpi === 'digital' && (
              <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Credit/Debit Card</span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.CREDIT_CARD || 0) / 100).toLocaleString()} EGP</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-slate-500">InstaPay</span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.INSTAPAY || 0) / 100).toLocaleString()} EGP</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Fawry</span><span className="font-bold tabular-nums">{((summary?.collectedByMethod?.FAWRY || 0) / 100).toLocaleString()} EGP</span></div>
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
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isEmergent ? 'text-red-700' : isStandby ? 'text-amber-700' : 'text-rose-600'}`}>Operating Expenses</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isEmergent ? 'bg-red-500' : isStandby ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div className={`text-2xl font-black tabular-nums ${isEmergent ? 'text-red-900' : isStandby ? 'text-amber-900' : 'text-rose-900'}`}>
                  {expenses.toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span>
                </div>
                <p className="text-[11px] text-slate-400">Operating costs · Click details</p>
                {expandedKpi === 'expenses' && (
                  <div className="pt-3 border-t border-slate-200 space-y-1.5 animate-[fadeSlideDown_0.25s_ease-out]">
                    <div className="flex justify-between text-[11px]"><span className="text-slate-600">Expense/Income Ratio</span><span className={`font-bold tabular-nums ${isEmergent ? 'text-red-700' : isStandby ? 'text-amber-700' : 'text-emerald-700'}`}>{Math.round(ratio * 100)}%</span></div>
                    {isEmergent && <p className="text-[11px] text-red-700 font-semibold">Expenses exceed normal ratio.</p>}
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

        {/* Aging Balances Chart */}
        <AgingBalancesChart buckets={agingBuckets} />

        {/* 4. TABS & DATA ACTIONS */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'invoices'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Invoices ({invoices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payments &amp; Receipts ({payments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'reconciliation'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Drawer Reconciliation</span>
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'expenses'
                    ? 'bg-[#0F827B] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Operating Expenses ({expenses.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'reconciliation' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowReconcileModal(true)}
                  className="rounded-full bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold px-4 py-2"
                >
                  + End-of-Day Drawer Count
                </Button>
              )}
              {activeTab === 'expenses' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowExpenseModal(true)}
                  className="rounded-full bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold px-4 py-2"
                >
                  + Record Expense
                </Button>
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
              <h3 className="text-sm font-bold text-slate-900">Issued Patient Invoices</h3>
              <span className="text-xs text-slate-500">{invoices.length} invoices on record</span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No invoices recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Patient</th>
                      <th className="p-3.5">Issued Date</th>
                      <th className="p-3.5">Lines</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Paid Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                        <td className="p-3.5">
                          <span className="font-bold block text-slate-900">{inv.patient?.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{inv.patient?.patientNumber}</span>
                        </td>
                        <td className="p-3.5 text-slate-500">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                        <td className="p-3.5">
                          {inv.lines?.map((l: any, i: number) => (
                            <span key={i} className="block text-[11px] text-slate-600">
                              • {l.description} ({l.quantity}x)
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {(inv.totalAmountPiasters / 100).toLocaleString()} EGP
                        </td>
                        <td className="p-3.5 font-medium text-teal-700">
                          {(inv.paidAmountPiasters / 100).toLocaleString()} EGP
                        </td>
                        <td className="p-3.5">
                          <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'info' : 'neutral'}>
                            {inv.status}
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
              <h3 className="text-sm font-bold text-slate-900">Cashier Payment Collections & Receipts</h3>
              <span className="text-xs text-slate-500">{payments.length} posted payments</span>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Receipt #</th>
                      <th className="p-3.5">Patient</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Amount Collected</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Cashier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-800">{p.receiptNumber}</td>
                        <td className="p-3.5 font-bold text-slate-900">{p.patient?.fullName}</td>
                        <td className="p-3.5 text-slate-500">{new Date(p.collectedAt).toLocaleString()}</td>
                        <td className="p-3.5">
                          <Badge variant={'neutral'}>
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          {(p.amountPiasters / 100).toLocaleString()} EGP
                        </td>
                        <td className="p-3.5">
                          <Badge variant="success">{p.status}</Badge>
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
                <h3 className="text-base font-bold text-slate-900">Cash Drawer Reconciliation</h3>
                <p className="text-xs text-slate-500">Reconcile physical cash counts.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">System Expected Cash:</span>
                <span className="text-xl font-bold text-teal-800">
                  {((summary?.collectedByMethod?.CASH || 0) / 100).toLocaleString()} EGP
                </span>
                <p className="text-[11px] text-teal-700 mt-1">
                  Cash receipts processed today.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Operating Expenses */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Branch Operating Expenses Register</h3>
              <span className="text-xs text-slate-500">{expenses.length} expenses recorded</span>
            </div>

            {expenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No operating expenses logged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Payee / Vendor</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Notes</th>
                      <th className="p-3.5">Recorded By</th>
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
                          {(exp.amountPiasters / 100).toLocaleString()} EGP
                        </td>
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
            <h3 className="text-base font-bold text-slate-900 mb-1">Issue New Patient Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">Add catalog service lines.</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Patient *</label>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice Line Items</label>
                <div className="space-y-2">
                  {invoiceLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={line.serviceItemId}
                        onChange={(e) => {
                          const item = serviceCatalog.find(c => c.id === e.target.value);
                          const updated = [...invoiceLines];
                          updated[idx].serviceItemId = e.target.value;
                          if (item) {
                            updated[idx].description = item.nameEn;
                            updated[idx].unitPriceEgp = item.basePricePiasters / 100;
                          }
                          setInvoiceLines(updated);
                        }}
                        className="flex-1 text-xs rounded-xl border border-slate-200 p-2"
                      >
                        {serviceCatalog.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.nameEn} ({(cat.basePricePiasters / 100)} EGP)</option>
                        ))}
                      </select>
                      <input
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
                      <input
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice Notes</label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Approved discount note..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingInvoice}>
                  Issue Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Collect Patient Payment</h3>
            <p className="text-xs text-slate-500 mb-4">Post receipt to ledger.</p>

            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Patient *</label>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount to Collect (EGP) *</label>
                <input
                  type="number"
                  required
                  value={payAmountEgp}
                  onChange={(e) => setPayAmountEgp(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="CASH">Cash (Cashier Drawer)</option>
                  <option value="CREDIT_CARD">Credit / Debit Card POS</option>
                  <option value="INSTAPAY">InstaPay Electronic Transfer</option>
                  <option value="FAWRY">Fawry Payment Reference</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt Notes / Reference</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Card or InstaPay reference..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingPayment}>
                  Post & Print Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reconcile Cash */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">End-of-Shift Cash Reconciliation</h3>
            <p className="text-xs text-slate-500 mb-4">Verify physical drawer cash.</p>

            <form onSubmit={handleReconciliation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Counted Cash Amount (EGP) *</label>
                <input
                  type="number"
                  required
                  value={countedCashEgp}
                  onChange={(e) => setCountedCashEgp(Number(e.target.value))}
                  placeholder="Counted cash in drawer"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Discrepancy Explanation Notes</label>
                <textarea
                  rows={2}
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  placeholder="Shortage or overage notes..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReconcileModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingRecon}>
                  Record Reconciliation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Operating Expense</h3>
            <p className="text-xs text-slate-500 mb-4">Log clinic operating payout.</p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="SUPPLIES">Clinical Supplies & Consumables</option>
                  <option value="MAINTENANCE">Equipment Maintenance & Repairs</option>
                  <option value="UTILITIES">Clinic Utilities & Internet</option>
                  <option value="RENT">Branch Facility Rent</option>
                  <option value="LAB_FEES">Dental Prosthetic Lab Fees</option>
                  <option value="OTHER">Miscellaneous Expense</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payee / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  placeholder="e.g. Cairo Dental Supplies"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Paid (EGP) *</label>
                <input
                  type="number"
                  required
                  value={expAmountEgp}
                  onChange={(e) => setExpAmountEgp(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Notes / Invoice Reference</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Receipt or bill reference number"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingExpense}>
                  Record Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
