// src/router/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layout/main-layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Login from '../pages/login/Login';
import PrivateRoute from './PrivateRoute';
import Allergens from '../pages/allergens/Allergens';
import Ingredients from '../pages/ingredients/Ingredients'; // ← importa tu nuevo componente
import IngredientCategories from '../pages/ingredient-categories/IngredientCategories';
import Recipes from '../pages/recipes/Recipes';  // ← Importa tu componente de recetas
import Suppliers from '../pages/suppliers/Suppliers';
import Events from '../pages/events/Events';
import Settings from '../pages/settings/Settings';
import RecipeDetail from '../pages/recipe-detail/RecipeDetail';
import EventDetail from '../pages/event-detail/EventDetail';
import SupplierOrders from '../pages/supplier-orders/SupplierOrders';

const AppRoutes = () => {
  const { isAuthenticated, checkingAuth } = useAuth();

  if (checkingAuth) {
    return null;
  }

  return (
    <Routes>
      {/* Ruta pública */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        }
      />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="allergens"  element={<Allergens />} />
          <Route path="ingredients" element={<Ingredients />} />  {/* ← aquí */}
          <Route path="ingredient-categories" element={<IngredientCategories />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="supplier-orders" element={<SupplierOrders />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="settings" element={<Settings />} />
          {/* más rutas hijas si las necesitas */}
        </Route>
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
