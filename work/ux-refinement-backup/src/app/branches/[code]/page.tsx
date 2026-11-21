'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import {
  CLINIC_BRANCHES,
  CLINIC_DENTISTS,
  CLINIC_SERVICES,
} from '../../../config/clinic-catalog';
import { Button } from '../../../components/ui/Button';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Stethoscope,
  Building2,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';

export default function BranchDetailPage() {
  const params = useParams();
  const codeParam = typeof params?.code === 'string' ? params.code.toUpperCase() : 'BR-A';
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const branch =
    CLINIC_BRANCHES.find((b) => b.code === codeParam || b.slug === codeParam.toLowerCase()) ||
    CLINIC_BRANCHES[0];

  const branchDentists = CLINIC_DENTISTS.filter((d) => d.branchCodes.includes(branch.code));
  const branchServices = CLINIC_SERVICES.filter((s) =>
    s.availableBranches.includes(branch.code)
  );

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/branches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526574] hover:text-[#123B67] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? 'العودة إلى قائمة الفروع' : 'Back to Multi-Branch Directory'}</span>
        </Link>

        {/* Hero Section with Architectural Photography */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Facility Photo Banner */}
            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[420px] bg-slate-900">
              <Image
                src={branch.image || '/images/branches/branch_heliopolis.jpg'}
                alt={branch.nameEn}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#123B67]/90 via-[#123B67]/30 to-transparent lg:hidden" />
              <div className="absolute bottom-4 left-4 lg:hidden text-white">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1F6FB2]">
                  {branch.code}
                </span>
              </div>
            </div>

            {/* Branch Details & Action Card */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#123B67] text-white">
                    {branch.code}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#EAF3FF] text-[#1F6FB2]">
                    {branch.operatoriesCount} {isAr ? 'غرف علاجية مجهزة' : 'Equipped Operatories'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B67] tracking-tight">
                  {isAr ? branch.nameAr : branch.nameEn}
                </h1>

                <p className="text-sm text-[#526574] leading-relaxed">
                  {isAr ? branch.landmarkAr : branch.landmarkEn}
                </p>

                {/* Address & Hours Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123B67] block">
                        {isAr ? 'العنوان المعتمد:' : 'Address & Location:'}
                      </span>
                      <span className="text-[#526574] leading-relaxed">
                        {isAr ? branch.addressAr : branch.addressEn}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#123B67] block">
                        {isAr ? 'ساعات العمل اليومية:' : 'Operational Hours:'}
                      </span>
                      <span className="text-[#526574] leading-relaxed">
                        {isAr ? branch.hoursAr : branch.hoursEn}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receptionist Contact & Direct Booking */}
              <div className="bg-[#F6F8FC] rounded-2xl border border-[#D8E0DC] p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526574] block">
                      {isAr ? 'مسؤول الاستقبال والتنسيق' : 'Branch Reception Desk'}
                    </span>
                    <span className="text-sm font-bold text-[#123B67]">
                      {isAr ? branch.receptionistNameAr : branch.receptionistNameEn}
                    </span>
                  </div>

                  <a
                    href={`tel:${branch.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D8E0DC] text-xs font-bold text-[#1F6FB2] hover:border-[#1F6FB2] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{branch.phone}</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <Link href={`/book?branch=${branch.code}`}>
                    <Button variant="primary" size="md" fullWidth icon={<Calendar className="w-4 h-4" />}>
                      {isAr ? 'احجز موعداً في هذا الفرع' : `Book at ${branch.shortNameEn}`}
                    </Button>
                  </Link>

                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-white border border-[#D8E0DC] text-xs font-bold text-[#123B67] hover:border-[#1F6FB2] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? 'اتجاهات الخريطة' : 'Map & Directions'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content: Resident Dentists with Portraits & Branch Facilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Resident Dentists Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
                <div>
                  <h2 className="text-lg font-bold text-[#123B67]">
                    {isAr
                      ? `الأطباء المقيمون بفرع ${branch.shortNameAr} (${branchDentists.length})`
                      : `Resident Specialists at ${branch.shortNameEn} (${branchDentists.length})`}
                  </h2>
                  <p className="text-xs text-[#526574]">
                    {isAr ? 'استشاريون معتمدون يقدمون الرعاية في هذا الفرع' : 'Certified faculty members practicing at this location'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {branchDentists.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] space-y-3 hover:border-[#1F6FB2] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[#D8E0DC]">
                          <Image
                            src={doc.image || '/images/ebtesamty_official_logo.jpg'}
                            alt={doc.nameEn}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#123B67]">
                            {isAr ? doc.nameAr : doc.nameEn}
                          </h3>
                          <p className="text-xs font-semibold text-[#1F6FB2]">
                            {isAr ? doc.specialtyAr : doc.specialtyEn}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/book?branch=${branch.code}&dentist=${encodeURIComponent(doc.email)}`}
                        className="px-3 py-1.5 rounded-xl bg-[#1F6FB2] text-white text-xs font-bold hover:bg-[#13558C] transition-colors shrink-0"
                      >
                        {isAr ? 'حجز' : 'Book'}
                      </Link>
                    </div>

                    <p className="text-xs text-[#526574] leading-relaxed">
                      {isAr ? doc.bioAr : doc.bioEn}
                    </p>

                    <div className="text-[11px] text-[#526574] pt-2 border-t border-[#D8E0DC]/60 flex items-center justify-between">
                      <span><strong className="text-[#123B67]">{isAr ? 'جدول العيادة:' : 'Duty Schedule:'}</strong> {isAr ? doc.scheduleSummaryAr : doc.scheduleSummaryEn}</span>
                      <span className="font-semibold text-[#1F6FB2]">{doc.experienceYears}+ Yrs Exp</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Facilities & Services Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Facility Features */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#123B67] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1F6FB2]" />
                <span>{isAr ? 'تجهيزات الفرع وبيئة العمل السريرية' : 'Facility Specifications & Amenities'}</span>
              </h2>

              <ul className="space-y-2.5">
                {(isAr ? branch.facilitiesAr : branch.facilitiesEn).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#123B67] p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]/60">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-xs text-[#526574] p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]/60">
                  <MapPin className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                  <span>{isAr ? branch.parkingAr : branch.parkingEn}</span>
                </li>
              </ul>
            </div>

            {/* Available Services at this Branch */}
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-7 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#123B67]">
                {isAr ? 'الخدمات السريرية المتاحة بالفرع' : 'Procedures Performed at this Branch'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {branchServices.map((srv) => (
                  <Link
                    key={srv.slug}
                    href={`/services/${srv.slug}`}
                    className="p-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] hover:border-[#1F6FB2] transition-colors flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#123B67] truncate">
                      {isAr ? srv.nameAr : srv.nameEn}
                    </span>
                    <span className="text-[11px] font-bold text-[#1F6FB2] shrink-0 ms-2 tabular-nums">
                      {srv.startingPriceEgp} EGP
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
