import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Generador de Carnets",
  description: "Genera carnets de estudiantes desde Excel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-50 flex flex-col min-h-screen" suppressHydrationWarning>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
