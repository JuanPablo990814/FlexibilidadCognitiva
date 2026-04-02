-- SCRIPT DE SEGURIDAD PARA MÚLTIPLES ADMINISTRADORES
-- Instrucciones: 
-- 1. Cambia los correos dentro de los paréntesis por los correos exactos separados por comas y comillas. Puedes añadir 1, 2, o los que necesites.
-- 2. Copia y pega todo esto en el SQL Editor de Supabase y dale a "Run" (Este script borrará la regla vieja si ya existía y pondrá la nueva).

DROP POLICY IF EXISTS "La profesora ve todos los consentimientos" ON consentimientos;
DROP POLICY IF EXISTS "La profesora ve todos los resultados" ON resultados_autorregulacion;
DROP POLICY IF EXISTS "La profesora borra resultados" ON resultados_autorregulacion;
DROP POLICY IF EXISTS "La profesora ve todos los resultados WCST" ON resultados_wcst;
DROP POLICY IF EXISTS "La profesora borra resultados WCST" ON resultados_wcst;

-- Política para ver todos los expedientes (Consentimientos)
CREATE POLICY "La profesora ve todos los consentimientos" 
ON consentimientos
FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('correo.maestra1@gmail.com', 'correo.maestra2@gmail.com'));

-- Política para ver todos los puntajes (Resultados CAR)
CREATE POLICY "La profesora ve todos los resultados" 
ON resultados_autorregulacion
FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('correo.maestra1@gmail.com', 'correo.maestra2@gmail.com'));

-- Política para borrar puntajes basura (Resultados CAR)
CREATE POLICY "La profesora borra resultados" 
ON resultados_autorregulacion
FOR DELETE 
USING (auth.jwt() ->> 'email' IN ('correo.maestra1@gmail.com', 'correo.maestra2@gmail.com'));

-- Política para ver todos los puntajes (Resultados WCST)
CREATE POLICY "La profesora ve todos los resultados WCST" 
ON resultados_wcst
FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('correo.maestra1@gmail.com', 'correo.maestra2@gmail.com'));

-- Política para borrar puntajes basura (Resultados WCST)
CREATE POLICY "La profesora borra resultados WCST" 
ON resultados_wcst
FOR DELETE 
USING (auth.jwt() ->> 'email' IN ('correo.maestra1@gmail.com', 'correo.maestra2@gmail.com'));
