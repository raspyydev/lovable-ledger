-- External payment / platform invoice reference (e.g. Stripe INV-…)
ALTER TABLE public.einnahmen
  ADD COLUMN IF NOT EXISTS invoice_id TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.einnahmen.invoice_id IS 'Optional external invoice ID (e.g. PayPal/Stripe INV-…)';
