import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sube tu Excel y Genera Carnets',
  description:
    'Carga tu archivo Excel, personaliza la plantilla y genera carnets en PDF con la plataforma de JC Engine.',
  alternates: {
    canonical: '/upload',
  },
  keywords: [
    'subir excel carnets',
    'generar carnet pdf',
    'crear credenciales estudiantes',
    'jc engine upload',
  ],
  openGraph: {
    title: 'JC Engine | Sube tu Excel y Genera Carnets',
    description:
      'Comienza el proceso de generación de carnets: importa datos, ajusta plantilla y descarga PDF.',
    url: '/upload',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'JC Engine - Generador de Carnets',
      },
    ],
  },
  twitter: {
    title: 'JC Engine | Sube tu Excel y Genera Carnets',
    description:
      'Importa tu Excel y genera carnets profesionales en PDF con JC Engine.',
    images: ['/opengraph-image'],
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
