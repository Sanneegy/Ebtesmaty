'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../../context/LanguageContext';
import {
  CLINIC_BRANCHES,
  CLINIC_DENTISTS,
} from '../../config/clinic-catalog';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  MapPin,
  Phone,
  Clock,
  Calendar,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export default function BranchesPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-8 sm:p-10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? '3 فروع متكاملة في القاهرة الكبرى'
                  : '3 Unified Dental Branches Across Greater Cairo'}
              </span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67]">
              {isAr ? 'فروع عيادات ابتسامتي' : 'Our Cairo Clinic Locations'}
            </h1>
            <p className="text-sm text-[#526574] leading-relaxed">
              {isAr
                ? 'ترتبط جميع فروعنا في مصر الجديدة والقاهرة الجديدة والمعادي بقاعدة بيانات وسجل أسنان إلكتروني موحد لخدمتك أينما كنت.'
                : 'All three branches in Heliopolis, New Cairo, and Maadi share a unified Electronic Dental Record (EDR), identical Class-B sterilization standards, and transparent EGP pricing.'}
            </p>
          </div>
          <Link href="/book">
            <Button variant="primary" size="lg" icon={<Calendar className="w-4 h-4" />}>
              {isAr ? 'احجز موعداً في أقرب فرع' : 'Book at Nearest Branch'}
            </Button>
          </Link>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CLINIC_BRANCHES.map((branch) => {
            const branchDocs = CLINIC_DENTISTS.filter((d) => d.branchCode === branch.code);
            return (
              <Card
                key={branch.code}
                className="bg-white border border-[#D8E0DC] hover:border-[#1F6FB2] transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={branch.image || '/images/branches/branch_heliopolis.jpg'}
                      alt={branch.nameEn}
                      fill
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute top-3.5 start-3.5 end-3.5 flex justify-between items-center">
                      <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#123B67] text-white shadow-sm">
                        {branch.code}
                      </span>
                      <span className="text-xs font-bold text-[#1F6FB2] bg-white/95 px-2.5 py-1 rounded-lg shadow-sm">
                        {branch.operatoriesCount} {isAr ? 'غرف علاجية' : 'Operatories'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 start-3.5 end-3.5 text-white">
                      <h2 className="text-xl font-bold drop-shadow">
                        {isAr ? branch.nameAr : branch.nameEn}
                      </h2>
                      <p className="text-xs text-slate-200 mt-0.5 truncate">
                        {isAr ? branch.landmarkAr : branch.landmarkEn}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">

                  <div className="space-y-2.5 text-xs text-[#526574] p-4 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#1F6FB2] shrink-0 mt-0.5" />
                      <span className="font-medium text-[#123B67]">
                        {isAr ? branch.addressAr : branch.addressEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#1F6FB2] shrink-0" />
                      <a
                        href={`tel:${branch.phone}`}
                        className="font-bold text-[#123B67] hover:text-[#1F6FB2]"
                      >
                        {branch.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F6FB2] shrink-0" />
                      <span>{isAr ? branch.hoursAr : branch.hoursEn}</span>
                    </div>
                  </div>

                  {/* Staffing */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#123B67]">
                      {isAr
                        ? `الأطباء بالفرع (${branchDocs.length}):`
                        : `Assigned Dentists (${branchDocs.length}):`}
                    </div>
                    <div className="space-y-1.5">
                      {branchDocs.map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#123B67] block">
                              {isAr ? d.nameAr : d.nameEn}
                            </span>
                            <span className="text-[11px] text-[#526574]">
                              {isAr ? d.specialtyAr : d.specialtyEn}
                            </span>
                          </div>
                          <Link
                            href={`/book?branch=${branch.code}&dentist=${encodeURIComponent(d.email)}`}
                            className="text-xs font-bold text-[#1F6FB2] hover:underline"
                          >
                            {isAr ? 'حجز' : 'Book'}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#123B67]">
                      {isAr ? 'التجهيزات والخدمات:' : 'Facilities & Accessibility:'}
                    </div>
                    <ul className="space-y-1">
                      {(isAr ? branch.facilitiesAr : branch.facilitiesEn).map((fac, idx) => (
                        <li key={idx} className="text-xs text-[#526574] flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1F6FB2] shrink-0 mt-0.5" />
                          <span>{fac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[#D8E0DC] space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/branches/${branch.code}`}
                      className="py-2.5 px-3 rounded-xl bg-[#F6F8FC] border border-[#D8E0DC] text-[#123B67] hover:border-[#1F6FB2] text-xs font-bold text-center transition-colors"
                    >
                      {isAr ? 'تفاصيل الفرع' : 'Branch Details'}
                    </Link>
                    <Link
                      href={`/book?branch=${branch.code}`}
                      className="py-2.5 px-3 rounded-xl bg-[#1F6FB2] hover:bg-[#13558C] text-white text-xs font-bold text-center transition-colors"
                    >
                      {isAr ? 'احجز بهذا الفرع' : 'Book Appointment'}
                    </Link>
                  </div>
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[#526574] hover:text-[#123B67] flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الاتجاهات عبر خرائط جوجل' : 'Open Directions in Google Maps'}</span>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
