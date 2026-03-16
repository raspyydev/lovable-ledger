-- Create kategorien table
CREATE TABLE public.kategorien (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  typ TEXT NOT NULL CHECK (typ IN ('einnahme', 'ausgabe')),
  farbe TEXT NOT NULL DEFAULT '210 100% 50%',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create einnahmen table
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

-- Create ausgaben table
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

-- Enable RLS
ALTER TABLE public.kategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einnahmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ausgaben ENABLE ROW LEVEL SECURITY;

-- Public access policies
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

-- Insert default kategorien
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