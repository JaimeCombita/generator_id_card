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

    // Validar extensión
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

    // Parsear el archivo Excel
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Validar estructura
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">1. Archivo Excel</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sube un archivo Excel con las columnas: nombres, curso, identificacion, foto (opcional)
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
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
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
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
          <span className="text-sm text-gray-600">
            {fileName || 'Haz clic para seleccionar el archivo Excel'}
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {fileName && !error && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">
          ✓ Archivo cargado correctamente
        </div>
      )}
    </div>
  );
}
