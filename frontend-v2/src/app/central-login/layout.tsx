import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProviderWithSettings } from "@/components/providers/ToastProviderWithSettings";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "RecetasAPI - Login Central",
  description: "Sistema de acceso centralizado multi-tenant",
};

export default function CentralLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <SettingsProvider>
            <MobileMenuProvider>
              <ToastProviderWithSettings position="bottom-right">
                {/* Layout independiente SIN Header ni Footer */}
                {children}
              </ToastProviderWithSettings>
            </MobileMenuProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}