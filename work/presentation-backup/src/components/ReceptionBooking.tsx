'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { message } from '@/lib/messages';
import { cairoDate } from '@/lib/scheduling-rules';
import { CLINIC_SERVICES, CLINIC_DENTISTS } from '@/config/clinic-catalog';
export function ReceptionBooking({ branches, onSaved, onClose }: {
    branches: any[];
    onSaved: () => void;
    onClose: () => void;
}) {
    const { locale } = useLanguage();
    const t = (key: Parameters<typeof message>[1]) => message(locale, key);
    const [newPatient, setNewPatient] = useState(false), [name, setName] = useState(''), [phone, setPhone] = useState(''), [dob, setDob] = useState(''), [query, setQuery] = useState(''), [patients, setPatients] = useState<any[]>([]), [patient, setPatient] = useState<any>(null), [branch, setBranch] = useState(branches[0]?.code || ''), [service, setService] = useState('unsure'), [dentist, setDentist] = useState('ANY'), [day, setDay] = useState(cairoDate()), [time, setTime] = useState(''), [source, setSource] = useState('RECEPTION_PHONE'), [slots, setSlots] = useState<any[]>([]), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
    useEffect(() => { let active = true; const timer = setTimeout(() => { if (query.length < 2) {
        setPatients([]);
        return;
    } fetch('/api/patients/search?q=' + encodeURIComponent(query)).then(r => r.json()).then(d => { if (active)
        setPatients(d.results || []); }).catch(() => { if (active)
        setError(t('error')); }); }, 250); return () => { active = false; clearTimeout(timer); }; }, [query]);
    useEffect(() => { let active = true; setTime(''); setSlots([]); setLoading(true); fetch(`/api/scheduling/availability?branchCode=${encodeURIComponent(branch)}&date=${day}&dentistEmail=${encodeURIComponent(dentist)}&service=${service}`).then(async (r) => { const d = await r.json(); if (!r.ok)
        throw new Error(d.error); if (active)
        setSlots(d.slots || []); }).catch(e => { if (active)
        setError(e.message); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [branch, day, dentist, service]);
    async function submit(e: React.FormEvent) { e.preventDefault(); if (!patient && !newPatient) {
        setError(t('selectPatient'));
        return;
    } setBusy(true); setError(''); try {
        const res = await fetch('/api/scheduling/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: newPatient ? undefined : patient.id, fullName: newPatient ? name : undefined, phone: newPatient ? phone : undefined, dateOfBirth: newPatient ? dob : undefined, branchCode: branch, serviceSlug: service, serviceName: service === 'unsure' ? 'Consultation' : undefined, dentistEmail: dentist, preferredDate: day, selectedSlotTime: time, source, confirm: true }) });
        const d = await res.json();
        if (!res.ok)
            throw new Error(d.error);
        onSaved();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <section className="rounded-2xl border bg-white p-6 space-y-5" aria-label={t('newBooking')}><div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">{t('newBooking')}</h2><button onClick={onClose}>{t('close')}</button></div><form onSubmit={submit} className="space-y-4"><label className="flex gap-2"><input type="checkbox" checked={newPatient} onChange={e => setNewPatient(e.target.checked)}/>{locale === 'ar' ? 'تسجيل مريض جديد' : 'Register a new patient'}</label>{newPatient ? <div className="grid sm:grid-cols-3 gap-3"><label>{locale === 'ar' ? 'الاسم الكامل' : 'Full name'}<input className="field" value={name} onChange={e => setName(e.target.value)} required minLength={3}/></label><label>{locale === 'ar' ? 'رقم الهاتف' : 'Phone number'}<input className="field" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required minLength={8}/></label><label>{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}<input className="field" type="date" value={dob} onChange={e => setDob(e.target.value)} max={cairoDate()} required/></label></div> : <label className="block">{t('findPatient')}<input className="field" placeholder={t('search')} value={query} onChange={e => { setQuery(e.target.value); setPatient(null); }}/></label>}{!newPatient && (patient ? <p className="p-3 bg-[#E3F0EB] rounded-xl">{patient.fullName} · {patient.patientNumber}</p> : <ul>{patients.map(p => <li key={p.id}><button type="button" className="p-3 text-start w-full hover:bg-[#E3F0EB]" onClick={() => { setPatient(p); setPatients([]); }}>{p.fullName} · <bdi>{p.primaryPhone}</bdi> · {p.patientNumber}</button></li>)}</ul>)}
 <div className="grid sm:grid-cols-2 gap-4"><label>{t('branch')}<select className="field" value={branch} onChange={e => { setBranch(e.target.value); setDentist('ANY'); }}>{branches.map(b => <option value={b.code} key={b.id}>{b.name}</option>)}</select></label><label>{t('source')}<select className="field" value={source} onChange={e => setSource(e.target.value)}>{[['RECEPTION_PHONE', 'phone'], ['WHATSAPP', 'whatsapp'], ['WALK_IN', 'walkIn'], ['OTHER', 'other']].map(([v, k]) => <option key={v} value={v}>{t(k as 'phone')}</option>)}</select></label><label>{t('service')}<select className="field" value={service} onChange={e => setService(e.target.value)}><option value="unsure">{t('unsure')}</option>{CLINIC_SERVICES.map(s => <option key={s.slug} value={s.slug}>{locale === 'ar' ? s.nameAr : s.nameEn}</option>)}</select></label><label>{t('dentist')}<select className="field" value={dentist} onChange={e => setDentist(e.target.value)}><option value="ANY">{t('anyDentist')}</option>{CLINIC_DENTISTS.filter(d => d.branchCode === branch).map(d => <option value={d.email} key={d.id}>{locale === 'ar' ? d.nameAr : d.nameEn}</option>)}</select></label><label>{t('date')}<input className="field" type="date" value={day} min={cairoDate()} onChange={e => setDay(e.target.value)} required/></label><label>{t('chooseTime')}<select className="field" value={time} onChange={e => setTime(e.target.value)} required disabled={loading}><option value="">{loading ? t('checking') : t('chooseTime')}</option>{slots.map(s => <option value={s.time} key={s.time}>{s.time}</option>)}</select></label></div>{!loading && !slots.length && <p>{t('noSlots')}</p>}{error && <p role="alert" className="text-red-800">{error}</p>}<button className="primary-button" disabled={busy || loading || !time || (!patient && !newPatient)}>{busy ? t('checking') : t('confirm')}</button></form></section>;
}
