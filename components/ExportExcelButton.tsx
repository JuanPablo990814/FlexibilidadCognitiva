'use client'

import * as XLSX from 'xlsx'

export default function ExportExcelButton({ data, filename = 'Resultados_evaluaciones.xlsx' }: { data: any[], filename?: string }) {
  const exportToExcel = () => {
    // Preparar los datos para el Excel
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados")

    // Generar archivo y descargar
    XLSX.writeFile(workbook, filename)
  }

  return (
    <button 
      onClick={exportToExcel}
      className="site-button text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Exportar a Excel
    </button>
  )
}
