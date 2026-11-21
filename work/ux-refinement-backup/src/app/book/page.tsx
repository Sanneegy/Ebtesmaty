'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import {
  CLINIC_BRANCHES,
  CLINIC_DENTISTS,
  CLINIC_SERVICES,
} from '../../config/clinic-catalog';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Download,
  ExternalLink,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface TimeSlot {
  time: string;
  label: string;
  window: 'MORNING' | 'AFTERNOON' | 'EVENING';
  available: boolean;
}

function BookingFlowContent() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const searchParams = useSearchParams();

  // Steps: 1..8 (Steps 1-6 interactive, Step 7 submitting, Step 8 confirmation)
  const [step, setStep] = useState<number>(1);

  // Step 1: Branch
  const [branchCode, setBranchCode] = useState<string>(
    searchParams.get('branch') || 'BR-A'
  );

  // Step 2: Service / Reason
  const [serviceSlug, setServiceSlug] = useState<string>(
    searchParams.get('service') || 'dental-checkups-consultations'
  );

  // Step 3: Dentist
  const [dentistEmail, setDentistEmail] = useState<string>(
    searchParams.get('dentist') || 'ANY'
  );

  // Step 4: Date & Real Available Time Slot
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return (
      searchParams.get('date') ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    );
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>({
    time: '10:30',
    label: '10:30 AM',
    window: 'MORNING',
    available: true,
  });

  // Step 5: Patient Details
  const [patientType, setPatientType] = useState<'NEW' | 'RETURNING'>('NEW');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [dob, setDob] = useState<string>('1992-05-15');
  const [symptoms, setSymptoms] = useState<string>('');
  const [hasMedicalAlert, setHasMedicalAlert] = useState<boolean>(false);
  const [consentChecked, setConsentChecked] = useState<boolean>(true);

  // Step 7 & 8: Submission & Confirmation
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const selectedBranchObj =
    CLINIC_BRANCHES.find((b) => b.code === branchCode) || CLINIC_BRANCHES[0];
  const selectedServiceObj =
    CLINIC_SERVICES.find((s) => s.slug === serviceSlug) || CLINIC_SERVICES[0];
  const branchDentists = CLINIC_DENTISTS.filter((d) => d.branchCode === branchCode);
  const selectedDentistObj = CLINIC_DENTISTS.find((d) => d.email === dentistEmail);

  // Fetch live availability when branch, dentist, or date changes
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    fetch(
      `/api/scheduling/availability?branchCode=${encodeURIComponent(
        branchCode
      )}&date=${encodeURIComponent(selectedDate)}&dentistEmail=${encodeURIComponent(
        dentistEmail
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.slots)) {
          setSlots(data.slots);
          const firstAvail = data.slots.find((s: TimeSlot) => s.available);
          if (firstAvail) setSelectedSlot(firstAvail);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [branchCode, selectedDate, dentistEmail]);

  const handleSubmitBooking = async () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(isAr ? 'يرجى إدخال الاسم الكامل.' : 'Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError(isAr ? 'يرجى إدخال رقم هاتف صحيح.' : 'Please enter a valid phone number.');
      return;
    }

    setStep(7);
    setSubmitting(true);
    try {
      const res = await fetch('/api/scheduling/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchCode,
          serviceName:
            serviceSlug === 'unsure'
              ? 'General Dental Checkup & Consultation'
              : selectedServiceObj.nameEn,
          dentistEmail,
          preferredDate: selectedDate,
          preferredTimeWindow: selectedSlot.window,
          selectedSlotTime: selectedSlot.label,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          reason: `[${patientType} PATIENT | Slot: ${selectedSlot.label}${
            hasMedicalAlert ? ' | MEDICAL ALERT FLAGGED' : ''
          }] ${symptoms.trim() || selectedServiceObj.nameEn}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }
      setBookingRef(data.trackingCode || data.request?.id || 'EBT-BOOK-2026');
      setStep(8);
    } catch (err: any) {
      setError(err.message);
      setStep(6);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadIcs = () => {
    const dateClean = selectedDate.replace(/-/g, '');
    const [hh, mm] = selectedSlot.time.split(':');
    const startStr = `${dateClean}T${hh}${mm}00`;
    const endHour = String(Number(hh) + 1).padStart(2, '0');
    const endStr = `${dateClean}T${endHour}${mm}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ebtesamty Dental Clinics//EN',
      'BEGIN:VEVENT',
      `UID:${bookingRef || 'ebtesamty'}@ebtesamty.eg`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Ebtesamty Dental Appointment - ${selectedBranchObj.nameEn}`,
      `LOCATION:${selectedBranchObj.addressEn}`,
      `DESCRIPTION:Service: ${selectedServiceObj.nameEn} | Reference: ${bookingRef}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebtesamty-appointment-${selectedDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepLabels = [
    { num: 1, en: 'Branch', ar: 'الفرع' },
    { num: 2, en: 'Service', ar: 'الخدمة' },
    { num: 3, en: 'Dentist', ar: 'الطبيب' },
    { num: 4, en: 'Date & Time', ar: 'الموعد' },
    { num: 5, en: 'Patient Info', ar: 'بيانات المريض' },
    { num: 6, en: 'Review & Confirm', ar: 'المراجعة والتأكيد' },
  ];

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10 lg:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>
                {isAr
                  ? 'حجز موعد إلكتروني مباشر — عيادات ابتسامتي'
                  : 'Online Appointment Booking — Ebtesamty Cairo'}
              </span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B67] mt-2">
              {isAr ? 'احجز موعدك في خطوات بسيطة' : 'Schedule Your Dental Visit Online'}
            </h1>
          </div>
          <div className="text-xs text-[#526574]">
            {isAr ? 'تحتاج مساعدة فورية؟ اتصل بنا:' : 'Need immediate assistance?'}{' '}
            <a href="tel:+20224150001" className="font-bold text-[#1F6FB2]">
              +20 2 2415 0001
            </a>
          </div>
        </div>

        {/* Stepper Progress */}
        {step <= 6 && (
          <div className="bg-white rounded-2xl border border-[#D8E0DC] p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {stepLabels.map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < step) setStep(s.num);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-start ${
                      isActive
                        ? 'bg-[#1F6FB2] text-white shadow-sm'
                        : isCompleted
                        ? 'bg-[#EAF3FF] text-[#1F6FB2]'
                        : 'bg-[#F6F8FC] text-[#526574]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        isActive
                          ? 'bg-white text-[#1F6FB2]'
                          : isCompleted
                          ? 'bg-[#1F6FB2] text-white'
                          : 'bg-white text-[#526574]'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </span>
                    <span className="truncate">{isAr ? s.ar : s.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE BRANCH */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#123B67]">
                {isAr ? 'الخطوة 1: اختر فرع العيادة' : 'Step 1: Choose Your Preferred Cairo Branch'}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {isAr
                  ? 'جميع الفروع متصلة بسجل أسنان إلكتروني موحد.'
                  : 'All 3 branches share our unified Electronic Dental Record.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CLINIC_BRANCHES.map((b) => {
                const selected = branchCode === b.code;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => {
                      setBranchCode(b.code);
                      setDentistEmail('ANY');
                    }}
                    className={`p-5 rounded-2xl border-2 text-start transition-all flex flex-col justify-between space-y-3 ${
                      selected
                        ? 'border-[#1F6FB2] bg-[#EAF3FF]/50 shadow-sm'
                        : 'border-[#D8E0DC] bg-[#F6F8FC] hover:border-[#1F6FB2]/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#123B67] text-white">
                          {b.code}
                        </span>
                        {selected && <CheckCircle2 className="w-5 h-5 text-[#1F6FB2]" />}
                      </div>
                      <h3 className="text-base font-bold text-[#123B67]">
                        {isAr ? b.nameAr : b.nameEn}
                      </h3>
                      <p className="text-xs text-[#526574]">{isAr ? b.addressAr : b.addressEn}</p>
                    </div>
                    <div className="pt-2 border-t border-[#D8E0DC] text-[11px] text-[#1F6FB2] font-semibold">
                      {isAr ? b.hoursAr : b.hoursEn}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(2)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {isAr ? 'التالي: اختيار الخدمة' : 'Continue to Visit Reason'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE SERVICE / VISIT REASON */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#123B67]">
                {isAr
                  ? 'الخطوة 2: ما هو سبب الزيارة أو الخدمة المطلوبة؟'
                  : 'Step 2: Select Visit Reason or Dental Service'}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {isAr
                  ? 'إذا لم تكن متأكداً من الإجراء المطلوب، اختر "لست متأكداً — أحتاج كشف وتشخيص".'
                  : 'Not sure which treatment you need? Choose the general consultation option below.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setServiceSlug('unsure')}
                className={`p-4 rounded-2xl border-2 text-start transition-all ${
                  serviceSlug === 'unsure'
                    ? 'border-[#1F6FB2] bg-[#EAF3FF]/60'
                    : 'border-[#D8E0DC] bg-[#F6F8FC] hover:border-[#1F6FB2]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#123B67]">
                    {isAr
                      ? 'لست متأكداً — أحتاج كشف وتشخيص شامل'
                      : "I'm not sure — I need a general checkup & consultation"}
                  </span>
                  <span className="text-xs font-bold text-[#1F6FB2]">EGP 400</span>
                </div>
                <p className="text-xs text-[#526574] mt-1">
                  {isAr
                    ? 'فحص شامل للأسنان واللثة مع خطة علاج مكتوبة (45 دقيقة).'
                    : 'Comprehensive clinical exam, digital X-ray assessment & written plan (45 min).'}
                </p>
              </button>

              {CLINIC_SERVICES.map((srv) => {
                const selected = serviceSlug === srv.slug;
                return (
                  <button
                    key={srv.slug}
                    type="button"
                    onClick={() => setServiceSlug(srv.slug)}
                    className={`p-4 rounded-2xl border-2 text-start transition-all ${
                      selected
                        ? 'border-[#1F6FB2] bg-[#EAF3FF]/60'
                        : 'border-[#D8E0DC] bg-[#F6F8FC] hover:border-[#1F6FB2]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#123B67]">
                        {isAr ? srv.nameAr : srv.nameEn}
                      </span>
                      <span className="text-xs font-bold text-[#1F6FB2] shrink-0">
                        EGP {srv.startingPriceEgp.toLocaleString()}+
                      </span>
                    </div>
                    <p className="text-xs text-[#526574] mt-1 line-clamp-2">
                      {isAr ? srv.shortDescAr : srv.shortDescEn}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(1)}>
                {isAr ? 'السابق' : 'Back'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {isAr ? 'التالي: اختيار الطبيب' : 'Continue to Dentist Selection'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CHOOSE DENTIST */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#123B67]">
                {isAr
                  ? `الخطوة 3: اختر الطبيب المعالج في ${selectedBranchObj.nameAr}`
                  : `Step 3: Choose Your Dentist at ${selectedBranchObj.nameEn}`}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {isAr
                  ? 'يمكنك اختيار طبيب محدد أو اختيار "أي طبيب متاح" للحصول على أقرب موعد.'
                  : 'Select a specific specialist at this branch or choose First Available Dentist.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setDentistEmail('ANY')}
                className={`p-5 rounded-2xl border-2 text-start transition-all ${
                  dentistEmail === 'ANY'
                    ? 'border-[#1F6FB2] bg-[#EAF3FF]/60'
                    : 'border-[#D8E0DC] bg-[#F6F8FC]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#1F6FB2] text-white flex items-center justify-center mb-3">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#123B67]">
                  {isAr ? 'أي طبيب متاح بالفرع' : 'First Available Dentist'}
                </h3>
                <p className="text-xs text-[#526574] mt-1">
                  {isAr
                    ? 'أكبر مرونة في المواعيد المتاحة خلال اليوم.'
                    : 'Shows all open chair slots across on-duty clinicians at this branch.'}
                </p>
              </button>

              {branchDentists.map((doc) => {
                const selected = dentistEmail === doc.email;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDentistEmail(doc.email)}
                    className={`p-5 rounded-2xl border-2 text-start transition-all ${
                      selected
                        ? 'border-[#1F6FB2] bg-[#EAF3FF]/60'
                        : 'border-[#D8E0DC] bg-[#F6F8FC]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#123B67] text-white font-bold text-xs flex items-center justify-center mb-3">
                      {doc.nameEn
                        .replace('Dr. ', '')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <h3 className="text-base font-bold text-[#123B67]">
                      {isAr ? doc.nameAr : doc.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-[#1F6FB2] mt-0.5">
                      {isAr ? doc.specialtyAr : doc.specialtyEn}
                    </p>
                    <p className="text-[11px] text-[#526574] mt-2">
                      {isAr ? doc.scheduleSummaryAr : doc.scheduleSummaryEn}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(2)}>
                {isAr ? 'السابق' : 'Back'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(4)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {isAr ? 'التالي: التاريخ والوقت' : 'Continue to Date & Time'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CHOOSE DATE & AVAILABLE TIME SLOT */}
        {step === 4 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#123B67]">
                  {isAr
                    ? 'الخطوة 4: اختر التاريخ والموعد المتاح'
                    : 'Step 4: Select Date & Available Time Slot'}
                </h2>
                <p className="text-xs text-[#526574] mt-1">
                  {isAr
                    ? 'يتم تحديث المواعيد المتاحة مباشرة من جدول العيادة.'
                    : 'Real-time availability synced with branch operatory schedules.'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1">
                  {isAr ? 'تاريخ الزيارة:' : 'Appointment Date:'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2 text-xs font-bold text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-10 text-center text-xs text-[#526574]">
                {isAr ? 'جاري فحص المواعيد المتاحة...' : 'Checking live chair availability...'}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlot.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        !slot.available
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#1F6FB2] border-[#1F6FB2] text-white shadow-sm'
                          : 'bg-[#F6F8FC] border-[#D8E0DC] text-[#123B67] hover:border-[#1F6FB2]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(3)}>
                {isAr ? 'السابق' : 'Back'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(5)}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {isAr ? 'التالي: بيانات المريض' : 'Continue to Patient Details'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: PATIENT DETAILS */}
        {step === 5 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#123B67]">
                {isAr ? 'الخطوة 5: بيانات المريض' : 'Step 5: Patient Information'}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {isAr
                  ? 'أدخل بيانات التواصل لتأكيد الحجز وإرسال رقم المتابعة.'
                  : 'Enter your contact information for appointment confirmation.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPatientType('NEW')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  patientType === 'NEW'
                    ? 'bg-[#1F6FB2] text-white border-[#1F6FB2]'
                    : 'bg-[#F6F8FC] text-[#123B67] border-[#D8E0DC]'
                }`}
              >
                {isAr ? 'مريض جديد (أول زيارة)' : 'New Patient (First Visit)'}
              </button>
              <button
                type="button"
                onClick={() => setPatientType('RETURNING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  patientType === 'RETURNING'
                    ? 'bg-[#1F6FB2] text-white border-[#1F6FB2]'
                    : 'bg-[#F6F8FC] text-[#123B67] border-[#D8E0DC]'
                }`}
              >
                {isAr ? 'مريض حالي بعيادات ابتسامتي' : 'Returning Ebtesamty Patient'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                  {isAr ? 'الاسم الكامل للمريض *' : 'Patient Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد محمد علي' : 'e.g., Nadia El-Masry'}
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                  {isAr ? 'رقم الهاتف المحمول (مصر) *' : 'Mobile Phone Number (Egypt) *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10 1234 5678"
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                  {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                  {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] mb-1.5">
                {isAr
                  ? 'الأعراض أو ملاحظات للطبيب (اختياري)'
                  : 'Symptoms or Notes for Dentist (Optional)'}
              </label>
              <textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب أي أعراض مثل حساسية للمشروبات الباردة أو الرغبة في فحص تجميلي...'
                    : 'Describe any tooth sensitivity, discomfort, or aesthetic goals...'
                }
                className="w-full rounded-xl border border-[#D8E0DC] bg-[#F6F8FC] px-3.5 py-2.5 text-xs text-[#123B67] focus:border-[#1F6FB2] focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-[#123B67] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMedicalAlert}
                  onChange={(e) => setHasMedicalAlert(e.target.checked)}
                  className="rounded border-[#D8E0DC] text-[#1F6FB2] focus:ring-[#1F6FB2]"
                />
                <span>
                  {isAr
                    ? 'لدي حالة طبية مزمنة أو حساسية دوائية أرغب في تنبيه الطبيب إليها قبل الجلسة'
                    : 'I have a chronic medical condition, pregnancy, or drug allergy to flag for the dentist'}
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-[#526574] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="rounded border-[#D8E0DC] text-[#1F6FB2] focus:ring-[#1F6FB2]"
                />
                <span>
                  {isAr
                    ? 'أوافق على سياسة الخصوصية وشروط الحجز والإلغاء الخاصة بعيادات ابتسامتي.'
                    : 'I agree to the Ebtesamty Privacy Policy and 24-hour appointment cancellation policy.'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(4)}>
                {isAr ? 'السابق' : 'Back'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (!fullName.trim() || !phone.trim()) {
                    setError(
                      isAr
                        ? 'يرجى إدخال الاسم الكامل ورقم الهاتف للمتابعة.'
                        : 'Please enter your Full Name and Mobile Phone Number.'
                    );
                    return;
                  }
                  setError(null);
                  setStep(6);
                }}
                icon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {isAr ? 'التالي: مراجعة الحجز' : 'Review Booking Summary'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: BOOKING SUMMARY & POLICY REVIEW */}
        {step === 6 && (
          <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#123B67]">
                {isAr
                  ? 'الخطوة 6: مراجعة تفاصيل الموعد والتأكيد النهائي'
                  : 'Step 6: Review Your Appointment & Confirm'}
              </h2>
              <p className="text-xs text-[#526574] mt-1">
                {isAr
                  ? 'يرجى التأكد من صحة البيانات التالية قبل إرسال الحجز.'
                  : 'Please verify your appointment details below before submitting.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-[#526574] block">{isAr ? 'الفرع:' : 'Clinic Branch:'}</span>
                  <strong className="text-sm text-[#123B67]">
                    {isAr ? selectedBranchObj.nameAr : selectedBranchObj.nameEn}
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">
                    {isAr ? 'الخدمة / سبب الزيارة:' : 'Service / Visit Reason:'}
                  </span>
                  <strong className="text-sm text-[#123B67]">
                    {serviceSlug === 'unsure'
                      ? isAr
                        ? 'كشف وتشخيص شامل'
                        : 'Comprehensive Checkup & Consultation'
                      : isAr
                      ? selectedServiceObj.nameAr
                      : selectedServiceObj.nameEn}
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">{isAr ? 'الطبيب:' : 'Dentist:'}</span>
                  <strong className="text-sm text-[#123B67]">
                    {selectedDentistObj
                      ? isAr
                        ? selectedDentistObj.nameAr
                        : selectedDentistObj.nameEn
                      : isAr
                      ? 'أول طبيب متاح بالفرع'
                      : 'First Available Branch Specialist'}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[#526574] block">
                    {isAr ? 'التاريخ والموعد:' : 'Preferred Date & Time:'}
                  </span>
                  <strong className="text-sm text-[#1F6FB2]">
                    {selectedDate} • {selectedSlot.label} ({selectedSlot.window})
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">{isAr ? 'المريض:' : 'Patient:'}</span>
                  <strong className="text-sm text-[#123B67]">
                    {fullName} ({phone})
                  </strong>
                </div>
                <div>
                  <span className="text-[#526574] block">
                    {isAr ? 'التكلفة الاسترشادية:' : 'Estimated Starting Fee:'}
                  </span>
                  <strong className="text-sm text-[#123B67] tabular-nums">
                    EGP{' '}
                    {serviceSlug === 'unsure'
                      ? '400'
                      : selectedServiceObj.startingPriceEgp.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(5)}>
                {isAr ? 'تعديل البيانات' : 'Edit Details'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                isLoading={submitting}
                onClick={handleSubmitBooking}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isAr ? 'تأكيد وإرسال الحجز' : 'Confirm & Submit Appointment'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: CONFIRMATION SCREEN */}
        {step === 8 && (
          <div className="bg-white rounded-3xl border-2 border-[#1F6FB2] p-8 shadow-lg space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F6FB2]">
                  {isAr ? 'تم تسجيل طلب الموعد بنجاح' : 'Appointment Request Recorded'}
                </span>
                <h2 className="text-2xl font-extrabold text-[#123B67]">
                  {isAr
                    ? `شكراً لك، ${fullName}!`
                    : `Thank You, ${fullName}! Your Visit Request Is Logged.`}
                </h2>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#526574] block">
                  {isAr ? 'رقم الحجز المرجعي:' : 'Booking Reference:'}
                </span>
                <strong className="text-base font-mono text-[#1F6FB2]">
                  {bookingRef}
                </strong>
              </div>
              <div>
                <span className="text-[#526574] block">
                  {isAr ? 'الفرع:' : 'Branch:'}
                </span>
                <strong className="text-sm text-[#123B67]">
                  {isAr ? selectedBranchObj.nameAr : selectedBranchObj.nameEn}
                </strong>
              </div>
              <div>
                <span className="text-[#526574] block">
                  {isAr ? 'الموعد المختار:' : 'Date & Slot:'}
                </span>
                <strong className="text-sm text-[#123B67]">
                  {selectedDate} • {selectedSlot.label}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="px-4 py-2.5 rounded-xl bg-[#123B67] hover:bg-[#1F6FB2] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'إضافة إلى التقويم (.ics)' : 'Add to Calendar (.ics)'}</span>
              </button>

              <a
                href={selectedBranchObj.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC] text-[#123B67] hover:border-[#1F6FB2] text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isAr ? 'اتجاهات الفرع على الخريطة' : 'Branch Directions'}</span>
              </a>

              <Link
                href="/portal/intake"
                className="px-4 py-2.5 rounded-xl bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold inline-flex items-center gap-2"
              >
                <span>
                  {isAr
                    ? 'تعبئة استمارة التاريخ الطبي قبل الحضور'
                    : 'Complete Pre-Visit Medical Intake'}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading booking flow...</div>}>
      <BookingFlowContent />
    </Suspense>
  );
}
