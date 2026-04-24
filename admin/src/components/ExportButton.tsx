import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { api } from '../api/axios';

interface Props {
  endpoint: string;
  filename: string;
  label?: string;
  className?: string;
  isPdf?: boolean;
}

export const ExportButton: React.FC<Props> = ({ 
  endpoint, 
  filename, 
  label = 'Export', 
  className = '', 
  isPdf = false 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });
      
      const type = isPdf ? 'application/pdf' : 'text/csv';
      const blob = new Blob([response.data], { type });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isExporting ? 'Generating...' : label}</span>
    </button>
  );
};
