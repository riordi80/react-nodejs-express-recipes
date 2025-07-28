// src/pages/supplier-orders/components/SuppliersSection.jsx
import React from 'react';
import { FaTruck } from 'react-icons/fa';
import Loading from '../../../components/loading';
import SuppliersSummary from './SuppliersSummary';
import SuppliersRanking from './SuppliersRanking';
import SuppliersComparison from './SuppliersComparison';
import { useSuppliers } from '../hooks/useSuppliers';

const SuppliersSection = () => {
  const { suppliersAnalysis, suppliersAnalysisLoading } = useSuppliers();

  return (
    <div className="suppliers-section">
      <h2 className="section-title">
        <FaTruck />
        Análisis de Proveedores
      </h2>
      
      {suppliersAnalysisLoading ? (
        <Loading message="Cargando análisis de proveedores..." size="medium" inline />
      ) : suppliersAnalysis.length === 0 ? (
        <div className="empty-state">
          <p>No hay datos suficientes para generar análisis</p>
          <p>Crea algunos pedidos y asigna proveedores para ver estadísticas</p>
        </div>
      ) : (
        <div className="suppliers-analysis">
          {/* Resumen general */}
          <SuppliersSummary suppliersAnalysis={suppliersAnalysis} />

          {/* Ranking de proveedores */}
          <SuppliersRanking suppliersAnalysis={suppliersAnalysis} />

          {/* Comparativa detallada */}
          <SuppliersComparison suppliersAnalysis={suppliersAnalysis} />
        </div>
      )}
    </div>
  );
};

export default SuppliersSection;