import { describe, expect, it } from 'vitest';
import { getCairoDayBounds } from '../../src/lib/cairo-date';
import { getAuthorizedWorkspacesForRole } from '../../src/config/workspace-navigation';

describe('Role-specific navigation and Cairo clinic day', () => {
  it('shows reception only for the receptionist (no inventory or equipment)', () => {
    expect(getAuthorizedWorkspacesForRole('RECEPTIONIST').map((w) => w.id)).toEqual(['RECEPTIONIST']);
    const links = getAuthorizedWorkspacesForRole('RECEPTIONIST')[0].navItems.map(n => n.href);
    expect(links).not.toContain('/inventory');
    expect(links).not.toContain('/operations/equipment');
  });

  it('keeps dentist navigation clinical', () => {
    const ids = getAuthorizedWorkspacesForRole('DENTIST').map(w => w.id);
    expect(ids).toEqual(['DENTIST']);
  });

  it('uses the Cairo local day, not the application server day', () => {
    const { start, end, label } = getCairoDayBounds(new Date('2026-10-30T12:00:00Z'));
    expect(start.toISOString()).toBe('2026-10-29T22:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-30T22:00:00.000Z');
    expect(label).toContain('October 30, 2026');
  });

  it('handles daylight-saving time when deciding clinic day', () => {
    const summer = getCairoDayBounds(new Date('2026-07-15T12:00:00Z'));
    expect(summer.start.toISOString()).toBe('2026-07-14T21:00:00.000Z');
    expect(summer.end.toISOString()).toBe('2026-07-15T21:00:00.000Z');
  });
});
