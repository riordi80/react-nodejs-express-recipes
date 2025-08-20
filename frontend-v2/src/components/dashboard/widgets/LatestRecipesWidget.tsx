// components/dashboard/widgets/LatestRecipesWidget.tsx
// Widget para últimas recetas añadidas

'use client';

import React from 'react';
import { ChefHat, Clock, Users } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useLatestRecipes } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface LatestRecipesWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

// Mapeo de dificultad
const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-800', label: 'Fácil' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Intermedio' },
  hard: { color: 'bg-red-100 text-red-800', label: 'Difícil' }
};

const LatestRecipesWidget: React.FC<LatestRecipesWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useLatestRecipes(limit, enabled);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  return (
    <DashboardWidget
      id="latestRecipes"
      title="Últimas Recetas"
      icon={ChefHat}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Sin recetas recientes"
          description="No se han añadido recetas recientemente"
        />
      ) : (
        <div className="space-y-3">
          {data.map((recipe) => {
            const difficultyInfo = difficultyConfig[recipe.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;
            
            return (
              <div
                key={recipe.recipe_id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate mr-2">
                    {recipe.name}
                  </h4>
                  <Badge className={difficultyInfo.color} size="sm">
                    {difficultyInfo.label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>{recipe.prep_time || 0} min</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{recipe.servings || 0} pers.</span>
                  </div>
                  
                  {recipe.cost_per_serving && typeof recipe.cost_per_serving === 'number' && (
                    <div className="col-span-2 text-right">
                      <span className="font-medium text-orange-600">
                        {recipe.cost_per_serving.toFixed(2)}€/pers.
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Añadida {formatDate(recipe.created_at)}
                </div>
              </div>
            );
          })}
          
          {!compact && data.length > 0 && (
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {data.length} recetas recientes
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default LatestRecipesWidget;