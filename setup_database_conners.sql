CREATE TABLE resultados_conners_docente (
  id_resultado UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  id_consentimiento UUID REFERENCES consentimientos(id_consentimiento),
  fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nombre_docente TEXT NOT NULL,
  curso_observado TEXT,
  respuestas JSONB NOT NULL,
  total NUMERIC(4,0) NOT NULL CHECK (total BETWEEN 0 AND 30),
  observaciones TEXT
);

ALTER TABLE resultados_conners_docente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven Conners docente" ON resultados_conners_docente FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "Usuarios insertan Conners docente" ON resultados_conners_docente FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Usuarios eliminan Conners docente" ON resultados_conners_docente FOR DELETE USING (auth.uid() = id_usuario);
