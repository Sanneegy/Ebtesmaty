'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PatientPersonalAppointmentsView, {
  LOCAL_BOOKED_APPOINTMENTS_KEY,
  PersonalPatientVisit,
} from './PatientPersonalAppointmentsView';
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Edit3,
  ShieldAlert,
  BellRing,
  X,
} from 'lucide-react';

export const DOCTOR_SCHEDULE_REQUESTS_KEY = 'ebtesamty_doctor_schedule_requests_v1';
export const DOCTOR_SCHEDULE_REQUESTS_EVENT = 'ebtesamty-doctor-schedule-requests-sync';

export interface DoctorScheduleChangeRequest {
  id: string;
  appointmentId: string;
  patientNameEn: string;
  patientNameAr: string;
  currentSlot: string;
  doctorNameEn: string;
  doctorNameAr: string;
  branchNameEn: string;
  reason:
    | 'Reschedule Visit'
    | 'Block Time Slot'
    | 'Extend Procedure Time'
    | 'Cancel / Patient Follow-up';
  note: string;
  createdAt: string;
  status: 'PENDING' | 'COMPLETED';
}

interface CalendarSlotItem {
  id: string;
  dayCol: number; // 0 = Sat 12 .. 6 = Fri 18
  chairId: 'CHAIR-1' | 'CHAIR-2' | 'CHAIR-3';
  time: string;
  patientNameEn: string;
  patientNameAr: string;
  procedureEn: string;
  procedureAr: string;
  doctorId: 'dr-sandy' | 'dr-ahmed' | 'dr-sara' | 'dr-karim';
  doctorNameEn: string;
  doctorNameAr: string;
  status: 'COMPLETED' | 'ARRIVED' | 'BOOKED' | 'LEFT';
}

const INITIAL_CALENDAR_ITEMS: CalendarSlotItem[] = [
  {
    id: 'cal-sandy-1',
    dayCol: 2,
    chairId: 'CHAIR-1',
    time: '10:00 AM',
    patientNameEn: 'Passant (#EBT-PAT-0001)',
    patientNameAr: 'بسنت (#EBT-PAT-0001)',
    procedureEn: 'Post & Core · Tooth #36',
    procedureAr: 'دعامة وبناء السن #36',
    doctorId: 'dr-sandy',
    doctorNameEn: 'Dr. Sandy Saad',
    doctorNameAr: 'د. ساندي سعد',
    status: 'ARRIVED',
  },
  {
    id: 'cal-1',
    dayCol: 0,
    chairId: 'CHAIR-1',
    time: '10:30 AM',
    patientNameEn: 'Mohamed Khaled',
    patientNameAr: 'محمد خالد',
    procedureEn: 'Root Canal',
    procedureAr: 'علاج الجذور',
    doctorId: 'dr-sandy',
    doctorNameEn: 'Dr. Sandy Saad',
    doctorNameAr: 'د. ساندي سعد',
    status: 'COMPLETED',
  },
  {
    id: 'cal-2',
    dayCol: 0,
    chairId: 'CHAIR-2',
    time: '11:30 AM',
    patientNameEn: 'Ibrahim Othman',
    patientNameAr: 'إبراهيم عثمان',
    procedureEn: 'Exam & Diagnosis',
    procedureAr: 'كشف وتشخيص',
    doctorId: 'dr-sara',
    doctorNameEn: 'Dr. Feby Samer',
    doctorNameAr: 'د. فيبي سامر',
    status: 'COMPLETED',
  },
  {
    id: 'cal-3',
    dayCol: 1,
    chairId: 'CHAIR-1',
    time: '10:30 AM',
    patientNameEn: 'Khaled Adel',
    patientNameAr: 'خالد عادل',
    procedureEn: 'Teeth Whitening',
    procedureAr: 'تبييض أسنان',
    doctorId: 'dr-sandy',
    doctorNameEn: 'Dr. Sandy Saad',
    doctorNameAr: 'د. ساندي سعد',
    status: 'ARRIVED',
  },
  {
    id: 'cal-4',
    dayCol: 1,
    chairId: 'CHAIR-2',
    time: '12:35 PM',
    patientNameEn: 'Amir Amin',
    patientNameAr: 'أمير أمين',
    procedureEn: 'Orthodontics',
    procedureAr: 'تقويم أسنان',
    doctorId: 'dr-karim',
    doctorNameEn: 'Dr. Ahmed Hassan',
    doctorNameAr: 'د. أحمد حسن',
    status: 'COMPLETED',
  },
  {
    id: 'cal-5',
    dayCol: 2,
    chairId: 'CHAIR-1',
    time: '11:30 AM',
    patientNameEn: 'Siham Youssef',
    patientNameAr: 'سهام يوسف',
    procedureEn: 'Cosmetic Filling',
    procedureAr: 'حشو تجميلي',
    doctorId: 'dr-sara',
    doctorNameEn: 'Dr. Feby Samer',
    doctorNameAr: 'د. فيبي سامر',
    status: 'BOOKED',
  },
  {
    id: 'cal-6',
    dayCol: 2,
    chairId: 'CHAIR-2',
    time: '02:30 PM',
    patientNameEn: 'Amira Ayman',
    patientNameAr: 'أميرة أيمن',
    procedureEn: 'Surgical Extraction',
    procedureAr: 'خلع جراحي',
    doctorId: 'dr-sandy',
    doctorNameEn: 'Dr. Sandy Saad',
    doctorNameAr: 'د. ساندي سعد',
    status: 'BOOKED',
  },
  {
    id: 'cal-7',
    dayCol: 3,
    chairId: 'CHAIR-1',
    time: '10:30 AM',
    patientNameEn: 'Yasmine Amin',
    patientNameAr: 'ياسمين أمين',
    procedureEn: 'Cosmetic Filling',
    procedureAr: 'حشو تجميلي',
    doctorId: 'dr-sara',
    doctorNameEn: 'Dr. Feby Samer',
    doctorNameAr: 'د. فيبي سامر',
    status: 'BOOKED',
  },
  {
    id: 'cal-8',
    dayCol: 3,
    chairId: 'CHAIR-3',
    time: '02:15 PM',
    patientNameEn: 'Ahmed Mahmoud',
    patientNameAr: 'أحمد محمود',
    procedureEn: 'Orthodontics',
    procedureAr: 'تقويم أسنان',
    doctorId: 'dr-karim',
    doctorNameEn: 'Dr. Ahmed Hassan',
    doctorNameAr: 'د. أحمد حسن',
    status: 'BOOKED',
  },
  {
    id: 'cal-9',
    dayCol: 4,
    chairId: 'CHAIR-2',
    time: '10:30 AM',
    patientNameEn: 'Ibrahim Hassan',
    patientNameAr: 'إبراهيم حسن',
    procedureEn: 'Exam & Diagnosis',
    procedureAr: 'كشف وتشخيص',
    doctorId: 'dr-sandy',
    doctorNameEn: 'Dr. Sandy Saad',
    doctorNameAr: 'د. ساندي سعد',
    status: 'BOOKED',
  },
  {
    id: 'cal-10',
    dayCol: 5,
    chairId: 'CHAIR-1',
    time: '10:30 AM',
    patientNameEn: 'Salma Ibrahim',
    patientNameAr: 'سلمى إبراهيم',
    procedureEn: 'Orthodontics',
    procedureAr: 'تقويم أسنان',
    doctorId: 'dr-karim',
    doctorNameEn: 'Dr. Ahmed Hassan',
    doctorNameAr: 'د. أحمد حسن',
    status: 'BOOKED',
  },
];

export function SmartClinicCalendar({
  role = 'RECEPTIONIST',
  loggedInDoctorNameEn = 'Dr. Sandy Saad',
  loggedInDoctorNameAr = 'د. ساندي سعد',
}: {
  role?: 'OWNER_ADMIN' | 'DENTIST' | 'RECEPTIONIST' | 'PATIENT';
  loggedInDoctorNameEn?: string;
  loggedInDoctorNameAr?: string;
}) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const c = (en: string, ar: string) => (isAr ? ar : en);
  const isDentist = role === 'DENTIST';

  const [viewMode, setViewMode] = useState<'week' | 'chairs' | 'month'>('week');
  const [selectedDoctor, setSelectedDoctor] = useState<string>(isDentist ? 'dr-sandy' : 'ALL');
  const [activeWeekTab, setActiveWeekTab] = useState<number>(2);
  const [items, setItems] = useState<CalendarSlotItem[]>(INITIAL_CALENDAR_ITEMS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [clashAlert, setClashAlert] = useState<string | null>(null);
  const [rescheduleToast, setRescheduleToast] = useState<string | null>(null);

  // Doctor -> Receptionist Schedule Change Request state
  const [scheduleRequests, setScheduleRequests] = useState<DoctorScheduleChangeRequest[]>([]);
  const [requestModalTarget, setRequestModalTarget] = useState<CalendarSlotItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState<DoctorScheduleChangeRequest['reason']>('Reschedule Visit');
  const [requestNote, setRequestNote] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadRequests = () => {
      try {
        const raw = window.localStorage.getItem(DOCTOR_SCHEDULE_REQUESTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setScheduleRequests(parsed);
        }
      } catch {}
    };
    loadRequests();
    window.addEventListener('storage', loadRequests);
    window.addEventListener(DOCTOR_SCHEDULE_REQUESTS_EVENT, loadRequests);
    return () => {
      window.removeEventListener('storage', loadRequests);
      window.removeEventListener(DOCTOR_SCHEDULE_REQUESTS_EVENT, loadRequests);
    };
  }, []);

  const saveScheduleRequests = (next: DoctorScheduleChangeRequest[]) => {
    setScheduleRequests(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DOCTOR_SCHEDULE_REQUESTS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(DOCTOR_SCHEDULE_REQUESTS_EVENT));
      } catch {}
    }
  };

  const handleOpenDoctorRequestModal = (appt?: CalendarSlotItem) => {
    setRequestModalTarget(appt || null);
    setRequestReason(appt ? 'Reschedule Visit' : 'Block Time Slot');
    setRequestNote(
      appt
        ? `Please reschedule ${appt.patientNameEn} (${appt.procedureEn} at ${appt.time}) and confirm via WhatsApp.`
        : 'Please block 2:00 PM – 3:00 PM on Chair 1 for surgical follow-up.'
    );
    setShowRequestModal(true);
  };

  const handleSubmitDoctorScheduleRequest = () => {
    const newReq: DoctorScheduleChangeRequest = {
      id: `DSR-${Date.now()}`,
      appointmentId: requestModalTarget?.id || 'SLOT-BLOCK',
      patientNameEn: requestModalTarget?.patientNameEn || 'Schedule Slot Block',
      patientNameAr: requestModalTarget?.patientNameAr || 'حجز/إغلاق فترة زمنية',
      currentSlot: requestModalTarget
        ? `${requestModalTarget.time} · ${requestModalTarget.chairId}`
        : 'Chair 1 · 2:00 PM',
      doctorNameEn: loggedInDoctorNameEn,
      doctorNameAr: loggedInDoctorNameAr,
      branchNameEn: 'Minya – Branch A',
      reason: requestReason,
      note: requestNote.trim() || requestReason,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
    };
    saveScheduleRequests([newReq, ...scheduleRequests]);
    setShowRequestModal(false);
    setRescheduleToast(
      c(
        `Schedule change request ("${requestReason}") sent to Minya – Branch A Reception (Mariam Hanna).`,
        `تم إرسال طلب تعديل الجدول ("${requestReason}") إلى استقبال المنيا – الفرع أ (مريم حنا).`
      )
    );
  };

  const handleReceptionCompleteDoctorRequest = (reqId: string) => {
    const next = scheduleRequests.map((r) =>
      r.id === reqId ? { ...r, status: 'COMPLETED' as const } : r
    );
    saveScheduleRequests(next);
    setRescheduleToast(
      c(
        'Doctor schedule change executed & patient notified via Clinic WhatsApp.',
        'تم تنفيذ طلب الطبيب لتعديل الموعد وإبلاغ المريض عبر واتساب العيادة.'
      )
    );
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_BOOKED_APPOINTMENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersonalPatientVisit[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const mapped: CalendarSlotItem[] = parsed
              .filter((p) => !existingIds.has(p.id))
              .map((p) => ({
                id: p.id,
                dayCol: 2,
                chairId: 'CHAIR-1',
                time: p.time,
                patientNameEn: p.patientName || 'Passant',
                patientNameAr: p.patientName || 'بسنت',
                procedureEn: p.serviceEn,
                procedureAr: p.serviceAr,
                doctorId: 'dr-ahmed',
                doctorNameEn: p.doctorNameEn,
                doctorNameAr: p.doctorNameAr,
                status: 'BOOKED',
              }));
            return [...mapped, ...prev];
          });
        }
      }
    } catch {}
  }, []);

  // Waiting List & No-Shows state (Image 6)
  const [waitingList, setWaitingList] = useState([
    {
      id: 'wl-1',
      initial: 'S',
      color: 'bg-purple-600',
      nameEn: 'Salma Fouad',
      nameAr: 'سلمى فؤاد',
      prefEn: 'Prefers after 3 PM · Cleaning',
      prefAr: 'تفضل بعد 3 عصراً · تنظيف جير',
      called: false,
    },
    {
      id: 'wl-2',
      initial: 'T',
      color: 'bg-blue-600',
      nameEn: 'Khaled Omar',
      nameAr: 'خالد عمر',
      prefEn: 'Any time today · Follow-up',
      prefAr: 'أي وقت اليوم · متابعة',
      called: false,
    },
    {
      id: 'wl-3',
      initial: 'L',
      color: 'bg-emerald-600',
      nameEn: 'Mona Ragab',
      nameAr: 'منى رجب',
      prefEn: 'Saturday or Sunday · Check-up',
      prefAr: 'السبت أو الأحد · كشف دوري',
      called: false,
    },
  ]);

  const [noShows, setNoShows] = useState([
    {
      id: 'ns-1',
      nameEn: 'Tarek Youssef',
      nameAr: 'طارق يوسف',
      missedSlot: 'Yesterday 4:00 PM · Root Canal',
      status: 'Awaiting Recall',
    },
  ]);

  const [newWaitName, setNewWaitName] = useState('');
  const [newWaitPref, setNewWaitPref] = useState('Any time today · Cleaning');
  const [showAddWaitModal, setShowAddWaitModal] = useState(false);

  // WhatsApp Template & Lead Time State (Image 5)
  const [waLeadTime, setWaLeadTime] = useState('24 hours before visit');
  const [waTemplate, setWaTemplate] = useState(
    'Reminder: your appointment is tomorrow at 5:30 PM — Smile Clinic, 3rd floor.'
  );
  const [editingTemplate, setEditingTemplate] = useState(false);

  // CRITICAL PRIVACY & RBAC GUARD:
  // Patients NEVER see the multi-chair staff calendar, cancellation waiting list, or internal Clinic WhatsApp console.
  if (role === 'PATIENT') {
    return <PatientPersonalAppointmentsView />;
  }

  const weekDays = [
    { col: 0, dayAr: 'السبت', dayEn: 'Saturday', num: 12, subAr: '9 نوفمبر', subEn: 'Nov 9' },
    { col: 1, dayAr: 'الأحد', dayEn: 'Sunday', num: 13, subAr: '10 نوفمبر', subEn: 'Nov 10' },
    { col: 2, dayAr: 'الاثنين', dayEn: 'Monday', num: 14, subAr: '11 نوفمبر', subEn: 'Nov 11' },
    { col: 3, dayAr: 'الثلاثاء', dayEn: 'Tuesday', num: 15, subAr: '12 نوفمبر', subEn: 'Nov 12' },
    { col: 4, dayAr: 'الأربعاء', dayEn: 'Wednesday', num: 16, subAr: '13 نوفمبر', subEn: 'Nov 13' },
    { col: 5, dayAr: 'الخميس', dayEn: 'Thursday', num: 17, subAr: '14 نوفمبر', subEn: 'Nov 14' },
    { col: 6, dayAr: 'الجمعة', dayEn: 'Friday', num: 18, subAr: '15 نوفمبر', subEn: 'Nov 15' },
  ];

  const chairs = [
    { id: 'CHAIR-1' as const, labelEn: 'Chair 1 — Main Operatory', labelAr: 'كرسي ١ — العيادة الرئيسية' },
    { id: 'CHAIR-2' as const, labelEn: 'Chair 2 — Surgical Suite', labelAr: 'كرسي ٢ — جراحة وزراعة' },
    { id: 'CHAIR-3' as const, labelEn: 'Chair 3 — Ortho & Hygiene', labelAr: 'كرسي ٣ — تقويم وتجميل' },
  ];

  const doctors = [
    { id: 'ALL', labelEn: 'All Doctors', labelAr: 'كل الأطباء' },
    { id: 'dr-sandy', labelEn: 'Dr. Sandy Saad', labelAr: 'د. ساندي سعد' },
    { id: 'dr-sara', labelEn: 'Dr. Feby Samer', labelAr: 'د. فيبي سامر' },
    { id: 'dr-karim', labelEn: 'Dr. Ahmed Hassan', labelAr: 'د. أحمد حسن' },
  ];

  // When role === 'DENTIST', show ONLY the logged-in doctor's own schedule
  const filteredItems = items.filter((it) => {
    if (isDentist) {
      return (
        it.doctorId === 'dr-sandy' ||
        it.doctorNameEn.toLowerCase().includes(loggedInDoctorNameEn.toLowerCase())
      );
    }
    return selectedDoctor === 'ALL' || it.doctorId === selectedDoctor;
  });

  // Handle Drag-and-Drop Reschedule with Automatic Clash Prevention
  const handleDropOnDay = (targetDayCol: number) => {
    if (!draggedId) return;
    const draggedItem = items.find((i) => i.id === draggedId);
    if (!draggedItem) return;

    // Automatic Clash Prevention check: same day, same chair, same time
    const clash = items.find(
      (i) =>
        i.id !== draggedItem.id &&
        i.dayCol === targetDayCol &&
        i.chairId === draggedItem.chairId &&
        i.time === draggedItem.time
    );

    if (clash) {
      setClashAlert(
        c(
          `Automatic Clash Prevention: ${draggedItem.chairId} is already booked at ${draggedItem.time} for ${clash.patientNameEn}. Double-booking prevented!`,
          `منع التعارض التلقائي: ${draggedItem.chairId} محجوز بالفعل الساعة ${draggedItem.time} للمريض ${clash.patientNameAr}. لا يسمح النظام بحجزين على نفس الكرسي في نفس الوقت!`
        )
      );
      setDraggedId(null);
      return;
    }

    setClashAlert(null);
    setItems((prev) =>
      prev.map((i) => (i.id === draggedItem.id ? { ...i, dayCol: targetDayCol } : i))
    );
    const dayObj = weekDays.find((d) => d.col === targetDayCol);
    setRescheduleToast(
      c(
        `Moved ${draggedItem.patientNameEn} to ${dayObj?.dayEn} ${dayObj?.num} (${draggedItem.time}) & queued WhatsApp update.`,
        `تم نقل موعد ${draggedItem.patientNameAr} إلى ${dayObj?.dayAr} ${dayObj?.num} (${draggedItem.time}) في ثانية واحدة.`
      )
    );
    setDraggedId(null);
  };

  const handleDropOnChair = (targetChairId: 'CHAIR-1' | 'CHAIR-2' | 'CHAIR-3') => {
    if (!draggedId) return;
    const draggedItem = items.find((i) => i.id === draggedId);
    if (!draggedItem) return;

    const clash = items.find(
      (i) =>
        i.id !== draggedItem.id &&
        i.dayCol === draggedItem.dayCol &&
        i.chairId === targetChairId &&
        i.time === draggedItem.time
    );

    if (clash) {
      setClashAlert(
        c(
          `Automatic Clash Prevention: ${targetChairId} is already occupied at ${draggedItem.time} by ${clash.patientNameEn}.`,
          `منع التعارض التلقائي: ${targetChairId} مشغول بالفعل في نفس الموعد (${draggedItem.time}).`
        )
      );
      setDraggedId(null);
      return;
    }

    setClashAlert(null);
    setItems((prev) =>
      prev.map((i) => (i.id === draggedItem.id ? { ...i, chairId: targetChairId } : i))
    );
    setRescheduleToast(
      c(
        `Reassigned ${draggedItem.patientNameEn} to ${targetChairId} (${draggedItem.time}).`,
        `تم نقل ${draggedItem.patientNameAr} إلى ${targetChairId} بنجاح.`
      )
    );
    setDraggedId(null);
  };

  const handleFillCancelledSlot = (waitItem: (typeof waitingList)[0]) => {
    setWaitingList((prev) =>
      prev.map((w) => (w.id === waitItem.id ? { ...w, called: true } : w))
    );
    const newCalItem: CalendarSlotItem = {
      id: `cal-fill-${Date.now()}`,
      dayCol: 2,
      chairId: 'CHAIR-2',
      time: '04:00 PM',
      patientNameEn: waitItem.nameEn,
      patientNameAr: waitItem.nameAr,
      procedureEn: 'Cleaning (Filled from Waiting List)',
      procedureAr: 'تنظيف جير (من قائمة الانتظار)',
      doctorId: 'dr-ahmed',
      doctorNameEn: 'Dr. Ahmed El-Sherif',
      doctorNameAr: 'د. أحمد الشريف',
      status: 'BOOKED',
    };
    setItems((prev) => [newCalItem, ...prev]);
    setRescheduleToast(
      c(
        `4:00 PM slot on Chair 2 filled immediately with ${waitItem.nameEn} from the waiting list!`,
        `تم ملء موعد الساعة 4:00 على كرسي 2 فوراً بالمريض ${waitItem.nameAr} من قائمة الانتظار!`
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          IMAGE 4: MULTI-COLUMN / MULTI-DAY COLOR-CODED DRAG & DROP CALENDAR
         ==================================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        {/* Top Calendar Controls Bar matching Image 4 (Scoped for Doctor vs Front Desk) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {!isDentist ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const newItem: CalendarSlotItem = {
                      id: `cal-${Date.now()}`,
                      dayCol: 4,
                      chairId: 'CHAIR-3',
                      time: '04:15 PM',
                      patientNameEn: 'Nourhan El-Sawy',
                      patientNameAr: 'نورهان الصاوي',
                      procedureEn: 'Cosmetic Veneer',
                      procedureAr: 'فينير تجميلي',
                      doctorId: 'dr-sara',
                      doctorNameEn: 'Dr. Feby Samer',
                      doctorNameAr: 'د. فيبي سامر',
                      status: 'BOOKED',
                    };
                    setItems([newItem, ...items]);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{c('New Appointment', 'موعد جديد')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddWaitModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c('Waiting List', 'قائمة الانتظار')}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black">
                    {waitingList.length}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenDoctorRequestModal()}
                className="px-4 py-2 rounded-xl bg-[#0B2528] hover:bg-[#153D42] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <BellRing className="w-4 h-4 text-[#C8A96E]" />
                <span>
                  {c(
                    'Request Change / Notify Reception',
                    'طلب تعديل الجدول / إبلاغ الاستقبال'
                  )}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveWeekTab(2)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold"
            >
              {c('Today', 'اليوم')}
            </button>

            {/* View Switcher: Week / Chair Columns / Month */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {c('Weekly', 'أسبوعي')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('chairs')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'chairs' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {c('Chair Columns', 'أعمدة الكراسي')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {c('Monthly', 'شهري')}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs tabular-nums">
              {filteredItems.length}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>
                {isDentist
                  ? c(
                      `My Clinical Schedule — ${loggedInDoctorNameEn}`,
                      `جدول مواعيدي — ${loggedInDoctorNameAr}`
                    )
                  : c('Calendar', 'التقويم')}
              </span>
            </h2>
          </div>
        </div>

        {/* Week Range Selector Tabs matching Image 4 */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/70 text-xs font-bold">
          {[
            c('Oct 3–9', '3-9 أكتوبر'),
            c('Sep 26–Oct 2', '26-26 سبتمبر'),
            c('Sep 12–18', '18-12 سبتمبر'),
            c('Sep 19–25', '25-19 سبتمبر'),
            c('Sep 5–11', '11-5 سبتمبر'),
            c('Aug 29–Sep 4', '4-29 سبتمبر'),
          ].map((wk, idx) => (
            <button
              key={wk}
              type="button"
              onClick={() => setActiveWeekTab(idx)}
              className={`py-2 px-3 rounded-xl text-center transition-all ${
                activeWeekTab === idx
                  ? 'bg-blue-100/90 text-blue-800 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:bg-white'
              }`}
            >
              {wk}
            </button>
          ))}
        </div>

        {/* Doctor Filter Pills & Drag-and-Drop Hint (Hidden for Dentist — Dentist views own schedule only) */}
        {!isDentist ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-semibold">
              {c(
                '💡 Drag any appointment card and drop it into a new day or chair column to reschedule in 1 second (with automatic clash prevention).',
                '💡 اسحب أي موعد وأفلته في يوم أو كرسي آخر لنقله في ثانية واحدة (مع منع التعارض التلقائي).'
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {doctors.map((doc) => {
                const active = selectedDoctor === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doc.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? doc.labelAr : doc.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs">
            <span className="font-bold text-slate-700">
              {c(
                `Showing only ${loggedInDoctorNameEn}'s personal schedule at Minya – Branch A (${filteredItems.length} scheduled visits).`,
                `يعرض فقط جدول مواعيد ${loggedInDoctorNameAr} في المنيا – الفرع أ (${filteredItems.length} مواعيد مجدولة).`
              )}
            </span>
            <span className="text-slate-500 font-semibold">
              {c(
                'View-Only Schedule: Use "Request Change" on any visit to notify Reception (Mariam Hanna).',
                'جدول للعرض فقط: اضغط "طلب تعديل" لإبلاغ موظفة الاستقبال (مريم حنا).'
              )}
            </span>
          </div>
        )}

        {/* Live Doctor Schedule Change Requests Banner for Receptionist / Owner */}
        {!isDentist && scheduleRequests.filter((r) => r.status === 'PENDING').length > 0 && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                <BellRing className="w-4 h-4 text-amber-600" />
                <span>
                  {c(
                    `Live Doctor Schedule Change Requests (${
                      scheduleRequests.filter((r) => r.status === 'PENDING').length
                    })`,
                    `طلبات تعديل الجدول الواردة من الأطباء (${
                      scheduleRequests.filter((r) => r.status === 'PENDING').length
                    })`
                  )}
                </span>
              </div>
              <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                {c('Action Required by Reception', 'مطلوب تنفيذ الاستقبال')}
              </span>
            </div>
            <div className="space-y-2">
              {scheduleRequests
                .filter((r) => r.status === 'PENDING')
                .map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-900">
                        {req.doctorNameEn} → {req.reason} · {req.patientNameEn} ({req.currentSlot})
                      </div>
                      <div className="text-slate-600">{req.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceptionCompleteDoctorRequest(req.id)}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-extrabold text-white hover:bg-emerald-700"
                    >
                      {c('Execute & Confirm with Patient ✓', 'تنفيذ التعديل وإبلاغ المريض ✓')}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Clash Prevention Alert or Reschedule Toast */}
        {clashAlert && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-extrabold flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{clashAlert}</span>
            </span>
            <button type="button" onClick={() => setClashAlert(null)}>
              ✕
            </button>
          </div>
        )}

        {rescheduleToast && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rescheduleToast}</span>
            </span>
            <button type="button" onClick={() => setRescheduleToast(null)}>
              ✕
            </button>
          </div>
        )}

        {/* VIEW 1: 7-COLUMN WEEKLY COLOR-CODED GRID (Exact match to Image 4) */}
        {viewMode !== 'chairs' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[980px] grid grid-cols-7 border border-slate-200 rounded-2xl overflow-hidden divide-x rtl:divide-x-reverse divide-slate-200">
              {weekDays.map((wd) => {
                const colAppts = filteredItems.filter((i) => i.dayCol === wd.col);
                return (
                  <div
                    key={wd.col}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnDay(wd.col)}
                    className="flex flex-col bg-white min-h-[440px]"
                  >
                    {/* Column Day Header */}
                    <div className="p-3 text-center border-b border-slate-100 bg-slate-50/70">
                      <span className="text-xs font-bold text-slate-600 block">
                        {isAr ? wd.dayAr : wd.dayEn}
                      </span>
                      <strong className="text-lg font-black text-slate-900 tabular-nums block">
                        {wd.num}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">
                        {isAr ? wd.subAr : wd.subEn}
                      </span>
                    </div>

                    {/* Appointment Cards (Draggable for Receptionist/Owner; View-Only + Request Change for Doctor) */}
                    <div className="p-2 space-y-2 flex-1">
                      {colAppts.map((appt) => {
                        const isGreen =
                          appt.status === 'COMPLETED' || appt.status === 'ARRIVED';
                        return (
                          <div
                            key={appt.id}
                            draggable={!isDentist}
                            onDragStart={() => !isDentist && setDraggedId(appt.id)}
                            className={`p-2.5 rounded-xl border text-[11px] ${
                              isDentist ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                            } transition-transform hover:-translate-y-0.5 shadow-2xs ${
                              isGreen
                                ? 'bg-[#D1FAE5]/90 border-[#6EE7B7] text-[#065F46]'
                                : 'bg-[#EDE9FE]/90 border-[#C4B5FD] text-[#4C1D95]'
                            }`}
                          >
                            <div className="flex items-center justify-between font-extrabold mb-1">
                              <span>
                                •{' '}
                                {appt.status === 'COMPLETED'
                                  ? c('Completed', 'مكتمل')
                                  : appt.status === 'ARRIVED'
                                  ? c('Arrived', 'حضر')
                                  : c('Booked', 'محجوز')}
                              </span>
                              <span className="font-mono text-[10px]">{appt.time}</span>
                            </div>
                            <strong className="block truncate font-extrabold text-xs">
                              {isAr ? appt.patientNameAr : appt.patientNameEn} -{' '}
                              {isAr ? appt.procedureAr : appt.procedureEn}
                            </strong>
                            <span className="block text-[10px] opacity-75 mt-0.5 truncate">
                              {appt.chairId} · {isAr ? appt.doctorNameAr : appt.doctorNameEn}
                            </span>
                            {isDentist && (
                              <button
                                type="button"
                                onClick={() => handleOpenDoctorRequestModal(appt)}
                                className="mt-2 w-full rounded-lg bg-white/90 hover:bg-white px-2 py-1 text-[10px] font-black text-slate-900 border border-slate-300/80 shadow-2xs transition"
                              >
                                {c('Request Change → Reception', 'طلب تعديل ← الاستقبال')}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 2: CHAIR COLUMN VIEW ("Every chair is a column and every dentist a color") */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chairs.map((ch) => {
              const chairAppts = filteredItems.filter((i) => i.chairId === ch.id);
              return (
                <div
                  key={ch.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnChair(ch.id)}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 min-h-[340px]"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <strong className="text-sm font-extrabold text-slate-900">
                      {isAr ? ch.labelAr : ch.labelEn}
                    </strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                      {chairAppts.length} {c('slots', 'مواعيد')}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {chairAppts.map((appt) => {
                      const docColor =
                        appt.doctorId === 'dr-ahmed'
                          ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                          : appt.doctorId === 'dr-sara'
                          ? 'bg-purple-100/90 border-purple-300 text-purple-950'
                          : 'bg-sky-100/90 border-sky-300 text-sky-950';
                      return (
                        <div
                          key={appt.id}
                          draggable
                          onDragStart={() => setDraggedId(appt.id)}
                          className={`p-3 rounded-xl border text-xs cursor-grab ${docColor}`}
                        >
                          <div className="flex items-center justify-between font-extrabold">
                            <span>{appt.time}</span>
                            <span>{isAr ? appt.doctorNameAr : appt.doctorNameEn}</span>
                          </div>
                          <strong className="block text-sm font-black mt-1">
                            {isAr ? appt.patientNameAr : appt.patientNameEn}
                          </strong>
                          <span className="text-[11px] opacity-80">
                            {isAr ? appt.procedureAr : appt.procedureEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ====================================================================
          CANCELLATION WAITING LIST CARD (Exclusively for Front Desk / Owner — Removed from /doctor/appointments)
         ==================================================================== */}
      {!isDentist && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* IMAGE 6: WAITING LIST THAT FILLS CANCELLATIONS */}
        <section className="lg:col-span-12 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="text-lg font-extrabold text-slate-900">
              {c('Waiting list', 'قائمة الانتظار لملء الإلغاءات')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddWaitModal(true)}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold"
              >
                + {c('Add Patient', 'إضافة مريض')}
              </button>
              <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold">
                {waitingList.length + 1} {c('ready', 'جاهزون')}
              </span>
            </div>
          </div>

          {/* Amber Cancellation Alert Banner matching Image 6 */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs font-extrabold">
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-black shrink-0">
              !
            </span>
            <span>
              {c(
                '4:00 appointment on Chair 2 cancelled — whom do we call?',
                'تم إلغاء موعد الساعة 4:00 على كرسي 2 — بمن نتصل لملء الكرسي؟'
              )}
            </span>
          </div>

          {/* Waiting List Patients Rows matching Image 6 */}
          <div className="space-y-2.5">
            {waitingList.map((w, idx) => (
              <div
                key={w.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-full ${w.color} text-white font-extrabold text-sm flex items-center justify-center shrink-0`}
                  >
                    {w.initial}
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-slate-900 block">
                      {isAr ? w.nameAr : w.nameEn}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {isAr ? w.prefAr : w.prefEn}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFillCancelledSlot(w)}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                    w.called
                      ? 'bg-emerald-600 text-white'
                      : idx < 2
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {w.called ? c('Slot Filled ✓', 'تم الحجز ✓') : c('Call', 'اتصال')}
                </button>
              </div>
            ))}
          </div>

          {/* No-Show Follow-Up Strip */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              {c(
                'Whoever said “call me if something frees up” is recorded here — not in someone’s memory',
                'كل من طلب الاتصال به عند توفر موعد يُسجّل هنا — وليس في الذاكرة'
              )}
            </span>
            {noShows.map((ns) => (
              <span
                key={ns.id}
                className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold"
              >
                {c('No-Show Recall:', 'متابعة متغيب:')} {isAr ? ns.nameAr : ns.nameEn}
              </span>
            ))}
          </div>
        </section>
      </div>
      )}

      {/* Doctor -> Receptionist Schedule Change Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {c(
                    'Request Schedule Change (Notify Reception)',
                    'طلب تعديل جدول المواعيد (إبلاغ الاستقبال)'
                  )}
                </h4>
                <p className="text-xs text-slate-500">
                  {requestModalTarget
                    ? `${requestModalTarget.patientNameEn} · ${requestModalTarget.time} (${requestModalTarget.chairId})`
                    : c('General Schedule / Time Slot Request', 'طلب حجز أو إغلاق فترة زمنية')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {c('Reason for Schedule Request', 'سبب طلب التعديل')}
                </label>
                <select
                  value={requestReason}
                  onChange={(e) =>
                    setRequestReason(e.target.value as DoctorScheduleChangeRequest['reason'])
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold text-slate-800"
                >
                  <option value="Reschedule Visit">
                    {c('Reschedule Visit', 'إعادة جدولة زيارة المريض')}
                  </option>
                  <option value="Block Time Slot">
                    {c('Block Time Slot', 'إغلاق فترة زمنية بالجدول')}
                  </option>
                  <option value="Extend Procedure Time">
                    {c('Extend Procedure Time', 'تمديد وقت الجلسة العلاجية')}
                  </option>
                  <option value="Cancel / Patient Follow-up">
                    {c('Cancel / Patient Follow-up', 'إلغاء الموعد / متابعة مع المريض')}
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {c('Instructions for Front-Desk Receptionist', 'ملاحظات لموظفة الاستقبال')}
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder={c(
                    'Write instructions for Mariam Hanna (Reception)...',
                    'اكتب تفاصيل التعديل المطلوب لموظفة الاستقبال...'
                  )}
                  className="w-full rounded-xl border border-slate-200 p-3 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                {c('Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                onClick={handleSubmitDoctorScheduleRequest}
                className="rounded-xl bg-[#0B2528] hover:bg-[#153D42] px-5 py-2 text-xs font-extrabold text-white shadow-xs"
              >
                {c('Send Request to Reception', 'إرسال الطلب للاستقبال')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Waiting List Modal */}
      {showAddWaitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h4 className="text-base font-extrabold text-slate-900">
              {c('Add Patient to Cancellation Waiting List', 'إضافة مريض لقائمة الانتظار')}
            </h4>
            <label className="block text-xs font-bold text-slate-700">
              {c('Patient Name', 'اسم المريض')}
              <input
                type="text"
                value={newWaitName}
                onChange={(e) => setNewWaitName(e.target.value)}
                placeholder={c('e.g. Hany Mahmoud', 'مثال: هاني محمود')}
                className="field w-full mt-1"
              />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              {c('Preferred Time & Procedure', 'الوقت المفضل والإجراء')}
              <input
                type="text"
                value={newWaitPref}
                onChange={(e) => setNewWaitPref(e.target.value)}
                className="field w-full mt-1"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWaitModal(false)}
                className="secondary-button text-xs py-2 px-4"
              >
                {c('Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newWaitName.trim()) return;
                  setWaitingList([
                    ...waitingList,
                    {
                      id: `wl-${Date.now()}`,
                      initial: newWaitName.trim().charAt(0).toUpperCase(),
                      color: 'bg-blue-600',
                      nameEn: newWaitName.trim(),
                      nameAr: newWaitName.trim(),
                      prefEn: newWaitPref,
                      prefAr: newWaitPref,
                      called: false,
                    },
                  ]);
                  setNewWaitName('');
                  setShowAddWaitModal(false);
                }}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-extrabold"
              >
                {c('Save to Waiting List', 'حفظ في قائمة الانتظار')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
