import { describe, it, expect } from 'vitest';
import { parseInvoicePaste, isPaidStatus, splitInvoiceChunks } from '@/lib/invoicePasteImport';

const SAMPLE = `INV-1000000000001-TESTAAA01
buyer.one@example.com

Test Kunde Eins

23.03.2026

€29.99

Bezahlt


INV-1000000000002-TESTBBB02
buyer.two@example.net

Test Kunde Zwei

21.03.2026

€75.00

Bezahlt`;

describe('invoicePasteImport', () => {
  it('splits two invoice chunks', () => {
    const chunks = splitInvoiceChunks(SAMPLE);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain('INV-1000000000001');
    expect(chunks[1]).toContain('INV-1000000000002');
  });

  const SAMPLE_WITH_PRODUCT = `INV-1000000000001-TESTAAA01
PC Optimierung
buyer.one@example.com

Test Kunde Eins

23.03.2026

€29.99

Bezahlt`;

  it('parses two blocks without product lines before e-mail', () => {
    const { ok, errors } = parseInvoicePaste(SAMPLE);
    expect(errors).toHaveLength(0);
    expect(ok).toHaveLength(2);
    expect(ok[0]).toMatchObject({
      invoiceId: 'INV-1000000000001-TESTAAA01',
      leistung: '',
      email: 'buyer.one@example.com',
      name: 'Test Kunde Eins',
      datumIso: '2026-03-23',
      brutto: 29.99,
    });
    expect(ok[1]).toMatchObject({
      invoiceId: 'INV-1000000000002-TESTBBB02',
      brutto: 75,
      datumIso: '2026-03-21',
    });
  });

  it('parses product lines before e-mail (website export)', () => {
    const { ok, errors } = parseInvoicePaste(SAMPLE_WITH_PRODUCT);
    expect(errors).toHaveLength(0);
    expect(ok[0]).toMatchObject({
      leistung: 'PC Optimierung',
      email: 'buyer.one@example.com',
      name: 'Test Kunde Eins',
      brutto: 29.99,
    });
  });

  it('parses multiple product lines before e-mail', () => {
    const raw = `INV-1000000000003-TESTCCC03
Leistung Alpha
Leistung Beta
buyer.three@example.org

Test Kunde Drei

20.03.2026

€44.98

Bezahlt`;
    const { ok, errors } = parseInvoicePaste(raw);
    expect(errors).toHaveLength(0);
    expect(ok[0]).toMatchObject({
      leistung: 'Leistung Alpha · Leistung Beta',
      email: 'buyer.three@example.org',
      name: 'Test Kunde Drei',
      brutto: 44.98,
      datumIso: '2026-03-20',
    });
  });

  it('detects Bezahlt', () => {
    expect(isPaidStatus('Bezahlt')).toBe(true);
    expect(isPaidStatus('paid')).toBe(true);
    expect(isPaidStatus('Offen')).toBe(false);
  });

  it('parses date with comma and time (website copy)', () => {
    const raw = `INV-1774988740011-O9IBC7TRC
Optimizer Pro
babynick08@web.de

Sintryx

31.03.2026, 22:25

€23.83

Bezahlt`;
    const { ok, errors } = parseInvoicePaste(raw);
    expect(errors).toHaveLength(0);
    expect(ok).toHaveLength(1);
    expect(ok[0]).toMatchObject({
      invoiceId: 'INV-1774988740011-O9IBC7TRC',
      leistung: 'Optimizer Pro',
      email: 'babynick08@web.de',
      name: 'Sintryx',
      datumIso: '2026-03-31',
      brutto: 23.83,
    });
  });
});
