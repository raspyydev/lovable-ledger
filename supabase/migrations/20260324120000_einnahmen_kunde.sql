-- Customer fields for income rows (manual + website paste import)
ALTER TABLE public.einnahmen
  ADD COLUMN IF NOT EXISTS kunde_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.einnahmen
  ADD COLUMN IF NOT EXISTS kunde_email TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.einnahmen.kunde_name IS 'Customer / payer display name';
COMMENT ON COLUMN public.einnahmen.kunde_email IS 'Customer / payer e-mail';
