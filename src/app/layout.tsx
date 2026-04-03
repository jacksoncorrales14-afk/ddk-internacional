import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DDK Internacional - Seguridad",
  description: "Plataforma de reclutamiento y gestión de personal - DDK Internacional Seguridad",
  manifest: "/manifest.json",
  themeColor: "#1b3a5c",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DDK Internacional",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white">
            Saltar al contenido principal
          </a>
          <Navbar />
          <main id="main-content" className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-200 bg-primary-700 py-8 text-center text-sm text-primary-200" role="contentinfo">
            <p>&copy; 2026 DDK Internacional. Todos los derechos reservados.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
