import type { Metadata } from "next";
import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: "Proveedores - RecetasAPI",
  description: "Gestiona proveedores y relaciones comerciales",
};

interface SuppliersLayoutProps {
  children: React.ReactNode;
}

export default function SuppliersLayout({ children }: SuppliersLayoutProps) {
  return (
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
  );
}