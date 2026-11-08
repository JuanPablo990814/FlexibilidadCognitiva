import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib'
import { AnalysisData, LABELS, METRICS, statistics, Test } from './analysis'

const fmt = (n: number | null) => n === null ? 'SD' : n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
export type AcademicEvidence = { responses: number; diagnosisSummary?: { difference: number; lower: number; upper: number; nMarked: number; nUnmarked: number; method: string }; rows: { code: string; group: string; average: number | null; grades: (number | null)[]; stratum: number | null; source: string; links: string[]; tdahMarked?: boolean; diagnosisSource?: string }[] }
export async function createAnalysisReport(data: AnalysisData, academic?: AcademicEvidence) {
  const excludedTests = data.subjects.filter(s => s.isTest).length
  const accepted = new Set(data.subjects.filter(s => !s.isTest).map(s=>s.code))
  data = { ...data, subjects: data.subjects.filter(s=>!s.isTest), observations: data.observations.filter(r=>accepted.has(r.subject)) }
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  pdf.setTitle('Flexibilidad cognitiva y variables de control')
  pdf.setAuthor('Flexibilidad Cognitiva - Panel investigador')
  let page: PDFPage, y = 0
  const width = 842, height = 595, margin = 42, usable = width - margin * 2
  const ink = rgb(.15, .17, .16)
  const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022]/g, '-')
  function next() { page = pdf.addPage([width, height]); y = height - margin; page.drawText('Flexibilidad Cognitiva | Informe de investigación', { x: margin, y, size: 9, font: bold, color: ink }); y -= 30 }
  function wrap(value: string, space: number, size = 10) {
    const lines: string[] = []; let line = ''
    for (const word of safe(value).split(/\s+/)) {
      if (font.widthOfTextAtSize(`${line} ${word}`.trim(), size) > space && line) { lines.push(line); line = word } else line = `${line} ${word}`.trim()
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }
  function paragraph(text: string, size = 10, strong = false) {
    for (const line of wrap(text, usable, size)) { if (y < 58) next(); page.drawText(line, { x: margin, y, size, font: strong ? bold : font, color: ink }); y -= size * 1.5 }
    y -= 8
  }
  function heading(text: string) { if (y < 120) next(); paragraph(text, 15, true) }
  function table(headers: string[], rows: string[][]) {
    const cellWidth = usable / headers.length, size = headers.length > 7 ? 7.5 : 9
    function row(cells: string[], header = false, index = 0) {
      const lines = cells.map(c => wrap(c, cellWidth - 12, size))
      const h = Math.max(...lines.map(l => l.length)) * (size + 3) + 12
      if (y - h < 55) { next(); if (!header) row(headers, true) }
      const top = y
      page.drawRectangle({ x: margin, y: y - h, width: usable, height: h, color: header ? rgb(.99,.85,.14) : index % 2 ? rgb(.96,.97,.96) : rgb(1,1,1), borderColor: rgb(.82,.84,.82), borderWidth: .4 })
      lines.forEach((cell, col) => cell.forEach((line, i) => page.drawText(line, { x: margin + col * cellWidth + 6, y: top - 12 - i * (size + 3), font: header ? bold : font, size, color: ink })))
      y -= h
    }
    row(headers, true); rows.forEach((r, i) => row(r, false, i)); y -= 18
  }
  const observations = data.observations
  const get = (code: string, test: Test, metric: string) => observations.find(r => r.subject === code && r.test === test)?.values[metric] ?? null
  const stats = (test: Test, key: string) => statistics(observations.filter(r => r.test === test).map(r => r.values[key]))
  const numbered = new Map(data.subjects.map((s, i) => [s.code, String(s.number ?? i + 1).padStart(4, '0')]))
  next()
  heading('Flexibilidad cognitiva y variables de control')
  paragraph(`Informe cuantitativo e interpretación cualitativa. Fecha: ${new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}. Participantes registrados: ${data.subjects.length}. Evaluaciones completas seleccionadas: ${observations.length}.`)
  paragraph(`Se excluyeron ${excludedTests} fichas identificadas explícitamente como pruebas de la aplicación. Se conserva la numeración de las demás fichas; los saltos no significan datos perdidos. Las fichas pendientes de revisar por posible duplicación no equivalen necesariamente a personas distintas.`)
  paragraph('Se integra a todos los participantes accesibles con la sesión del investigador. Cada número se conserva en todas las tablas de este informe. El código de sujeto permite contrastar con la aplicación. Los registros potencialmente duplicados no se fusionan sin verificación.')
  heading('Método y alcance')
  paragraph('Se selecciona el intento completo más reciente de cada prueba por participante. Las evaluaciones incompletas permanecen representadas como SC en la matriz conjunta y no entran en los cálculos. SD significa indicador sin dato o no calculable; SC significa sin resultado completo disponible, lo que puede corresponder a una prueba no aplicada, incompleta o pendiente de calificación. No se imputan valores. El denominador válido se informa para cada indicador.')
  paragraph('La variable independiente solicitada se operacionaliza descriptivamente como flexibilidad reactiva (indicadores de Wisconsin) y espontánea (producción y diversidad en Cinco Puntos). Conners se utiliza como valoración docente de conductas asociadas al TDAH, no como diagnóstico. El sexo y el autoconcepto académico se consideran variables de control propuestas; el diseño disponible no permite establecer causalidad ni confirmar control estadístico de confusores.')
  heading('Disponibilidad de información')
  table(['Prueba', 'Participantes con resultado completo', 'Sin resultado completo'], Object.entries(LABELS).map(([test, name]) => { const count = observations.filter(r => r.test === test).length; return [name, String(count), String(data.subjects.length - count)] }))
  heading('Resultados cuantitativos generales')
  for (const test of Object.keys(LABELS) as Test[]) {
    heading(LABELS[test])
    table(['Indicador', 'N válido', 'Media', 'Mediana', 'DE muestral', 'Mínimo', 'Máximo'], METRICS[test].map(([key, label]) => { const s = stats(test, key); return [label, String(s.n), fmt(s.mean), fmt(s.median), fmt(s.sd), fmt(s.min), fmt(s.max)] }))
  }
  heading('Comparación entre los grupos de cuarto grado')
  paragraph('Se comparan exclusivamente los grupos 4.1 a 4.5. Los registros de otros grados o con grupo ambiguo se conservan en el informe general, pero se excluyen de esta comparación. Cada celda presenta media y N válido.')
  for (const [test, key, title, maximum] of [['wcst','categorias_completadas','Flexibilidad reactiva: criterios completados',6], ['cinco','unicos','Flexibilidad espontánea: diseños únicos',30], ['conners','total','Conductas observadas: Conners total',30], ['af5','academico_laboral','Autopercepción académica: AF5',99]] as [Test,string,string,number][]) {
    if (y < 230) next()
    heading(title)
    paragraph(`Promedio por grupo. Escala de 0 a ${maximum}; n indica participantes con dato válido. Los colores identifican grupos, no niveles clínicos.`,9)
    const colors = [rgb(.99,.85,.14),rgb(.96,.65,.83),rgb(.51,.79,.96),rgb(.46,.85,.70),rgb(.74,.65,.93)]
    ;['4.1','4.2','4.3','4.4','4.5'].forEach((group,i)=>{
      const s = statistics(observations.filter(r=>r.group===group && r.test===test).map(r=>r.values[key]))
      page.drawText(`Grupo ${group}`,{x:margin,y,size:9,font,color:ink})
      page.drawRectangle({x:margin+80,y:y-3,width:440,height:13,color:rgb(.94,.95,.94)})
      if (s.mean !== null && s.mean > 0) page.drawRectangle({x:margin+80,y:y-3,width:Math.min(s.mean/maximum,1)*440,height:13,color:colors[i]})
      page.drawText(s.n ? `${fmt(s.mean)} (n=${s.n})` : 'Sin datos completos',{x:margin+540,y,size:9,font,color:ink})
      y-=24
    })
    y-=16
  }
  for (const test of Object.keys(LABELS) as Test[]) {
    heading(LABELS[test])
    table(['Indicador', '4.1', '4.2', '4.3', '4.4', '4.5'], METRICS[test].map(([key,label]) => [label, ...['4.1','4.2','4.3','4.4','4.5'].map(group => { const s = statistics(observations.filter(r => r.test === test && r.group === group).map(r => r.values[key])); return s.n ? `${fmt(s.mean)} (n=${s.n})` : 'SD' })]))
  }
  heading('Variables de control')
  const sexes = ['Femenino', 'Masculino', 'Sin dato']
  table(['Sexo registrado', 'Participantes', 'WCST criterios: media (n)', 'Cinco Puntos únicos: media (n)', 'Conners total: media (n)', 'AF5 académico: media (n)'], sexes.map(sex => { const people = data.subjects.filter(s => (s.sex ?? 'Sin dato') === sex); return [sex, String(people.length), ...([['wcst','categorias_completadas'],['cinco','unicos'],['conners','total'],['af5','academico_laboral']] as [Test,string][]).map(([test,key]) => { const s = statistics(people.map(p => get(p.code,test,key))); return `${fmt(s.mean)} (n=${s.n})` })] }))
  paragraph(`${data.subjects.filter(s => !s.sex || s.sex === 'Sin dato').length} participantes carecen de sexo registrado. No se infiere el sexo a partir de nombres. AF5 académico refleja autopercepción del desempeño académico, no notas escolares ni rendimiento objetivo. Las comparaciones por sexo son descriptivas; no equivalen a ajustar un modelo por sexo.`)
  heading('Relaciones entre variables')
  paragraph('Se calculan correlaciones exploratorias de Spearman con pares completos de un mismo participante. Se usan rangos medios para empates; con menos de tres pares o sin variabilidad no se estima el coeficiente. No se calculan valores p ni se concluye significación estadística. Estas asociaciones no controlan otras variables ni prueban una relación causal.')
  const pairs: [Test,string,Test,string,string][] = [['wcst','categorias_completadas','conners','total','Flexibilidad reactiva y Conners'],['cinco','unicos','conners','total','Flexibilidad espontánea y Conners'],['wcst','categorias_completadas','af5','academico_laboral','Flexibilidad reactiva y autoconcepto académico'],['cinco','unicos','af5','academico_laboral','Flexibilidad espontánea y autoconcepto académico']]
  for (const [a, ak, b, bk, title] of pairs) {
    const values = data.subjects.map(p => [get(p.code,a,ak),get(p.code,b,bk)]).filter((p): p is [number,number] => p[0] !== null && p[1] !== null)
    const rho = spearman(values)
    paragraph(`${title}: ${values.length} pares completos. Rho = ${fmt(rho)}. ${rho === null ? 'Información insuficiente o sin variabilidad para estimar la asociación.' : `Se observa una asociación descriptiva ${rho > 0 ? 'positiva' : rho < 0 ? 'negativa' : 'nula'} en los pares disponibles; requiere cautela por la cobertura y el tamaño de muestra.`}`)
  }
  if (academic) {
    next(); heading('Calificaciones y estrato socioeconómico')
    const rows = academic.rows
    const matched = rows.filter(r=>r.stratum !== null && r.average !== null)
    paragraph(`Fuentes: doc/4.1.pdf a doc/4.5.pdf, consolidados escolares calendario 2026, y estratto socio economico.xlsx, hoja Respuestas de formulario 2. Se extrajeron ${rows.length} registros de calificaciones y ${academic.responses} respuestas de estrato. El promedio definitivo corresponde al corte que muestran los consolidados (periodos 1 y 2); no se interpreta como nota final anual. Dos promedios de cero acompañados exclusivamente de asignaturas vacías o en cero se marcan SD, por no acreditar una evaluación; se conservan en la matriz para revisión y no se consideran bajo rendimiento.`)
    paragraph(`Vinculación conservadora por igualdad de todos los términos del nombre (sin tildes y sin depender del orden), más el mismo grupo escolar. No se aceptan enlaces por similitud, nombres incompletos ni apellidos parecidos. En ${matched.length} estudiantes se vincularon notas y estrato; ${rows.length-matched.length} no tienen un par nota-estrato completo verificable. Las respuestas repetidas solo se resuelven si coinciden en estrato; las discrepancias requieren revisión. Los nombres, correos, direcciones y documentos de identidad se excluyen del PDF.`)
    paragraph('Se conservan los números de la aplicación cuando hay un único enlace inequívoco. Los códigos D identifican registros documentales sin enlace único; no deben tratarse como estudiantes adicionales a las fichas ya registradas. Las vinculaciones ambiguas pueden corresponder a varias fichas de una misma persona y no se elige una arbitrariamente.')
    const summary = (selected: typeof rows) => { const s=statistics(selected.map(r=>r.average)); return [String(s.n),fmt(s.mean),fmt(s.median),fmt(s.sd),fmt(s.min),fmt(s.max)] }
    table(['Población documental','N','Media','Mediana','DE','Mínimo','Máximo'], [['Todas las notas',...summary(rows)],['Con estrato enlazado',...summary(matched)],['Sin estrato enlazado',...summary(rows.filter(r=>r.stratum===null))]])
    heading('Desempeño académico por estrato')
    table(['Estrato','N con nota','Promedio','Mediana','DE','Mínimo','Máximo'], [1,2,3,4,5,6].map(k=>[String(k),...summary(rows.filter(r=>r.stratum===k))]))
    const rho = spearman(matched.map(r=>[r.stratum!,r.average!] as [number,number]))
    paragraph(`Relación ordinal entre estrato y promedio: rho de Spearman = ${fmt(rho)}, con ${matched.length} pares completos. No se estiman significación ni efectos causales. El estrato residencial es un indicador contextual; no equivale al ingreso familiar ni determina las capacidades del estudiante.`)
    heading('Comparación por grupo y estrato')
    table(['Grupo','N total','Media total','Estrato 1','Estrato 2','Estrato 3','Estrato 4','Estrato 5'], ['4.1','4.2','4.3','4.4','4.5'].map(group=>{const g=rows.filter(r=>r.group===group);return [group,String(g.length),fmt(statistics(g.map(r=>r.average)).mean),...[1,2,3,4,5].map(k=>{const s=statistics(g.filter(r=>r.stratum===k).map(r=>r.average));return `${fmt(s.mean)} (n=${s.n})`})]}))
    heading('Resultados por asignatura')
    table(['Asignatura','N de notas','Media general','Media con estrato enlazado'], ['C.NAT','HUMAN','MATEM','TECINF','INGLÉS','C.SOC','ARTIST','EDUFIS','ÉTICA','RELIG','EMPREN'].map((label,i)=>{const s=statistics(rows.map(r=>r.grades[i]));return [label,String(s.n),fmt(s.mean),fmt(statistics(matched.map(r=>r.grades[i])).mean)]}))
    heading('Calificaciones y características asociadas al TDAH')
    const paired=rows.filter(r=>r.links.length===1 && get(r.links[0],'conners','total')!==null)
    paragraph(`Se encontraron ${paired.length} estudiantes con calificación y Conners completo inequívocamente vinculados. Las valoraciones sintéticas se excluyen. Para la comparación documental se utiliza ahora la anotación TDAH en los cinco DOCX de diagnóstico aportados, no el cuestionario general Sí/No ni una inferencia a partir de las notas.`)
    paragraph('Fuentes nuevas: 4.1 DIAGNOSTICO.docx, 4.2 DIAGNOSTICO.docx, 4.3 DIAGNOSTICO.docx, 4.4 CON DIAGNOSTICO.docx y 4.5 DIAGNOSTICO.docx. Se revisaron las tablas de cada documento y todas las filas de cada estudiante, porque la marca puede aparecer únicamente junto al segundo periodo. Se enlazaron los 192 estudiantes por nombre completo y grupo, sin discrepancias en los promedios utilizables respecto a los PDF escolares. Los listados son una fuente educativa; no se aportaron certificados ni criterios clínicos de diagnóstico.')
    next(); heading('Variable dependiente: rendimiento académico')
    paragraph('Definición operativa. El rendimiento académico se representa por el promedio definitivo consignado en el consolidado escolar del corte de 2026 y, como indicadores complementarios, por las notas definitivas de cada asignatura. Se utiliza el valor publicado por la institución, sin recalcular ponderaciones ni interpretarlo como promedio final del año. AF5 académico mide autopercepción y no sustituye esta variable dependiente.')
    const gradeStats = statistics(rows.map(r=>r.average))
    paragraph(`Descripción del resultado académico: ${rows.length} estudiantes en los consolidados; ${gradeStats.n} promedios utilizables y ${rows.length-gradeStats.n} sin promedio verificable. Media ${fmt(gradeStats.mean)}, mediana ${fmt(gradeStats.median)}, desviación estándar muestral ${fmt(gradeStats.sd)}, mínimo ${fmt(gradeStats.min)} y máximo ${fmt(gradeStats.max)}. Los espacios vacíos y los ceros documentales sin evaluación se conservan como SD y se excluyen del cálculo.`)
    heading('Comparación según clasificación de TDAH')
    paragraph('Se distinguen tres estados: marca explícita TDAH, ausencia de esa anotación en un listado revisado y clasificación no disponible cuando no existe documento enlazable. El segundo estado no demuestra ausencia clínica de TDAH. Se compara el grupo marcado con el grupo sin marca; este es el alcance de la clasificación disponible y no un diagnóstico realizado por la aplicación.')
    const marked=rows.filter(r=>r.tdahMarked===true), unmarked=rows.filter(r=>r.tdahMarked===false)
    table(['Clasificación en fuente','N registrado','N con nota','Media','Mediana','DE'], [marked,unmarked,rows.filter(r=>r.tdahMarked===undefined)].map((list,i)=>{const s=statistics(list.map(r=>r.average));return [['Marca TDAH','Sin anotación TDAH','Sin documento enlazable'][i],String(list.length),String(s.n),fmt(s.mean),fmt(s.median),fmt(s.sd)]}))
    if (y < 160) next()
    paragraph('Promedio académico por grupo documental. Barras desde cero, escala visual 0-5.',10,true)
    ;[marked,unmarked].forEach((list,i)=>{
      const s=statistics(list.map(r=>r.average))
      page.drawText(i===0?'Marca TDAH':'Sin anotación TDAH',{x:margin,y,size:9,font,color:ink})
      page.drawRectangle({x:margin+145,y:y-3,width:350,height:17,color:rgb(.94,.95,.94)})
      if(s.mean!==null)page.drawRectangle({x:margin+145,y:y-3,width:s.mean/5*350,height:17,color:i===0?rgb(.99,.85,.14):rgb(.51,.79,.96)})
      page.drawText(`${fmt(s.mean)} (n=${s.n})`,{x:margin+515,y,size:10,font:bold,color:ink});y-=29
    });y-=10
    if (academic.diagnosisSummary) {
      const d=academic.diagnosisSummary
      paragraph(`Diferencia de promedios (marca TDAH menos sin marca): ${fmt(d.difference)} puntos. Intervalo percentil exploratorio del 95% por bootstrap: ${d.lower.toFixed(4)} a ${d.upper.toFixed(4)}. Método: ${d.method}. Se remuestrea dentro de cada grupo por estudiante. El intervalo incluye cero: no respalda una diferencia concluyente y no constituye un efecto causal. La dependencia dentro de cursos no se modeló; no se interpreta como inferencia poblacional confirmatoria.`)
    }
    heading('Comparación del rendimiento dentro de cada grupo escolar')
    table(['Grupo','Marca TDAH: N con nota','Media TDAH','Sin marca: N con nota','Media sin marca','Diferencia'], ['4.1','4.2','4.3','4.4','4.5'].map(group=>{const a=statistics(marked.filter(r=>r.group===group).map(r=>r.average)),b=statistics(unmarked.filter(r=>r.group===group).map(r=>r.average));return [group,String(a.n),fmt(a.mean),String(b.n),fmt(b.mean),fmt(a.mean!==null && b.mean!==null?a.mean-b.mean:null)]}))
    heading('Calificaciones por asignatura según la marca TDAH')
    table(['Asignatura','N TDAH','Media TDAH','N sin marca','Media sin marca','Diferencia'], ['C.NAT','HUMAN','MATEM','TECINF','INGLÉS','C.SOC','ARTIST','EDUFIS','ÉTICA','RELIG','EMPREN'].map((label,i)=>{const a=statistics(marked.map(r=>r.grades[i])),b=statistics(unmarked.map(r=>r.grades[i]));return [label,String(a.n),fmt(a.mean),String(b.n),fmt(b.mean),fmt(a.mean!==null && b.mean!==null?a.mean-b.mean:null)]}))
    heading('Relación con estrato y otras variables de control')
    paragraph(`Se dispone de ${matched.length} pares completos de calificación y estrato: ${matched.filter(r=>r.tdahMarked===true).length} tienen marca TDAH y ${matched.filter(r=>r.tdahMarked===false).length} no tienen esa anotación. Las diferencias por estrato se calculan solo cuando hay datos de ambos grupos. Los estratos sin casos marcados no permiten contraste; un estrato con un solo caso tampoco permite generalizar.`)
    table(['Estrato','N TDAH','Media TDAH','N sin marca','Media sin marca','Diferencia'],[1,2,3,4,5,6].map(k=>{const a=statistics(marked.filter(r=>r.stratum===k).map(r=>r.average)),b=statistics(unmarked.filter(r=>r.stratum===k).map(r=>r.average));return [String(k),String(a.n),fmt(a.mean),String(b.n),fmt(b.mean),fmt(a.mean!==null&&b.mean!==null?a.mean-b.mean:null)]}))
    paragraph('Esta estratificación es descriptiva y no equivale a un efecto estadísticamente ajustado. Faltan datos de sexo y hay cobertura insuficiente de autoconcepto académico para un modelo multivariable. La proporción reducida de estratos enlazados, los tamaños pequeños y la posible agrupación por aula limitan cualquier interpretación. El estrato residencial no representa por sí solo el ingreso del hogar.')
    heading('Conclusión cuantitativa y lectura cualitativa')
    paragraph(`Con ${statistics(marked.map(r=>r.average)).n} promedios del grupo marcado y ${statistics(unmarked.map(r=>r.average)).n} del grupo sin anotación, las medias son ${fmt(statistics(marked.map(r=>r.average)).mean)} y ${fmt(statistics(unmarked.map(r=>r.average)).mean)}, respectivamente. Se observa una diferencia descriptiva de ${fmt((statistics(marked.map(r=>r.average)).mean??0)-(statistics(unmarked.map(r=>r.average)).mean??0))} puntos. Las notas del primer grupo son menores en promedio en este corte, sin demostrar que el TDAH cause esa diferencia. El intervalo exploratorio abarca cero y los registros sin marca no constituyen un grupo clínicamente confirmado sin TDAH.`)
    paragraph('La lectura cualitativa reconoce variabilidad individual: una marca TDAH no implica necesariamente bajo rendimiento y no autoriza inferir incapacidad a partir de la nota. Las comparaciones por asignatura y aula orientan una revisión educativa, no decisiones automáticas sobre estudiantes. Los cruces por estrato son escasos; no permiten afirmar que el contexto socioeconómico explique la diferencia global ni que la elimine. No se aportaron entrevistas para comprobar explicaciones sobre apoyo familiar, hábitos o adaptaciones pedagógicas.')
    heading('Análisis cualitativo e interpretación contextual')
    paragraph(`La media general de las notas definitivas del corte es ${fmt(statistics(rows.map(r=>r.average)).mean)}. En los casos con estrato verificable se observan promedios distintos entre estratos; estas diferencias describen únicamente el subconjunto enlazado y no un efecto socioeconómico. La ausencia de pares nota-estrato completos en ${rows.length-matched.length} registros puede producir sesgo de selección. Los estratos con muy pocos estudiantes no permiten generalizar sus promedios.`)
    paragraph('El estrato se propone como variable interviniente contextual, pero aquí no queda estadísticamente controlado. Las notas dependen de múltiples condiciones no medidas; no se atribuyen sus diferencias a recursos familiares, apoyo parental o TDAH sin evidencia adicional. La interpretación cualitativa es narrativa de tablas cuantitativas y no análisis de entrevistas. La autopercepción académica (AF5) y las calificaciones observadas son constructos diferentes.')
    heading('Relaciones con flexibilidad y autoconcepto')
    paragraph('Comparación descriptiva de flexibilidad reactiva según la anotación del listado, únicamente en las fichas de la app con enlace único. Se excluyen los enlaces ambiguos para no duplicar personas.')
    table(['Grupo documental','N con WCST','Media de criterios','Media de errores perseverativos'],[marked,unmarked].map((list,i)=>{const linked=list.filter(r=>r.links.length===1);const a=statistics(linked.map(r=>get(r.links[0],'wcst','categorias_completadas'))),b=statistics(linked.map(r=>get(r.links[0],'wcst','errores_perseverativos')));return [i===0?'Marca TDAH':'Sin anotación TDAH',String(a.n),fmt(a.mean),`${fmt(b.mean)} (n=${b.n})`]}))
    for (const [test,key,label] of [['wcst','categorias_completadas','Criterios de Wisconsin'],['af5','academico_laboral','Autoconcepto académico AF5']] as [Test,string,string][]) {
      const pairs=rows.filter(r=>r.links.length===1 && r.average!==null && get(r.links[0],test,key)!==null).map(r=>[r.average!,get(r.links[0],test,key)!] as [number,number])
      paragraph(`${label} frente a notas definitivas: ${pairs.length} pares con vinculación única; rho = ${fmt(spearman(pairs))}. Las fichas repetidas o ambiguas no se incluyen en esta relación. Los resultados son exploratorios y no se ajustan por sexo o estrato.`)
    }
    heading('Matriz documental de calificaciones y estrato')
    paragraph('SD conserva un dato faltante. La columna Vinculación indica códigos de la app; varias fichas para una persona requieren revisión. Fuente identifica grupo y página del consolidado original. No se fusionan los conteos de esta matriz con las fichas de la app.')
    table(['N.º o código','Grupo','Marca TDAH','Promedio definitivo','Matemáticas','Humanidades','Estrato','Vinculación en app','Fuente'], rows.map(r=>[r.code,r.group,r.tdahMarked===true?'Sí':r.tdahMarked===false?'Sin anotación':'SD',fmt(r.average),fmt(r.grades[2]),fmt(r.grades[1]),r.stratum===null?'SD':String(r.stratum),r.links.length===1?r.links[0]:r.links.length>1?`${r.links.length} fichas: revisar`:'Sin enlace exacto',r.source]))
    next()
  }
  heading('Interpretación cualitativa de los resultados cuantitativos')
  const reactive = stats('wcst','categorias_completadas'), errors = stats('wcst','errores_perseverativos'), spontaneous = stats('cinco','unicos'), conners = stats('conners','total'), academicStats = stats('af5','academico_laboral')
  paragraph(`Flexibilidad reactiva. ${reactive.n ? `En ${reactive.n} participantes, el promedio de criterios completados fue ${fmt(reactive.mean)} de 6; la media de errores perseverativos fue ${fmt(errors.mean)} (n=${errors.n}). Los criterios completados describen el logro de reglas de clasificación y los errores perseverativos orientan la revisión de respuestas que persisten al cambiar las condiciones. Ambos indicadores deben leerse juntos.` : 'No hay resultados completos de Wisconsin para describir adaptación a cambios de criterio.'} No se asignan niveles de capacidad ni déficits sin baremos de la versión y edad correspondientes.`)
  paragraph(`Flexibilidad espontánea. ${spontaneous.n ? `Hay ${spontaneous.n} producciones calificadas, con una media de ${fmt(spontaneous.mean)} diseños únicos. Esto describe diversidad de producción figural bajo las condiciones de la tarea.` : 'No hay producciones completas y calificadas de Cinco Puntos; no es posible concluir sobre diversidad o flexibilidad espontánea.'} La fluidez figural es una aproximación operativa y no una medida única de toda la flexibilidad espontánea.`)
  paragraph(`Conductas asociadas al TDAH. ${conners.n ? `Se dispone de ${conners.n} valoraciones docentes completas, con media ${fmt(conners.mean)} en la escala 0-30 utilizada por la aplicación.` : 'No se dispone de valoraciones docentes completas.'} Estos datos describen observaciones del docente y no permiten estimar prevalencia, confirmar TDAH o atribuirle diferencias en flexibilidad. El diagnóstico requiere valoración profesional y varias fuentes de información [1].`)
  paragraph(`Autoconcepto académico. ${academicStats.n ? `Hay ${academicStats.n} resultados válidos, con media ${fmt(academicStats.mean)} en la escala almacenada 0-99.` : 'No hay resultados válidos disponibles.'} Representa la percepción del propio desempeño; no permite afirmar que el participante tenga mejores o peores calificaciones. La ausencia de sexo y el posible solapamiento reducido entre pruebas limitan su uso como controles.`)
  heading('Conclusiones y límites del estudio')
  paragraph('Los datos permiten describir el desempeño observado en las pruebas con registros completos y contrastar sus promedios entre grupos. La proporción de registros faltantes y el N de cada variable condicionan el alcance de cualquier comparación. Un promedio de grupo no describe a todos sus integrantes. No se combinan las escalas en un índice global ni se consideran los espacios vacíos como bajo desempeño.')
  paragraph('La flexibilidad reactiva y espontánea deben informarse por separado. La relación con Conners y con el autoconcepto académico solo puede explorarse en los participantes que tienen ambas mediciones. No puede concluirse que la flexibilidad cause TDAH o cambios de autoconcepto. Se requiere completar las calificaciones pendientes, registrar el sexo mediante un procedimiento autorizado, verificar duplicados y confirmar versión, normas y condiciones de aplicación antes de inferencias o ajuste estadístico.')
  paragraph('El componente cualitativo de este documento es interpretación narrativa de indicadores cuantitativos. No constituye un estudio cualitativo empírico: no se han recogido ni codificado entrevistas, relatos u observaciones abiertas para un análisis temático.')
  heading('Fuentes y criterio documental')
  paragraph('Documento de referencia: analisis doctorado.docx, aportado por el investigador. Sus tablas de ejemplo no se utilizan como resultados reales. [1] CDC. Diagnosing ADHD: https://www.cdc.gov/adhd/diagnosis/ [2] Five-point Test, estudio de fiabilidad y validez: https://pubmed.ncbi.nlm.nih.gov/23029395/ Las reglas de puntuación específicas deben contrastarse con los manuales de las versiones administradas.')
  next(); heading('Matriz conjunta de todos los participantes')
  paragraph('El mismo número identifica a cada participante en todo el PDF. SC = sin resultado completo. SD = sin dato. Los espacios sin completar se conservan con estos códigos y no se incluyen en los estadísticos.')
  table(['N.º', 'Código en app', 'Grupo', 'Sexo', 'WCST criterios', 'Cinco Puntos únicos', 'Conners total', 'AF5 académico', 'CAR metas'], data.subjects.map(s => [numbered.get(s.code)!,s.code,s.group,s.sex ?? 'Sin dato', ...([['wcst','categorias_completadas'],['cinco','unicos'],['conners','total'],['af5','academico_laboral'],['car','metas']] as [Test,string][]).map(([test,key]) => observations.some(r=>r.subject===s.code && r.test===test) ? fmt(get(s.code,test,key)) : 'SC')]))
  for (const test of Object.keys(LABELS) as Test[]) {
    next(); heading(`Resultados individuales completos - ${LABELS[test]}`)
    const records = observations.filter(r => r.test === test).sort((a,b)=>Number(numbered.get(a.subject))-Number(numbered.get(b.subject)))
    if (!records.length) paragraph('Sin resultados completos disponibles. Los participantes sin esta evaluación figuran como SC en la matriz conjunta.')
    else table(['N.º', 'Grupo', ...METRICS[test].map(([,label])=>label)], records.map(r=>[numbered.get(r.subject)!,r.group,...METRICS[test].map(([key])=>fmt(r.values[key]))]))
  }
  next(); heading('Alertas de calidad de los datos')
  paragraph('Las alertas se refieren a registros y no a diagnósticos. Los conteos de registros pueden incluir varios intentos de una persona. Las posibles fichas duplicadas requieren revisión; no se consideran automáticamente participantes diferentes ni se fusionan sin evidencia.')
  const quality = new Map<string, { group: string; message: string; count: number }>()
  for (const alert of data.alerts) {
    const message = alert.message.startsWith('Posible ficha duplicada') ? 'Posibles fichas duplicadas: consultar los códigos relacionados en las alertas del panel antes de interpretar el número de participantes distintos.' : alert.message
    const key = `${alert.group}|${message}`
    const item = quality.get(key) ?? { group: alert.group, message, count: 0 }
    item.count++; quality.set(key,item)
  }
  paragraph('Resumen por tipo de alerta y grupo. El conteo indica entradas de alerta; una persona puede generar varias. El detalle nominal anonimizado está disponible en el panel de revisión.')
  table(['Entradas de alerta', 'Grupo', 'Revisión necesaria'], Array.from(quality.values()).map(a=>[String(a.count),a.group,a.message]))
  for (const [i,p] of Array.from(pdf.getPages().entries())) p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:width-margin-55,y:25,size:8,font,color:ink})
  return pdf.save()
}

export function spearman(pairs: [number,number][]): number | null {
  if (pairs.length < 3) return null
  const ranks = (axis:number) => pairs.map(p=> { const lower = pairs.filter(q=>q[axis]<p[axis]).length; const equal=pairs.filter(q=>q[axis]===p[axis]).length; return lower+(equal+1)/2 })
  const x=ranks(0),y=ranks(1),mean=(pairs.length+1)/2
  const numerator=x.reduce((s,v,i)=>s+(v-mean)*(y[i]-mean),0)
  const denominator=Math.sqrt(x.reduce((s,v)=>s+(v-mean)**2,0)*y.reduce((s,v)=>s+(v-mean)**2,0))
  return denominator ? numerator/denominator : null
}
