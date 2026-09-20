-- Aplicar una sola vez en el SQL Editor de Supabase para instalaciones existentes.
-- Conserva todos los resultados ya registrados y habilita las dos métricas docentes.
ALTER TABLE public.resultados_cinco_puntos
  ADD COLUMN IF NOT EXISTS comprendio_instruccion BOOLEAN,
  ADD COLUMN IF NOT EXISTS repitio_instruccion BOOLEAN;

-- Fuerza la actualización del esquema expuesto por PostgREST/Supabase.
NOTIFY pgrst, 'reload schema';
