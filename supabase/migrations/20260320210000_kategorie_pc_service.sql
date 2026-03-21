-- Einnahme-Kategorie PC-Service für alle Nutzer, falls noch nicht vorhanden
INSERT INTO public.kategorien (id, name, typ, farbe, user_id)
SELECT gen_random_uuid(), 'PC-Service', 'einnahme', '155 70% 40%', u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.kategorien k
  WHERE k.user_id = u.id AND k.name = 'PC-Service'
);
