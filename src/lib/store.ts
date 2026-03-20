import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Einnahme, Ausgabe, Kategorie, DEFAULT_KATEGORIEN } from './types';

type EinnahmeRow = Database['public']['Tables']['einnahmen']['Row'];
type AusgabeRow = Database['public']['Tables']['ausgaben']['Row'];
type KategorieRow = Database['public']['Tables']['kategorien']['Row'];

type Zahlungsart = Einnahme['zahlungsart'];
type KategorieTyp = Kategorie['typ'];

function mapEinnahme(row: EinnahmeRow): Einnahme {
  return {
    id: row.id,
    datum: row.datum,
    belegnr: row.belegnr,
    beschreibung: row.beschreibung,
    kategorie: row.kategorie,
    brutto: Number(row.brutto),
    zahlungsart: row.zahlungsart as Zahlungsart,
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
    zahlungsart: row.zahlungsart as Zahlungsart,
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

  const totalEinnahmen = einnahmen.reduce((s, e) => s + e.brutto, 0);
  const totalAusgabenBrutto = ausgaben.reduce((s, a) => s + a.brutto, 0);
  const totalAusgabenNetto = ausgaben.reduce((s, a) => s + a.netto, 0);
  const gewinn = totalEinnahmen - totalAusgabenBrutto;
  const EINKOMMENSTEUER_RUECKLAGE_PROZENT = 25;
  const steuerRuecklage = gewinn > 0 ? gewinn * (EINKOMMENSTEUER_RUECKLAGE_PROZENT / 100) : 0;
  const verfuegbarPrivat = gewinn - steuerRuecklage;

  const getMonthlyData = useCallback(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const monthEinnahmen = einnahmen
        .filter((e) => e.datum.substring(5, 7) === monthStr)
        .reduce((s, e) => s + e.brutto, 0);
      const monthAusgaben = ausgaben
        .filter((a) => a.datum.substring(5, 7) === monthStr)
        .reduce((s, a) => s + a.brutto, 0);
      return { einnahmen: monthEinnahmen, ausgaben: monthAusgaben };
    });
  }, [einnahmen, ausgaben]);

  return {
    einnahmen,
    ausgaben,
    kategorien,
    loading,
    addEinnahme,
    updateEinnahme,
    deleteEinnahme,
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
  };
}
