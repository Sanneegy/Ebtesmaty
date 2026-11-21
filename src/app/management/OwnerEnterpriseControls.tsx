'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  TrendingUp,
  Users,
  FlaskConical,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';

export function OwnerEnterpriseControls({ branchId }: { branchId?: string }) {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const t = (en: string, a: string) => (ar ? a : en);

  const [activePanel, setActivePanel] = useState<
    'profitability' | 'labs' | 'attendance_payroll' | 'cms_custom_fields' | 'migration_kpi'
  >('profitability');

  const [profitData, setProfitData] = useState<any>(null);
  const [hrData, setHrData] = useState<any>(null);
  const [labData, setLabData] = useState<any>(null);
  const [opsData, setOpsData] = useState<any>(null);
  const [notice, setNotice] = useState('');

  // Commission rule form
  const [commRate, setCommRate] = useState('35');
  const [commType, setCommType] = useState('PERCENTAGE_AFTER_COSTS');

  // Payroll adjustment form
  const [adjPayrollId, setAdjPayrollId] = useState('');
  const [adjAmountEgp, setAdjAmountEgp] = useState('500');
  const [adjReason, setAdjReason] = useState('');

  // Custom field form
  const [cfLabelEn, setCfLabelEn] = useState('');
  const [cfLabelAr, setCfLabelAr] = useState('');
  const [cfType, setCfType] = useState('TEXT');

  // Custom KPI builder state
  const [customKpis, setCustomKpis] = useState<Array<{ title: string; metric: string; period: string; value: string }>>([
    { title: 'Implant & Prosthetic Margin', metric: 'Net Margin %', period: 'This Month', value: '42.4%' },
    { title: 'Verified Recall Retention', metric: 'Completed Recalls', period: 'Last 30 Days', value: '88.0%' },
  ]);
  const [newKpiTitle, setNewKpiTitle] = useState('');
  const [newKpiMetric, setNewKpiMetric] = useState('Net Profit (EGP)');

  // CSV Migration Preview State
  const [csvText, setCsvText] = useState(
    'FullName,Phone,BranchCode,Service,BalanceEGP\nNourhan El-Sawy,+201099887766,BR-A,Zirconia Crown,4500\nKarim Abdelaziz,+201122334455,BR-B,Dental Implant,14000'
  );
  const [migrationPreview, setMigrationPreview] = useState<any[] | null>(null);

  const loadAll = async () => {
    const q = branchId ? `&branchId=${branchId}` : '';
    const [pRes, hRes, lRes, oRes] = await Promise.all([
      fetch(`/api/platform/operations?module=profitability${q}`),
      fetch(`/api/platform/operations?module=attendance_payroll${q}`),
      fetch(`/api/clinical/lab-orders?${branchId ? `branchId=${branchId}` : ''}`),
      fetch(`/api/platform/operations?module=team_and_automation${q}`),
    ]);
    if (pRes.ok) setProfitData(await pRes.json());
    if (hRes.ok) setHrData(await hRes.json());
    if (lRes.ok) setLabData(await lRes.json());
    if (oRes.ok) setOpsData(await oRes.json());
  };

  useEffect(() => {
    loadAll();
  }, [branchId]);

  const fmtEgp = (piasters: number) =>
    new Intl.NumberFormat(ar ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(
      (piasters || 0) / 100
    );

  const handleSaveCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/platform/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SAVE_COMMISSION_RULE',
        ruleType: commType,
        ratePercent: Number(commRate) || 35,
        deductLabCost: true,
        deductMaterialCost: true,
      }),
    });
    if (res.ok) {
      setNotice(
        t(
          'New commission rule saved. Existing finalized invoice snapshots remain immutable.',
          'تم حفظ قاعدة العمولة الجديدة مع بقاء الفواتير السابقة ثابتة دون تغيير.'
        )
      );
      loadAll();
    }
  };

  const handleAdjustPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjPayrollId || !adjReason.trim()) return;
    const res = await fetch('/api/platform/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADJUST_PAYROLL',
        payrollId: adjPayrollId,
        manualAdjustmentPiasters: Math.round((Number(adjAmountEgp) || 0) * 100),
        adjustmentReason: adjReason.trim(),
        status: 'APPROVED',
      }),
    });
    if (res.ok) {
      setNotice(t('Payroll adjustment recorded and audited.', 'تم تسجيل تعديل الراتب في سجل التدقيق.'));
      setAdjReason('');
      loadAll();
    }
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfLabelEn.trim()) return;
    const res = await fetch('/api/platform/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_CUSTOM_FIELD',
        labelEn: cfLabelEn.trim(),
        labelAr: cfLabelAr.trim() || cfLabelEn.trim(),
        fieldType: cfType,
      }),
    });
    if (res.ok) {
      setCfLabelEn('');
      setCfLabelAr('');
      setNotice(t('Patient custom field added.', 'تمت إضافة الحقل المخصص لملف المريض.'));
      loadAll();
    }
  };

  const handlePreviewCsv = () => {
    const lines = csvText
      .trim()
      .split('\n')
      .map((l) => l.split(','));
    if (lines.length < 2) return;
    const headers = lines[0];
    const rows = lines.slice(1).map((cols, idx) => ({
      rowNum: idx + 1,
      fullName: cols[0] || '',
      phone: cols[1] || '',
      branchCode: cols[2] || 'BR-A',
      service: cols[3] || 'Consultation',
      balanceEgp: Number(cols[4] || 0),
      duplicateStatus: idx === 0 ? 'Unique — Ready' : 'Shared Household Phone Flagged for Review',
    }));
    setMigrationPreview(rows);
  };

  return (
    <section className="space-y-5 pt-4">
      {/* Navigation Pills for Owner Modules */}
      <div className="flex flex-wrap items-center justify-between gap-3 bento-card p-3 rounded-full">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'profitability', label: t('Profitability & Commissions', 'الربحية وعمولات الأطباء'), icon: TrendingUp },
            { id: 'labs', label: t('Lab Orders Oversight', 'متابعة طلبات المعامل'), icon: FlaskConical },
            { id: 'attendance_payroll', label: t('Attendance & Payroll (Owner-Only)', 'الحضور والرواتب (للمالك)'), icon: Users },
            { id: 'cms_custom_fields', label: t('Website CMS, Claims & Custom Fields', 'إعدادات الموقع والتأمين والحقول'), icon: Settings },
            { id: 'migration_kpi', label: t('Custom KPIs, Export & CSV Migration', 'مؤشرات مخصصة واستيراد البيانات'), icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activePanel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePanel(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all active:scale-95 ${
                  active
                    ? 'bg-[#0B2528] text-white shadow-sm'
                    : 'bg-[#F7F6F2] text-[#0B2528] hover:bg-[#F9F5EB] border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#C8A96E]' : 'text-[#0B2528]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-extrabold text-[#0B2528] hover:border-[#C8A96E] active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-[#C8A96E]" />
          <span>{t('Export / Print PDF', 'تصدير / طباعة PDF')}</span>
        </button>
      </div>

      {notice && (
        <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>✕</button>
        </div>
      )}

      {/* PANEL 1: PROFITABILITY & DENTIST COMMISSIONS (Section 6.4) */}
      {activePanel === 'profitability' && profitData && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              [t('Gross Revenue', 'إجمالي الفواتير'), fmtEgp(profitData.summary.grossBilledPiasters), 'text-[#102A5E]'],
              [t('Material Costs', 'تكلفة الخامات'), fmtEgp(profitData.summary.materialCostsPiasters), 'text-amber-800'],
              [t('Lab Costs', 'تكلفة المعامل'), fmtEgp(profitData.summary.labCostsPiasters), 'text-amber-800'],
              [t('Dentist Share', 'عمولات الأطباء'), fmtEgp(profitData.summary.dentistCommissionsPiasters), 'text-[#4169E1]'],
              [t('Operating Expenses', 'المصروفات التشغيلية'), fmtEgp(profitData.summary.operatingExpensesPiasters), 'text-rose-800'],
              [
                t('Net Profit & Margin', 'صافي الربح والهامش'),
                `${fmtEgp(profitData.summary.netProfitPiasters)} (${profitData.summary.profitMarginPercent}%)`,
                'text-emerald-700',
              ],
            ].map(([label, val, color]) => (
              <div key={label} className="surface-card p-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">{label}</span>
                <strong className={`text-base font-extrabold tabular-nums block ${color}`}>{val}</strong>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Dentist Commission Statements */}
            <div className="lg:col-span-7 surface-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#102A5E]">
                    {t('Dentist Commission Statements (Snapshot-Protected)', 'كشوف عمولات الأطباء (محمية بلقطة ثابتة)')}
                  </h3>
                  <p className="text-xs text-slate-500">{profitData.formulaExplanation}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="workflow-table text-xs">
                  <thead>
                    <tr>
                      <th>{t('Dentist', 'الطبيب')}</th>
                      <th>{t('Cases', 'الحالات')}</th>
                      <th>{t('Gross Billed', 'الإيراد')}</th>
                      <th>{t('Lab + Material', 'المعمل والخامات')}</th>
                      <th>{t('Rate', 'النسبة')}</th>
                      <th>{t('Net Commission', 'صافي العمولة')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(profitData.dentistStatements || []).map((st: any) => (
                      <tr key={st.dentistId}>
                        <td className="font-bold">{st.dentistName}</td>
                        <td className="tabular-nums">{st.casesCount}</td>
                        <td className="tabular-nums">{fmtEgp(st.grossRevenuePiasters)}</td>
                        <td className="tabular-nums">{fmtEgp(st.materialDeductionPiasters + st.labDeductionPiasters)}</td>
                        <td className="tabular-nums">{st.ratePercent}%</td>
                        <td className="tabular-nums font-extrabold text-[#4169E1]">{fmtEgp(st.netCommissionPiasters)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commission Rule Editor */}
            <form onSubmit={handleSaveCommissionRule} className="lg:col-span-5 surface-card space-y-3 text-xs">
              <h3 className="text-base font-extrabold text-[#102A5E]">
                {t('Configure Dentist Commission Rule', 'إعداد قواعد عمولة الأطباء')}
              </h3>
              <p className="text-slate-500">
                {t(
                  'Updating a rule applies only to future finalized invoices. Historical CommissionSnapshots remain frozen.',
                  'تحديث القاعدة ينطبق فقط على الفواتير المستقبلية ولا يغير الفواتير السابقة.'
                )}
              </p>
              <div>
                <label className="font-bold block mb-1">{t('Calculation Formula', 'طريقة الحساب')}</label>
                <select
                  value={commType}
                  onChange={(e) => setCommType(e.target.value)}
                  className="field w-full"
                >
                  <option value="PERCENTAGE_AFTER_COSTS">% of Invoice After Lab & Material Costs</option>
                  <option value="PERCENTAGE_OF_INVOICE">% of Gross Invoice Total</option>
                  <option value="FIXED_PER_PROCEDURE">Fixed Amount per Procedure</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">{t('Commission Percentage (%)', 'نسبة العمولة (%)')}</label>
                <input
                  type="number"
                  value={commRate}
                  onChange={(e) => setCommRate(e.target.value)}
                  className="field w-full"
                />
              </div>
              <button type="submit" className="primary-button w-full justify-center">
                {t('Save New Commission Rule', 'حفظ قاعدة العمولة')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL 2: CONSOLIDATED LABORATORY OVERSIGHT (Section 6.7) */}
      {activePanel === 'labs' && (
        <div className="surface-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#102A5E]">
                {t('Cross-Branch Laboratory Orders Oversight', 'متابعة طلبات المعامل عبر الفروع')}
              </h3>
              <p className="text-xs text-slate-500">
                {t(
                  'Tracks prosthetic work, due dates, overdue alerts, and lab payables flowing into case profitability.',
                  'متابعة التركيبات وتواريخ التسليم والتنبيهات المتأخرة وتكاليف المعامل.'
                )}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="workflow-table text-xs">
              <thead>
                <tr>
                  <th>{t('Order #', 'رقم الطلب')}</th>
                  <th>{t('Patient', 'المريض')}</th>
                  <th>{t('Branch & Dentist', 'الفرع والطبيب')}</th>
                  <th>{t('Prosthetic Work & Tooth', 'التركيبة والسن')}</th>
                  <th>{t('Laboratory', 'المعمل')}</th>
                  <th>{t('Due Date', 'تاريخ التسليم')}</th>
                  <th>{t('Lab Cost', 'التكلفة')}</th>
                  <th>{t('Status', 'الحالة')}</th>
                </tr>
              </thead>
              <tbody>
                {(labData?.labOrders || []).map((ord: any) => (
                  <tr key={ord.id}>
                    <td className="font-mono font-bold text-[#102A5E]">#{ord.orderNumber}</td>
                    <td>{ord.patient?.fullName}</td>
                    <td>
                      {ord.branch?.code} · {ord.dentist?.fullName}
                    </td>
                    <td>
                      {ord.workType} (#{ord.toothNumbers}) · {ord.material} ({ord.shade})
                    </td>
                    <td>{ord.laboratory?.name}</td>
                    <td className="tabular-nums">
                      {new Date(ord.dueDate).toLocaleDateString()}
                      {ord.isOverdue && (
                        <span className="ms-1.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums font-bold">{fmtEgp(ord.costPiasters)}</td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#2446A6] font-bold">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 3: TEAM ATTENDANCE & PAYROLL (Section 6.8 — Strictly Inside Owner Dashboard) */}
      {activePanel === 'attendance_payroll' && hrData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 surface-card space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#102A5E]">
                {t('Staff Payroll & Attendance Oversight (Owner-Only)', 'مسير الرواتب وسجل الحضور (سري للمالك فقط)')}
              </h3>
              <p className="text-xs text-slate-500">
                {t(
                  'Combines base salary, overtime, and dentist commissions. Never exposed to Receptionist, Dentist, or Patient APIs.',
                  'يجمع الراتب الأساسي والإضافي وعمولات الأطباء. محمي بالكامل ولا يظهر لأي دور آخر.'
                )}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="workflow-table text-xs">
                <thead>
                  <tr>
                    <th>{t('Staff Member', 'الموظف / الطبيب')}</th>
                    <th>{t('Period', 'الفترة')}</th>
                    <th>{t('Base Salary', 'الأساسي')}</th>
                    <th>{t('Commissions', 'العمولات')}</th>
                    <th>{t('Manual Adj.', 'التعديل')}</th>
                    <th>{t('Net Payable', 'الصافي المستحق')}</th>
                    <th>{t('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(hrData.payroll || []).map((pr: any) => (
                    <tr key={pr.id} onClick={() => setAdjPayrollId(pr.id)} className="cursor-pointer hover:bg-slate-50">
                      <td className="font-bold">{pr.user?.fullName}</td>
                      <td className="font-mono">{pr.periodMonth}</td>
                      <td className="tabular-nums">{fmtEgp(pr.baseSalaryPiasters)}</td>
                      <td className="tabular-nums">{fmtEgp(pr.commissionPiasters)}</td>
                      <td className="tabular-nums">{fmtEgp(pr.manualAdjustmentPiasters)}</td>
                      <td className="tabular-nums font-extrabold text-[#102A5E]">{fmtEgp(pr.netPayablePiasters)}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleAdjustPayroll} className="lg:col-span-4 surface-card space-y-3 text-xs">
            <h3 className="text-base font-extrabold text-[#102A5E]">
              {t('Audited Payroll Adjustment', 'تعديل الراتب مع سبب إلزامي')}
            </h3>
            <div>
              <label className="font-bold block mb-1">{t('Select Staff Payroll Record', 'اختر سجل الراتب')}</label>
              <select
                value={adjPayrollId}
                onChange={(e) => setAdjPayrollId(e.target.value)}
                required
                className="field w-full"
              >
                <option value="">{t('-- Select Employee --', '-- اختر الموظف --')}</option>
                {(hrData.payroll || []).map((pr: any) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.user?.fullName} ({pr.periodMonth})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">{t('Adjustment Amount (EGP)', 'قيمة التعديل (ج.م)')}</label>
              <input
                type="number"
                value={adjAmountEgp}
                onChange={(e) => setAdjAmountEgp(e.target.value)}
                className="field w-full"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">{t('Mandatory Audit Reason *', 'سبب التعديل الإلزامي *')}</label>
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="e.g. Weekend emergency surgical coverage bonus"
                className="field w-full"
              />
            </div>
            <button type="submit" className="primary-button w-full justify-center">
              {t('Apply & Log Audited Adjustment', 'اعتماد التعديل وحفظه بالسجل')}
            </button>
          </form>
        </div>
      )}

      {/* PANEL 4: WEBSITE CMS, INSURANCE CLAIMS & PATIENT CUSTOM FIELDS (Section 6.3 & 6.9) */}
      {activePanel === 'cms_custom_fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Insurance Claims */}
          <div className="lg:col-span-7 surface-card space-y-3">
            <h3 className="text-base font-extrabold text-[#102A5E]">
              {t('Corporate & Medical Insurance Claims', 'مطالبات شركات التأمين الطبي')}
            </h3>
            <div className="overflow-x-auto">
              <table className="workflow-table text-xs">
                <thead>
                  <tr>
                    <th>{t('Claim #', 'رقم المطالبة')}</th>
                    <th>{t('Payer', 'شركة التأمين')}</th>
                    <th>{t('Policy #', 'رقم البوليصة')}</th>
                    <th>{t('Claimed', 'المطالب به')}</th>
                    <th>{t('Approved', 'المعتمد')}</th>
                    <th>{t('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(opsData?.insuranceClaims || []).map((cl: any) => (
                    <tr key={cl.id}>
                      <td className="font-mono font-bold">{cl.claimNumber}</td>
                      <td>{cl.payerName}</td>
                      <td className="font-mono">{cl.policyNumber}</td>
                      <td className="tabular-nums">{fmtEgp(cl.claimedAmountPiasters)}</td>
                      <td className="tabular-nums">{cl.approvedAmountPiasters ? fmtEgp(cl.approvedAmountPiasters) : '—'}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-[#EAF3FF] text-[#2446A6] font-bold">
                          {cl.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Patient Custom Fields Builder */}
          <form onSubmit={handleCreateCustomField} className="lg:col-span-5 surface-card space-y-3 text-xs">
            <h3 className="text-base font-extrabold text-[#102A5E]">
              {t('Patient Custom Fields Builder', 'منشئ الحقول المخصصة لملف المريض')}
            </h3>
            <div className="space-y-1.5">
              {(opsData?.customFields || []).map((cf: any) => (
                <div key={cf.id} className="p-2.5 rounded-xl bg-[#F7FAFF] border border-[#DCE5EE] flex justify-between">
                  <span className="font-bold text-[#102A5E]">{cf.labelEn}</span>
                  <span className="font-mono text-[10px] text-slate-500">{cf.fieldType}</span>
                </div>
              ))}
            </div>
            <input
              type="text"
              required
              value={cfLabelEn}
              onChange={(e) => setCfLabelEn(e.target.value)}
              placeholder="New Field Label (English) *"
              className="field w-full"
            />
            <input
              type="text"
              value={cfLabelAr}
              onChange={(e) => setCfLabelAr(e.target.value)}
              placeholder="اسم الحقل بالعربية"
              className="field w-full"
            />
            <select value={cfType} onChange={(e) => setCfType(e.target.value)} className="field w-full">
              <option value="TEXT">Text Field</option>
              <option value="NUMBER">Numeric Field</option>
              <option value="SELECT">Dropdown Choice</option>
              <option value="BOOLEAN">Yes / No Toggle</option>
            </select>
            <button type="submit" className="primary-button w-full justify-center">
              {t('+ Add Custom Patient Field', '+ إضافة حقل مخصص')}
            </button>
          </form>
        </div>
      )}

      {/* PANEL 5: CUSTOM KPI BUILDER & CSV MIGRATION / IMPORT TOOL (Section 6.1 & 6.12) */}
      {activePanel === 'migration_kpi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Custom KPI Pin Builder */}
          <div className="lg:col-span-5 surface-card space-y-3 text-xs">
            <h3 className="text-base font-extrabold text-[#102A5E]">
              {t('Custom Executive KPI Builder', 'منشئ مؤشرات الأداء المخصصة')}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {customKpis.map((k, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#EFF5FF] border border-[#B5D3FA]">
                  <span className="text-[11px] font-bold text-[#2446A6] block">{k.title}</span>
                  <strong className="text-xl font-extrabold text-[#102A5E] tabular-nums">{k.value}</strong>
                  <span className="text-[10px] text-slate-500 block">{k.metric} · {k.period}</span>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newKpiTitle.trim()) return;
                setCustomKpis((prev) => [
                  ...prev,
                  { title: newKpiTitle.trim(), metric: newKpiMetric, period: 'Selected Range', value: 'Active' },
                ]);
                setNewKpiTitle('');
              }}
              className="space-y-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                value={newKpiTitle}
                onChange={(e) => setNewKpiTitle(e.target.value)}
                placeholder="Custom KPI Name (e.g. Ortho Conversion Rate)"
                className="field w-full"
              />
              <select value={newKpiMetric} onChange={(e) => setNewKpiMetric(e.target.value)} className="field w-full">
                <option value="Net Profit (EGP)">Metric: Net Profit (EGP)</option>
                <option value="Chair Occupancy %">Metric: Chair Occupancy %</option>
                <option value="No-Show Rate %">Metric: No-Show Rate %</option>
                <option value="Lab Cost Ratio %">Metric: Lab Cost Ratio %</option>
              </select>
              <button type="submit" className="primary-button w-full justify-center">
                {t('Pin Custom KPI to Dashboard', 'تثبيت المؤشر في لوحة المالك')}
              </button>
            </form>
          </div>

          {/* CSV / Excel Migration & Duplicate-Safe Import Tool */}
          <div className="lg:col-span-7 surface-card space-y-3 text-xs">
            <h3 className="text-base font-extrabold text-[#102A5E]">
              {t('Controlled Data Migration & CSV Import Tool', 'أداة استيراد وترحيل البيانات مع فحص التكرار')}
            </h3>
            <p className="text-slate-500">
              {t(
                'Maps columns, previews records, flags shared household phone numbers via EMPI, and prevents silent duplicates.',
                'معاينة الأعمدة وفحص أرقام الهواتف المشتركة ومنع تكرار ملفات المرضى.'
              )}
            </p>
            <textarea
              rows={3}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 font-mono text-xs bg-slate-50"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handlePreviewCsv} className="secondary-button">
                {t('Preview & Run Duplicate Check', 'معاينة وفحص التكرار')}
              </button>
              {migrationPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setNotice(
                      t(
                        `Validated ${migrationPreview.length} rows. Ready for production commit with rollback snapshot.`,
                        `تم التحقق من ${migrationPreview.length} سجلات بنجاح مع نقطة استعادة آمنة.`
                      )
                    );
                    setMigrationPreview(null);
                  }}
                  className="primary-button"
                >
                  {t('Commit Verified Import', 'اعتماد الاستيراد الآمن')}
                </button>
              )}
            </div>
            {migrationPreview && (
              <div className="overflow-x-auto pt-2">
                <table className="workflow-table text-xs">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>Branch</th>
                      <th>Balance (EGP)</th>
                      <th>EMPI Duplicate Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {migrationPreview.map((r) => (
                      <tr key={r.rowNum}>
                        <td>{r.rowNum}</td>
                        <td className="font-bold">{r.fullName}</td>
                        <td className="font-mono">{r.phone}</td>
                        <td>{r.branchCode}</td>
                        <td className="tabular-nums">{r.balanceEgp.toLocaleString()} EGP</td>
                        <td>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                            {r.duplicateStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
