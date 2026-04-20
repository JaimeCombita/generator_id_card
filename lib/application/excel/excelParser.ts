import * as XLSX from 'xlsx';

function parseWorksheetRows(worksheet: XLSX.WorkSheet): any[] {
  const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  return sheetRows.filter((row) =>
    Object.values(row as Record<string, unknown>).some((value) => String(value).trim() !== ''),
  );
}

export async function parseExcelFile(file: File, selectedSheetNames?: string[]): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  try {
    const workbook = XLSX.read(buffer);
    const requestedSheets = (selectedSheetNames ?? [])
      .map((name) => String(name).trim())
      .filter((name) => workbook.SheetNames.includes(name));

    const effectiveSheets = requestedSheets.length > 0
      ? requestedSheets
      : workbook.SheetNames.slice(0, 1);

    const rows = effectiveSheets.flatMap((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      return parseWorksheetRows(worksheet);
    });

    return rows;
  } catch {
    throw new Error('El archivo Excel no pudo ser leído. Verifica que sea un archivo .xlsx o .xls válido.');
  }
}
