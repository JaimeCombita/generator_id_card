'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import TemplateUploader from '@/components/TemplateUploader';
import GenerateOptions from '@/components/GenerateOptions';

export default function UploadPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Generador de Carnets
          </h1>
          <p className="text-gray-600">
            Sube tu archivo Excel y la plantilla para generar los carnets
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Excel Uploader */}
          <ExcelUploader 
            onFileSelect={setExcelFile}
            onDataParsed={setExcelData}
          />

          {/* Template Uploader */}
          <TemplateUploader 
            onFileSelect={setTemplateFile}
          />
        </div>

        {/* Preview de datos */}
        {excelData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Vista previa de datos ({excelData.length} estudiantes)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombres
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Curso
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Identificación
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Foto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {excelData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.nombres}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.curso}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.identificacion}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {row.foto || 'Sin foto'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... y {excelData.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Opciones de generación */}
        {excelFile && templateFile && excelData.length > 0 && (
          <GenerateOptions 
            excelFile={excelFile}
            templateFile={templateFile}
            excelData={excelData}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        )}
      </div>
    </main>
  );
}
