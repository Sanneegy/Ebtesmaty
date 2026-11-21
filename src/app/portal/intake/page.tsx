'use client';
import {LocalizedInput,LocalizedTextarea} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ShieldAlert,
  Heart,
  Pill,
  Sparkles,
  Info
} from 'lucide-react';

function MedicalIntakeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const queryPatientId = searchParams.get('patientId');
  const isAssisted = searchParams.get('assisted') === 'true';

  const [activeStep, setActiveStep] = useState(1);
  const [patientId, setPatientId] = useState<string>(queryPatientId || '');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    conditions: {
      hypertension: { value: 'NO', notes: '' },
      diabetes: { value: 'NO', notes: '' },
      bleedingDisorder: { value: 'NO', notes: '' },
      heartDisease: { value: 'NO', notes: '' },
      respiratory: { value: 'NO', notes: '' },
      hepatitisLiver: { value: 'NO', notes: '' },
      kidneyDisease: { value: 'NO', notes: '' },
      otherConditions: '',
    },
    allergies: {
      penicillin: { value: 'NO', reaction: '' },
      latex: { value: 'NO', reaction: '' },
      localAnesthetics: { value: 'NO', reaction: '' },
      aspirin: { value: 'NO', reaction: '' },
      otherAllergies: '',
    },
    medications: {
      bloodThinners: { value: 'NO', notes: '' },
      immunosuppressants: { value: 'NO', notes: '' },
      bisphosphonates: { value: 'NO', notes: '' },
      currentMedsList: '',
      isPregnantOrNursing: { value: 'NO', notes: '' },
    },
    dental: {
      chiefComplaint: '',
      dentalAnxiety: 'MILD',
      previousComplications: '',
    },
  });

  // Fetch current patient ID if not passed in query
  useEffect(() => {
    async function fetchPatient() {
      if (patientId) return;
      try {
        const res = await fetch('/api/patients/me');
        if (res.ok) {
          const data = await res.json();
          if (data.patient) {
            setPatientId(data.patient.id);
            if (data.draft) {
              setFormData(data.draft.answersJson);
            }
          }
        }
      } catch (e) {}
    }
    fetchPatient();
  }, [patientId]);

  const handleConditionChange = (key: string, value: 'YES' | 'NO' | 'UNKNOWN') => {
    setFormData((prev: any) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: { ...prev.conditions[key], value },
      },
    }));
  };

  const handleConditionNotes = (key: string, notes: string) => {
    setFormData((prev: any) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: { ...prev.conditions[key], notes },
      },
    }));
  };

  const handleAllergyChange = (key: string, value: 'YES' | 'NO' | 'UNKNOWN') => {
    setFormData((prev: any) => ({
      ...prev,
      allergies: {
        ...prev.allergies,
        [key]: { ...prev.allergies[key], value },
      },
    }));
  };

  const handleAllergyReaction = (key: string, reaction: string) => {
    setFormData((prev: any) => ({
      ...prev,
      allergies: {
        ...prev.allergies,
        [key]: { ...prev.allergies[key], reaction },
      },
    }));
  };

  const handleMedicationChange = (key: string, value: 'YES' | 'NO' | 'UNKNOWN') => {
    setFormData((prev: any) => ({
      ...prev,
      medications: {
        ...prev.medications,
        [key]: { ...prev.medications[key], value },
      },
    }));
  };

  const handleSaveDraft = async () => {
    if (!patientId) {
      setError('Patient record not found. Please refresh or log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/intake/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, answers: formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSaveMessage('Draft progress saved successfully to database.');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIntake = async () => {
    if (!patientId) {
      setError('Patient record not found. Please refresh or log in again.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          answers: formData,
          isAssistedByReception: isAssisted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isAssisted) {
        router.push('/reception?assistedSuccess=true');
      } else {
        router.push('/portal?submitted=true');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Title */}
      <div>
        <Link
          href={isAssisted ? '/reception' : '/portal'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span><TranslatedText text={String(isAssisted ? 'Back to Reception Desk' : 'Back to Patient Portal')}/></span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text="Pre-Visit Medical & Dental History" /> </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              <TranslatedText text={String(isAssisted
                ? 'Reception Assistance Mode: Information entered on patient’s behalf'
                : 'Versioned confidential patient medical intake')}/>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span><TranslatedText text={String(loading ? 'Saving...' : 'Save Draft')}/></span>
          </button>
        </div>
      </div>

      {/* Reception Assistance Attribution Banner */}
      {isAssisted && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5"><TranslatedText text="Reception Assisted Entry" /></span> <TranslatedText text="This intake is being entered by reception staff assisting an in-clinic patient. The submission will be stamped with reception attribution and flagged for mandatory clinician review prior to treatment." /> </div>
        </div>
      )}

      {/* Success Notification */}
      {saveMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><TranslatedText text={String(saveMessage)}/></span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Progress Tracker */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span><TranslatedText text="Step" /> {activeStep} <TranslatedText text="of 5" /></span>
          <span className="text-teal-700">
            {activeStep === 1 && t.step1Conditions}
            {activeStep === 2 && t.step2Allergies}
            {activeStep === 3 && t.step3Medications}
            {activeStep === 4 && t.step4Dental}
            {activeStep === 5 && t.step5Review}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${(activeStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        {/* STEP 1: MEDICAL CONDITIONS */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span><TranslatedText text="1. Medical Conditions & Chronic Illnesses" /></span>
              </h2>
              <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Indicate if you have ever been diagnosed with or treated for any of the following:" /> </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {[
                { key: 'hypertension', label: 'High Blood Pressure (Hypertension)' },
                { key: 'diabetes', label: 'Diabetes (Type 1 or Type 2)' },
                { key: 'bleedingDisorder', label: 'Bleeding or Blood Clotting Disorders' },
                { key: 'heartDisease', label: 'Heart Disease, Murmur, or Prior Cardiac Surgery' },
                { key: 'respiratory', label: 'Asthma or Chronic Respiratory Conditions' },
                { key: 'hepatitisLiver', label: 'Hepatitis, Jaundice, or Liver Disease' },
                { key: 'kidneyDisease', label: 'Kidney Disease or Dialysis' },
              ].map(({ key, label }) => {
                const item = (formData.conditions as any)[key];
                return (
                  <div key={key} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-800"><TranslatedText text={String(label)}/></span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['NO', 'YES', 'UNKNOWN'] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleConditionChange(key, val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              item.value === val
                                ? val === 'YES'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : val === 'UNKNOWN'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {val === 'NO' ? t.no : val === 'YES' ? t.yes : t.unknown}
                          </button>
                        ))}
                      </div>
                    </div>
                    {item.value === 'YES' && (
                      <LocalizedInput
                        type="text"
                        placeholder="Details: medications, control level, diagnosing physician..."
                        value={item.notes}
                        onChange={(e) => handleConditionNotes(key, e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-red-200 bg-red-50/30 text-slate-800 outline-none focus:border-red-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: ALLERGIES */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span><TranslatedText text="2. Allergies & Adverse Drug Reactions" /></span>
              </h2>
              <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Critical safety check: Are you allergic to any of these medications or dental materials?" /> </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {[
                { key: 'penicillin', label: 'Penicillin, Amoxicillin, or Other Antibiotics' },
                { key: 'latex', label: 'Latex Gloves or Rubber Products' },
                { key: 'localAnesthetics', label: 'Dental Local Anesthesia (Novocaine, Lidocaine)' },
                { key: 'aspirin', label: 'Aspirin, Ibuprofen, or NSAIDs' },
              ].map(({ key, label }) => {
                const item = (formData.allergies as any)[key];
                return (
                  <div key={key} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-800"><TranslatedText text={String(label)}/></span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['NO', 'YES', 'UNKNOWN'] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAllergyChange(key, val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              item.value === val
                                ? val === 'YES'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : val === 'UNKNOWN'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {val === 'NO' ? t.no : val === 'YES' ? t.yes : t.unknown}
                          </button>
                        ))}
                      </div>
                    </div>
                    {item.value === 'YES' && (
                      <LocalizedInput
                        type="text"
                        placeholder="Describe reaction: rash, swelling, breathing difficulty, anaphylaxis..."
                        value={item.reaction}
                        onChange={(e) => handleAllergyReaction(key, e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-red-200 bg-red-50/30 text-slate-800 outline-none focus:border-red-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: MEDICATIONS & PREGNANCY */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-500" />
                <span><TranslatedText text="3. Current Medications & Physiological Status" /></span>
              </h2>
              <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Certain drugs impact bleeding or bone healing during dental surgery." /> </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {[
                { key: 'bloodThinners', label: 'Blood Thinners / Anticoagulants (Aspirin, Warfarin, Plavix)' },
                { key: 'bisphosphonates', label: 'Bisphosphonates or Bone Density Medications (Fosamax, Prolia)' },
                { key: 'immunosuppressants', label: 'Cortisone, Steroids, or Immunosuppressive Drugs' },
                { key: 'isPregnantOrNursing', label: 'Are you currently pregnant or nursing? (Female patients)' },
              ].map(({ key, label }) => {
                const item = (formData.medications as any)[key];
                return (
                  <div key={key} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-800"><TranslatedText text={String(label)}/></span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(['NO', 'YES', 'UNKNOWN'] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleMedicationChange(key, val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              item.value === val
                                ? val === 'YES'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : val === 'UNKNOWN'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {val === 'NO' ? t.no : val === 'YES' ? t.yes : t.unknown}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider"> <TranslatedText text="List All Prescriptions, Inhalers, or Over-the-Counter Supplements" /> </label>
                <LocalizedTextarea
                  rows={3}
                  value={formData.medications.currentMedsList}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medications: { ...formData.medications, currentMedsList: e.target.value },
                    })
                  }
                  placeholder="e.g. Concor 5mg once daily, Omega-3, Metformin 500mg..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DENTAL HISTORY */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span><TranslatedText text="4. Dental History & Reason for Visit" /></span>
              </h2>
              <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Help your doctor prepare by explaining your symptoms and past dental experiences." /> </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"> <TranslatedText text="Chief Complaint / Reason for Appointment" /> </label>
                <LocalizedTextarea
                  rows={3}
                  required
                  value={formData.dental.chiefComplaint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental: { ...formData.dental, chiefComplaint: e.target.value },
                    })
                  }
                  placeholder="Describe your current issue: toothache, sensitivity, broken filling, routine cleaning..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"> <TranslatedText text="Dental Anxiety or Fear Level" /> </label>
                <select
                  value={formData.dental.dentalAnxiety}
                  onChange={(e: any) =>
                    setFormData({
                      ...formData,
                      dental: { ...formData.dental, dentalAnxiety: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-600 bg-white"
                >
                  <option value="NONE"><TranslatedText text="None — Comfortable with dental visits" /></option>
                  <option value="MILD"><TranslatedText text="Mild — Slight nervous anticipation" /></option>
                  <option value="MODERATE"><TranslatedText text="Moderate — Sensitive to needles or drilling sounds" /></option>
                  <option value="SEVERE"><TranslatedText text="Severe — High phobia / extreme anxiety" /></option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"> <TranslatedText text="Previous Dental Complications or Difficulties" /> </label>
                <LocalizedInput
                  type="text"
                  value={formData.dental.previousComplications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental: { ...formData.dental, previousComplications: e.target.value },
                    })
                  }
                  placeholder="e.g. Fainting, prolonged bleeding after extraction, difficulty getting numb..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-800 outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span><TranslatedText text="5. Review Your Health Summary Before Submission" /></span>
              </h2>
              <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Please verify that the information below is accurate. Once submitted, this creates an immutable clinical record version." /> </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800"><TranslatedText text="Flagged Medical Conditions" /></h4>
                {Object.entries(formData.conditions).filter(([k, v]: any) => v.value === 'YES' || v.value === 'UNKNOWN').length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {Object.entries(formData.conditions).map(([k, v]: any) => {
                      if (v.value === 'YES') return <li key={k} className="text-red-700 font-medium"><TranslatedText text={k}/><TranslatedText text=": YES (" />{v.notes || <TranslatedText text="No extra notes"/>})</li>;
                      if (v.value === 'UNKNOWN') return <li key={k} className="text-amber-700 font-medium"><TranslatedText text={k}/><TranslatedText text=": UNKNOWN" /></li>;
                      return null;
                    })}
                  </ul>
                ) : (
                  <span className="text-slate-500"><TranslatedText text="None flagged as positive or unknown." /></span>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800"><TranslatedText text="Allergies" /></h4>
                {Object.entries(formData.allergies).filter(([k, v]: any) => v.value === 'YES' || v.value === 'UNKNOWN').length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {Object.entries(formData.allergies).map(([k, v]: any) => {
                      if (v.value === 'YES') return <li key={k} className="text-red-700 font-medium"><TranslatedText text={k}/><TranslatedText text=": ALLERGIC (" />{v.reaction || <TranslatedText text="Reaction unspecified"/>})</li>;
                      if (v.value === 'UNKNOWN') return <li key={k} className="text-amber-700 font-medium"><TranslatedText text={k}/><TranslatedText text=": UNKNOWN" /></li>;
                      return null;
                    })}
                  </ul>
                ) : (
                  <span className="text-slate-500"><TranslatedText text="No drug or material allergies indicated." /></span>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800"><TranslatedText text="Medications & Chief Complaint" /></h4>
                <p><span className="font-semibold text-slate-700"><TranslatedText text="Current Medications:" /></span> {formData.medications.currentMedsList || <TranslatedText text="None reported"/>}</p>
                <p><span className="font-semibold text-slate-700"><TranslatedText text="Chief Complaint:" /></span> {formData.dental.chiefComplaint || <TranslatedText text="Routine checkup"/>}</p>
                <p><span className="font-semibold text-slate-700"><TranslatedText text="Dental Anxiety:" /></span> <TranslatedText text={formData.dental.dentalAnxiety}/></p>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1"><TranslatedText text="Clinical Immutability Notice:" /></span> <TranslatedText text="Submitting creates a permanent, timestamped medical history version. Your treating doctor will review this submission prior to treatment. If your medical condition changes in the future, you can submit an updated version at any time without erasing this historical record." /> </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep(activeStep - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.prevBtn}</span>
            </button>
          ) : (
            <div />
          )}

          {activeStep < 5 ? (
            <button
              type="button"
              onClick={() => setActiveStep(activeStep + 1)}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{t.nextBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitIntake}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? <TranslatedText text="Submitting..."/> : t.submitIntakeBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MedicalIntakePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400"><TranslatedText text="Loading Medical Intake Form..." /></div>}>
      <MedicalIntakeForm />
    </Suspense>
  );
}
