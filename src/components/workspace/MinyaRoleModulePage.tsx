"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  MINYA_BRANCHES,
  MinyaBranchCode,
  getMinyaBranchMetrics,
  resolveAuthenticatedIdentity,
} from "@/config/minya-clinic-store";
import {
  SmartClinicCalendar,
  DOCTOR_SCHEDULE_REQUESTS_KEY,
  DOCTOR_SCHEDULE_REQUESTS_EVENT,
  DoctorScheduleChangeRequest,
} from "@/components/phase1/SmartClinicCalendar";
import PatientPersonalAppointmentsView from "@/components/phase1/PatientPersonalAppointmentsView";
import OwnerAppointmentAnalyticsView from "@/components/phase1/OwnerAppointmentAnalyticsView";
import { UnifiedPatientFileView } from "@/components/phase1/InstantPatientSearchAndRecord";
import { AnatomicalExamChart } from "@/components/phase1/AnatomicalExamChart";
import { CbctAnd3DViewer } from "@/components/phase1/CbctAnd3DViewer";
import FinanceCenterPhaseTwo from "@/components/phase2/FinanceCenterPhaseTwo";
import OwnerExpensesPage from "@/components/phase2/OwnerExpensesPage";
import ProfitabilityPhaseTwo from "@/components/phase2/ProfitabilityPhaseTwo";
import InventorySuppliesPhaseTwo from "@/components/phase2/InventorySuppliesPhaseTwo";
import LabManagementPhaseTwo from "@/components/phase2/LabManagementPhaseTwo";
import LeadFollowupCrmPhaseThree from "@/components/phase3/LeadFollowupCrmPhaseThree";
import InboxWhatsAppPhaseThree, {
  CLINIC_WHATSAPP_NUMBER,
} from "@/components/phase3/InboxWhatsAppPhaseThree";
import WebsiteReviewsPhaseThree from "@/components/phase3/WebsiteReviewsPhaseThree";
import AttendancePayrollPhaseThree from "@/components/phase3/AttendancePayrollPhaseThree";
import StatisticsAndReportsPhaseThree from "@/components/phase3/StatisticsAndReportsPhaseThree";
import {
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Stethoscope,
  Scan,
  FlaskConical,
  Boxes,
  MessageCircle,
  Clock,
  Star,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  X,
  BellRing,
} from "lucide-react";

const ACTIVE_TREATMENT_PLANS_DIRECTORY = [
  {
    id: "EBT-PAT-0001",
    patientNameEn: "Passant (#EBT-PAT-0001)",
    patientNameAr: "بسنت (#EBT-PAT-0001)",
    planSummaryEn: "Root Canal #36 + Post & Core + Zirconia Crown",
    planSummaryAr: "حشو عصب #36 + دعامة + تاج زيركون",
    completedSteps: 2,
    totalSteps: 3,
    progressPct: 67,
    totalCostEgp: 5300,
  },
  {
    id: "P-1042",
    patientNameEn: "Mohamed Ahmed Ali (#P-1042)",
    patientNameAr: "محمد أحمد علي (#P-1042)",
    planSummaryEn: "Dental Implant #46 + Zirconia Crown",
    planSummaryAr: "زراعة سن #46 + تاج زيركون",
    completedSteps: 2,
    totalSteps: 3,
    progressPct: 67,
    totalCostEgp: 18000,
  },
  {
    id: "P-1057",
    patientNameEn: "Ibrahim Yassin Shaheen (#P-1057)",
    patientNameAr: "إبراهيم ياسين شاهين (#P-1057)",
    planSummaryEn: "2 Composite Fillings (#16, #26) + Scaling",
    planSummaryAr: "حشو تجميلي (#16، #26) + تنظيف جير",
    completedSteps: 3,
    totalSteps: 3,
    progressPct: 100,
    totalCostEgp: 1400,
  },
  {
    id: "P-0877",
    patientNameEn: "Moustafa Samy (#P-0877)",
    patientNameAr: "مصطفى سامي (#P-0877)",
    planSummaryEn: "4 Anterior Porcelain Veneers (#12–#22)",
    planSummaryAr: "4 عدسات فينير أمامية (#12–#22)",
    completedSteps: 1,
    totalSteps: 2,
    progressPct: 50,
    totalCostEgp: 10000,
  },
  {
    id: "P-0310",
    patientNameEn: "Ahmed Mohamed (#P-0310)",
    patientNameAr: "أحمد محمد (#P-0310)",
    planSummaryEn: "Root Canal Therapy #14 + Composite Build-up",
    planSummaryAr: "علاج جذور #14 + حشو تجميلي",
    completedSteps: 1,
    totalSteps: 2,
    progressPct: 50,
    totalCostEgp: 2300,
  },
  {
    id: "P-1051",
    patientNameEn: "Mai Saeed (#P-1051)",
    patientNameAr: "مي سعيد (#P-1051)",
    planSummaryEn: "Ultrasonic Scaling + Composite Filling #36",
    planSummaryAr: "تنظيف جير بالموجات + حشو تجميلي #36",
    completedSteps: 1,
    totalSteps: 2,
    progressPct: 50,
    totalCostEgp: 900,
  },
  {
    id: "P-1064",
    patientNameEn: "Rana Marwan Abdelaziz (#P-1064)",
    patientNameAr: "رنا مروان عبد العزيز (#P-1064)",
    planSummaryEn: "Zirconia Crown Fitting #34 (#L-311 Ready)",
    planSummaryAr: "تركيب تاج زيركون #34 (جاهز من المعمل #L-311)",
    completedSteps: 2,
    totalSteps: 2,
    progressPct: 95,
    totalCostEgp: 3000,
  },
];

export type AppRoleKey = "clinic_owner" | "doctor" | "receptionist" | "patient";

const ALLOWED_MODULES_BY_ROLE: Record<AppRoleKey, string[]> = {
  clinic_owner: [
    "dashboard",
    "appointments",
    "patients",
    "clinical-audit",
    "finance",
    "expenses",
    "profitability",
    "inventory",
    "lab",
    "crm",
    "inbox",
    "attendance",
    "reviews",
    "reports",
  ],
  doctor: [
    "dashboard",
    "appointments",
    "patients",
    "exam-room",
    "imaging",
    "lab",
    "inventory",
    "inbox",
    "attendance",
    "reports",
  ],
  receptionist: [
    "dashboard",
    "appointments",
    "patients",
    "finance",
    "lab",
    "inventory",
    "crm",
    "inbox",
    "attendance",
    "reviews",
  ],
  patient: [
    "dashboard",
    "appointments",
    "treatment-plan",
    "imaging",
    "billing",
    "inbox",
    "reviews",
  ],
};

export default function MinyaRoleModulePage({
  role,
  moduleSlug,
  currentUser,
}: {
  role: AppRoleKey;
  moduleSlug: string;
  currentUser?: any;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const searchParams = useSearchParams();
  const urlBranch = (searchParams?.get("branchCode") || "") as MinyaBranchCode;

  const identity = resolveAuthenticatedIdentity(currentUser, role);

  // Clinic Owner can filter across All Minya Branches or Branch A/B/C;
  // Doctor & Receptionist default to their assigned Minya branch;
  // Patient can choose between Minya Branch A, B, or C when booking.
  const [selectedBranch, setSelectedBranch] = useState<MinyaBranchCode>(
    role === "clinic_owner"
      ? urlBranch || "ALL"
      : (identity.branchCode as MinyaBranchCode) || "BR-A"
  );

  const activeBranchCode: MinyaBranchCode =
    role === "clinic_owner" && urlBranch ? urlBranch : selectedBranch;

  const [showActivePlansModal, setShowActivePlansModal] = useState(false);
  const [doctorScheduleRequests, setDoctorScheduleRequests] = useState<
    DoctorScheduleChangeRequest[]
  >([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadReqs = () => {
      try {
        const raw = window.localStorage.getItem(DOCTOR_SCHEDULE_REQUESTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDoctorScheduleRequests(parsed);
        }
      } catch {}
    };
    loadReqs();
    window.addEventListener("storage", loadReqs);
    window.addEventListener(DOCTOR_SCHEDULE_REQUESTS_EVENT, loadReqs);
    return () => {
      window.removeEventListener("storage", loadReqs);
      window.removeEventListener(DOCTOR_SCHEDULE_REQUESTS_EVENT, loadReqs);
    };
  }, []);

  const metrics = getMinyaBranchMetrics(activeBranchCode);
  const currentBranchObj =
    MINYA_BRANCHES.find((b) => b.code === activeBranchCode) || MINYA_BRANCHES[0];

  const allowedModules = ALLOWED_MODULES_BY_ROLE[role];
  const isAuthorized = allowedModules.includes(moduleSlug);

  const rolePrefix =
    role === "clinic_owner"
      ? "/owner"
      : role === "doctor"
      ? "/doctor"
      : role === "receptionist"
      ? "/reception"
      : "/patient";

  // Hard RBAC Route Guard
  if (!isAuthorized) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="max-w-[1440px] mx-auto px-6 py-12"
      >
        <div className="rounded-3xl border border-rose-200 bg-white/95 p-8 shadow-md text-center space-y-4 max-w-xl mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {isAr
              ? "غير مصرح بالوصول إلى هذه الصفحة"
              : "Restricted Module — RBAC Permission Boundary"}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {isAr
              ? "هذه الميزة غير متاحة لدورك الوظيفي الحالي وفقاً لمصفوفة صلاحيات عيادات ابتسامتي (المنيا)."
              : `The module "/${moduleSlug}" is restricted for the "${role}" role under Ebtesamty Minya RBAC policy.`}
          </p>
          <Link
            href={`${rolePrefix}/dashboard`}
            className="inline-flex items-center gap-2 rounded-full bg-[#0B2528] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#13393E]"
          >
            <span>
              {isAr ? "العودة إلى لوحة القيادة الخاصة بك" : "Return to Your Dashboard"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="max-w-[1440px] mx-auto px-6 py-8 space-y-8 leading-relaxed"
    >
      {/* ====================================================================
          TOP MINYA MULTI-BRANCH & AUTHENTICATED USER IDENTITY BAR
         ==================================================================== */}
      <header className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B2528] text-base font-black text-[#C8A96E] ring-2 ring-[#C8A96E]/40">
              {identity.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#E6F0EE] px-3 py-0.5 text-sm font-bold text-[#0B2528]">
                  {activeBranchCode === "ALL"
                    ? isAr
                      ? "المنيا — كل الفروع (أ، ب، ج)"
                      : "Minya — All Branches (A, B & C)"
                    : isAr
                    ? currentBranchObj.nameAr
                    : currentBranchObj.nameEn}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  · WhatsApp {CLINIC_WHATSAPP_NUMBER}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-slate-900">
                {role === "patient"
                  ? isAr
                    ? `مرحباً بعودتك، ${identity.firstName === "Passant" ? "بسنت" : identity.fullName}`
                    : `Welcome back, ${identity.fullName}`
                  : isAr
                  ? `${identity.fullName} — عيادات ابتسامتي (المنيا)`
                  : `${identity.fullName} — Ebtesamty Dental Clinics (Minya)`}
              </h1>
              {role !== "patient" && (
                <p className="text-sm text-slate-500">
                  {isAr ? "أطباء الفرع:" : "Assigned Branch Doctors:"}{" "}
                  <span className="font-bold text-slate-700">
                    {(activeBranchCode === "ALL"
                      ? MINYA_BRANCHES.flatMap((b) => b.doctors)
                      : currentBranchObj.doctors
                    )
                      .map((d) => (isAr ? d.nameAr : d.nameEn))
                      .join(" · ")}
                  </span>{" "}
                  | {isAr ? "الاستقبال:" : "Reception:"}{" "}
                  <span className="font-bold text-slate-700">
                    {activeBranchCode === "ALL"
                      ? MINYA_BRANCHES.map((b) =>
                          isAr ? b.receptionist.nameAr : b.receptionist.nameEn
                        ).join(" · ")
                      : isAr
                      ? currentBranchObj.receptionist.nameAr
                      : currentBranchObj.receptionist.nameEn}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Minya Branch Selector (Shown only for Clinic Owner — Doctor & Receptionist are scoped to their assigned Minya branch) */}
          {role === "clinic_owner" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeBranchCode === "ALL"
                    ? "bg-[#0B2528] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isAr ? "كل فروع المنيا" : "All Minya Branches"}
              </button>
              {MINYA_BRANCHES.map((b) => {
                const isSelected = activeBranchCode === b.code;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => setSelectedBranch(b.code)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      isSelected
                        ? "bg-[#0B2528] text-[#C8A96E] shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isAr ? b.nameAr : b.nameEn}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ====================================================================
          ISOLATED SINGLE-MODULE PAGE CONTENT (ZERO VERTICAL MODULE STACKING)
         ==================================================================== */}

      {/* 1. DASHBOARD OVERVIEW PAGES (ONLY HIGH-LEVEL SUMMARY KPIS & SHORTCUTS) */}
      {moduleSlug === "dashboard" && role === "clinic_owner" && (
        <div className="space-y-8">
          {/* 5 High-Level Executive KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "إيرادات اليوم (ج.م)" : "Today's Revenue (EGP)"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                EGP {metrics.todayRevenueEgp.toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                ▲ +18% {isAr ? "مقارنة بأمس" : "vs yesterday"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "صافي الربح الشهري" : "Monthly Net Profit"}
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
                EGP {metrics.monthlyNetProfitEgp.toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {isAr
                  ? `من تحصيل ${metrics.monthlyCollectedEgp.toLocaleString()} ج.م`
                  : `From EGP ${metrics.monthlyCollectedEgp.toLocaleString()} collected`}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "إجمالي المرضى النشطين" : "Total Active Patients"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {metrics.activePatientsCount}
              </div>
              <div className="mt-1 text-sm font-semibold text-blue-600">
                {isAr ? "عبر فروع المنيا" : "Across Minya branches"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "مواعيد اليوم" : "Today's Appointments"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {metrics.todayAppointmentsCount}
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                {isAr
                  ? `نسبة الإنجاز ${metrics.completionRatePercent}%`
                  : `${metrics.completionRatePercent}% completion rate`}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "نسبة عدم الحضور" : "No-Show Rate"}
              </div>
              <div className="mt-2 text-2xl font-black text-rose-600 tabular-nums">
                {metrics.noShowRatePercent}%
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {isAr ? "تذكير واتساب مفعّل" : "WhatsApp reminders active"}
              </div>
            </div>
          </div>

          {/* Minya Branch-by-Branch Revenue Comparison & Quick Alerts */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">
                  {isAr
                    ? "مقارنة أداء وإيرادات فروع المنيا (أ، ب، ج)"
                    : "Minya Branch-by-Branch Revenue & Staff Overview"}
                </h2>
                <Link
                  href="/owner/profitability"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  {isAr ? "تفاصيل الربحية ←" : "Full Profitability →"}
                </Link>
              </div>

              <div className="space-y-4">
                {MINYA_BRANCHES.map((br) => {
                  const pct = Math.round((br.metrics.monthlyCollectedEgp / 72763) * 100);
                  return (
                    <div
                      key={br.code}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-black text-slate-900">
                            {isAr ? br.nameAr : br.nameEn}
                          </div>
                          <div className="text-sm text-slate-500">
                            {br.doctors
                              .map((d) => (isAr ? d.nameAr : d.nameEn))
                              .join(" · ")}{" "}
                            | {isAr ? "الاستقبال:" : "Reception:"}{" "}
                            {isAr ? br.receptionist.nameAr : br.receptionist.nameEn}
                          </div>
                        </div>
                        <div className="text-end tabular-nums">
                          <div className="text-base font-black text-slate-900">
                            EGP {br.metrics.monthlyCollectedEgp.toLocaleString()}
                          </div>
                          <div className="text-sm font-bold text-emerald-700">
                            {isAr ? "صافي الربح:" : "Net Profit:"} EGP{" "}
                            {br.metrics.monthlyNetProfitEgp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#0B2528]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Alerts & Module Shortcuts */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-black text-slate-900">
                    {isAr ? "تنبيهات سريعة واختصارات" : "Quick Alerts & Module Shortcuts"}
                  </h2>
                </div>

                <div className="space-y-3 text-base">
                  <Link
                    href="/owner/finance"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:bg-white"
                  >
                    <span className="font-bold text-slate-800">
                      {isAr ? "مستحقات عند المرضى" : "Outstanding Patient Arrears"}
                    </span>
                    <span className="font-black text-rose-600 tabular-nums">
                      EGP {metrics.outstandingArrearsEgp.toLocaleString()} →
                    </span>
                  </Link>

                  <Link
                    href="/owner/lab"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:bg-white"
                  >
                    <span className="font-bold text-slate-800">
                      {isAr ? "طلبات معمل متأخرة" : "Overdue Lab Orders"}
                    </span>
                    <span className="font-black text-amber-700">
                      {isAr ? "1 متأخر (14 طلب) ←" : "1 late (14 orders) →"}
                    </span>
                  </Link>

                  <Link
                    href="/owner/inventory"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:bg-white"
                  >
                    <span className="font-bold text-slate-800">
                      {isAr ? "تنبيهات المخزون والصلاحية" : "Inventory & Expiry Alerts"}
                    </span>
                    <span className="font-black text-amber-700">
                      {isAr ? "3 تنبيهات ←" : "3 alerts →"}
                    </span>
                  </Link>

                  <Link
                    href="/owner/crm"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 hover:bg-white"
                  >
                    <span className="font-bold text-slate-800">
                      {isAr ? "عملاء متوقعون للمتابعة اليوم" : "CRM Leads Due Today"}
                    </span>
                    <span className="font-black text-blue-600">
                      {isAr ? "8 عملاء ←" : "8 leads →"}
                    </span>
                  </Link>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                {isAr
                  ? "استخدم القائمة الجانبية اليسرى للانتقال إلى أي قسم منفصل دون تكديس الجداول."
                  : "Use the left icon sidebar to open each dedicated module page independently."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR DASHBOARD OVERVIEW ONLY (WITH 4 CLICKABLE INTERACTIVE KPI SUMMARY CARDS) */}
      {moduleSlug === "dashboard" && role === "doctor" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Today's Scheduled Patients (5) -> Click opens /doctor/appointments */}
            <Link
              href="/doctor/appointments?filter=today"
              className="group rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500 block"
            >
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>{isAr ? "مرضى اليوم بفرع المنيا" : "Today's Scheduled Patients"}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {currentBranchObj.metrics.todayAppointmentsCount}
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                {isAr
                  ? `${currentBranchObj.nameAr} · اضغط لعرض الجدول`
                  : `${currentBranchObj.nameEn} · View schedule →`}
              </div>
            </Link>

            {/* Card 2: Next Patient in Queue (Passant #EBT-PAT-0001) -> Click opens Passant's clinical profile */}
            <Link
              href="/doctor/patients?patientId=EBT-PAT-0001"
              className="group rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500 block"
            >
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>{isAr ? "المريض التالي" : "Next Patient in Queue"}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <div className="mt-2 text-lg font-black text-slate-900 group-hover:text-blue-700">
                Passant (#EBT-PAT-0001)
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-700">
                Tooth #36 · Post & Core →
              </div>
            </Link>

            {/* Card 3: Pending Lab Cases Ready (2 — #L-311 & #L-312) -> Click opens /doctor/lab?status=ready */}
            <Link
              href="/doctor/lab?status=ready"
              className="group rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500 block"
            >
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>{isAr ? "تركيبات المعمل الجاهزة" : "Pending Lab Cases Ready"}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-blue-600 tabular-nums">
                2
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                #L-311 & #L-312 Ready to fit →
              </div>
            </Link>

            {/* Card 4: Active Treatment Plans (7) -> Click opens modal listing all 7 patients with active treatment plans */}
            <button
              type="button"
              onClick={() => setShowActivePlansModal(true)}
              className="group rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500 text-start w-full"
            >
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>{isAr ? "خطط العلاج النشطة" : "Active Treatment Plans"}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                7
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                {isAr ? "94% نسبة الإنجاز · عرض الـ 7 خطط ←" : "94% completion rate · View 7 plans →"}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link
              href="/doctor/exam-room"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <Stethoscope className="h-7 w-7 text-blue-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "غرفة الكشف ومخطط الأسنان" : "Open Exam Room & Dental Chart"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "مخطط 32 سن تفاعلي، التشخيص، وبناء خطة العلاج"
                  : "Interactive 32-tooth Odontogram, diagnosis tagging & SOAP notes"}
              </p>
            </Link>

            <Link
              href="/doctor/imaging"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <Scan className="h-7 w-7 text-teal-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "عارض الأشعة و CBCT" : "Open Dental X-ray & CBCT Viewer"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "فحص الأشعة المقطعية والبانوراما مع تحليل الذكاء الاصطناعي"
                  : "Dual-plane CBCT, panoramic X-rays & AI pathology highlights"}
              </p>
            </Link>

            <Link
              href="/doctor/lab"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <FlaskConical className="h-7 w-7 text-purple-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "طلبات المعمل والتركيبات" : "Manage Prosthetic Lab Orders"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "إرسال ومتابعة تيجان الزيركون والفينير لمرضاك"
                  : "Create and approve lab orders with tooth, shade & photo attachments"}
              </p>
            </Link>
          </div>

          {/* Modal: 7 Active Treatment Plans Directory */}
          {showActivePlansModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
              <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {isAr
                        ? "خطط العلاج النشطة (7 مرضى — د. ساندي سعد)"
                        : "Active Treatment Plans (7 Patients — Dr. Sandy Saad)"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? "اضغط على أي خطة لفتح مخطط أسنان المريض وإضافة أو استكمال الإجراءات في غرفة الكشف"
                        : "Click any patient's treatment plan to open their chart in the Exam Room"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowActivePlansModal(false)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                  {ACTIVE_TREATMENT_PLANS_DIRECTORY.map((tp) => (
                    <div
                      key={tp.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-slate-900">
                          {isAr ? tp.patientNameAr : tp.patientNameEn}
                        </div>
                        <div className="text-xs text-slate-600">
                          {isAr ? tp.planSummaryAr : tp.planSummaryEn}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${tp.progressPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                            {tp.completedSteps}/{tp.totalSteps} visits ({tp.progressPct}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-900 tabular-nums">
                          EGP {tp.totalCostEgp.toLocaleString()}
                        </span>
                        <Link
                          href={`/doctor/exam-room?patientId=${encodeURIComponent(
                            tp.id
                          )}&patientName=${encodeURIComponent(tp.patientNameEn)}`}
                          onClick={() => setShowActivePlansModal(false)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs"
                        >
                          {isAr ? "فتح في غرفة الكشف ←" : "Open in Exam Room →"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECEPTIONIST DASHBOARD OVERVIEW ONLY */}
      {moduleSlug === "dashboard" && role === "receptionist" && (
        <div className="space-y-8">
          {/* 1. Streamlined Live Chair/Room Status Card (Room 1, Room 2, Room 3) + 4-Stage Patient Flow Bar (No redundant bottom button row) */}
          <div className="rounded-[32px] border border-[#163D42] bg-[#0B2528] p-6 text-white shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#C8A96E] block">
                  {isAr ? currentBranchObj.nameAr : currentBranchObj.nameEn}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {isAr
                    ? "حالة الغرف والكراسي الحية وتدفق المرضى"
                    : "Live Operatory Room Status & 4-Stage Patient Flow"}
                </h2>
              </div>
              <span className="rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/40 px-3.5 py-1 text-xs font-black text-[#14B8A6]">
                ● {isAr ? "تحديث حي للغرف" : "Live Operatory Turnover"}
              </span>
            </div>

            {/* 3 Live Operatory Status Rings: Room 1 (ACTIVE), Room 2 (READY / Sanitized), Room 3 (STERILIZING) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  roomEn: "Room 1",
                  roomAr: "غرفة 1",
                  status: "ACTIVE",
                  badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
                  ringColor: "border-emerald-400",
                  doctor: isAr
                    ? currentBranchObj.doctors[0]?.nameAr
                    : currentBranchObj.doctors[0]?.nameEn,
                  detail: isAr ? "مريض على الكرسي (Passant · #36)" : "In Chair: Passant (#36 Post & Core)",
                },
                {
                  roomEn: "Room 2",
                  roomAr: "غرفة 2",
                  status: "READY / Sanitized",
                  badgeClass: "bg-teal-500/20 text-teal-300 border-teal-400/40",
                  ringColor: "border-teal-400",
                  doctor: isAr
                    ? (currentBranchObj.doctors[1] || currentBranchObj.doctors[0])?.nameAr
                    : (currentBranchObj.doctors[1] || currentBranchObj.doctors[0])?.nameEn,
                  detail: isAr ? "معقمة وجاهزة لاستدعاء المريض التالي" : "Sanitized & Ready for next patient",
                },
                {
                  roomEn: "Room 3",
                  roomAr: "غرفة 3",
                  status: "STERILIZING",
                  badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
                  ringColor: "border-amber-400",
                  doctor: isAr ? "فريق التعقيم" : "Turnaround Protocol",
                  detail: isAr ? "تطهير السطح والأوتوكلاف (متبقي 4 دقائق)" : "Surface disinfection (4 min left)",
                },
              ].map((rm) => (
                <div
                  key={rm.roomEn}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 ${rm.ringColor} bg-slate-950/60 text-xs font-black`}
                  >
                    {isAr ? rm.roomAr : rm.roomEn}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-black ${rm.badgeClass}`}
                    >
                      {rm.status}
                    </span>
                    <div className="mt-1 truncate text-sm font-black text-white">
                      {rm.doctor}
                    </div>
                    <div className="truncate text-xs text-slate-300">{rm.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4-Stage Patient Flow Bar (ARRIVING, LOUNGE, IN CHAIR, CHECKOUT) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  stageEn: "ARRIVING",
                  stageAr: "قادمون اليوم",
                  count: 4,
                  subEn: "Confirmed today",
                  subAr: "مواعيد مؤكدة",
                  dot: "bg-sky-400",
                },
                {
                  stageEn: "LOUNGE",
                  stageAr: "في الاستراحة",
                  count: 3,
                  subEn: "Checked in & waiting",
                  subAr: "في انتظار النداء",
                  dot: "bg-amber-400",
                },
                {
                  stageEn: "IN CHAIR",
                  stageAr: "داخل الكشف",
                  count: 2,
                  subEn: "Active treatment",
                  subAr: "جلسة علاج جارية",
                  dot: "bg-emerald-400",
                },
                {
                  stageEn: "CHECKOUT",
                  stageAr: "المغادرة والتحصيل",
                  count: 2,
                  subEn: "Ready for receipt/follow-up",
                  subAr: "جاهز للفاتورة والمغادرة",
                  dot: "bg-purple-400",
                },
              ].map((st) => (
                <div
                  key={st.stageEn}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-200">
                      <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                      {isAr ? st.stageAr : st.stageEn}
                    </span>
                    <span className="text-lg font-black text-[#C8A96E] tabular-nums">
                      {st.count}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {isAr ? st.subAr : st.subEn}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 4 Top Front-Desk Operational KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "تحصيل خزينة الاستقبال اليوم" : "Today's Front-Desk Collections"}
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
                EGP {currentBranchObj.metrics.todayRevenueEgp.toLocaleString()}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {isAr ? "نقدي + كارت + إنستاباي" : "Cash + Card + InstaPay"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "المواعيد والمؤكد منها" : "Appointments & Confirmed"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                22 <span className="text-base font-bold text-emerald-700">(18 Confirmed)</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-700">
                {isAr ? "4 غير مؤكدة — من قائمة الانتظار" : "4 unconfirmed — fill from waiting list"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "معدل إشغال الكراسي" : "Chair Occupancy Rate"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                87%
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {isAr ? "3 غرف نشطة بفرع المنيا" : "3 rooms active at Minya branch"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "مرضى جدد اليوم" : "New Patients Today"}
              </div>
              <div className="mt-2 text-2xl font-black text-purple-700 tabular-nums">
                13
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                {isAr ? "مسجلون بزيارة فعلية" : "Registered with booked visits"}
              </div>
            </div>
          </div>

          {/* 3. Actionable Front-Desk Alerts Card (Late appointments, Overdue patient balance, Lab order due) */}
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900">
                  {isAr ? "تنبيهات مكتب الاستقبال العاجلة" : "Actionable Front-Desk Alerts"}
                </h3>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-800">
                {isAr ? "3 تحتاج إجراء" : "3 need action"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Alert 1: Late appointments */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "3 مواعيد متأخرة" : "Late appointments (3)"}
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    11:00 · 11:30 · 12:00
                  </div>
                </div>
                <Link
                  href="/reception/appointments"
                  className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100"
                >
                  {isAr ? "متابعة" : "Call / Check"}
                </Link>
              </div>

              {/* Alert 2: Overdue patient balance */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "رصيد مريض متأخر السداد" : "Overdue patient balance"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Passant / Amr · EGP 2,700
                  </div>
                </div>
                <Link
                  href="/reception/finance"
                  className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100"
                >
                  {isAr ? "تحصيل" : "Collect"}
                </Link>
              </div>

              {/* Alert 3: Lab order due */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "طلب معمل مستحق اليوم" : "Lab order due"}
                  </div>
                  <div className="text-xs text-slate-500">
                    #L-311 Crown Ready · #L-302 Late
                  </div>
                </div>
                <Link
                  href="/reception/lab"
                  className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-black text-amber-800 hover:bg-amber-100"
                >
                  {isAr ? "تتبع المعمل" : "Track Lab"}
                </Link>
              </div>
            </div>

            {/* Live Doctor Schedule Change Requests (Pushed from /doctor/appointments) */}
            {doctorScheduleRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <BellRing className="h-4 w-4 text-amber-600" />
                    <span>
                      {isAr
                        ? `طلبات تعديل المواعيد الواردة من الأطباء (${
                            doctorScheduleRequests.filter((r) => r.status === "PENDING").length
                          })`
                        : `Doctor Schedule Requests (${
                            doctorScheduleRequests.filter((r) => r.status === "PENDING").length
                          })`}
                    </span>
                  </div>
                  <Link
                    href="/reception/appointments"
                    className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-black text-white hover:bg-amber-700"
                  >
                    {isAr ? "فتح التقويم للتنفيذ ←" : "Open Calendar to Execute →"}
                  </Link>
                </div>
                {doctorScheduleRequests
                  .filter((r) => r.status === "PENDING")
                  .map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs"
                    >
                      <span className="font-black text-slate-900">
                        {req.doctorNameEn}: {req.reason} · {req.patientNameEn} ({req.currentSlot})
                      </span>
                      <span className="text-slate-600">{req.note}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PATIENT DASHBOARD OVERVIEW ONLY */}
      {moduleSlug === "dashboard" && role === "patient" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "موعدك القادم" : "Next Upcoming Appointment"}
              </div>
              <div className="mt-2 text-lg font-black text-slate-900">
                {isAr ? "الأحد 5:30 م" : "Sunday · 5:30 PM"}
              </div>
              <div className="mt-1 text-sm font-semibold text-blue-600">
                {isAr
                  ? `${currentBranchObj.nameAr} · ${currentBranchObj.doctors[0].nameAr}`
                  : `${currentBranchObj.nameEn} · ${currentBranchObj.doctors[0].nameEn}`}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "تقدم خطة العلاج" : "Active Treatment Progress"}
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 tabular-nums">
                Step 2 of 3 (66%)
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: "66%" }} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "الرصيد المستحق والأقساط" : "Current Balance Due"}
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                EGP 2,700
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-700">
                {isAr ? "50% مدفوع من الخطة" : "50% of plan settled"}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md">
              <div className="text-sm font-bold text-slate-500">
                {isAr ? "حالة تركيبة المعمل" : "Lab Order Status"}
              </div>
              <div className="mt-2 text-lg font-black text-emerald-700">
                ● {isAr ? "تاج زيركون جاهز للتركيب" : "Crown Ready to Fit ✓"}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                Tooth #34 · Shade A2
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link
              href="/patient/appointments"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <Calendar className="h-7 w-7 text-blue-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "حجز وإدارة المواعيد (المنيا)" : "Book & Manage Appointments"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "اختر بين فرع المنيا أ أو ب أو ج وأطباء كل فرع"
                  : "Choose between Minya – Branch A, Branch B, or Branch C"}
              </p>
            </Link>

            <Link
              href="/patient/treatment-plan"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <Stethoscope className="h-7 w-7 text-emerald-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "خطة علاجي ومخطط الأسنان" : "My Treatment Plan & Dental Chart"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "عرض مبسط لمخطط أسنانك والإجراءات المكتملة والقادمة"
                  : "Simplified visual view of your teeth chart & prescriptions"}
              </p>
            </Link>

            <Link
              href="/patient/billing"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500"
            >
              <CreditCard className="h-7 w-7 text-amber-600" />
              <h2 className="mt-3 text-lg font-black text-slate-900">
                {isAr ? "فواتيري وجدول الأقساط" : "My Invoices & Installments"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAr
                  ? "عرض الفواتير والأقساط المدفوعة والمتبقية بالجنيه المصري"
                  : "View itemized invoices, installment schedule & receipts"}
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* 2. APPOINTMENTS AND RECORDS MODULE */}
      {moduleSlug === "appointments" &&
        (role === "patient" ? (
          <PatientPersonalAppointmentsView patientName={identity.fullName} />
        ) : role === "clinic_owner" ? (
          <OwnerAppointmentAnalyticsView />
        ) : (
          <SmartClinicCalendar
            role={role === "doctor" ? "DENTIST" : "RECEPTIONIST"}
          />
        ))}

      {/* 3. PATIENT RECORDS MODULE */}
      {moduleSlug === "patients" && (
        <UnifiedPatientFileView
          role={
            role === "clinic_owner"
              ? "OWNER_ADMIN"
              : role === "doctor"
              ? "DENTIST"
              : role === "receptionist"
              ? "RECEPTIONIST"
              : "PATIENT"
          }
          initialPatientId={searchParams?.get("patientId") || undefined}
        />
      )}

      {/* 4. OWNER CLINICAL AUDIT (Read-Only Odontogram & CBCT) */}
      {moduleSlug === "clinical-audit" && role === "clinic_owner" && (
        <div className="space-y-8">
          <AnatomicalExamChart readOnly={true} />
          <CbctAnd3DViewer role="OWNER_ADMIN" />
        </div>
      )}

      {/* 5. DOCTOR EXAM ROOM & DENTAL CHART / PATIENT TREATMENT PLAN */}
      {moduleSlug === "exam-room" && role === "doctor" && (
        <AnatomicalExamChart
          readOnly={false}
          patientName={searchParams?.get("patientName") || "Passant"}
          patientNameAr={searchParams?.get("patientName") || "بسنت"}
          fileNumber={searchParams?.get("patientId") || "EBT-PAT-0001"}
          doctorNameEn={currentBranchObj.doctors[0]?.nameEn || "Dr. Sandy Saad"}
          doctorNameAr={currentBranchObj.doctors[0]?.nameAr || "د. ساندي سعد"}
        />
      )}
      {moduleSlug === "treatment-plan" && role === "patient" && (
        <AnatomicalExamChart
          readOnly={true}
          patientName={identity.fullName}
          patientNameAr={identity.firstName === "Passant" ? "بسنت" : identity.fullName}
        />
      )}

      {/* 6. DENTAL X-RAY AND CBCT VIEWER */}
      {moduleSlug === "imaging" && (
        <CbctAnd3DViewer
          role={role === "doctor" ? "DENTIST" : "PATIENT"}
          patientName={role === "patient" ? identity.fullName : "Passant"}
        />
      )}

      {/* 7. FINANCE CENTER / PATIENT BILLING */}
      {(moduleSlug === "finance" || moduleSlug === "billing") && (
        <FinanceCenterPhaseTwo
          role={role}
          patientNameFilter={role === "patient" ? "" : undefined}
        />
      )}

      {/* 7.5. DEDICATED EXPENSES PAGE (STRICTLY CLINIC OWNER EXCLUSIVE) */}
      {moduleSlug === "expenses" && role === "clinic_owner" && (
        <OwnerExpensesPage role="clinic_owner" />
      )}

      {/* 8. PROFIT AND PROFITABILITY (STRICTLY OWNER EXCLUSIVE) */}
      {moduleSlug === "profitability" && role === "clinic_owner" && (
        <ProfitabilityPhaseTwo role="clinic_owner" />
      )}

      {/* 9. INVENTORY AND SUPPLIES */}
      {moduleSlug === "inventory" && <InventorySuppliesPhaseTwo role={role} />}

      {/* 10. LAB MANAGEMENT */}
      {moduleSlug === "lab" && (
        <LabManagementPhaseTwo
          role={role}
          initialStatusFilter={
            searchParams?.get("status") === "ready" ? "ready" : "all"
          }
        />
      )}

      {/* 11. LEAD FOLLOW-UP (CRM) */}
      {moduleSlug === "crm" && <LeadFollowupCrmPhaseThree role={role} />}

      {/* 12. INBOX AND WHATSAPP (+201200054405) */}
      {moduleSlug === "inbox" && <InboxWhatsAppPhaseThree role={role} />}

      {/* 13. ATTENDANCE */}
      {moduleSlug === "attendance" && <AttendancePayrollPhaseThree role={role} />}

      {/* 14. REVIEWS */}
      {moduleSlug === "reviews" && (
        <WebsiteReviewsPhaseThree role={role} activeBranchCode={activeBranchCode} />
      )}

      {/* 15. STATISTICS AND REPORTS */}
      {moduleSlug === "reports" && (
        <div className="space-y-8">
          <StatisticsAndReportsPhaseThree role={role} />
          {role === "doctor" && (
            <WebsiteReviewsPhaseThree
              role={role}
              activeBranchCode={activeBranchCode}
              doctorNameFilter={currentBranchObj.doctors[0]?.nameEn || "Dr. Sandy Saad"}
            />
          )}
        </div>
      )}
    </div>
  );
}
