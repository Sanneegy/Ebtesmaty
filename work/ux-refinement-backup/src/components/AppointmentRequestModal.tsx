'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  User, 
  Phone, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBranchCode?: string;
  preselectedService?: string;
}

const BRANCHES = [
  {
    code: 'BR-A',
    nameEn: 'Branch A — Heliopolis',
    nameAr: 'الفرع أ — مصر الجديدة',
    addressEn: '14 Baghdad Street, Korba, Heliopolis, Cairo',
    addressAr: '١٤ شارع بغداد، الكوربة، مصر الجديدة، القاهرة',
    phone: '+20 2 2410 0001',
    operatories: '4 Operatory Suites',
  },
  {
    code: 'BR-B',
    nameEn: 'Branch B — New Cairo',
    nameAr: 'الفرع ب — القاهرة الجديدة',
    addressEn: 'Plot 42, North 90th Street, 5th Settlement, New Cairo',
    addressAr: 'قطعة ٤٢، التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
    phone: '+20 2 2810 0002',
    operatories: '5 Operatory Suites',
  },
  {
    code: 'BR-C',
    nameEn: 'Branch C — Maadi',
    nameAr: 'الفرع ج — المعادي',
    addressEn: 'Road 9, Maadi, Cairo (Demo Fixture)',
    addressAr: 'شارع ٩، المعادي، القاهرة (بيانات تجريبية)',
    phone: '+20 2 2510 0003',
    operatories: '3 Operatory Suites',
  },
];

const SERVICES = [
  { id: 'CHECKUP', nameEn: 'Comprehensive Checkup & Diagnostic Digital X-Ray', nameAr: 'فحص سريري شامل وأشعة رقمية تشخيصية', icon: '🔍' },
  { id: 'COSMETIC', nameEn: 'Cosmetic Dentistry & Ceramic Veneers', nameAr: 'تجميل الأسنان وفينير البورسلين', icon: '✨' },
  { id: 'IMPLANT', nameEn: 'Titanium Dental Implants & Surgical Restoration', nameAr: 'زراعة الأسنان والتركيبات الجراحية', icon: '💎' },
  { id: 'ENDO', nameEn: 'Microscopic Endodontics (Root Canal Therapy)', nameAr: 'علاج الجذور بالميكروسكوب', icon: '🩺' },
  { id: 'ORTHO', nameEn: 'Orthodontics & Clear Aligners', nameAr: 'تقويم الأسنان والتقويم الشفاف', icon: '📐' },
  { id: 'HYGIENE', nameEn: 'Ultrasonic Scaling, Stain Removal & Deep Polish', nameAr: 'تنظيف الجير وتلميع الأسنان', icon: '🌿' },
  { id: 'PEDIATRIC', nameEn: 'Gentle Pediatric Dentistry for Children', nameAr: 'طب أسنان الأطفال المتخصص', icon: '🧸' },
  { id: 'URGENT', nameEn: 'Urgent Dental Pain & Emergency Assessment', nameAr: 'طوارئ ألم الأسنان الحاد والفحص الفوري', icon: '⚡' },
];

const TIME_WINDOWS = [
  { id: 'MORNING', labelEn: 'Morning (09:00 AM – 01:00 PM)', labelAr: 'صباحاً (٠٩:٠٠ ص – ٠١:٠٠ م)' },
  { id: 'AFTERNOON', labelEn: 'Afternoon (01:00 PM – 05:00 PM)', labelAr: 'ظهراً (٠١:٠٠ م – ٠٥:٠٠ م)' },
  { id: 'EVENING', labelEn: 'Evening (05:00 PM – 09:00 PM)', labelAr: 'مساءً (٠٥:٠٠ م – ٠٩:٠٠ م)' },
  { id: 'ANYTIME', labelEn: 'Any Available Window', labelAr: 'أي موعد متاح' },
];

export function AppointmentRequestModal({
  isOpen,
  onClose,
  preselectedBranchCode = 'BR-A',
  preselectedService,
}: AppointmentRequestModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [step, setStep] = useState<number>(1);
  const [selectedBranch, setSelectedBranch] = useState<string>(preselectedBranchCode);
  const [selectedService, setSelectedService] = useState<string>(preselectedService || SERVICES[0].nameEn);
  const [preferredDate, setPreferredDate] = useState<string>(
    () => new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<string>('MORNING');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    trackingCode: string;
    branchName: string;
    date: string;
    window: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    setError(null);
    if (step === 1 && !selectedBranch) {
      setError(isAr ? 'يرجى اختيار فرع العيادة.' : 'Please select a clinic branch.');
      return;
    }
    if (step === 2 && !selectedService) {
      setError(isAr ? 'يرجى تحديد الخدمة المطلوبة.' : 'Please select the dental service you need.');
      return;
    }
    if (step === 3 && !preferredDate) {
      setError(isAr ? 'يرجى تحديد التاريخ المناسب.' : 'Please choose a preferred visit date.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(isAr ? 'يرجى كتابة الاسم بالكامل (٣ أحرف على الأقل).' : 'Please enter your full name (at least 3 characters).');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError(isAr ? 'يرجى كتابة رقم هاتف مصري أو دولي صحيح للتواصل والتأكيد.' : 'Please enter a valid phone number for confirmation.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/scheduling/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchCode: selectedBranch,
          serviceName: selectedService,
          preferredDate,
          preferredTimeWindow,
          fullName: fullName.trim(),
          phone: cleanPhone,
          reason: reason.trim() || `${selectedService} consultation`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appointment request');
      }

      const branchObj = BRANCHES.find((b) => b.code === selectedBranch);
      setConfirmation({
        trackingCode: data.trackingCode || data.request?.id || 'REQ-REGISTERED',
        branchName: isAr ? (branchObj?.nameAr || 'الفرع المختار') : (branchObj?.nameEn || 'Selected Branch'),
        date: preferredDate,
        window: preferredTimeWindow,
      });
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'An error occurred while transmitting your request.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setConfirmation(null);
    setError(null);
    setFullName('');
    setPhone('');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#161614]/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#FAF9F5] text-[#1A1A18] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#DDD9CE] overflow-hidden my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Subtle decorative top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#947E5B] via-[#184E48] to-[#947E5B]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-[#DDD9CE]/60 flex items-start justify-between bg-white/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#947E5B] bg-[#947E5B]/10 rounded-full border border-[#947E5B]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'عيادات ابتسامتي التخصصية' : 'Ebtesamty Dental Practices'}
              </span>
              <span className="text-[11px] font-mono text-[#6E6D66] bg-[#F2EFE9] px-2 py-0.5 rounded">
                Cairo, Egypt
              </span>
            </div>
            <h2 id="appointment-modal-title" className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1A1A18]">
              {isAr ? (
                <>طلب موعد <span className="italic font-normal">عيادي واستشارة</span></>
              ) : (
                <>Request a <span className="italic font-normal">Clinical Consultation</span></>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6D66] mt-1">
              {isAr
                ? 'حدد الفرع والتخصص والتاريخ المناسب. يقوم مكتب الاستقبال بمراجعة جدول العيادات وتأكيد الحجز فوراً.'
                : 'Select your preferred branch, specialty, and schedule window. Reception will verify availability and confirm promptly.'}
            </p>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 text-[#6E6D66] hover:text-[#1A1A18] hover:bg-[#F2EFE9] rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar (if not completed) */}
        {step < 5 && (
          <div className="px-6 sm:px-8 py-3 bg-[#F2EFE9]/60 border-b border-[#DDD9CE]/40 flex items-center justify-between text-xs font-medium text-[#6E6D66]">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#1A1A18] text-white' : step > 1 ? 'bg-[#184E48] text-white' : 'bg-[#DDD9CE] text-[#6E6D66]'}`}>1</span>
              <span className={step === 1 ? 'font-semibold text-[#1A1A18]' : ''}>{isAr ? 'الفرع' : 'Branch'}</span>
            </div>
            <div className="h-px w-6 sm:w-10 bg-[#DDD9CE]" />
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#1A1A18] text-white' : step > 2 ? 'bg-[#184E48] text-white' : 'bg-[#DDD9CE] text-[#6E6D66]'}`}>2</span>
              <span className={step === 2 ? 'font-semibold text-[#1A1A18]' : ''}>{isAr ? 'الخدمة' : 'Care'}</span>
            </div>
            <div className="h-px w-6 sm:w-10 bg-[#DDD9CE]" />
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#1A1A18] text-white' : step > 3 ? 'bg-[#184E48] text-white' : 'bg-[#DDD9CE] text-[#6E6D66]'}`}>3</span>
              <span className={step === 3 ? 'font-semibold text-[#1A1A18]' : ''}>{isAr ? 'الموعد' : 'Time'}</span>
            </div>
            <div className="h-px w-6 sm:w-10 bg-[#DDD9CE]" />
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-[#1A1A18] text-white' : 'bg-[#DDD9CE] text-[#6E6D66]'}`}>4</span>
              <span className={step === 4 ? 'font-semibold text-[#1A1A18]' : ''}>{isAr ? 'البيانات' : 'Details'}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[62vh] overflow-y-auto">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Branch Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6E6D66]">
                  {isAr ? 'اختر أقرب فرع لعيادات ابتسامتي' : 'Select Your Preferred Practice Location'}
                </label>
                <span className="text-[11px] text-[#947E5B] italic font-serif">
                  {isAr ? 'ثلاثة فروع متكاملة بالقاهرة' : '3 Integrated Cairo Clinics'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {BRANCHES.map((b) => {
                  const isSelected = selectedBranch === b.code;
                  return (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => setSelectedBranch(b.code)}
                      className={`text-start p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#184E48] bg-white ring-2 ring-[#184E48]/20 shadow-md'
                          : 'border-[#DDD9CE] bg-white/60 hover:bg-white hover:border-[#947E5B]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-[#184E48] text-white' : 'bg-[#F2EFE9] text-[#6E6D66]'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-[#1A1A18]">
                            {isAr ? b.nameAr : b.nameEn}
                          </h4>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#F2EFE9] text-[#6E6D66]">
                            {b.operatories}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E6D66] mt-1 line-clamp-1">
                          {isAr ? b.addressAr : b.addressEn}
                        </p>
                        <p className="text-[11px] font-mono text-[#947E5B] mt-1">
                          {b.phone}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Honest Academic Demonstration Disclaimer */}
              <div className="mt-4 p-3 bg-[#F2EFE9] rounded-xl border border-[#DDD9CE]/80 text-[11px] text-[#6E6D66] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#947E5B] mt-0.5" />
                <span>
                  {isAr
                    ? 'بيئة تجريبية أكاديمية — جميع الفروع وأرقام الهواتف خيالية لتقييم المشروع، وتعمل بنظام قاعدة بيانات PostgreSQL الحقيقية.'
                    : 'Demonstration Environment — Branch locations and telephone lines are fictional for academic evaluation, fully operating on native PostgreSQL.'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Dental Specialty / Care */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6E6D66]">
                  {isAr ? 'ما هي الرعاية السريرية أو العلاج المطلوب؟' : 'What Dental Care Do You Require?'}
                </label>
                <span className="text-[11px] text-[#947E5B] italic font-serif">
                  {isAr ? '٨ تخصصات طبية دقيقة' : '8 Specialized Clinical Fields'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SERVICES.map((s) => {
                  const isSelected = selectedService === (isAr ? s.nameAr : s.nameEn);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(isAr ? s.nameAr : s.nameEn)}
                      className={`text-start p-3.5 rounded-xl border transition-all text-xs flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#184E48] bg-white ring-2 ring-[#184E48]/20 font-semibold text-[#184E48] shadow-sm'
                          : 'border-[#DDD9CE] bg-white/60 hover:bg-white text-[#1A1A18]'
                      }`}
                    >
                      <span className="text-xl shrink-0">{s.icon}</span>
                      <span className="flex-1 leading-snug">{isAr ? s.nameAr : s.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Date & Preferred Window */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6D66] mb-2">
                  {isAr ? 'التاريخ المفضل للزيارة' : 'Preferred Appointment Date'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#DDD9CE] rounded-xl text-sm text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#184E48]/20 focus:border-[#184E48]"
                  />
                  <Calendar className="w-4 h-4 text-[#6E6D66] absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6D66] mb-2">
                  {isAr ? 'فترة التوقيت المناسبة' : 'Preferred Daily Time Window'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TIME_WINDOWS.map((w) => {
                    const isSelected = preferredTimeWindow === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setPreferredTimeWindow(w.id)}
                        className={`text-start p-3 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-[#184E48] bg-white ring-2 ring-[#184E48]/20 text-[#184E48] font-semibold'
                            : 'border-[#DDD9CE] bg-white/60 hover:bg-white text-[#1A1A18]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#947E5B]" />
                        <span>{isAr ? w.labelAr : w.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/50 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  {isAr
                    ? 'ملاحظة تنظيمية: الطلب لا يقوم بحجز الكرسي آلياً بدون مراجعة؛ بل يقوم فريق الاستقبال بمطابقة الموعد مع جدول الطبيب المعالج والاتصال بكم لتأكيد الحجز.'
                    : 'Clinical Notice: To ensure quality care, requests do not auto-book chairs. Our reception coordinates dentist duty rosters and verifies scheduling with you.'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Patient Details */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6D66] mb-1.5">
                  {isAr ? 'الاسم بالكامل *' : 'Full Legal Name *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: سارة محمد أحمد' : 'e.g. Sarah Mansour'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#DDD9CE] rounded-xl text-sm text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#184E48]/20 focus:border-[#184E48]"
                  />
                  <User className="w-4 h-4 text-[#6E6D66] absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6D66] mb-1.5">
                  {isAr ? 'رقم الهاتف للتأكيد (محمول / واتساب) *' : 'Phone Number (Mobile / WhatsApp) *'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+20 10 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#DDD9CE] rounded-xl text-sm text-[#1A1A18] font-mono focus:outline-none focus:ring-2 focus:ring-[#184E48]/20 focus:border-[#184E48]"
                  />
                  <Phone className="w-4 h-4 text-[#6E6D66] absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6D66] mb-1.5">
                  {isAr ? 'أعراض أو ملاحظات سريرية ترغب في مشاركتها' : 'Symptoms or Clinical Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    isAr
                      ? 'مثال: ألم في الضرس العلوي عند تناول المشروبات الباردة...'
                      : 'e.g. Tooth sensitivity to cold liquids, previous filling loose...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DDD9CE] rounded-xl text-xs text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#184E48]/20 focus:border-[#184E48]"
                />
              </div>

              {/* Order summary pill */}
              <div className="p-3 bg-[#F2EFE9] rounded-xl border border-[#DDD9CE] text-xs space-y-1 text-[#6E6D66]">
                <div className="flex justify-between">
                  <span>{isAr ? 'الفرع:' : 'Branch:'}</span>
                  <span className="font-semibold text-[#1A1A18]">
                    {BRANCHES.find((b) => b.code === selectedBranch)?.nameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'الخدمة:' : 'Care:'}</span>
                  <span className="font-semibold text-[#1A1A18]">{selectedService}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'الموعد:' : 'Window:'}</span>
                  <span className="font-semibold text-[#1A1A18]">{preferredDate} ({preferredTimeWindow})</span>
                </div>
              </div>
            </form>
          )}

          {/* STEP 5: Success Confirmation */}
          {step === 5 && confirmation && (
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-[#184E48]/10 text-[#184E48] rounded-full flex items-center justify-center border border-[#184E48]/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-[#184E48] bg-[#184E48]/10 rounded-full">
                  {isAr ? 'تم استلام طلب الموعد بنجاح' : 'Request Transmitted Successfully'}
                </span>
                <h3 className="text-2xl font-serif text-[#1A1A18]">
                  {isAr ? 'شكراً لاختيارك عيادات ابتسامتي' : 'Thank You for Trusting Ebtesamty'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6D66] max-w-md mx-auto mt-1">
                  {isAr
                    ? 'تم تسجيل طلبك في جدول استعلامات العيادة بنجاح. سيتواصل معك موظف الاستقبال لتأكيد الحجز الطبي.'
                    : 'Your appointment request has been added to our live reception agenda. Our front desk team will contact you promptly to confirm.'}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#DDD9CE] text-start max-w-md mx-auto space-y-2 text-xs shadow-sm">
                <div className="flex justify-between border-b border-[#DDD9CE]/60 pb-2">
                  <span className="text-[#6E6D66]">{isAr ? 'رمز متابعة الطلب:' : 'Tracking Reference:'}</span>
                  <span className="font-mono font-bold text-[#184E48]">{confirmation.trackingCode}</span>
                </div>
                <div className="flex justify-between border-b border-[#DDD9CE]/60 pb-2">
                  <span className="text-[#6E6D66]">{isAr ? 'الفرع:' : 'Branch:'}</span>
                  <span className="font-semibold text-[#1A1A18]">{confirmation.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6D66]">{isAr ? 'التاريخ المفضل:' : 'Preferred Date:'}</span>
                  <span className="font-semibold text-[#1A1A18]">{confirmation.date}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-8 py-3 bg-[#1A1A18] hover:bg-[#184E48] text-white rounded-full text-xs font-semibold transition-colors"
                >
                  {isAr ? 'إغلاق والعودة للموقع' : 'Done & Return to Website'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-6 py-3 border border-[#DDD9CE] text-[#1A1A18] hover:bg-[#F2EFE9] rounded-full text-xs font-semibold transition-colors"
                >
                  {isAr ? 'طلب موعد آخر' : 'Submit Another Request'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (for steps 1 to 4) */}
        {step < 5 && (
          <div className="p-4 sm:p-6 bg-white/80 border-t border-[#DDD9CE]/60 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#DDD9CE] text-[#1A1A18] text-xs font-medium hover:bg-[#F2EFE9] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'السابق' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full text-[#6E6D66] text-xs font-medium hover:text-[#1A1A18] transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1A18] hover:bg-[#184E48] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>{isAr ? 'التالي' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#184E48] hover:bg-[#133f3a] text-white text-xs font-semibold transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <span>{isAr ? 'جاري الإرسال...' : 'Transmitting...'}</span>
                ) : (
                  <>
                    <span>{isAr ? 'تأكيد إرسال الطلب' : 'Submit Request'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
