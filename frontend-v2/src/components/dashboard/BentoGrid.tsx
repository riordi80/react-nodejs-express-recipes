// components/dashboard/BentoGrid.tsx
// Layout tipo Bento/Masonry para widgets del dashboard

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BentoGridProps {
  children: React.ReactNode[];
  className?: string;
}

const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  // Calcular número de columnas responsivo
  useEffect(() => {
    const updateColumnCount = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      
      // Breakpoints responsivos similares a Tailwind
      let newColumnCount = 1; // mobile default
      
      if (containerWidth >= 1280) { // xl
        newColumnCount = 3;
      } else if (containerWidth >= 1024) { // lg  
        newColumnCount = 2;
      } else if (containerWidth >= 640) { // sm
        newColumnCount = 2;
      } else {
        newColumnCount = 1;
      }
      
      setColumnCount(newColumnCount);
    };

    updateColumnCount();
    
    const resizeObserver = new ResizeObserver(updateColumnCount);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Obtener peso estimado de un widget basado en su tipo (mejorado)
  const getWidgetWeight = (child: React.ReactNode): number => {
    if (React.isValidElement(child) && child.props?.widget?.id) {
      const widgetId = child.props.widget.id;
      
      // Widgets pesados (contenido denso, gráficos, muchos elementos)
      const heavyWidgets = ['recipesByCategory', 'costTrends', 'eventsWithMenus'];
      
      // Widgets medianos (listas con detalles)
      const mediumWidgets = ['seasonalAlerts', 'upcomingEvents', 'pendingOrders'];
      
      // Widgets ligeros (listas simples, alertas básicas)
      const lightWidgets = ['stockAlerts', 'seasonalIngredients', 'latestRecipes'];
      
      if (heavyWidgets.includes(widgetId)) return 3;
      if (mediumWidgets.includes(widgetId)) return 2;
      if (lightWidgets.includes(widgetId)) return 1;
      
      return 1.5; // peso por defecto para widgets desconocidos
    }
    
    return 1;
  };

  // Distribución híbrida: round-robin con ajustes por peso
  const distributeInColumns = () => {
    const columns: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
    const columnItems: number[] = new Array(columnCount).fill(0);
    
    // Primera pasada: distribución round-robin básica
    children.forEach((child, index) => {
      const baseColumnIndex = index % columnCount;
      columns[baseColumnIndex].push(child);
      columnItems[baseColumnIndex]++;
    });
    
    // Si alguna columna tiene significativamente menos elementos, rebalancear
    const maxItems = Math.max(...columnItems);
    const minItems = Math.min(...columnItems);
    
    // Si hay gran desequilibrio (diferencia > 1), intentar rebalancear
    if (maxItems - minItems > 1) {
      // Encontrar columnas desbalanceadas
      const heaviestColumnIndex = columnItems.indexOf(maxItems);
      const lightestColumnIndex = columnItems.indexOf(minItems);
      
      // Mover el último elemento de la columna más pesada a la más ligera
      if (columns[heaviestColumnIndex].length > 1) {
        const elementToMove = columns[heaviestColumnIndex].pop();
        if (elementToMove) {
          columns[lightestColumnIndex].push(elementToMove);
        }
      }
    }
    
    return columns;
  };

  const columns = distributeInColumns();

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
    >
      {/* CSS Grid con items-start para layout masonry */}
      <div 
        className="grid gap-6 items-start"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
      >
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex flex-col gap-6"
          >
            {column}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BentoGrid;