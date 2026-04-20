'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/infrastructure/logging/logger';

interface ExcelUploaderProps {
  onFileSelect: (file: File | null) => void;
  onDataParsed: (data: any[]) => void;
  onSheetsChange?: (selectedSheets: string[]) => void;
  credentialLevel: 'student' | 'business';
  stepNumber?: number;
}

type ReadStatus = 'idle' | 'reading' | 'success' | 'error';

function parseWorksheetRows(worksheet: XLSX.WorkSheet): any[] {
  const sheetRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  return sheetRows.filter((row) =>
    Object.values(row).some((value) => String(value).trim() !== ''),
  );
}

export default function ExcelUploader({
  onFileSelect,
  onDataParsed,
  onSheetsChange,
  credentialLevel,
  stepNumber = 1,
}: ExcelUploaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [rowsBySheet, setRowsBySheet] = useState<Record<string, any[]>>({});
  const [hasTriedParse, setHasTriedParse] = useState(false);
  const [readStatus, setReadStatus] = useState<ReadStatus>('idle');

  const validateAndEmitParsedData = (
    selectedSheetNames: string[],
    sourceRowsBySheet: Record<string, any[]>,
  ) => {
    const data = selectedSheetNames.flatMap((sheetName) => sourceRowsBySheet[sheetName] ?? []);

    if (data.length === 0) {
      setError('Las hojas seleccionadas no contienen registros.');
      onDataParsed([]);
      return;
    }

    const roleColumn = credentialLevel === 'business' ? 'cargo' : 'curso';
    const requiredColumns = ['nombres', roleColumn, 'identificacion'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(
      (col) => !(col in firstRow),
    );

    if (missingColumns.length > 0) {
      setError(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
      onDataParsed([]);
      return;
    }

    setError('');
    onDataParsed(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      onFileSelect(null);
      setFileName('');
      setHasTriedParse(false);
      setReadStatus('idle');
      setSheetNames([]);
      setSelectedSheets([]);
      setRowsBySheet({});
      onDataParsed([]);
      onSheetsChange?.([]);
      return;
    }

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Por favor, sube un archivo Excel válido (.xlsx o .xls)');
      setReadStatus('error');
      onFileSelect(null);
      setFileName('');
      setHasTriedParse(false);
      setSheetNames([]);
      setSelectedSheets([]);
      setRowsBySheet({});
      onSheetsChange?.([]);
      return;
    }

    setFileName(file.name);
    setHasTriedParse(true);
    setReadStatus('reading');
    onFileSelect(file);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sourceRowsBySheet = workbook.SheetNames.reduce<Record<string, any[]>>((acc, sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        acc[sheetName] = parseWorksheetRows(worksheet);
        return acc;
      }, {});

      const hasAnyRows = Object.values(sourceRowsBySheet).some((rows) => rows.length > 0);
      if (!hasAnyRows) {
        setError('El archivo Excel está vacío');
        setReadStatus('error');
        onDataParsed([]);
        setSheetNames(workbook.SheetNames);
        setSelectedSheets([]);
        setRowsBySheet(sourceRowsBySheet);
        onSheetsChange?.([]);
        return;
      }

      const defaultSelectedSheets = workbook.SheetNames.slice(0, 1);
      setSheetNames(workbook.SheetNames);
      setSelectedSheets(defaultSelectedSheets);
      setRowsBySheet(sourceRowsBySheet);
      onSheetsChange?.(defaultSelectedSheets);
      validateAndEmitParsedData(defaultSelectedSheets, sourceRowsBySheet);
      setReadStatus('success');
    } catch (err) {
      setError('Error al leer el archivo Excel');
      setReadStatus('error');
      onDataParsed([]);
      setHasTriedParse(true);
      setSheetNames([]);
      setSelectedSheets([]);
      setRowsBySheet({});
      onSheetsChange?.([]);
      logger.error('Excel parsing failed in uploader', {
        scope: 'upload.excel',
        error: err,
      });
    }
  };

  const handleSheetToggle = (sheetName: string, checked: boolean) => {
    const nextSelectedSheets = checked
      ? Array.from(new Set([...selectedSheets, sheetName]))
      : selectedSheets.filter((name) => name !== sheetName);

    if (nextSelectedSheets.length === 0) {
      setError('Selecciona al menos una hoja.');
      return;
    }

    setSelectedSheets(nextSelectedSheets);
    onSheetsChange?.(nextSelectedSheets);
    validateAndEmitParsedData(nextSelectedSheets, rowsBySheet);
  };

  useEffect(() => {
    if (selectedSheets.length === 0 || Object.keys(rowsBySheet).length === 0) {
      return;
    }

    validateAndEmitParsedData(selectedSheets, rowsBySheet);
  }, [credentialLevel]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {stepNumber}. Archivo Excel
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        📊 Columnas requeridas: <span className="font-semibold text-gray-800">nombres, {credentialLevel === 'business' ? 'cargo' : 'curso'}, identificacion</span>
        <span className="block sm:inline text-gray-500 sm:before:content-['•'] sm:before:mx-2">sin columna de foto</span>
      </p>

      <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 sm:p-6 md:p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 px-2">
            {fileName || 'Haz clic para seleccionar el archivo Excel'}
          </span>
          {!fileName && (
            <span className="text-xs text-gray-500 mt-1">
              Formatos: .xlsx, .xls
            </span>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs sm:text-sm text-red-700 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {fileName && !error && (
        <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-xs sm:text-sm text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>Archivo cargado:</strong> {fileName}
            {sheetNames.length > 0 && (
              <span> • <strong>Hojas detectadas:</strong> {sheetNames.length}</span>
            )}
          </span>
        </div>
      )}

      {(hasTriedParse || readStatus === 'reading') && (
        <div className="mt-3 p-3 rounded-lg text-xs sm:text-sm border bg-white">
          <span className="font-semibold text-gray-700">Estado de lectura: </span>
          {readStatus === 'reading' && (
            <span className="text-blue-700">Leyendo archivo Excel...</span>
          )}
          {readStatus === 'success' && (
            <span className="text-green-700">Lectura completada correctamente.</span>
          )}
          {readStatus === 'error' && (
            <span className="text-red-700">No fue posible completar la lectura.</span>
          )}
          {readStatus === 'idle' && (
            <span className="text-gray-600">Sin archivo cargado.</span>
          )}
        </div>
      )}

      {fileName && (
        <div className="mt-4 p-3 sm:p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
          {sheetNames.length > 0 ? (
            <>
              <p className="text-xs sm:text-sm font-semibold text-indigo-800 mb-2">
                Hojas detectadas ({sheetNames.length})
              </p>
              <p className="text-xs text-indigo-700 mb-3">
                Por defecto se usa solo la primera hoja. Puedes seleccionar una o varias.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sheetNames.map((sheetName) => {
                  const isChecked = selectedSheets.includes(sheetName);
                  const rowCount = (rowsBySheet[sheetName] ?? []).length;

                  return (
                    <label
                      key={sheetName}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-indigo-200 rounded-lg"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => handleSheetToggle(sheetName, event.target.checked)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-xs sm:text-sm text-gray-800 truncate" title={sheetName}>
                          {sheetName}
                        </span>
                      </span>
                      <span className="text-[11px] sm:text-xs text-gray-500 whitespace-nowrap">
                        {rowCount} filas
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs sm:text-sm text-indigo-800">
              {hasTriedParse
                ? 'No se pudieron detectar hojas en el archivo. Verifica que el Excel no este dañado.'
                : 'Cargando informacion de hojas...'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
