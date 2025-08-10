import type { Metadata } from "next";
import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export const metadata: Metadata = {
  title: "Configuración - RecetasAPI",
  description: "Configuración y preferencias de la aplicación RecetasAPI",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}