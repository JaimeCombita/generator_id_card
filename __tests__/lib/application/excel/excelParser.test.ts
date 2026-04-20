import * as XLSX from 'xlsx';
import { parseExcelFile } from '@/lib/application/excel/excelParser';

function makeExcelFile(rows: Record<string, unknown>[]): File {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return new File([buffer], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('parseExcelFile', () => {
  it('parses a simple Excel file and returns rows as objects', async () => {
    const rows = [
      { nombres: 'Juan Perez', curso: '5A', identificacion: '1001234567' },
      { nombres: 'Maria Lopez', curso: '6B', identificacion: '1009876543' },
    ];
    const file = makeExcelFile(rows);
    const result = await parseExcelFile(file);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ nombres: 'Juan Perez', curso: '5A' });
    expect(result[1]).toMatchObject({ nombres: 'Maria Lopez', curso: '6B' });
  });

  it('returns an empty array for a sheet with no data rows', async () => {
    const file = makeExcelFile([]);
    const result = await parseExcelFile(file);
    expect(result).toEqual([]);
  });

  it('preserves all columns from the spreadsheet', async () => {
    const rows = [{ nombres: 'Ana', curso: '3C', identificacion: '100', extra: 'value' }];
    const file = makeExcelFile(rows);
    const result = await parseExcelFile(file);
    expect(result[0]).toHaveProperty('extra', 'value');
  });

  it('reads only from the first sheet by default', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ nombres: 'First Sheet' }]),
      'Sheet1',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ nombres: 'Second Sheet' }]),
      'Sheet2',
    );
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const file = new File([buffer], 'multi.xlsx');
    const result = await parseExcelFile(file);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ nombres: 'First Sheet' });
  });

  it('reads and merges rows from selected sheets', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ nombres: 'First Sheet' }]),
      'Sheet1',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ nombres: 'Second Sheet' }]),
      'Sheet2',
    );
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const file = new File([buffer], 'multi.xlsx');
    const result = await parseExcelFile(file, ['Sheet1', 'Sheet2']);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ nombres: 'First Sheet' });
    expect(result[1]).toMatchObject({ nombres: 'Second Sheet' });
  });
});
