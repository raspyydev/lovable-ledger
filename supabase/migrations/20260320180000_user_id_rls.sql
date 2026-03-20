-- Per-user data for RLS + daily e-mail backups (service role + cron).
-- Orphan rows (no user_id) are assigned to the oldest auth user if any exist.

ALTER TABLE public.einnahmen
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.ausgaben
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.kategorien
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_einnahmen_user_id ON public.einnahmen (user_id);
CREATE INDEX IF NOT EXISTS idx_ausgaben_user_id ON public.ausgaben (user_id);
CREATE INDEX IF NOT EXISTS idx_kategorien_user_id ON public.kategorien (user_id);

DO $$
DECLARE
  first_uid uuid;
BEGIN
  SELECT id INTO first_uid FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF first_uid IS NOT NULL THEN
    UPDATE public.einnahmen SET user_id = first_uid WHERE user_id IS NULL;
    UPDATE public.ausgaben SET user_id = first_uid WHERE user_id IS NULL;
    UPDATE public.kategorien SET user_id = first_uid WHERE user_id IS NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read kategorien" ON public.kategorien;
DROP POLICY IF EXISTS "Public insert kategorien" ON public.kategorien;
DROP POLICY IF EXISTS "Public update kategorien" ON public.kategorien;
DROP POLICY IF EXISTS "Public delete kategorien" ON public.kategorien;

DROP POLICY IF EXISTS "Public read einnahmen" ON public.einnahmen;
DROP POLICY IF EXISTS "Public insert einnahmen" ON public.einnahmen;
DROP POLICY IF EXISTS "Public update einnahmen" ON public.einnahmen;
DROP POLICY IF EXISTS "Public delete einnahmen" ON public.einnahmen;

DROP POLICY IF EXISTS "Public read ausgaben" ON public.ausgaben;
DROP POLICY IF EXISTS "Public insert ausgaben" ON public.ausgaben;
DROP POLICY IF EXISTS "Public update ausgaben" ON public.ausgaben;
DROP POLICY IF EXISTS "Public delete ausgaben" ON public.ausgaben;

CREATE POLICY "Users select own kategorien"
  ON public.kategorien FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own kategorien"
  ON public.kategorien FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own kategorien"
  ON public.kategorien FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own kategorien"
  ON public.kategorien FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users select own einnahmen"
  ON public.einnahmen FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own einnahmen"
  ON public.einnahmen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own einnahmen"
  ON public.einnahmen FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own einnahmen"
  ON public.einnahmen FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users select own ausgaben"
  ON public.ausgaben FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ausgaben"
  ON public.ausgaben FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ausgaben"
  ON public.ausgaben FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ausgaben"
  ON public.ausgaben FOR DELETE
  USING (auth.uid() = user_id);
