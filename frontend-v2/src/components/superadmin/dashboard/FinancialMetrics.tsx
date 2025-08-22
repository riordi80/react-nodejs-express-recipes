'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface FinancialData {
  mrr: number
  arr: number
  churn_rate: number
  arpu: number
  ltv: number
  cac: number
  growth_rate: number
  paying_customers: number
  trial_conversions: number
  monthly_revenue_history: Array<{
    month: string
    revenue: number
    new_customers: number
    churned_customers: number
  }>
  plan_distribution: Array<{
    plan: string
    customers: number
    revenue: number
    percentage: number
  }>
}

interface FinancialMetricsProps {
  className?: string
}

export default function FinancialMetrics({ className = '' }: FinancialMetricsProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFinancialData = async () => {
    try {
      setRefreshing(true)
      
      // Simular datos financieros - en producción vendría de la API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockData: FinancialData = {
        mrr: 24750.00,
        arr: 297000.00,
        churn_rate: 3.2,
        arpu: 89.50,
        ltv: 2687.50,
        cac: 145.00,
        growth_rate: 8.7,
        paying_customers: 276,
        trial_conversions: 68.5,
        monthly_revenue_history: [
          { month: '2024-07', revenue: 18500, new_customers: 12, churned_customers: 2 },
          { month: '2024-08', revenue: 19800, new_customers: 15, churned_customers: 3 },
          { month: '2024-09', revenue: 21200, new_customers: 18, churned_customers: 2 },
          { month: '2024-10', revenue: 22600, new_customers: 16, churned_customers: 4 },
          { month: '2024-11', revenue: 23900, new_customers: 14, churned_customers: 1 },
          { month: '2024-12', revenue: 24750, new_customers: 19, churned_customers: 3 },
        ],
        plan_distribution: [
          { plan: 'Basic', customers: 156, revenue: 7800, percentage: 56.5 },
          { plan: 'Premium', customers: 89, revenue: 13350, percentage: 32.2 },
          { plan: 'Enterprise', customers: 31, revenue: 3720, percentage: 11.3 },
        ]
      }
      
      setData(mockData)
    } catch {
      console.error('Fixed error in catch block')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading || !data) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-96 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg`}></div>
      </div>
    )
  }

  // Datos para el gráfico de ingresos
  const revenueChartData = {
    labels: data.monthly_revenue_history.map(item => {
      const [year, month] = item.month.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    }),
    datasets: [
      {
        label: 'Ingresos Mensuales',
        data: data.monthly_revenue_history.map(item => item.revenue),
        borderColor: isDark ? '#3b82f6' : '#2563eb',
        backgroundColor: isDark ? '#3b82f620' : '#2563eb20',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  // Datos para el gráfico de distribución de planes
  const planChartData = {
    labels: data.plan_distribution.map(item => item.plan),
    datasets: [
      {
        data: data.plan_distribution.map(item => item.revenue),
        backgroundColor: isDark 
          ? ['#3b82f6', '#10b981', '#f59e0b']
          : ['#2563eb', '#059669', '#d97706'],
        borderWidth: 0,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#111827',
        bodyColor: isDark ? '#cbd5e1' : '#374151',
        borderColor: isDark ? '#475569' : '#e5e7eb',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        }
      },
      y: {
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          callback: function(value: any) {
            return formatCurrency(value)
          }
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#cbd5e1' : '#374151',
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#111827',
        bodyColor: isDark ? '#cbd5e1' : '#374151',
        borderColor: isDark ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const plan = data.plan_distribution[context.dataIndex]
            return [
              `${plan.plan}: ${formatCurrency(plan.revenue)}`,
              `${plan.customers} clientes (${plan.percentage}%)`
            ]
          }
        }
      }
    }
  }

  return (
    <div className={className}>
      {/* Header con refresh */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-medium ${themeClasses.text}`}>
          Métricas Financieras
        </h3>
        <button
          onClick={fetchFinancialData}
          disabled={refreshing}
          className={`p-2 rounded-lg ${themeClasses.buttonHover} transition-colors`}
          title="Actualizar datos"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''} ${themeClasses.textSecondary}`} />
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>MRR</p>
              <p className={`text-xl font-bold ${themeClasses.text}`}>
                {formatCurrency(data.mrr)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">{formatPercent(data.growth_rate)}</span>
            <span className={`ml-1 ${themeClasses.textSecondary}`}>vs mes anterior</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>ARR</p>
              <p className={`text-xl font-bold ${themeClasses.text}`}>
                {formatCurrency(data.arr)}
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className={`${themeClasses.textSecondary}`}>Proyección anual</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Churn Rate</p>
              <p className={`text-xl font-bold ${themeClasses.text}`}>
                {formatPercent(data.churn_rate)}
              </p>
            </div>
            <ArrowTrendingDownIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className={`${themeClasses.textSecondary}`}>Mensual</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>ARPU</p>
              <p className={`text-xl font-bold ${themeClasses.text}`}>
                {formatCurrency(data.arpu)}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className={`${themeClasses.textSecondary}`}>Por usuario</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de ingresos */}
        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <h4 className={`font-medium ${themeClasses.text} mb-4`}>
            Evolución de Ingresos (6 meses)
          </h4>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Distribución por planes */}
        <div className={`p-4 rounded-lg ${themeClasses.card}`}>
          <h4 className={`font-medium ${themeClasses.text} mb-4`}>
            Ingresos por Plan
          </h4>
          <div className="h-64">
            <Doughnut data={planChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${themeClasses.bgSecondary}`}>
          <h5 className={`font-medium ${themeClasses.text} mb-2`}>LTV / CAC</h5>
          <div className="flex items-center space-x-4">
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>LTV</p>
              <p className={`text-lg font-bold ${themeClasses.text}`}>
                {formatCurrency(data.ltv)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>CAC</p>
              <p className={`text-lg font-bold ${themeClasses.text}`}>
                {formatCurrency(data.cac)}
              </p>
            </div>
            <div>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Ratio</p>
              <p className={`text-lg font-bold ${
                (data.ltv / data.cac) > 3 ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {(data.ltv / data.cac).toFixed(1)}:1
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.bgSecondary}`}>
          <h5 className={`font-medium ${themeClasses.text} mb-2`}>Clientes de Pago</h5>
          <p className={`text-2xl font-bold ${themeClasses.text}`}>
            {data.paying_customers}
          </p>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Suscripciones activas
          </p>
        </div>

        <div className={`p-4 rounded-lg ${themeClasses.bgSecondary}`}>
          <h5 className={`font-medium ${themeClasses.text} mb-2`}>Conversión Trial</h5>
          <p className={`text-2xl font-bold ${themeClasses.text}`}>
            {formatPercent(data.trial_conversions)}
          </p>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            De trial a pago
          </p>
        </div>
      </div>
    </div>
  )
}