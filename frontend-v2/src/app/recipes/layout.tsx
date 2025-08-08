import type { Metadata } from "next";
import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export const metadata: Metadata = {
  title: "Recetas - RecetasAPI",
  description: "Gestiona recetas, categorías y preparaciones",
};

interface RecipesLayoutProps {
  children: React.ReactNode;
}

export default function RecipesLayout({ children }: RecipesLayoutProps) {
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