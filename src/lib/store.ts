import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Einnahme, Ausgabe, Kategorie, DEFAULT_KATEGORIEN } from './types';

// Map DB row to app types
function mapEinnahme(row: any): Einnahme {
  return { id: row.id, datum: row.datum, belegnr: row.belegnr, beschreibung: row.beschreibung, kategorie: row.kategorie, brutto: Number(row.brutto), zahlungsart: row.zahlungsart };
}

function mapAusgabe(row: any): Ausgabe {
  return { id: row.id, datum: row.datum, belegnr: row.belegnr, ausgaben: row.ausgaben, beschreibung: row.beschreibung, kategorie: row.kategorie, netto: Number(row.netto), ustProzent: Number(row.ust_prozent), ustBetrag: Number(row.ust_betrag), brutto: Number(row.brutto), zahlungsart: row.zahlungsart };
}

function mapKategorie(row: any): Kategorie {
  return { id: row.id, name: row.name, typ: row.typ, farbe: row.farbe };
}

export function useBookkeepingStore() {
  const [einnahmen, setEinnahmen] = useState<Einnahme[]>([]);
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [kategorien, setKategorien] = useState<Kategorie[]>(DEFAULT_KATEGORIEN);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAll() {
      const [eRes, aRes, kRes] = await Promise.all([
        supabase.from('einnahmen').select('*').order('datum', { ascending: false }),
        supabase.from('ausgaben').select('*').order('datum', { ascending: false }),
        supabase.from('kategorien').select('*').order('created_at', { ascending: true }),
      ]);
      if (eRes.data) setEinnahmen(eRes.data.map(mapEinnahme));
      if (aRes.data) setAusgaben(aRes.data.map(mapAusgabe));
      if (kRes.data && kRes.data.length > 0) setKategorien(kRes.data.map(mapKategorie));
      setLoading(false);
    }
    fetchAll();
  }, []);

  const addEinnahme = useCallback(async (e: Einnahme) => {
    setEinnahmen(prev => [e, ...prev]);
    await supabase.from('einnahmen').insert({
      id: e.id, datum: e.datum, belegnr: e.belegnr, beschreibung: e.beschreibung,
      kategorie: e.kategorie, brutto: e.brutto, zahlungsart: e.zahlungsart,
    });
  }, []);

  const updateEinnahme = useCallback(async (e: Einnahme) => {
    setEinnahmen(prev => prev.map(x => (x.id === e.id ? e : x)));
    await supabase.from('einnahmen').update({
      datum: e.datum, belegnr: e.belegnr, beschreibung: e.beschreibung,
      kategorie: e.kategorie, brutto: e.brutto, zahlungsart: e.zahlungsart,
    }).eq('id', e.id);
  }, []);

  const deleteEinnahme = useCallback(async (id: string) => {
    setEinnahmen(prev => prev.filter(e => e.id !== id));
    await supabase.from('einnahmen').delete().eq('id', id);
  }, []);

  const addAusgabe = useCallback(async (a: Ausgabe) => {
    setAusgaben(prev => [a, ...prev]);
    await supabase.from('ausgaben').insert({
      id: a.id, datum: a.datum, belegnr: a.belegnr, ausgaben: a.ausgaben,
      beschreibung: a.beschreibung, kategorie: a.kategorie, netto: a.netto,
      ust_prozent: a.ustProzent, ust_betrag: a.ustBetrag, brutto: a.brutto,
      zahlungsart: a.zahlungsart,
    });
  }, []);

  const updateAusgabe = useCallback(async (a: Ausgabe) => {
    setAusgaben(prev => prev.map(x => (x.id === a.id ? a : x)));
    await supabase.from('ausgaben').update({
      datum: a.datum, belegnr: a.belegnr, ausgaben: a.ausgaben,
      beschreibung: a.beschreibung, kategorie: a.kategorie, netto: a.netto,
      ust_prozent: a.ustProzent, ust_betrag: a.ustBetrag, brutto: a.brutto,
      zahlungsart: a.zahlungsart,
    }).eq('id', a.id);
  }, []);

  const deleteAusgabe = useCallback(async (id: string) => {
    setAusgaben(prev => prev.filter(a => a.id !== id));
    await supabase.from('ausgaben').delete().eq('id', id);
  }, []);

  const addKategorie = useCallback(async (k: Kategorie) => {
    setKategorien(prev => [...prev, k]);
    await supabase.from('kategorien').insert({
      id: k.id, name: k.name, typ: k.typ, farbe: k.farbe,
    });
  }, []);

  const deleteKategorie = useCallback(async (id: string) => {
    setKategorien(prev => prev.filter(k => k.id !== id));
    await supabase.from('kategorien').delete().eq('id', id);
  }, []);

  const setKategorienState = useCallback((val: Kategorie[] | ((prev: Kategorie[]) => Kategorie[])) => {
    setKategorien(val);
  }, []);

  // Kleinunternehmer (§19 UStG): No VAT on sales, no Vorsteuerabzug. Gewinn = Einnahmen - Ausgaben (Brutto).
  const totalEinnahmen = einnahmen.reduce((s, e) => s + e.brutto, 0);
  const totalAusgabenBrutto = ausgaben.reduce((s, a) => s + a.brutto, 0);
  const totalAusgabenNetto = ausgaben.reduce((s, a) => s + a.netto, 0);
  const gewinn = totalEinnahmen - totalAusgabenBrutto;
  // Estimated income tax reserve (Einkommensteuer) – rough percentage for Kleinunternehmer
  const EINKOMMENSTEUER_RUECKLAGE_PROZENT = 25;
  const steuerRuecklage = gewinn > 0 ? gewinn * (EINKOMMENSTEUER_RUECKLAGE_PROZENT / 100) : 0;
  const verfuegbarPrivat = gewinn - steuerRuecklage;

  const getMonthlyData = useCallback(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const monthEinnahmen = einnahmen
        .filter(e => e.datum.substring(5, 7) === monthStr)
        .reduce((s, e) => s + e.brutto, 0);
      const monthAusgaben = ausgaben
        .filter(a => a.datum.substring(5, 7) === monthStr)
        .reduce((s, a) => s + a.brutto, 0);
      return { einnahmen: monthEinnahmen, ausgaben: monthAusgaben };
    });
  }, [einnahmen, ausgaben]);

  return {
    einnahmen, ausgaben, kategorien, loading,
    addEinnahme, updateEinnahme, deleteEinnahme,
    addAusgabe, updateAusgabe, deleteAusgabe,
    addKategorie, deleteKategorie,
    setKategorien: setKategorienState,
    totalEinnahmen, totalAusgabenBrutto, totalAusgabenNetto, gewinn,
    steuerRuecklage, verfuegbarPrivat, einkommensteuerRuecklageProzent: EINKOMMENSTEUER_RUECKLAGE_PROZENT,
    getMonthlyData,
  };
}
