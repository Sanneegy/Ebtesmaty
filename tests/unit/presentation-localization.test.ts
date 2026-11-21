import {describe,it,expect} from 'vitest';
import {translateCopy} from '@/lib/translate-copy';
import {presentationAccounts} from '@/lib/presentation';
import {cairoDate,dateOnly} from '@/lib/scheduling-rules';
describe('Presentation and bilingual interface regressions',()=>{
 it('translates the reported billing, intake and review labels',()=>{for(const text of ['Patient Billing & Receipts','Dental Anxiety or Fear Level','PENDING_REVIEW','Financial Records & Payment Plans'])expect(translateCopy(text,'ar')).toMatch(/[\u0600-\u06ff]/);});
 it('handles JSX entity decoding in Arabic and English',()=>{expect(translateCopy('LEADERSHIP & EXECUTIVE MANAGEMENT','ar')).toMatch(/[\u0600-\u06ff]/);expect(translateCopy('Patient Feedback &amp; Support','en')).toBe('Patient Feedback & Support');});
 it('preserves patient-entered text and presentation names',()=>{expect(translateCopy('Passant','ar')).toBe('Passant');expect(translateCopy('Patient supplied note not in interface catalog','ar')).toBe('Patient supplied note not in interface catalog');expect(presentationAccounts.find(a=>a.email==='admin@ebtesamty.dev')?.name).toBe('Abram');});
 it('keeps Cairo midnight on the correct calendar date',()=>{expect(dateOnly(cairoDate(new Date('2026-11-01T22:30:00Z'))).toISOString()).toBe('2026-11-02T00:00:00.000Z');});
});
