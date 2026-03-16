export interface Einnahme {
  id: string;
  datum: string;
  belegnr: string;
  beschreibung: string;
  kategorie: string;
  brutto: number;
  zahlungsart: 'Rechnung' | 'Bar' | 'Überweisung' | 'PayPal' | 'Karte';
}

export interface Ausgabe {
  id: string;
  datum: string;
  belegnr: string;
  ausgaben: string;
  beschreibung: string;
  kategorie: string;
  netto: number;
  ustProzent: number;
  ustBetrag: number;
  brutto: number;
  zahlungsart: 'Rechnung' | 'Bar' | 'Überweisung' | 'PayPal' | 'Karte';
}

export interface Kategorie {
  id: string;
  name: string;
  typ: 'einnahme' | 'ausgabe';
  farbe: string;
}

export type TabId = 'einnahmen' | 'ausgaben' | 'kategorien' | 'zusammenfassung' | 'monatsuebersicht';

export const DEFAULT_KATEGORIEN: Kategorie[] = [
  { id: '1', name: 'Webdesign', typ: 'einnahme', farbe: '210 100% 50%' },
  { id: '2', name: 'Beratung', typ: 'einnahme', farbe: '190 100% 42%' },
  { id: '3', name: 'Entwicklung', typ: 'einnahme', farbe: '170 100% 40%' },
  { id: '4', name: 'Sonstiges', typ: 'einnahme', farbe: '240 5% 60%' },
  { id: '5', name: 'Büromaterial', typ: 'ausgabe', farbe: '30 100% 50%' },
  { id: '6', name: 'Software', typ: 'ausgabe', farbe: '280 60% 55%' },
  { id: '7', name: 'Transport', typ: 'ausgabe', farbe: '350 80% 55%' },
  { id: '8', name: 'Telefon & Internet', typ: 'ausgabe', farbe: '200 80% 50%' },
  { id: '9', name: 'Versicherung', typ: 'ausgabe', farbe: '150 50% 45%' },
  { id: '10', name: 'Miete', typ: 'ausgabe', farbe: '20 70% 50%' },
];

export const ZAHLUNGSARTEN = ['Rechnung', 'Bar', 'Überweisung', 'PayPal', 'Karte'] as const;

export const MONATE = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'] as const;
