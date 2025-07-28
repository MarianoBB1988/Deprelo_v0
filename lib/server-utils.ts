// Utility para importaciones dinámicas del lado del servidor
export async function createPDF() {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  
  // Extender jsPDF con autoTable
  ;(jsPDF as any).API.autoTable = autoTable
  
  return { jsPDF, autoTable }
}

export async function createExcel() {
  const XLSX = await import('xlsx')
  return XLSX
}
