import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProviderWithSettings } from "@/components/providers/ToastProviderWithSettings";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import Header from "@/components/layout/Header";
import FooterWrapper from "@/components/layout/FooterWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Mejor rendimiento
  preload: true,   // Explícitamente precargar
});

export const metadata: Metadata = {
  title: "RecetasAPI - Gestión de Recetas",
  description: "Sistema de gestión de recetas, ingredientes y eventos gastronómicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900 flex flex-col min-h-screen`}>
        <AuthProvider>
          <SettingsProvider>
            <MobileMenuProvider>
              <ToastProviderWithSettings position="bottom-right">
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <FooterWrapper />
              </ToastProviderWithSettings>
            </MobileMenuProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
