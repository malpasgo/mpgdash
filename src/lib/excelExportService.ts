import ExcelJS from 'exceljs';
import { KeuanganEkspor } from './supabase';

// Types untuk export
interface ExportOptions {
  filename: string;
  title: string;
  period?: string;
  data: KeuanganEkspor[];
  exportType: 'budget-planning' | 'cashflow-tracking' | 'analysis';
}

// Currency formatting utility
const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Date formatting utility
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Get current date in Indonesian format
const getCurrentDateString = (): string => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Get current time string
const getCurrentTimeString = (): string => {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Category configuration
const categoryConfig = {
  operasional: { label: 'Operasional', color: 'FFE3F2FD' },
  marketing: { label: 'Marketing', color: 'FFE8F5E8' },
  logistik: { label: 'Logistik', color: 'FFF3E0' },
  administrasi: { label: 'Administrasi', color: 'FFFCE4' },
  lainnya: { label: 'Lainnya', color: 'FFF5F5F5' }
};

// Status configuration
const statusConfig = {
  planned: { label: 'Direncanakan', color: 'FFE3F2FD' },
  'in-progress': { label: 'Dalam Proses', color: 'FFFFF3E0' },
  completed: { label: 'Selesai', color: 'FFE8F5E8' },
  cancelled: { label: 'Dibatalkan', color: 'FFFFEBEE' }
};

class ExcelExportService {
  // Create professional header for all sheets
  private createHeader(worksheet: ExcelJS.Worksheet, title: string, subtitle?: string) {
    // Main title
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF2E86C1' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    
    // Subtitle if provided
    if (subtitle) {
      worksheet.mergeCells('A2:L2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = subtitle;
      subtitleCell.font = { name: 'Calibri', size: 12, italic: true, color: { argb: 'FF5D6D7E' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Separator line
    worksheet.mergeCells('A3:L3');
    const separatorCell = worksheet.getCell('A3');
    separatorCell.value = '═══════════════════════════════════════════════════════════════';
    separatorCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF85929E' } };
    separatorCell.alignment = { horizontal: 'center' };
    
    return 4; // Return next available row
  }
  
  // Create report info section
  private createReportInfo(worksheet: ExcelJS.Worksheet, startRow: number, period?: string) {
    worksheet.mergeCells(`A${startRow}:L${startRow}`);
    const infoTitleCell = worksheet.getCell(`A${startRow}`);
    infoTitleCell.value = 'INFORMASI LAPORAN';
    infoTitleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1B4F72' } };
    infoTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    infoTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } };
    
    startRow++;
    worksheet.mergeCells(`A${startRow}:L${startRow}`);
    const separatorCell = worksheet.getCell(`A${startRow}`);
    separatorCell.value = '═══════════════════════════════════════════════════════════════';
    separatorCell.font = { name: 'Calibri', size: 8, color: { argb: 'FF85929E' } };
    separatorCell.alignment = { horizontal: 'center' };
    
    startRow++;
    const infoData = [
      ['Periode Laporan:', period || 'Semua Periode'],
      ['Tanggal Export:', getCurrentDateString()],
      ['Waktu Export:', getCurrentTimeString()],
      ['Sistem:', 'MPG Export Dashboard - Keuangan Ekspor']
    ];
    
    infoData.forEach(([label, value]) => {
      worksheet.getCell(`A${startRow}`).value = label;
      worksheet.getCell(`A${startRow}`).font = { name: 'Calibri', size: 10, bold: true };
      
      worksheet.getCell(`B${startRow}`).value = value;
      worksheet.getCell(`B${startRow}`).font = { name: 'Calibri', size: 10 };
      
      startRow++;
    });
    
    return startRow + 1; // Return next available row with spacing
  }
  
  // Apply professional styling to data table
  private styleDataTable(worksheet: ExcelJS.Worksheet, startRow: number, endRow: number, columnCount: number) {
    // Style header row
    for (let col = 1; col <= columnCount; col++) {
      const headerCell = worksheet.getCell(startRow, col);
      headerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4F72' } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Style data rows
    for (let row = startRow + 1; row <= endRow; row++) {
      for (let col = 1; col <= columnCount; col++) {
        const dataCell = worksheet.getCell(row, col);
        dataCell.font = { name: 'Calibri', size: 10 };
        dataCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        dataCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alternate row colors
        if (row % 2 === 0) {
          dataCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
      }
    }
    
    // Auto-size columns
    worksheet.columns.forEach((column, index) => {
      if (column && column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      }
    });
  }
  
  // Generate Budget Planning Export (5 sheets)
  async generateBudgetPlanningExport(options: ExportOptions): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const budgetItems = options.data.filter(item => item.type === 'BUDGET');
    const realisasiItems = options.data.filter(item => item.type === 'REALISASI');
    
    // Sheet 1: 01-Ringkasan
    const summarySheet = workbook.addWorksheet('01-Ringkasan');
    let currentRow = this.createHeader(summarySheet, 'LAPORAN BUDGET PLANNING EKSPOR', 'Ringkasan Perencanaan Budget');
    currentRow = this.createReportInfo(summarySheet, currentRow, options.period);
    
    // Summary metrics
    const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalItems = budgetItems.length;
    const completedItems = budgetItems.filter(item => item.status === 'completed').length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    const summaryData = [
      ['RINGKASAN EKSEKUTIF', ''],
      ['═══════════════════════════════════════════════════════════════', ''],
      ['Total Budget (IDR):', formatCurrency(totalBudget, 'IDR')],
      ['Jumlah Items Budget:', totalItems.toString()],
      ['Items Completed:', completedItems.toString()],
      ['Tingkat Penyelesaian:', `${completionRate.toFixed(1)}%`],
      ['Status Keseluruhan:', completionRate >= 80 ? 'BAIK' : completionRate >= 60 ? 'PERLU PERHATIAN' : 'KURANG']
    ];
    
    summaryData.forEach(([label, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = label;
      summarySheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: label.includes('═') ? false : true };
      
      summarySheet.getCell(`B${currentRow}`).value = value;
      summarySheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10, bold: false };
      
      if (label === 'Status Keseluruhan:') {
        const statusCell = summarySheet.getCell(`B${currentRow}`);
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: completionRate >= 80 ? 'FFE8F5E8' : completionRate >= 60 ? 'FFFFF3E0' : 'FFFFEBEE' }
        };
      }
      
      currentRow++;
    });
    
    // Category breakdown
    currentRow += 2;
    summarySheet.getCell(`A${currentRow}`).value = 'BREAKDOWN PER KATEGORI';
    summarySheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 12, bold: true };
    currentRow++;
    
    const categoryBreakdown = Object.keys(categoryConfig).map(categoryKey => {
      const categoryItems = budgetItems.filter(item => item.category === categoryKey);
      const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryCompleted = categoryItems.filter(item => item.status === 'completed').length;
      
      return {
        kategori: categoryConfig[categoryKey as keyof typeof categoryConfig].label,
        total: formatCurrency(categoryTotal, 'IDR'),
        items: categoryItems.length.toString(),
        completed: categoryCompleted.toString(),
        percentage: totalBudget > 0 ? ((categoryTotal / totalBudget) * 100).toFixed(1) + '%' : '0.0%'
      };
    }).filter(cat => cat.items !== '0');
    
    // Category breakdown headers
    const categoryHeaders = ['Kategori', 'Total Budget (IDR)', 'Jumlah Items', 'Completed', 'Persentase'];
    categoryHeaders.forEach((header, index) => {
      summarySheet.getCell(currentRow, index + 1).value = header;
    });
    
    const categoryStartRow = currentRow;
    currentRow++;
    
    // Category breakdown data
    categoryBreakdown.forEach((cat) => {
      summarySheet.getCell(currentRow, 1).value = cat.kategori;
      summarySheet.getCell(currentRow, 2).value = cat.total;
      summarySheet.getCell(currentRow, 3).value = cat.items;
      summarySheet.getCell(currentRow, 4).value = cat.completed;
      summarySheet.getCell(currentRow, 5).value = cat.percentage;
      currentRow++;
    });
    
    this.styleDataTable(summarySheet, categoryStartRow, currentRow - 1, 5);
    
    // Sheet 2: 02-Detail Transaksi
    const detailSheet = workbook.addWorksheet('02-Detail Transaksi');
    currentRow = this.createHeader(detailSheet, 'DETAIL TRANSAKSI BUDGET PLANNING', 'Data Lengkap Perencanaan Budget');
    currentRow = this.createReportInfo(detailSheet, currentRow, options.period);
    
    // Detail headers
    const detailHeaders = [
      'No', 'ID Transaksi', 'Tanggal Budget', 'Nama Item', 'Kategori', 
      'Jumlah Budget (IDR)', 'Status', 'Deskripsi', 'Realisasi Terkait',
      'Variance dari Realisasi', 'Bulan', 'Tahun', 'Dibuat', 'Terakhir Update'
    ];
    
    detailHeaders.forEach((header, index) => {
      detailSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const detailStartRow = currentRow;
    currentRow++;
    
    // Detail data
    budgetItems.forEach((item, index) => {
      const relatedRealisasi = realisasiItems.find(r => 
        r.name === item.name && r.category === item.category
      );
      const variance = relatedRealisasi ? 
        (relatedRealisasi.amount_idr || relatedRealisasi.amount) - (item.amount_idr || item.amount) : 0;
      
      detailSheet.getCell(currentRow, 1).value = index + 1;
      detailSheet.getCell(currentRow, 2).value = item.id;
      detailSheet.getCell(currentRow, 3).value = formatDate(item.date);
      detailSheet.getCell(currentRow, 4).value = item.name;
      detailSheet.getCell(currentRow, 5).value = categoryConfig[item.category as keyof typeof categoryConfig].label;
      detailSheet.getCell(currentRow, 6).value = formatCurrency(item.amount_idr || item.amount, 'IDR');
      detailSheet.getCell(currentRow, 7).value = statusConfig[item.status as keyof typeof statusConfig].label;
      detailSheet.getCell(currentRow, 8).value = item.description || '-';
      detailSheet.getCell(currentRow, 9).value = relatedRealisasi ? 
        formatCurrency(relatedRealisasi.amount_idr || relatedRealisasi.amount, 'IDR') : '-';
      detailSheet.getCell(currentRow, 10).value = variance !== 0 ? formatCurrency(variance, 'IDR') : '-';
      detailSheet.getCell(currentRow, 11).value = item.month;
      detailSheet.getCell(currentRow, 12).value = item.year;
      detailSheet.getCell(currentRow, 13).value = formatDate(item.created_at);
      detailSheet.getCell(currentRow, 14).value = formatDate(item.updated_at);
      
      currentRow++;
    });
    
    this.styleDataTable(detailSheet, detailStartRow, currentRow - 1, 14);
    
    // Sheet 3: 03-Analisis Kategori
    const categoryAnalysisSheet = workbook.addWorksheet('03-Analisis Kategori');
    currentRow = this.createHeader(categoryAnalysisSheet, 'ANALISIS PER KATEGORI BUDGET', 'Performa dan Insights Kategori');
    currentRow = this.createReportInfo(categoryAnalysisSheet, currentRow, options.period);
    
    const analysisHeaders = [
      'Kategori', 'Total Budget (IDR)', 'Jumlah Items', 'Persentase dari Total',
      'Rata-rata per Item', 'Items Selesai', 'Budget Selesai (IDR)', 'Tingkat Penyelesaian',
      'Realisasi Terkait (IDR)', 'Variance vs Realisasi', 'Status Kategori'
    ];
    
    analysisHeaders.forEach((header, index) => {
      categoryAnalysisSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const analysisStartRow = currentRow;
    currentRow++;
    
    Object.keys(categoryConfig).forEach(categoryKey => {
      const categoryItems = budgetItems.filter(item => item.category === categoryKey);
      if (categoryItems.length === 0) return;
      
      const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryCompleted = categoryItems.filter(item => item.status === 'completed');
      const completedTotal = categoryCompleted.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const completionRate = categoryItems.length > 0 ? (categoryCompleted.length / categoryItems.length) * 100 : 0;
      
      const categoryRealisasi = realisasiItems.filter(item => item.category === categoryKey);
      const realisasiTotal = categoryRealisasi.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const variance = realisasiTotal - categoryTotal;
      
      categoryAnalysisSheet.getCell(currentRow, 1).value = categoryConfig[categoryKey as keyof typeof categoryConfig].label;
      categoryAnalysisSheet.getCell(currentRow, 2).value = formatCurrency(categoryTotal, 'IDR');
      categoryAnalysisSheet.getCell(currentRow, 3).value = categoryItems.length;
      categoryAnalysisSheet.getCell(currentRow, 4).value = totalBudget > 0 ? ((categoryTotal / totalBudget) * 100).toFixed(1) + '%' : '0.0%';
      categoryAnalysisSheet.getCell(currentRow, 5).value = formatCurrency(categoryTotal / categoryItems.length, 'IDR');
      categoryAnalysisSheet.getCell(currentRow, 6).value = categoryCompleted.length;
      categoryAnalysisSheet.getCell(currentRow, 7).value = formatCurrency(completedTotal, 'IDR');
      categoryAnalysisSheet.getCell(currentRow, 8).value = completionRate.toFixed(1) + '%';
      categoryAnalysisSheet.getCell(currentRow, 9).value = formatCurrency(realisasiTotal, 'IDR');
      categoryAnalysisSheet.getCell(currentRow, 10).value = variance !== 0 ? formatCurrency(variance, 'IDR') : '-';
      categoryAnalysisSheet.getCell(currentRow, 11).value = completionRate >= 80 ? 'BAIK' : completionRate >= 60 ? 'PERLU PERHATIAN' : 'KURANG';
      
      currentRow++;
    });
    
    this.styleDataTable(categoryAnalysisSheet, analysisStartRow, currentRow - 1, 11);
    
    // Sheet 4: 04-Tren Bulanan
    const trendSheet = workbook.addWorksheet('04-Tren Bulanan');
    currentRow = this.createHeader(trendSheet, 'TREN BULANAN BUDGET PLANNING', 'Analisis Trend dan Growth');
    currentRow = this.createReportInfo(trendSheet, currentRow, options.period);
    
    // Monthly analysis logic
    const monthlyData = new Map<string, {
      budget: number;
      realisasi: number;
      budgetItems: number;
      realisasiItems: number;
    }>();
    
    // Group by month-year
    [...budgetItems, ...realisasiItems].forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { budget: 0, realisasi: 0, budgetItems: 0, realisasiItems: 0 });
      }
      
      const monthData = monthlyData.get(key)!;
      if (item.type === 'BUDGET') {
        monthData.budget += (item.amount_idr || item.amount);
        monthData.budgetItems++;
      } else {
        monthData.realisasi += (item.amount_idr || item.amount);
        monthData.realisasiItems++;
      }
    });
    
    const trendHeaders = [
      'Periode', 'Budget (IDR)', 'Realisasi (IDR)', 'Variance (IDR)', 'Variance (%)',
      'Jumlah Budget Items', 'Jumlah Realisasi Items', 'Rata-rata Budget per Item',
      'Rata-rata Realisasi per Item', 'Growth Rate Budget', 'Growth Rate Realisasi', 'Status Bulan'
    ];
    
    trendHeaders.forEach((header, index) => {
      trendSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const trendStartRow = currentRow;
    currentRow++;
    
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    let prevBudget = 0;
    let prevRealisasi = 0;
    
    sortedMonths.forEach((period, index) => {
      const data = monthlyData.get(period)!;
      const variance = data.realisasi - data.budget;
      const variancePercentage = data.budget > 0 ? (variance / data.budget) * 100 : 0;
      const budgetGrowth = prevBudget > 0 ? ((data.budget - prevBudget) / prevBudget) * 100 : 0;
      const realisasiGrowth = prevRealisasi > 0 ? ((data.realisasi - prevRealisasi) / prevRealisasi) * 100 : 0;
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const [year, month] = period.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      
      trendSheet.getCell(currentRow, 1).value = `${monthName} ${year}`;
      trendSheet.getCell(currentRow, 2).value = formatCurrency(data.budget, 'IDR');
      trendSheet.getCell(currentRow, 3).value = formatCurrency(data.realisasi, 'IDR');
      trendSheet.getCell(currentRow, 4).value = formatCurrency(variance, 'IDR');
      trendSheet.getCell(currentRow, 5).value = variancePercentage.toFixed(1) + '%';
      trendSheet.getCell(currentRow, 6).value = data.budgetItems;
      trendSheet.getCell(currentRow, 7).value = data.realisasiItems;
      trendSheet.getCell(currentRow, 8).value = data.budgetItems > 0 ? formatCurrency(data.budget / data.budgetItems, 'IDR') : '-';
      trendSheet.getCell(currentRow, 9).value = data.realisasiItems > 0 ? formatCurrency(data.realisasi / data.realisasiItems, 'IDR') : '-';
      trendSheet.getCell(currentRow, 10).value = index === 0 ? 'Base' : budgetGrowth.toFixed(1) + '%';
      trendSheet.getCell(currentRow, 11).value = index === 0 ? 'Base' : realisasiGrowth.toFixed(1) + '%';
      trendSheet.getCell(currentRow, 12).value = Math.abs(variancePercentage) <= 10 ? 'BAIK' : Math.abs(variancePercentage) <= 25 ? 'PERLU PERHATIAN' : 'KURANG';
      
      prevBudget = data.budget;
      prevRealisasi = data.realisasi;
      currentRow++;
    });
    
    this.styleDataTable(trendSheet, trendStartRow, currentRow - 1, 12);
    
    // Sheet 5: 05-Budget vs Realisasi
    const comparisonSheet = workbook.addWorksheet('05-Budget vs Realisasi');
    currentRow = this.createHeader(comparisonSheet, 'BUDGET vs REALISASI COMPARISON', 'Analisis Perbandingan dan Efisiensi');
    currentRow = this.createReportInfo(comparisonSheet, currentRow, options.period);
    
    const comparisonHeaders = [
      'Nama Item Budget', 'Kategori', 'Budget Amount (IDR)', 'Tanggal Budget', 'Status Budget',
      'Jumlah Realisasi Matching', 'Total Realisasi (IDR)', 'Variance (IDR)', 'Variance (%)',
      'Budget Utilization', 'Efficiency Score', 'Rekomendasi', 'Risk Level'
    ];
    
    comparisonHeaders.forEach((header, index) => {
      comparisonSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const comparisonStartRow = currentRow;
    currentRow++;
    
    budgetItems.forEach(budgetItem => {
      const matchingRealisasi = realisasiItems.filter(r => 
        r.category === budgetItem.category && 
        r.name.toLowerCase().includes(budgetItem.name.toLowerCase().split(' ')[0])
      );
      
      const totalRealisasi = matchingRealisasi.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const budgetAmount = budgetItem.amount_idr || budgetItem.amount;
      const variance = totalRealisasi - budgetAmount;
      const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
      const utilization = budgetAmount > 0 ? Math.min((totalRealisasi / budgetAmount) * 100, 100) : 0;
      const efficiency = Math.max(0, 100 - Math.abs(variancePercentage));
      
      let recommendation = 'Pantau terus';
      let riskLevel = 'LOW';
      
      if (Math.abs(variancePercentage) > 50) {
        recommendation = 'Review budget - variance tinggi';
        riskLevel = 'HIGH';
      } else if (Math.abs(variancePercentage) > 25) {
        recommendation = 'Perlu adjustment budget';
        riskLevel = 'MEDIUM';
      } else if (variancePercentage > 10) {
        recommendation = 'Efisiensi bisa ditingkatkan';
        riskLevel = 'MEDIUM';
      }
      
      comparisonSheet.getCell(currentRow, 1).value = budgetItem.name;
      comparisonSheet.getCell(currentRow, 2).value = categoryConfig[budgetItem.category as keyof typeof categoryConfig].label;
      comparisonSheet.getCell(currentRow, 3).value = formatCurrency(budgetAmount, 'IDR');
      comparisonSheet.getCell(currentRow, 4).value = formatDate(budgetItem.date);
      comparisonSheet.getCell(currentRow, 5).value = statusConfig[budgetItem.status as keyof typeof statusConfig].label;
      comparisonSheet.getCell(currentRow, 6).value = matchingRealisasi.length;
      comparisonSheet.getCell(currentRow, 7).value = formatCurrency(totalRealisasi, 'IDR');
      comparisonSheet.getCell(currentRow, 8).value = formatCurrency(variance, 'IDR');
      comparisonSheet.getCell(currentRow, 9).value = variancePercentage.toFixed(1) + '%';
      comparisonSheet.getCell(currentRow, 10).value = utilization.toFixed(1) + '%';
      comparisonSheet.getCell(currentRow, 11).value = efficiency.toFixed(1) + '%';
      comparisonSheet.getCell(currentRow, 12).value = recommendation;
      comparisonSheet.getCell(currentRow, 13).value = riskLevel;
      
      // Color-code risk levels
      const riskCell = comparisonSheet.getCell(currentRow, 13);
      if (riskLevel === 'HIGH') {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      } else if (riskLevel === 'MEDIUM') {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
      } else {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
      }
      
      currentRow++;
    });
    
    this.styleDataTable(comparisonSheet, comparisonStartRow, currentRow - 1, 13);
    
    return workbook;
  }
  
  // Generate Cashflow Tracking Export (5 sheets)
  async generateCashflowTrackingExport(options: ExportOptions): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const realisasiItems = options.data.filter(item => item.type === 'REALISASI');
    const budgetItems = options.data.filter(item => item.type === 'BUDGET');
    
    // Calculate totals needed for analysis
    const totalRealisasiAmount = realisasiItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    
    // Sheet 1: 01-Ringkasan Cashflow
    const summarySheet = workbook.addWorksheet('01-Ringkasan Cashflow');
    let currentRow = this.createHeader(summarySheet, 'LAPORAN CASHFLOW TRACKING', 'Pelacakan Arus Kas Aktual');
    currentRow = this.createReportInfo(summarySheet, currentRow, options.period);
    
    const cashInItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-in');
    const cashOutItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-out');
    
    const totalCashIn = cashInItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalCashOut = cashOutItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const netCashFlow = totalCashIn - totalCashOut;
    const cashFlowRatio = totalCashOut > 0 ? totalCashIn / totalCashOut : 0;
    
    const cashflowSummaryData = [
      ['RINGKASAN CASHFLOW', ''],
      ['═══════════════════════════════════════════════════════════════', ''],
      ['Total Cash In (IDR):', formatCurrency(totalCashIn, 'IDR')],
      ['Total Cash Out (IDR):', formatCurrency(totalCashOut, 'IDR')],
      ['Net Cashflow (IDR):', formatCurrency(netCashFlow, 'IDR')],
      ['Cashflow Ratio:', cashFlowRatio.toFixed(2)],
      ['Total Transaksi:', realisasiItems.length.toString()],
      ['Status Cashflow:', netCashFlow >= 0 ? 'POSITIF' : 'NEGATIF']
    ];
    
    cashflowSummaryData.forEach(([label, value]) => {
      summarySheet.getCell(`A${currentRow}`).value = label;
      summarySheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: label.includes('═') ? false : true };
      
      summarySheet.getCell(`B${currentRow}`).value = value;
      summarySheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10, bold: false };
      
      if (label === 'Status Cashflow:') {
        const statusCell = summarySheet.getCell(`B${currentRow}`);
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: netCashFlow >= 0 ? 'FFE8F5E8' : 'FFFFEBEE' }
        };
      }
      
      currentRow++;
    });
    
    // Sheet 2: 02-Detail Transaksi  
    const cashflowDetailSheet = workbook.addWorksheet('02-Detail Transaksi');
    currentRow = this.createHeader(cashflowDetailSheet, 'DETAIL TRANSAKSI CASHFLOW', 'Data Lengkap Realisasi Arus Kas');
    currentRow = this.createReportInfo(cashflowDetailSheet, currentRow, options.period);
    
    const cashflowDetailHeaders = [
      'No', 'ID Transaksi', 'Tanggal Realisasi', 'Nama Item', 'Kategori', 
      'Jumlah Realisasi (IDR)', 'Tipe Cashflow', 'Status', 'Deskripsi',
      'Budget Terkait', 'Impact vs Budget', 'Cashflow Impact', 'Bulan', 
      'Tahun', 'Dibuat', 'Terakhir Update'
    ];
    
    cashflowDetailHeaders.forEach((header, index) => {
      cashflowDetailSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const cashflowDetailStartRow = currentRow;
    currentRow++;
    
    realisasiItems.forEach((item, index) => {
      const relatedBudget = budgetItems.find(b => 
        b.name === item.name && b.category === item.category
      );
      const budgetImpact = relatedBudget ? 
        (item.amount_idr || item.amount) - (relatedBudget.amount_idr || relatedBudget.amount) : 0;
      
      cashflowDetailSheet.getCell(currentRow, 1).value = index + 1;
      cashflowDetailSheet.getCell(currentRow, 2).value = item.id;
      cashflowDetailSheet.getCell(currentRow, 3).value = formatDate(item.date);
      cashflowDetailSheet.getCell(currentRow, 4).value = item.name;
      cashflowDetailSheet.getCell(currentRow, 5).value = categoryConfig[item.category as keyof typeof categoryConfig].label;
      cashflowDetailSheet.getCell(currentRow, 6).value = formatCurrency(item.amount_idr || item.amount, 'IDR');
      cashflowDetailSheet.getCell(currentRow, 7).value = item.cash_flow_type === 'cash-in' ? 'Cash In (Masuk)' : 'Cash Out (Keluar)';
      cashflowDetailSheet.getCell(currentRow, 8).value = statusConfig[item.status as keyof typeof statusConfig].label;
      cashflowDetailSheet.getCell(currentRow, 9).value = item.description || '-';
      cashflowDetailSheet.getCell(currentRow, 10).value = relatedBudget ? 
        formatCurrency(relatedBudget.amount_idr || relatedBudget.amount, 'IDR') : '-';
      cashflowDetailSheet.getCell(currentRow, 11).value = budgetImpact !== 0 ? formatCurrency(budgetImpact, 'IDR') : '-';
      cashflowDetailSheet.getCell(currentRow, 12).value = item.cash_flow_type === 'cash-in' ? 'Positif' : 'Negatif';
      cashflowDetailSheet.getCell(currentRow, 13).value = item.month;
      cashflowDetailSheet.getCell(currentRow, 14).value = item.year;
      cashflowDetailSheet.getCell(currentRow, 15).value = formatDate(item.created_at);
      cashflowDetailSheet.getCell(currentRow, 16).value = formatDate(item.updated_at);
      
      currentRow++;
    });
    
    this.styleDataTable(cashflowDetailSheet, cashflowDetailStartRow, currentRow - 1, 16);
    
    // Sheet 3: 03-Analisis Arus Kas
    const cashflowAnalysisSheet = workbook.addWorksheet('03-Analisis Arus Kas');
    currentRow = this.createHeader(cashflowAnalysisSheet, 'ANALISIS ARUS KAS PER KATEGORI', 'Performance dan Cash Management');
    currentRow = this.createReportInfo(cashflowAnalysisSheet, currentRow, options.period);
    
    const cashflowAnalysisHeaders = [
      'Kategori', 'Cash In (IDR)', 'Cash Out (IDR)', 'Net Cashflow (IDR)', 
      'Cashflow Ratio', 'Jumlah Transaksi', 'Persentase dari Total',
      'Budget Terkait (IDR)', 'Realisasi vs Budget', 'Efisiensi', 'Status Kategori'
    ];
    
    cashflowAnalysisHeaders.forEach((header, index) => {
      cashflowAnalysisSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const cashflowAnalysisStartRow = currentRow;
    currentRow++;
    
    Object.keys(categoryConfig).forEach(categoryKey => {
      const categoryCashIn = cashInItems.filter(item => item.category === categoryKey);
      const categoryCashOut = cashOutItems.filter(item => item.category === categoryKey);
      const categoryRealisasi = realisasiItems.filter(item => item.category === categoryKey);
      
      if (categoryRealisasi.length === 0) return;
      
      const cashInTotal = categoryCashIn.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const cashOutTotal = categoryCashOut.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const netCashflow = cashInTotal - cashOutTotal;
      const cashflowRatio = cashOutTotal > 0 ? cashInTotal / cashOutTotal : 0;
      
      const categoryBudget = budgetItems.filter(item => item.category === categoryKey)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const realisasiTotal = categoryRealisasi.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const efficiency = categoryBudget > 0 ? (realisasiTotal / categoryBudget) * 100 : 0;
      
      cashflowAnalysisSheet.getCell(currentRow, 1).value = categoryConfig[categoryKey as keyof typeof categoryConfig].label;
      cashflowAnalysisSheet.getCell(currentRow, 2).value = formatCurrency(cashInTotal, 'IDR');
      cashflowAnalysisSheet.getCell(currentRow, 3).value = formatCurrency(cashOutTotal, 'IDR');
      cashflowAnalysisSheet.getCell(currentRow, 4).value = formatCurrency(netCashflow, 'IDR');
      cashflowAnalysisSheet.getCell(currentRow, 5).value = cashflowRatio.toFixed(2);
      cashflowAnalysisSheet.getCell(currentRow, 6).value = categoryRealisasi.length;
      cashflowAnalysisSheet.getCell(currentRow, 7).value = totalRealisasiAmount > 0 ? ((realisasiTotal / totalRealisasiAmount) * 100).toFixed(1) + '%' : '0.0%';
      cashflowAnalysisSheet.getCell(currentRow, 8).value = formatCurrency(categoryBudget, 'IDR');
      cashflowAnalysisSheet.getCell(currentRow, 9).value = categoryBudget > 0 ? ((realisasiTotal / categoryBudget) * 100).toFixed(1) + '%' : '-';
      cashflowAnalysisSheet.getCell(currentRow, 10).value = efficiency.toFixed(1) + '%';
      cashflowAnalysisSheet.getCell(currentRow, 11).value = netCashflow >= 0 ? 'POSITIF' : 'NEGATIF';
      
      currentRow++;
    });
    
    this.styleDataTable(cashflowAnalysisSheet, cashflowAnalysisStartRow, currentRow - 1, 11);
    
    // Sheet 4: 04-Proyeksi Cashflow
    const projectionSheet = workbook.addWorksheet('04-Proyeksi Cashflow');
    currentRow = this.createHeader(projectionSheet, 'PROYEKSI DAN FORECASTING CASHFLOW', 'Prediksi Arus Kas Mendatang');
    currentRow = this.createReportInfo(projectionSheet, currentRow, options.period);
    
    const projectionHeaders = [
      'Periode', 'Actual Cashflow (IDR)', 'Budget Period (IDR)', 'Variance (IDR)',
      'Growth Rate', 'Cashflow Velocity', 'Proyeksi Konservatif', 'Proyeksi Optimis',
      'Rekomendasi', 'Risk Level'
    ];
    
    projectionHeaders.forEach((header, index) => {
      projectionSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const projectionStartRow = currentRow;
    currentRow++;
    
    // Monthly cashflow data for projection
    const monthlyRealisasi = new Map<string, number>();
    const monthlyBudget = new Map<string, number>();
    
    realisasiItems.forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      monthlyRealisasi.set(key, (monthlyRealisasi.get(key) || 0) + (item.amount_idr || item.amount));
    });
    
    budgetItems.forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      monthlyBudget.set(key, (monthlyBudget.get(key) || 0) + (item.amount_idr || item.amount));
    });
    
    const sortedPeriods = Array.from(monthlyRealisasi.keys()).sort();
    let prevCashflow = 0;
    
    sortedPeriods.forEach((period, index) => {
      const actualCashflow = monthlyRealisasi.get(period) || 0;
      const budgetPeriod = monthlyBudget.get(period) || 0;
      const variance = actualCashflow - budgetPeriod;
      const growthRate = prevCashflow > 0 ? ((actualCashflow - prevCashflow) / prevCashflow) * 100 : 0;
      const velocity = budgetPeriod > 0 ? actualCashflow / budgetPeriod : 0;
      
      const conservativeProjection = actualCashflow * 0.9;
      const optimisticProjection = actualCashflow * 1.2;
      
      let recommendation = 'Pantau terus';
      let riskLevel = 'LOW';
      
      if (variance < -budgetPeriod * 0.2) {
        recommendation = 'Perbaiki cashflow management';
        riskLevel = 'HIGH';
      } else if (variance < 0) {
        recommendation = 'Tingkatkan efisiensi';
        riskLevel = 'MEDIUM';
      } else if (growthRate > 20) {
        recommendation = 'Pertahankan momentum';
        riskLevel = 'LOW';
      }
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const [year, month] = period.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      
      projectionSheet.getCell(currentRow, 1).value = `${monthName} ${year}`;
      projectionSheet.getCell(currentRow, 2).value = formatCurrency(actualCashflow, 'IDR');
      projectionSheet.getCell(currentRow, 3).value = formatCurrency(budgetPeriod, 'IDR');
      projectionSheet.getCell(currentRow, 4).value = formatCurrency(variance, 'IDR');
      projectionSheet.getCell(currentRow, 5).value = index === 0 ? 'Base' : growthRate.toFixed(1) + '%';
      projectionSheet.getCell(currentRow, 6).value = velocity.toFixed(2);
      projectionSheet.getCell(currentRow, 7).value = formatCurrency(conservativeProjection, 'IDR');
      projectionSheet.getCell(currentRow, 8).value = formatCurrency(optimisticProjection, 'IDR');
      projectionSheet.getCell(currentRow, 9).value = recommendation;
      projectionSheet.getCell(currentRow, 10).value = riskLevel;
      
      prevCashflow = actualCashflow;
      currentRow++;
    });
    
    this.styleDataTable(projectionSheet, projectionStartRow, currentRow - 1, 10);
    
    // Sheet 5: 05-Performa Bulanan
    const performanceSheet = workbook.addWorksheet('05-Performa Bulanan');
    currentRow = this.createHeader(performanceSheet, 'PERFORMA BULANAN CASHFLOW', 'Evaluasi Achievement dan KPI');
    currentRow = this.createReportInfo(performanceSheet, currentRow, options.period);
    
    const performanceHeaders = [
      'Periode', 'Total Cashflow (IDR)', 'Target Budget (IDR)', 'Achievement Rate',
      'Variance (IDR)', 'Variance (%)', 'Month-on-Month Growth', 'Transaksi Count',
      'Avg per Transaksi', 'Performance Score', 'Trend Direction', 'Action Required'
    ];
    
    performanceHeaders.forEach((header, index) => {
      performanceSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const performanceStartRow = currentRow;
    currentRow++;
    
    const monthlyTransactionCount = new Map<string, number>();
    realisasiItems.forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      monthlyTransactionCount.set(key, (monthlyTransactionCount.get(key) || 0) + 1);
    });
    
    let prevMonthCashflow = 0;
    sortedPeriods.forEach((period, index) => {
      const totalCashflow = monthlyRealisasi.get(period) || 0;
      const targetBudget = monthlyBudget.get(period) || 0;
      const achievementRate = targetBudget > 0 ? (totalCashflow / targetBudget) * 100 : 0;
      const variance = totalCashflow - targetBudget;
      const variancePercentage = targetBudget > 0 ? (variance / targetBudget) * 100 : 0;
      const monthGrowth = prevMonthCashflow > 0 ? ((totalCashflow - prevMonthCashflow) / prevMonthCashflow) * 100 : 0;
      const transactionCount = monthlyTransactionCount.get(period) || 0;
      const avgPerTransaction = transactionCount > 0 ? totalCashflow / transactionCount : 0;
      
      let performanceScore = 0;
      if (achievementRate >= 100) performanceScore = 100;
      else if (achievementRate >= 80) performanceScore = 80;
      else if (achievementRate >= 60) performanceScore = 60;
      else performanceScore = Math.max(0, achievementRate);
      
      const trendDirection = index === 0 ? 'Base' : 
        monthGrowth > 5 ? 'Upward' : monthGrowth < -5 ? 'Downward' : 'Stable';
      
      const actionRequired = achievementRate < 70 ? 'Ya - Review Required' :
        achievementRate < 90 ? 'Monitor Closely' : 'Continue Current Strategy';
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const [year, month] = period.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      
      performanceSheet.getCell(currentRow, 1).value = `${monthName} ${year}`;
      performanceSheet.getCell(currentRow, 2).value = formatCurrency(totalCashflow, 'IDR');
      performanceSheet.getCell(currentRow, 3).value = formatCurrency(targetBudget, 'IDR');
      performanceSheet.getCell(currentRow, 4).value = achievementRate.toFixed(1) + '%';
      performanceSheet.getCell(currentRow, 5).value = formatCurrency(variance, 'IDR');
      performanceSheet.getCell(currentRow, 6).value = variancePercentage.toFixed(1) + '%';
      performanceSheet.getCell(currentRow, 7).value = index === 0 ? 'Base' : monthGrowth.toFixed(1) + '%';
      performanceSheet.getCell(currentRow, 8).value = transactionCount;
      performanceSheet.getCell(currentRow, 9).value = formatCurrency(avgPerTransaction, 'IDR');
      performanceSheet.getCell(currentRow, 10).value = performanceScore.toFixed(0);
      performanceSheet.getCell(currentRow, 11).value = trendDirection;
      performanceSheet.getCell(currentRow, 12).value = actionRequired;
      
      prevMonthCashflow = totalCashflow;
      currentRow++;
    });
    
    this.styleDataTable(performanceSheet, performanceStartRow, currentRow - 1, 12);
    
    return workbook;
  }
  
  // Generate Analysis Export (5 sheets)
  async generateAnalysisExport(options: ExportOptions): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const budgetItems = options.data.filter(item => item.type === 'BUDGET');
    const realisasiItems = options.data.filter(item => item.type === 'REALISASI');
    
    // Sheet 1: 01-Executive Dashboard
    const dashboardSheet = workbook.addWorksheet('01-Executive Dashboard');
    let currentRow = this.createHeader(dashboardSheet, 'EXECUTIVE DASHBOARD ANALYSIS', 'KPI dan Metrics Utama');
    currentRow = this.createReportInfo(dashboardSheet, currentRow, options.period);
    
    // Calculate key metrics
    const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalRealisasiAmount = realisasiItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalCashIn = realisasiItems.filter(item => item.cash_flow_type === 'cash-in')
      .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalCashOut = realisasiItems.filter(item => item.cash_flow_type === 'cash-out')
      .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const netCashFlow = totalCashIn - totalCashOut;
    
    const roi = totalBudget > 0 ? ((totalCashIn - totalBudget) / totalBudget) * 100 : 0;
    const profitMargin = totalCashIn > 0 ? ((totalCashIn - totalCashOut) / totalCashIn) * 100 : 0;
    const cashflowRatio = totalCashOut > 0 ? totalCashIn / totalCashOut : 0;
    const budgetVariance = totalBudget > 0 ? ((totalRealisasiAmount - totalBudget) / totalBudget) * 100 : 0;
    
    const kpiData = [
      ['KEY PERFORMANCE INDICATORS', ''],
      ['═══════════════════════════════════════════════════════════════', ''],
      ['ROI (Return on Investment):', `${roi.toFixed(2)}%`],
      ['Profit Margin:', `${profitMargin.toFixed(2)}%`],
      ['Cashflow Ratio:', cashflowRatio.toFixed(2)],
      ['Budget Variance:', `${budgetVariance.toFixed(2)}%`],
      ['Budget Achievement Rate:', totalBudget > 0 ? `${((totalRealisasiAmount / totalBudget) * 100).toFixed(1)}%` : '0%'],
      ['Net Profit (IDR):', formatCurrency(totalCashIn - totalCashOut, 'IDR')]
    ];
    
    kpiData.forEach(([label, value]) => {
      dashboardSheet.getCell(`A${currentRow}`).value = label;
      dashboardSheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: label.includes('═') ? false : true };
      
      dashboardSheet.getCell(`B${currentRow}`).value = value;
      dashboardSheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10, bold: false };
      
      currentRow++;
    });
    
    // Sheet 2: 02-Financial Performance
    const financialPerformanceSheet = workbook.addWorksheet('02-Financial Performance');
    currentRow = this.createHeader(financialPerformanceSheet, 'FINANCIAL PERFORMANCE ANALYSIS', 'Revenue, Cost, dan Profitability Metrics');
    currentRow = this.createReportInfo(financialPerformanceSheet, currentRow, options.period);
    
    const revenueItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-in');
    const expenseItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-out');
    
    const totalRevenue = revenueItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalExpense = expenseItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const grossProfit = totalRevenue - totalExpense;
    const profitMarginReal = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const financialMetrics = [
      ['REVENUE ANALYSIS', ''],
      ['═══════════════════════════════════════════════════════════════', ''],
      ['Total Revenue (IDR):', formatCurrency(totalRevenue, 'IDR')],
      ['Total Operating Expenses (IDR):', formatCurrency(totalExpense, 'IDR')],
      ['Gross Profit (IDR):', formatCurrency(grossProfit, 'IDR')],
      ['Profit Margin (%):', `${profitMarginReal.toFixed(2)}%`],
      ['Revenue per Transaction:', totalRevenue > 0 ? formatCurrency(totalRevenue / revenueItems.length, 'IDR') : '-'],
      ['Cost per Transaction:', totalExpense > 0 ? formatCurrency(totalExpense / expenseItems.length, 'IDR') : '-']
    ];
    
    financialMetrics.forEach(([label, value]) => {
      financialPerformanceSheet.getCell(`A${currentRow}`).value = label;
      financialPerformanceSheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, bold: label.includes('═') ? false : true };
      financialPerformanceSheet.getCell(`B${currentRow}`).value = value;
      financialPerformanceSheet.getCell(`B${currentRow}`).font = { name: 'Calibri', size: 10, bold: false };
      currentRow++;
    });
    
    // Category performance breakdown
    currentRow += 2;
    const categoryPerformanceHeaders = [
      'Kategori', 'Revenue (IDR)', 'Expenses (IDR)', 'Net Profit (IDR)', 
      'Profit Margin (%)', 'ROI (%)', 'Budget vs Actual (%)', 'Performance Rating'
    ];
    
    categoryPerformanceHeaders.forEach((header, index) => {
      financialPerformanceSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const categoryPerformanceStartRow = currentRow;
    currentRow++;
    
    Object.keys(categoryConfig).forEach(categoryKey => {
      const categoryRevenue = revenueItems.filter(item => item.category === categoryKey)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryExpense = expenseItems.filter(item => item.category === categoryKey)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryBudgetTotal = budgetItems.filter(item => item.category === categoryKey)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryRealisasiTotal = realisasiItems.filter(item => item.category === categoryKey)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      
      if (categoryRevenue === 0 && categoryExpense === 0) return;
      
      const netProfit = categoryRevenue - categoryExpense;
      const profitMarginCat = categoryRevenue > 0 ? (netProfit / categoryRevenue) * 100 : 0;
      const roiCat = categoryExpense > 0 ? ((categoryRevenue - categoryExpense) / categoryExpense) * 100 : 0;
      const budgetActual = categoryBudgetTotal > 0 ? (categoryRealisasiTotal / categoryBudgetTotal) * 100 : 0;
      
      let performanceRating = 'Poor';
      if (profitMarginCat >= 20) performanceRating = 'Excellent';
      else if (profitMarginCat >= 10) performanceRating = 'Good';
      else if (profitMarginCat >= 0) performanceRating = 'Fair';
      
      financialPerformanceSheet.getCell(currentRow, 1).value = categoryConfig[categoryKey as keyof typeof categoryConfig].label;
      financialPerformanceSheet.getCell(currentRow, 2).value = formatCurrency(categoryRevenue, 'IDR');
      financialPerformanceSheet.getCell(currentRow, 3).value = formatCurrency(categoryExpense, 'IDR');
      financialPerformanceSheet.getCell(currentRow, 4).value = formatCurrency(netProfit, 'IDR');
      financialPerformanceSheet.getCell(currentRow, 5).value = profitMarginCat.toFixed(1) + '%';
      financialPerformanceSheet.getCell(currentRow, 6).value = roiCat.toFixed(1) + '%';
      financialPerformanceSheet.getCell(currentRow, 7).value = budgetActual.toFixed(1) + '%';
      financialPerformanceSheet.getCell(currentRow, 8).value = performanceRating;
      
      currentRow++;
    });
    
    this.styleDataTable(financialPerformanceSheet, categoryPerformanceStartRow, currentRow - 1, 8);
    
    // Sheet 3: 03-Comparative Analysis
    const comparativeSheet = workbook.addWorksheet('03-Comparative Analysis');
    currentRow = this.createHeader(comparativeSheet, 'COMPARATIVE ANALYSIS', 'Perbandingan Periode dan Benchmark');
    currentRow = this.createReportInfo(comparativeSheet, currentRow, options.period);
    
    const comparativeHeaders = [
      'Metric', 'Budget Planning', 'Cashflow Tracking', 'Variance', 'Variance (%)',
      'Industry Benchmark', 'vs Benchmark', 'Performance Status', 'Recommendation'
    ];
    
    comparativeHeaders.forEach((header, index) => {
      comparativeSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const comparativeStartRow = currentRow;
    currentRow++;
    
    const comparativeMetrics = [
      {
        metric: 'Total Amount (IDR)',
        budget: totalBudget,
        actual: totalRealisasiAmount,
        benchmark: totalBudget * 1.1, // 10% above budget as benchmark
        unit: 'IDR'
      },
      {
        metric: 'Transaction Count',
        budget: budgetItems.length,
        actual: realisasiItems.length,
        benchmark: budgetItems.length * 1.2,
        unit: 'count'
      },
      {
        metric: 'Average per Transaction (IDR)',
        budget: budgetItems.length > 0 ? totalBudget / budgetItems.length : 0,
        actual: realisasiItems.length > 0 ? totalRealisasiAmount / realisasiItems.length : 0,
        benchmark: budgetItems.length > 0 ? (totalBudget / budgetItems.length) * 0.9 : 0,
        unit: 'IDR'
      },
      {
        metric: 'Profit Margin (%)',
        budget: 15, // Target 15%
        actual: profitMargin,
        benchmark: 20, // Industry benchmark 20%
        unit: 'percent'
      }
    ];
    
    comparativeMetrics.forEach(metric => {
      const variance = metric.actual - metric.budget;
      const variancePercent = metric.budget > 0 ? (variance / metric.budget) * 100 : 0;
      const benchmarkDiff = metric.actual - metric.benchmark;
      const performanceStatus = benchmarkDiff >= 0 ? 'Above Benchmark' : 
        Math.abs(benchmarkDiff / metric.benchmark) <= 0.1 ? 'Near Benchmark' : 'Below Benchmark';
      
      let recommendation = 'Maintain current strategy';
      if (performanceStatus === 'Below Benchmark') {
        recommendation = 'Improvement needed';
      } else if (Math.abs(variancePercent) > 20) {
        recommendation = 'Review budget accuracy';
      }
      
      comparativeSheet.getCell(currentRow, 1).value = metric.metric;
      comparativeSheet.getCell(currentRow, 2).value = metric.unit === 'IDR' ? formatCurrency(metric.budget, 'IDR') : 
        metric.unit === 'percent' ? metric.budget.toFixed(1) + '%' : metric.budget.toString();
      comparativeSheet.getCell(currentRow, 3).value = metric.unit === 'IDR' ? formatCurrency(metric.actual, 'IDR') : 
        metric.unit === 'percent' ? metric.actual.toFixed(1) + '%' : metric.actual.toString();
      comparativeSheet.getCell(currentRow, 4).value = metric.unit === 'IDR' ? formatCurrency(variance, 'IDR') : 
        metric.unit === 'percent' ? variance.toFixed(1) + '%' : variance.toString();
      comparativeSheet.getCell(currentRow, 5).value = variancePercent.toFixed(1) + '%';
      comparativeSheet.getCell(currentRow, 6).value = metric.unit === 'IDR' ? formatCurrency(metric.benchmark, 'IDR') : 
        metric.unit === 'percent' ? metric.benchmark.toFixed(1) + '%' : metric.benchmark.toString();
      comparativeSheet.getCell(currentRow, 7).value = metric.unit === 'IDR' ? formatCurrency(benchmarkDiff, 'IDR') : 
        metric.unit === 'percent' ? benchmarkDiff.toFixed(1) + '%' : benchmarkDiff.toString();
      comparativeSheet.getCell(currentRow, 8).value = performanceStatus;
      comparativeSheet.getCell(currentRow, 9).value = recommendation;
      
      currentRow++;
    });
    
    this.styleDataTable(comparativeSheet, comparativeStartRow, currentRow - 1, 9);
    
    // Sheet 4: 04-Trend Analysis  
    const trendAnalysisSheet = workbook.addWorksheet('04-Trend Analysis');
    currentRow = this.createHeader(trendAnalysisSheet, 'TREND ANALYSIS & FORECASTING', 'Historical Trends dan Prediksi Masa Depan');
    currentRow = this.createReportInfo(trendAnalysisSheet, currentRow, options.period);
    
    const trendHeaders = [
      'Periode', 'Budget (IDR)', 'Actual (IDR)', 'Variance (IDR)', 'Variance (%)',
      'MoM Growth Budget (%)', 'MoM Growth Actual (%)', 'Trend Direction',
      '3-Month Forecast (IDR)', 'Seasonal Factor', 'Confidence Level', 'Risk Assessment'
    ];
    
    trendHeaders.forEach((header, index) => {
      trendAnalysisSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const trendStartRow = currentRow;
    currentRow++;
    
    // Monthly trend data
    const monthlyBudgetTrend = new Map<string, number>();
    const monthlyActualTrend = new Map<string, number>();
    
    budgetItems.forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      monthlyBudgetTrend.set(key, (monthlyBudgetTrend.get(key) || 0) + (item.amount_idr || item.amount));
    });
    
    realisasiItems.forEach(item => {
      const key = `${item.year}-${item.month.toString().padStart(2, '0')}`;
      monthlyActualTrend.set(key, (monthlyActualTrend.get(key) || 0) + (item.amount_idr || item.amount));
    });
    
    const sortedTrendPeriods = Array.from(new Set([...monthlyBudgetTrend.keys(), ...monthlyActualTrend.keys()])).sort();
    let prevBudgetTrend = 0;
    let prevActualTrend = 0;
    
    sortedTrendPeriods.forEach((period, index) => {
      const budgetAmount = monthlyBudgetTrend.get(period) || 0;
      const actualAmount = monthlyActualTrend.get(period) || 0;
      const variance = actualAmount - budgetAmount;
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
      
      const budgetGrowth = prevBudgetTrend > 0 ? ((budgetAmount - prevBudgetTrend) / prevBudgetTrend) * 100 : 0;
      const actualGrowth = prevActualTrend > 0 ? ((actualAmount - prevActualTrend) / prevActualTrend) * 100 : 0;
      
      const trendDirection = actualGrowth > 5 ? 'Upward' : actualGrowth < -5 ? 'Downward' : 'Stable';
      
      // Simple forecast (moving average with growth factor)
      const forecast = index >= 2 ? actualAmount * (1 + actualGrowth / 100) : actualAmount;
      
      const seasonalFactor = Math.sin((parseInt(period.split('-')[1]) - 1) * Math.PI / 6) * 0.1 + 1; // Simple seasonal
      const confidenceLevel = Math.abs(variancePercent) <= 10 ? 'High' : Math.abs(variancePercent) <= 25 ? 'Medium' : 'Low';
      const riskAssessment = Math.abs(variancePercent) <= 10 ? 'Low Risk' : Math.abs(variancePercent) <= 25 ? 'Medium Risk' : 'High Risk';
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const [year, month] = period.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      
      trendAnalysisSheet.getCell(currentRow, 1).value = `${monthName} ${year}`;
      trendAnalysisSheet.getCell(currentRow, 2).value = formatCurrency(budgetAmount, 'IDR');
      trendAnalysisSheet.getCell(currentRow, 3).value = formatCurrency(actualAmount, 'IDR');
      trendAnalysisSheet.getCell(currentRow, 4).value = formatCurrency(variance, 'IDR');
      trendAnalysisSheet.getCell(currentRow, 5).value = variancePercent.toFixed(1) + '%';
      trendAnalysisSheet.getCell(currentRow, 6).value = index === 0 ? 'Base' : budgetGrowth.toFixed(1) + '%';
      trendAnalysisSheet.getCell(currentRow, 7).value = index === 0 ? 'Base' : actualGrowth.toFixed(1) + '%';
      trendAnalysisSheet.getCell(currentRow, 8).value = trendDirection;
      trendAnalysisSheet.getCell(currentRow, 9).value = formatCurrency(forecast, 'IDR');
      trendAnalysisSheet.getCell(currentRow, 10).value = seasonalFactor.toFixed(2);
      trendAnalysisSheet.getCell(currentRow, 11).value = confidenceLevel;
      trendAnalysisSheet.getCell(currentRow, 12).value = riskAssessment;
      
      prevBudgetTrend = budgetAmount;
      prevActualTrend = actualAmount;
      currentRow++;
    });
    
    this.styleDataTable(trendAnalysisSheet, trendStartRow, currentRow - 1, 12);
    
    // Sheet 5: 05-Risk Assessment
    const riskAssessmentSheet = workbook.addWorksheet('05-Risk Assessment');
    currentRow = this.createHeader(riskAssessmentSheet, 'RISK ASSESSMENT & MITIGATION', 'Analisis Risiko dan Rekomendasi');
    currentRow = this.createReportInfo(riskAssessmentSheet, currentRow, options.period);
    
    const riskHeaders = [
      'Risk Category', 'Risk Level', 'Impact (IDR)', 'Probability (%)', 'Risk Score',
      'Current Controls', 'Residual Risk', 'Mitigation Strategy', 'Action Priority',
      'Owner', 'Target Date', 'Status', 'Next Review'
    ];
    
    riskHeaders.forEach((header, index) => {
      riskAssessmentSheet.getCell(currentRow, index + 1).value = header;
    });
    
    const riskStartRow = currentRow;
    currentRow++;
    
    // Risk assessment data based on analysis
    const riskAssessments = [
      {
        category: 'Budget Variance Risk',
        level: Math.abs(budgetVariance) > 25 ? 'HIGH' : Math.abs(budgetVariance) > 10 ? 'MEDIUM' : 'LOW',
        impact: Math.abs(totalRealisasiAmount - totalBudget),
        probability: Math.min(Math.abs(budgetVariance), 90),
        controls: 'Monthly budget review',
        mitigation: Math.abs(budgetVariance) > 25 ? 'Implement weekly monitoring' : 'Continue monthly reviews',
        priority: Math.abs(budgetVariance) > 25 ? 'HIGH' : 'MEDIUM'
      },
      {
        category: 'Cashflow Risk',
        level: netCashFlow < 0 ? 'HIGH' : totalCashOut / totalCashIn > 0.9 ? 'MEDIUM' : 'LOW',
        impact: Math.abs(netCashFlow),
        probability: netCashFlow < 0 ? 80 : 30,
        controls: 'Daily cashflow monitoring',
        mitigation: netCashFlow < 0 ? 'Accelerate receivables collection' : 'Maintain current strategy',
        priority: netCashFlow < 0 ? 'HIGH' : 'LOW'
      },
      {
        category: 'Profitability Risk',
        level: profitMargin < 0 ? 'HIGH' : profitMargin < 10 ? 'MEDIUM' : 'LOW',
        impact: totalCashOut - totalCashIn,
        probability: profitMargin < 0 ? 90 : profitMargin < 10 ? 60 : 20,
        controls: 'Cost monitoring system',
        mitigation: profitMargin < 10 ? 'Cost optimization program' : 'Continue efficiency programs',
        priority: profitMargin < 0 ? 'HIGH' : profitMargin < 10 ? 'MEDIUM' : 'LOW'
      },
      {
        category: 'Operational Efficiency Risk',
        level: roi < 0 ? 'HIGH' : roi < 10 ? 'MEDIUM' : 'LOW',
        impact: Math.abs(totalCashIn - totalBudget),
        probability: roi < 0 ? 70 : 40,
        controls: 'Performance tracking',
        mitigation: roi < 10 ? 'Process improvement initiative' : 'Maintain current processes',
        priority: roi < 0 ? 'HIGH' : 'MEDIUM'
      }
    ];
    
    riskAssessments.forEach(risk => {
      const riskScore = (risk.impact / 1000000) * (risk.probability / 100); // Simplified risk score
      const residualRisk = risk.level === 'HIGH' ? 'MEDIUM' : risk.level === 'MEDIUM' ? 'LOW' : 'VERY LOW';
      
      riskAssessmentSheet.getCell(currentRow, 1).value = risk.category;
      riskAssessmentSheet.getCell(currentRow, 2).value = risk.level;
      riskAssessmentSheet.getCell(currentRow, 3).value = formatCurrency(risk.impact, 'IDR');
      riskAssessmentSheet.getCell(currentRow, 4).value = risk.probability.toFixed(0) + '%';
      riskAssessmentSheet.getCell(currentRow, 5).value = riskScore.toFixed(2);
      riskAssessmentSheet.getCell(currentRow, 6).value = risk.controls;
      riskAssessmentSheet.getCell(currentRow, 7).value = residualRisk;
      riskAssessmentSheet.getCell(currentRow, 8).value = risk.mitigation;
      riskAssessmentSheet.getCell(currentRow, 9).value = risk.priority;
      riskAssessmentSheet.getCell(currentRow, 10).value = 'Finance Manager';
      riskAssessmentSheet.getCell(currentRow, 11).value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID');
      riskAssessmentSheet.getCell(currentRow, 12).value = 'Active';
      riskAssessmentSheet.getCell(currentRow, 13).value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID');
      
      // Color-code risk levels
      const riskCell = riskAssessmentSheet.getCell(currentRow, 2);
      if (risk.level === 'HIGH') {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
      } else if (risk.level === 'MEDIUM') {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
      } else {
        riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
      }
      
      currentRow++;
    });
    
    this.styleDataTable(riskAssessmentSheet, riskStartRow, currentRow - 1, 13);
    
    return workbook;
  }
  
  // Main export function
  async exportToExcel(options: ExportOptions): Promise<void> {
    let workbook: ExcelJS.Workbook;
    
    switch (options.exportType) {
      case 'budget-planning':
        workbook = await this.generateBudgetPlanningExport(options);
        break;
      case 'cashflow-tracking':
        workbook = await this.generateCashflowTrackingExport(options);
        break;
      case 'analysis':
        workbook = await this.generateAnalysisExport(options);
        break;
      default:
        throw new Error('Invalid export type');
    }
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
}

export const excelExportService = new ExcelExportService();
export type { ExportOptions };
