// src/pages/supplier-orders/components/HistorySection.jsx
import React from 'react';
import { FaHistory } from 'react-icons/fa';
import Loading from '../../../components/loading';
import HistoryMetrics from './HistoryMetrics';
import HistoryTrends from './HistoryTrends';
import RecentOrders from './RecentOrders';
import HistoryActions from './HistoryActions';
import { useHistory } from '../hooks/useHistory';

const HistorySection = ({ onOrderClick, onShowReportsModal }) => {
  const { historyMetrics, historyLoading } = useHistory();

  return (
    <div className="history-section">
      <h2 className="section-title">
        <FaHistory />
        Historial y Reportes
      </h2>
      
      {historyLoading ? (
        <Loading message="Cargando datos de historial..." size="medium" inline />
      ) : historyMetrics ? (
        <>
          {/* Dashboard de métricas rápidas */}
          <div className="history-dashboard">
            <HistoryMetrics historyMetrics={historyMetrics} />

            {/* Tendencias recientes */}
            <HistoryTrends historyMetrics={historyMetrics} />

            {/* Pedidos recientes */}
            <RecentOrders 
              historyMetrics={historyMetrics} 
              onOrderClick={onOrderClick} 
            />
          </div>
        </>
      ) : (
        <div className="error-state">
          <p>Error al cargar datos del historial</p>
        </div>
      )}

      {/* Acciones rápidas */}
      <HistoryActions onShowReportsModal={onShowReportsModal} />
    </div>
  );
};

export default HistorySection;