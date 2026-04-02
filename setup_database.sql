-- 1. Tabla de Consentimientos Legales (Padres)
CREATE TABLE consentimientos (
  id_consentimiento UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL UNIQUE, -- 1 consentimiento por usuario logueado
  nombre_padre VARCHAR(255) NOT NULL,
  cedula_padre VARCHAR(50) NOT NULL,
  lugar_expedicion_padre VARCHAR(100) NOT NULL,
  nombre_estudiante VARCHAR(255) NOT NULL,
  tarjeta_identidad_estudiante VARCHAR(50) NOT NULL,
  municipio_estudiante VARCHAR(100) NOT NULL,
  grado_estudiante VARCHAR(50) NOT NULL,
  grupo_estudiante VARCHAR(50) NOT NULL,
  autorizacion_dada BOOLEAN DEFAULT true,
  fecha_autorizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Seguridad)
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y crear sus propios consentimientos
CREATE POLICY "Los usuarios ven su propio consentimiento" ON consentimientos
  FOR SELECT USING (auth.uid() = id_usuario);

CREATE POLICY "Los usuarios pueden insertar su propio consentimiento" ON consentimientos
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);


-- 2. Tabla de Resultados de Autorregulación (CAR)
CREATE TABLE resultados_autorregulacion (
  id_resultado UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metas SMALLINT CHECK (metas >= 1 AND metas <= 5),
  perseverancia SMALLINT CHECK (perseverancia >= 1 AND perseverancia <= 5),
  toma_decisiones SMALLINT CHECK (toma_decisiones >= 1 AND toma_decisiones <= 5),
  aprendizaje_errores SMALLINT CHECK (aprendizaje_errores >= 1 AND aprendizaje_errores <= 5),
  estado_general VARCHAR(50), 
  observaciones TEXT
);

-- Habilitar RLS
ALTER TABLE resultados_autorregulacion ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propios resultados, los inserts son permitidos
CREATE POLICY "Los usuarios ven sus propios resultados CAR" ON resultados_autorregulacion
  FOR SELECT USING (auth.uid() = id_usuario);

CREATE POLICY "Los usuarios insertan sus propios resultados CAR" ON resultados_autorregulacion
  FOR INSERT WITH CHECK (auth.uid() = id_usuario);

-- (Opcional, si tienes roles) Una política extra para que el "admin" (Maestra) pueda ver todos los registros.
