'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onFileSelect: (file: File | null) => void;
  onDataParsed: (data: any[]) => void;
}

export default function ExcelUploader({ onFileSelect, onDataParsed }: ExcelUploaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      onFileSelect(null);
      setFileName('');
      onDataParsed([]);
      return;
    }

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Por favor, sube un archivo Excel válido (.xlsx o .xls)');
      onFileSelect(null);
      setFileName('');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setError('El archivo Excel está vacío');
        onDataParsed([]);
        return;
      }

      const requiredColumns = ['nombres', 'curso', 'identificacion'];
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(
        col => !(col in firstRow)
      );

      if (missingColumns.length > 0) {
        setError(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
        onDataParsed([]);
        return;
      }

      onDataParsed(data);
    } catch (err) {
      setError('Error al leer el archivo Excel');
      onDataParsed([]);
      console.error(err);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          1. Archivo Excel
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
        📊 Columnas requeridas: <span className="font-semibold text-gray-800">nombres, curso, identificacion</span>
        <span className="block sm:inline text-gray-500 sm:before:content-['•'] sm:before:mx-2">foto (opcional)</span>
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
          <span><strong>Archivo cargado:</strong> {fileName}</span>
        </div>
      )}
    </div>
  );
}
