-- Dedicated year-wise notices channels.
-- Run this once after the base schema/migration to ensure every academic year
-- has its own visible #notices channel.

INSERT INTO public.channels (name, description, type, department, year, is_private)
SELECT 'notices', 'First Year Notices', 'academic', NULL, 1, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels
  WHERE lower(name) = 'notices' AND type IN ('academic', 'subject') AND year = 1
);

INSERT INTO public.channels (name, description, type, department, year, is_private)
SELECT 'notices', 'Second Year Notices', 'academic', NULL, 2, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels
  WHERE lower(name) = 'notices' AND type IN ('academic', 'subject') AND year = 2
);

INSERT INTO public.channels (name, description, type, department, year, is_private)
SELECT 'notices', 'Third Year Notices', 'academic', NULL, 3, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels
  WHERE lower(name) = 'notices' AND type IN ('academic', 'subject') AND year = 3
);

INSERT INTO public.channels (name, description, type, department, year, is_private)
SELECT 'notices', 'Fourth Year Notices', 'academic', NULL, 4, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels
  WHERE lower(name) = 'notices' AND type IN ('academic', 'subject') AND year = 4
);

