'use client'

import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'

interface FilterBarProps {
  // Search
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  searchText: string
  onSearchTextChange: (value: string) => void
  
  // Category
  categoryOptions: string[]
  selectedCategories: string[]
  onCategoriesChange: (values: string[]) => void
  
  // Prep Time
  prepTimeOptions: number[]
  selectedPrepTime: number | null
  onPrepTimeChange: (value: number | null) => void
  
  // Difficulty
  difficultyOptions: Array<{ value: string; label: string }>
  selectedDifficulty: string
  onDifficultyChange: (value: string) => void
  
  // Ingredient
  ingredientOptions: string[]
  selectedIngredient: string
  onIngredientChange: (value: string) => void
  
  // Allergens
  allergenOptions: string[]
  selectedAllergens: string[]
  onAllergensChange: (values: string[]) => void
}

export default function FilterBar({
  searchInputRef,
  searchText,
  onSearchTextChange,
  categoryOptions,
  selectedCategories,
  onCategoriesChange,
  prepTimeOptions,
  selectedPrepTime,
  onPrepTimeChange,
  difficultyOptions,
  selectedDifficulty,
  onDifficultyChange,
  ingredientOptions,
  selectedIngredient,
  onIngredientChange,
  allergenOptions,
  selectedAllergens,
  onAllergensChange
}: FilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const hasActiveFilters = selectedCategories.length > 0 || selectedPrepTime || selectedDifficulty || 
                          selectedIngredient || selectedAllergens.length > 0

  const clearAllFilters = () => {
    onCategoriesChange([])
    onPrepTimeChange(null)
    onDifficultyChange('')
    onIngredientChange('')
    onAllergensChange([])
  }


  const formatPrepTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }


  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      {/* Main Filter Row */}
      <div className="p-4">
        <div className="flex flex-col 2xl:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar recetas..."
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Mobile/Tablet/Desktop: Only show dropdown */}
          <div className="2xl:hidden">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors h-[42px] ${
                showAdvancedFilters || hasActiveFilters
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {[selectedPrepTime, selectedDifficulty, selectedIngredient]
                    .filter(Boolean).length + (selectedCategories.length > 0 ? 1 : 0) + (selectedAllergens.length > 0 ? 1 : 0)}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Very Large Desktop: All filters inline */}
          <div className="hidden 2xl:flex flex-wrap gap-2 flex-shrink-0">
            {/* Category */}
            <MultiSelectDropdown
              options={categoryOptions}
              selected={selectedCategories}
              onChange={onCategoriesChange}
              placeholder="Categorías"
              className="whitespace-nowrap"
            />

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
            >
              <option value="">Dificultad</option>
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Prep Time */}
            <select
              value={selectedPrepTime || ''}
              onChange={(e) => onPrepTimeChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
            >
              <option value="">Tiempo</option>
              {prepTimeOptions.map(time => (
                <option key={time} value={time}>
                  {formatPrepTime(time)}
                </option>
              ))}
            </select>

            {/* Ingredient */}
            <select
              value={selectedIngredient}
              onChange={(e) => onIngredientChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
            >
              <option value="">Ingrediente</option>
              {ingredientOptions.map(ingredient => (
                <option key={ingredient} value={ingredient}>
                  {ingredient}
                </option>
              ))}
            </select>

            {/* Allergens */}
            <MultiSelectDropdown
              options={allergenOptions}
              selected={selectedAllergens}
              onChange={onAllergensChange}
              placeholder="Alérgenos"
              className="whitespace-nowrap"
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 whitespace-nowrap h-[42px]"
              >
                <X className="h-4 w-4" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters - Only show when dropdown is open (all except very large desktop) */}
      {showAdvancedFilters && (
        <div className="2xl:hidden border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <MultiSelectDropdown
              options={categoryOptions}
              selected={selectedCategories}
              onChange={onCategoriesChange}
              placeholder="Seleccionar categorías..."
              className="w-full"
            />

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">Cualquier dificultad</option>
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Prep Time */}
            <select
              value={selectedPrepTime || ''}
              onChange={(e) => onPrepTimeChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">Cualquier tiempo</option>
              {prepTimeOptions.map(time => (
                <option key={time} value={time}>
                  Hasta {formatPrepTime(time)}
                </option>
              ))}
            </select>

            {/* Ingredient */}
            <select
              value={selectedIngredient}
              onChange={(e) => onIngredientChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">Cualquier ingrediente</option>
              {ingredientOptions.map(ingredient => (
                <option key={ingredient} value={ingredient}>
                  {ingredient}
                </option>
              ))}
            </select>

            {/* Allergens */}
            <MultiSelectDropdown
              options={allergenOptions}
              selected={selectedAllergens}
              onChange={onAllergensChange}
              placeholder="Seleccionar alérgenos..."
              className="w-full"
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Limpiar</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Filters Tags - Only in mobile */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(category => (
                  <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Categoría: {category}
                    <button
                      onClick={() => onCategoriesChange(selectedCategories.filter(c => c !== category))}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedPrepTime && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Tiempo: {formatPrepTime(selectedPrepTime)}
                    <button
                      onClick={() => onPrepTimeChange(null)}
                      className="ml-1 hover:text-green-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Dificultad: {difficultyOptions.find(d => d.value === selectedDifficulty)?.label}
                    <button
                      onClick={() => onDifficultyChange('')}
                      className="ml-1 hover:text-yellow-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedIngredient && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Ingrediente: {selectedIngredient}
                    <button
                      onClick={() => onIngredientChange('')}
                      className="ml-1 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedAllergens.map(allergen => (
                  <span key={allergen} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                    Sin {allergen}
                    <button
                      onClick={() => onAllergensChange(selectedAllergens.filter(a => a !== allergen))}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}