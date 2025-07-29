// src/components/modals/ReportsModal.jsx
import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaDownload, FaFilter, FaChartLine, FaSpinner, FaFileExport } from 'react-icons/fa';
import Modal from '../modal/Modal';
import TabsModal from '../tabs-modal/TabsModal';
import api from '../../api/axios';
import { formatCurrency, formatDecimal, formatDateForInput, parseEuropeanDate } from '../../utils/formatters';
import './ReportsModal.css';

const ReportsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('history');

  // Definir pestañas para TabsModal
  const tabs = [
    {
      id: 'history',
      label: 'Historial',
      icon: FaCalendarAlt
    },
    {
      id: 'trends',
      label: 'Tendencias',
      icon: FaChartLine
    }
  ];
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supplierId: 'all',
    status: 'all',
    minAmount: '',
    maxAmount: '',
    createdBy: 'all',
    orderBy: 'order_date',
    sortDirection: 'DESC',
    page: 1,
    limit: 25
  });

  // Estados para datos
  const [historyData, setHistoryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);

  // Estados para modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manejar cambios en campos de fecha
  const handleDateChange = (field, displayValue) => {
    const isoDate = parseEuropeanDate(displayValue);
    handleFilterChange(field, isoDate);
  };

  // Cargar datos iniciales
  useEffect(() => {
    console.log('🚀 Modal abierto:', isOpen, 'Tab activo:', activeTab);
    if (isOpen) {
      loadSuppliers();
      loadUsers();
      if (activeTab === 'history') {
        loadHistory();
      } else if (activeTab === 'trends') {
        loadTrends();
      }
    }
  }, [isOpen, activeTab]);

  // Cargar historial cuando cambien los filtros
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      const timeoutId = setTimeout(() => {
        loadHistory();
      }, 500); // Debounce de 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [filters, isOpen, activeTab]);

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadHistory = async () => {
    console.log('🔄 Cargando historial...');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      console.log('📊 URL de historial:', `/supplier-orders/history?${params}`);
      const response = await api.get(`/supplier-orders/history?${params}`);
      console.log('✅ Datos de historial recibidos:', response.data);
      setHistoryData(response.data);
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      alert(`Error al cargar historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    console.log('📈 Cargando tendencias...');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: 'month',
        months: 12,
        supplierId: filters.supplierId
      });

      console.log('📊 URL de tendencias:', `/supplier-orders/trends?${params}`);
      const response = await api.get(`/supplier-orders/trends?${params}`);
      console.log('✅ Datos de tendencias recibidos:', response.data);
      setTrendsData(response.data);
    } catch (error) {
      console.error('❌ Error al cargar tendencias:', error);
      alert(`Error al cargar tendencias: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 }) // Reset page when other filters change
    }));
  };

  const handleExport = async (format = 'csv') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '' && key !== 'page' && key !== 'limit') {
          params.append(key, value);
        }
      });
      params.append('format', format);

      const response = await api.get(`/supplier-orders/export?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Crear enlace de descarga para CSV
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pedidos_proveedores_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.log('Datos exportados:', response.data);
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      setErrorMessage('Error al exportar los datos. Por favor, inténtalo de nuevo.');
      setShowErrorModal(true);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      supplierId: 'all',
      status: 'all',
      minAmount: '',
      maxAmount: '',
      createdBy: 'all',
      orderBy: 'order_date',
      sortDirection: 'DESC',
      page: 1,
      limit: 25
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pendiente',
      ordered: 'Confirmado',
      delivered: 'Recibido',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const renderFilters = () => (
    <div className="reports-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label>Fecha Inicio</label>
          <div className="date-input-wrapper">
            <input
              type="text"
              value={formatDateForInput(filters.startDate)}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              placeholder="dd/mm/yyyy"
              pattern="\d{2}/\d{2}/\d{4}"
              maxLength="10"
              className="date-display-input"
            />
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="date-picker-input"
            />
          </div>
        </div>
        <div className="filter-group">
          <label>Fecha Fin</label>
          <div className="date-input-wrapper">
            <input
              type="text"
              value={formatDateForInput(filters.endDate)}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              placeholder="dd/mm/yyyy"
              pattern="\d{2}/\d{2}/\d{4}"
              maxLength="10"
              className="date-display-input"
            />
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="date-picker-input"
            />
          </div>
        </div>
        <div className="filter-group">
          <label>Proveedor</label>
          <select
            value={filters.supplierId}
            onChange={(e) => handleFilterChange('supplierId', e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="999">Sin Proveedor Asignado</option>
            {suppliers.map(supplier => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="ordered">Confirmado</option>
            <option value="delivered">Recibido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>
      <div className="filters-row">
        <div className="filter-group">
          <label>Importe Mínimo</label>
          <input
            type="number"
            step="0.01"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            placeholder="€ mín"
          />
        </div>
        <div className="filter-group">
          <label>Importe Máximo</label>
          <input
            type="number"
            step="0.01"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            placeholder="€ máx"
          />
        </div>
        <div className="filter-group">
          <label>Creado por</label>
          <select
            value={filters.createdBy}
            onChange={(e) => handleFilterChange('createdBy', e.target.value)}
          >
            <option value="all">Todos</option>
            {users.map(user => (
              <option key={user.user_id} value={user.user_id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Fila separada para botones de acción en desktop */}
      <div className="filters-actions-row">
        <div className="filter-actions">
          <button className="btn secondary" onClick={resetFilters}>
            <FaFilter /> Limpiar
          </button>
          <button 
            className="btn primary" 
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? <FaSpinner className="spinning" /> : <FaFileExport />}
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <FaSpinner className="spinning" />
          <p>Cargando historial...</p>
        </div>
      );
    }

    if (!historyData) return null;

    return (
      <div className="history-tab">
        {renderFilters()}
        
        {/* Estadísticas */}
        <div className="history-stats">
          <div className="stat-card">
            <h4>Total de Pedidos</h4>
            <span className="stat-value">{historyData.statistics.totalOrders}</span>
          </div>
          <div className="stat-card">
            <h4>Importe Total</h4>
            <span className="stat-value">{formatCurrency(historyData.statistics.totalAmount)}</span>
          </div>
          <div className="stat-card">
            <h4>Importe Promedio</h4>
            <span className="stat-value">{formatCurrency(historyData.statistics.averageAmount)}</span>
          </div>
          <div className="stat-card">
            <h4>Recibidos</h4>
            <span className="stat-value">{historyData.statistics.statusBreakdown.delivered}</span>
          </div>
        </div>

        {/* Tabla de pedidos */}
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Importe</th>
                <th>Items</th>
                <th>Creado por</th>
              </tr>
            </thead>
            <tbody>
              {historyData.orders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.supplier_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>{order.items_count}</td>
                  <td>{order.first_name} {order.last_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {historyData.pagination && historyData.pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn secondary"
              disabled={!historyData.pagination.hasPrev}
              onClick={() => handleFilterChange('page', historyData.pagination.currentPage - 1)}
            >
              Anterior
            </button>
            <span className="page-info">
              Página {historyData.pagination.currentPage} de {historyData.pagination.totalPages}
            </span>
            <button
              className="btn secondary"
              disabled={!historyData.pagination.hasNext}
              onClick={() => handleFilterChange('page', historyData.pagination.currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTrendsTab = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <FaSpinner className="spinning" />
          <p>Cargando tendencias...</p>
        </div>
      );
    }

    if (!trendsData) return null;

    return (
      <div className="trends-tab">
        <div className="trends-filters">
          <div className="filter-group">
            <label>Proveedor</label>
            <select
              value={filters.supplierId}
              onChange={(e) => {
                handleFilterChange('supplierId', e.target.value);
                // Reload trends when supplier changes
                setTimeout(loadTrends, 100);
              }}
            >
              <option value="all">Todos</option>
              <option value="999">Sin Proveedor Asignado</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Métricas de entrega */}
        <div className="trends-metrics">
          <h4>Métricas de Entrega</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Tiempo Promedio</span>
              <span className="metric-value">
                {trendsData.deliveryMetrics.avg_delivery_days ? 
                  `${Math.round(trendsData.deliveryMetrics.avg_delivery_days)} días` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Entregas a Tiempo</span>
              <span className="metric-value">
                {trendsData.deliveryMetrics.on_time_percentage ? 
                  `${Math.round(trendsData.deliveryMetrics.on_time_percentage)}%` : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Top proveedores */}
        <div className="trends-suppliers">
          <h4>Top Proveedores (Últimos 12 meses)</h4>
          <div className="suppliers-list">
            {trendsData.supplierTrends.map((supplier, index) => (
              <div key={index} className="supplier-trend-item">
                <div className="supplier-info">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{supplier.supplier_name}</span>
                </div>
                <div className="supplier-stats">
                  <span className="orders">{supplier.total_orders} pedidos</span>
                  <span className="amount">{formatCurrency(supplier.total_spending)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por estado */}
        <div className="trends-status">
          <h4>Distribución por Estado</h4>
          <div className="status-distribution">
            {trendsData.statusDistribution.map(status => (
              <div key={status.status} className="status-item">
                <span className={`status-badge ${status.status}`}>
                  {getStatusLabel(status.status)}
                </span>
                <span className="status-count">{status.count} pedidos</span>
                <span className="status-amount">{formatCurrency(status.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaChartLine />
          Reportes y Historial de Pedidos
        </div>
      }
      fullscreen={true}
    >
      <div className="reports-modal">
        <TabsModal
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'trends' && renderTrendsTab()}
        </TabsModal>
      </div>

      {/* Modal de Error */}
      {showErrorModal && (
        <Modal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
              <FaFileExport />
              Error de Exportación
            </div>
          }
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              color: '#dc2626', 
              marginBottom: '16px' 
            }}>
              ⚠️
            </div>
            <p style={{ 
              fontSize: '16px', 
              color: '#374151', 
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              {errorMessage}
            </p>
            <button 
              onClick={() => setShowErrorModal(false)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default ReportsModal;