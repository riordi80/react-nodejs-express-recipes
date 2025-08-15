'use client'

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProviderWithSettings } from "@/components/providers/ToastProviderWithSettings";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import { SidebarCountersProvider } from "@/context/SidebarCountersContext";
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
  
  // Páginas que tienen su propio layout independiente (sin HTML base)
  const hasNoHtmlLayout = pathname === '/login' || 
                         pathname === '/recovery-password';

  // Páginas con HTML base pero sin providers del sistema normal
  const isSuperAdmin = pathname.startsWith('/superadmin');

  if (hasNoHtmlLayout) {
    // Para páginas con layout independiente, solo devolver children sin estructura
    return children;
  }

  if (isSuperAdmin) {
    // Para SuperAdmin: HTML base pero sin providers del sistema normal
    return (
      <html lang="es">
        <body className={`${inter.variable} font-sans antialiased bg-slate-900 text-white min-h-screen`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900 flex flex-col min-h-screen`}>
        <AuthProvider>
          <SettingsProvider>
            <MobileMenuProvider>
              <SidebarCountersProvider>
                <ToastProviderWithSettings position="bottom-right">
                  <Header />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <FooterWrapper />
                </ToastProviderWithSettings>
              </SidebarCountersProvider>
            </MobileMenuProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
