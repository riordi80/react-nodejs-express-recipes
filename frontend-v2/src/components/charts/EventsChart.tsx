'use client'

import { useState, useMemo } from 'react'

interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  budget?: number
  notes?: string
  created_at: string
  updated_at: string
}

interface EventsChartProps {
  events: Event[]
  defaultPeriod?: number
  title?: string
  className?: string
}

export default function EventsChart({ 
  events, 
  defaultPeriod = 6,
  title = "Eventos",
  className = ""
}: EventsChartProps) {
  const [chartPeriod, setChartPeriod] = useState(defaultPeriod)

  // Generate chart data for selected period
  const chartData = useMemo(() => {
    const months = []
    const now = new Date()
    
    for (let i = chartPeriod - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.event_date)
        return eventDate >= monthDate && eventDate < nextMonth
      }).length
      
      months.push({
        month: monthDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        events: monthEvents,
        fullMonth: monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      })
    }
    
    return months
  }, [events, chartPeriod])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {title} - Últimos {chartPeriod} {chartPeriod === 1 ? 'Mes' : 'Meses'}
        </h3>
        <p className="text-sm text-gray-500">
          Total: {chartData.reduce((sum, data) => sum + data.events, 0)} eventos
        </p>
      </div>
      
      {/* Y-axis labels */}
      <div className="flex">
        <div className="w-8 h-40 flex flex-col justify-between text-xs text-gray-400 mr-2">
          {(() => {
            const maxEvents = Math.max(...chartData.map(d => d.events), 1)
            const steps = Math.min(maxEvents, 5)
            const labels = []
            for (let i = steps; i >= 0; i--) {
              labels.push(Math.round((maxEvents * i) / steps))
            }
            return labels.map((label, idx) => (
              <div key={idx} className="text-right">{label}</div>
            ))
          })()}
        </div>
        
        {/* Chart area */}
        <div className="flex-1">
          {/* Grid lines */}
          <div className="relative h-40 border-l border-b border-gray-200">
            {/* Horizontal grid lines */}
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-full border-t border-gray-100" 
                style={{ top: `${(i * 100) / 5}%` }}
              />
            ))}
            
            {/* Bars */}
            <div className="absolute inset-0 flex space-x-1 px-2">
              {chartData.map((data, index) => {
                const maxEvents = Math.max(...chartData.map(d => d.events), 1)
                // Calculate height in pixels based on 160px chart height (h-40 = 160px)
                const chartHeightPx = 160
                const heightPx = data.events > 0 ? (data.events / maxEvents) * chartHeightPx : 0
                const finalHeightPx = data.events > 0 ? Math.max(heightPx, 20) : 0
                
                return (
                  <div key={index} className="flex-1 flex items-end justify-center">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-300 relative group cursor-pointer shadow-md border ${
                        data.events > 0 
                          ? 'bg-orange-500 hover:bg-orange-600 border-orange-600' 
                          : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
                      }`}
                      style={{ 
                        height: `${finalHeightPx}px`
                      }}
                    >
                      {/* Enhanced Tooltip */}
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                        <div className="text-center">
                          <div className="font-semibold">{data.fullMonth}</div>
                          <div className="text-orange-200">{data.events} evento{data.events !== 1 ? 's' : ''}</div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                      
                      {/* Number on bar */}
                      {data.events > 0 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 bg-white rounded px-1 shadow-sm">
                          {data.events}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="flex mt-3 px-2">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-xs text-gray-600 font-medium">{data.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Period Controls and Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
        {/* Period Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[3, 6, 12].map((period) => (
            <button
              key={period}
              onClick={() => setChartPeriod(period)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartPeriod === period
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {period}m
            </button>
          ))}
        </div>
        
        {/* Legend - Centered */}
        <div className="flex items-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded border border-orange-600 shadow-sm"></div>
            <span>Meses con eventos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded border border-gray-300"></div>
            <span>Meses sin eventos</span>
          </div>
        </div>
        
        {/* Empty space for balance */}
        <div className="hidden sm:block w-24"></div>
      </div>
    </div>
  )
}