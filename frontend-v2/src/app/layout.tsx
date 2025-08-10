'use client'

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Páginas que tienen su propio layout independiente
  const hasIndependentLayout = pathname === '/login' || 
                              pathname === '/central-login' || 
                              pathname === '/recovery-password';

  if (hasIndependentLayout) {
    // Para páginas con layout independiente, solo devolver children sin estructura
    return children;
  }

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
