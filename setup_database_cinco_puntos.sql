-- Ejecutar en el SQL Editor de Supabase antes de usar el módulo.
CREATE TABLE resultados_cinco_puntos (
  id_resultado UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  id_consentimiento UUID REFERENCES consentimientos(id_consentimiento),
  fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_casillas INTEGER NOT NULL DEFAULT 30,
  figuras_completadas INTEGER NOT NULL DEFAULT 0,
  tiempo_segundos INTEGER NOT NULL DEFAULT 0,
  comprendio_instruccion BOOLEAN,
  repitio_instruccion BOOLEAN,
  disenos JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluacion JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE resultados_cinco_puntos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven sus resultados Cinco Puntos" ON resultados_cinco_puntos FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "Usuarios insertan resultados Cinco Puntos" ON resultados_cinco_puntos FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Usuarios actualizan resultados Cinco Puntos" ON resultados_cinco_puntos FOR UPDATE USING (auth.uid() = id_usuario) WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Usuarios eliminan resultados Cinco Puntos" ON resultados_cinco_puntos FOR DELETE USING (auth.uid() = id_usuario);

-- Para instalaciones donde la tabla ya existía antes de estas variables:
ALTER TABLE resultados_cinco_puntos ADD COLUMN IF NOT EXISTS comprendio_instruccion BOOLEAN;
ALTER TABLE resultados_cinco_puntos ADD COLUMN IF NOT EXISTS repitio_instruccion BOOLEAN;
