import { roundMoney } from '@/lib/bookkeepingSort';

/** Federal basic allowance ESt 2026 (Alleinstehende), SteFeG — planning only. */
export const GRUNDFREIBETRAG_ALLEINSTEHEND_2026 = 12_348;

/** Default flat % on taxable slice (above Grundfreibetrag). */
export const DEFAULT_EST_RUECKLAGE_PROZENT = 40;

/**
 * Default % of positive Gewinn as liquidity buffer (USt-/SV-/Nachzahlungs-Puffer).
 * Applies even when ESt-Rücklage is 0 (e.g. Gewinn below Grundfreibetrag).
 */
export const DEFAULT_SICHERHEITS_RUECKLAGE_PROZENT = 12;

export interface PlanningReserveInput {
  gewinn: number;
  grundfreibetragCap: number;
  estRuecklageProzent: number;
  sicherheitsRuecklageProzent: number;
}

export interface PlanningReserveResult {
  grundfreibetragAbziehbar: number;
  einkommensteuerBemessungsgrundlage: number;
  /** ESt planning reserve (above Grundfreibetrag only). */
  steuerRuecklage: number;
  /** Safety slice of Gewinn (always when Gewinn > 0). */
  sicherheitsRuecklage: number;
  steuerRuecklagePlusSicherheit: number;
  verfuegbarPrivat: number;
}

/**
 * Planning-only reserves: ESt-style block on (Gewinn − Grundfreibetrag) plus a separate
 * safety percentage of total Gewinn so "below allowance" months still show a recommended cushion.
 */
export function computePlanningReserves(input: PlanningReserveInput): PlanningReserveResult {
  const { gewinn, grundfreibetragCap, estRuecklageProzent, sicherheitsRuecklageProzent } = input;
  const g = roundMoney(gewinn);

  if (g <= 0) {
    return {
      grundfreibetragAbziehbar: 0,
      einkommensteuerBemessungsgrundlage: 0,
      steuerRuecklage: 0,
      sicherheitsRuecklage: 0,
      steuerRuecklagePlusSicherheit: 0,
      verfuegbarPrivat: g,
    };
  }

  const grundfreibetragAbziehbar = roundMoney(Math.min(g, grundfreibetragCap));
  const einkommensteuerBemessungsgrundlage = roundMoney(Math.max(0, g - grundfreibetragCap));
  const steuerRuecklage =
    einkommensteuerBemessungsgrundlage > 0
      ? roundMoney(einkommensteuerBemessungsgrundlage * (estRuecklageProzent / 100))
      : 0;
  const sicherheitsRuecklage = roundMoney(g * (sicherheitsRuecklageProzent / 100));
  const steuerRuecklagePlusSicherheit = roundMoney(steuerRuecklage + sicherheitsRuecklage);
  const verfuegbarPrivat = roundMoney(g - steuerRuecklagePlusSicherheit);

  return {
    grundfreibetragAbziehbar,
    einkommensteuerBemessungsgrundlage,
    steuerRuecklage,
    sicherheitsRuecklage,
    steuerRuecklagePlusSicherheit,
    verfuegbarPrivat,
  };
}
