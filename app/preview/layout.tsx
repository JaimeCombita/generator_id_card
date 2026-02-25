import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vista Previa de Plantilla de Carnet',
  description:
    'Visualiza la plantilla de carnet con datos de ejemplo antes de la generación final en JC Engine.',
  alternates: {
    canonical: '/preview',
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'JC Engine | Vista Previa de Plantilla de Carnet',
    description:
      'Revisa cómo se verá tu carnet antes de generar los documentos finales.',
    url: '/preview',
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
    title: 'JC Engine | Vista Previa de Plantilla de Carnet',
    description:
      'Vista previa técnica de la plantilla de carnet en la plataforma de JC Engine.',
    images: ['/opengraph-image'],
  },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
