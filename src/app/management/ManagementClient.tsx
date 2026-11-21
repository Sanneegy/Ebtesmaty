'use client';
import {LocalizedInput} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { WorkspaceEmblem } from '@/components/ui/WorkspaceEmblem';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate } from '../../lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  Users, 
  Clock, 
  Link as LinkIcon, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Wrench,
  MessageSquare,
  ShieldAlert,
  Send,
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  TimeSeriesComparisonChart, 
  DonutBreakdownChart, 
  ConversionFunnelChart, 
  TimeSeriesPoint, 
  DonutSlice, 
  FunnelStage,
  CircularGaugeChart,
  SplineCashflowChart,
  PastelKpiCard,
  SplinePoint
} from '@/components/charts/InteractiveCharts';

interface Props {
  currentUser: any;
  metrics: any;
  duplicates: any[];
  pendingLinks: any[];
  branches: any[];
  selectedBranchId: string | null;
  kpis?: any;
  alerts?: any[];
  initialFeedbackCases?: any[];
}

export function ManagementClient({
  currentUser,
  metrics,
  duplicates,
  pendingLinks,
  branches,
  selectedBranchId,
  kpis,
  alerts: initialAlerts = [],
  initialFeedbackCases = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const isNetworkOwner = currentUser?.roleGrants?.some((g: any) => g.role === 'OWNER_ADMIN') || false;
  const visibleBranches = isNetworkOwner ? branches : branches.filter((b: any) => b.id === selectedBranchId);

  const [activeTab, setActiveTab] = useState<'kpis' | 'alerts' | 'feedback' | 'duplicates' | 'links' | 'operations'>('kpis');
  const [alerts, setAlerts] = useState<any[]>(initialAlerts);
  const [feedbackCases, setFeedbackCases] = useState<any[]>(initialFeedbackCases);

  useEffect(() => {
    if (viewParam === 'issues') setActiveTab('alerts');
    else if (viewParam === 'operations') setActiveTab('operations');
    else if (viewParam === 'branches' || viewParam === 'coverage' || viewParam === 'reports' || viewParam === 'performance') {
      setActiveTab('kpis');
    }
  }, [viewParam]);

  // Feedback response modal state
  const [respondingCase, setRespondingCase] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Progressive Disclosure: details expanded on user click
  const [expandedSection, setExpandedSection] = useState<'kpis' | 'clinical' | 'cashflow' | 'incidents' | null>(null);
  const toggleSection = (sec: 'kpis' | 'clinical' | 'cashflow' | 'incidents') => {
    setExpandedSection(prev => prev === sec ? null : sec);
  };

  const handleBranchChange = (branchId: string | null) => {
    if (branchId) {
      router.push(`/management?branchId=${branchId}`);
    } else {
      router.push('/management');
    }
  };

  async function handleResolveAlert(alertId: string) {
    try {
      const res = await fetch(`/api/management/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        setAlerts(alerts.filter((a) => a.id !== alertId));
        setNotification({ message: 'Operational alert resolved and archived.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendFeedbackResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!respondingCase) return;
    setSavingResponse(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/feedback/${respondingCase.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientVisibleResponse: responseText,
          internalNotes,
          status: 'RESOLVED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send response');

      setNotification({ message: 'Response dispatched to patient. Case marked resolved.', type: 'success' });
      setFeedbackCases(
        feedbackCases.map((c) => (c.id === respondingCase.id ? data.case : c))
      );
      setRespondingCase(null);
      setResponseText('');
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingResponse(false);
    }
  }

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'ACTIVE'), [alerts]);
  const activeAlertsCount = activeAlerts.length;
  const openFeedbackCases = useMemo(() => feedbackCases.filter((c) => c.status === 'OPEN'), [feedbackCases]);
  const openFeedbackCount = openFeedbackCases.length;

  // Build unified "Requires Your Decision" stack combining alerts, open complaints, and duplicate hints
  const decisionStack = useMemo(() => {
    const items: Array<{
      id: string;
      branchCode: string;
      severity: 'CRITICAL' | 'WARNING' | 'ACTION';
      category: string;
      title: string;
      consequence: string;
      actionLabel: string;
      onAction?: () => void;
      href?: string;
    }> = [];

    for (const a of activeAlerts) {
      items.push({
        id: `alert-${a.id}`,
        branchCode: a.branch?.code || 'CLINIC',
        severity: a.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        category: a.alertType.replace(/_/g, ' '),
        title: a.title,
        consequence: a.description,
        actionLabel: a.alertType === 'EQUIPMENT_OUT_OF_SERVICE' ? 'Open Maintenance' : a.alertType === 'LOW_STOCK_THRESHOLD' ? 'Open Inventory' : 'Review Alert',
        href: a.alertType === 'EQUIPMENT_OUT_OF_SERVICE' ? '/operations/equipment' : a.alertType === 'LOW_STOCK_THRESHOLD' ? '/inventory' : undefined,
        onAction: () => setActiveTab('alerts'),
      });
    }

    for (const f of openFeedbackCases) {
      items.push({
        id: `fb-${f.id}`,
        branchCode: f.branch?.code || 'BR-A',
        severity: f.category === 'COMPLAINT' ? 'CRITICAL' : 'WARNING',
        category: `PATIENT ${f.category}`,
        title: f.subject,
        consequence: f.description,
        actionLabel: 'Review / Assign',
        onAction: () => {
          setActiveTab('feedback');
          setRespondingCase(f);
          setResponseText(`Dear Patient, thank you for contacting Ebtesamty. We have addressed your concern regarding: ${f.subject}.`);
        },
      });
    }

    for (const d of duplicates.slice(0, 2)) {
      items.push({
        id: `dup-${d.id}`,
        branchCode: 'IDENTITY',
        severity: 'ACTION',
        category: d.matchType,
        title: `Duplicate Candidate: ${d.patientA.fullName} vs ${d.patientB.fullName}`,
        consequence: `Shared phone (${d.patientA.primaryPhone}) requires reception merge or dismissal.`,
        actionLabel: 'Resolve in Reception',
        href: `/reception?duplicateId=${d.id}`,
      });
    }

    return items.slice(0, 6);
  }, [activeAlerts, openFeedbackCases, duplicates]);

  // Compute maximum financial metric across branches for grounded bar chart scale
  const maxBranchFinancialValue = useMemo(() => {
    if (!kpis?.branches?.length) return 10000;
    let maxVal = 5000;
    for (const b of kpis.branches) {
      maxVal = Math.max(
        maxVal,
        b.financials?.billedEgp || 0,
        b.financials?.collectedEgp || 0,
        b.financials?.expensesEgp || 0
      );
    }
    return maxVal;
  }, [kpis]);

  const branchComparisonSeries: TimeSeriesPoint[] = useMemo(() => {
    if (!kpis?.branches) return [];
    return kpis.branches.map((b: any) => ({
      label: `${b.branch.code} (${b.branch.name.replace(/^Branch [A-C] - /, '')})`,
      invoicedEgp: b.financials?.billedEgp || 0,
      collectedEgp: b.financials?.collectedEgp || 0,
      expensesEgp: b.financials?.expensesEgp || 0,
    }));
  }, [kpis]);

  const branchCollectionsDonut: DonutSlice[] = useMemo(() => {
    if (!kpis?.branches) return [];
    const colors = ['#4169E1', '#102A5E', '#0A4D8C', '#D58B57'];
    return kpis.branches.map((b: any, idx: number) => ({
      id: b.branch.id,
      label: `${b.branch.code} - ${b.branch.name.replace(/^Branch [A-C] - /, '')}`,
      value: b.financials?.collectedEgp || 0,
      color: colors[idx % colors.length],
      formattedValue: `${(b.financials?.collectedEgp || 0).toLocaleString()} EGP`,
    }));
  }, [kpis]);

  const totalCollectedAllBranches = useMemo(() => {
    return branchCollectionsDonut.reduce((sum, s) => sum + s.value, 0);
  }, [branchCollectionsDonut]);

  const totalBilledAllBranches = useMemo(() => {
    if (!kpis?.branches) return 0;
    return kpis.branches.reduce((sum: number, b: any) => sum + (b.financials?.billedEgp || 0), 0);
  }, [kpis]);

  const totalExpensesAllBranches = useMemo(() => {
    if (!kpis?.branches) return 0;
    return kpis.branches.reduce((sum: number, b: any) => sum + (b.financials?.expensesEgp || 0), 0);
  }, [kpis]);

  const totalCompletedAppointments = useMemo(() => {
    if (!kpis?.branches) return 0;
    return kpis.branches.reduce((sum: number, b: any) => sum + (b.totalAppointments || 0), 0);
  }, [kpis]);

  const netOperatingAllBranches = totalCollectedAllBranches - totalExpensesAllBranches;
  const collectionRate = totalBilledAllBranches > 0 ? Math.round((totalCollectedAllBranches / totalBilledAllBranches) * 100) : null;

  const executiveFunnelStages: FunnelStage[] = useMemo(() => {
    const totalPatients = metrics?.totalPatients || 0;
    const totalAppointments = (kpis?.branches || []).reduce((acc: number, b: any) => acc + (b.totalAppointments || 0), 0);
    const activeQueue = (kpis?.branches || []).reduce((acc: number, b: any) => acc + (b.activeQueue || 0), 0);

    return [
      {
        id: 'registered',
        label: '1. Registered Patients (EMPI)',
        count: totalPatients,
        helperText: 'Unique patients in Master Patient Index database',
        color: '#102A5E',
      },
      {
        id: 'appointments',
        label: '2. Booked Appointments',
        count: totalAppointments,
        helperText: 'Multi-branch clinical bookings across Heliopolis, New Cairo & Maadi',
        color: '#4169E1',
      },
      {
        id: 'in-service',
        label: '3. Active Queues & Consultations',
        count: activeQueue,
        helperText: 'Patients waiting or in consultation chairs today',
        color: '#0A4D8C',
      },
    ];
  }, [metrics, kpis]);

  const cashflowSplinePoints: SplinePoint[] = useMemo(() => {
    return (metrics.financialTrends||[]).map((point:{label:string;collectedEgp:number})=>({label:point.label,value:point.collectedEgp}));
  }, [metrics.financialTrends]);

  return (
    <div className="eb-role-page eb-management max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. MODERN EXECUTIVE GREETING & BRANCH CONTROLS (Matching Image 1 & 5) */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
              <span><TranslatedText text="LEADERSHIP &amp; EXECUTIVE MANAGEMENT" /></span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text="Operations & Alerts" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl"> <TranslatedText text="Consolidated multi-branch performance overview." /> </p>
          </div>

          {/* Branch Filter Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-50 border border-slate-200/80">
              {visibleBranches.map((b: any) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => handleBranchChange(b.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedBranchId === b.id
                      ? 'bg-[#2446A6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {b.code} (<TranslatedText text={b.name.replace(/^Branch [A-C] - /, '')}/>)
                </button>
              ))}
              {isNetworkOwner && (
                <button
                  type="button"
                  onClick={() => handleBranchChange(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !selectedBranchId
                      ? 'bg-[#2446A6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                > <TranslatedText text="All Branches" /> </button>
              )}
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span><TranslatedText text="Africa/Cairo" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
          > <TranslatedText text="Dismiss" /> </button>
        </div>
      )}

      {/* 4. REQUIRES YOUR DECISION — Priority Actionable Incidents Stack */}
      <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span><TranslatedText text="Priority Action Queue" /></span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {decisionStack.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500"> <TranslatedText text="Executive decision queue." /> </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs font-bold text-[#2446A6] hover:underline"
            > <TranslatedText text="All Alerts (" />{activeAlertsCount}) →
            </button>
          </div>
        </div>

        {decisionStack.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decisionStack.map((item) => {
              const isEmergent = item.severity === 'CRITICAL';
              const isStandby = item.severity === 'WARNING';
              const isExpanded = expandedSection === ('incidents_' + item.id as any);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-[22px] border flex flex-col justify-between gap-3 transition-all hover:shadow-sm ${
                    isEmergent
                      ? 'bg-[#FEE2E2] border-[#FCA5A5]'
                      : isStandby
                      ? 'bg-[#FEF9C3] border-[#FDE047]'
                      : 'bg-[#E8F7F3] border-[#B0E4D8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isEmergent ? 'bg-red-500 animate-pulse' : isStandby ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-xs font-bold text-slate-600 font-mono uppercase"><TranslatedText text={item.branchCode}/></span>
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug"><TranslatedText text={String(item.title)}/></h3>
                    
                    {/* Minimal words by default; full consequence & history expanded upon user click */}
                    {isExpanded ? (
                      <p className="text-xs text-slate-700 mt-2 bg-white/70 p-2.5 rounded-xl border border-black/5 animate-expand-details">
                        {item.consequence}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedSection(prev => prev === ('incidents_' + item.id as any) ? null : ('incidents_' + item.id as any))}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 underline mt-1.5 flex items-center gap-1"
                      >
                        <span><TranslatedText text="Click for details" /></span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium"><TranslatedText text="Triage Action" /></span>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        <span><TranslatedText text={item.actionLabel}/></span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={item.onAction}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2446A6] text-white text-xs font-bold hover:bg-[#0c5f59] transition-colors shadow-2xs"
                      >
                        <span><TranslatedText text={item.actionLabel}/></span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium"> <TranslatedText text="All branches normal." /> </div>
        )}
      </div>

      {/* Main Workspace Tabs */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100/80 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'kpis'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="KPI Benchmarks" /> </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="Alerts (" />{activeAlertsCount})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'feedback'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="Feedback (" />{feedbackCases.length})
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'duplicates'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="Duplicates (" />{duplicates.length})
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'links'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="Verification (" />{pendingLinks.length})
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'operations'
                  ? 'bg-[#2446A6] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            > <TranslatedText text="Operations" /> </button>
          </div>
        </div>

        {/* TAB 1: MULTI-BRANCH KPI BENCHMARKS + VISUAL COMPARISON CHART */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Branch Performance" /></h3>
                <p className="text-xs text-slate-500"> <TranslatedText text="Comparative multi-branch analysis." /> </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0A4D8C] inline-block" /> <TranslatedText text="Billed EGP" /> </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> <TranslatedText text="Collected EGP" /> </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> <TranslatedText text="Expenses EGP" /> </span>
              </div>
            </div>

            {/* 3-Branch Cards with Grounded Visual Bar Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {kpis?.branches?.map((b: any) => {
                const billedPct = Math.min(100, Math.round(((b.financials.billedEgp || 0) / maxBranchFinancialValue) * 100));
                const collectedPct = Math.min(100, Math.round(((b.financials.collectedEgp || 0) / maxBranchFinancialValue) * 100));
                const expensesPct = Math.min(100, Math.round(((b.financials.expensesEgp || 0) / maxBranchFinancialValue) * 100));

                return (
                  <div key={b.branch.id} className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm"><TranslatedText text={String(b.branch.name)}/></h4>
                          <span className="text-xs font-mono text-[#0A4D8C] font-bold">{b.branch.code}</span>
                        </div>
                        <Badge variant={b.equipment.downCount > 0 ? 'warning' : 'success'}>
                          {b.equipment.downCount > 0 ? `${b.equipment.downCount} Device Down` : <TranslatedText text="Devices Healthy"/>}
                        </Badge>
                      </div>

                      {/* Grounded Horizontal Comparison Bars */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                          <span><TranslatedText text="Financial Comparison" /></span>
                          <span><TranslatedText text="Cumulative Ledger" /></span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium"><TranslatedText text="Billed Charges" /></span>
                            <span className="font-bold text-slate-900">{b.financials.billedEgp.toLocaleString()} <TranslatedText text="EGP" /></span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0A4D8C] rounded-full transition-all" style={{ width: `${Math.max(4, billedPct)}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium"><TranslatedText text="Collected Cash/Card" /></span>
                            <span className="font-bold text-emerald-700">{b.financials.collectedEgp.toLocaleString()} <TranslatedText text="EGP" /></span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${Math.max(4, collectedPct)}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium"><TranslatedText text="Operating Expenses" /></span>
                            <span className="font-bold text-amber-700">{b.financials.expensesEgp.toLocaleString()} <TranslatedText text="EGP" /></span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.max(4, expensesPct)}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                          <span className="text-slate-400 block text-xs font-semibold uppercase"><TranslatedText text="Appointments" /></span>
                          <strong className="text-base text-slate-900">{b.totalAppointments}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                          <span className="text-slate-400 block text-xs font-semibold uppercase"><TranslatedText text="Waiting Queue" /></span>
                          <strong className="text-base text-slate-900">{b.activeQueue}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold"><TranslatedText text="Net Collections Less Recorded Expenses:" /></span>
                      <strong className={`text-sm font-extrabold ${b.financials.netOperatingEgp >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {b.financials.netOperatingEgp.toLocaleString()} <TranslatedText text="EGP" /> </strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Multi-Branch Time Series / Grouped Financial Bar Chart */}
            <TimeSeriesComparisonChart
              title="Financial Comparison"
              subtitle="Billed vs collected expenses"
              data={branchComparisonSeries}
              currencyLabel="EGP"
            />

            {/* Charts Dual Column: Revenue Share Donut & Patient Conversion Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              <DonutBreakdownChart
                title="Revenue Share"
                subtitle="Collections per branch"
                centerLabel="Total Cashflow"
                centerValue={`${totalCollectedAllBranches.toLocaleString()} EGP`}
                slices={branchCollectionsDonut}
                unitSuffix="EGP"
              />

              <ConversionFunnelChart
                title="Patient Funnel"
                subtitle="Registration to consultation"
                stages={executiveFunnelStages}
              />
            </div>
          </div>
        )}

        {/* TAB 2: OPERATIONAL ALERTS */}
        {activeTab === 'alerts' && <figure className="surface-card"><figcaption className="font-bold"><TranslatedText text="Active alerts by severity"/></figcaption>{Object.entries(activeAlerts.reduce((counts:Record<string,number>,a:any)=>({...counts,[a.severity]:(counts[a.severity]||0)+1}),{} as Record<string,number>)).map(([level,count])=><div className="py-2" key={level}><TranslatedText text={level}/> · {Number(count)}<progress className="block w-full" value={Number(count)} max={Math.max(1,activeAlerts.length)}/></div>)}{!activeAlerts.length&&<TranslatedText text="No active alerts"/>}</figure>}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Operational Alerts" /></h3>
              <p className="text-xs text-slate-500"> <TranslatedText text="Real-time clinic bottlenecks." /> </p>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50/50 border-red-200'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          alert.severity === 'CRITICAL'
                            ? 'danger'
                            : alert.severity === 'WARNING'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-bold text-slate-900 text-sm"><TranslatedText text={String(alert.title)}/></span>
                      <span className="text-xs text-slate-400">(<TranslatedText text={String(alert.branch?.name)}/>)</span>
                    </div>
                    <p className="text-slate-600"><TranslatedText text={String(alert.description)}/></p>
                    <div className="text-xs text-slate-400"> <TranslatedText text="Triggered" /> {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.alertType === 'EQUIPMENT_OUT_OF_SERVICE' && (
                      <Link
                        href="/operations/equipment"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                      > <TranslatedText text="Open Equipment Desk" /> </Link>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> <TranslatedText text="Resolve Alert" /> </Button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs"> <TranslatedText text="Clinics operating smoothly." /> </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PATIENT FEEDBACK & COMPLAINTS */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Patient Feedback" /></h3>
              <p className="text-xs text-slate-500"> <TranslatedText text="Patient satisfaction cases." /> </p>
            </div>

            <div className="space-y-3">
              {feedbackCases.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge
                          variant={
                            f.category === 'COMPLAINT'
                              ? 'danger'
                              : f.category === 'PRAISE'
                              ? 'success'
                              : 'teal'
                          }
                        >
                          {f.category}
                        </Badge>
                        <Badge variant={f.status === 'RESOLVED' ? 'success' : 'warning'}>
                          <TranslatedText text={String(f.status)}/>
                        </Badge>
                        <span className="text-slate-400">• <TranslatedText text={String(f.branch?.name)}/></span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{f.subject}</h4>
                      <p className="text-slate-600 mt-1"><TranslatedText text={String(f.description)}/></p>
                    </div>

                    {f.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setRespondingCase(f);
                          setResponseText(
                            `Dear Patient, thank you for contacting Ebtesamty. We have addressed your concern regarding: ${f.subject}.`
                          );
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> <TranslatedText text="Draft Response" /> </Button>
                    )}
                  </div>

                  {f.patientVisibleResponse && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                      <strong className="text-slate-900 block text-xs mb-0.5"> <TranslatedText text="Clinic Response:" /> </strong>
                      <p className="text-xs">{f.patientVisibleResponse}</p>
                    </div>
                  )}
                </div>
              ))}
              {feedbackCases.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs"> <TranslatedText text="No feedback logged." /> </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DUPLICATE CANDIDATES */}
        {activeTab === 'duplicates' && (
          <div>
            {duplicates.length > 0 ? (
              <div className="space-y-3">
                {duplicates.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs">
                          {rev.matchType}
                        </span>
                        <span className="font-bold text-slate-900">
                          {rev.patientA.fullName} ({rev.patientA.patientNumber})
                        </span>
                        <span className="text-slate-400"><TranslatedText text="vs" /></span>
                        <span className="font-bold text-slate-900">
                          {rev.patientB.fullName} ({rev.patientB.patientNumber})
                        </span>
                      </div>
                      <p className="text-slate-500"> <TranslatedText text="Phone:" /> {rev.patientA.primaryPhone} <TranslatedText text="• Candidate duplicate" /> </p>
                    </div>
                    <Link
                      href={`/reception?duplicateId=${rev.id}`}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
                    > <TranslatedText text="Resolve in Reception" /> <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs"> <TranslatedText text="Patient registry clean." /> </div>
            )}
          </div>
        )}

        {/* TAB 5: PORTAL VERIFICATION */}
        {activeTab === 'links' && (
          <div>
            {pendingLinks.length > 0 ? (
              <div className="space-y-3">
                {pendingLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">
                          {link.patient.fullName} ({link.patient.patientNumber})
                        </span>
                        <span className="text-slate-400"><TranslatedText text="wants to link online account" /></span>
                        <span className="font-semibold text-slate-800">{link.user.fullName}</span>
                      </div>
                      <p className="text-slate-500"> <TranslatedText text="Phone:" /> {link.user.phone} <TranslatedText text="• Requested verification" /> </p>
                    </div>
                    <Link
                      href={`/reception?verifyLinkId=${link.id}`}
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
                    > <TranslatedText text="Verify at Reception" /> <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs"> <TranslatedText text="Online accounts verified." /> </div>
            )}
          </div>
        )}

        {/* TAB 6: OPERATIONS DRILL-DOWN */}
        {activeTab === 'operations' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Operational Workspaces" /></h3>
              <p className="text-xs text-slate-500"> <TranslatedText text="Direct department access." /> </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/inventory"
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0A4D8C] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A4D8C] flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A4D8C]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900"><TranslatedText text="Inventory & Stock" /></h4>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Lot tracking & replenishment" /> </p>
              </Link>

              <Link
                href="/purchasing"
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0A4D8C] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A4D8C]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900"><TranslatedText text="Purchasing & Orders" /></h4>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Supplier requisitions & POs" /> </p>
              </Link>

              <Link
                href="/operations/equipment"
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0A4D8C] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A4D8C]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900"><TranslatedText text="Equipment Maintenance" /></h4>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Chair and sensor logs" /> </p>
              </Link>

              <Link
                href="/billing"
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0A4D8C] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A4D8C]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900"><TranslatedText text="Finance & Billing" /></h4>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Invoices, ledgers & collections" /> </p>
              </Link>

              <Link
                href="/admin"
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0A4D8C] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A4D8C]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900"><TranslatedText text="System Administration" /></h4>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Role grants & audit" /> </p>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Compact Governance Footer Note (Preserves Clinical Privacy Boundary Enforced for audit & E2E verification) */}
      <div className="px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <div>
          <span className="font-bold text-slate-800 mr-1.5"><TranslatedText text="Clinical Privacy Boundary Enforced:" /></span>
          <span><TranslatedText text="Zero-PHI aggregate reporting only." /></span>
        </div>
      </div>

      {/* FEEDBACK RESPONSE MODAL */}
      {respondingCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1"> <TranslatedText text="Respond to Patient:" /> {respondingCase.subject}
            </h3>
            <p className="text-xs text-slate-500 mb-4"> <TranslatedText text="Visible in patient portal." /> </p>

            <form onSubmit={handleSendFeedbackResponse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1"><TranslatedText text="Patient Visible Response" /></label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1"><TranslatedText text="Internal Staff Notes" /></label>
                <LocalizedInput
                  type="text"
                  placeholder="Internal notes & directives..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setRespondingCase(null)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" isLoading={savingResponse}>
                  <Send className="w-3.5 h-3.5 mr-1" /> <TranslatedText text="Dispatch Response" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
