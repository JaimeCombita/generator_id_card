import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reporte de Generación',
  description: 'Resumen del proceso de generación de carnets y cobertura de fotos.',
  alternates: {
    canonical: '/report',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
