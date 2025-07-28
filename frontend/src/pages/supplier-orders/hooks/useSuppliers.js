// src/pages/supplier-orders/hooks/useSuppliers.js
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export const useSuppliers = () => {
  const [suppliersAnalysis, setSuppliersAnalysis] = useState([]);
  const [suppliersAnalysisLoading, setSuppliersAnalysisLoading] = useState(false);

  const loadSuppliersAnalysis = async () => {
    try {
      setSuppliersAnalysisLoading(true);
      const response = await api.get('/supplier-orders/suppliers/analysis');
      setSuppliersAnalysis(response.data);
      setSuppliersAnalysisLoading(false);
    } catch (error) {
      console.error('Error loading suppliers analysis:', error);
      setSuppliersAnalysisLoading(false);
    }
  };

  // Load data when hook is first used
  useEffect(() => {
    loadSuppliersAnalysis();
  }, []);

  return {
    suppliersAnalysis,
    suppliersAnalysisLoading,
    loadSuppliersAnalysis
  };
};