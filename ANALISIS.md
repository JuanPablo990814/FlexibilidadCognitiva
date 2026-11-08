# Módulo de análisis de evaluaciones

Acceso: panel investigador → **Analizar resultados** (`/admin/analisis`).

El módulo consulta los consentimientos y las cinco tablas de resultados con la sesión actual y las políticas de acceso existentes de Supabase. Lee las tablas por páginas y muestra un error si falla alguna consulta, para evitar presentar una comparación parcial como completa. No requiere cambios en el esquema.

## Criterios del análisis

- Una observación por estudiante y prueba: el intento completo con fecha más reciente. Las evaluaciones incompletas se excluyen, se muestran en las alertas y no entran en el CSV. Los intentos adicionales generan una alerta. Los empates se resuelven por identificador del resultado.
- Los sujetos reciben códigos por grupo, ordenados por identificador del consentimiento. No se envían nombres, documentos de identidad ni nombres de docentes al componente de análisis. Los códigos pueden cambiar si se incorporan o eliminan consentimientos; no deben usarse como identificadores longitudinales permanentes.
- Los grupos 4.1 a 4.5 siempre aparecen como referencia; se incluyen también otros grupos presentes en los registros.
- Medias, medianas, mínimos, máximos y desviación estándar muestral se calculan con valores válidos. Cada indicador informa su N válido. Los datos ausentes no se convierten en cero.
- Wisconsin: solo se incluyen ejecuciones con historial completo y 64 ensayos o seis categorías alcanzadas. Los aciertos y errores se dividen entre los ensayos registrados; la proporción perseverativa se divide entre los errores totales. Se conserva el historial para revisar criterios y cambios de criterio.
- Cinco Puntos: se excluyen de las tablas las ejecuciones pendientes de calificación. Los indicadores de clasificación solo se incluyen cuando todas las figuras tienen clasificación válida. La diversidad descriptiva es diseños únicos / diseños totales × 100; no representa un baremo de originalidad.
- AF5: se muestran sus cinco dimensiones existentes, sin inventar un total o percentiles. La referencia ambigua a un cuestionario FS-5 en el documento no se convierte en un instrumento adicional.
- Conners: se utiliza el total de la versión de diez ítems existente (0–30), sin inferir subescalas o niveles clínicos.
- CAR: los registros sin consentimiento se vinculan por cuenta únicamente si existe un solo estudiante para esa cuenta. Los registros ambiguos se excluyen y se señalan.
- Las fichas posiblemente duplicadas generan alertas, pero no se fusionan automáticamente.
- La exportación CSV contiene todos los indicadores de las cinco pruebas para el grupo seleccionado, con códigos de sujeto y observaciones. La búsqueda de código afecta solamente a la tabla individual.

## Verificación y configuración

`npm test` verifica cálculos, datos ausentes, selección de intentos, anonimización, evaluación pendiente, registros ambiguos y alertas. `npx tsc --noEmit` verifica los tipos. `npm run build` necesita las variables de Supabase descritas en `.env.local.example`.

La comprobación de datos reales necesita una sesión y la configuración de Supabase. Las políticas RLS pueden limitar los resultados a los de la cuenta actual; un resultado vacío no demuestra que no existan registros de otros usuarios.

La función preexistente `isAdmin` en `lib/authUtils.ts` devuelve `true` para pruebas. El módulo conserva la autorización del panel y no modifica las políticas RLS. Antes de habilitar un acceso investigador real debe configurarse una comprobación de rol y sus políticas de lectura. El módulo es descriptivo y no realiza inferencias estadísticas ni diagnósticos.

## Grupos escolares y gráficas

Los formatos equivalentes de grado y grupo se normalizan durante la lectura (por ejemplo, grado Cuarto y grupo 01; grupo 4.1; 4,1; 4-1; 401). Los valores ambiguos o contradictorios se agrupan como Por revisar y se excluyen de las comparaciones entre grupos. Sus resultados completos permanecen en el resumen general y el CSV, con su grupo señalado como pendiente. Esta normalización no reescribe los registros históricos. Los registros nuevos utilizan listas de grado y grupo y se validan en el servidor.

En Wisconsin, Criterios completados (0–6) es el indicador antes denominado Categorías. No corresponde a una categoría escolar. Las barras tienen escala desde cero, valores directos y cantidad de participantes; el color identifica al grupo y no un nivel de desempeño. Los documentos N/A del registro rápido no se usan como evidencia de duplicación.

## Exportación PDF

El panel permite descargar un PDF con los datos completos accesibles a la sesión, matrices de participantes con campos faltantes, gráficas, descriptivos e interpretación narrativa. Los registros cuyo nombre contiene una marca explícita de prueba se excluyen del informe y se conserva la numeración de las demás fichas.

`createAnalysisReport` admite un segundo argumento opcional `AcademicEvidence` para agregar calificaciones, estrato y clasificación documental de TDAH. La ruta GET usa los datos de Supabase; las evidencias de los archivos locales no se incorporan automáticamente a esa ruta ni se almacenan en la base de datos. El PDF ampliado se generó localmente con evidencia anónima preparada desde las fuentes aportadas. La ausencia de una marca TDAH se describe como sin anotación y no como ausencia clínica confirmada.

Los documentos de investigación, los archivos de vinculación y los PDF generados están excluidos de Git. El repositorio contiene el generador, no los registros de estudiantes. Las correlaciones y los intervalos suministrados en evidencias son exploratorios; no equivalen a pruebas causales ni a ajuste por variables de control.
