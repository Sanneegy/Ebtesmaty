'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToothChart } from '@/components/clinical/ToothChart';
import { 
  ArrowLeft, 
  Activity, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Plus, 
  Image as ImageIcon, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Props {
  currentUser: any;
  patientId: string;
  initialSummary: any;
  branches: any[];
}

export function DentistPatientChartClient({
  currentUser,
  patientId,
  initialSummary,
  branches,
}: Props) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [activeTab, setActiveTab] = useState<'chart' | 'encounters' | 'treatment' | 'documents' | 'intake'>('chart');
  
  // Encounter Form State
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [encounterBranchId, setEncounterBranchId] = useState(branches[0]?.id || '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savingEncounter, setSavingEncounter] = useState(false);

  // Addendum Modal State
  const [showAddendumModal, setShowAddendumModal] = useState<string | null>(null);
  const [addendumText, setAddendumText] = useState('');
  const [savingAddendum, setSavingAddendum] = useState(false);

  // Finalize Modal State
  const [showFinalizeModal, setShowFinalizeModal] = useState<string | null>(null);
  const [finalizedDiagnosis, setFinalizedDiagnosis] = useState('');
  const [savingFinalize, setSavingFinalize] = useState(false);

  // Treatment Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [planItems, setPlanItems] = useState<Array<{ procedureName: string; toothNumber: string; estimatedCostPiasters: number }>>([
    { procedureName: '', toothNumber: '', estimatedCostPiasters: 0 }
  ]);
  const [savingPlan, setSavingPlan] = useState(false);

  // Document Upload State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFileName, setDocFileName] = useState('');
  const [docCategory, setDocCategory] = useState('XRAY_PANORAMIC');
  const [docNotes, setDocNotes] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  const patient = summary.patient;
  const latestIntake = summary.latestReviewedIntake;

  async function refreshSummary() {
    try {
      const res = await fetch(`/api/clinical/summary?patientId=${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to refresh summary:', err);
    }
  }

  // Handle Encounter Creation
  async function handleCreateEncounter(e: React.FormEvent) {
    e.preventDefault();
    setSavingEncounter(true);
    try {
      const res = await fetch('/api/clinical/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId: encounterBranchId,
          chiefComplaint,
          examinationFindings,
          provisionalDiagnosis,
          clinicalNotes,
        }),
      });
      if (res.ok) {
        setShowEncounterModal(false);
        setChiefComplaint('');
        setExaminationFindings('');
        setProvisionalDiagnosis('');
        setClinicalNotes('');
        await refreshSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEncounter(false);
    }
  }

  // Handle Encounter Finalization
  async function handleFinalizeEncounter(encounterId: string) {
    if (!finalizedDiagnosis.trim()) return;
    setSavingFinalize(true);
    try {
      const res = await fetch(`/api/clinical/encounters/${encounterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FINALIZE',
          finalizedDiagnosis,
        }),
      });
      if (res.ok) {
        setShowFinalizeModal(null);
        setFinalizedDiagnosis('');
        await refreshSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFinalize(false);
    }
  }

  // Handle Addendum Creation
  async function handleAddAddendum(encounterId: string) {
    if (!addendumText.trim()) return;
    setSavingAddendum(true);
    try {
      const res = await fetch(`/api/clinical/encounters/${encounterId}/addenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addendumText }),
      });
      if (res.ok) {
        setShowAddendumModal(null);
        setAddendumText('');
        await refreshSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddendum(false);
    }
  }

  // Handle Treatment Plan Creation
  async function handleCreateTreatmentPlan(e: React.FormEvent) {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const res = await fetch('/api/clinical/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId: branches[0]?.id,
          title: planTitle,
          notes: planNotes,
          items: planItems.filter((it) => it.procedureName.trim().length > 0),
        }),
      });
      if (res.ok) {
        setShowPlanModal(false);
        setPlanTitle('');
        setPlanNotes('');
        setPlanItems([{ procedureName: '', toothNumber: '', estimatedCostPiasters: 0 }]);
        await refreshSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPlan(false);
    }
  }

  // Handle Document Creation
  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    setSavingDoc(true);
    try {
      const res = await fetch('/api/clinical/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId: branches[0]?.id,
          fileName: docFileName,
          fileMime: 'image/png',
          fileSizeBytes: 1024000,
          fileCategory: docCategory,
          notes: docNotes,
        }),
      });
      if (res.ok) {
        setShowDocModal(false);
        setDocFileName('');
        setDocNotes('');
        await refreshSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDoc(false);
    }
  }

  // Extract medical alerts from latest reviewed questionnaire
  const intakeAnswers = latestIntake?.answersJson as Record<string, any> || {};
  const hasAllergies = intakeAnswers.allergies === true;
  const hasBleeding = intakeAnswers.bleedingDisorder === true;
  const hasHeartCondition = intakeAnswers.heartCondition === true;
  const hasDiabetes = intakeAnswers.diabetes === true;
  const hasHypertension = intakeAnswers.hypertension === true;
  const anyAlerts = hasAllergies || hasBleeding || hasHeartCondition || hasDiabetes || hasHypertension;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. CLINICIAN HEADER & PATIENT OVERVIEW (Matching Image 1 & 5) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <Link
                href="/dentist"
                className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors shrink-0"
                title="Return to Dentist Desk"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                  <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
                  <span>ELECTRONIC DENTAL RECORD (EDR)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{patient.fullName}</h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                    {patient.patientNumber}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#EBF9F1] text-[#0F827B]">
                    {patient.gender}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Primary Branch: <span className="font-semibold text-slate-700">{patient.primaryBranch?.name || 'Heliopolis'}</span> • Phone: <span className="font-semibold text-slate-700">{patient.primaryPhone}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocModal(true)}
                className="rounded-full px-4 py-2 text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>Attach Radiograph</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEncounterModal(true)}
                className="rounded-full px-4 py-2 text-xs font-bold bg-[#0F827B] hover:bg-[#0c6b65] text-white shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Start Encounter</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Clinical Alerts Banner */}
        {anyAlerts ? (
          <div className="p-5 rounded-[24px] bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                Critical Intake Alerts
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {hasAllergies && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300">
                    ⚠ ALLERGIES NOTED: {intakeAnswers.allergyDetails || 'Yes'}
                  </span>
                )}
                {hasBleeding && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300">
                    ⚠ BLEEDING / ANTICOAGULANT RISK
                  </span>
                )}
                {hasHeartCondition && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                    ⚠ CARDIAC CONDITION
                  </span>
                )}
                {hasDiabetes && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                    DIABETIC PATIENT
                  </span>
                )}
                {hasHypertension && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                    HYPERTENSION
                  </span>
                )}
              </div>
            </div>
            {latestIntake?.reviews[0]?.clinicalNotes && (
              <div className="hidden lg:block max-w-xs text-xs text-rose-800 bg-white/80 p-3 rounded-2xl border border-rose-200 shadow-2xs">
                <span className="font-bold block text-[10px] text-slate-400 uppercase tracking-wider">Reviewing Dentist Note:</span>
                "{latestIntake.reviews[0].clinicalNotes}"
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-[24px] bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 shadow-xs">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Intake Verified: No contraindications.</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">Treating Clinician Verified</span>
          </div>
        )}

        {/* Tab Navigation with Rounded Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-xs">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chart'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>FDI Tooth Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'encounters'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Clinical Encounters ({summary.encounters?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('treatment')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'treatment'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Treatment Plans ({summary.treatmentPlans?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Radiographs &amp; Records ({summary.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'intake'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Intake Submissions ({summary.allSubmissions?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Interactive Tooth Chart */}
        {activeTab === 'chart' && (
          <ToothChart
            toothChart={summary.toothChart}
            patientId={patientId}
            onToothUpdated={refreshSummary}
          />
        )}

        {/* Tab 2: Encounters Timeline & Note Management */}
        {activeTab === 'encounters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">Clinical Visit Encounters</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEncounterModal(true)}
              >
                + New Encounter
              </Button>
            </div>

            {summary.encounters.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Encounters Recorded Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Start encounter documentation.
                </p>
              </div>
            ) : (
              summary.encounters.map((enc: any) => (
                <div key={enc.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Visit on {new Date(enc.startedAt).toLocaleDateString()} at {new Date(enc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant={enc.status === 'FINALIZED' ? 'teal' : 'warning'}>
                        {enc.status}
                      </Badge>
                      {enc.status === 'FINALIZED' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-teal-600" />
                          <span>Locked & Immutable</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Clinician: <span className="font-semibold text-slate-700">{enc.dentistUser?.fullName}</span> ({enc.branch?.name})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chief Complaint</span>
                      <p className="text-xs text-slate-800 font-medium">{enc.chiefComplaint}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Examination Findings</span>
                      <p className="text-xs text-slate-800">{enc.examinationFindings}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {enc.status === 'FINALIZED' ? 'Finalized Diagnosis' : 'Provisional Diagnosis'}
                      </span>
                      <p className="text-xs text-slate-800 font-bold text-teal-900">
                        {enc.finalizedDiagnosis || enc.provisionalDiagnosis || 'None recorded'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Procedure Notes</span>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{enc.clinicalNotes}</p>
                    </div>
                  </div>

                  {/* Addenda List */}
                  {enc.addenda && enc.addenda.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                        Signed Clinical Addenda ({enc.addenda.length})
                      </span>
                      <div className="space-y-2">
                        {enc.addenda.map((ad: any) => (
                          <div key={ad.id} className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/60 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-teal-800 font-bold mb-1">
                              <span>Signed by {ad.dentistUser?.fullName}</span>
                              <span>{new Date(ad.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-800">{ad.addendumText}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddendumModal(enc.id)}
                    >
                      + Add Signed Addendum
                    </Button>
                    {enc.status === 'DRAFT' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setShowFinalizeModal(enc.id);
                          setFinalizedDiagnosis(enc.provisionalDiagnosis || '');
                        }}
                      >
                        Sign & Finalize Encounter
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Treatment Plans */}
        {activeTab === 'treatment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Treatment Plans</h3>
                <p className="text-xs text-slate-500">Procedures and estimated costs.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPlanModal(true)}
              >
                + Create Treatment Plan
              </Button>
            </div>

            {summary.treatmentPlans.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Treatment Plans Established</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Create staged treatment plan.
                </p>
              </div>
            ) : (
              summary.treatmentPlans.map((plan: any) => (
                <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{plan.title}</h4>
                        <Badge variant={plan.status === 'COMPLETED' ? 'teal' : plan.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Established by <span className="font-semibold text-slate-700">{plan.dentistUser?.fullName}</span> on {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Total</span>
                      <span className="text-lg font-bold text-teal-700">
                        {(plan.totalEstimatedCostPiasters / 100).toLocaleString()} EGP
                      </span>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 italic my-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{plan.notes}"
                    </p>
                  )}

                  {/* Items List */}
                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                      Staged Procedural Items
                    </span>
                    <div className="space-y-2">
                      {plan.items.map((item: any) => (
                        <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-teal-600/10 text-teal-700 font-bold flex items-center justify-center text-xs">
                              {item.sequenceOrder}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{item.procedureName}</span>
                                {item.toothNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono text-[10px] font-bold">
                                    Tooth #{item.toothNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Estimated: {(item.estimatedCostPiasters / 100).toLocaleString()} EGP
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={item.status === 'PERFORMED' ? 'teal' : 'neutral'}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Radiographs & Files */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Diagnostic Radiographs & Files</h3>
                <p className="text-xs text-slate-500">Radiographs and consent artifacts.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowDocModal(true)}
              >
                + Attach Radiograph / Document
              </Button>
            </div>

            {summary.documents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Radiographs Uploaded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Attach radiographs or files.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.documents.map((doc: any) => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{doc.fileName}</h5>
                        <p className="text-[10px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="teal">{doc.fileCategory}</Badge>
                    </div>
                    {doc.notes && (
                      <p className="text-[11px] text-slate-600 mt-2 italic bg-slate-50 p-2 rounded-lg">"{doc.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Medical Intake History */}
        {activeTab === 'intake' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              Verified Medical Intake Questionnaire
            </h3>
            {latestIntake ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-1">Submission Version</span>
                    <span className="font-bold text-slate-800">v{latestIntake.versionNumber}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-1">Submission Date</span>
                    <span className="font-bold text-slate-800">{new Date(latestIntake.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block mb-1">Status</span>
                    <Badge variant="success">{latestIntake.status}</Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Questionnaire Responses</h4>
                  <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-700 overflow-x-auto">
                    <pre>{JSON.stringify(latestIntake.answersJson, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center">No medical intake history.</p>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Create Encounter */}
      {showEncounterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Start New Clinical Encounter</h3>
            <p className="text-xs text-slate-500 mb-4">Initialize draft encounter record.</p>

            <form onSubmit={handleCreateEncounter} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Branch Location</label>
                <select
                  value={encounterBranchId}
                  onChange={(e) => setEncounterBranchId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Cold sensitivity on molar"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Examination Findings *</label>
                <textarea
                  required
                  rows={2}
                  value={examinationFindings}
                  onChange={(e) => setExaminationFindings(e.target.value)}
                  placeholder="Cavity on #36 occlusal"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Provisional Diagnosis</label>
                <input
                  type="text"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  placeholder="e.g. Reversible pulpitis #36"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Clinical Treatment Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Procedures, anesthetics, materials placed..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEncounterModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingEncounter}>
                  Save Draft Encounter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Finalize Encounter */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-teal-600 mb-2">
              <Lock className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Sign & Finalize Clinical Encounter</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Finalizing locks encounter record.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Finalized Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={finalizedDiagnosis}
                  onChange={(e) => setFinalizedDiagnosis(e.target.value)}
                  placeholder="e.g. Chronic apical periodontitis #36"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFinalizeModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={savingFinalize}
                  onClick={() => handleFinalizeEncounter(showFinalizeModal)}
                >
                  Confirm & Lock Encounter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Addendum */}
      {showAddendumModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Attach Signed Addendum</h3>
            <p className="text-xs text-slate-500 mb-4">Add append-only signed notes.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Addendum Text *</label>
                <textarea
                  rows={4}
                  required
                  value={addendumText}
                  onChange={(e) => setAddendumText(e.target.value)}
                  placeholder="Post-op progress check..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddendumModal(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={savingAddendum}
                  onClick={() => handleAddAddendum(showAddendumModal)}
                >
                  Sign & Append Addendum
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Treatment Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Treatment Plan</h3>
            <p className="text-xs text-slate-500 mb-4">Define staged procedures & costs.</p>

            <form onSubmit={handleCreateTreatmentPlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Plan Title *</label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Comprehensive Quadrant 3 Restoration"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">General Notes</label>
                <input
                  type="text"
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Aesthetic restorative options..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Planned Procedures</label>
                <div className="space-y-2">
                  {planItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Procedure (e.g. Root Canal)"
                        value={item.procedureName}
                        onChange={(e) => {
                          const updated = [...planItems];
                          updated[idx].procedureName = e.target.value;
                          setPlanItems(updated);
                        }}
                        className="flex-1 text-xs rounded-xl border border-slate-200 p-2"
                      />
                      <input
                        type="text"
                        placeholder="Tooth #"
                        value={item.toothNumber}
                        onChange={(e) => {
                          const updated = [...planItems];
                          updated[idx].toothNumber = e.target.value;
                          setPlanItems(updated);
                        }}
                        className="w-20 text-xs rounded-xl border border-slate-200 p-2"
                      />
                      <input
                        type="number"
                        placeholder="Cost (EGP)"
                        value={item.estimatedCostPiasters ? item.estimatedCostPiasters / 100 : ''}
                        onChange={(e) => {
                          const updated = [...planItems];
                          updated[idx].estimatedCostPiasters = Math.round(Number(e.target.value) * 100);
                          setPlanItems(updated);
                        }}
                        className="w-24 text-xs rounded-xl border border-slate-200 p-2"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPlanItems([...planItems, { procedureName: '', toothNumber: '', estimatedCostPiasters: 0 }])}
                  className="text-xs text-teal-600 font-bold mt-2 hover:underline"
                >
                  + Add Procedure Stage
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPlanModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingPlan}>
                  Save Treatment Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Attach Radiograph */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Attach Radiograph / Diagnostic File</h3>
            <p className="text-xs text-slate-500 mb-4">Attach diagnostic imaging files.</p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="e.g. panoramic_baseline_2026.png"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="XRAY_PANORAMIC">Panoramic Radiograph (OPG)</option>
                  <option value="XRAY_PERIAPICAL">Periapical Radiograph (PA)</option>
                  <option value="INTRAORAL_PHOTO">Intraoral Clinical Photograph</option>
                  <option value="LAB_REPORT">Dental Lab / Shade Guide</option>
                  <option value="CONSENT_FORM">SignedInformed Consent Artifact</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Radiology Notes</label>
                <input
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Prior to endodontic therapy"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDocModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingDoc}>
                  Attach Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
