-- SCRIPT PARA CORREGIR LOS LÍMITES DE PUNTUACIÓN DEL CAR
-- Copia esto en el SQL Editor de Supabase y dale a Run.

ALTER TABLE resultados_autorregulacion DROP CONSTRAINT IF EXISTS resultados_autorregulacion_metas_check;
ALTER TABLE resultados_autorregulacion DROP CONSTRAINT IF EXISTS resultados_autorregulacion_aprendizaje_errores_check;
ALTER TABLE resultados_autorregulacion DROP CONSTRAINT IF EXISTS resultados_autorregulacion_perseverancia_check;
ALTER TABLE resultados_autorregulacion DROP CONSTRAINT IF EXISTS resultados_autorregulacion_toma_decisiones_check;
