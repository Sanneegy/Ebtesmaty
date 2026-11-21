import {describe,it,expect} from 'vitest';
import {cairoInstant,cairoDate,dateOnly,overlaps,orderVisits} from '@/lib/scheduling-rules';
import {messages} from '@/lib/messages';
import {hasRole,branchScope} from '@/lib/rbac';
describe('Booking and queue safeguards',()=>{
it('uses Cairo winter and summer offsets',()=>{expect(cairoInstant('2026-11-01','10:00').toISOString()).toBe('2026-11-01T08:00:00.000Z');expect(cairoInstant('2026-07-01','10:00').toISOString()).toBe('2026-07-01T07:00:00.000Z');expect(cairoDate(new Date('2026-11-01T23:00:00Z'))).toBe('2026-11-02')});
it('rejects impossible dates',()=>{expect(()=>dateOnly('2026-02-30')).toThrow()});
it('detects all overlap shapes and allows adjacent visits',()=>{const a={startTime:'10:00',endTime:'11:00'};expect(overlaps('09:30','10:15',a)).toBe(true);expect(overlaps('10:15','10:30',a)).toBe(true);expect(overlaps('09:30','11:30',a)).toBe(true);expect(overlaps('11:00','11:45',a)).toBe(false)});
it('does not let early arrival jump an earlier appointment',()=>{const entries=[{id:'early',status:'WAITING',enteredAt:'2026-11-01T07:00:00Z',appointment:{appointmentDate:'2026-11-01',startTime:'11:00'}},{id:'due',status:'WAITING',enteredAt:'2026-11-01T07:55:00Z',appointment:{appointmentDate:'2026-11-01',startTime:'10:00'}}];expect(orderVisits(entries,{earlyArrivalMinutes:0},new Date('2026-11-01T08:00:00Z')).map(e=>e.id)).toEqual(['due','early'])});
it('uses arrival time for equal slots and honors clinical priority',()=>{const entries=[{id:'later',status:'WAITING',enteredAt:'2026-11-01T08:02:00Z',clinicalPriority:false,appointment:{appointmentDate:'2026-11-01',startTime:'10:00'}},{id:'first',status:'WAITING',enteredAt:'2026-11-01T08:00:00Z',clinicalPriority:false,appointment:{appointmentDate:'2026-11-01',startTime:'10:00'}}];expect(orderVisits(entries,{earlyArrivalMinutes:0},new Date('2026-11-01T09:00:00Z'))[0].id).toBe('first');entries[0].clinicalPriority=true;expect(orderVisits(entries,{earlyArrivalMinutes:0},new Date('2026-11-01T09:00:00Z'))[0].id).toBe('later')});
it('limits branch grants and keeps patient roles out of finance',()=>{const user={id:'u',roleGrants:[{role:'FINANCE' as const,branchId:'A'},{role:'PATIENT' as const,branchId:null}]};expect(hasRole(user,['FINANCE'],'B')).toBe(false);expect(branchScope(user,['FINANCE'])).toEqual({in:['A']});expect(()=>branchScope(user,['RECEPTIONIST'])).toThrow()});
it('has matching translated keys for the new workflow catalog',()=>{expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort())});
});
