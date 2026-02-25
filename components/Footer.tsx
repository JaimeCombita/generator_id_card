'use client';

import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  const isEmbeddedPreview = pathname === '/preview' && searchParams.get('embed') === '1';

  if (isEmbeddedPreview) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md border border-gray-100 p-1">
              <Image
                src="/logo-optimizado.png"
                alt="Logo JC Engine"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              JC Engine - Generador de Carnets
            </span>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Herramienta profesional para la generación de carnets estudiantiles
          </p>
          
          <p className="text-xs text-gray-500">
            © {currentYear} Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
