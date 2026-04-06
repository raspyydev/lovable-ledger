import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { sortAusgabenByBelegnr, sortEinnahmenByBelegnr, roundMoney } from './bookkeepingSort';
import { Einnahme, Ausgabe, Kategorie, DEFAULT_KATEGORIEN } from './types';

type EinnahmeRow = Database['public']['Tables']['einnahmen']['Row'];
type AusgabeRow = Database['public']['Tables']['ausgaben']['Row'];
type KategorieRow = Database['public']['Tables']['kategorien']['Row'];

type Zahlungsart = Einnahme['zahlungsart'];
type KategorieTyp = Kategorie['typ'];

function normalizeZahlungsart(raw: string): Zahlungsart {
  return raw === 'PayPal' ? 'PayPal' : 'Stripe';
}

function mapEinnahme(row: EinnahmeRow): Einnahme {
  return {
    id: row.id,
    datum: row.datum,
    belegnr: row.belegnr,
    invoiceId: row.invoice_id ?? '',
    kundeName: row.kunde_name ?? '',
    kundeEmail: row.kunde_email ?? '',
    beschreibung: row.beschreibung,
    kategorie: row.kategorie,
    brutto: Number(row.brutto),
    zahlungsart: normalizeZahlungsart(row.zahlungsart),
  };
}

function mapAusgabe(row: AusgabeRow): Ausgabe {
  return {
    id: row.id,
    datum: row.datum,
    belegnr: row.belegnr,
    ausgaben: row.ausgaben,
    beschreibung: row.beschreibung,
    kategorie: row.kategorie,
    netto: Number(row.netto),
    ustProzent: Number(row.ust_prozent),
    ustBetrag: Number(row.ust_betrag),
    brutto: Number(row.brutto),
    zahlungsart: normalizeZahlungsart(row.zahlungsart),
  };
}

function mapKategorie(row: KategorieRow): Kategorie {
  return {
    id: row.id,
    name: row.name,
    typ: row.typ as KategorieTyp,
    farbe: row.farbe,
  };
}

export function useBookkeepingStore() {
  const { user, isConfigured } = useAuth();
  const userId = user?.id;

  const [einnahmen, setEinnahmen] = useState<Einnahme[]>([]);
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>(DEFAULT_KATEGORIEN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      try {
        const [eRes, aRes, kRes] = await Promise.all([
          supabase.from('einnahmen').select('*').eq('user_id', userId).order('datum', { ascending: false }),
          supabase.from('ausgaben').select('*').eq('user_id', userId).order('datum', { ascending: false }),
          supabase.from('kategorien').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        ]);

        if (cancelled) return;

        if ((kRes.data?.length ?? 0) === 0) {
          const rows = DEFAULT_KATEGORIEN.map((k) => ({
            id: crypto.randomUUID(),
            name: k.name,
            typ: k.typ,
            farbe: k.farbe,
            user_id: userId,
          }));
          await supabase.from('kategorien').insert(rows);
          const { data: seeded } = await supabase
            .from('kategorien')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
          if (cancelled) return;
          if (seeded?.length) setKategorien(seeded.map(mapKategorie));
          else setKategorien(DEFAULT_KATEGORIEN);
        } else if (kRes.data?.length) {
          setKategorien(kRes.data.map(mapKategorie));
        } else {
          setKategorien(DEFAULT_KATEGORIEN);
        }

        if (eRes.data) setEinnahmen(eRes.data.map(mapEinnahme));
        if (aRes.data) setAusgaben(aRes.data.map(mapAusgabe));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAll();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, userId]);

  const addEinnahme = useCallback(
    async (e: Einnahme) => {
      if (!userId) return;
      setEinnahmen((prev) => [e, ...prev]);
      await supabase.from('einnahmen').insert({
        id: e.id,
        datum: e.datum,
        belegnr: e.belegnr,
        invoice_id: e.invoiceId,
        kunde_name: e.kundeName,
        kunde_email: e.kundeEmail,
        beschreibung: e.beschreibung,
        kategorie: e.kategorie,
        brutto: e.brutto,
        zahlungsart: e.zahlungsart,
        user_id: userId,
      });
    },
    [userId],
  );

  const updateEinnahme = useCallback(
    async (e: Einnahme) => {
      if (!userId) return;
      setEinnahmen((prev) => prev.map((x) => (x.id === e.id ? e : x)));
      await supabase
        .from('einnahmen')
        .update({
          datum: e.datum,
          belegnr: e.belegnr,
          invoice_id: e.invoiceId,
          kunde_name: e.kundeName,
          kunde_email: e.kundeEmail,
          beschreibung: e.beschreibung,
          kategorie: e.kategorie,
          brutto: e.brutto,
          zahlungsart: e.zahlungsart,
        })
        .eq('id', e.id)
        .eq('user_id', userId);
    },
    [userId],
  );

  const deleteEinnahme = useCallback(
    async (id: string) => {
      if (!userId) return;
      setEinnahmen((prev) => prev.filter((e) => e.id !== id));
      await supabase.from('einnahmen').delete().eq('id', id).eq('user_id', userId);
    },
    [userId],
  );

  const deleteAllEinnahmen = useCallback(
    async () => {
      if (!userId) return;
      const ids = einnahmen.map((e) => e.id);
      if (ids.length === 0) return;
      setEinnahmen([]);
      await supabase.from('einnahmen').delete().in('id', ids).eq('user_id', userId);
    },
    [userId, einnahmen],
  );

  const addAusgabe = useCallback(
    async (a: Ausgabe) => {
      if (!userId) return;
      setAusgaben((prev) => [a, ...prev]);
      await supabase.from('ausgaben').insert({
        id: a.id,
        datum: a.datum,
        belegnr: a.belegnr,
        ausgaben: a.ausgaben,
        beschreibung: a.beschreibung,
        kategorie: a.kategorie,
        netto: a.netto,
        ust_prozent: a.ustProzent,
        ust_betrag: a.ustBetrag,
        brutto: a.brutto,
        zahlungsart: a.zahlungsart,
        user_id: userId,
      });
    },
    [userId],
  );

  const updateAusgabe = useCallback(
    async (a: Ausgabe) => {
      if (!userId) return;
      setAusgaben((prev) => prev.map((x) => (x.id === a.id ? a : x)));
      await supabase
        .from('ausgaben')
        .update({
          datum: a.datum,
          belegnr: a.belegnr,
          ausgaben: a.ausgaben,
          beschreibung: a.beschreibung,
          kategorie: a.kategorie,
          netto: a.netto,
          ust_prozent: a.ustProzent,
          ust_betrag: a.ustBetrag,
          brutto: a.brutto,
          zahlungsart: a.zahlungsart,
        })
        .eq('id', a.id)
        .eq('user_id', userId);
    },
    [userId],
  );

  const deleteAusgabe = useCallback(
    async (id: string) => {
      if (!userId) return;
      setAusgaben((prev) => prev.filter((a) => a.id !== id));
      await supabase.from('ausgaben').delete().eq('id', id).eq('user_id', userId);
    },
    [userId],
  );

  const addKategorie = useCallback(
    async (k: Kategorie) => {
      if (!userId) return;
      setKategorien((prev) => [...prev, k]);
      await supabase.from('kategorien').insert({
        id: k.id,
        name: k.name,
        typ: k.typ,
        farbe: k.farbe,
        user_id: userId,
      });
    },
    [userId],
  );

  const deleteKategorie = useCallback(
    async (id: string) => {
      if (!userId) return;
      setKategorien((prev) => prev.filter((k) => k.id !== id));
      await supabase.from('kategorien').delete().eq('id', id).eq('user_id', userId);
    },
    [userId],
  );

  const setKategorienState = useCallback((val: Kategorie[] | ((prev: Kategorie[]) => Kategorie[])) => {
    setKategorien(val);
  }, []);

  const totalEinnahmen = roundMoney(einnahmen.reduce((s, e) => s + e.brutto, 0));
  const totalAusgabenBrutto = roundMoney(ausgaben.reduce((s, a) => s + a.brutto, 0));
  const totalAusgabenNetto = roundMoney(ausgaben.reduce((s, a) => s + a.netto, 0));
  const gewinn = roundMoney(totalEinnahmen - totalAusgabenBrutto);
  const EINKOMMENSTEUER_RUECKLAGE_PROZENT = 35;
  const steuerRuecklage = gewinn > 0 ? roundMoney(gewinn * (EINKOMMENSTEUER_RUECKLAGE_PROZENT / 100)) : 0;
  const verfuegbarPrivat = roundMoney(gewinn - steuerRuecklage);

  const einnahmenSorted = useMemo(() => sortEinnahmenByBelegnr(einnahmen), [einnahmen]);
  const ausgabenSorted = useMemo(() => sortAusgabenByBelegnr(ausgaben), [ausgaben]);

  /** Month tab: current year if it has bookings, else latest year present in data (avoids empty chart). */
  const monatsBerichtsjahr = useMemo(() => {
    const nowY = new Date().getFullYear();
    const hasInCurrent =
      einnahmen.some((e) => e.datum.startsWith(`${nowY}-`)) ||
      ausgaben.some((a) => a.datum.startsWith(`${nowY}-`));
    if (hasInCurrent) return nowY;
    let maxY = 0;
    for (const e of einnahmen) {
      const y = parseInt(e.datum.slice(0, 4), 10);
      if (!Number.isNaN(y)) maxY = Math.max(maxY, y);
    }
    for (const a of ausgaben) {
      const y = parseInt(a.datum.slice(0, 4), 10);
      if (!Number.isNaN(y)) maxY = Math.max(maxY, y);
    }
    return maxY > 0 ? maxY : nowY;
  }, [einnahmen, ausgaben]);

  const getMonthlyData = useCallback(
    (year: number = new Date().getFullYear()) => {
      const y = String(year);
      return Array.from({ length: 12 }, (_, i) => {
        const monthStr = String(i + 1).padStart(2, '0');
        const monthEinnahmen = roundMoney(
          einnahmen
            .filter((e) => e.datum.startsWith(`${y}-`) && e.datum.slice(5, 7) === monthStr)
            .reduce((s, e) => s + e.brutto, 0),
        );
        const monthAusgaben = roundMoney(
          ausgaben
            .filter((a) => a.datum.startsWith(`${y}-`) && a.datum.slice(5, 7) === monthStr)
            .reduce((s, a) => s + a.brutto, 0),
        );
        return { einnahmen: monthEinnahmen, ausgaben: monthAusgaben };
      });
    },
    [einnahmen, ausgaben],
  );

  return {
    einnahmen: einnahmenSorted,
    ausgaben: ausgabenSorted,
    kategorien,
    loading,
    addEinnahme,
    updateEinnahme,
    deleteEinnahme,
    deleteAllEinnahmen,
    addAusgabe,
    updateAusgabe,
    deleteAusgabe,
    addKategorie,
    deleteKategorie,
    setKategorien: setKategorienState,
    totalEinnahmen,
    totalAusgabenBrutto,
    totalAusgabenNetto,
    gewinn,
    steuerRuecklage,
    verfuegbarPrivat,
    einkommensteuerRuecklageProzent: EINKOMMENSTEUER_RUECKLAGE_PROZENT,
    getMonthlyData,
    monatsBerichtsjahr,
  };
}
