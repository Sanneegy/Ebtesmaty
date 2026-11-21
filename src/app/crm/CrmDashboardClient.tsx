'use client';
import {LocalizedInput,LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import {LeadActivity} from './LeadActivity';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
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
import LeadFollowupCrmPhaseThree from '@/components/phase3/LeadFollowupCrmPhaseThree';
import InboxWhatsAppPhaseThree from '@/components/phase3/InboxWhatsAppPhaseThree';
import WebsiteReviewsPhaseThree from '@/components/phase3/WebsiteReviewsPhaseThree';

interface CrmDashboardClientProps {
  cohort:{source:string;branchId:string;status:string;appointment:{status:string}|null}[];
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
  cohort,
}: CrmDashboardClientProps) {
  const view=useSearchParams().get('view');const activeTab=view==='retention'||view==='analytics'||view==='templates'||view==='feedback'||view==='inbox'?view:'inquiries';
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [cases, setCases] = useState<any[]>(initialCases);
  const [followUps, setFollowUps] = useState<any[]>(initialFollowUps);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [pipelineMode, setPipelineMode] = useState<'list' | 'kanban'>('list');
  const [selectedInboxCaseId, setSelectedInboxCaseId] = useState<string | null>(initialCases[0]?.id || null);
  const [lostReasonModalId, setLostReasonModalId] = useState<string | null>(null);
  const [lostReasonChoice, setLostReasonChoice] = useState('Price');
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('VISIT_COMPLETED');
  const [newRuleDelay, setNewRuleDelay] = useState('24');
  const [newRuleChannel, setNewRuleChannel] = useState('WHATSAPP');
  const [newRuleTemplate, setNewRuleTemplate] = useState('Hello {{patientName}}, thank you for visiting Ebtesamty! Please rate your visit in the Patient Portal.');

  React.useEffect(() => {
    fetch('/api/platform/operations?module=team_and_automation')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.automationRules) setAutomationRules(d.automationRules);
      })
      .catch(() => {});
  }, []);

  // New Inquiry Modal / Inline Form
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInqName, setNewInqName] = useState('');
  const [newInqPhone, setNewInqPhone] = useState('');
  const [newInqBranch, setNewInqBranch] = useState(branches[0]?.id || '');
  const [newInqChannel, setNewInqChannel] = useState('PHONE_CALL');
  const [newInqSubject, setNewInqSubject] = useState('');
  const [newInqDesc, setNewInqDesc] = useState('');
  const [crmNotice,setCrmNotice]=useState('');
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
          sourceChannel:newInqChannel,subject:newInqSubject,
          description: newInqDesc,
        }),
      });
      const data = await res.json();
      if(!res.ok){setCrmNotice(data.error||'Could not save inquiry');return;}
      if (res.ok && data.feedback) {setCrmNotice('Inquiry saved');
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
    if(!res.ok){setCrmNotice(data.error||'Could not save response');return;}
    if (res.ok && data.case) {setCrmNotice('Response saved');
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
    if(!res.ok){setCrmNotice(data.error||'Could not update recall');return;}
    if (res.ok && data.followUp) {setCrmNotice('Follow-up updated');
      setFollowUps((prev) => prev.map((f) => (f.id === followUpId ? data.followUp : f)));
    }
  };

  const selectedBranch=branches.find(b=>b.id===branchFilter||b.code===branchFilter);
  const records=filteredCases.filter(c=>c.category==='INQUIRY').map(c=>({source:c.sourceChannel||'UNATTRIBUTED',status:c.activities?.length?'IN_REVIEW':'REQUESTED',appointment:c.linkedRequest?.appointment}));
  const funnelMetrics={bookingRequestsCount:records.length,confirmedBookingsCount:records.filter(r=>r.appointment).length,attendedVisitsCount:records.filter(r=>r.appointment?.status==='COMPLETED').length,contactedRequestsCount:records.filter(r=>r.appointment||['IN_REVIEW','ALTERNATIVE_PROPOSED','AWAITING_PATIENT','CONFIRMED'].includes(r.status)).length,inquiriesCount:filteredCases.filter(c=>c.category==='INQUIRY').length,totalFeedbackCount:filteredCases.length};
  const requestToBookingRate =
    funnelMetrics.bookingRequestsCount > 0
      ? Math.round(
          (funnelMetrics.confirmedBookingsCount / funnelMetrics.bookingRequestsCount) * 100
        )
      : 0;

  const attendanceRate =
    funnelMetrics.confirmedBookingsCount > 0
      ? Math.round(
          (funnelMetrics.attendedVisitsCount / funnelMetrics.confirmedBookingsCount) * 100
        )
      : 0;

  const inquiryChannelSlices:DonutSlice[]=Object.entries(records.reduce<Record<string,number>>((a,r)=>{a[r.source]=(a[r.source]||0)+1;return a;},{})).map(([id,value],i)=>({id,value,label:id.replaceAll('_',' '),color:['#4169E1','#102A5E','#925738','#467693','#515862'][i%5]}));
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
        label: '1. Recorded inquiries',
        count: stage1,
        helperText: `${stage1} recorded inquiries in this cohort`,
        color: '#102A5E',
      },
      {
        id: 'contacted_qualified',
        label: '2. Triage Contacted & Verified',
        count: stage2,
        helperText: `${contactPct}% of cohort reached by receptionist / triage desk`,
        color: '#4169E1',
      },
      {
        id: 'scheduled_bookings',
        label: '3. Operatory Appointments Booked',
        count: stage3,
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
      {crmNotice&&<p role="status" className="surface-card"><TranslatedText text={crmNotice}/></p>}{/* 1. TOP HEADER — frosted glass */}
      <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
              <span><TranslatedText text="MARKETING, CRM & PATIENT RETENTION" /></span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text={{inquiries:"Inquiries & Leads",inbox:"Shared Omnichannel Inbox",retention:"Recall & Follow-up",analytics:"Conversion & Attribution",feedback:"Patient Feedback",templates:"Automation & Templates"}[activeTab]} /> </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl"> <TranslatedText text="Inquiries, funnels & recalls." /> </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-1 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 ml-3 rtl:ml-0 rtl:mr-3" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="ALL"><TranslatedText text="All Authorized Branches" /></option>
                {branches.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code} ({b.name.replace(/^Branch [A-C] - /, '')})
                  </option>
                ))}
              </select>
            </div>

            <Button
              hidden={activeTab!=='inquiries'} onClick={() => setShowNewInquiry(true)}
              className="rounded-full px-4 py-2 bg-[#2446A6] hover:bg-[#0c6b65] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span><TranslatedText text="Log Patient Lead" /></span>
            </Button>
          </div>
        </div>

        {/* CRM & Communication Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'inquiries', href: '/crm', label: 'Lead Pipeline & Kanban' },
              { key: 'inbox', href: '/crm?view=inbox', label: 'Shared Inbox (WhatsApp / Meta)' },
              { key: 'retention', href: '/crm?view=retention', label: 'Recalls & Follow-Ups' },
              { key: 'templates', href: '/crm?view=templates', label: 'Automation Rule Builder' },
              { key: 'analytics', href: '/crm?view=analytics', label: 'Conversion Funnel' },
              { key: 'feedback', href: '/crm?view=feedback', label: 'Verified Reviews' },
            ].map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#4169E1] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-[#EAF3FF] hover:text-[#2446A6]'
                }`}
              >
                <TranslatedText text={tab.label} />
              </Link>
            ))}
          </div>
          {activeTab === 'inquiries' && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPipelineMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  pipelineMode === 'list' ? 'bg-white text-[#102A5E] shadow-2xs' : 'text-slate-600'
                }`}
              >
                <TranslatedText text="List View" />
              </button>
              <button
                type="button"
                onClick={() => setPipelineMode('kanban')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  pipelineMode === 'kanban' ? 'bg-white text-[#102A5E] shadow-2xs' : 'text-slate-600'
                }`}
              >
                <TranslatedText text="Kanban Board" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PHASE 3 CRM, TEAM INBOX & WHATSAPP (+201200054405), AND WEBSITE REVIEWS SUITE (Images 1–7) */}
      <LeadFollowupCrmPhaseThree role="clinic_owner" />
      <InboxWhatsAppPhaseThree role="clinic_owner" />
      <WebsiteReviewsPhaseThree role="clinic_owner" />

      {/* KANBAN PIPELINE VIEW (When pipelineMode === 'kanban' in inquiries tab) */}
      {activeTab === 'inquiries' && pipelineMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { stage: 'NEW', title: 'New Enquiry', filter: (c: any) => c.status === 'OPEN' && !c.activities?.length },
            { stage: 'CONTACTED', title: 'Contacted / Quote Sent', filter: (c: any) => c.status === 'OPEN' && c.activities?.length > 0 },
            { stage: 'BOOKED', title: 'Appointment Booked', filter: (c: any) => !!c.linkedRequest },
            { stage: 'CONVERTED', title: 'Converted Patient', filter: (c: any) => c.status === 'RESOLVED' },
            { stage: 'LOST', title: 'Lost (Reason Logged)', filter: (c: any) => c.status === 'CLOSED' },
          ].map((col) => {
            const colCases = filteredCases.filter(col.filter);
            return (
              <div key={col.stage} className="bg-white rounded-2xl border border-[#DCE5EE] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-extrabold text-[#102A5E] uppercase tracking-wider">
                    <TranslatedText text={col.title} />
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#4169E1] text-xs font-bold">
                    {colCases.length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {colCases.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#F7FAFF] border border-[#DCE5EE] text-xs space-y-1.5">
                      <div className="font-bold text-[#102A5E]">{c.patient?.fullName || c.subject}</div>
                      <p className="text-slate-600 line-clamp-2">{c.description}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>{c.sourceChannel || 'WEB'}</span>
                        <button
                          type="button"
                          onClick={() => setLostReasonModalId(c.id)}
                          className="text-rose-700 font-bold hover:underline"
                        >
                          <TranslatedText text="Mark Lost" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MANDATORY LOST REASON MODAL */}
      {lostReasonModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-[#102A5E]">
              <TranslatedText text="Select Mandatory Lost Lead Reason" />
            </h3>
            <select
              value={lostReasonChoice}
              onChange={(e) => setLostReasonChoice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold"
            >
              <option value="Price">Price / Budget</option>
              <option value="No Response">No Response after Follow-ups</option>
              <option value="Location">Branch Location Distance</option>
              <option value="Changed Mind">Changed Mind / Deferred</option>
              <option value="Competitor">Chose Another Clinic</option>
              <option value="Timing">Schedule / Timing Mismatch</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLostReasonModalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                <TranslatedText text="Cancel" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/feedback/${lostReasonModalId}/respond`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patientVisibleResponse: `Lead closed (${lostReasonChoice})`,
                      internalNotes: `Lost Reason: ${lostReasonChoice}`,
                      status: 'CLOSED',
                    }),
                  });
                  setCases((prev) =>
                    prev.map((x) => (x.id === lostReasonModalId ? { ...x, status: 'CLOSED' } : x))
                  );
                  setLostReasonModalId(null);
                  setCrmNotice(`Lead marked Lost (${lostReasonChoice})`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                <TranslatedText text="Confirm Lost Status" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT-PANE SHARED INBOX VIEW (WhatsApp / Instagram / Messenger / Portal + AI Reply Draft) */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-white rounded-3xl border border-[#DCE5EE] overflow-hidden shadow-xs min-h-[520px]">
          {/* Left Pane: Conversation List & Channel Status */}
          <div className="lg:col-span-5 border-e border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-[#102A5E]">
                <TranslatedText text="Omnichannel Shared Inbox" />
              </h2>
              <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Portal: Live
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  WhatsApp: Sandbox
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  IG/FB: Disconnected
                </span>
              </div>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {filteredCases.map((c: any) => {
                const isSelected = (selectedInboxCaseId || filteredCases[0]?.id) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedInboxCaseId(c.id);
                      setRespondingCaseId(c.id);
                    }}
                    className={`w-full text-start p-3.5 rounded-2xl border transition-all text-xs space-y-1 ${
                      isSelected
                        ? 'bg-[#EFF5FF] border-[#4169E1] shadow-2xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[#102A5E]">{c.patient?.fullName || c.subject}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                        {c.sourceChannel || 'PORTAL'}
                      </span>
                    </div>
                    <p className="text-slate-600 truncate">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Selected Conversation & AI Assistant Draft */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4">
            {(() => {
              const activeCase =
                filteredCases.find((c: any) => c.id === selectedInboxCaseId) || filteredCases[0];
              if (!activeCase) return <p className="text-xs text-slate-500">Select a conversation</p>;
              return (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-extrabold text-[#102A5E]">
                          {activeCase.patient?.fullName || activeCase.subject}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {activeCase.branch?.name} · Channel: {activeCase.sourceChannel || 'PORTAL'} · Status:{' '}
                          {activeCase.status}
                        </p>
                      </div>
                      <Link
                        href="/reception"
                        className="px-3 py-1.5 rounded-xl bg-[#EAF3FF] text-[#2446A6] text-xs font-bold"
                      >
                        <TranslatedText text="Book / Link Patient" />
                      </Link>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        <TranslatedText text="Inbound Patient / Lead Message" />
                      </span>
                      <p className="text-slate-800 leading-relaxed">{activeCase.description}</p>
                    </div>

                    {activeCase.patientVisibleResponse && (
                      <div className="p-4 rounded-2xl bg-[#EFF5FF] border border-[#B5D3FA] text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#4169E1] block">
                          <TranslatedText text="Sent Clinic Reply" />
                        </span>
                        <p className="text-[#102A5E]">{activeCase.patientVisibleResponse}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#102A5E]">
                        <TranslatedText text="Reply Composer & AI Draft Assistant" />
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setResponseText(
                            `Hello ${activeCase.patient?.fullName || 'valued patient'}, thank you for contacting Ebtesamty (${activeCase.branch?.name || 'Cairo'}). Our clinics are open daily 9:00 AM – 9:00 PM. We would be happy to schedule your consultation—please confirm your preferred time.`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAF3FF] text-[#4169E1] text-xs font-bold hover:bg-[#4169E1] hover:text-white transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span><TranslatedText text="Generate AI Draft (Requires Human Review)" /></span>
                      </button>
                    </div>
                    <LocalizedTextarea
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Review or edit reply before sending to patient..."
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespondCase(activeCase.id)}
                        className="px-4 py-2 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span><TranslatedText text="Approve & Send Reply" /></span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* New Inquiry Form */}
      {showNewInquiry && (
        <form
          onSubmit={handleCreateInquiry}
          className="bg-white rounded-2xl border-2 border-[#4169E1] p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A5E]"> <TranslatedText text="Log Patient Inquiry" /> </h2>
            <button
              type="button"
              onClick={() => setShowNewInquiry(false)}
              className="text-xs text-[#526574] hover:text-[#102A5E]"
            > <TranslatedText text="Cancel" /> </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <LocalizedInput
              type="text"
              required
              value={newInqName}
              onChange={(e) => setNewInqName(e.target.value)}
              placeholder="Caller Full Name *"
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs"
            />
            <LocalizedInput
              type="tel"
              required
              value={newInqPhone}
              onChange={(e) => setNewInqPhone(e.target.value)}
              placeholder="Phone (+20 10...) *"
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs"
            />
            <select
              value={newInqChannel}
              onChange={(e) => setNewInqChannel(e.target.value)}
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold"
            >
              <option value="PHONE_CALL"><TranslatedText text="Channel: Phone Call" /></option>
              <option value="WEBSITE"><TranslatedText text="Channel: Website Form" /></option>
              <option value="WHATSAPP"><TranslatedText text="Channel: WhatsApp Inquiry" /></option>
              <option value="WALK_IN"><TranslatedText text="Channel: Walk-In Inquiry" /></option>
            </select>
            <select
              value={newInqBranch}
              onChange={(e) => setNewInqBranch(e.target.value)}
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  <TranslatedText text={String(b.name)}/>
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LocalizedInput
              type="text"
              required
              value={newInqSubject}
              onChange={(e) => setNewInqSubject(e.target.value)}
              placeholder="Inquiry Subject..."
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs"
            />
            <LocalizedInput
              type="text"
              required
              value={newInqDesc}
              onChange={(e) => setNewInqDesc(e.target.value)}
              placeholder="Lead notes & follow-up..."
              className="rounded-xl border border-[#D8E0DC] bg-[#F7FAFF] px-3 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={savingInq}> <TranslatedText text="Save Lead to Pipeline" /> </Button>
          </div>
        </form>
      )}

      {/* TAB 1: INQUIRIES & FEEDBACK PIPELINE */}
      {(activeTab === 'inquiries'||activeTab==='feedback') && (
        <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D8E0DC] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102A5E]"> <TranslatedText text={activeTab==='feedback'?'Feedback & Reviews':'Patient Inquiries & Leads'}/> </h2>
            <span className="text-xs text-[#526574]"> <TranslatedText text="Synced from portal forms" /> </span>
          </div>
          <div className="divide-y divide-[#D8E0DC]">
            {filteredCases.filter(c=>activeTab==='feedback'?c.category!=='INQUIRY':c.category==='INQUIRY').map((c) => (
              <div key={c.id} className="p-5 space-y-3 hover:bg-[#F7FAFF]/50">{c.category==='INQUIRY'&&<LeadActivity lead={c} bookings={cohort} onSaved={updated=>setCases(prev=>prev.map(v=>v.id===updated.id?updated:v))}/>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase ${
                        c.category === 'COMPLAINT'
                          ? 'bg-red-100 text-red-800'
                          : c.category === 'PRAISE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#EAF3FF] text-[#4169E1]'
                      }`}
                    >
                      {c.category}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#102A5E]">
                      <TranslatedText text={String(c.status)}/>
                    </span>
                    {c.branch && (
                      <span className="text-xs text-[#526574] font-semibold">
                        {c.branch.code} — <TranslatedText text={String(c.branch.name)}/>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#526574]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#102A5E]">{c.subject}</h3>
                  <p className="text-xs text-[#526574] mt-1"><TranslatedText text={String(c.description)}/></p>
                  {c.patient && (
                    <p className="text-xs text-[#4169E1] font-semibold mt-1"> <TranslatedText text="Patient:" /> {c.patient.fullName} ({c.patient.patientNumber}) •{' '}
                      {c.patient.primaryPhone}
                    </p>
                  )}
                </div>

                {c.patientVisibleResponse && (
                  <div className="p-3 rounded-xl bg-[#EAF3FF]/60 border border-[#4169E1]/20 text-xs text-[#102A5E]">
                    <strong><TranslatedText text="Clinic Response:" /></strong> {c.patientVisibleResponse}
                  </div>
                )}

                {respondingCaseId === c.id ? (
                  <div className="p-3.5 rounded-xl bg-[#F7FAFF] border border-[#D8E0DC] space-y-2.5">
                    <LocalizedTextarea
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
                        <option value="RESPONDED"><TranslatedText text="Mark as RESPONDED" /></option>
                        <option value="RESOLVED"><TranslatedText text="Mark as RESOLVED" /></option>
                      </select>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingCaseId(null)}
                        > <TranslatedText text="Cancel" /> </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRespondCase(c.id)}
                        > <TranslatedText text="Save Response" /> </Button>
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
                      className="text-xs font-bold text-[#4169E1] hover:underline"
                    > <TranslatedText text="Respond / Update Status" /> </button>
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
              <h2 className="text-base font-bold text-[#102A5E]"> <TranslatedText text="Patient Recall Queue" /> </h2>
              <p className="text-xs text-[#526574]"> <TranslatedText text="Hygiene, post-op, recalls." /> </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-[#F7FAFF] border-b border-[#D8E0DC] text-xs font-bold uppercase text-[#526574]">
                  <th className="py-3 px-4 text-start"><TranslatedText text="Patient" /></th>
                  <th className="py-3 px-4 text-start"><TranslatedText text="Branch" /></th>
                  <th className="py-3 px-4 text-start"><TranslatedText text="Recall Reason" /></th>
                  <th className="py-3 px-4 text-start"><TranslatedText text="Target Date" /></th>
                  <th className="py-3 px-4 text-start"><TranslatedText text="Status" /></th>
                  <th className="py-3 px-4 text-end"><TranslatedText text="Outreach Action" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E0DC] text-xs">
                {filteredFollowUps.map((f) => (
                  <tr key={f.id} className="hover:bg-[#F7FAFF]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#102A5E]">{f.patient?.fullName}</div>
                      <div className="text-xs text-[#526574]">
                        {f.patient?.patientNumber} • {f.patient?.primaryPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#102A5E]">
                      {f.branch?.code}
                    </td>
                    <td className="py-3.5 px-4 text-[#526574] max-w-md">
                      <span className="font-semibold text-[#102A5E]">{f.procedureType}</span>
                      {f.notes ? ` — ${f.notes}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#102A5E]">
                      {new Date(f.recommendedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded ${
                          f.status === 'SCHEDULED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'CONTACTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        <TranslatedText text={String(f.status)}/>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateRecallStatus(f.id, 'CONTACTED')}
                        className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] text-[#4169E1] font-bold hover:bg-[#4169E1] hover:text-white transition-colors"
                      > <TranslatedText text="Mark Contacted" /> </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRecallStatus(f.id, 'SCHEDULED')}
                        className="px-2.5 py-1 rounded-lg bg-[#102A5E] text-white font-bold hover:bg-[#4169E1] transition-colors"
                      > <TranslatedText text="Mark Scheduled" /> </button>
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
            <h2 className="text-base font-bold text-[#102A5E]"> <TranslatedText text="Appointment Conversion Funnel" /> </h2>
            <p className="text-xs text-[#526574]"> <TranslatedText text="Computed from clinic records." /> </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                stage: '1. Inquiries & Requests',
                count: funnelMetrics.bookingRequestsCount,
                sub: `${funnelMetrics.bookingRequestsCount} inquiries`,
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
                className="p-5 rounded-2xl bg-[#F7FAFF] border border-[#D8E0DC] space-y-1.5"
              >
                <div className="text-xs font-bold text-[#4169E1]">{item.stage}</div>
                <div className="text-3xl font-extrabold text-[#102A5E] tabular-nums">
                  {item.count}
                </div>
                <div className="text-xs text-[#526574]">{item.sub}</div>
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

      {activeTab==='retention'&&<Link className="secondary-button" href="/crm?view=templates"><TranslatedText text="Communication templates"/></Link>}
      {/* TAB 4: VISUAL AUTOMATION RULE BUILDER & PRIVACY-SAFE TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#DCE5EE] p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#102A5E]">
                  <TranslatedText text="Visual Message Automation Rule Builder" />
                </h2>
                <p className="text-xs text-slate-500">
                  <TranslatedText text="Configure Trigger → Delay → Channel → Approved Template → Stop Condition (No duplicate loops)" />
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch('/api/platform/operations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'CREATE_AUTOMATION_RULE',
                    nameEn: newRuleName || 'Post-Visit Follow-up & Review Rule',
                    triggerEvent: newRuleTrigger,
                    delayHours: Number(newRuleDelay) || 24,
                    channel: newRuleChannel,
                    templateTextEn: newRuleTemplate,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setAutomationRules((prev) => [...prev, data.automationRule]);
                  setNewRuleName('');
                  setCrmNotice('Automation rule created and enabled');
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#F7FAFF] border border-[#DCE5EE]"
            >
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Rule Name (e.g. Post-Visit Review)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
              />
              <select
                value={newRuleTrigger}
                onChange={(e) => setNewRuleTrigger(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white font-semibold"
              >
                <option value="VISIT_COMPLETED">Trigger: Visit Completed</option>
                <option value="APPOINTMENT_BOOKED">Trigger: Appointment Booked</option>
                <option value="APPOINTMENT_MISSED">Trigger: No-Show / Missed</option>
                <option value="INSTALLMENT_DUE">Trigger: Installment Due</option>
              </select>
              <input
                type="number"
                value={newRuleDelay}
                onChange={(e) => setNewRuleDelay(e.target.value)}
                placeholder="Delay (Hours)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
              />
              <select
                value={newRuleChannel}
                onChange={(e) => setNewRuleChannel(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white font-semibold"
              >
                <option value="WHATSAPP">Channel: WhatsApp</option>
                <option value="SMS">Channel: SMS</option>
                <option value="IN_APP">Channel: Patient Portal</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white text-xs font-bold"
              >
                <TranslatedText text="+ Save Automation Rule" />
              </button>
            </form>

            <div className="space-y-2.5">
              {automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-[#102A5E]">{rule.nameEn}</strong>
                      <span className="px-2 py-0.5 rounded bg-[#EAF3FF] text-[#2446A6] font-mono text-[10px]">
                        {rule.triggerEvent} → +{rule.delayHours}h → {rule.channel}
                      </span>
                      <span className="text-[10px] text-slate-500">Stop: {rule.stopCondition}</span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px]">{rule.templateTextEn}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">{rule.runCount || 0} runs</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch('/api/platform/operations', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'TOGGLE_AUTOMATION_RULE',
                            ruleId: rule.id,
                            isEnabled: !rule.isEnabled,
                          }),
                        });
                        if (res.ok) {
                          setAutomationRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
                          );
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rule.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {rule.isEnabled ? 'Enabled' : 'Paused'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                <span className="text-xs font-bold text-[#102A5E]"><TranslatedText text={String(tpl.title)}/></span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#EAF3FF] text-[#4169E1]">
                  {tpl.channel}
                </span>
              </div>
              <p className="text-xs text-[#526574] font-mono bg-[#F7FAFF] p-3 rounded-xl border border-[#D8E0DC]">
                {tpl.body}
              </p>
              <p className="text-xs text-[#4169E1] font-medium"><TranslatedText text="✓ PHI-safe" /></p>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
