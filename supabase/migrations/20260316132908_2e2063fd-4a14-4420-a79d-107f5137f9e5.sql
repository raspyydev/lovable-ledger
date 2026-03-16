-- Ledger / Kleinunternehmer Buchhaltung (Einnahmen, Ausgaben, Kategorien)
-- All tables and policies required for the app; run once on fresh DB.

-- Kategorien (Einnahme- und Ausgabe-Kategorien)
CREATE TABLE public.kategorien (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  typ TEXT NOT NULL CHECK (typ IN ('einnahme', 'ausgabe')),
  farbe TEXT NOT NULL DEFAULT '210 100% 50%',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_kategorien_typ ON public.kategorien (typ);
CREATE INDEX idx_kategorien_created_at ON public.kategorien (created_at);

COMMENT ON TABLE public.kategorien IS 'Kategorien für Einnahmen und Ausgaben (Kleinunternehmer Ledger)';

-- Einnahmen (Umsatz = Brutto, Kleinunternehmer §19 UStG)
CREATE TABLE public.einnahmen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  belegnr TEXT NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL DEFAULT '',
  kategorie TEXT NOT NULL DEFAULT '',
  brutto NUMERIC(12,2) NOT NULL DEFAULT 0,
  zahlungsart TEXT NOT NULL DEFAULT 'Rechnung' CHECK (zahlungsart IN ('Rechnung', 'Bar', 'Überweisung', 'PayPal', 'Karte')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_einnahmen_datum ON public.einnahmen (datum DESC);
CREATE INDEX idx_einnahmen_kategorie ON public.einnahmen (kategorie);

COMMENT ON TABLE public.einnahmen IS 'Einnahmen (Rechnungsbetrag/Umsatz); Kleinunternehmer ohne USt-Ausweis';

-- Ausgaben (Betriebsausgaben inkl. USt-Felder; Kleinunternehmer: kein Vorsteuerabzug, Brutto = Aufwand)
CREATE TABLE public.ausgaben (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  belegnr TEXT NOT NULL DEFAULT '',
  ausgaben TEXT NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL DEFAULT '',
  kategorie TEXT NOT NULL DEFAULT '',
  netto NUMERIC(12,2) NOT NULL DEFAULT 0,
  ust_prozent NUMERIC(5,2) NOT NULL DEFAULT 19,
  ust_betrag NUMERIC(12,2) NOT NULL DEFAULT 0,
  brutto NUMERIC(12,2) NOT NULL DEFAULT 0,
  zahlungsart TEXT NOT NULL DEFAULT 'Rechnung' CHECK (zahlungsart IN ('Rechnung', 'Bar', 'Überweisung', 'PayPal', 'Karte')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ausgaben_datum ON public.ausgaben (datum DESC);
CREATE INDEX idx_ausgaben_kategorie ON public.ausgaben (kategorie);

COMMENT ON TABLE public.ausgaben IS 'Ausgaben (Betriebsausgaben); Netto, USt%, USt-Betrag, Brutto für Gewinnberechnung';

-- Row Level Security (RLS)
ALTER TABLE public.kategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einnahmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ausgaben ENABLE ROW LEVEL SECURITY; 

-- Policies: full public CRUD (app uses anon key; restrict in production via auth if needed)
CREATE POLICY "Public read kategorien" ON public.kategorien FOR SELECT USING (true);
CREATE POLICY "Public insert kategorien" ON public.kategorien FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update kategorien" ON public.kategorien FOR UPDATE USING (true);
CREATE POLICY "Public delete kategorien" ON public.kategorien FOR DELETE USING (true);

CREATE POLICY "Public read einnahmen" ON public.einnahmen FOR SELECT USING (true);
CREATE POLICY "Public insert einnahmen" ON public.einnahmen FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update einnahmen" ON public.einnahmen FOR UPDATE USING (true);
CREATE POLICY "Public delete einnahmen" ON public.einnahmen FOR DELETE USING (true);

CREATE POLICY "Public read ausgaben" ON public.ausgaben FOR SELECT USING (true);
CREATE POLICY "Public insert ausgaben" ON public.ausgaben FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update ausgaben" ON public.ausgaben FOR UPDATE USING (true);
CREATE POLICY "Public delete ausgaben" ON public.ausgaben FOR DELETE USING (true);

-- Default-Kategorien (wie in App DEFAULT_KATEGORIEN; Einnahmen + Ausgaben)
INSERT INTO public.kategorien (name, typ, farbe) VALUES
  ('Webdesign', 'einnahme', '210 100% 50%'),
  ('Beratung', 'einnahme', '190 100% 42%'),
  ('Entwicklung', 'einnahme', '170 100% 40%'),
  ('Sonstiges', 'einnahme', '240 5% 60%'),
  ('Büromaterial', 'ausgabe', '30 100% 50%'),
  ('Software', 'ausgabe', '280 60% 55%'),
  ('Transport', 'ausgabe', '350 80% 55%'),
  ('Telefon & Internet', 'ausgabe', '200 80% 50%'),
  ('Versicherung', 'ausgabe', '150 50% 45%'),
  ('Miete', 'ausgabe', '20 70% 50%');