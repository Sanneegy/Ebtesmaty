'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import {
  ClipboardCheck,
  Calendar,
  ShieldCheck,
  FileText,
  CreditCard,
  CheckCircle2,
  UserCheck,
  Clock,
  Sparkles,
  HeartHandshake,
  Check
} from 'lucide-react';

export default function NewPatientsPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const steps = [
    {
      step: '01',
      titleEn: 'Reserve Your Consultation',
      titleAr: 'احجز موعد استشارتك الأولى',
      descEn:
        'Select your preferred Cairo branch (Heliopolis, New Cairo, or Maadi), choose your specialist, and confirm a convenient morning or evening time slot.',
      descAr:
        'اختر الفرع الأقرب إليك (مصر الجديدة، التجمع الخامس، أو المعادي)، وحدد تخصص الطبيب والوقت الصباحي أو المسائي المناسب لك.',
    },
    {
      step: '02',
      titleEn: 'Digital Medical History Intake',
      titleAr: 'تعبئة السجل الطبي الرقمي مسبقاً',
      descEn:
        'Save reception wait time by completing your medical conditions, allergies, and current medications securely via the Patient Portal before arriving.',
      descAr:
        'وفّر وقت الانتظار عبر تسجيل الأمراض المزمنة، الحساسيات الدوائية، وقائمة الأدوية عبر بوابة المريض بأمان قبل وصولك للعيادة.',
    },
    {
      step: '03',
      titleEn: 'Comprehensive Examination & Diagnostics',
      titleAr: 'الفحص السريري الشامل والأشعة التشخيصية',
      descEn:
        'Your dentist performs a meticulous 32-tooth FDI charting assessment, periodontal screening, and digital radiography if clinically indicated.',
      descAr:
        'يقوم الطبيب المختص بفحص الأسنان واللثة بدقة على مخطط FDI الرقمي مع أخذ الأشعة التشخيصية اللازمة إذا استدعت الحالة.',
    },
    {
      step: '04',
      titleEn: 'Written Care Plan & Itemized EGP Fees',
      titleAr: 'خطة علاج مكتوبة وتكلفة معتمدة بالجنيه',
      descEn:
        'Before any procedure begins, we discuss staged treatment options, session counts, and transparent payment schedules tailored to your priorities.',
      descAr:
        'قبل البدء في أي علاج، نستعرض معك خطة العلاج المرحلية، عدد الجلسات، والتكلفة المحددة بالجنيه المصري دون أي مفاجآت.',
    },
  ];

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10 lg:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Editorial Header with Reassurance */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-8 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'دليل المرضى الجدد' : 'New Patient Care Pathway'}</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67] tracking-tight">
              {isAr
                ? 'تجربة زيارتك الأولى لعيادات ابتسامتي'
                : 'A Clear, Reassuring First Visit Experience'}
            </h1>
            <p className="text-sm text-[#526574] leading-relaxed max-w-2xl">
              {isAr
                ? 'صممنا رحلة المريض الجديد في ابتسامتي لتكون منظمة وهادئة. فحص سريري وافٍ، خطة مكتوبة واضحة، ورعاية تحترم وقتك وراحتك.'
                : 'From secure digital intake before you arrive to itemized written treatment plans in EGP, our goal is calm clinical mastery with zero surprises.'}
            </p>
          </div>

          <div className="lg:col-span-4 relative h-48 lg:h-56 rounded-2xl overflow-hidden border border-[#D8E0DC] shadow-xs">
            <Image
              src="/images/about_team.jpg"
              alt="Ebtesamty Clinical Team"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 4-Step Journey Grid */}
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-[#123B67]">
              {isAr ? 'مراحل رحلتك في الزيارة الأولى' : 'Your 4-Stage Onboarding Pathway'}
            </h2>
            <p className="text-xs text-[#526574] mt-1">
              {isAr ? 'خطوات مبسطة تضمن لك أعلى معايير السلامة والتنظيم' : 'A structured protocol designed for diagnostic precision and comfort'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {steps.map((s) => (
              <div
                key={s.step}
                className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-3 shadow-xs hover:border-[#1F6FB2] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-[#123B67] text-white">
                    STEP {s.step}
                  </span>
                  <Sparkles className="w-4 h-4 text-[#1F6FB2]" />
                </div>
                <h3 className="text-base font-bold text-[#123B67]">
                  {isAr ? s.titleAr : s.titleEn}
                </h3>
                <p className="text-xs text-[#526574] leading-relaxed">
                  {isAr ? s.descAr : s.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Preparation Checklist & Call to Action */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-8 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xl font-bold text-[#123B67] flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#1F6FB2]" />
              <span>{isAr ? 'المستندات والمعلومات المطلوبة للزيارة' : 'What to Bring to Your First Visit'}</span>
            </h2>
            <ul className="space-y-2.5 text-xs text-[#526574]">
              <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'بطاقة الرقم القومي المصرية أو جواز السفر الساري لتأكيد هويتك وربط ملفك الطبي ببوابة المريض.'
                    : 'Valid Egyptian National ID or Passport for clinical identity confirmation and secure Portal link verification.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'قائمة بأي أدوية مزمنة منتظمة أو حالات حساسية دوائية سابقة (يمكنك أيضاً تسجيلها عبر البوابة).'
                    : 'A list of active medications, blood thinners, or antibiotic allergies (can also be submitted digitally via Portal).'}
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'أي أشعة أسنان أو تقارير علاجية سابقة تم إجراؤها خلال الأشهر الستة الماضية إن وجدت.'
                    : 'Any prior dental radiographs or clinical treatment summaries from the past 6 months if available.'}
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 bg-[#F6F8FC] p-6 rounded-2xl border border-[#D8E0DC] flex flex-col gap-3">
            <div className="text-center pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526574] block">Comprehensive Consultation</span>
              <span className="text-2xl font-extrabold text-[#123B67] tabular-nums">400 EGP</span>
              <span className="text-[11px] text-[#526574] block mt-0.5">Includes full examination &amp; charting</span>
            </div>

            <Link href="/book">
              <Button variant="primary" size="lg" fullWidth icon={<Calendar className="w-4 h-4" />}>
                {isAr ? 'احجز موعد الكشف الأولي' : 'Book First Visit'}
              </Button>
            </Link>

            <Link href="/portal">
              <Button variant="outline" size="lg" fullWidth>
                {isAr ? 'فتح بوابة المريض' : 'Access Patient Portal'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
