'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { CLINIC_FAQS } from '../../config/clinic-catalog';
import { HelpCircle, Search, Calendar, ChevronDown, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function FaqsPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'ALL', nameEn: 'All Topics', nameAr: 'جميع المواضيع' },
    { id: 'Appointments', nameEn: 'Booking & Visits', nameAr: 'المواعيد والحجز' },
    { id: 'Clinical Care', nameEn: 'Procedures & Care', nameAr: 'الخدمات السريرية' },
    { id: 'Billing & Insurance', nameEn: 'Fees & Payment', nameAr: 'الأسعار والدفع' },
    { id: 'Sterilization & Safety', nameEn: 'Sterility & Protocols', nameAr: 'التعقيم والسلامة' },
  ];

  const filtered = CLINIC_FAQS.filter((item) => {
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    if (!q) return matchesCat;
    const matchesQuery = (
      item.qEn.toLowerCase().includes(q) ||
      item.aEn.toLowerCase().includes(q) ||
      item.qAr.includes(q) ||
      item.aAr.includes(q)
    );
    return matchesCat && matchesQuery;
  });

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="bg-[#F6F8FC] min-h-screen py-10 lg:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Search Bar */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-8 sm:p-10 shadow-sm space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1F6FB2] text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأسئلة الشائعة والاستفسارات' : 'Frequently Asked Questions'}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B67] tracking-tight">
            {isAr
              ? 'إجابات وافية حول الحجز، الفروع، والبروتوكولات'
              : 'Clear Answers on Booking, Care, Fees & Clinic Protocols'}
          </h1>
          <p className="text-sm text-[#526574] leading-relaxed max-w-2xl">
            {isAr
              ? 'جمعنا هنا الإجابات الأكثر طلباً من مرضانا لمساعدتك على فهم إجراءات الحجز، خيارات الدفع، ومعايير السلامة.'
              : 'Detailed answers to common patient questions regarding appointment scheduling, treatment plans, payment methods, and infection control.'}
          </p>

          <div className="relative max-w-xl pt-2">
            <Search className="w-4 h-4 text-[#526574] absolute start-4 top-1/2 -translate-y-1/2 mt-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في الأسئلة أو الكلمات المفتاحية...' : 'Search questions, procedures, or policies...'}
              className="w-full ps-11 pe-4 py-3 rounded-2xl bg-[#F6F8FC] border border-[#D8E0DC] text-xs text-[#123B67] font-medium focus:bg-white focus:border-[#1F6FB2] focus:ring-1 focus:ring-[#1F6FB2] outline-none transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#123B67] text-white shadow-2xs'
                  : 'bg-white border border-[#D8E0DC] text-[#526574] hover:border-[#1F6FB2] hover:text-[#123B67]'
              }`}
            >
              {isAr ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#D8E0DC] p-12 text-center text-xs text-[#526574]">
              No questions found matching your search. Please reach out to our reception team directly.
            </div>
          ) : (
            filtered.map((faq, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-[#F6F8FC]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#1F6FB2] shrink-0" />
                      <span className="text-sm font-bold text-[#123B67]">
                        {isAr ? faq.qAr : faq.qEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#1F6FB2] hidden sm:inline-block">
                        {faq.category}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#526574] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1F6FB2]' : ''}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#526574] leading-relaxed border-t border-[#D8E0DC]/60 bg-[#F6F8FC]/30">
                      <p className="ps-5">
                        {isAr ? faq.aAr : faq.aEn}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have a Question Bottom Card */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-xs text-[#526574] text-center sm:text-start">
            <strong className="text-[#123B67] block text-base font-bold">
              {isAr ? 'هل لديك استفسار إكلينيكي محدد؟' : 'Have a Specific Clinical Question?'}
            </strong>
            {isAr
              ? 'فريق الاستقبال متواجد للإجابة هاتفياً أو عبر حجز استشارة تشخيصية مع الطبيب.'
              : 'Our front desk receptionists are available to guide you or schedule a doctor consultation.'}
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/contact">
              <Button variant="outline" size="md">
                {isAr ? 'تواصل معنا' : 'Contact Reception'}
              </Button>
            </Link>
            <Link href="/book">
              <Button variant="primary" size="md" icon={<Calendar className="w-4 h-4" />}>
                {isAr ? 'احجز استشارة' : 'Book Consultation'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
