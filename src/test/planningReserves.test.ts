import { describe, expect, it } from 'vitest';
import {
  computePlanningReserves,
  DEFAULT_EST_RUECKLAGE_PROZENT,
  DEFAULT_SICHERHEITS_RUECKLAGE_PROZENT,
  GRUNDFREIBETRAG_ALLEINSTEHEND_2026,
} from '@/lib/planningReserves';

const base = {
  grundfreibetragCap: GRUNDFREIBETRAG_ALLEINSTEHEND_2026,
  estRuecklageProzent: DEFAULT_EST_RUECKLAGE_PROZENT,
  sicherheitsRuecklageProzent: DEFAULT_SICHERHEITS_RUECKLAGE_PROZENT,
};

describe('computePlanningReserves', () => {
  it('returns zeros for non-positive Gewinn', () => {
    const r = computePlanningReserves({ ...base, gewinn: 0 });
    expect(r.steuerRuecklage).toBe(0);
    expect(r.sicherheitsRuecklage).toBe(0);
    expect(r.steuerRuecklagePlusSicherheit).toBe(0);
    expect(r.verfuegbarPrivat).toBe(0);
    const neg = computePlanningReserves({ ...base, gewinn: -500 });
    expect(neg.verfuegbarPrivat).toBe(-500);
  });

  it('below Grundfreibetrag: no ESt reserve but safety % on Gewinn', () => {
    const r = computePlanningReserves({ ...base, gewinn: 8000 });
    expect(r.einkommensteuerBemessungsgrundlage).toBe(0);
    expect(r.steuerRuecklage).toBe(0);
    expect(r.sicherheitsRuecklage).toBe(960); // 12% of 8000
    expect(r.steuerRuecklagePlusSicherheit).toBe(960);
    expect(r.verfuegbarPrivat).toBe(7040);
  });

  it('above Grundfreibetrag: ESt on slice plus safety on full Gewinn', () => {
    const r = computePlanningReserves({ ...base, gewinn: 20_000 });
    expect(r.einkommensteuerBemessungsgrundlage).toBe(7652);
    expect(r.steuerRuecklage).toBe(3060.8);
    expect(r.sicherheitsRuecklage).toBe(2400);
    expect(r.steuerRuecklagePlusSicherheit).toBe(5460.8);
    expect(r.verfuegbarPrivat).toBe(14_539.2);
  });
});
