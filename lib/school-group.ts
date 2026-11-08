export const REVIEW_GROUP = 'Por revisar'

const clean = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function schoolGroup(gradeValue: unknown, groupValue: unknown): string {
  const gradeText = clean(gradeValue).replace(/^(grado|curso)\s*/, '').replace(/^cuarto$/, '4').replace(/[°ºª]/g, '').trim()
  const grade = /^(?:[1-9]|1[01])$/.test(gradeText) ? Number(gradeText) : null
  const text = clean(groupValue).replace(/^(grupo|curso)\s*/, '').replace(/[°ºª]/g, '').replace(/\s+/g, '')
  // A full group designation must agree with a separately supplied grade.
  const pair = text.match(/^(0?[1-9]|1[01])[.,\-/]0?([1-5])$/)
    ?? text.match(/^(4)0([1-5])$/)
    ?? text.match(/^(4)([1-5])$/)
  if (pair) return grade !== null && grade !== Number(pair[1]) ? REVIEW_GROUP : `${Number(pair[1])}.${Number(pair[2])}`
  if (grade !== null && /^0?[1-5]$/.test(text)) return `${grade}.${Number(text)}`
  return REVIEW_GROUP
}
