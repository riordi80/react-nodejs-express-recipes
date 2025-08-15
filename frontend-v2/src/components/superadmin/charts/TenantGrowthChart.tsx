'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import api from '@/lib/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface GrowthDataPoint {
  date: string
  new_tenants: number
  cumulative_tenants: number
}

interface TenantGrowthChartProps {
  period?: number // días
  className?: string
}

export default function TenantGrowthChart({ period = 30, className = '' }: TenantGrowthChartProps) {
  const { isDark } = useSuperAdminTheme()
  const [data, setData] = useState<GrowthDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Temporalmente usar datos mock hasta que el endpoint esté listo
        await new Promise(resolve => setTimeout(resolve, 800)) // Simular delay
        
        // Generar datos mock dinámicos basados en el período
        const mockData: GrowthDataPoint[] = []
        const now = new Date()
        
        for (let i = period - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const newTenants = Math.floor(Math.random() * 3) + (i < 7 ? 1 : 0) // Más recientes tienen más
          const cumulative = 127 - Math.floor(Math.random() * (i * 0.5)) // Total acumulado
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            new_tenants: newTenants,
            cumulative_tenants: Math.max(100, cumulative)
          })
        }
        
        setData(mockData)
        
        // TODO: Cuando el endpoint esté listo, descomentar:
        // const response = await api.get(`/superadmin/dashboard/charts/growth?period=${period}`)
        // if (response.data.success) {
        //   setData(response.data.data)
        // } else {
        //   setError('Error al cargar datos de crecimiento')
        // }
        
      } catch (err) {
        console.error('Error fetching growth data:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchGrowthData()
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
  const labels = data.map(point => 
    format(parseISO(point.date), 'dd MMM', { locale: es })
  )

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Nuevos Tenants',
        data: data.map(point => point.new_tenants),
        borderColor: isDark ? '#60a5fa' : '#2563eb',
        backgroundColor: isDark ? '#60a5fa20' : '#2563eb20',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: isDark ? '#60a5fa' : '#2563eb',
        pointBorderColor: isDark ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Total Acumulado',
        data: data.map(point => point.cumulative_tenants),
        borderColor: isDark ? '#34d399' : '#059669',
        backgroundColor: isDark ? '#34d39920' : '#05966920',
        fill: false,
        tension: 0.3,
        pointBackgroundColor: isDark ? '#34d399' : '#059669',
        pointBorderColor: isDark ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#374151',
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        }
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
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value} ${context.datasetIndex === 0 ? 'nuevos' : 'total'}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
          borderColor: isDark ? '#475569' : '#d1d5db',
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
            return Math.floor(value).toString()
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        hoverBorderWidth: 3,
      }
    }
  }

  return (
    <div className={className}>
      <div className="h-64 relative">
        <Line data={chartData} options={options} />
      </div>
      <div className={`mt-4 grid grid-cols-2 gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        <div className="text-center">
          <div className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {data.reduce((sum, point) => sum + point.new_tenants, 0)}
          </div>
          <div>Nuevos en {period} días</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {data.length > 0 ? data[data.length - 1].cumulative_tenants : 0}
          </div>
          <div>Total Tenants</div>
        </div>
      </div>
    </div>
  )
}