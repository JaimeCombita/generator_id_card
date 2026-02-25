import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app-carnets.jcengine.co";

function getSiteUrl() {
  if (rawSiteUrl.startsWith("http://") || rawSiteUrl.startsWith("https://")) {
    return rawSiteUrl;
  }

  return `https://${rawSiteUrl}`;
}

const siteUrl = getSiteUrl();
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JC Engine | Generador de Carnets",
    template: "%s | JC Engine",
  },
  description: "Genera carnets profesionales desde Excel en minutos con la solución de JC Engine.",
  keywords: [
    "JC Engine",
    "generador de carnets",
    "carnets estudiantiles",
    "credenciales",
    "excel a carnet",
  ],
  applicationName: "JC Engine - Generador de Carnets",
  authors: [{ name: "JC Engine" }],
  creator: "JC Engine",
  publisher: "JC Engine",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "JC Engine",
    title: "JC Engine | Generador de Carnets",
    description: "Automatiza la generación de carnets en PDF desde archivos Excel.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "JC Engine - Generador de Carnets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JC Engine | Generador de Carnets",
    description: "Automatiza la generación de carnets en PDF desde archivos Excel.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-50 flex flex-col min-h-screen" suppressHydrationWarning>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
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
