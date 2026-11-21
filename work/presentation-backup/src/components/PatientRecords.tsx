'use client';
import { useLanguage } from '@/context/LanguageContext';
import { message, MessageKey, money } from '@/lib/messages';
export function PatientRecords({ plans }: {
    plans: any[];
}) { const { locale } = useLanguage(); const t = (k: MessageKey) => message(locale, k); return <main className="max-w-5xl mx-auto p-6 space-y-6"><h1 className="text-3xl font-semibold">{t('records')}</h1><p>{t('originalNotes')}</p>{!plans.length && <p className="surface-card">{t('noRecords')}</p>}{plans.map(p => <section className="surface-card" key={p.id}><h2>{p.title}</h2><ul className="divide-y">{p.items.map((item: any) => <li className="py-4 flex justify-between gap-4" key={item.id}><span>{item.procedureName}</span><span className="tabular-nums">{money(item.estimatedCostPiasters, locale)}</span></li>)}</ul></section>)}</main>; }
