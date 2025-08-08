'use client'

import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, BookOpen, Package, Users, Calendar, Clock, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total Recetas',
      value: '124',
      icon: BookOpen
    },
    {
      name: 'Ingredientes',
      value: '456',
      icon: Package
    },
    {
      name: 'Proveedores',
      value: '23',
      icon: Users
    },
    {
      name: 'Eventos',
      value: '12',
      icon: Calendar
    }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <LayoutDashboard className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Bienvenido de vuelta, {user?.first_name}. Aquí tienes un resumen de tu sistema de gestión de recetas.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <stat.icon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nueva receta creada</p>
                  <p className="text-xs text-gray-500">Paella Valenciana - hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Inventario actualizado</p>
                  <p className="text-xs text-gray-500">Stock de arroz - hace 5 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nuevo proveedor añadido</p>
                  <p className="text-xs text-gray-500">Distribuciones García - ayer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Plus className="h-5 w-5 text-orange-600" />
              </div>
              Acciones Rápidas
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/recipes/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Nueva Receta</span>
              </Link>
              <Link href="/ingredients/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Package className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Añadir Ingrediente</span>
              </Link>
              <Link href="/suppliers/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Nuevo Proveedor</span>
              </Link>
              <Link href="/events/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Crear Evento</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}