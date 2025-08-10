import type { Metadata } from "next";
import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export const metadata: Metadata = {
  title: "Dashboard - RecetasAPI",
  description: "Panel de control de RecetasAPI para la gestión de recetas y restaurante",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}