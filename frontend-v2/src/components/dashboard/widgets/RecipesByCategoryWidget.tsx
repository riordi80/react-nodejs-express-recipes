// components/dashboard/widgets/RecipesByCategoryWidget.tsx

'use client';

import React from 'react';
import { BarChart3, ChefHat } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useRecipesByCategory } from '@/hooks/useDashboardWidgets';
import { EmptyState } from '@/components/ui';

interface RecipesByCategoryWidgetProps {
  enabled?: boolean;
  compact?: boolean;
}

const RecipesByCategoryWidget: React.FC<RecipesByCategoryWidgetProps> = ({
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useRecipesByCategory(enabled);

  // Calcular el máximo para las barras
  const maxCount = Math.max(...data.map(item => item.recipe_count), 1);

  // Colores para las categorías
  const colors = [
    'bg-orange-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500'
  ];

  return (
    <DashboardWidget
      id="recipesByCategory"
      title="Recetas por Categoría"
      icon={BarChart3}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Sin categorías"
          description="No hay recetas clasificadas por categorías"
        />
      ) : (
        <div className="space-y-3">
          {data.slice(0, compact ? 4 : 6).map((category, index) => {
            const percentage = (category.recipe_count / maxCount) * 100;
            const color = colors[index % colors.length];
            
            return (
              <div key={category.category_name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 truncate mr-2">
                    {category.category_name}
                  </span>
                  <span className="text-gray-600 font-medium">
                    {category.recipe_count}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          {!compact && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Total: {data.reduce((sum, cat) => sum + cat.recipe_count, 0)} recetas
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  en {data.length} categorías
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default RecipesByCategoryWidget;