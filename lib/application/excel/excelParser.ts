import * as XLSX from 'xlsx';

export async function parseExcelFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  try {
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet);
  } catch {
    throw new Error('El archivo Excel no pudo ser leído. Verifica que sea un archivo .xlsx o .xls válido.');
  }
}
