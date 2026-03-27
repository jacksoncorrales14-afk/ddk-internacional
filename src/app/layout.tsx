import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DDK Internacional - Seguridad",
  description: "Plataforma de reclutamiento y gestión de personal - DDK Internacional Seguridad",
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
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-200 bg-primary-700 py-8 text-center text-sm text-primary-200">
            <p>&copy; 2026 DDK Internacional. Todos los derechos reservados.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
