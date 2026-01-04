import React from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { excelExportService, ExportOptions } from '../lib/excelExportService';
import { KeuanganEkspor } from '../lib/supabase';

interface ExcelExportButtonProps {
  data: KeuanganEkspor[] | any[];
  activeTab: 'budget-planning' | 'cashflow-tracking' | 'analysis';
  filterPeriod?: string;
  className?: string;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({ 
  data, 
  activeTab, 
  filterPeriod,
  className = "" 
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportingType, setExportingType] = React.useState<string | null>(null);

  // Generate filename based on tab and current date
  const generateFilename = (exportType: string) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const periodText = filterPeriod && filterPeriod !== 'all' ? filterPeriod : 'semua-periode';
    
    switch (exportType) {
      case 'budget-planning':
        return `Budget_Planning_Detail_${periodText}_${currentDate}.xlsx`;
      case 'cashflow-tracking':
        return `Cashflow_Tracking_Detail_${periodText}_${currentDate}.xlsx`;
      case 'analysis':
        return `Analysis_Report_${periodText}_${currentDate}.xlsx`;
      default:
        return `Keuangan_Ekspor_${periodText}_${currentDate}.xlsx`;
    }
  };

  // Generate title based on export type
  const generateTitle = (exportType: string) => {
    switch (exportType) {
      case 'budget-planning':
        return 'LAPORAN BUDGET PLANNING EKSPOR';
      case 'cashflow-tracking':
        return 'LAPORAN CASHFLOW TRACKING EKSPOR';
      case 'analysis':
        return 'LAPORAN ANALISIS KEUANGAN EKSPOR';
      default:
        return 'LAPORAN KEUANGAN EKSPOR';
    }
  };

  // Handle export function
  const handleExport = async (exportType: 'budget-planning' | 'cashflow-tracking' | 'analysis') => {
    try {
      setIsExporting(true);
      setExportingType(exportType);

      const options: ExportOptions = {
        filename: generateFilename(exportType),
        title: generateTitle(exportType),
        period: filterPeriod && filterPeriod !== 'all' ? filterPeriod : undefined,
        data: data,
        exportType: exportType
      };

      await excelExportService.exportToExcel(options);
      
      // Optional: Show success notification
      console.log(`Successfully exported ${exportType} to Excel`);
      
    } catch (error) {
      console.error('Export failed:', error);
      // Optional: Show error notification
      alert('Export gagal. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  // Get export button text based on active tab
  const getExportButtonText = () => {
    switch (activeTab) {
      case 'budget-planning':
        return 'Export Budget Planning';
      case 'cashflow-tracking':
        return 'Export Cashflow Tracking';
      case 'analysis':
        return 'Export Analysis';
      default:
        return 'Export Excel';
    }
  };

  // Check if data is available
  const hasData = data && data.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`px-6 py-3 h-auto font-medium ${className} ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!hasData || isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          {isExporting ? 'Exporting...' : getExportButtonText()}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 bg-white border-gray-200 shadow-2xl">
        {/* Current Tab Export */}
        <DropdownMenuItem 
          onClick={() => handleExport(activeTab)}
          disabled={!hasData || isExporting}
          className="flex items-center space-x-3 p-4 hover:bg-gray-50 focus:bg-gray-100"
        >
          {exportingType === activeTab ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <Download className="h-4 w-4 text-blue-600" />
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">
              {activeTab === 'budget-planning' && 'Budget Planning (5 Sheets)'}
              {activeTab === 'cashflow-tracking' && 'Cashflow Tracking (5 Sheets)'}
              {activeTab === 'analysis' && 'Analysis Report (5 Sheets)'}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Export data tab saat ini
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2 bg-gray-200" />
        
        {/* All Export Options */}
        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
          Export Semua Format:
        </div>
        
        <DropdownMenuItem 
          onClick={() => handleExport('budget-planning')}
          disabled={!hasData || isExporting}
          className="flex items-center space-x-3 p-4 hover:bg-blue-50 focus:bg-blue-100"
        >
          {exportingType === 'budget-planning' ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Budget Planning</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Ringkasan, Detail, Analisis, Tren, Comparison
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('cashflow-tracking')}
          disabled={!hasData || isExporting}
          className="flex items-center space-x-3 p-4 hover:bg-green-50 focus:bg-green-100"
        >
          {exportingType === 'cashflow-tracking' ? (
            <Loader2 className="h-4 w-4 animate-spin text-green-500" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Cashflow Tracking</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Ringkasan, Transaksi, Analisis, Proyeksi, Performa
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('analysis')}
          disabled={!hasData || isExporting}
          className="flex items-center space-x-3 p-4 hover:bg-purple-50 focus:bg-purple-100"
        >
          {exportingType === 'analysis' ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-purple-500" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Analysis Report</div>
            <div className="text-xs text-gray-600 mt-0.5">
              Dashboard, Performance, Comparison, Trends, Risk
            </div>
          </div>
        </DropdownMenuItem>
        
        {!hasData && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground text-center">
              Tidak ada data untuk di-export
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExcelExportButton;
