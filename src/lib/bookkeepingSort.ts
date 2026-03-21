import type { Ausgabe, Einnahme } from '@/lib/types';

/** Two-decimal EUR-style rounding (mitigates float drift in sums). */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Digits from belegnr for numeric sort (e.g. "R-007" → 7). Non-numeric → sort last. */
export function belegnrNumericKey(belegnr: string): number {
  const digits = belegnr.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
}

function compareByBelegnrThenDatum(
  belegA: string,
  datumA: string,
  belegB: string,
  datumB: string,
): number {
  const na = belegnrNumericKey(belegA);
  const nb = belegnrNumericKey(belegB);
  if (na !== nb) return na - nb;
  return datumA.localeCompare(datumB);
}

export function sortEinnahmenByBelegnr(list: Einnahme[]): Einnahme[] {
  return [...list].sort((a, b) => compareByBelegnrThenDatum(a.belegnr, a.datum, b.belegnr, b.datum));
}

export function sortAusgabenByBelegnr(list: Ausgabe[]): Ausgabe[] {
  return [...list].sort((a, b) => compareByBelegnrThenDatum(a.belegnr, a.datum, b.belegnr, b.datum));
}
