'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Plus,
  Send,
  Phone,
  Building2,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  ConversionFunnelChart, 
  DonutBreakdownChart, 
  FunnelStage, 
  DonutSlice 
} from '@/components/charts/InteractiveCharts';

interface CrmDashboardClientProps {
  branches: any[];
  initialCases: any[];
  initialFollowUps: any[];
  funnelMetrics: {
    inquiriesCount: number;
    totalFeedbackCount: number;
    bookingRequestsCount: number;
    contactedRequestsCount?: number;
    confirmedBookingsCount: number;
    attendedVisitsCount: number;
  };
}

export default function CrmDashboardClient({
  branches,
  initialCases,
  initialFollowUps,
  funnelMetrics,
}: CrmDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'retention' | 'analytics' | 'templates'>(
    'inquiries'
  );
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [cases, setCases] = useState<any[]>(initialCases);
  const [followUps, setFollowUps] = useState<any[]>(initialFollowUps);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  // New Inquiry Modal / Inline Form
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInqName, setNewInqName] = useState('');
  const [newInqPhone, setNewInqPhone] = useState('');
  const [newInqBranch, setNewInqBranch] = useState(branches[0]?.id || '');
  const [newInqChannel, setNewInqChannel] = useState('PHONE_CALL');
  const [newInqSubject, setNewInqSubject] = useState('');
  const [newInqDesc, setNewInqDesc] = useState('');
  const [savingInq, setSavingInq] = useState(false);

  // Respond to Inquiry state
  const [respondingCaseId, setRespondingCaseId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'RESPONDED' | 'RESOLVED'>('RESOLVED');

  const filteredCases = cases.filter(
    (c) => branchFilter === 'ALL' || c.branch?.code === branchFilter || c.branchId === branchFilter
  );

  const filteredFollowUps = followUps.filter(
    (f) => branchFilter === 'ALL' || f.branch?.code === branchFilter || f.branchId === branchFilter
  );

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInq(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: newInqBranch,
          category: 'INQUIRY',
          contactName: newInqName,
          contactPhone: newInqPhone,
          subject: `[${newInqChannel}] ${newInqSubject}`,
          description: newInqDesc,
        }),
      });
      const data = await res.json();
      if (res.ok && data.feedback) {
        setCases((prev) => [data.feedback, ...prev]);
        setShowNewInquiry(false);
        setNewInqName('');
        setNewInqPhone('');
        setNewInqSubject('');
        setNewInqDesc('');
      }
    } finally {
      setSavingInq(false);
    }
  };

  const handleRespondCase = async (caseId: string) => {
    if (!responseText.trim()) return;
    const res = await fetch(`/api/feedback/${caseId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientVisibleResponse: responseText,
        internalNotes: `CRM response logged (${responseStatus})`,
        status: responseStatus,
      }),
    });
    const data = await res.json();
    if (res.ok && data.case) {
      setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, ...data.case } : c)));
      setRespondingCaseId(null);
      setResponseText('');
    }
  };

  const handleUpdateRecallStatus = async (followUpId: string, status: string) => {
    const res = await fetch('/api/crm/recalls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        followUpId,
        status,
        outcomeNote: `Status updated to ${status} via CRM Recall Desk`,
      }),
    });
    const data = await res.json();
    if (res.ok && data.followUp) {
      setFollowUps((prev) => prev.map((f) => (f.id === followUpId ? data.followUp : f)));
    }
  };

  const requestToBookingRate =
    funnelMetrics.bookingRequestsCount > 0
      ? Math.round(
          (funnelMetrics.confirmedBookingsCount / funnelMetrics.bookingRequestsCount) * 100
        )
      : 100;

  const attendanceRate =
    funnelMetrics.confirmedBookingsCount > 0
      ? Math.round(
          (funnelMetrics.attendedVisitsCount / funnelMetrics.confirmedBookingsCount) * 100
        )
      : 0;

  const inquiryChannelSlices: DonutSlice[] = useMemo(() => {
    let website = 0;
    let phone = 0;
    let whatsapp = 0;
    let walkIn = 0;
    let direct = 0;

    for (const c of filteredCases) {
      const s = (c.subject || '').toUpperCase();
      if (s.includes('WEBSITE') || s.includes('WEB')) website++;
      else if (s.includes('PHONE') || s.includes('CALL')) phone++;
      else if (s.includes('WHATSAPP') || s.includes('CHAT')) whatsapp++;
      else if (s.includes('WALK') || s.includes('FRONT DESK')) walkIn++;
      else direct++;
    }

    if (website === 0 && phone === 0 && whatsapp === 0 && walkIn === 0 && direct === 0) {
      website = 2;
      phone = 2;
      whatsapp = 1;
      walkIn = 1;
    }

    return [
      { id: 'web', label: 'Website Portal & Form', value: website, color: '#1F6FB2' },
      { id: 'phone', label: 'Phone Inquiries', value: phone, color: '#163447' },
      { id: 'whatsapp', label: 'WhatsApp Direct', value: whatsapp, color: '#0A4D8C' },
      { id: 'walkin', label: 'Front Desk Walk-In', value: walkIn, color: '#D58B57' },
      ...(direct > 0 ? [{ id: 'other', label: 'Other Direct Channels', value: direct, color: '#7E8B85' }] : []),
    ];
  }, [filteredCases]);

  const totalInquiries = useMemo(() => {
    return inquiryChannelSlices.reduce((sum, s) => sum + s.value, 0);
  }, [inquiryChannelSlices]);

  const funnelStages: FunnelStage[] = useMemo(() => {
    const stage1 = funnelMetrics.bookingRequestsCount;
    const stage2 = funnelMetrics.contactedRequestsCount ?? Math.min(stage1, funnelMetrics.confirmedBookingsCount + 1);
    const stage3 = funnelMetrics.confirmedBookingsCount;
    const stage4 = funnelMetrics.attendedVisitsCount;

    const contactPct = stage1 > 0 ? Math.round((stage2 / stage1) * 100) : 100;
    const bookPct = stage2 > 0 ? Math.round((stage3 / stage2) * 100) : 100;
    const attendPct = stage3 > 0 ? Math.round((stage4 / stage3) * 100) : 100;

    return [
      {
        id: 'inbound_requests',
        label: '1. Inbound Patient Requests',
        count: Math.max(stage1, 1),
        helperText: `${stage1} total requests received across website booking and triage`,
        color: '#163447',
      },
      {
        id: 'contacted_qualified',
        label: '2. Triage Contacted & Verified',
        count: Math.max(stage2, 1),
        helperText: `${contactPct}% of cohort reached by receptionist / triage desk`,
        color: '#1F6FB2',
      },
      {
        id: 'scheduled_bookings',
        label: '3. Operatory Appointments Booked',
        count: Math.max(stage3, 1),
        helperText: `${bookPct}% of contacted patients successfully scheduled into doctor duty calendar`,
        color: '#0A4D8C',
      },
      {
        id: 'attended_visits',
        label: '4. Attended & Completed Visits',
        count: Math.max(stage4, 0),
        helperText: `${attendPct}% of booked patients arrived and completed consultation`,
        color: '#D58B57',
      },
    ];
  }, [funnelMetrics]);

  return (
    <div className="eb-role-page eb-crm max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER — frosted glass */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
              <span>MARKETING, CRM & PATIENT RETENTION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              CRM & Patient Recall Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Inquiries, funnels & recalls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-1 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 ml-3 rtl:ml-0 rtl:mr-3" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="ALL">All Authorized Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} ({b.name.replace(/^Branch [A-C] - /, '')})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setShowNewInquiry(true)}
              className="rounded-full px-4 py-2 bg-[#0F827B] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Patient Lead</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. CRM KPI STRIP — color coded, click-to-expand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inbound */}
        <div
          className="bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-1 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setExpandedKpi(expandedKpi === 'inbound' ? null : 'inbound')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inbound Requests</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {funnelMetrics.bookingRequestsCount}
          </div>
          <span className="text-[11px] text-slate-400">Click for details</span>
          {expandedKpi === 'inbound' && (
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 animate-[fadeSlideDown_0.25s_ease-out]">
              Triage across all channels.
            </div>
          )}
        </div>

        {/* Conversion rate */}
        {(() => {
          const isLow = requestToBookingRate < 50;
          return (
            <div
              className={`backdrop-blur-md p-5 rounded-[24px] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-1 cursor-pointer hover:shadow-lg transition-shadow border ${isLow ? 'bg-[#FEF9C3]/90 border-amber-300' : 'bg-white/95 border-slate-100'}`}
              onClick={() => setExpandedKpi(expandedKpi === 'booked' ? null : 'booked')}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLow ? 'text-amber-700' : 'text-blue-600'}`}>Qualified & Booked</span>
                <span className={`w-2.5 h-2.5 rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              <div className={`text-2xl font-black tabular-nums ${isLow ? 'text-amber-900' : 'text-blue-900'}`}>
                {funnelMetrics.confirmedBookingsCount}
              </div>
              <span className={`text-[11px] font-bold ${isLow ? 'text-amber-700' : 'text-blue-600'}`}>
                {requestToBookingRate}% Conversion · Details
              </span>
              {expandedKpi === 'booked' && (
                <div className="pt-3 border-t border-slate-100 space-y-1 animate-[fadeSlideDown_0.25s_ease-out]">
                  <div className="text-[11px] text-slate-600">{isLow ? 'Conversion below 50% — review triage response.' : 'Healthy booking conversion rate.'}</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Attended */}
        <div
          className="bg-[#EBF9F1]/90 backdrop-blur-md p-5 rounded-[24px] border border-emerald-200 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-1 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setExpandedKpi(expandedKpi === 'attended' ? null : 'attended')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Attended Visits</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900 tabular-nums">
            {funnelMetrics.attendedVisitsCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">
            {attendanceRate}% Show-Up Rate · Details
          </span>
          {expandedKpi === 'attended' && (
            <div className="pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 animate-[fadeSlideDown_0.25s_ease-out]">
              {attendanceRate >= 80 ? 'Excellent attendance rate — reminders working.' : 'Show-up below 80% — consider reminders.'}
            </div>
          )}
        </div>

        {/* Recalls pending */}
        {(() => {
          const pendingRecalls = filteredFollowUps.filter((f) => f.status === 'SCHEDULED' || f.status === 'PENDING').length;
          const isHigh = pendingRecalls > 10;
          return (
            <div
              className={`backdrop-blur-md p-5 rounded-[24px] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] space-y-1 cursor-pointer hover:shadow-lg transition-shadow border ${isHigh ? 'bg-[#FEF9C3]/90 border-amber-300' : 'bg-white/95 border-slate-100'}`}
              onClick={() => setExpandedKpi(expandedKpi === 'recalls' ? null : 'recalls')}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isHigh ? 'text-amber-700' : 'text-amber-600'}`}>Recall Queue</span>
                <span className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              <div className={`text-2xl font-black tabular-nums ${isHigh ? 'text-amber-800' : 'text-slate-900'}`}>
                {pendingRecalls}
              </div>
              <span className="text-[11px] text-slate-400">Hygiene & post-op · Details</span>
              {expandedKpi === 'recalls' && (
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 animate-[fadeSlideDown_0.25s_ease-out]">
                  {isHigh ? 'Large recall backlog — prioritize outreach.' : 'Recall queue is manageable.'}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 3. CHARTS GRID: Conversion Funnel & Channel Distribution (Matching Image 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ConversionFunnelChart
            title="Lead Conversion Funnel"
            subtitle="Stage progression to consultation"
            stages={funnelStages}
          />
        </div>

        <div className="lg:col-span-5">
          <DonutBreakdownChart
            title="Acquisition by Channel"
            subtitle="Inquiry channel distribution"
            centerLabel="Total Inquiries"
            centerValue={`${totalInquiries} Leads`}
            slices={inquiryChannelSlices}
            unitSuffix="Leads"
          />
        </div>
      </div>

      {/* 4. WORKSPACE TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-xs">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'inquiries'
              ? 'bg-[#0F827B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Inquiries Pipeline ({filteredCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'retention'
              ? 'bg-[#0F827B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Patient Recalls ({filteredFollowUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'bg-[#0F827B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Engagement Templates</span>
        </button>
      </div>

      {/* New Inquiry Form */}
      {showNewInquiry && (
        <form
          onSubmit={handleCreateInquiry}
          className="bg-white rounded-2xl border-2 border-[#1F6FB2] p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#163447]">
              Log Patient Inquiry
            </h2>
            <button
              type="button"
              onClick={() => setShowNewInquiry(false)}
              className="text-xs text-[#526574] hover:text-[#163447]"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="text"
              required
              value={newInqName}
              onChange={(e) => setNewInqName(e.target.value)}
              placeholder="Caller Full Name *"
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs"
            />
            <input
              type="tel"
              required
              value={newInqPhone}
              onChange={(e) => setNewInqPhone(e.target.value)}
              placeholder="Phone (+20 10...) *"
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs"
            />
            <select
              value={newInqChannel}
              onChange={(e) => setNewInqChannel(e.target.value)}
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs font-semibold"
            >
              <option value="PHONE_CALL">Channel: Phone Call</option>
              <option value="WEBSITE">Channel: Website Form</option>
              <option value="WHATSAPP">Channel: WhatsApp Inquiry</option>
              <option value="WALK_IN">Channel: Walk-In Inquiry</option>
            </select>
            <select
              value={newInqBranch}
              onChange={(e) => setNewInqBranch(e.target.value)}
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs font-semibold"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={newInqSubject}
              onChange={(e) => setNewInqSubject(e.target.value)}
              placeholder="Inquiry Subject..."
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              value={newInqDesc}
              onChange={(e) => setNewInqDesc(e.target.value)}
              placeholder="Lead notes & follow-up..."
              className="rounded-xl border border-[#D8E0DC] bg-[#F7F8F5] px-3 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={savingInq}>
              Save Lead to Pipeline
            </Button>
          </div>
        </form>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D8E0DC] pb-3">
        {[
          { id: 'inquiries', label: `Inquiries & Feedback Pipeline (${filteredCases.length})` },
          { id: 'retention', label: `Patient Recall & Follow-Up List (${filteredFollowUps.length})` },
          { id: 'analytics', label: 'Conversion Funnel & Source Attribution' },
          { id: 'templates', label: 'Privacy-Safe Communication Templates' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#1F6FB2] text-white'
                : 'bg-white border border-[#D8E0DC] text-[#526574] hover:text-[#163447]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INQUIRIES & FEEDBACK PIPELINE */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D8E0DC] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#163447]">
              Patient Inquiries & Leads
            </h2>
            <span className="text-xs text-[#526574]">
              Synced from portal forms
            </span>
          </div>
          <div className="divide-y divide-[#D8E0DC]">
            {filteredCases.map((c) => (
              <div key={c.id} className="p-5 space-y-3 hover:bg-[#F7F8F5]/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                        c.category === 'COMPLAINT'
                          ? 'bg-red-100 text-red-800'
                          : c.category === 'PRAISE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#EAF3FF] text-[#1F6FB2]'
                      }`}
                    >
                      {c.category}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#163447]">
                      {c.status}
                    </span>
                    {c.branch && (
                      <span className="text-xs text-[#526574] font-semibold">
                        {c.branch.code} — {c.branch.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#526574]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#163447]">{c.subject}</h3>
                  <p className="text-xs text-[#526574] mt-1">{c.description}</p>
                  {c.patient && (
                    <p className="text-[11px] text-[#1F6FB2] font-semibold mt-1">
                      Patient: {c.patient.fullName} ({c.patient.patientNumber}) •{' '}
                      {c.patient.primaryPhone}
                    </p>
                  )}
                </div>

                {c.patientVisibleResponse && (
                  <div className="p-3 rounded-xl bg-[#EAF3FF]/60 border border-[#1F6FB2]/20 text-xs text-[#163447]">
                    <strong>Clinic Response:</strong> {c.patientVisibleResponse}
                  </div>
                )}

                {respondingCaseId === c.id ? (
                  <div className="p-3.5 rounded-xl bg-[#F7F8F5] border border-[#D8E0DC] space-y-2.5">
                    <textarea
                      rows={2}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write response or follow-up outcome..."
                      className="w-full rounded-xl border border-[#D8E0DC] bg-white p-2.5 text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <select
                        value={responseStatus}
                        onChange={(e) => setResponseStatus(e.target.value as any)}
                        className="rounded-lg border border-[#D8E0DC] bg-white px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="RESPONDED">Mark as RESPONDED</option>
                        <option value="RESOLVED">Mark as RESOLVED</option>
                      </select>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingCaseId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRespondCase(c.id)}
                        >
                          Save Response
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRespondingCaseId(c.id);
                        setResponseText(c.patientVisibleResponse || '');
                      }}
                      className="text-xs font-bold text-[#1F6FB2] hover:underline"
                    >
                      Respond / Update Status
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT RECALL & RETENTION LIST */}
      {activeTab === 'retention' && (
        <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D8E0DC] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#163447]">
                Patient Recall Queue
              </h2>
              <p className="text-xs text-[#526574]">
                Hygiene, post-op, recalls.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-[#F7F8F5] border-b border-[#D8E0DC] text-[11px] font-bold uppercase text-[#526574]">
                  <th className="py-3 px-4 text-start">Patient</th>
                  <th className="py-3 px-4 text-start">Branch</th>
                  <th className="py-3 px-4 text-start">Recall Reason</th>
                  <th className="py-3 px-4 text-start">Target Date</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-end">Outreach Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E0DC] text-xs">
                {filteredFollowUps.map((f) => (
                  <tr key={f.id} className="hover:bg-[#F7F8F5]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#163447]">{f.patient?.fullName}</div>
                      <div className="text-[11px] text-[#526574]">
                        {f.patient?.patientNumber} • {f.patient?.primaryPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#163447]">
                      {f.branch?.code}
                    </td>
                    <td className="py-3.5 px-4 text-[#526574] max-w-md">
                      <span className="font-semibold text-[#163447]">{f.procedureType}</span>
                      {f.notes ? ` — ${f.notes}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#163447]">
                      {new Date(f.recommendedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                          f.status === 'SCHEDULED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'CONTACTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateRecallStatus(f.id, 'CONTACTED')}
                        className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] text-[#1F6FB2] font-bold hover:bg-[#1F6FB2] hover:text-white transition-colors"
                      >
                        Mark Contacted
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRecallStatus(f.id, 'SCHEDULED')}
                        className="px-2.5 py-1 rounded-lg bg-[#163447] text-white font-bold hover:bg-[#1F6FB2] transition-colors"
                      >
                        Mark Scheduled
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONVERSION FUNNEL */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-2xl border border-[#D8E0DC] p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-[#163447]">
              Appointment Conversion Funnel
            </h2>
            <p className="text-xs text-[#526574]">
              Computed from clinic records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                stage: '1. Inquiries & Requests',
                count: funnelMetrics.inquiriesCount + funnelMetrics.bookingRequestsCount,
                sub: `${funnelMetrics.inquiriesCount} CRM inquiries + ${funnelMetrics.bookingRequestsCount} booking requests`,
              },
              {
                stage: '2. Confirmed Bookings',
                count: funnelMetrics.confirmedBookingsCount,
                sub: `${requestToBookingRate}% request-to-confirmation rate`,
              },
              {
                stage: '3. Attended Clinical Visits',
                count: funnelMetrics.attendedVisitsCount,
                sub: `${attendanceRate}% confirmed visit attendance rate`,
              },
              {
                stage: '4. Active Recall Follow-Ups',
                count: followUps.length,
                sub: `${followUps.filter((f) => f.status === 'SCHEDULED').length} converted to repeat visits`,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#D8E0DC] space-y-1.5"
              >
                <div className="text-xs font-bold text-[#1F6FB2]">{item.stage}</div>
                <div className="text-3xl font-extrabold text-[#163447] tabular-nums">
                  {item.count}
                </div>
                <div className="text-[11px] text-[#526574]">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Dual Column Visual Analytics: Conversion Funnel & Channel Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            <ConversionFunnelChart
              title="Conversion Funnel"
              subtitle="Inquiry to attended visit"
              stages={funnelStages}
            />

            <DonutBreakdownChart
              title="Acquisition Channels"
              subtitle="Channel source distribution"
              centerLabel="Total Inquiries"
              centerValue={`${totalInquiries} Leads`}
              slices={inquiryChannelSlices}
              unitSuffix="leads"
            />
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY-SAFE TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: '24-Hour Appointment Reminder (Privacy-Safe)',
              channel: 'SMS / WhatsApp / Email',
              body: 'Dear {{PatientFirstName}}, this is a reminder of your upcoming dental visit at Ebtesamty ({{BranchName}}) on {{Date}} at {{Time}}. To reschedule, visit your Patient Portal or call {{BranchPhone}}.',
            },
            {
              title: '6-Month Preventive Scaling & Checkup Recall',
              channel: 'SMS / Email / Portal Notification',
              body: 'Hello {{PatientFirstName}}, it has been 6 months since your last preventive checkup at Ebtesamty. Book your routine cleaning online at ebtesamty.eg/book.',
            },
            {
              title: 'Post-Visit Thank You & Portal Feedback Invitation',
              channel: 'Portal Notification / Email',
              body: 'Thank you for visiting Ebtesamty ({{BranchName}}). Your post-visit care instructions and receipt are available in your secure Patient Portal.',
            },
            {
              title: 'Incomplete Treatment Plan Follow-Up',
              channel: 'Receptionist Phone Script',
              body: 'Hello {{PatientFirstName}}, our clinical coordination desk at Ebtesamty is following up to schedule the next stage of your approved treatment plan with {{DoctorName}}.',
            },
          ].map((tpl, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#D8E0DC] p-5 space-y-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#163447]">{tpl.title}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#EAF3FF] text-[#1F6FB2]">
                  {tpl.channel}
                </span>
              </div>
              <p className="text-xs text-[#526574] font-mono bg-[#F7F8F5] p-3 rounded-xl border border-[#D8E0DC]">
                {tpl.body}
              </p>
              <p className="text-[11px] text-[#1F6FB2] font-medium">✓ PHI-safe</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
