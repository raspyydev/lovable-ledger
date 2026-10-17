import { jsPDF } from 'jspdf';
import autoTable, { type RowInput, type UserOptions } from 'jspdf-autotable';
import { belegnrNumericKey, roundMoney } from '@/lib/bookkeepingSort';
import type { Ausgabe, Einnahme } from '@/lib/types';

const MONTHS_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const;

const INK: [number, number, number] = [23, 23, 23];
const MUTED: [number, number, number] = [90, 90, 90];
const LINE: [number, number, number] = [214, 214, 214];
const HEAD: [number, number, number] = [24, 24, 24];
const ZEBRA: [number, number, number] = [247, 247, 247];
const TOTAL_BG: [number, number, number] = [236, 236, 236];
const MARGIN = { top: 18, right: 14, bottom: 16, left: 14 };

export interface FinanzamtExportInput {
  einnahmen: Einnahme[];
  ausgaben: Ausgabe[];
  totalEinnahmen: number;
  totalAusgabenBrutto: number;
  totalAusgabenNetto: number;
  gewinn: number;
  steuerRuecklage: number;
  verfuegbarPrivat: number;
  einkommensteuerRuecklageProzent: number;
  accountEmail?: string | null;
  createdAt?: Date;
}

export interface FinanzamtModel {
  filename: string;
  createdAtLabel: string;
  periodLabel: string;
  accountEmail: string | null;
  summary: { label: string; value: string; emphasize?: boolean }[];
  einnahmen: string[][];
  einnahmenFoot: string[] | null;
  ausgaben: string[][];
  ausgabenFoot: string[] | null;
  vat: string[][];
  vatFoot: string[] | null;
  categoriesIncome: string[][];
  categoriesIncomeFoot: string[] | null;
  categoriesExpense: string[][];
  categoriesExpenseFoot: string[] | null;
  paymentsIncome: string[][];
  paymentsIncomeFoot: string[] | null;
  paymentsExpense: string[][];
  paymentsExpenseFoot: string[] | null;
  months: string[][];
  reserve: { label: string; value: string }[];
  incomeCount: number;
  expenseCount: number;
}

interface AmountRow {
  label: string;
  count: number;
  amount: number;
}

interface YearMonths {
  year: number;
  months: { einnahmen: number; ausgaben: number; saldo: number }[];
}

function dateKey(datum: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(datum) ? datum.slice(0, 10) : '9999-99-99';
}

/** German calendar date from an ISO date (`YYYY-MM-DD`) or a Date. */
export function formatDateDe(value: string | Date): string {
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${value.getFullYear()}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value.trim() || '-';
  return `${match[3]}.${match[2]}.${match[1]}`;
}

/** Euro amount with German grouping, e.g. `1.234,50 €`. */
export function formatEur(amount: number): string {
  const value = roundMoney(amount);
  const negative = value < 0;
  const [whole, frac] = Math.abs(value).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${frac} \u20AC`;
}

export function formatPercent(rate: number): string {
  const value = roundMoney(rate);
  const text = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${text} %`;
}

export function sortForFinanzamt<T extends { datum: string; belegnr: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const byDate = dateKey(a.datum).localeCompare(dateKey(b.datum));
    if (byDate !== 0) return byDate;
    const byNumber = belegnrNumericKey(a.belegnr) - belegnrNumericKey(b.belegnr);
    if (byNumber !== 0) return byNumber;
    return a.belegnr.localeCompare(b.belegnr, 'de');
  });
}

export function bookingPeriod(dates: string[]): { from: string | null; to: string | null } {
  const valid = dates.map(dateKey).filter((d) => d !== '9999-99-99').sort();
  if (valid.length === 0) return { from: null, to: null };
  return { from: valid[0], to: valid[valid.length - 1] };
}

export function finanzamtFilename(from: string | null, to: string | null): string {
  if (!from || !to) return 'Better-Studio_Finanzamt.pdf';
  if (from === to) return `Better-Studio_Finanzamt_${from}.pdf`;
  return `Better-Studio_Finanzamt_${from}_bis_${to}.pdf`;
}

export function sumByLabel(items: { label: string; amount: number }[]): AmountRow[] {
  const map = new Map<string, AmountRow>();
  for (const item of items) {
    const label = item.label.trim() || 'Ohne Angabe';
    const current = map.get(label) ?? { label, count: 0, amount: 0 };
    current.count += 1;
    current.amount = roundMoney(current.amount + item.amount);
    map.set(label, current);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

export function groupAusgabenByVat(ausgaben: Ausgabe[]): {
  rate: number;
  count: number;
  netto: number;
  ust: number;
  brutto: number;
}[] {
  const map = new Map<number, { rate: number; count: number; netto: number; ust: number; brutto: number }>();
  for (const row of ausgaben) {
    const rate = roundMoney(row.ustProzent);
    const current = map.get(rate) ?? { rate, count: 0, netto: 0, ust: 0, brutto: 0 };
    current.count += 1;
    current.netto = roundMoney(current.netto + row.netto);
    current.ust = roundMoney(current.ust + row.ustBetrag);
    current.brutto = roundMoney(current.brutto + row.brutto);
    map.set(rate, current);
  }
  return [...map.values()].sort((a, b) => a.rate - b.rate);
}

export function monthsByYear(einnahmen: Einnahme[], ausgaben: Ausgabe[]): YearMonths[] {
  const years = new Set<number>();
  for (const row of [...einnahmen, ...ausgaben]) {
    const key = dateKey(row.datum);
    if (key === '9999-99-99') continue;
    years.add(Number(key.slice(0, 4)));
  }

  return [...years].sort((a, b) => a - b).map((year) => {
    const prefix = String(year);
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      const stamp = `${prefix}-${month}`;
      const income = roundMoney(
        einnahmen.filter((row) => dateKey(row.datum).startsWith(stamp)).reduce((sum, row) => sum + row.brutto, 0),
      );
      const expense = roundMoney(
        ausgaben.filter((row) => dateKey(row.datum).startsWith(stamp)).reduce((sum, row) => sum + row.brutto, 0),
      );
      return { einnahmen: income, ausgaben: expense, saldo: roundMoney(income - expense) };
    });
    return { year, months };
  });
}

function textOrDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || '-';
}

function kundeCell(row: Einnahme): string {
  const name = row.kundeName.trim();
  const email = row.kundeEmail.trim();
  if (name && email) return `${name}\n${email}`;
  return name || email || '-';
}

function ausgabeText(row: Ausgabe): string {
  const title = row.ausgaben.trim();
  const description = row.beschreibung.trim();
  if (title && description && title !== description) return `${title}\n${description}`;
  return description || title || '-';
}

function amountRows(rows: AmountRow[]): string[][] {
  return rows.map((row) => [row.label, String(row.count), formatEur(row.amount)]);
}

function amountFoot(rows: AmountRow[], total: number): string[] | null {
  if (rows.length === 0) return null;
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  return ['Summe', String(count), formatEur(total)];
}

function totalUst(ausgaben: Ausgabe[]): number {
  return roundMoney(ausgaben.reduce((sum, row) => sum + row.ustBetrag, 0));
}

/** Structured bookkeeping report used by the PDF renderer. */
export function buildFinanzamtModel(input: FinanzamtExportInput): FinanzamtModel {
  const createdAt = input.createdAt ?? new Date();
  const income = sortForFinanzamt(input.einnahmen);
  const expenses = sortForFinanzamt(input.ausgaben);
  const period = bookingPeriod([...income.map((row) => row.datum), ...expenses.map((row) => row.datum)]);
  const vat = groupAusgabenByVat(expenses);
  const incomeCategories = sumByLabel(income.map((row) => ({ label: row.kategorie, amount: row.brutto })));
  const expenseCategories = sumByLabel(expenses.map((row) => ({ label: row.kategorie, amount: row.brutto })));
  const incomePayments = sumByLabel(income.map((row) => ({ label: row.zahlungsart, amount: row.brutto })));
  const expensePayments = sumByLabel(expenses.map((row) => ({ label: row.zahlungsart, amount: row.brutto })));
  const years = monthsByYear(income, expenses);
  const ust = totalUst(expenses);

  const months: string[][] = [];
  for (const year of years) {
    year.months.forEach((month, index) => {
      months.push([
        String(year.year),
        MONTHS_DE[index],
        formatEur(month.einnahmen),
        formatEur(month.ausgaben),
        formatEur(month.saldo),
      ]);
    });
    const yearIncome = roundMoney(year.months.reduce((sum, month) => sum + month.einnahmen, 0));
    const yearExpense = roundMoney(year.months.reduce((sum, month) => sum + month.ausgaben, 0));
    months.push(['', `Summe ${year.year}`, formatEur(yearIncome), formatEur(yearExpense), formatEur(roundMoney(yearIncome - yearExpense))]);
  }
  if (years.length > 1) {
    months.push([
      '',
      'Gesamt',
      formatEur(input.totalEinnahmen),
      formatEur(input.totalAusgabenBrutto),
      formatEur(input.gewinn),
    ]);
  }

  return {
    filename: finanzamtFilename(period.from, period.to),
    createdAtLabel: formatDateDe(createdAt),
    periodLabel:
      period.from && period.to
        ? `${formatDateDe(period.from)} bis ${formatDateDe(period.to)}`
        : 'Keine Belege erfasst',
    accountEmail: input.accountEmail?.trim() || null,
    summary: [
      { label: 'Betriebseinnahmen (brutto)', value: formatEur(input.totalEinnahmen) },
      { label: 'Betriebsausgaben (netto)', value: formatEur(input.totalAusgabenNetto) },
      { label: 'Umsatzsteuer in den Ausgaben', value: formatEur(ust) },
      { label: 'Betriebsausgaben (brutto)', value: formatEur(input.totalAusgabenBrutto) },
      { label: 'Gewinn (Einnahmen abzüglich Ausgaben brutto)', value: formatEur(input.gewinn), emphasize: true },
      { label: 'Anzahl Einnahmebelege', value: String(income.length) },
      { label: 'Anzahl Ausgabebelege', value: String(expenses.length) },
    ],
    einnahmen: income.map((row) => [
      textOrDash(row.belegnr),
      formatDateDe(row.datum),
      kundeCell(row),
      textOrDash(row.invoiceId),
      textOrDash(row.beschreibung),
      textOrDash(row.kategorie),
      row.zahlungsart,
      formatEur(row.brutto),
    ]),
    einnahmenFoot:
      income.length > 0
        ? ['', '', '', '', '', '', 'Summe', formatEur(input.totalEinnahmen)]
        : null,
    ausgaben: expenses.map((row) => [
      textOrDash(row.belegnr),
      formatDateDe(row.datum),
      ausgabeText(row),
      textOrDash(row.kategorie),
      row.zahlungsart,
      formatEur(row.netto),
      formatPercent(row.ustProzent),
      formatEur(row.ustBetrag),
      formatEur(row.brutto),
    ]),
    ausgabenFoot:
      expenses.length > 0
        ? ['', '', '', '', 'Summe', formatEur(input.totalAusgabenNetto), '', formatEur(ust), formatEur(input.totalAusgabenBrutto)]
        : null,
    vat: vat.map((row) => [formatPercent(row.rate), String(row.count), formatEur(row.netto), formatEur(row.ust), formatEur(row.brutto)]),
    vatFoot:
      vat.length > 0
        ? ['Summe', String(expenses.length), formatEur(input.totalAusgabenNetto), formatEur(ust), formatEur(input.totalAusgabenBrutto)]
        : null,
    categoriesIncome: amountRows(incomeCategories),
    categoriesIncomeFoot: amountFoot(incomeCategories, input.totalEinnahmen),
    categoriesExpense: amountRows(expenseCategories),
    categoriesExpenseFoot: amountFoot(expenseCategories, input.totalAusgabenBrutto),
    paymentsIncome: amountRows(incomePayments),
    paymentsIncomeFoot: amountFoot(incomePayments, input.totalEinnahmen),
    paymentsExpense: amountRows(expensePayments),
    paymentsExpenseFoot: amountFoot(expensePayments, input.totalAusgabenBrutto),
    months,
    reserve: [
      { label: 'Gewinn', value: formatEur(input.gewinn) },
      {
        label: `Einkommensteuer-Rücklage (${input.einkommensteuerRuecklageProzent} % vom Gewinn)`,
        value: formatEur(input.steuerRuecklage),
      },
      { label: 'Verfügbar nach Rücklage', value: formatEur(input.verfuegbarPrivat) },
    ],
    incomeCount: income.length,
    expenseCount: expenses.length,
  };
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY?: number } };

function paintHeader(doc: jsPDF): void {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(22, 22, 22);
  doc.rect(0, 0, width, 12, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 12, width, 1.1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BETTER STUDIO', 14, 7.7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Aufstellung für das Finanzamt', 52, 7.7);
}

function paintFooters(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Better Studio  ·  Belegaufstellung der Betriebseinnahmen und Betriebsausgaben', 14, height - 7);
    doc.text(`Seite ${page} von ${total}`, width - 14, height - 7, { align: 'right' });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const height = doc.internal.pageSize.getHeight();
  if (y + needed > height - MARGIN.bottom) {
    doc.addPage();
    paintHeader(doc);
    return 20;
  }
  return y;
}

function writeParagraph(doc: jsPDF, text: string, y: number): number {
  const width = doc.internal.pageSize.getWidth() - MARGIN.left - MARGIN.right;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, width) as string[];
  y = ensureSpace(doc, y, lines.length * 4.2 + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(lines, MARGIN.left, y);
  return y + lines.length * 4.2 + 3;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN.left, y + 4);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(MARGIN.left, y + 6.2, MARGIN.left + 28, y + 6.2);
  return y + 11;
}

function tableEnd(doc: jsPDF, fallback: number): number {
  return (doc as DocWithTable).lastAutoTable?.finalY ?? fallback;
}

function drawTable(
  doc: jsPDF,
  y: number,
  head: string[],
  body: string[][],
  options: {
    foot?: string[] | null;
    emptyText: string;
    numericColumns?: number[];
    emphasizeMarkers?: string[];
  },
): number {
  const colCount = head.length;
  const rows: RowInput[] =
    body.length > 0
      ? body
      : [[{ content: options.emptyText, colSpan: colCount, styles: { fontStyle: 'italic', textColor: MUTED } }]];
  const columnStyles: UserOptions['columnStyles'] = {};
  for (const index of options.numericColumns ?? []) {
    columnStyles[String(index)] = { halign: 'right' };
  }

  autoTable(doc, {
    startY: y,
    margin: MARGIN,
    head: [head],
    body: rows,
    foot: options.foot ? [options.foot] : undefined,
    showHead: 'everyPage',
    showFoot: 'lastPage',
    theme: 'plain',
    tableWidth: 'auto',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.15,
      cellPadding: 1.5,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: HEAD,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      valign: 'middle',
    },
    footStyles: {
      fillColor: TOTAL_BG,
      textColor: INK,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles,
    didDrawPage: () => {
      paintHeader(doc);
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || !Array.isArray(data.row.raw)) return;
      const cells = data.row.raw.map((cell) => (typeof cell === 'string' ? cell : ''));
      const marker = options.emphasizeMarkers?.some((label) => cells.includes(label));
      if (marker) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = TOTAL_BG;
      }
    },
  });

  return tableEnd(doc, y + 12) + 8;
}

function drawKeyValue(
  doc: jsPDF,
  y: number,
  rows: { label: string; value: string; emphasize?: boolean }[],
): number {
  autoTable(doc, {
    startY: y,
    margin: MARGIN,
    tableWidth: 190,
    head: [['Position', 'Betrag']],
    body: rows.map((row) => [row.label, row.value]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.15,
      cellPadding: 1.8,
    },
    headStyles: { fillColor: HEAD, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 1: { halign: 'right', cellWidth: 42 } },
    didDrawPage: () => {
      paintHeader(doc);
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const source = rows[data.row.index];
      if (source?.emphasize) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = TOTAL_BG;
      }
    },
  });
  return tableEnd(doc, y + 20) + 6;
}

/** Builds the Finanzamt PDF. Does not trigger a download. */
export function buildFinanzamtPdf(input: FinanzamtExportInput): { doc: jsPDF; filename: string } {
  const model = buildFinanzamtModel(input);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: 'Better Studio – Aufstellung für das Finanzamt',
    subject: 'Betriebseinnahmen und Betriebsausgaben',
    author: 'Better Studio Buchhaltung',
    creator: 'Better Studio Buchhaltung',
  });
  doc.setLanguage('de');
  paintHeader(doc);

  let y = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text('Aufstellung der Betriebseinnahmen und Betriebsausgaben', MARGIN.left, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Zur Vorlage beim Finanzamt', MARGIN.left, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Betrieb: Better Studio`, MARGIN.left, y);
  y += 4.5;
  doc.text(`Zeitraum: ${model.periodLabel}`, MARGIN.left, y);
  y += 4.5;
  doc.text(`Erstellt am: ${model.createdAtLabel}`, MARGIN.left, y);
  y += 4.5;
  if (model.accountEmail) {
    doc.text(`Konto: ${model.accountEmail}`, MARGIN.left, y);
    y += 4.5;
  }
  y += 3;

  y = sectionTitle(doc, '1. Ergebnisübersicht', y);
  y = drawKeyValue(doc, y, model.summary);
  y = writeParagraph(
    doc,
    'Die Belege sind nach Datum aufsteigend sortiert, innerhalb eines Tages nach Belegnummer. Beträge in Euro. Diese Aufstellung enthält sämtliche erfassten Einnahmen und Ausgaben und kann dem Finanzamt als geordnete Belegaufstellung beigelegt werden.',
    y,
  );

  y = sectionTitle(doc, '2. Betriebseinnahmen', y);
  y = drawTable(
    doc,
    y,
    ['Beleg', 'Datum', 'Kunde', 'Rechnung', 'Beschreibung', 'Kategorie', 'Zahlung', 'Brutto'],
    model.einnahmen,
    { foot: model.einnahmenFoot, emptyText: 'Keine Betriebseinnahmen erfasst.', numericColumns: [7] },
  );

  y = sectionTitle(doc, '3. Betriebsausgaben', y);
  y = drawTable(
    doc,
    y,
    ['Beleg', 'Datum', 'Beschreibung', 'Kategorie', 'Zahlung', 'Netto', 'USt', 'USt-Betrag', 'Brutto'],
    model.ausgaben,
    { foot: model.ausgabenFoot, emptyText: 'Keine Betriebsausgaben erfasst.', numericColumns: [5, 6, 7, 8] },
  );

  y = sectionTitle(doc, '4. Umsatzsteuer der Ausgaben', y);
  y = drawTable(
    doc,
    y,
    ['Steuersatz', 'Belege', 'Netto', 'Umsatzsteuer', 'Brutto'],
    model.vat,
    { foot: model.vatFoot, emptyText: 'Keine Umsatzsteuer erfasst.', numericColumns: [1, 2, 3, 4] },
  );

  y = sectionTitle(doc, '5. Summen nach Kategorie', y);
  y = writeParagraph(doc, 'Betriebseinnahmen', y);
  y = drawTable(doc, y, ['Kategorie', 'Belege', 'Brutto'], model.categoriesIncome, {
    foot: model.categoriesIncomeFoot,
    emptyText: 'Keine Einträge',
    numericColumns: [1, 2],
  });
  y = writeParagraph(doc, 'Betriebsausgaben', y);
  y = drawTable(doc, y, ['Kategorie', 'Belege', 'Brutto'], model.categoriesExpense, {
    foot: model.categoriesExpenseFoot,
    emptyText: 'Keine Einträge',
    numericColumns: [1, 2],
  });

  y = sectionTitle(doc, '6. Summen nach Zahlungsart', y);
  y = writeParagraph(doc, 'Betriebseinnahmen', y);
  y = drawTable(doc, y, ['Zahlungsart', 'Belege', 'Brutto'], model.paymentsIncome, {
    foot: model.paymentsIncomeFoot,
    emptyText: 'Keine Einträge',
    numericColumns: [1, 2],
  });
  y = writeParagraph(doc, 'Betriebsausgaben', y);
  y = drawTable(doc, y, ['Zahlungsart', 'Belege', 'Brutto'], model.paymentsExpense, {
    foot: model.paymentsExpenseFoot,
    emptyText: 'Keine Einträge',
    numericColumns: [1, 2],
  });

  y = sectionTitle(doc, '7. Monatsübersicht', y);
  y = drawTable(doc, y, ['Jahr', 'Monat', 'Einnahmen', 'Ausgaben', 'Saldo'], model.months, {
    emptyText: 'Keine Buchungen im Zeitraum.',
    numericColumns: [2, 3, 4],
    emphasizeMarkers: model.months.map((row) => row[1]).filter((label) => label.startsWith('Summe') || label === 'Gesamt'),
  });

  y = sectionTitle(doc, '8. Anhang: interne Steuer-Rücklage', y);
  y = writeParagraph(
    doc,
    'Planungswert der Buchhaltung. Kein Steuerbescheid und nicht Teil der Gewinnermittlung für das Finanzamt.',
    y,
  );
  drawKeyValue(doc, y, model.reserve);

  paintFooters(doc);
  return { doc, filename: model.filename };
}

/** Builds the PDF and starts a browser download. Returns the filename. */
export function downloadFinanzamtPdf(input: FinanzamtExportInput): string {
  const { doc, filename } = buildFinanzamtPdf(input);
  doc.save(filename);
  return filename;
}
