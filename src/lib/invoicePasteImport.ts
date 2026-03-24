/**
 * Parses bulk invoice text copied from the Better Studio website (INV-… blocks).
 */

export interface ParsedInvoiceBlock {
  invoiceId: string;
  /** Product / service lines from the website between invoice id and e-mail (e.g. "PC Optimierung" or "Optimizer Pro · Maus / Netzwerk"). */
  leistung: string;
  email: string;
  name: string;
  datumIso: string;
  brutto: number;
  statusLine: string;
}

const INV_LINE = /^INV-\d+-[A-Z0-9]+$/i;
const DATE_DE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const STATUS_PAID = /bezahlt|paid/i;
/** First line that looks like an e-mail (website may put product lines before the e-mail). */
function looksLikeEmailLine(line: string): boolean {
  const t = line.trim();
  const at = t.indexOf('@');
  if (at <= 0) return false;
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  if (!local.length || !domain.length || /\s/.test(t)) return false;
  return domain.includes('.');
}

function parseDeDateToIso(line: string): string | null {
  const m = line.match(DATE_DE);
  if (!m) return null;
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  const y = m[3];
  return `${y}-${mo}-${d}`;
}

function parseEuroAmount(line: string): number | null {
  const normalized = line.replace(/\s/g, '').replace(',', '.');
  const m = normalized.match(/€?\s*([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function nonEmptyLines(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Split raw paste into chunks that start with an INV-… line.
 */
export function splitInvoiceChunks(raw: string): string[] {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const chunks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (INV_LINE.test(t) && current.length > 0) {
      chunks.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks;
}

export type ParseInvoicePasteResult = {
  ok: ParsedInvoiceBlock[];
  errors: string[];
};

export function parseInvoicePaste(raw: string): ParseInvoicePasteResult {
  const ok: ParsedInvoiceBlock[] = [];
  const errors: string[] = [];
  const chunks = splitInvoiceChunks(raw);

  for (let i = 0; i < chunks.length; i++) {
    const lines = nonEmptyLines(chunks[i]);
    if (lines.length === 0) continue;
    const head = lines[0];
    if (!INV_LINE.test(head)) {
      errors.push(`Block ${i + 1}: Erwartet erste Zeile INV-…, gefunden: "${head.slice(0, 40)}…"`);
      continue;
    }
    const invoiceId = head;
    const emailIdx = lines.findIndex((l, idx) => idx >= 1 && looksLikeEmailLine(l));
    if (emailIdx < 0) {
      errors.push(`Block ${i + 1} (${invoiceId}): E-Mail-Zeile fehlt oder ungültig.`);
      continue;
    }
    const email = lines[emailIdx].trim();
    const leistung = lines.slice(1, emailIdx).join(' · ').trim();
    const dateIdx = lines.findIndex((l, idx) => idx > emailIdx && parseDeDateToIso(l) !== null);
    if (dateIdx < 0) {
      errors.push(`Block ${i + 1} (${invoiceId}): Datum (TT.MM.JJJJ) nicht gefunden.`);
      continue;
    }
    let name = lines.slice(emailIdx + 1, dateIdx).join(' ').trim();
    if (!name) {
      const local = email.split('@')[0]?.replace(/[._]+/g, ' ').trim();
      name = local || email;
    }
    const datumIso = parseDeDateToIso(lines[dateIdx])!;
    const amountLine = lines[dateIdx + 1];
    if (!amountLine) {
      errors.push(`Block ${i + 1} (${invoiceId}): Betrag fehlt.`);
      continue;
    }
    const brutto = parseEuroAmount(amountLine);
    if (brutto === null || brutto < 0) {
      errors.push(`Block ${i + 1} (${invoiceId}): Betrag nicht lesbar: "${amountLine}".`);
      continue;
    }
    const statusLine = lines[dateIdx + 2] ?? '';
    ok.push({
      invoiceId,
      leistung,
      email,
      name,
      datumIso,
      brutto,
      statusLine,
    });
  }

  return { ok, errors };
}

export function isPaidStatus(statusLine: string): boolean {
  return STATUS_PAID.test(statusLine.trim());
}
