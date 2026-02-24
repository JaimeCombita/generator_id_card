'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TemplateUploaderProps {
  onFileSelect: (file: File | null) => void;
  onDefaultTemplateChange: (useDefault: boolean) => void;
  credentialLevel: 'student' | 'business';
  stepNumber?: number;
}

export default function TemplateUploader({ onFileSelect, onDefaultTemplateChange, credentialLevel, stepNumber = 2 }: TemplateUploaderProps) {
  const [useDefaultTemplate, setUseDefaultTemplate] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (showDetailsModal) {
      document.body.style.overflow = 'hidden';
      return;
    }

    document.body.style.overflow = '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [showDetailsModal]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'template-preview:use-template' || event.data?.type === 'template-preview:close') {
        setShowDetailsModal(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    onDefaultTemplateChange(useDefaultTemplate);
    if (useDefaultTemplate) {
      onFileSelect(null);
      setFileName('');
      setPreview('');
      setError('');
    }
  }, [useDefaultTemplate, onDefaultTemplateChange, onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) {
      onFileSelect(null);
      setFileName('');
      setPreview('');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/html'];
    
    if (!validTypes.includes(file.type)) {
      setError('Por favor, sube una imagen (PNG, JPG) o archivo HTML');
      onFileSelect(null);
      setFileName('');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {stepNumber}. Plantilla del Carnet
        </h2>
      </div>
      
      {/* Checkbox para usar plantilla por defecto */}
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={useDefaultTemplate}
            onChange={(e) => setUseDefaultTemplate(e.target.checked)}
            className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-indigo-700">
            Usar plantilla por defecto
          </span>
        </label>
      </div>

      {useDefaultTemplate ? (
        <div className="border-2 border-indigo-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <p className="text-sm font-medium text-gray-700">
              Vista previa de la plantilla
            </p>
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Ver detalles</span>
            </button>
          </div>
          
          <div className="flex justify-center overflow-x-auto">
            <div className="bg-white rounded-xl shadow-2xl p-3 sm:p-4 inline-block hover:scale-105 transition-transform duration-300">
              <div style={{
                width: '280px',
                minWidth: '280px',
                height: '180px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                border: '2px solid #1e40af',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}>
                {/* Header */}
                <div style={{
                  background: 'white',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  borderBottom: '3px solid #fbbf24',
                }}>
                  <div style={{ width: '36px', height: '36px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>
                      {credentialLevel === 'business' ? 'NOMBRE DE LA EMPRESA' : 'NOMBRE DEL COLEGIO'}
                    </div>
                    <div style={{ fontSize: '8px', color: '#6b7280', marginTop: '2px' }}>
                      {credentialLevel === 'business' ? 'Carnet Empresarial' : 'Carnet Estudiantil'}
                    </div>
                  </div>
                  <div style={{ width: '36px', height: '36px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                {/* Content */}
                <div style={{ display: 'flex', padding: '12px', gap: '12px', height: 'calc(100% - 48px)' }}>
                  <div style={{
                    width: '100px',
                    height: '130px',
                    background: '#e5e7eb',
                    border: '2px solid white',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#9ca3af',
                  }}>
                    FOTO
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      borderLeft: '3px solid #fbbf24',
                    }}>
                      <div style={{ fontSize: '8px', color: '#fbbf24', fontWeight: 'bold' }}>NOMBRE</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'white' }}>{credentialLevel === 'business' ? 'Colaborador Ejemplo' : 'Estudiante Ejemplo'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      borderLeft: '3px solid #fbbf24',
                    }}>
                      <div style={{ fontSize: '8px', color: '#fbbf24', fontWeight: 'bold' }}>{credentialLevel === 'business' ? 'CARGO' : 'CURSO'}</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'white' }}>{credentialLevel === 'business' ? 'Analista' : '10-A'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      borderLeft: '3px solid #fbbf24',
                    }}>
                      <div style={{ fontSize: '8px', color: '#fbbf24', fontWeight: 'bold' }}>IDENTIFICACIÓN</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'white' }}>123456789</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3 sm:mt-4 text-center bg-white/50 px-2 sm:px-3 py-2 rounded-lg">
            💡 Personaliza el nombre de la {credentialLevel === 'business' ? 'institución' : 'institución educativa'} y los logos en la siguiente sección
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Sube tu plantilla personalizada como imagen (PNG/JPG) o HTML
          </p>

          <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 sm:p-6 md:p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer">
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
                <img src={preview} alt="Preview" className="max-h-32 sm:max-h-48 mb-3 rounded-lg shadow-lg" />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600"
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
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium text-gray-700 px-2">
                {fileName || 'Haz clic para seleccionar tu plantilla'}
              </span>
              {!fileName && (
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG o HTML
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
              Plantilla cargada correctamente
            </div>
          )}
        </>
      )}

      {isMounted && showDetailsModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 sm:p-6">
          <div className="w-full h-[94dvh] sm:w-[80vw] sm:h-[90vh] max-w-7xl overflow-hidden relative rounded-xl sm:rounded-2xl shadow-2xl bg-white border border-white/20">
            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-black/50 border border-white/30 rounded-lg hover:bg-black/70"
            >
              Cerrar
            </button>
            <iframe
              title="Vista previa de plantilla"
              src={`/preview?level=${credentialLevel}&embed=1`}
              className="w-full h-full border-0"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
