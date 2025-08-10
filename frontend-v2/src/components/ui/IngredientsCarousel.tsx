'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Sprout, Play, Pause, Clock, TrendingDown, AlertTriangle, Sparkles, Zap, CheckCircle } from 'lucide-react'

interface CarouselIngredient {
  ingredient_id: number
  name: string
  // Campos opcionales según el tipo
  season?: string
  expiration_date?: string
  days_until_expiry?: number
  stock: number
  unit: string
  base_price?: number
  net_price?: number
  preferred_supplier_price?: number
  category?: string
  deficit?: number
  is_available: boolean
}

type CarouselType = 'seasonal' | 'expiring' | 'lowStock' | 'noSuppliers'

type AnimationType = 'ticker' | 'slide'

interface IngredientsCarouselProps {
  ingredients: CarouselIngredient[]
  type: CarouselType
  isLoading?: boolean
  itemsPerSlide?: number
  animationType?: AnimationType
  onViewAll?: () => void
  totalCount?: number
  showStatic?: boolean  // Nueva prop para controlar si mostrar estático
}

const getVariantConfig = (type: CarouselType) => {
  const configs = {
    seasonal: {
      icon: Sprout,
      iconColor: 'text-green-600',
      accentColor: 'text-green-600',
      emptyMessage: 'Sin ingredientes estacionales',
      emptySubmessage: 'para este mes'
    },
    expiring: {
      icon: Clock,
      iconColor: 'text-red-600',
      accentColor: 'text-red-600',
      emptyMessage: 'Nada próximo a caducar',
      emptySubmessage: 'en los próximos días'
    },
    lowStock: {
      icon: TrendingDown,
      iconColor: 'text-yellow-600',
      accentColor: 'text-yellow-600',
      emptyMessage: 'Stock controlado',
      emptySubmessage: 'todo en orden'
    },
    noSuppliers: {
      icon: AlertTriangle,
      iconColor: 'text-blue-600',
      accentColor: 'text-blue-600',
      emptyMessage: 'Todos tienen proveedor asignado',
      emptySubmessage: 'correctamente'
    }
  }
  
  return configs[type]
}

const getSeasonalMessages = () => {
  return {
    new: {
      icon: Sparkles,
      color: 'text-emerald-600',
      messages: [
        "¡Nuevo de temporada!",
        "Acaba de llegar", 
        "Recién disponible",
        "En su mejor momento"
      ]
    },
    peak: {
      icon: CheckCircle,
      color: 'text-blue-600',
      messages: [
        "En temporada alta",
        "Momento óptimo", 
        "En su punto",
        "Calidad máxima",
        "Temporada perfecta"
      ]
    },
    ending: {
      icon: Clock,
      color: 'text-amber-600',
      messages: [
        "Le queda 1 mes",
        "Últimas semanas",
        "Aprovéchalo ya", 
        "Se acaba pronto",
        "No te lo pierdas"
      ]
    },
    critical: {
      icon: Zap,
      color: 'text-red-600',
      messages: [
        "Últimos días",
        "¡Úsalo ahora!",
        "Temporada finalizando"
      ]
    }
  }
}

const getRandomSeasonalMessage = (season: string): { message: string; icon: any; color: string } | null => {
  if (!season || season === 'todo_año' || season === 'todo el año') return null
  
  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase()
  const months = season.toLowerCase().split(',').map(m => m.trim())
  const monthIndex = months.indexOf(currentMonth)
  
  if (monthIndex === -1) return null
  
  const messagesData = getSeasonalMessages()
  
  // Determinar estado de la temporada
  let state: keyof typeof messagesData = 'peak'
  const totalMonths = months.length
  
  if (totalMonths === 1) {
    state = 'critical'
  } else if (monthIndex === 0) {
    state = 'new'
  } else if (monthIndex === totalMonths - 1) {
    state = 'ending'
  } else if (monthIndex <= Math.floor(totalMonths * 0.3)) {
    state = 'new'
  } else if (monthIndex >= Math.floor(totalMonths * 0.7)) {
    state = 'ending'
  }
  
  // Seleccionar frase aleatoria del array correspondiente
  const stateData = messagesData[state]
  const randomIndex = Math.floor(Math.random() * stateData.messages.length)
  
  return {
    message: stateData.messages[randomIndex],
    icon: stateData.icon,
    color: stateData.color
  }
}

export default function IngredientsCarousel({ 
  ingredients, 
  type, 
  isLoading, 
  itemsPerSlide = 3,
  animationType = 'ticker',
  onViewAll,
  totalCount,
  showStatic = false
}: IngredientsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const config = getVariantConfig(type)
  
  // Memoizar configuración para evitar re-renders
  const hasEnoughForAnimation = useMemo(() => {
    return ingredients.length > (animationType === 'slide' ? 1 : itemsPerSlide)
  }, [ingredients.length, animationType, itemsPerSlide])
  
  const shouldAnimate = useMemo(() => {
    return !showStatic && hasEnoughForAnimation
  }, [showStatic, hasEnoughForAnimation])

  // Animación unificada - funciona para todos los tipos
  useEffect(() => {
    if (!shouldAnimate || isPaused) return
    
    const interval = setInterval(() => {
      if (animationType === 'ticker') {
        setIsAnimating(true)
        setTimeout(() => {
          setCurrentIndex((prev) => prev >= ingredients.length - 1 ? 0 : prev + 1)
          setIsAnimating(false)
        }, 800)
      } else {
        setCurrentIndex((prev) => prev >= ingredients.length - 1 ? 0 : prev + 1)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [shouldAnimate, isPaused, ingredients.length, animationType])

  // Reset index si es necesario
  useEffect(() => {
    if (currentIndex >= ingredients.length && ingredients.length > 0) {
      setCurrentIndex(0)
    }
  }, [ingredients.length, currentIndex])

  // Get current visible ingredients - MEMOIZADO
  const visibleIngredients = useMemo(() => {
    if (animationType !== 'ticker' || ingredients.length === 0) return []
    
    const visible = []
    const maxItems = itemsPerSlide + 1 // +1 para el que entra desde abajo
    for (let i = 0; i < maxItems; i++) {
      const index = (currentIndex + i) % ingredients.length
      if (ingredients[index]) {
        visible.push(ingredients[index])
      }
    }
    return visible
  }, [animationType, currentIndex, ingredients, itemsPerSlide])

  // Generar mensajes fijos para ingredientes - MEMOIZADO
  const ingredientMessages = useMemo(() => {
    if (type !== 'seasonal') return {}
    
    const messages: { [key: number]: { message: string; icon: any; color: string } | null } = {}
    ingredients.forEach(ingredient => {
      if (ingredient.season) {
        messages[ingredient.ingredient_id] = getRandomSeasonalMessage(ingredient.season)
      }
    })
    return messages
  }, [type, ingredients])

  // Función para renderizar el contenido de cada ingrediente - MEMOIZADA
  const renderIngredientContent = useCallback((ingredient: CarouselIngredient) => {
    const seasonalData = type === 'seasonal' && ingredient.season 
      ? ingredientMessages[ingredient.ingredient_id] 
      : null
    
    return (
      <>
        {/* Nombre del ingrediente con icono a la izquierda para estacionales */}
        <div className="flex items-center gap-2 mb-1">
          {seasonalData && (() => {
            const IconComponent = seasonalData.icon
            return (
              <>
                <IconComponent className={`h-4 w-4 ${seasonalData.color}`} />
                <Link 
                  href={`/ingredients/${ingredient.ingredient_id}`}
                  className="font-medium text-gray-900 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  {ingredient.name}
                </Link>
              </>
            )
          })()}
          {!seasonalData && (
            <Link 
              href={`/ingredients/${ingredient.ingredient_id}`}
              className="font-medium text-gray-900 hover:text-orange-600 transition-colors cursor-pointer"
            >
              {ingredient.name}
            </Link>
          )}
        </div>
        
        {/* Mensaje debajo del nombre */}
        <div className="flex items-center gap-1">
          {seasonalData && (
            <span className="text-sm text-gray-600">
              {seasonalData.message}
            </span>
          )}
          {type === 'expiring' && ingredient.days_until_expiry !== undefined && (
            <>
              <Clock className={`h-3 w-3 ${config.accentColor}`} />
              <span className={`text-sm ${config.accentColor}`}>{ingredient.days_until_expiry} días restantes</span>
            </>
          )}
          {type === 'lowStock' && ingredient.deficit && (
            <>
              <TrendingDown className={`h-3 w-3 ${config.accentColor}`} />
              <span className={`text-sm ${config.accentColor}`}>Faltan {ingredient.deficit} {ingredient.unit}</span>
            </>
          )}
          {type === 'noSuppliers' && ingredient.category && (
            <>
              <AlertTriangle className={`h-3 w-3 ${config.accentColor}`} />
              <span className={`text-sm ${config.accentColor}`}>{ingredient.category}</span>
            </>
          )}
        </div>
      </>
    )
  }, [type, config.accentColor, ingredientMessages])
  
  // Componente para renderizar el contenido estático unificado
  const StaticContent = useCallback(() => (
    <div className="h-[180px] overflow-y-auto pr-1">
      <div className="space-y-0">
        {ingredients.map((ingredient, index) => (
          <div 
            key={ingredient.ingredient_id} 
            className={`h-[60px] flex flex-col justify-center py-2 ${
              index < ingredients.length - 1 ? 'border-b border-gray-200/30' : ''
            }`}
          >
            {renderIngredientContent(ingredient)}
          </div>
        ))}
      </div>
    </div>
  ), [ingredients, renderIngredientContent])

  if (isLoading) {
    return (
      <div className="p-4 min-h-[120px] flex items-center justify-center">
        <div className="animate-pulse space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!ingredients.length) {
    return (
      <div className="p-4 min-h-[120px] flex flex-col items-center justify-center text-center">
        <config.icon className="h-8 w-8 mb-2 text-orange-600" />
        <p className="text-sm text-gray-500 font-medium">{config.emptyMessage}</p>
        <p className="text-xs text-gray-400 mt-1">{config.emptySubmessage}</p>
      </div>
    )
  }

  return (
    <div 
      className="p-4 min-h-[120px] relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {ingredients.length > 0 && (
        <>
          {showStatic ? (
            <StaticContent />
          ) : (
            <>
              {/* Ticker Animation */}
              {animationType === 'ticker' && (
                <div className="h-[180px] overflow-hidden relative">
                  {visibleIngredients.map((ingredient, index) => {
                    const basePosition = index * 60
                    const animatedPosition = isAnimating ? basePosition - 60 : basePosition
                    
                    return (
                      <div 
                        key={`${ingredient.ingredient_id}-${currentIndex}-${index}`}
                        className="h-[60px] absolute w-full flex flex-col justify-center py-2 border-b border-gray-200/30 transition-transform duration-[800ms] ease-out"
                        style={{ transform: `translateY(${animatedPosition}px)` }}
                      >
                        {renderIngredientContent(ingredient)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Slide Animation */}
              {animationType === 'slide' && (
                <div className="h-[180px] overflow-hidden relative">
                  <div 
                    className={`flex transition-transform duration-500 ease-in-out h-full ${
                      isPaused ? '[transition-play-state:paused]' : ''
                    }`}
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {ingredients.map((ingredient, index) => (
                      <div key={`${ingredient.ingredient_id}-${index}`} className="min-w-full p-4 flex flex-col justify-center items-center text-center">
                        {renderIngredientContent(ingredient)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Indicador de más ingredientes - Unificado */}
          {(showStatic ? ingredients.length > itemsPerSlide : hasEnoughForAnimation) && (
            <div className="absolute bottom-2 right-2 text-xs">
              {onViewAll ? (
                <button 
                  onClick={onViewAll}
                  className="text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                >
                  Ver todos ({totalCount || ingredients.length})
                </button>
              ) : (
                <span className="text-gray-500">
                  +{(totalCount || ingredients.length) - (animationType === 'slide' ? 1 : itemsPerSlide)} más
                </span>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Control de pausa - Solo cuando hay animación */}
      {shouldAnimate && (
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          title={isPaused ? 'Reproducir' : 'Pausar'}
        >
          {isPaused ? (
            <Play className="h-3 w-3" />
          ) : (
            <Pause className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  )
}