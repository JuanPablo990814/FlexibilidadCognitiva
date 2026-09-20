'use client'

export default function ExportExcelButton() {
  return (
    <a
      href="/api/export-resultados"
      download="Resultados_evaluaciones.xlsx"
      className="site-button text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Exportar a Excel
    </a>
  )
}
