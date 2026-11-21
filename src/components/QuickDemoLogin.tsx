'use client';
import { useState } from 'react';
import { UserRound, ClipboardList, Stethoscope, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const main = [
  ['hassan.patient@ebtesamty.dev', '1. Patient (Passant)', '١. المريضة (بسنت)', UserRound, 'bg-emerald-50 text-emerald-900 border border-emerald-200'],
  ['mariam.reception@ebtesamty.dev', '2. Receptionist (Mariam)', '٢. الاستقبال (مريم)', ClipboardList, 'bg-blue-50 text-blue-900 border border-blue-200'],
  ['dr.sandy@ebtesamty.dev', '3. Dentist (Dr. Sandy)', '٣. طبيبة الأسنان (د. ساندي)', Stethoscope, 'bg-teal-50 text-teal-900 border border-teal-200'],
  ['admin@ebtesamty.dev', '4. Owner / Executive (Abram)', '٤. المالك / الإدارة (أبرام)', Building2, 'bg-violet-50 text-violet-900 border border-violet-200'],
] as const;

export function QuickDemoLogin() {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const [busy, setBusy] = useState('');

  return (
    <section aria-label={ar ? 'الدخول التجريبي السريع (٤ لوحات فقط)' : 'Four Role Dashboards Quick Login'} className="mt-7">
      <div className="flex items-center gap-3 mb-4 text-slate-500 text-sm">
        <span className="h-px bg-slate-100 flex-1" />
        <h2>{ar ? 'الدخول السريع للوحات الأربع المعتمدة' : '4 Role Dashboards Quick Access'}</h2>
        <span className="h-px bg-slate-100 flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {main.map(([email, en, arabic, Icon, color]) => (
          <form key={email} action="/api/auth/demo-switch" method="POST" onSubmit={() => setBusy(email)}>
            <input type="hidden" name="email" value={email} />
            <button
              disabled={!!busy}
              className={`w-full h-full min-h-12 px-3 py-2.5 rounded-xl text-start text-xs font-bold flex items-center gap-2 transition hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#4169E1] disabled:opacity-60 ${color}`}
            >
              {busy === email ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Icon size={16} className="shrink-0" />}
              <span>{ar ? arabic : en}</span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
