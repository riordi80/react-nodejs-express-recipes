'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import api from '@/lib/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface RevenueDataPoint {
  month: string
  monthly_revenue: number
  new_subscribers: number
}

interface RevenueChartProps {
  period?: number // meses
  className?: string
}

export default function RevenueChart({ period = 12, className = '' }: RevenueChartProps) {
  const { isDark } = useSuperAdminTheme()
  const [data, setData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Llamar al endpoint real del backend
        const response = await api.get(`/superadmin/dashboard/charts/revenue?period=${period}`)
        
        if (response.data.success) {
          setData(response.data.data)
        } else {
          setError('Error al cargar datos de ingresos del servidor')
        }
        
      } catch (err) {
        console.error('Error fetching revenue data:', err)
        setError('Error de conexión con el servidor')
        
        // Fallback a datos vacíos en caso de error
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [period])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-64 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg`}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} p-4 text-center`}>
        <p className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      </div>
    )
  }

  // Preparar datos para el gráfico
  const labels = data.map(point => {
    const [year, month] = point.month.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(date, 'MMM yyyy', { locale: es })
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ingresos Mensuales',
        data: data.map(point => point.monthly_revenue),
        backgroundColor: isDark ? '#3b82f6' : '#2563eb',
        borderColor: isDark ? '#60a5fa' : '#1d4ed8',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#111827',
        bodyColor: isDark ? '#cbd5e1' : '#374151',
        borderColor: isDark ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y
            const subscribers = data[context.dataIndex]?.new_subscribers || 0
            return [
              `Ingresos: ${formatCurrency(value)}`,
              `Nuevos suscriptores: ${subscribers}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
          maxRotation: 45,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
          borderColor: isDark ? '#475569' : '#d1d5db',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return formatCurrency(value)
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  // Calcular métricas
  const totalRevenue = data.reduce((sum, point) => sum + point.monthly_revenue, 0)
  const avgMonthlyRevenue = data.length > 0 ? totalRevenue / data.length : 0
  const lastMonthRevenue = data.length > 0 ? data[data.length - 1].monthly_revenue : 0
  const prevMonthRevenue = data.length > 1 ? data[data.length - 2].monthly_revenue : 0
  const growthRate = prevMonthRevenue > 0 ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0

  return (
    <div className={className}>
      <div className="h-64 relative">
        <Bar data={chartData} options={options} />
      </div>
      <div className={`mt-4 grid grid-cols-3 gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        <div className="text-center">
          <div className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {formatCurrency(lastMonthRevenue)}
          </div>
          <div>Último mes</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {formatCurrency(avgMonthlyRevenue)}
          </div>
          <div>Promedio</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${
            growthRate >= 0 
              ? (isDark ? 'text-green-400' : 'text-green-600')
              : (isDark ? 'text-red-400' : 'text-red-600')
          }`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
          <div>Crecimiento</div>
        </div>
      </div>
    </div>
  )
}