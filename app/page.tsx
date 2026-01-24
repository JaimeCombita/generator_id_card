import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Generador de Carnets Estudiantiles
        </h1>
        <p className="text-gray-600 mb-8">
          Crea carnets profesionales a partir de archivos Excel
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Comenzar
          </Link>
          <Link 
            href="/preview"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Ver Plantilla
          </Link>
        </div>
      </div>
    </main>
  );
}
