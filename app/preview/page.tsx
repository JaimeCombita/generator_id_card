'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PreviewPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const searchParams = useSearchParams();
  const level = searchParams.get('level') === 'business' ? 'business' : 'student';
  const isBusiness = level === 'business';
  const isEmbedded = searchParams.get('embed') === '1';

  useEffect(() => {
    fetch('/templates/carnet-horizontal.html')
      .then(res => res.text())
      .then(html => {
        let preview = html
          .replace('{{NOMBRES}}', 'María Fernanda López García')
          .replace('{{CURSO}}', isBusiness ? 'Analista de Operaciones' : '10° A')
          .replace('{{IDENTIFICACION}}', '1005234567');

        if (isBusiness) {
          preview = preview
            .replace(/Carnet Estudiantil/g, 'Carnet Empresarial')
            .replace(/>Curso</g, '>Cargo<')
            .replace(/Colegio Estrella del Sur/g, 'Empresa Ejemplo S.A.S')
            .replace(/\/templates\/logo_secretaria\.jpg/g, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        }
        
        setHtmlContent(preview);
      });
  }, [isBusiness]);

  return (
    <main className={`bg-gray-100 ${isEmbedded ? 'p-2 sm:p-4' : 'p-8'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-lg shadow-lg ${isEmbedded ? 'p-3 sm:p-6' : 'p-8'}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Carnet de Ejemplo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Esta es una vista previa de cómo se verá el carnet con datos de muestra
            </p>
          </div>

          {/* Vista previa del carnet */}
          <div className={`flex justify-center items-center bg-gray-50 rounded-lg overflow-x-auto ${isEmbedded ? 'p-3 sm:p-6' : 'p-8'}`}>
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
                <li>• {isBusiness ? 'Cargo' : 'Curso'}</li>
                <li>• Identificación</li>
              </ul>
            </div>
          </div>

          {!isEmbedded && (
            <div className="mt-6">
              <a
                href="/templates/carnet-horizontal.html"
                target="_blank"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Ver código HTML
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
