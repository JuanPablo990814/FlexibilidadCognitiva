CREATE TABLE resultados_af5 (
  id_resultado UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  id_consentimiento UUID REFERENCES consentimientos(id_consentimiento),
  fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  respuestas JSONB NOT NULL,
  academico_laboral NUMERIC(5,2) NOT NULL,
  social NUMERIC(5,2) NOT NULL,
  emocional NUMERIC(5,2) NOT NULL,
  familiar NUMERIC(5,2) NOT NULL,
  fisico NUMERIC(5,2) NOT NULL
);
ALTER TABLE resultados_af5 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven resultados AF5" ON resultados_af5 FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "Usuarios insertan resultados AF5" ON resultados_af5 FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Usuarios eliminan resultados AF5" ON resultados_af5 FOR DELETE USING (auth.uid() = id_usuario);
