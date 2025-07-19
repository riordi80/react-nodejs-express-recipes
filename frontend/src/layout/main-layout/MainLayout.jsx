// src/layout/main-layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import Topbar from '../topbar/Topbar';
import { SidebarProvider } from '../../context/SidebarContext';
import ScrollToTop from '../../components/scroll-to-top/ScrollToTop';

const MainLayout = () => {
  return (
    <SidebarProvider>
      <ScrollToTop />
      <div className="main-layout">
        {/* Topbar */}
        <Topbar />

        {/* Contenedor para sidebar y contenido */}
        <div className="layout-body">
          {/* Sidebar */}
          <Sidebar />

          {/* Contenido Principal */}
          <div className="content">
            {/* Aquí se renderizarán <Dashboard />, <Allergens />, etc. según AppRoutes */}
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
