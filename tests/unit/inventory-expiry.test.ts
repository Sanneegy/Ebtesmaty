import {describe,it,expect} from 'vitest';
import {isStockLotExpired} from '@/lib/inventory-stock';
describe('Inventory expiry calendar dates',()=>{
 it('keeps a batch usable throughout its Cairo expiry day',()=>{
  expect(isStockLotExpired('2026-11-02T00:00:00Z',new Date('2026-11-02T15:00:00Z'))).toBe(false);
  expect(isStockLotExpired('2026-11-02T00:00:00Z',new Date('2026-11-02T21:59:59Z'))).toBe(false);
 });
 it('expires the batch at Cairo midnight on the following day',()=>{
  expect(isStockLotExpired('2026-11-02T00:00:00Z',new Date('2026-11-02T22:00:00Z'))).toBe(true);
 });
 it('excludes invalid and earlier expiry dates',()=>{
  expect(isStockLotExpired('invalid',new Date('2026-11-02T12:00:00Z'))).toBe(true);
  expect(isStockLotExpired('2026-11-01',new Date('2026-11-02T12:00:00Z'))).toBe(true);
 });
});
