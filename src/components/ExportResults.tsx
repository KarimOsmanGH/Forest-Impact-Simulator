"use client";

import React, { useState } from 'react';
import { 
  ExportData, 
  generateGeoJSON, 
  generateJSON, 
  generateCSV, 
  downloadFile, 
  formatTimestamp 
} from '@/utils/exportUtils';
import { generatePDFReport } from '@/utils/pdfExport';
import { generateShareableUrl, copyToClipboard, ShareableState } from '@/utils/shareableLink';

interface ExportResultsProps {
  exportData: ExportData;
  disabled?: boolean;
  shareableState?: ShareableState;
  onShareSuccess?: (message: string) => void;
}

const ExportResults: React.FC<ExportResultsProps> = ({ exportData, disabled = false, shareableState, onShareSuccess }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleExport = async (format: 'geojson' | 'json' | 'csv' | 'pdf') => {
    if (disabled || isExporting) return;
    
    setIsExporting(true);
    
    try {
      if (format === 'pdf') {
        await generatePDFReport(exportData);
      } else {
        const timestamp = formatTimestamp();
        let content: string;
        let filename: string;
        let mimeType: string;
        
        switch (format) {
          case 'geojson':
            content = generateGeoJSON(exportData);
            filename = `forest-impact-analysis-${timestamp}.geojson`;
            mimeType = 'application/geo+json';
            break;
          case 'json':
            content = generateJSON(exportData);
            filename = `forest-impact-analysis-${timestamp}.json`;
            mimeType = 'application/json';
            break;
          case 'csv':
            content = generateCSV(exportData);
            filename = `forest-impact-analysis-${timestamp}.csv`;
            mimeType = 'text/csv';
            break;
          default:
            throw new Error('Unsupported export format');
        }
        
        downloadFile(content, filename, mimeType);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (disabled) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">Complete your analysis to enable exports</p>
      </div>
    );
  }

  const handleShare = async () => {
    if (!shareableState || disabled) return;
    
    setIsSharing(true);
    try {
      const url = generateShareableUrl(shareableState);
      const success = await copyToClipboard(url);
      
      if (success && onShareSuccess) {
        onShareSuccess('Link copied to clipboard!');
      } else if (!success) {
        onShareSuccess?.('Failed to copy link. Please try again.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      onShareSuccess?.('Failed to generate share link.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Export and Share Results</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="flex flex-col items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-xl mb-1">📋</div>
          <span className="text-xs font-medium">PDF Report</span>
          <span className="text-xs text-gray-500 hidden sm:block">Formatted</span>
        </button>

        <button
          onClick={() => handleExport('geojson')}
          disabled={isExporting}
          className="flex flex-col items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-xl mb-1">🗺️</div>
          <span className="text-xs font-medium">GeoJSON</span>
          <span className="text-xs text-gray-500 hidden sm:block">GIS tools</span>
        </button>
        
        <button
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="flex flex-col items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-xl mb-1">📄</div>
          <span className="text-xs font-medium">JSON</span>
          <span className="text-xs text-gray-500 hidden sm:block">Complete</span>
        </button>
        
        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="flex flex-col items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-xl mb-1">📊</div>
          <span className="text-xs font-medium">CSV</span>
          <span className="text-xs text-gray-500 hidden sm:block">R/Python</span>
        </button>

        {shareableState && (
          <button
            onClick={handleShare}
            disabled={disabled || isSharing}
            className="flex flex-col items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-xl mb-1">🔗</div>
            <span className="text-xs font-medium">Share Link</span>
            <span className="text-xs text-gray-500 hidden sm:block">Copy URL</span>
          </button>
        )}
      </div>
      
      {(isExporting || isSharing) && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            {isSharing ? 'Generating share link...' : 'Preparing export...'}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <h4 className="text-sm font-medium text-primary mb-2">Export Includes:</h4>
        <ul className="text-xs text-primary space-y-1">
          <li>• Location coordinates and region boundaries</li>
          <li>• Selected tree species/forest types and percentages</li>
          <li>• Environmental data (soil, climate)</li>
          <li>• Impact calculations (carbon sequestration/emissions, biodiversity, etc.)</li>
          <li>• Planting/removal specifications and configuration</li>
          <li>• Simulation metadata and timestamp</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportResults; 