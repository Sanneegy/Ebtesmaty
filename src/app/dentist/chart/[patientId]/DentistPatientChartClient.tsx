'use client';
import {ToothChart} from '@/components/clinical/ToothChart';
import {UnifiedPatientFileView} from '@/components/phase1/InstantPatientSearchAndRecord';
import {AnatomicalExamChart} from '@/components/phase1/AnatomicalExamChart';
import {CbctAnd3DViewer} from '@/components/phase1/CbctAnd3DViewer';
import {useSearchParams} from 'next/navigation';
import {LocalizedInput,LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  const query=useSearchParams();const requestedTab=query.get('tab');
  const [activeTab, setActiveTab] = useState<'chart' | 'encounters' | 'treatment' | 'documents' | 'intake' | 'prescriptions' | 'labs'>(
    ['chart','encounters','treatment','documents','intake','prescriptions','labs'].includes(requestedTab||'')
      ? (requestedTab as any)
      : 'encounters'
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Prescription Form State
  const [rxMedName, setRxMedName] = useState('Clindamycin 300mg Capsules');
  const [rxStrength, setRxStrength] = useState('300mg Capsule');
  const [rxDosage, setRxDosage] = useState('1 Capsule');
  const [rxFrequency, setRxFrequency] = useState('Every 8 hours (TID)');
  const [rxDuration, setRxDuration] = useState('5 Days');
  const [rxQuantity, setRxQuantity] = useState('15 Capsules');
  const [rxInstructions, setRxInstructions] = useState('Take with water after meals. Penicillin-safe protocol.');
  const [savingRx, setSavingRx] = useState(false);

  // Lab Order Form State
  const [labWorkType, setLabWorkType] = useState('CROWN');
  const [labToothNumbers, setLabToothNumbers] = useState('36');
  const [labMaterial, setLabMaterial] = useState('ZIRCONIA');
  const [labShade, setLabShade] = useState('A2');
  const [labCostEgp, setLabCostEgp] = useState('1800');
  const [labInstructions, setLabInstructions] = useState('Monolithic multilayer zirconia crown, anatomical occlusal contour.');
  const [savingLab, setSavingLab] = useState(false);
  
  // Encounter Form State
  const [showEncounterModal, setShowEncounterModal] = useState(query.get('compose')==='1'&&requestedTab==='encounters');
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
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState('');
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
          branchId: encounterBranchId,appointmentId:query.get('appointmentId')||undefined,
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
  async function handleCreatePrescription(e: React.FormEvent) {
    e.preventDefault();
    setSavingRx(true);
    try {
      const res = await fetch('/api/clinical/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId: branches[0]?.id || '',
          medicationName: rxMedName,
          strengthForm: rxStrength,
          dosage: rxDosage,
          frequency: rxFrequency,
          duration: rxDuration,
          quantity: rxQuantity,
          instructions: rxInstructions,
          allergyChecked: true,
          isSharedWithPatient: true,
        }),
      });
      if (res.ok) {
        setActionNotice('Electronic prescription issued and shared to Patient Portal.');
        await refreshSummary();
      }
    } catch {}
    setSavingRx(false);
  }

  async function handleCreateLabOrder(e: React.FormEvent) {
    e.preventDefault();
    setSavingLab(true);
    try {
      const res = await fetch('/api/clinical/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          branchId: branches[0]?.id || '',
          workType: labWorkType,
          toothNumbers: labToothNumbers,
          material: labMaterial,
          shade: labShade,
          costPiasters: Math.round((Number(labCostEgp) || 1800) * 100),
          instructions: labInstructions,
        }),
      });
      if (res.ok) {
        setActionNotice('Case-linked Laboratory Order created and synced with Owner Profitability.');
        await refreshSummary();
      }
    } catch {}
    setSavingLab(false);
  }

  async function handleUpdateLabStatus(orderId: string, status: string) {
    try {
      const res = await fetch('/api/clinical/lab-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        setActionNotice(`Lab order status updated to ${status}.`);
        await refreshSummary();
      }
    } catch {}
  }

  async function handleMarkItemPerformed(planId: string, itemId: string) {
    const encId = summary.encounters?.[0]?.id;
    if (!encId) {
      setShowEncounterModal(true);
      setActionNotice('Create or open an encounter first to link the performed procedure.');
      return;
    }
    try {
      const res = await fetch(`/api/clinical/treatment-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MARK_ITEM_PERFORMED',
          itemId,
          encounterId: encId,
        }),
      });
      if (res.ok) {
        setActionNotice('Procedure marked PERFORMED · Configured material recipe deducted once · +50 Loyalty pts awarded.');
        await refreshSummary();
      }
    } catch {}
  }

  async function handleSendPlanForApproval(planId: string) {
    try {
      const res = await fetch(`/api/clinical/treatment-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STATUS', status: 'PROPOSED' }),
      });
      if (res.ok) {
        setActionNotice('Treatment plan sent to Patient Portal for digital review & approval.');
        await refreshSummary();
      }
    } catch {}
  }

  async function handleGeneratePlanInvoice(planId: string) {
    try {
      const res = await fetch('/api/portal/plan-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'GENERATE_INVOICE' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice(`Invoice ${data.invoice?.invoiceNumber || ''} generated from approved plan & commission snapshot frozen.`);
      } else {
        setActionNotice(data.error || 'Could not generate invoice');
      }
    } catch {}
  }
  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docFile) return;
    setSavingDoc(true);
    setDocError('');
    try {
      const form = new FormData();
      form.set('file', docFile);
      form.set('patientId', patientId);
      form.set('branchId', branches[0]?.id || '');
      form.set('fileCategory', docCategory);
      form.set('notes', docNotes);
      const response = await fetch('/api/clinical/documents', { method: 'POST', body: form });
      if (!response.ok) throw new Error((await response.json()).error || 'Upload failed');
      setShowDocModal(false);
      setDocFile(null);
      setDocNotes('');
      setActiveTab('documents');
      await refreshSummary();
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'Upload failed');
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 pb-16 font-sans">
      {/* 1. CLINICIAN HEADER & PATIENT OVERVIEW */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <Link
                href="/dentist"
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full border border-slate-700 transition-colors shrink-0"
                title="Return to Dentist Desk"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14B8A6]/15 text-[#14B8A6] text-xs font-bold border border-[#14B8A6]/30">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span><TranslatedText text="ELECTRONIC DENTAL RECORD (EDR)" /></span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{patient.fullName}</h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {patient.patientNumber}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#14B8A6]/15 text-[#14B8A6]">
                    {patient.gender}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400"> <TranslatedText text="Primary Branch:" /> <span className="font-semibold text-slate-200">{patient.primaryBranch?.name || 'Heliopolis'}</span> <TranslatedText text="• Phone:" /> <span className="font-semibold text-slate-200">{patient.primaryPhone}</span>
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
                <span><TranslatedText text="Attach Radiograph" /></span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEncounterModal(true)}
                className="rounded-full px-4 py-2 text-xs font-bold bg-[#2446A6] hover:bg-[#0c6b65] text-white shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span><TranslatedText text="Start Encounter" /></span>
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Clinical Alerts Banner */}
        {anyAlerts ? (
          <div className="p-5 rounded-[24px] bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wide"> <TranslatedText text="Critical Intake Alerts" /> </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {hasAllergies && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300"> <TranslatedText text="⚠ ALLERGIES NOTED:" /> {intakeAnswers.allergyDetails || 'Yes'}
                  </span>
                )}
                {hasBleeding && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300"> <TranslatedText text="⚠ BLEEDING / ANTICOAGULANT RISK" /> </span>
                )}
                {hasHeartCondition && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300"> <TranslatedText text="⚠ CARDIAC CONDITION" /> </span>
                )}
                {hasDiabetes && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300"> <TranslatedText text="DIABETIC PATIENT" /> </span>
                )}
                {hasHypertension && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300"> <TranslatedText text="HYPERTENSION" /> </span>
                )}
              </div>
            </div>
            {latestIntake?.reviews[0]?.clinicalNotes && (
              <div className="hidden lg:block max-w-xs text-xs text-rose-800 bg-white/80 p-3 rounded-2xl border border-rose-200 shadow-2xs">
                <span className="font-bold block text-xs text-slate-400 uppercase tracking-wider"><TranslatedText text="Reviewing Dentist Note:" /></span>
                &quot;{latestIntake.reviews[0].clinicalNotes}&quot;
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-[24px] bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 shadow-xs">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span><TranslatedText text="Intake Verified: No contraindications." /></span>
            </span>
            <span className="text-xs text-emerald-700 font-bold"><TranslatedText text="Treating Clinician Verified" /></span>
          </div>
        )}

        {/* Tab Navigation with Rounded Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-xs">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'encounters'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span><TranslatedText text="Clinical Encounters (" />{summary.encounters?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('treatment')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'treatment'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span><TranslatedText text="Treatment Plans (" />{summary.treatmentPlans?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span><TranslatedText text="Radiographs &amp; Records (" />{summary.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'intake'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span><TranslatedText text="Intake Submissions (" />{summary.allSubmissions?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'prescriptions'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span><TranslatedText text="Prescriptions (" />{summary.prescriptions?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'labs'
                ? 'bg-[#2446A6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span><TranslatedText text="Lab Orders (" />{summary.labOrders?.length || 0})</span>
          </button>
        </div>

        {actionNotice && (
          <div role="status" className="p-4 rounded-2xl bg-[#EFF5FF] border border-[#4169E1]/30 text-xs font-bold text-[#102A5E] flex items-center justify-between">
            <span>{actionNotice}</span>
            <button type="button" onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-slate-800">✕</button>
          </div>
        )}

        <button className="secondary-button" onClick={()=>setActiveTab("chart")} aria-pressed={activeTab==="chart"}><TranslatedText text="Dental chart"/></button>
        {activeTab==='chart'&&<ToothChart toothChart={summary.toothChart} patientId={patientId} onToothUpdated={refreshSummary}/>}

        {/* PHASE 1 FULL PATIENT RECORD ON ONE SCREEN (Images 1 & 2) + ANATOMICAL EXAM CHART & TREATMENT PLAN TO INVOICE (Images 11 & 12) + FULL CBCT & 3D VIEWER (Images 13, 14, 15) */}
        <div className="space-y-6 text-slate-900">
          <UnifiedPatientFileView
            role={currentUser?.roleGrants?.some((g: any) => g.role === 'DENTIST') ? 'DENTIST' : 'OWNER_ADMIN'}
            onOpenExamChart={() => setActiveTab('chart')}
            onOpenCbctViewer={() => setActiveTab('documents')}
          />
          <AnatomicalExamChart
            readOnly={!currentUser?.roleGrants?.some((g: any) => g.role === 'DENTIST')}
            patientName={patient.fullName}
            patientNameAr={patient.fullName}
            fileNumber={patient.patientNumber}
          />
          <CbctAnd3DViewer
            role={currentUser?.roleGrants?.some((g: any) => g.role === 'DENTIST') ? 'DENTIST' : 'OWNER_ADMIN'}
            patientName={patient.fullName}
          />
        </div>
        {/* Tab 2: Encounters Timeline & Note Management */}
        {activeTab === 'encounters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800"><TranslatedText text="Clinical Visit Encounters" /></h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEncounterModal(true)}
              > <TranslatedText text="+ New Encounter" /> </Button>
            </div>

            {summary.encounters.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800"><TranslatedText text="No Encounters Recorded Yet" /></h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto"> <TranslatedText text="Start encounter documentation." /> </p>
              </div>
            ) : (
              summary.encounters.map((enc: any) => (
                <div key={enc.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900"> <TranslatedText text="Visit on" /> {new Date(enc.startedAt).toLocaleDateString()} <TranslatedText text="at" /> {new Date(enc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant={enc.status === 'FINALIZED' ? 'teal' : 'warning'}>
                        <TranslatedText text={String(enc.status)}/>
                      </Badge>
                      {enc.status === 'FINALIZED' && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-teal-600" />
                          <span><TranslatedText text="Locked & Immutable" /></span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500"> <TranslatedText text="Clinician:" /> <span className="font-semibold text-slate-700">{enc.dentistUser?.fullName}</span> (<TranslatedText text={String(enc.branch?.name)}/>)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"><TranslatedText text="Chief Complaint" /></span>
                      <p className="text-xs text-slate-800 font-medium">{enc.chiefComplaint}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"><TranslatedText text="Examination Findings" /></span>
                      <p className="text-xs text-slate-800">{enc.examinationFindings}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        <TranslatedText text={String(enc.status === 'FINALIZED' ? 'Finalized Diagnosis' : 'Provisional Diagnosis')}/>
                      </span>
                      <p className="text-xs text-slate-800 font-bold text-teal-900">
                        {enc.finalizedDiagnosis || enc.provisionalDiagnosis || 'None recorded'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"><TranslatedText text="Clinical Procedure Notes" /></span>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{enc.clinicalNotes}</p>
                    </div>
                  </div>

                  {/* Addenda List */}
                  {enc.addenda && enc.addenda.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2"> <TranslatedText text="Signed Clinical Addenda (" />{enc.addenda.length})
                      </span>
                      <div className="space-y-2">
                        {enc.addenda.map((ad: any) => (
                          <div key={ad.id} className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/60 text-xs">
                            <div className="flex items-center justify-between text-xs text-teal-800 font-bold mb-1">
                              <span><TranslatedText text="Signed by" /> {ad.dentistUser?.fullName}</span>
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
                    > <TranslatedText text="+ Add Signed Addendum" /> </Button>
                    {enc.status === 'DRAFT' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setShowFinalizeModal(enc.id);
                          setFinalizedDiagnosis(enc.provisionalDiagnosis || '');
                        }}
                      > <TranslatedText text="Sign & Finalize Encounter" /> </Button>
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
                <h3 className="text-sm font-bold text-slate-800"><TranslatedText text="Treatment Plans" /></h3>
                <p className="text-xs text-slate-500"><TranslatedText text="Procedures and estimated costs." /></p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPlanModal(true)}
              > <TranslatedText text="+ Create Treatment Plan" /> </Button>
            </div>

            {summary.treatmentPlans.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800"><TranslatedText text="No Treatment Plans Established" /></h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto"> <TranslatedText text="Create staged treatment plan." /> </p>
              </div>
            ) : (
              summary.treatmentPlans.map((plan: any) => (
                <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900"><TranslatedText text={String(plan.title)}/></h4>
                        <Badge variant={plan.status === 'COMPLETED' ? 'teal' : plan.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                          <TranslatedText text={String(plan.status)}/>
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5"> <TranslatedText text="Established by" /> <span className="font-semibold text-slate-700">{plan.dentistUser?.fullName}</span> <TranslatedText text="on" /> {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right space-y-1.5">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block"><TranslatedText text="Estimated Total" /></span>
                      <span className="text-lg font-bold text-teal-700 block">
                        {(plan.totalEstimatedCostPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
                      <div className="flex flex-wrap justify-end gap-2">
                        {plan.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleSendPlanForApproval(plan.id)}
                            className="px-3 py-1 rounded-lg bg-[#EAF3FF] text-[#2446A6] text-xs font-bold"
                          >
                            <TranslatedText text="Send for Patient Approval" />
                          </button>
                        )}
                        {(plan.status === 'ACCEPTED' || plan.status === 'COMPLETED') && (
                          <button
                            type="button"
                            onClick={() => handleGeneratePlanInvoice(plan.id)}
                            className="px-3 py-1 rounded-lg bg-[#4169E1] text-white text-xs font-bold"
                          >
                            <TranslatedText text="Generate Invoice from Plan" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 italic my-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      &quot;{plan.notes}&quot;
                    </p>
                  )}

                  {/* Items List */}
                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2"> <TranslatedText text="Staged Procedural Items" /> </span>
                    <div className="space-y-2">
                      {plan.items.map((item: any) => (
                        <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-teal-600/10 text-teal-700 font-bold flex items-center justify-center text-xs">
                              {item.sequenceOrder}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800"><TranslatedText text={String(item.procedureName)}/></span>
                                {item.toothNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono text-xs font-bold"> <TranslatedText text="Tooth #" />{item.toothNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500"> <TranslatedText text="Estimated:" /> {(item.estimatedCostPiasters / 100).toLocaleString()} <TranslatedText text="EGP" /> </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.status !== 'PERFORMED' && (
                              <button
                                type="button"
                                onClick={() => handleMarkItemPerformed(plan.id, item.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                              >
                                <TranslatedText text="Complete & Deduct Stock" />
                              </button>
                            )}
                            <Badge variant={item.status === 'PERFORMED' ? 'teal' : 'neutral'}>
                              <TranslatedText text={String(item.status)}/>
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
                <h3 className="text-sm font-bold text-slate-800"><TranslatedText text="Diagnostic Radiographs & Files" /></h3>
                <p className="text-xs text-slate-500"><TranslatedText text="Radiographs and consent artifacts." /></p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowDocModal(true)}
              > <TranslatedText text="+ Attach Radiograph / Document" /> </Button>
            </div>

            {summary.documents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800"><TranslatedText text="No Radiographs Uploaded" /></h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto"> <TranslatedText text="Attach radiographs or files." /> </p>
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
                        <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="teal">{doc.fileCategory}</Badge>
                    </div>
                    {doc.storageKey?.startsWith("private:") && <a className="secondary-button" href={`/api/clinical/documents?id=${doc.id}`}><TranslatedText text="Download file" /></a>}
                    {doc.notes && (
                      <p className="text-xs text-slate-600 mt-2 italic bg-slate-50 p-2 rounded-lg">&quot;{doc.notes}&quot;</p>
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
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100"> <TranslatedText text="Verified Medical Intake Questionnaire" /> </h3>
            {latestIntake ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1"><TranslatedText text="Submission Version" /></span>
                    <span className="font-bold text-slate-800">v{latestIntake.versionNumber}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1"><TranslatedText text="Submission Date" /></span>
                    <span className="font-bold text-slate-800">{new Date(latestIntake.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1"><TranslatedText text="Status" /></span>
                    <Badge variant="success"><TranslatedText text={String(latestIntake.status)}/></Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2"><TranslatedText text="Questionnaire Responses" /></h4>
                  <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-700 overflow-x-auto">
                    <pre>{JSON.stringify(latestIntake.answersJson, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center"><TranslatedText text="No medical intake history." /></p>
            )}
          </div>
        )}

        {/* Tab 6: Electronic Prescriptions (Section 5.8) */}
        {activeTab === 'prescriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleCreatePrescription} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs">
              <h3 className="text-base font-extrabold text-[#102A5E]">
                <TranslatedText text="Issue Electronic Prescription" />
              </h3>
              {hasAllergies && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                  ⚠ Allergy Safety Check: {intakeAnswers.allergyDetails || 'Penicillin / Documented Allergy'}
                </div>
              )}
              <div>
                <label className="font-bold block mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  value={rxMedName}
                  onChange={(e) => setRxMedName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Strength / Form</label>
                  <input
                    type="text"
                    value={rxStrength}
                    onChange={(e) => setRxStrength(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Dose *</label>
                  <input
                    type="text"
                    required
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Frequency *</label>
                  <input
                    type="text"
                    required
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Duration *</label>
                  <input
                    type="text"
                    required
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Quantity</label>
                  <input
                    type="text"
                    value={rxQuantity}
                    onChange={(e) => setRxQuantity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Patient Instructions</label>
                <textarea
                  rows={2}
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2"
                />
              </div>
              <button
                type="submit"
                disabled={savingRx}
                className="w-full py-2.5 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white font-bold"
              >
                {savingRx ? 'Saving...' : 'Sign & Release Prescription to Patient Portal'}
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#102A5E]">
                  <TranslatedText text="Issued Prescriptions Ledger" />
                </h3>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  Print Rx PDF
                </button>
              </div>
              <div className="space-y-3">
                {(summary.prescriptions || []).map((rx: any) => (
                  <div key={rx.id} className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#DCE5EE] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[#102A5E]">{rx.medicationName}</strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        Allergy Checked ✓
                      </span>
                    </div>
                    <p className="text-slate-700 font-semibold">
                      {rx.dosage} · {rx.frequency} · {rx.duration} ({rx.quantity})
                    </p>
                    <p className="text-slate-500 italic">{rx.instructions}</p>
                    <span className="text-[11px] text-slate-400 block">
                      Issued: {new Date(rx.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Case-Linked Laboratory Orders (Section 5.9) */}
        {activeTab === 'labs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleCreateLabOrder} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs">
              <h3 className="text-base font-extrabold text-[#102A5E]">
                <TranslatedText text="Create Case-Linked Lab Order" />
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Prosthetic Work Type</label>
                  <select
                    value={labWorkType}
                    onChange={(e) => setLabWorkType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-semibold"
                  >
                    <option value="CROWN">Crown</option>
                    <option value="BRIDGE">Bridge</option>
                    <option value="VENEER">Ceramic Veneer</option>
                    <option value="IMPLANT_ABUTMENT">Implant Custom Abutment</option>
                    <option value="DENTURE">Complete / Partial Denture</option>
                    <option value="NIGHT_GUARD">Occlusal Night Guard</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Tooth Number(s) *</label>
                  <input
                    type="text"
                    required
                    value={labToothNumbers}
                    onChange={(e) => setLabToothNumbers(e.target.value)}
                    placeholder="e.g. 36 or 11, 21"
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Material</label>
                  <select
                    value={labMaterial}
                    onChange={(e) => setLabMaterial(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  >
                    <option value="ZIRCONIA">Zirconia</option>
                    <option value="EMAX">IPS e.max</option>
                    <option value="TITANIUM">Titanium</option>
                    <option value="PMMA">PMMA Temp</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">VITA Shade</label>
                  <input
                    type="text"
                    value={labShade}
                    onChange={(e) => setLabShade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Lab Cost (EGP)</label>
                  <input
                    type="number"
                    value={labCostEgp}
                    onChange={(e) => setLabCostEgp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Clinical Lab Instructions</label>
                <textarea
                  rows={2}
                  value={labInstructions}
                  onChange={(e) => setLabInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2"
                />
              </div>
              <button
                type="submit"
                disabled={savingLab}
                className="w-full py-2.5 rounded-xl bg-[#4169E1] hover:bg-[#2446A6] text-white font-bold"
              >
                {savingLab ? 'Submitting...' : 'Submit Lab Order & Link to Case Cost'}
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <h3 className="text-base font-extrabold text-[#102A5E]">
                <TranslatedText text="Patient Lab Orders & Status Progression" />
              </h3>
              <div className="space-y-3">
                {(summary.labOrders || []).map((ord: any) => (
                  <div key={ord.id} className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#DCE5EE] text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="text-sm text-[#102A5E]">
                          #{ord.orderNumber} · {ord.workType} (Tooth #{ord.toothNumbers})
                        </strong>
                        <p className="text-slate-500">
                          {ord.laboratory?.name || 'Cairo Digital Lab'} · Material: {ord.material} · Shade: {ord.shade}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#EAF3FF] text-[#2446A6] font-bold">
                        {ord.status}
                      </span>
                    </div>
                    {ord.instructions && <p className="text-slate-600 italic">{ord.instructions}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <span className="text-slate-500">
                        Due: {new Date(ord.dueDate).toLocaleDateString()} · Cost:{' '}
                        <strong>{((ord.costPiasters || 0) / 100).toLocaleString()} EGP</strong>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['IN_PROGRESS', 'READY', 'RECEIVED', 'REWORK'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateLabStatus(ord.id, st)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              ord.status === st
                                ? 'bg-[#4169E1] text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM 3-CARD CLINICAL SUMMARY STRIP (Matching Dentist Workspace Reference Image) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#102A5E]">
                <TranslatedText text="Treatment Plan" />
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('treatment')}
                className="text-xs font-bold text-[#4169E1] hover:underline"
              >
                View All →
              </button>
            </div>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
              {(summary.treatmentPlans?.[0]?.items || [
                { id: '1', procedureName: 'Composite filling on tooth #36' },
                { id: '2', procedureName: 'Professional ultrasonic scaling' },
              ]).slice(0, 3).map((it: any, idx: number) => (
                <li key={it.id || idx} className="font-medium">
                  {it.procedureName} {it.toothNumber ? `(#${it.toothNumber})` : ''}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#102A5E]">
                <TranslatedText text="Recent X-Rays" />
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="text-xs font-bold text-[#4169E1] hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  onClick={() => setActiveTab('chart')}
                  className="h-14 rounded-xl bg-slate-950 overflow-hidden border border-slate-300 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src="/images/hero_implant_2.jpg"
                    alt={`Radiograph ${n}`}
                    className="h-full w-full object-cover filter grayscale contrast-125"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1.5 shadow-2xs text-xs">
            <h4 className="text-sm font-extrabold text-[#102A5E]">
              <TranslatedText text="Visit Summary" />
            </h4>
            <p className="text-slate-600">
              <strong>Visit Date:</strong>{' '}
              {summary.encounters?.[0]?.startedAt
                ? new Date(summary.encounters[0].startedAt).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </p>
            <p className="text-slate-600">
              <strong>Active Lab Cases:</strong> {(summary.labOrders || []).length} tracked
            </p>
            <p className="text-slate-600">
              <strong>Prescriptions:</strong> {(summary.prescriptions || []).length} issued
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Encounter */}
      {showEncounterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Start New Clinical Encounter" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Initialize draft encounter record." /></p>

            <form onSubmit={handleCreateEncounter} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Branch Location" /></label>
                <select
                  value={encounterBranchId}
                  onChange={(e) => setEncounterBranchId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}><TranslatedText text={String(b.name)}/></option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Chief Complaint *" /></label>
                <LocalizedInput
                  type="text"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Cold sensitivity on molar"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Examination Findings *" /></label>
                <LocalizedTextarea
                  required
                  rows={2}
                  value={examinationFindings}
                  onChange={(e) => setExaminationFindings(e.target.value)}
                  placeholder="Cavity on #36 occlusal"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Provisional Diagnosis" /></label>
                <LocalizedInput
                  type="text"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  placeholder="e.g. Reversible pulpitis #36"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Clinical Treatment Notes *" /></label>
                <LocalizedTextarea
                  required
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Procedures, anesthetics, materials placed..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowEncounterModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingEncounter}> <TranslatedText text="Save Draft Encounter" /> </Button>
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
              <h3 className="text-base font-bold text-slate-900"><TranslatedText text="Sign & Finalize Clinical Encounter" /></h3>
            </div>
            <p className="text-xs text-slate-500 mb-4"> <TranslatedText text="Finalizing locks encounter record." /> </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Finalized Clinical Diagnosis *" /></label>
                <LocalizedInput
                  type="text"
                  required
                  value={finalizedDiagnosis}
                  onChange={(e) => setFinalizedDiagnosis(e.target.value)}
                  placeholder="e.g. Chronic apical periodontitis #36"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFinalizeModal(null)}> <TranslatedText text="Cancel" /> </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={savingFinalize}
                  onClick={() => handleFinalizeEncounter(showFinalizeModal)}
                > <TranslatedText text="Confirm & Lock Encounter" /> </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Addendum */}
      {showAddendumModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Attach Signed Addendum" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Add append-only signed notes." /></p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Addendum Text *" /></label>
                <LocalizedTextarea
                  rows={4}
                  required
                  value={addendumText}
                  onChange={(e) => setAddendumText(e.target.value)}
                  placeholder="Post-op progress check..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddendumModal(null)}> <TranslatedText text="Cancel" /> </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={savingAddendum}
                  onClick={() => handleAddAddendum(showAddendumModal)}
                > <TranslatedText text="Sign & Append Addendum" /> </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Treatment Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Create Treatment Plan" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Define staged procedures & costs." /></p>

            <form onSubmit={handleCreateTreatmentPlan} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Plan Title *" /></label>
                <LocalizedInput
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Comprehensive Quadrant 3 Restoration"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="General Notes" /></label>
                <LocalizedInput
                  type="text"
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Aesthetic restorative options..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Planned Procedures" /></label>
                <div className="space-y-2">
                  {planItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <LocalizedInput
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
                      <LocalizedInput
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
                      <LocalizedInput
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
                > <TranslatedText text="+ Add Procedure Stage" /> </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPlanModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingPlan}> <TranslatedText text="Save Treatment Plan" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Attach Radiograph */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1"><TranslatedText text="Attach Radiograph / Diagnostic File" /></h3>
            <p className="text-xs text-slate-500 mb-4"><TranslatedText text="Attach diagnostic imaging files." /></p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="File Name *" /></label>
                <input type="file" required accept="image/png,image/jpeg,application/pdf" aria-label="Radiograph or document" onChange={e=>setDocFile(e.target.files?.[0] || null)} /><p>PNG · JPEG · PDF · 10 MB</p>{docError && <p role="alert"><TranslatedText text={docError}/></p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Category *" /></label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                >
                  <option value="XRAY_PANORAMIC"><TranslatedText text="Panoramic Radiograph (OPG)" /></option>
                  <option value="XRAY_PERIAPICAL"><TranslatedText text="Periapical Radiograph (PA)" /></option>
                  <option value="INTRAORAL_PHOTO"><TranslatedText text="Intraoral Clinical Photograph" /></option>
                  <option value="LAB_REPORT"><TranslatedText text="Dental Lab / Shade Guide" /></option>
                  <option value="CONSENT_FORM"><TranslatedText text="SignedInformed Consent Artifact" /></option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1"><TranslatedText text="Radiology Notes" /></label>
                <LocalizedInput
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Prior to endodontic therapy"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDocModal(false)}> <TranslatedText text="Cancel" /> </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={savingDoc}> <TranslatedText text="Attach Document" /> </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
