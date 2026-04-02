-- 3. Tabla de Resultados Test de Cartas de Wisconsin (WCST)
CREATE TABLE resultados_wcst (
  id_resultado UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_ensayos INTEGER NOT NULL,
  total_aciertos INTEGER NOT NULL,
  total_errores INTEGER NOT NULL,
  categorias_completadas INTEGER NOT NULL,
  errores_perseverativos INTEGER NOT NULL,
  errores_no_perseverativos INTEGER NOT NULL,
  fallos_al_mantener INTEGER NOT NULL,
  ensayos_hasta_1ra_categoria INTEGER
);

-- Habilitar RLS
ALTER TABLE resultados_wcst ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propios resultados WCST, los inserts son permitidos
CREATE POLICY "Los usuarios ven sus propios resultados WCST" ON resultados_wcst
  FOR SELECT USING (auth.uid() = id_usuario);

CREATE POLICY "Los usuarios insertan sus propios resultados WCST" ON resultados_wcst
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);
