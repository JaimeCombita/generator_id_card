'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import TemplateUploader from '@/components/TemplateUploader';
import TemplateConfiguration, { TemplateConfig } from '@/components/TemplateConfiguration';
import GenerateOptions from '@/components/GenerateOptions';

export default function UploadPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useDefaultTemplate, setUseDefaultTemplate] = useState(true);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    schoolName: 'Colegio Estrella del Sur',
    includeSEDLogo: true,
    alternativeCityHallLogo: null,
    schoolLogo: null,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-60 h-60 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-3 sm:mb-4 shadow-xl">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-3 px-4">
            Generador de Carnets
          </h1>
          <p className="text-gray-600 text-base sm:text-lg px-4">
            Sube tu archivo Excel y personaliza tu plantilla
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Excel Uploader */}
          <ExcelUploader 
            onFileSelect={setExcelFile}
            onDataParsed={setExcelData}
          />

          {/* Template Uploader */}
          <TemplateUploader 
            onFileSelect={setTemplateFile}
            onDefaultTemplateChange={setUseDefaultTemplate}
          />
        </div>

        {/* Template Configuration - solo visible si usa plantilla por defecto */}
        {useDefaultTemplate && (
          <div className="mb-6 sm:mb-8">
            <TemplateConfiguration 
              useDefaultTemplate={useDefaultTemplate}
              onConfigChange={setTemplateConfig}
            />
          </div>
        )}

        {/* Preview de datos */}
        {excelData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Vista previa de datos
                <span className="block sm:inline sm:ml-2 text-xs sm:text-sm font-semibold text-gray-600">({excelData.length} estudiantes)</span>
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nombres
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Identificación
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Foto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {excelData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{row.nombres}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{row.curso}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{row.identificacion}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                        {row.foto || 'Sin foto'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelData.length > 5 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 sm:px-4 py-2 sm:py-3 text-center border-t border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">
                    ... y <span className="font-bold text-indigo-600">{excelData.length - 5}</span> estudiantes más
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opciones de generación */}
        {excelFile && (useDefaultTemplate || templateFile) && excelData.length > 0 && (
          <GenerateOptions 
            excelFile={excelFile}
            templateFile={templateFile}
            excelData={excelData}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            useDefaultTemplate={useDefaultTemplate}
            templateConfig={templateConfig}
          />
        )}
      </div>
    </main>
  );
}
