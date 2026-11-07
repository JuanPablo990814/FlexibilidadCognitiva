const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/analysis.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const compiled = { exports: {} }
new Function('exports', 'module', code)(compiled.exports, compiled)
const { buildAnalysis, statistics, numeric, groupOf } = compiled.exports
const student = (id, user = 'u') => ({ id_consentimiento: id, id_usuario: user, nombre_estudiante: `Privado ${id}`, grupo_estudiante: '1', grado_estudiante: '4°' })
const empty = () => ({ wcst: [], cinco: [], af5: [], conners: [], car: [] })
const record = (extra = {}) => ({ id_resultado: 'r', id_consentimiento: 's', fecha_evaluacion: '2026-11-01T12:00:00Z', ...extra })

test('statistics retain true zeros, omit missing values, and use sample deviation', () => {
  const s = statistics([0, 2, null, 4])
  assert.deepEqual(s, { n: 3, mean: 2, median: 2, sd: 2, min: 0, max: 4 })
  assert.equal(statistics([]).mean, null)
  assert.equal(statistics([5]).sd, null)
  for (const value of [null, undefined, '', ' ', true, -1, Infinity]) assert.equal(numeric(value), null)
  assert.equal(numeric('0'), 0)
})
test('groups are normalized without repeating the grade', () => {
  assert.equal(groupOf(student('s')), '4.1')
  assert.equal(groupOf({ grupo_estudiante: '4,2', grado_estudiante: '4' }), '4.2')
})
test('selects latest attempt once and calculates Wisconsin percentages using distinct denominators', () => {
  const records = empty()
  records.wcst = [record({ fecha_evaluacion: '2026-10-01', categorias_completadas: 1 }), record({ id_resultado: 'new', total_ensayos: 10, total_aciertos: 6, total_errores: 4, errores_perseverativos: 3, errores_no_perseverativos: 1, categorias_completadas: 2, fallos_al_mantener: 0 })]
  const data = buildAnalysis([student('s')], records)
  assert.equal(data.observations.length, 1)
  assert.equal(data.observations[0].values.categorias_completadas, 2)
  assert.equal(data.observations[0].values.aciertos_pct, 60)
  assert.equal(data.observations[0].values.perseveracion_pct, 75)
  assert.match(data.alerts[0].message, /2 intentos/)
  assert.ok(!JSON.stringify(data).includes('Privado'))
})
test('unfinished Five Points classifications are not reported as zero errors or unique designs', () => {
  const records = empty()
  records.cinco = [record({ figuras_completadas: 3, tiempo_segundos: 60, evaluacion: ['unico', 'pendiente', 'repetido'] })]
  const result = buildAnalysis([student('s')], records).observations[0]
  assert.equal(result.values.unicos, null)
  assert.equal(result.values.infracciones, null)
  assert.equal(result.values.figuras_completadas, 3)
  records.cinco[0].evaluacion = ['unico', 'repetido', 'infraccion']
  assert.equal(buildAnalysis([student('s')], records).observations[0].values.infracciones, 1)
})
test('ambiguous account-level CAR results cannot be assigned to one of several children', () => {
  const records = empty()
  records.car = [record({ id_consentimiento: null, id_usuario: 'u', metas: 18 })]
  const ambiguous = buildAnalysis([student('s'), student('s2')], records)
  assert.equal(ambiguous.observations.length, 0)
  assert.match(ambiguous.alerts[0].message, /sin estudiante identificable/)
  assert.equal(buildAnalysis([student('s')], records).observations[0].values.metas, 18)
})
test('flags duplicate consent forms, inconsistent trials, and excludes out-of-range Conners', () => {
  const records = empty()
  records.conners = [record({ total: 31 })]
  records.wcst = [record({ total_ensayos: 64, total_aciertos: 40, total_errores: 20 })]
  const a = student('s'); const b = { ...student('s2'), nombre_estudiante: a.nombre_estudiante }
  const data = buildAnalysis([a, b], records)
  assert.ok(data.alerts.some(a => a.message.includes('duplicada')))
  assert.ok(data.alerts.some(a => a.message.includes('no coinciden')))
  assert.equal(data.observations.find(r => r.test === 'conners').values.total, null)
})
