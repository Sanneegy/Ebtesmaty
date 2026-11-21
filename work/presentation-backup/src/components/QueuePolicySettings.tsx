'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { message, MessageKey } from '@/lib/messages';
export function QueuePolicySettings({ branches }: {
    branches: {
        id: string;
        name: string;
    }[];
}) {
    const { locale } = useLanguage();
    const t = (k: MessageKey) => message(locale, k);
    const [branchId, setBranchId] = useState(branches[0]?.id || ''), [policy, setPolicy] = useState<any>(null), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
    useEffect(() => { let active = true; setPolicy(null); fetch(`/api/scheduling/policy?branchId=${encodeURIComponent(branchId)}`).then(async (r) => { const d = await r.json(); if (!r.ok)
        throw new Error(d.error); if (active)
        setPolicy(d); }).catch(e => { if (active)
        setNotice(e.message); }); return () => { active = false; }; }, [branchId]);
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        const r = await fetch('/api/scheduling/policy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...policy, branchId }) });
        const d = await r.json();
        if (!r.ok)
            throw new Error(d.error);
        setNotice(t('policySaved'));
    }
    catch (e: any) {
        setNotice(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <details className="surface-card"><summary className="text-xl font-semibold cursor-pointer">{t('queuePolicy')}</summary><p className="my-4">{t('policyHelp')}</p><label>{t('branch')}<select className="field" value={branchId} onChange={e => setBranchId(e.target.value)}>{branches.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}</select></label>{policy && <form onSubmit={save} className="grid sm:grid-cols-2 gap-4 mt-4">{[['earlyArrivalMinutes', 'earlyMinutes'], ['lateGraceMinutes', 'graceMinutes'], ['cancellationNoticeHours', 'noticeHours']].map(([key, label]) => <label key={key}>{t(label as MessageKey)}<input className="field" type="number" min="0" max={key === 'earlyArrivalMinutes' ? 120 : key === 'lateGraceMinutes' ? 180 : 168} value={policy[key] ?? ''} required={key !== 'lateGraceMinutes'} onChange={e => setPolicy({ ...policy, [key]: e.target.value === '' ? null : Number(e.target.value) })}/></label>)}<label>{t('lateAction')}<select className="field" value={policy.lateAction} onChange={e => setPolicy({ ...policy, lateAction: e.target.value })}><option value="STAFF_REVIEW">{t('staffReview')}</option><option value="RESCHEDULE">{t('reschedule')}</option></select></label><label className="flex gap-3 items-center"><input type="checkbox" checked={policy.walkInsEnabled} onChange={e => setPolicy({ ...policy, walkInsEnabled: e.target.checked })}/>{t('walkIns')}</label><button className="primary-button" disabled={busy}>{t('save')}</button></form>}{notice && <p role="status" className="mt-4">{notice}</p>}</details>;
}
