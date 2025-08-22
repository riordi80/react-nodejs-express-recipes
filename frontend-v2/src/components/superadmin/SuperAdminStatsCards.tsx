'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

interface StatCard {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  icon: React.ComponentType<any>;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
}

interface SuperAdminStatsCardsProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const getColorClasses = (isDark: boolean) => {
  if (isDark) {
    return {
      blue: 'text-blue-400',
      green: 'text-green-400', 
      red: 'text-red-400',
      yellow: 'text-yellow-400',
      purple: 'text-purple-400',
      gray: 'text-gray-400'
    };
  } else {
    return {
      blue: 'text-blue-600',
      green: 'text-green-600', 
      red: 'text-red-600',
      yellow: 'text-amber-600',
      purple: 'text-purple-600',
      gray: 'text-gray-600'
    };
  }
};

const gridClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3', 
  4: 'grid-cols-1 md:grid-cols-4'
};

export default function SuperAdminStatsCards({
  stats,
  columns = 4,
  className = ''
}: SuperAdminStatsCardsProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const colorClasses = getColorClasses(isDark);

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 mb-8 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className={`rounded-lg p-6 border ${themeClasses.card}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className={`${themeClasses.textSecondary} text-sm truncate`}>
                {stat.title}
              </p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${colorClasses[stat.color]}`}>
                  {stat.value}
                </p>
                {stat.change && (
                  <div className={`flex items-center text-xs ${stat.change.type === 'increase' ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                    <span className="font-medium">
                      {stat.change.type === 'increase' ? '+' : '-'}{Math.abs(stat.change.value)}%
                    </span>
                    {stat.change.period && (
                      <span className={`ml-1 ${themeClasses.textSecondary}`}>
                        {stat.change.period}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <stat.icon className={`h-8 w-8 ${colorClasses[stat.color]} flex-shrink-0`} />
          </div>
        </div>
      ))}
    </div>
  );
}