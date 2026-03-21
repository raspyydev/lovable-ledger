-- Payment methods: only Stripe and PayPal (app UI)
ALTER TABLE public.einnahmen DROP CONSTRAINT IF EXISTS einnahmen_zahlungsart_check;
ALTER TABLE public.ausgaben DROP CONSTRAINT IF EXISTS ausgaben_zahlungsart_check;

UPDATE public.einnahmen
SET zahlungsart = CASE WHEN zahlungsart = 'PayPal' THEN 'PayPal' ELSE 'Stripe' END;

UPDATE public.ausgaben
SET zahlungsart = CASE WHEN zahlungsart = 'PayPal' THEN 'PayPal' ELSE 'Stripe' END;

ALTER TABLE public.einnahmen
  ALTER COLUMN zahlungsart SET DEFAULT 'Stripe',
  ADD CONSTRAINT einnahmen_zahlungsart_check CHECK (zahlungsart IN ('Stripe', 'PayPal'));

ALTER TABLE public.ausgaben
  ALTER COLUMN zahlungsart SET DEFAULT 'Stripe',
  ADD CONSTRAINT ausgaben_zahlungsart_check CHECK (zahlungsart IN ('Stripe', 'PayPal'));
