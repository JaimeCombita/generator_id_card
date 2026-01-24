'use client';

import { useState } from 'react';

interface TemplateUploaderProps {
  onFileSelect: (file: File | null) => void;
}

export default function TemplateUploader({ onFileSelect }: TemplateUploaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      onFileSelect(null);
      setFileName('');
      setPreview('');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/html'];
    
    if (!validTypes.includes(file.type)) {
      setError('Por favor, sube una imagen (PNG, JPG) o archivo HTML');
      onFileSelect(null);
      setFileName('');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">2. Plantilla del Carnet</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sube la plantilla como imagen (PNG/JPG) o HTML
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,.html"
          onChange={handleFileChange}
          className="hidden"
          id="template-upload"
        />
        <label
          htmlFor="template-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 mb-3 rounded" />
          ) : (
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
          <span className="text-sm text-gray-600">
            {fileName || 'Haz clic para seleccionar la plantilla'}
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
          ✓ Plantilla cargada correctamente
        </div>
      )}
    </div>
  );
}
