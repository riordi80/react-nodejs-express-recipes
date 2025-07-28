// src/pages/supplier-orders/components/HistoryActions.jsx
import React from 'react';
import { FaChartBar, FaDownload } from 'react-icons/fa';
import api from '../../../api/axios';

const HistoryActions = ({ onShowReportsModal }) => {
  const handleExportData = async () => {
    try {
      const response = await api.get('/supplier-orders/export?format=csv', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pedidos_completo_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  return (
    <div className="history-actions">
      <div className="actions-grid">
        <button 
          className="btn add"
          onClick={onShowReportsModal}
        >
          <FaChartBar />
          Reportes Detallados
        </button>
        <button 
          className="btn edit"
          onClick={handleExportData}
        >
          <FaDownload />
          Exportar Todo
        </button>
      </div>
    </div>
  );
};

export default HistoryActions;