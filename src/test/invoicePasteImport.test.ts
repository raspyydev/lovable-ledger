import { describe, expect, it } from 'vitest';
import { isPaidStatus } from '@/lib/invoicePasteImport';

describe('invoicePasteImport', () => {
  it('detects paid status', () => {
    expect(isPaidStatus('Bezahlt')).toBe(true);
    expect(isPaidStatus('paid')).toBe(true);
    expect(isPaidStatus('offen')).toBe(false);
  });
});
