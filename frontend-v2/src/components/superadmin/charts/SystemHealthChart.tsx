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
  ArcElement,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { 
  CpuChipIcon, 
  CircleStackIcon, 
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface SystemHealthData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  uptime_hours: number
  active_connections: number
  response_time_avg: number
}

interface SystemHealthChartProps {
  className?: string
}

export default function SystemHealthChart({ className = '' }: SystemHealthChartProps) {
  const { isDark, getThemeClasses } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()
  const [data, setData] = useState<SystemHealthData>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    uptime_hours: 0,
    active_connections: 0,
    response_time_avg: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        setLoading(true)
        
        // Simular datos del sistema - en producción vendría de la API de monitoreo
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setData({
          cpu_usage: Math.random() * 80 + 10, // 10-90%
          memory_usage: Math.random() * 70 + 20, // 20-90%
          disk_usage: Math.random() * 60 + 30, // 30-90%
          uptime_hours: 72.5,
          active_connections: Math.floor(Math.random() * 200 + 50),
          response_time_avg: Math.random() * 300 + 100 // 100-400ms
        })
      } catch (err) {
        console.error('Error fetching system health:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSystemHealth()
    
    // TODO: Reactivar actualización automática cuando sea funcional
    // const interval = setInterval(fetchSystemHealth, 30000)
    // return () => clearInterval(interval)
  }, [])

  const getUsageColor = (usage: number) => {
    if (usage < 50) return isDark ? '#10b981' : '#059669' // verde
    if (usage < 80) return isDark ? '#f59e0b' : '#d97706' // amarillo
    return isDark ? '#ef4444' : '#dc2626' // rojo
  }

  const getUsageColorBg = (usage: number) => {
    if (usage < 50) return isDark ? '#10b98120' : '#05966920' // verde
    if (usage < 80) return isDark ? '#f59e0b20' : '#d9770620' // amarillo
    return isDark ? '#ef444420' : '#dc262620' // rojo
  }

  const createDoughnutData = (usage: number, label: string) => ({
    labels: ['Usado', 'Libre'],
    datasets: [
      {
        data: [usage, 100 - usage],
        backgroundColor: [
          getUsageColor(usage),
          isDark ? '#374151' : '#f3f4f6'
        ],
        borderWidth: 0,
        cutout: '70%',
      }
    ]
  })

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      }
    },
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-64 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg`}></div>
      </div>
    )
  }

  const getStatusIcon = (usage: number) => {
    if (usage < 80) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24)
    const remainingHours = Math.floor(hours % 24)
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className={className}>
      {/* Gráficos de uso de recursos */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* CPU */}
        <div className="text-center">
          <div className="relative h-24 w-24 mx-auto mb-2">
            <Doughnut 
              data={createDoughnutData(data.cpu_usage, 'CPU')} 
              options={doughnutOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CpuChipIcon className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <div className={`text-xs font-bold ${themeClasses.text}`}>
                  {Math.round(data.cpu_usage)}%
                </div>
              </div>
            </div>
          </div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>CPU</div>
        </div>

        {/* Memory */}
        <div className="text-center">
          <div className="relative h-24 w-24 mx-auto mb-2">
            <Doughnut 
              data={createDoughnutData(data.memory_usage, 'Memory')} 
              options={doughnutOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ServerIcon className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                <div className={`text-xs font-bold ${themeClasses.text}`}>
                  {Math.round(data.memory_usage)}%
                </div>
              </div>
            </div>
          </div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>RAM</div>
        </div>

        {/* Disk */}
        <div className="text-center">
          <div className="relative h-24 w-24 mx-auto mb-2">
            <Doughnut 
              data={createDoughnutData(data.disk_usage, 'Disk')} 
              options={doughnutOptions} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <CircleStackIcon className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <div className={`text-xs font-bold ${themeClasses.text}`}>
                  {Math.round(data.disk_usage)}%
                </div>
              </div>
            </div>
          </div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>Disco</div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${themeClasses.bgSecondary}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${themeClasses.textSecondary}`}>Tiempo Activo</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(0)} {/* Siempre verde para uptime */}
              <span className={`text-sm font-medium ${themeClasses.text}`}>
                {formatUptime(data.uptime_hours)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm ${themeClasses.textSecondary}`}>Conexiones</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.active_connections > 150 ? 85 : 30)}
              <span className={`text-sm font-medium ${themeClasses.text}`}>
                {data.active_connections}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${themeClasses.textSecondary}`}>Resp. Tiempo</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.response_time_avg > 300 ? 85 : 30)}
              <span className={`text-sm font-medium ${themeClasses.text}`}>
                {Math.round(data.response_time_avg)}ms
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm ${themeClasses.textSecondary}`}>Estado General</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(Math.max(data.cpu_usage, data.memory_usage, data.disk_usage))}
              <span className={`text-sm font-medium ${
                Math.max(data.cpu_usage, data.memory_usage, data.disk_usage) < 80 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {Math.max(data.cpu_usage, data.memory_usage, data.disk_usage) < 80 ? 'Saludable' : 'Alerta'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de estado */}
      <div className={`mt-4 text-center text-xs ${themeClasses.textSecondary}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Datos estáticos (demo)</span>
        </div>
      </div>
    </div>
  )
}