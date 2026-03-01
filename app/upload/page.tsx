'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import JSZip from 'jszip';
import ExcelUploader from '@/components/ExcelUploader';
import TemplateUploader from '@/components/TemplateUploader';
import TemplateConfiguration, { TemplateConfig } from '@/components/TemplateConfiguration';
import { PREDEFINED_PALETTES } from '@/components/ColorCustomizer';
import GenerateOptions from '@/components/GenerateOptions';

function normalizeIdentifier(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function hasValidImageExtension(fileName: string): boolean {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
}

export default function UploadPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [photosZipFile, setPhotosZipFile] = useState<File | null>(null);
  const [photosZipById, setPhotosZipById] = useState<Set<string>>(new Set());
  const [capturedPhotosById, setCapturedPhotosById] = useState<Record<string, string>>({});
  const [cameraTarget, setCameraTarget] = useState<{ id: string; name: string } | null>(null);
  const [photoActionStep, setPhotoActionStep] = useState<'chooser' | 'camera' | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'missing'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [photosZipError, setPhotosZipError] = useState('');
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useDefaultTemplate, setUseDefaultTemplate] = useState(true);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    credentialLevel: 'student',
    schoolName: 'Colegio Estrella del Sur',
    includeSEDLogo: true,
    alternativeCityHallLogo: null,
    schoolLogo: null,
    colorTheme: PREDEFINED_PALETTES.corporate.colors,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoPickerInputRef = useRef<HTMLInputElement | null>(null);

  const isBusiness = templateConfig.credentialLevel === 'business';

  const availablePhotoIds = useMemo(() => {
    const ids = new Set<string>(Array.from(photosZipById));
    Object.keys(capturedPhotosById).forEach((id) => ids.add(id));
    return ids;
  }, [photosZipById, capturedPhotosById]);

  const rowsWithoutPhoto = useMemo(() => {
    return excelData.filter((row) => {
      const id = normalizeIdentifier(row.identificacion);
      return id && !availablePhotoIds.has(id);
    });
  }, [excelData, availablePhotoIds]);

  const filteredRows = useMemo(() => {
    return previewFilter === 'missing' ? rowsWithoutPhoto : excelData;
  }, [excelData, rowsWithoutPhoto, previewFilter]);

  const rowsPerPage = isMobileViewport ? 5 : 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

  const previewRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [totalPages, currentPage]);

  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
      return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
    }

    mediaQuery.addListener(handleMediaQueryChange);
    return () => mediaQuery.removeListener(handleMediaQueryChange);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [previewFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!cameraTarget || photoActionStep !== 'camera') {
      stopCameraStream();
      return;
    }

    let isMounted = true;
    setCameraError('');

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Este navegador no soporta acceso a cámara.');
        }

        stopCameraStream();

        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: cameraFacingMode } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacingMode },
            audio: false,
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error: any) {
        setCameraError(error?.message || 'No fue posible iniciar la cámara.');
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [cameraTarget, cameraFacingMode, photoActionStep]);

  const handleCredentialLevelChange = (level: 'student' | 'business') => {
    setTemplateConfig((prev) => ({
      ...prev,
      credentialLevel: level,
      includeSEDLogo: level === 'business' ? false : prev.includeSEDLogo,
      alternativeCityHallLogo: level === 'business' ? null : prev.alternativeCityHallLogo,
    }));
    setExcelFile(null);
    setExcelData([]);
    setPhotosZipFile(null);
    setPhotosZipById(new Set());
    setCapturedPhotosById({});
  };

  const handlePhotosZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotosZipError('');

    if (!file) {
      setPhotosZipFile(null);
      setPhotosZipById(new Set());
      return;
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setPhotosZipError('El archivo debe ser un ZIP válido (.zip).');
      setPhotosZipFile(null);
      setPhotosZipById(new Set());
      return;
    }

    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const detectedIds = new Set<string>();

      Object.values(zip.files).forEach((entry) => {
        if (entry.dir || !hasValidImageExtension(entry.name)) {
          return;
        }

        const fileName = entry.name.split('/').pop() || '';
        const idWithoutExt = fileName.replace(/\.[^.]+$/, '');
        const normalizedId = normalizeIdentifier(idWithoutExt);

        if (normalizedId) {
          detectedIds.add(normalizedId);
        }
      });

      setPhotosZipFile(file);
      setPhotosZipById(detectedIds);
    } catch (error) {
      console.error(error);
      setPhotosZipError('No fue posible leer el ZIP. Verifica que no esté dañado.');
      setPhotosZipFile(null);
      setPhotosZipById(new Set());
    }
  };

  const openCameraForRow = (row: any) => {
    const id = normalizeIdentifier(row.identificacion);
    if (!id) {
      setCameraError('La identificación no es válida para asociar una foto.');
      return;
    }

    setCameraError('');
    setCameraFacingMode(isMobileDevice ? 'environment' : 'user');
    setCameraTarget({ id, name: String(row.nombres || row.identificacion || 'Registro') });
    setPhotoActionStep('chooser');
  };

  const closeCameraModal = () => {
    setCameraTarget(null);
    setPhotoActionStep(null);
    setCameraError('');
  };

  const chooseTakePhoto = () => {
    setPhotoActionStep('camera');
  };

  const chooseDevicePhoto = () => {
    photoPickerInputRef.current?.click();
  };

  const capturePhoto = () => {
    if (!cameraTarget || !videoRef.current) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setCameraError('No fue posible capturar la imagen.');
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedPhotosById((prev) => ({
      ...prev,
      [cameraTarget.id]: dataUrl,
    }));

    closeCameraModal();
  };

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!cameraTarget || !file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setCameraError('Selecciona un archivo de imagen válido.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        setCameraError('No fue posible procesar la imagen seleccionada.');
        return;
      }

      setCapturedPhotosById((prev) => ({
        ...prev,
        [cameraTarget.id]: dataUrl,
      }));

      closeCameraModal();
    };

    reader.onerror = () => {
      setCameraError('No fue posible leer la imagen seleccionada.');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              1. Tipo de Carnet
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5">
            Selecciona el tipo para adaptar columnas requeridas, plantilla y detalles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer transition-colors" style={{ borderColor: templateConfig.credentialLevel === 'student' ? '#6366f1' : '#e5e7eb' }}>
              <input
                type="radio"
                name="credentialLevelMain"
                checked={templateConfig.credentialLevel === 'student'}
                onChange={() => handleCredentialLevelChange('student')}
                className="mr-2 w-4 h-4 text-indigo-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Estudiantil</span>
            </label>
            <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer transition-colors" style={{ borderColor: templateConfig.credentialLevel === 'business' ? '#6366f1' : '#e5e7eb' }}>
              <input
                type="radio"
                name="credentialLevelMain"
                checked={templateConfig.credentialLevel === 'business'}
                onChange={() => handleCredentialLevelChange('business')}
                className="mr-2 w-4 h-4 text-indigo-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Empresarial</span>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Excel Uploader */}
          <ExcelUploader 
            key={`excel-${templateConfig.credentialLevel}`}
            onFileSelect={setExcelFile}
            onDataParsed={setExcelData}
            credentialLevel={templateConfig.credentialLevel}
            stepNumber={2}
          />

          {/* Template Uploader */}
          <TemplateUploader 
            onFileSelect={setTemplateFile}
            onDefaultTemplateChange={setUseDefaultTemplate}
            credentialLevel={templateConfig.credentialLevel}
            stepNumber={3}
          />
        </div>

        {/* Template Configuration - solo visible si usa plantilla por defecto */}
        {useDefaultTemplate && (
          <div className="mb-6 sm:mb-8">
            <TemplateConfiguration 
              useDefaultTemplate={useDefaultTemplate}
              onConfigChange={setTemplateConfig}
              showCredentialSelector={false}
              stepNumber={4}
              credentialLevelOverride={templateConfig.credentialLevel}
            />
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {useDefaultTemplate ? '5. Fotos (Opcional)' : '4. Fotos (Opcional)'}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Sube un ZIP con fotos nombradas por identificación (ejemplo: <span className="font-semibold">1005234567.jpg</span>).
            Si no subes ZIP, se usará placeholder automáticamente.
          </p>

          <input
            type="file"
            accept=".zip"
            onChange={handlePhotosZipChange}
            className="hidden"
            id="photos-zip-upload"
          />
          <label
            htmlFor="photos-zip-upload"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Seleccionar ZIP de fotos
          </label>

          {photosZipError && (
            <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs sm:text-sm text-red-700">
              {photosZipError}
            </div>
          )}

          {photosZipFile && !photosZipError && (
            <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-xs sm:text-sm text-green-700">
              ZIP cargado: <span className="font-semibold">{photosZipFile.name}</span> • IDs detectados: <span className="font-semibold">{photosZipById.size}</span>
            </div>
          )}

          {Object.keys(capturedPhotosById).length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-xs sm:text-sm text-blue-700">
              Fotos capturadas desde cámara: <span className="font-semibold">{Object.keys(capturedPhotosById).length}</span>
            </div>
          )}
        </div>

        {/* Preview de datos */}
        {excelData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Vista previa y registros sin foto
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-gray-600">
                  {excelData.length} {isBusiness ? 'colaboradores' : 'estudiantes'} • Sin foto: {rowsWithoutPhoto.length}
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: previewFilter === 'all' ? '#eef2ff' : 'transparent',
                    color: previewFilter === 'all' ? '#4338ca' : '#374151',
                  }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('missing')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: previewFilter === 'missing' ? '#fffbeb' : 'transparent',
                    color: previewFilter === 'missing' ? '#92400e' : '#374151',
                  }}
                >
                  Sin foto ({rowsWithoutPhoto.length})
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mostrando {previewRows.length} de {filteredRows.length}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nombres
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {isBusiness ? 'Cargo' : 'Curso'}
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Identificación
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{row.nombres}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{row.curso || row.cargo || ''}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">{row.identificacion}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                        {(() => {
                          const id = normalizeIdentifier(row.identificacion);
                          if (capturedPhotosById[id]) {
                            return '📷 Capturada';
                          }
                          if (photosZipById.has(id)) {
                            return '✅ ZIP';
                          }
                          return photosZipFile ? '❌ No encontrada' : 'Sin foto (placeholder)';
                        })()}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={() => openCameraForRow(row)}
                          className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium"
                        >
                          {capturedPhotosById[normalizeIdentifier(row.identificacion)] ? 'Retomar' : 'Tomar foto'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {previewRows.length === 0 && (
                <div className="px-3 sm:px-4 py-4 text-center text-xs sm:text-sm text-gray-500 bg-white">
                  No hay registros para mostrar en este filtro.
                </div>
              )}

              {filteredRows.length > rowsPerPage && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 text-center sm:text-left">
                    Página <span className="font-bold text-indigo-600">{currentPage}</span> de <span className="font-bold text-indigo-600">{totalPages}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded-md text-xs sm:text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {visiblePageNumbers.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-8 px-2 py-1 rounded-md text-xs sm:text-sm font-semibold border"
                        style={{
                          backgroundColor: page === currentPage ? '#e0e7ff' : '#ffffff',
                          borderColor: page === currentPage ? '#a5b4fc' : '#e5e7eb',
                          color: page === currentPage ? '#3730a3' : '#374151',
                        }}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded-md text-xs sm:text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
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
            photosZipFile={photosZipFile}
            photosZipById={photosZipById}
            capturedPhotosById={capturedPhotosById}
            excelData={excelData}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            useDefaultTemplate={useDefaultTemplate}
            templateConfig={templateConfig}
            stepNumber={useDefaultTemplate ? 6 : 5}
          />
        )}

        <input
          ref={photoPickerInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoFileSelect}
          className="hidden"
        />

        {cameraTarget && photoActionStep === 'chooser' && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Agregar foto</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Registro: <span className="font-semibold">{cameraTarget.name}</span>
              </p>

              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={chooseTakePhoto}
                  className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
                >
                  Tomar foto
                </button>
                <button
                  type="button"
                  onClick={chooseDevicePhoto}
                  className="w-full px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm border border-purple-200"
                >
                  Seleccionar desde dispositivo
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {cameraTarget && photoActionStep === 'camera' && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Tomar foto</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Registro: <span className="font-semibold">{cameraTarget.name}</span>
              </p>

              <div className="rounded-xl overflow-hidden bg-gray-900 mb-3 relative">
                <video ref={videoRef} className="w-full h-64 sm:h-80 object-cover" autoPlay muted playsInline />

                {isMobileDevice && (
                  <button
                    type="button"
                    onClick={() => setCameraFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-black/85 text-white flex items-center justify-center shadow-xl"
                    aria-label="Cambiar cámara"
                    title="Cambiar cámara"
                  >
                    <Image
                      src="/icons/camera-switch.svg"
                      alt="Cambiar cámara"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200">
                  {cameraError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Capturar foto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
