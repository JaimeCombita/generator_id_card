'use client';

import { useState } from 'react';
import { TemplateConfig } from './TemplateConfiguration';
import LoadingSpinner from './LoadingSpinner';

interface GenerateOptionsProps {
  excelFile: File;
  templateFile: File | null;
  excelData: any[];
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  useDefaultTemplate: boolean;
  templateConfig: TemplateConfig;
}

export default function GenerateOptions({
  excelFile,
  templateFile,
  excelData,
  isGenerating,
  setIsGenerating,
  useDefaultTemplate,
  templateConfig,
}: GenerateOptionsProps) {
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      formData.append('mode', mode);
      formData.append('useDefaultTemplate', useDefaultTemplate.toString());
      
      if (useDefaultTemplate) {
        formData.append('schoolName', templateConfig.schoolName);
        formData.append('includeSEDLogo', templateConfig.includeSEDLogo.toString());
        
        if (templateConfig.alternativeCityHallLogo) {
          formData.append('alternativeCityHallLogo', templateConfig.alternativeCityHallLogo);
        }
        
        if (templateConfig.schoolLogo) {
          formData.append('schoolLogo', templateConfig.schoolLogo);
        }
      } else if (templateFile) {
        formData.append('templateFile', templateFile);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar PDFs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'single' ? 'carnets_todos.pdf' : 'carnets.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      setError(err.message || 'Error al generar los carnets');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-indigo-200 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {useDefaultTemplate ? '4. Generar Carnets' : '3. Generar Carnets'}
        </h2>
      </div>
      
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Selecciona el modo de generación:
        </p>
        
        <div className="space-y-2 sm:space-y-3">
          <label className="flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer hover:bg-white/50 transition-all duration-300 group" style={{
            borderColor: mode === 'single' ? '#6366f1' : '#e5e7eb',
            backgroundColor: mode === 'single' ? 'rgba(99, 102, 241, 0.05)' : 'white'
          }}>
            <input
              type="radio"
              name="mode"
              value="single"
              checked={mode === 'single'}
              onChange={(e) => setMode(e.target.value as 'single')}
              className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm sm:text-base font-bold text-gray-800">Un solo PDF</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 ml-5 sm:ml-7">
                Todos los carnets en un único archivo PDF
                <span className="inline-flex items-center ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                  {excelData.length} carnets
                </span>
              </div>
            </div>
          </label>

          <label className="flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer hover:bg-white/50 transition-all duration-300 group" style={{
            borderColor: mode === 'multiple' ? '#6366f1' : '#e5e7eb',
            backgroundColor: mode === 'multiple' ? 'rgba(99, 102, 241, 0.05)' : 'white'
          }}>
            <input
              type="radio"
              name="mode"
              value="multiple"
              checked={mode === 'multiple'}
              onChange={(e) => setMode(e.target.value as 'multiple')}
              className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm sm:text-base font-bold text-gray-800">PDFs individuales</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 ml-5 sm:ml-7">
                Un PDF por cada carnet, comprimidos en ZIP
                <span className="inline-flex items-center ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  {excelData.length} archivos
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-2 sm:gap-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-red-800 text-sm sm:text-base">Error</p>
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm sm:text-base font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm sm:text-base">Generando carnets...</span>
          </>
        ) : (
          'Generar Carnets'
        )}
      </button>

      {isGenerating && (
        <LoadingSpinner 
          message={mode === 'single' ? 'Generando PDF único con todos los carnets...' : 'Generando archivos individuales...'}
        />
      )}
    </div>
  );
}
