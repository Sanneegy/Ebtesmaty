'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import {
  CLINIC_SERVICES,
  CLINIC_BRANCHES,
  CLINIC_DENTISTS,
} from '../../../config/clinic-catalog';
import { Button } from '../../../components/ui/Button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const service = CLINIC_SERVICES.find((s) => s.slug === slug) || CLINIC_SERVICES[0];
  const availableBranches = CLINIC_BRANCHES.filter((b) =>
    service.availableBranches.includes(b.code)
  );
  const matchingDentists = CLINIC_DENTISTS.filter((d) =>
    service.availableBranches.includes(d.branchCode)
  );

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526574] hover:text-[#123B67] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? 'العودة إلى دليل الخدمات السريرية' : 'Back to Clinical Services Directory'}</span>
        </Link>

        {/* Hero Section with Procedure Photography */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Procedure Photo Banner */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[400px] bg-slate-900">
              <Image
                src={service.image || '/images/service_cosmetic.jpg'}
                alt={service.nameEn}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#123B67]/90 via-[#123B67]/30 to-transparent lg:hidden" />
              <div className="absolute bottom-4 left-4 lg:hidden text-white">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1F6FB2]">
                  {isAr ? service.categoryAr : service.categoryEn}
                </span>
              </div>
            </div>

            {/* Procedure Details & Scheduling Card */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#EAF3FF] text-[#1F6FB2]">
                    {isAr ? service.categoryAr : service.categoryEn}
                  </span>
                  <span className="text-xs font-mono text-[#526574] bg-[#F6F8FC] px-2.5 py-1 rounded border border-[#D8E0DC]">
                    {service.code}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B67] tracking-tight">
                  {isAr ? service.nameAr : service.nameEn}
                </h1>

                <p className="text-sm text-[#526574] leading-relaxed">
                  {isAr ? service.overviewAr : service.overviewEn}
                </p>
              </div>

              {/* Pricing & Duration Callout */}
              <div className="bg-[#F6F8FC] rounded-2xl border border-[#D8E0DC] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-[#526574] uppercase tracking-wider">
                      {isAr ? 'الرسوم الاسترشادية' : 'Estimated Base Fee'}
                    </div>
                    <div className="text-2xl font-extrabold text-[#123B67] tabular-nums mt-0.5">
                      {isAr ? service.priceRangeAr : service.priceRangeEn}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#123B67] bg-white px-3.5 py-2 rounded-xl border border-[#D8E0DC]">
                    <Clock className="w-4 h-4 text-[#1F6FB2]" />
                    <span>{service.durationMinutes} {isAr ? 'دقيقة للجلسة' : 'Min Duration'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#526574] flex items-start gap-1.5 border-t border-[#D8E0DC]/60 pt-3">
                  <Info className="w-3.5 h-3.5 text-[#1F6FB2] shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'الرسوم استرشادية بحسب بروتوكول العيادة. يتم اعتماد الخطة العلاجية والمالية النهائية عقب الكشف الإكلينيكي المباشر.'
                      : 'Fee ranges reflect standard clinical protocols. Final treatment and financing schedules are confirmed upon diagnostic consultation.'}
                  </span>
                </div>

                <Link href={`/book?service=${service.slug}`} className="block pt-1">
                  <Button variant="primary" size="lg" fullWidth icon={<Calendar className="w-4 h-4" />}>
                    {isAr ? 'احجز استشارة لهذا العلاج' : 'Schedule Diagnostic Consultation'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Clinical Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content: 3-Stage Process & FAQs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step-by-Step Clinical Journey */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF3FF] text-[#1F6FB2] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#123B67]">
                    {isAr ? 'مراحل العلاج الإكلينيكي المتبعة' : 'Clinical Treatment Protocol'}
                  </h2>
                  <p className="text-xs text-[#526574]">
                    {isAr ? 'خطوات دقيقة من التشخيص وحتى المتابعة' : 'From initial diagnostics to long-term maintenance'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(isAr ? service.processStepsAr : service.processStepsEn).map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC]"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#123B67] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="text-xs font-medium text-[#123B67] leading-relaxed pt-1">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service-Specific FAQs */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#123B67] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#1F6FB2]" />
                <span>{isAr ? 'الأسئلة الشائعة حول هذا الإجراء' : 'Procedure FAQs & Patient Inquiries'}</span>
              </h2>
              <div className="space-y-3">
                {service.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] space-y-1.5"
                  >
                    <h3 className="text-xs font-bold text-[#123B67] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FB2]" />
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                    </h3>
                    <p className="text-xs text-[#526574] leading-relaxed ps-3.5">
                      {isAr ? faq.aAr : faq.aEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Candidates, Assigned Doctors with Portraits, Branch Availability */}
          <div className="lg:col-span-5 space-y-6">
            {/* Who Needs This Assessment */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-[#123B67]">
                {isAr ? 'متى تحتاج إلى هذا الفحص؟' : 'Clinical Indications & Candidacy'}
              </h2>
              <p className="text-xs text-[#526574] leading-relaxed">
                {isAr ? service.whoNeedsItAr : service.whoNeedsItEn}
              </p>

              <div className="p-4 rounded-2xl bg-[#EAF3FF] border border-[#1F6FB2]/20 space-y-2">
                <div className="text-xs font-bold text-[#123B67] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1F6FB2]" />
                  <span>
                    {isAr ? 'إرشادات الاستعداد للزيارة' : 'Pre-Visit Preparation Guidance'}
                  </span>
                </div>
                <p className="text-[11px] text-[#526574] leading-relaxed">
                  {isAr
                    ? 'يرجى مراجعة وتعبئة استمارة التاريخ الطبي والحساسية عبر بوابة المريض قبل الموعد بـ 24 ساعة لضمان سلامتك وسرعة دخولك.'
                    : 'Please submit your medical history and allergies via the secure Patient Portal 24 hours prior to appointment to ensure clinical safety.'}
                </p>
              </div>
            </div>

            {/* Clinicians Offering Care (with Portraits) */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-[#123B67] flex items-center justify-between">
                <span>{isAr ? 'الأطباء الأخصائيون' : 'Attending Specialists'}</span>
                <span className="text-[11px] text-[#526574] font-medium">{matchingDentists.length} Faculty</span>
              </h2>

              <div className="space-y-2.5">
                {matchingDentists.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] hover:border-[#1F6FB2] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#D8E0DC]">
                        <Image
                          src={d.image || '/images/ebtesamty_official_logo.jpg'}
                          alt={d.nameEn}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#123B67] block truncate">
                          {isAr ? d.nameAr : d.nameEn}
                        </span>
                        <span className="text-[11px] text-[#1F6FB2] font-semibold block truncate">
                          {isAr ? d.specialtyAr : d.specialtyEn} • {d.branchCode}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/book?branch=${d.branchCode}&service=${service.slug}&dentist=${encodeURIComponent(d.email)}`}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#D8E0DC] text-xs font-bold text-[#1F6FB2] hover:bg-[#1F6FB2] hover:text-white transition-all shrink-0"
                    >
                      {isAr ? 'حجز' : 'Book'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Available at Branches */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 space-y-3 shadow-xs">
              <h2 className="text-base font-bold text-[#123B67]">
                {isAr ? 'الفروع المجهزة للعلاج' : 'Available Clinic Branches'}
              </h2>
              <div className="space-y-2">
                {availableBranches.map((b) => (
                  <div
                    key={b.code}
                    className="p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#123B67]">
                        {isAr ? b.nameAr : b.nameEn}
                      </div>
                      <div className="text-[11px] text-[#526574]">
                        {b.operatoriesCount} Operatories • {b.phone}
                      </div>
                    </div>
                    <Link
                      href={`/book?branch=${b.code}&service=${service.slug}`}
                      className="text-xs font-bold text-[#1F6FB2] hover:underline shrink-0"
                    >
                      {isAr ? 'حجز بالفرع' : 'Book Here'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
