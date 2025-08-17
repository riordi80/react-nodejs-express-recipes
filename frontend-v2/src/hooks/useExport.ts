import { useState } from 'react';

interface ExportField<T> {
  key: keyof T | string;
  label: string;
  format?: (value: any, item: T) => string;
}

interface UseExportProps<T> {
  filename: string;
  fields: ExportField<T>[];
}

export function useExport<T>({ filename, fields }: UseExportProps<T>) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = async (items: T[]): Promise<boolean> => {
    if (items.length === 0) return false;

    setExporting(true);
    
    try {
      // Create CSV headers
      const headers = fields.map(field => field.label);
      
      // Create CSV data
      const csvData = items.map(item => 
        fields.map(field => {
          let value: any;
          
          if (typeof field.key === 'string' && field.key.includes('.')) {
            // Handle nested properties like 'user.name'
            value = field.key.split('.').reduce((obj, key) => obj?.[key], item as any);
          } else {
            value = (item as any)[field.key];
          }
          
          // Apply custom formatting if provided
          if (field.format) {
            value = field.format(value, item);
          }
          
          // Handle null/undefined values
          if (value === null || value === undefined) {
            value = '';
          }
          
          // Convert to string and escape quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );

      // Combine headers and data
      const csvContent = [headers.join(','), ...csvData].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${filename}_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(link.href);
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return false;
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async (items: T[]): Promise<boolean> => {
    if (items.length === 0) return false;

    setExporting(true);
    
    try {
      const jsonContent = JSON.stringify(items, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${filename}_${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      
      return true;
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      return false;
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportToCSV,
    exportToJSON
  };
}