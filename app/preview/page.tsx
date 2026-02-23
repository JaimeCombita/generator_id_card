'use client';

import { useEffect, useState } from 'react';

export default function PreviewPage() {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    fetch('/templates/carnet-horizontal.html')
      .then(res => res.text())
      .then(html => {
        const preview = html
          .replace('{{NOMBRES}}', 'María Fernanda López García')
          .replace('{{CURSO}}', '10° A')
          .replace('{{IDENTIFICACION}}', '1005234567');
        
        setHtmlContent(preview);
      });
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Vista Previa de Plantilla
          </h1>
          <p className="text-gray-600">
            Plantilla horizontal del carnet estudiantil (8.5cm x 5.5cm)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Carnet de Ejemplo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Esta es una vista previa de cómo se verá el carnet con datos de muestra
            </p>
          </div>

          {/* Vista previa del carnet */}
          <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
            <div 
              className="shadow-2xl"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Información técnica */}
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📏 Dimensiones</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ancho: 8.5 cm</li>
                <li>• Alto: 5.5 cm</li>
                <li>• Foto: 3 cm x 4 cm</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">📝 Campos</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Nombres</li>
                <li>• Curso</li>
                <li>• Identificación</li>
              </ul>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex gap-4">
            <a
              href="/upload"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Usar esta plantilla
            </a>
            <a
              href="/templates/carnet-horizontal.html"
              target="_blank"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Ver código HTML
            </a>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">💡 Instrucciones</h3>
          <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
            <li>Prepara tu archivo Excel con las columnas: nombres, curso, identificacion</li>
            <li>Descarga o crea tu plantilla personalizada</li>
            <li>Ve a la página de Upload y carga ambos archivos</li>
            <li>Selecciona el modo de generación (un PDF o múltiples PDFs)</li>
            <li>¡Genera tus carnets!</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
