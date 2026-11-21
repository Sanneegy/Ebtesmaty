"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BarChart3,
  Printer,
  Download,
  RefreshCw,
  Pin,
  Plus,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  Lock,
} from "lucide-react";
import type { Phase2Role } from "../phase2/FinanceCenterPhaseTwo";

interface CustomPinnedIndicator {
  id: string;
  titleAr: string;
  titleEn: string;
  valueDisplay: string;
  conditionAr: string;
  conditionEn: string;
  isFinancial: boolean;
}

const INITIAL_PINNED_INDICATORS: CustomPinnedIndicator[] = [
  {
    id: "IND-1",
    titleAr: "إيراد زراعة الأسنان (هذا الشهر)",
    titleEn: "Implant Revenue (This Month)",
    valueDisplay: "EGP 18,000",
    conditionAr: "البيانات: الفواتير · الشرط: زراعة أسنان",
    conditionEn: "Data: Invoices · Condition: Implants",
    isFinancial: true,
  },
  {
    id: "IND-2",
    titleAr: "حجوزات واتساب المؤكدة (هذا الأسبوع)",
    titleEn: "Confirmed WhatsApp Bookings (This Week)",
    valueDisplay: "38 visits",
    conditionAr: "البيانات: المواعيد · الشرط: مصدر واتساب",
    conditionEn: "Data: Appointments · Condition: WhatsApp Source",
    isFinancial: false,
  },
];

export default function StatisticsAndReportsPhaseThree({
  role = "clinic_owner",
}: {
  role?: Phase2Role;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [pinnedIndicators, setPinnedIndicators] = useState<CustomPinnedIndicator[]>(
    INITIAL_PINNED_INDICATORS
  );
  const [builderData, setBuilderData] = useState<"appointments" | "revenue" | "patients">(
    role === "doctor" ? "appointments" : "revenue"
  );
  const [builderPeriod, setBuilderPeriod] = useState<"today" | "week" | "month">("month");
  const [builderCondition, setBuilderCondition] = useState("completed");

  // Patient has no access to clinic statistics
  if (role === "patient") {
    return null;
  }

  const canSeeFinancialIndicators = role === "clinic_owner";

  const visiblePinnedIndicators = pinnedIndicators.filter((ind) =>
    ind.isFinancial ? canSeeFinancialIndicators : true
  );

  const handlePinCustomIndicator = () => {
    const isFin = builderData === "revenue";
    if (isFin && !canSeeFinancialIndicators) return;

    const newInd: CustomPinnedIndicator = {
      id: `IND-${Date.now()}`,
      titleAr:
        builderData === "revenue"
          ? `مؤشر الإيراد المخصص (${builderPeriod === "today" ? "اليوم" : "هذا الشهر"})`
          : builderData === "appointments"
          ? `مؤشر المواعيد المكتملة (${builderPeriod === "today" ? "اليوم" : "هذا الشهر"})`
          : "مؤشر المرضى الجدد المخصص",
      titleEn:
        builderData === "revenue"
          ? `Custom Revenue Indicator (${builderPeriod})`
          : builderData === "appointments"
          ? `Custom Completed Visits (${builderPeriod})`
          : `Custom New Patients (${builderPeriod})`,
      valueDisplay:
        builderData === "revenue"
          ? "EGP 24,800"
          : builderData === "appointments"
          ? "29 visits"
          : "14 patients",
      conditionAr: `البيانات: ${builderData} · الشرط: ${builderCondition}`,
      conditionEn: `Data: ${builderData} · Condition: ${builderCondition}`,
      isFinancial: isFin,
    };

    setPinnedIndicators((prev) => [newInd, ...prev]);
  };

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      aria-label={isAr ? "الإحصائيات والتقارير الجاهزة" : "Statistics and Ready-Made Reports"}
      className="space-y-6"
    >
      {/* MAIN STATISTICS BOARD — Exact match to Image 11 */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isAr ? "الإحصائيات" : "Statistics & Analytics"}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? "هذا الشهر · 1 أكت 26 – 11 أكت 26" : "This Month · 1 Oct 26 – 11 Oct 26"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {isAr ? "هذا الشهر" : "This Month"} ▾
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {isAr ? "كل الأطباء" : "All Dentists"} ▾
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {isAr ? "كل الخدمات" : "All Services"} ▾
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              {isAr ? "كل المصادر" : "All Sources"} ▾
            </span>
            <button
              type="button"
              onClick={() => typeof window !== "undefined" && window.print()}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Needs Your Attention Alert Strip — Exact match to Image 11 */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 font-black text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {isAr ? "يحتاج انتباهك" : "Needs attention"}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
            {isAr ? "مواعيد اليوم 11" : "Today's visits 11"}
          </span>

          {canSeeFinancialIndicators && (
            <>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800 tabular-nums">
                {isAr ? "مستحقات عند المرضى 79,484 ج.م" : "Patient arrears EGP 79,484"}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 tabular-nums">
                {isAr ? "متأخر +90 يوم 20,260 ج.م" : "90+ days overdue EGP 20,260"}
              </span>
            </>
          )}

          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
            {isAr ? "أصناف تحتاج طلباً 2" : "Items to order 2"}
          </span>

          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
            {isAr ? "طلبات معمل متأخرة 4" : "Late lab orders 4"}
          </span>

          <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-purple-700">
            {isAr ? "عملاء قيد المتابعة 3" : "Leads following up 3"}
          </span>
        </div>

        {/* 11-Card KPI Grid — Exact match to Image 11 (Respecting financial permissions) */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {canSeeFinancialIndicators && (
            <>
              {/* Hero 2-col Card: إجمالي الإيراد المفوتر 63,167 ج.م */}
              <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{isAr ? "إجمالي الإيراد المفوتر" : "Total Invoiced Revenue"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
                    {isAr ? "ثابت" : "Steady"}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-2xl font-black text-slate-900">63,167</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? "ج.م" : "EGP"}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isAr ? "63 فاتورة · متوسط 1,003 ج.م" : "63 invoices · avg EGP 1,003"}
                </p>
                <svg viewBox="0 0 320 48" className="mt-3 h-11 w-full">
                  <path
                    d="M 5 38 L 45 44 L 90 32 L 135 28 L 175 39 L 210 14 L 250 32 L 285 26 L 315 41 L 315 48 L 5 48 Z"
                    fill="rgba(37, 99, 235, 0.12)"
                  />
                  <path
                    d="M 5 38 L 45 44 L 90 32 L 135 28 L 175 39 L 210 14 L 250 32 L 285 26 L 315 41"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Card: المحصّل فعلياً 72,763 ج.م */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{isAr ? "المحصّل فعلياً" : "Actually Collected"}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 tabular-nums">
                    ▲ +26%
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-2xl font-black text-slate-900">72,763</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? "ج.م" : "EGP"}</span>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">
                    {isAr ? "تحصيل فواتير الفترة 85%" : "85% period invoice collection"}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>

              {/* Card: صافي الربح 20,405 ج.م */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{isAr ? "صافي الربح" : "Net Profit"}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 tabular-nums">
                    ▲ +122%
                  </span>
                </div>
                <div className="my-2 flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-2xl font-black text-slate-900">20,405</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? "ج.م" : "EGP"}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isAr ? "هامش 28% · بعد كل التكاليف" : "28% margin · after all costs"}
                </div>
              </div>
            </>
          )}

          {/* Card: معدل الإنجاز 92% */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{isAr ? "معدّل الإنجاز" : "Completion Rate"}</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
                ▼ -1 pt
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">92%</div>
            <div className="mt-2 text-[11px] text-slate-400">
              {isAr ? "70 من 76 موعد منته" : "70 of 76 finished visits"}
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: "92%" }} />
            </div>
          </div>

          {/* Card: الإلغاء والتغيّب 8% */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{isAr ? "الإلغاء والتغيّب" : "Cancellations & No-Shows"}</span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
                ▲ +1 pt
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">8%</div>
            <div className="mt-2 text-[11px] text-slate-400">
              {isAr ? "6 ملغاة · 0 لم يحضر" : "6 cancelled · 0 no-show"}
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-rose-500" style={{ width: "8%" }} />
            </div>
          </div>

          {/* Card: مرضى جدد 8 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{isAr ? "مرضى جدد" : "New Patients"}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                ▲ +167%
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">8</div>
            <div className="mt-2 text-[11px] text-slate-400">
              {isAr ? "خلال هذا الشهر" : "During this month"}
            </div>
          </div>

          {/* Card: معدل عودة المرضى 46% */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{isAr ? "معدّل عودة المرضى" : "Patient Retention Rate"}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">46%</div>
            <div className="mt-2 text-[11px] text-slate-400">
              {isAr ? "21 عائد من 46 نشط" : "21 returning of 46 active"}
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-purple-600" style={{ width: "46%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SPLIT ROW: Image 12 ("Ready-made reports") & Custom Pinned Indicator Builder ("Indicators you build yourself") */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* IMAGE 12 EXACT CARD: Ready-made reports */}
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">
              {isAr ? "التقارير الجاهزة" : "Ready-made reports"}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {isAr
                ? "أعمار المرضى، المصادر، وأداء الأطباء"
                : "Patients, sources & dentist performance"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* Left Box: Patient ages bar chart (sm:col-span-5) */}
            <div className="sm:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col justify-between">
              <div className="text-xs font-bold text-slate-500">
                {isAr ? "أعمار المرضى" : "Patient ages"}
              </div>
              <div className="mt-4 grid grid-cols-5 items-end gap-2 h-28 pt-2">
                {[
                  { label: "<18", h: 30, color: "bg-blue-500" },
                  { label: "25", h: 65, color: "bg-blue-500" },
                  { label: "35", h: 95, color: "bg-purple-600" },
                  { label: "45", h: 72, color: "bg-blue-500" },
                  { label: "55+", h: 38, color: "bg-blue-500" },
                ].map((bar) => (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center justify-end h-full gap-1.5"
                  >
                    <div
                      style={{ height: `${bar.h}%` }}
                      className={`w-full rounded-t-lg ${bar.color}`}
                    />
                    <span className="text-[11px] font-semibold text-slate-400">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Box: Where do they come from? (sm:col-span-7) */}
            <div className="sm:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-500">
                {isAr ? "من أين يأتي المرضى؟" : "Where do they come from?"}
              </div>

              {[
                { name: "WhatsApp", count: 38, pct: 85, color: "bg-blue-600" },
                { name: "Website", count: 27, pct: 62, color: "bg-blue-600" },
                { name: "Referral", count: 19, pct: 44, color: "bg-emerald-600" },
                { name: "Facebook", count: 12, pct: 28, color: "bg-purple-600" },
              ].map((src) => (
                <div
                  key={src.name}
                  className="rounded-xl border border-slate-200/70 bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span>{src.name}</span>
                    <span className="tabular-nums">{src.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${src.color}`}
                      style={{ width: `${src.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Dentist performance — Exact match to Image 12 */}
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500">
              {isAr ? "أداء الأطباء" : "Dentist performance"}
            </div>
            <div className="mt-2.5 space-y-2.5">
              {/* Row 1: Dr. Ahmed Samy -> EGP 61,200 */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    A
                  </span>
                  <div>
                    <div className="text-sm font-black text-slate-900">Dr. Ahmed Samy</div>
                    <div className="text-xs text-slate-500">96 cases · 6% no-shows</div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {canSeeFinancialIndicators ? "EGP 61,200" : "96 cases"}
                </span>
              </div>

              {/* Row 2: Dr. Sara Ali -> EGP 44,900 */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white">
                    S
                  </span>
                  <div>
                    <div className="text-sm font-black text-slate-900">Dr. Sara Ali</div>
                    <div className="text-xs text-slate-500">71 cases · 9% no-shows</div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {canSeeFinancialIndicators ? "EGP 44,900" : "71 cases"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOM INDICATOR BUILDER CARD: "Indicators you build yourself" */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr
                    ? "مؤشرات تبنيها بنفسك وتثبّتها على شاشتك"
                    : "Indicators You Build Yourself & Pin to Screen"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? "اختر البيانات، الفترة، والشرط — يحترم صلاحياتك ولا يعرض مؤشراً مالياً لغير المصرح لهم"
                    : "Choose the data, period and condition — respects permissions automatically"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Pin className="h-3.5 w-3.5" />
                {visiblePinnedIndicators.length}
              </span>
            </div>

            {/* Builder Form */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-600">
                  {isAr ? "1. اختر البيانات" : "1. Choose Data"}
                </label>
                <select
                  value={builderData}
                  onChange={(e) =>
                    setBuilderData(
                      e.target.value as "appointments" | "revenue" | "patients"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800"
                >
                  {canSeeFinancialIndicators && (
                    <option value="revenue">
                      {isAr ? "الإيرادات والفواتير" : "Revenue & Invoices"}
                    </option>
                  )}
                  <option value="appointments">
                    {isAr ? "المواعيد والزيارات" : "Appointments & Visits"}
                  </option>
                  <option value="patients">
                    {isAr ? "المرضى الجدد" : "New Patients"}
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-600">
                  {isAr ? "2. اختر الفترة" : "2. Choose Period"}
                </label>
                <select
                  value={builderPeriod}
                  onChange={(e) =>
                    setBuilderPeriod(e.target.value as "today" | "week" | "month")
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800"
                >
                  <option value="today">{isAr ? "اليوم" : "Today"}</option>
                  <option value="week">{isAr ? "هذا الأسبوع" : "This Week"}</option>
                  <option value="month">{isAr ? "هذا الشهر" : "This Month"}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-600">
                  {isAr ? "3. اختر الشرط" : "3. Condition"}
                </label>
                <select
                  value={builderCondition}
                  onChange={(e) => setBuilderCondition(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800"
                >
                  <option value="completed">
                    {isAr ? "مكتمل / محصّل" : "Completed / Collected"}
                  </option>
                  <option value="whatsapp">
                    {isAr ? "المصدر: واتساب" : "Source: WhatsApp"}
                  </option>
                  <option value="implants">
                    {isAr ? "الخدمة: زراعة أسنان" : "Service: Implants"}
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePinCustomIndicator}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              <Pin className="h-3.5 w-3.5" />
              {isAr ? "تثبيت المؤشر على شاشتي" : "Pin Indicator to My Screen"}
            </button>

            {/* Pinned Indicators List */}
            <div className="mt-5 space-y-2.5">
              {visiblePinnedIndicators.map((ind) => (
                <div
                  key={ind.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {isAr ? ind.titleAr : ind.titleEn}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isAr ? ind.conditionAr : ind.conditionEn}
                    </div>
                  </div>
                  <span className="text-sm font-black text-blue-600 tabular-nums">
                    {ind.valueDisplay}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {isAr
                ? "يحترم صلاحياتك: لا يظهر أي مؤشر مالي لمن لا يملك صلاحية الشاشة المالية"
                : "Respects your permissions: A financial indicator does not show for anyone without its screen"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
