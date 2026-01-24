'use client';

import { useState } from 'react';

interface GenerateOptionsProps {
  excelFile: File;
  templateFile: File;
  excelData: any[];
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export default function GenerateOptions({
  excelFile,
  templateFile,
  excelData,
  isGenerating,
  setIsGenerating,
}: GenerateOptionsProps) {
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      formData.append('templateFile', templateFile);
      formData.append('mode', mode);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar PDFs');
      }

      // Descargar el PDF
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">3. Generar Carnets</h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">Selecciona el modo de generación:</p>
        
        <div className="space-y-3">
          <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="single"
              checked={mode === 'single'}
              onChange={(e) => setMode(e.target.value as 'single')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Un solo PDF</div>
              <div className="text-sm text-gray-500">
                Todos los carnets en un único archivo PDF ({excelData.length} carnets)
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="multiple"
              checked={mode === 'multiple'}
              onChange={(e) => setMode(e.target.value as 'multiple')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">PDFs individuales</div>
              <div className="text-sm text-gray-500">
                Un PDF por cada carnet ({excelData.length} archivos en ZIP)
              </div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando carnets...
          </>
        ) : (
          'Generar Carnets'
        )}
      </button>
    </div>
  );
}
