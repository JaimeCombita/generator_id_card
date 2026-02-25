'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type GenerationReport = {
  generatedAt: string;
  mode: 'single' | 'multiple';
  downloadFileName: string;
  totalRecords: number;
  photosZipUploaded: boolean;
  photosInZip: number;
  manualPhotosCount: number;
  withPhotoCount: number;
  withoutPhotoCount: number;
  coveragePercent: number;
  missingPhotoIds: string[];
  extraZipPhotoIds: string[];
};

export default function ReportPage() {
  const [report, setReport] = useState<GenerationReport | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('generationReport');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as GenerationReport;
      setReport(parsed);
    } catch (error) {
      console.error(error);
      setReport(null);
    }
  }, []);

  const generatedAt = useMemo(() => {
    if (!report?.generatedAt) {
      return '-';
    }

    return new Date(report.generatedAt).toLocaleString('es-CO');
  }, [report?.generatedAt]);

  if (!report) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Reporte no disponible</h1>
          <p className="text-gray-600 mb-6">
            No encontramos datos del último proceso de generación en esta sesión.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/upload" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Generar nuevos carnets
            </Link>
            <Link href="/" className="px-5 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Reporte de Generación</h1>
          <p className="text-sm sm:text-base text-gray-600">
            La generación finalizó correctamente. Aquí tienes el resumen de cobertura de fotos y consistencia de datos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Carnets procesados</p>
            <p className="text-2xl font-bold text-gray-800">{report.totalRecords}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Con foto</p>
            <p className="text-2xl font-bold text-green-600">{report.withPhotoCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Sin foto</p>
            <p className="text-2xl font-bold text-amber-600">{report.withoutPhotoCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Cobertura</p>
            <p className="text-2xl font-bold text-indigo-600">{report.coveragePercent}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Detalle del proceso</h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li><span className="font-semibold">Fecha:</span> {generatedAt}</li>
            <li><span className="font-semibold">Modo:</span> {report.mode === 'single' ? 'Un solo PDF' : 'PDFs individuales (ZIP)'}</li>
            <li><span className="font-semibold">Archivo generado:</span> {report.downloadFileName}</li>
            <li><span className="font-semibold">ZIP de fotos:</span> {report.photosZipUploaded ? 'Sí' : 'No (se usó placeholder)'}</li>
            <li><span className="font-semibold">Fotos detectadas en ZIP:</span> {report.photosInZip}</li>
            <li><span className="font-semibold">Fotos capturadas en UX:</span> {report.manualPhotosCount}</li>
            <li><span className="font-semibold">IDs de foto sin match en Excel:</span> {report.extraZipPhotoIds.length}</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">Identificaciones sin foto</h3>
            {report.missingPhotoIds.length === 0 ? (
              <p className="text-sm text-green-700">Todas las identificaciones tienen foto asignada.</p>
            ) : (
              <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                  {report.missingPhotoIds.slice(0, 50).map((id) => (
                    <li key={id}>• {id}</li>
                  ))}
                </ul>
                {report.missingPhotoIds.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2">Mostrando 50 de {report.missingPhotoIds.length} registros.</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">IDs en ZIP sin uso</h3>
            {report.extraZipPhotoIds.length === 0 ? (
              <p className="text-sm text-green-700">No hay IDs sobrantes en el ZIP.</p>
            ) : (
              <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                  {report.extraZipPhotoIds.slice(0, 50).map((id) => (
                    <li key={id}>• {id}</li>
                  ))}
                </ul>
                {report.extraZipPhotoIds.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2">Mostrando 50 de {report.extraZipPhotoIds.length} registros.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Link
              href="/upload"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center"
            >
              Generar nuevos carnets
            </Link>
            <Link
              href="/"
              className="px-5 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-center"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
