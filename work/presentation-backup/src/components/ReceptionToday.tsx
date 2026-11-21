'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { message, localDate, MessageKey } from '@/lib/messages';
import { ReceptionBooking } from './ReceptionBooking';
export function ReceptionToday({ branches, appointments, requests }: {
    branches: any[];
    appointments: any[];
    requests: any[];
}) {
    const { locale } = useLanguage();
    const t = (k: MessageKey) => message(locale, k);
    const router = useRouter();
    const [booking, setBooking] = useState(false), [queue, setQueue] = useState<any[]>([]), [notice, setNotice] = useState(''), [busy, setBusy] = useState(''), [lateReasons, setLateReasons] = useState<Record<string, string>>({});
    const refresh = () => { fetch('/api/scheduling/queue').then(async (r) => { const d = await r.json(); if (!r.ok)
        throw new Error(d.error); setQueue(d.queue || []); }).catch(e => setNotice(e.message)); router.refresh(); };
    useEffect(() => { refresh(); const timer = setInterval(refresh, 30000); return () => clearInterval(timer); }, []);
    async function action(id: string, path: string, body: unknown) { setBusy(id); setNotice(''); try {
        const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await res.json();
        if (!res.ok)
            throw new Error(d.error);
        setNotice(t('saved'));
        refresh();
    }
    catch (e: any) {
        setNotice(e.message);
    }
    finally {
        setBusy('');
    } }
    const active = queue.filter(q => ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(q.status));
    return <div className="max-w-7xl mx-auto px-4 py-8 space-y-6"><header className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">{t('today')}</h1><p className="text-slate-600 mt-1">{localDate(new Date(), locale, { dateStyle: 'full' })}</p></div><div className="flex gap-3"><button onClick={refresh} className="secondary-button">{t('refresh')}</button><button className="primary-button" onClick={() => setBooking(!booking)}>{t('newBooking')}</button></div></header>{notice && <p role="status" className="p-4 bg-white border rounded-xl">{notice}</p>}{booking && <ReceptionBooking branches={branches} onClose={() => setBooking(false)} onSaved={() => { setBooking(false); setNotice(t('booked')); refresh(); }}/>}
 <section className="surface-card"><h2>{t('appointments')} <span className="text-slate-500">({appointments.length})</span></h2><div className="overflow-x-auto"><table className="workflow-table"><thead><tr><th>{t('time')}</th><th>{t('patient')}</th><th>{t('dentist')}</th><th>{t('state')}</th><th>{t('action')}</th></tr></thead><tbody>{appointments.map(a => { const visit = queue.find(q => q.appointmentId === a.id); return <tr key={a.id}><td><bdi>{a.startTime}</bdi></td><td>{a.patient?.fullName}</td><td>{a.dentistUser?.fullName}</td><td>{t((visit?.status || a.status) as MessageKey) || a.status}</td><td>{!visit && a.status === 'CONFIRMED' ? <div><input aria-label={t('lateReason')} placeholder={t('lateReason')} className="field mb-2" maxLength={300} value={lateReasons[a.id] || ''} onChange={e => setLateReasons({ ...lateReasons, [a.id]: e.target.value })}/><button className="primary-button" disabled={!!busy} onClick={() => action(a.id, '/api/scheduling/arrivals', { patientId: a.patientId, branchId: a.branchId, appointmentId: a.id, lateReason: lateReasons[a.id] })}>{t('checkIn')}</button></div> : <span>—</span>}</td></tr>; })}</tbody></table></div>{!appointments.length && <p>{t('noAppointments')}</p>}</section>
 <section className="surface-card"><h2>{t('waiting')} ({active.length})</h2><p className="text-sm text-slate-600">{t('policyHelp')}</p><div className="overflow-x-auto"><table className="workflow-table"><thead><tr><th>#</th><th>{t('patient')}</th><th>{t('time')}</th><th>{t('dentist')}</th><th>{t('arrival')}</th><th>{t('minutesWaiting')}</th><th>{t('state')}</th><th>{t('action')}</th></tr></thead><tbody>{active.map((q, i) => <tr key={q.id}><td>{i + 1}</td><td>{q.patient?.fullName}{q.clinicalPriority && <span className="block text-red-800">{t('priority')}</span>}</td><td><bdi>{q.appointment?.startTime || '—'}</bdi></td><td>{q.appointment?.dentistUser?.fullName || '—'}</td><td>{localDate(q.enteredAt, locale, { timeStyle: 'short' })}</td><td>{Math.max(0, Math.floor((Date.now() - +new Date(q.enteredAt)) / 60000))}</td><td>{t(q.status)}</td><td>{q.status === 'WAITING' && <button className="secondary-button" disabled={!!busy} onClick={() => action(q.id, `/api/scheduling/queue/${q.id}/transition`, { action: 'CALL' })}>{t('callNext')}</button>}</td></tr>)}</tbody></table></div>{!active.length && <p>{t('noWaiting')}</p>}</section>
 <section className="surface-card"><h2>{t('requests')} ({requests.length})</h2>{requests.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4 border-b"><div><strong>{r.patient?.fullName}</strong><p>{localDate(r.preferredDate, locale)} · <bdi>{r.selectedStartTime || '—'}</bdi> · {r.serviceName}</p></div>{r.selectedStartTime ? <button className="primary-button" disabled={!!busy} onClick={() => action(r.id, `/api/scheduling/requests/${r.id}/review`, { action: 'CONFIRM' })}>{t('confirm')}</button> : <a href="/reception/agenda" className="secondary-button">{t('appointments')}</a>}</div>)}{!requests.length && <p>{t('noRequests')}</p>}</section></div>;
}
