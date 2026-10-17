import { describe, expect, it } from 'vitest';
import type { Ausgabe, Einnahme } from '@/lib/types';
import {
  buildFinanzamtModel,
  buildFinanzamtPdf,
  formatDateDe,
  formatEur,
  formatPercent,
  sortForFinanzamt,
} from '@/lib/finanzamtExport';

function income(partial: Partial<Einnahme> & Pick<Einnahme, 'datum' | 'belegnr' | 'brutto'>): Einnahme {
  return {
    id: partial.id ?? partial.belegnr,
    invoiceId: '',
    kundeName: '',
    kundeEmail: '',
    beschreibung: '',
    kategorie: 'Sonstiges',
    zahlungsart: 'Stripe',
    ...partial,
  };
}

function expense(partial: Partial<Ausgabe> & Pick<Ausgabe, 'datum' | 'belegnr' | 'netto' | 'brutto'>): Ausgabe {
  return {
    id: partial.id ?? partial.belegnr,
    ausgaben: '',
    beschreibung: '',
    kategorie: 'Software',
    ustProzent: 19,
    ustBetrag: 0,
    zahlungsart: 'PayPal',
    ...partial,
  };
}

const baseInput = {
  totalEinnahmen: 150,
  totalAusgabenBrutto: 119,
  totalAusgabenNetto: 100,
  gewinn: 31,
  steuerRuecklage: 10.85,
  verfuegbarPrivat: 20.15,
  einkommensteuerRuecklageProzent: 35,
  accountEmail: 'studio@example.com',
  createdAt: new Date(2026, 9, 17),
};

describe('finanzamt export formatting', () => {
  it('formats euro amounts and german dates', () => {
    expect(formatEur(1234.5)).toBe('1.234,50 €');
    expect(formatEur(-10)).toBe('-10,00 €');
    expect(formatDateDe('2026-01-05')).toBe('05.01.2026');
    expect(formatDateDe(new Date(2026, 9, 17))).toBe('17.10.2026');
    expect(formatPercent(19)).toBe('19 %');
    expect(formatPercent(7.5)).toBe('7,5 %');
  });

  it('sorts receipts by date, then receipt number', () => {
    const sorted = sortForFinanzamt([
      income({ datum: '2026-02-01', belegnr: '002', brutto: 50 }),
      income({ datum: '2026-01-15', belegnr: '010', brutto: 80 }),
      income({ datum: '2026-01-15', belegnr: '003', brutto: 20 }),
    ]);
    expect(sorted.map((row) => row.belegnr)).toEqual(['003', '010', '002']);
  });
});

describe('finanzamt report model', () => {
  const einnahmen = [
    income({
      datum: '2026-02-02',
      belegnr: '002',
      brutto: 100,
      invoiceId: 'INV-9',
      kundeName: 'Ada Lovelace',
      kundeEmail: 'ada@example.com',
      beschreibung: 'Webdesign',
      kategorie: 'Webdesign',
    }),
    income({
      datum: '2026-01-10',
      belegnr: '001',
      brutto: 50,
      beschreibung: 'Beratung',
      kategorie: 'Beratung',
      zahlungsart: 'PayPal',
    }),
  ];
  const ausgaben = [
    expense({
      datum: '2026-01-20',
      belegnr: 'A-1',
      netto: 100,
      ustProzent: 19,
      ustBetrag: 19,
      brutto: 119,
      beschreibung: 'Lizenz',
      ausgaben: 'Figma',
      kategorie: 'Software',
    }),
  ];

  it('lists every income and expense field in chronological order', () => {
    const model = buildFinanzamtModel({ ...baseInput, einnahmen, ausgaben });

    expect(model.filename).toBe('Better-Studio_Finanzamt_2026-01-10_bis_2026-02-02.pdf');
    expect(model.periodLabel).toBe('10.01.2026 bis 02.02.2026');
    expect(model.createdAtLabel).toBe('17.10.2026');
    expect(model.accountEmail).toBe('studio@example.com');
    expect(model.einnahmen.map((row) => row[0])).toEqual(['001', '002']);
    expect(model.einnahmen[1][2]).toBe('Ada Lovelace\nada@example.com');
    expect(model.einnahmen[1][3]).toBe('INV-9');
    expect(model.einnahmen[1][7]).toBe('100,00 €');
    expect(model.einnahmenFoot?.[7]).toBe('150,00 €');
    expect(model.ausgaben[0][2]).toBe('Figma\nLizenz');
    expect(model.ausgaben[0][5]).toBe('100,00 €');
    expect(model.ausgaben[0][6]).toBe('19 %');
    expect(model.summary.find((row) => row.emphasize)?.value).toBe('31,00 €');
    expect(model.vat).toEqual([['19 %', '1', '100,00 €', '19,00 €', '119,00 €']]);
    expect(model.categoriesIncome.map((row) => row[0])).toEqual(['Beratung', 'Webdesign']);
    expect(model.paymentsExpense[0][0]).toBe('PayPal');
    expect(model.months).toHaveLength(13);
    expect(model.months[0]).toEqual(['2026', 'Januar', '50,00 €', '119,00 €', '-69,00 €']);
    expect(model.months[1][1]).toBe('Februar');
    expect(model.months[11][1]).toBe('Dezember');
    expect(model.months[12][1]).toBe('Summe 2026');
    expect(model.reserve[1].label).toContain('35 %');
    expect(model.reserve[2].value).toBe('20,15 €');
  });

  it('builds a multi-section pdf for an empty book', () => {
    const { doc, filename } = buildFinanzamtPdf({
      ...baseInput,
      einnahmen: [],
      ausgaben: [],
      totalEinnahmen: 0,
      totalAusgabenBrutto: 0,
      totalAusgabenNetto: 0,
      gewinn: 0,
      steuerRuecklage: 0,
      verfuegbarPrivat: 0,
      accountEmail: null,
    });
    expect(filename).toBe('Better-Studio_Finanzamt.pdf');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
    expect(raw).toContain('Aufstellung der Betriebseinnahmen');
    expect(raw).toContain('Better Studio');
  });

  it('embeds income, expense and tax sections in the pdf', () => {
    const { doc } = buildFinanzamtPdf({ ...baseInput, einnahmen, ausgaben });
    const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
    expect(raw).toContain('Betriebseinnahmen');
    expect(raw).toContain('Betriebsausgaben');
    expect(raw).toContain('Ada Lovelace');
    expect(raw).toContain('Figma');
    expect(raw).toContain('150,00');
    expect(raw).toContain('M\u00e4rz');
    expect(raw).toContain(`150,00 ${String.fromCharCode(128)}`);
    expect(raw).toContain('interne Steuer');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
