import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ContainerCalculation, ContainerType, ShippingRoute, CostComponent, LoadingPlan } from '@/services/containerService';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  calculation: ContainerCalculation;
  containerType: ContainerType;
  shippingRoute?: ShippingRoute;
  costComponents: CostComponent[];
  loadingPlan?: LoadingPlan;
  results: {
    maxBoxes: number;
    maxCapacity?: number; // Kapasitas maksimal kontainer
    loadingEfficiency: number;
    totalWeight: number;
    totalCBM: number;
    totalCost: number;
    arrangementPattern: string;
    visualization?: {
      lengthCount: number;
      widthCount: number;
      heightCount: number;
      efficiency: number;
      colorCode: string; // Green, Blue, Orange, Red
      recommendedViews: string[];
    };
  };
  loadingRecommendations?: string[];
  metadata?: {
    generatedAt: string;
    version: string;
    hasQuantityField: boolean;
    quantityUsed: number;
  };
}

export const exportService = {
  // Export to PDF
  async exportToPDF(data: ExportData, filename?: string): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header with enhanced branding
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KALKULATOR KONTAINER PROFESIONAL', pageWidth / 2, 20, { align: 'center' });
    
    // Company info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('PT. MALAKA PASAI GLOBAL - Export Container Loading Calculator', pageWidth / 2, 30, { align: 'center' });
    doc.text('Advanced Multi-View Container Analysis Report', pageWidth / 2, 38, { align: 'center' });
    
    // Enhanced date and metadata
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${currentDate}`, pageWidth - 20, 50, { align: 'right' });
    if (data.metadata?.version) {
      doc.text(`Version: ${data.metadata.version}`, pageWidth - 20, 58, { align: 'right' });
    }
    
    let yPosition = 70;
    
    // Enhanced Cargo Information with Quantity
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 INFORMASI KARGO & QUANTITY', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const cargoData = [
      ['Dimensi per Unit', `${data.calculation.cargo_length} × ${data.calculation.cargo_width} × ${data.calculation.cargo_height} ${data.calculation.dimension_unit}`],
      ['Berat per Unit', `${data.calculation.cargo_weight} ${data.calculation.weight_unit}`],
      ['Jumlah Box/Unit', `${data.calculation.cargo_quantity || 1} unit${data.calculation.cargo_quantity > 1 ? 's' : ''}`],
      ['Total Volume', `${data.results.totalCBM.toFixed(4)} CBM`],
      ['CBM per Unit', `${data.results.totalCBM > 0 ? (data.results.totalCBM / (data.calculation.cargo_quantity || 1)).toFixed(4) : '0.0000'} CBM`],
      ['Nilai Kargo', data.calculation.cargo_value ? `$${data.calculation.cargo_value.toLocaleString()}` : 'Tidak ditentukan'],
      ['Density', `${data.calculation.cargo_weight > 0 ? (data.calculation.cargo_weight / (data.results.totalCBM / (data.calculation.cargo_quantity || 1)) * 1000).toFixed(2) : '0'} kg/CBM`]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Parameter', 'Nilai']],
      body: cargoData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Enhanced Container Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🚢 SPESIFIKASI KONTAINER', 20, yPosition);
    
    yPosition += 10;
    const containerData = [
      ['Tipe Kontainer', data.containerType.name],
      ['Dimensi Internal (L×W×H)', `${data.containerType.internal_length}m × ${data.containerType.internal_width}m × ${data.containerType.internal_height}m`],
      ['Kapasitas Volume', `${data.containerType.cubic_capacity} CBM`],
      ['Berat Maksimal', `${(data.containerType.max_payload / 1000).toFixed(1)} ton`],
      ['Biaya Sewa', `$${data.containerType.rental_cost.toLocaleString()}`],
      ['Utilisasi Volume', `${((data.results.totalCBM / data.containerType.cubic_capacity) * 100).toFixed(1)}%`]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Spesifikasi', 'Detail']],
      body: containerData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Enhanced Results with Multi-View Analysis
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 HASIL PERHITUNGAN & ANALISIS MULTI-VIEW', 20, yPosition);
    
    yPosition += 10;
    const resultsData = [
      ['Kapasitas Maksimal per Kontainer', `${data.results.maxCapacity?.toLocaleString() || data.results.maxBoxes.toLocaleString()} boxes`],
      ['Boxes yang Digunakan', `${data.results.maxBoxes.toLocaleString()} boxes`],
      ['Pola Susunan (P×L×T)', data.results.arrangementPattern],
      ['Efisiensi Loading', `${data.results.loadingEfficiency.toFixed(1)}% ${data.results.visualization?.colorCode ? `(${data.results.visualization.colorCode})` : ''}`],
      ['Total Berat', `${(data.results.totalWeight / 1000).toFixed(2)} ton`],
      ['Total Volume', `${data.results.totalCBM.toFixed(3)} CBM`],
      ['Berat vs Kapasitas', `${((data.results.totalWeight / data.containerType.max_payload) * 100).toFixed(1)}% dari max`],
      ['Total Biaya Estimasi', `$${data.results.totalCost.toLocaleString()}`],
      ['Biaya per Box', `$${(data.results.totalCost / data.results.maxBoxes).toFixed(2)}`],
      ['Biaya per CBM', `$${(data.results.totalCost / data.results.totalCBM).toFixed(2)}`]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metrik', 'Nilai']],
      body: resultsData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [142, 68, 173], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Multi-View Visualization Analysis
    if (data.results.visualization) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🎨 ANALISIS VISUALISASI 3-VIEW', 20, yPosition);
      
      yPosition += 10;
      const vizData = [
        ['Grid Susunan Panjang', `${data.results.visualization.lengthCount} boxes`],
        ['Grid Susunan Lebar', `${data.results.visualization.widthCount} boxes`],
        ['Grid Susunan Tinggi', `${data.results.visualization.heightCount} layers`],
        ['Tingkat Efisiensi', `${data.results.visualization.efficiency.toFixed(1)}%`],
        ['Color Code', data.results.visualization.colorCode],
        ['Status Loading', data.results.visualization.efficiency >= 85 ? 'EXCELLENT' : data.results.visualization.efficiency >= 70 ? 'GOOD' : data.results.visualization.efficiency >= 50 ? 'FAIR' : 'POOR'],
        ['Rekomendasi View', data.results.visualization.recommendedViews?.join(', ') || 'Side, Front, Top']
      ];
      
      doc.autoTable({
        startY: yPosition,
        head: [['Aspek Visualisasi', 'Detail']],
        body: vizData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Loading Recommendations
    if (data.loadingRecommendations && data.loadingRecommendations.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('✅ REKOMENDASI LOADING', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      data.loadingRecommendations.forEach((recommendation, index) => {
        const bullet = `${index + 1}. `;
        const lines = doc.splitTextToSize(recommendation, pageWidth - 40);
        doc.text(bullet + lines[0], 25, yPosition);
        if (lines.length > 1) {
          for (let i = 1; i < lines.length; i++) {
            yPosition += 5;
            doc.text(lines[i], 30, yPosition);
          }
        }
        yPosition += 7;
      });
      
      yPosition += 5;
    }
    
    // Cost Breakdown if available
    if (data.costComponents && data.costComponents.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RINCIAN BIAYA', 20, yPosition);
      
      yPosition += 10;
      const costData = data.costComponents.map(component => [
        component.component_name,
        component.component_type,
        `$${component.component_cost.toLocaleString()}`
      ]);
      
      doc.autoTable({
        startY: yPosition,
        head: [['Komponen Biaya', 'Kategori', 'Biaya']],
        body: costData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [231, 76, 60] }
      });
    }
    
    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by MPG Export Container Calculator - Page ${i} of ${totalPages}`, 
        pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save PDF
    const fileName = filename || `Container_Calculation_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  },
  
  // Export to Excel
  async exportToExcel(data: ExportData, filename?: string): Promise<void> {
    const workbook = XLSX.utils.book_new();
    
    // Enhanced Summary Sheet
    const summaryData = [
      ['LAPORAN KALKULATOR KONTAINER PROFESIONAL'],
      ['PT. MALAKA PASAI GLOBAL - Advanced Multi-View Analysis'],
      [''],
      ['Generated', new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
      ['Version', data.metadata?.version || 'v2.0'],
      ['Has Quantity Field', data.metadata?.hasQuantityField ? 'YES' : 'NO'],
      [''],
      ['INFORMASI KARGO & QUANTITY'],
      ['Dimensi per Unit', `${data.calculation.cargo_length} × ${data.calculation.cargo_width} × ${data.calculation.cargo_height} ${data.calculation.dimension_unit}`],
      ['Berat per Unit', `${data.calculation.cargo_weight} ${data.calculation.weight_unit}`],
      ['Jumlah Box/Unit', `${data.calculation.cargo_quantity || 1} unit${(data.calculation.cargo_quantity || 1) > 1 ? 's' : ''}`],
      ['Total Volume', `${data.results.totalCBM.toFixed(4)} CBM`],
      ['CBM per Unit', `${data.results.totalCBM > 0 ? (data.results.totalCBM / (data.calculation.cargo_quantity || 1)).toFixed(4) : '0.0000'} CBM`],
      ['Nilai Kargo', data.calculation.cargo_value ? `$${data.calculation.cargo_value.toLocaleString()}` : 'Tidak ditentukan'],
      ['Cargo Density', `${data.calculation.cargo_weight > 0 ? (data.calculation.cargo_weight / (data.results.totalCBM / (data.calculation.cargo_quantity || 1)) * 1000).toFixed(2) : '0'} kg/CBM`],
      [''],
      ['SPESIFIKASI KONTAINER'],
      ['Tipe Kontainer', data.containerType.name],
      ['Dimensi Internal (L×W×H)', `${data.containerType.internal_length}m × ${data.containerType.internal_width}m × ${data.containerType.internal_height}m`],
      ['Kapasitas Volume', `${data.containerType.cubic_capacity} CBM`],
      ['Berat Maksimal', `${(data.containerType.max_payload / 1000).toFixed(1)} ton`],
      ['Biaya Sewa', `$${data.containerType.rental_cost.toLocaleString()}`],
      ['Utilisasi Volume', `${((data.results.totalCBM / data.containerType.cubic_capacity) * 100).toFixed(1)}%`],
      [''],
      ['HASIL PERHITUNGAN & ANALISIS MULTI-VIEW'],
      ['Kapasitas Maksimal per Kontainer', `${data.results.maxCapacity?.toLocaleString() || data.results.maxBoxes.toLocaleString()} boxes`],
      ['Boxes yang Digunakan', `${data.results.maxBoxes.toLocaleString()} boxes`],
      ['Pola Susunan (P×L×T)', data.results.arrangementPattern],
      ['Efisiensi Loading', `${data.results.loadingEfficiency.toFixed(1)}%`],
      ['Total Berat', `${(data.results.totalWeight / 1000).toFixed(2)} ton`],
      ['Total Volume', `${data.results.totalCBM.toFixed(3)} CBM`],
      ['Berat vs Kapasitas', `${((data.results.totalWeight / data.containerType.max_payload) * 100).toFixed(1)}% dari max`],
      ['Total Biaya Estimasi', `$${data.results.totalCost.toLocaleString()}`],
      ['Biaya per Box', `$${(data.results.totalCost / data.results.maxBoxes).toFixed(2)}`],
      ['Biaya per CBM', `$${(data.results.totalCost / data.results.totalCBM).toFixed(2)}`]
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');
    
    // Multi-View Visualization Sheet
    if (data.results.visualization) {
      const vizHeaders = ['Aspek Visualisasi', 'Detail'];
      const vizData = [
        ['Grid Susunan Panjang', `${data.results.visualization.lengthCount} boxes`],
        ['Grid Susunan Lebar', `${data.results.visualization.widthCount} boxes`],
        ['Grid Susunan Tinggi', `${data.results.visualization.heightCount} layers`],
        ['Tingkat Efisiensi', `${data.results.visualization.efficiency.toFixed(1)}%`],
        ['Color Code', data.results.visualization.colorCode],
        ['Status Loading', data.results.visualization.efficiency >= 85 ? 'EXCELLENT' : data.results.visualization.efficiency >= 70 ? 'GOOD' : data.results.visualization.efficiency >= 50 ? 'FAIR' : 'POOR'],
        ['Rekomendasi View', data.results.visualization.recommendedViews?.join(', ') || 'Side, Front, Top'],
        ['View Analysis', 'Professional 3-View Technical Drawing'],
        ['Interactive Features', 'Dimension Toggle, Color Coding, Grid Info']
      ];
      
      const vizWS = XLSX.utils.aoa_to_sheet([vizHeaders, ...vizData]);
      XLSX.utils.book_append_sheet(workbook, vizWS, 'Multi-View Analysis');
    }
    
    // Cost Breakdown Sheet (Enhanced)
    if (data.costComponents && data.costComponents.length > 0) {
      const costHeaders = ['Komponen Biaya', 'Kategori', 'Biaya (USD)', 'Persentase'];
      const totalCost = data.results.totalCost;
      const costData = data.costComponents.map(component => [
        component.component_name,
        component.component_type,
        component.component_cost,
        `${((component.component_cost / totalCost) * 100).toFixed(1)}%`
      ]);
      
      // Add additional cost analysis rows
      costData.push(
        ['', '', '', ''],
        ['ANALISIS BIAYA PER UNIT', '', '', ''],
        ['Biaya per Box', '', (totalCost / data.results.maxBoxes).toFixed(2), ''],
        ['Biaya per CBM', '', (totalCost / data.results.totalCBM).toFixed(2), ''],
        ['Biaya per Ton', '', (totalCost / (data.results.totalWeight / 1000)).toFixed(2), ''],
        ['', '', '', ''],
        ['TOTAL', 'ALL COMPONENTS', totalCost, '100.0%']
      );
      
      const costWS = XLSX.utils.aoa_to_sheet([costHeaders, ...costData]);
      XLSX.utils.book_append_sheet(workbook, costWS, 'Cost Analysis');
    }
    
    // Loading Recommendations Sheet
    if (data.loadingRecommendations && data.loadingRecommendations.length > 0) {
      const recHeaders = ['No', 'Rekomendasi Loading'];
      const recData = data.loadingRecommendations.map((rec, index) => [
        index + 1,
        rec
      ]);
      
      const recWS = XLSX.utils.aoa_to_sheet([recHeaders, ...recData]);
      XLSX.utils.book_append_sheet(workbook, recWS, 'Loading Recommendations');
    }
    
    // Shipping Route Sheet (if available)
    if (data.shippingRoute) {
      const routeData = [
        ['INFORMASI RUTE PENGIRIMAN'],
        [''],
        ['Origin Port', data.shippingRoute.origin_port],
        ['Destination Port', data.shippingRoute.destination_port],
        ['Transit Days', `${data.shippingRoute.transit_days} days`],
        ['Distance', `${data.shippingRoute.distance_km.toLocaleString()} km`],
        ['Base Handling Cost', `$${data.shippingRoute.base_handling_cost.toLocaleString()}`],
        ['Documentation Fee', `$${data.shippingRoute.documentation_fee.toLocaleString()}`],
        ['Insurance Rate', `${data.shippingRoute.insurance_rate}%`],
        [''],
        ['ESTIMASI WAKTU TOTAL'],
        ['Sea Transit', `${data.shippingRoute.transit_days} days`],
        ['Port Clearance', '2-3 days'],
        ['Inland Transport', '1-2 days'],
        ['Total Estimate', `${data.shippingRoute.transit_days + 4}-${data.shippingRoute.transit_days + 6} days`]
      ];
      
      const routeWS = XLSX.utils.aoa_to_sheet(routeData);
      XLSX.utils.book_append_sheet(workbook, routeWS, 'Shipping Route');
    }
    
    // Save Excel file
    const fileName = filename || `Container_Calculation_Advanced_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },
  
  // Generate Enhanced Email Content
  generateEmailContent(data: ExportData): string {
    const emailContent = `
Subject: Container Loading Calculation - Advanced Multi-View Analysis - ${data.containerType.name}

Dear Customer,

Berikut adalah hasil perhitungan container loading profesional dengan analisis multi-view untuk cargo Anda:

📦 INFORMASI KARGO & QUANTITY:
- Dimensi per unit: ${data.calculation.cargo_length} × ${data.calculation.cargo_width} × ${data.calculation.cargo_height} ${data.calculation.dimension_unit}
- Berat per unit: ${data.calculation.cargo_weight} ${data.calculation.weight_unit}
- Jumlah box/unit: ${data.calculation.cargo_quantity || 1} unit${(data.calculation.cargo_quantity || 1) > 1 ? 's' : ''}
- Total volume: ${data.results.totalCBM.toFixed(4)} CBM
- CBM per unit: ${data.results.totalCBM > 0 ? (data.results.totalCBM / (data.calculation.cargo_quantity || 1)).toFixed(4) : '0.0000'} CBM
${data.calculation.cargo_value ? `- Nilai cargo: $${data.calculation.cargo_value.toLocaleString()}` : ''}
- Cargo density: ${data.calculation.cargo_weight > 0 ? (data.calculation.cargo_weight / (data.results.totalCBM / (data.calculation.cargo_quantity || 1)) * 1000).toFixed(2) : '0'} kg/CBM

🚢 KONTAINER YANG DISARANKAN:
- Tipe: ${data.containerType.name}
- Dimensi internal: ${data.containerType.internal_length}m × ${data.containerType.internal_width}m × ${data.containerType.internal_height}m
- Kapasitas maksimal: ${data.results.maxCapacity?.toLocaleString() || data.results.maxBoxes.toLocaleString()} boxes
- Utilisasi volume: ${((data.results.totalCBM / data.containerType.cubic_capacity) * 100).toFixed(1)}%

📊 HASIL PERHITUNGAN & MULTI-VIEW ANALYSIS:
- Boxes yang digunakan: ${data.results.maxBoxes.toLocaleString()} boxes
- Pola susunan (P×L×T): ${data.results.arrangementPattern}
- Efisiensi loading: ${data.results.loadingEfficiency.toFixed(1)}% ${data.results.visualization?.colorCode ? `(${data.results.visualization.colorCode})` : ''}
- Total berat: ${(data.results.totalWeight / 1000).toFixed(2)} ton (${((data.results.totalWeight / data.containerType.max_payload) * 100).toFixed(1)}% dari kapasitas max)
- Total volume: ${data.results.totalCBM.toFixed(3)} CBM
- Estimasi total biaya: $${data.results.totalCost.toLocaleString()}
- Biaya per box: $${(data.results.totalCost / data.results.maxBoxes).toFixed(2)}
- Biaya per CBM: $${(data.results.totalCost / data.results.totalCBM).toFixed(2)}

${data.results.visualization ? `🎨 ANALISIS VISUALISASI 3-VIEW:
- Grid susunan: ${data.results.visualization.lengthCount} × ${data.results.visualization.widthCount} × ${data.results.visualization.heightCount}
- Status loading: ${data.results.visualization.efficiency >= 85 ? 'EXCELLENT ✅' : data.results.visualization.efficiency >= 70 ? 'GOOD 👍' : data.results.visualization.efficiency >= 50 ? 'FAIR ⚠️' : 'POOR ❌'}
- Color code: ${data.results.visualization.colorCode}
- Rekomendasi view: ${data.results.visualization.recommendedViews?.join(', ') || 'Side, Front, Top'}
` : ''}

${data.shippingRoute ? `🌍 RUTE PENGIRIMAN:
- ${data.shippingRoute.origin_port} → ${data.shippingRoute.destination_port}
- Waktu transit: ${data.shippingRoute.transit_days} hari
- Jarak: ${data.shippingRoute.distance_km.toLocaleString()} km
- Estimasi total waktu: ${data.shippingRoute.transit_days + 4}-${data.shippingRoute.transit_days + 6} hari (termasuk port clearance & inland transport)
` : ''}

${data.loadingRecommendations && data.loadingRecommendations.length > 0 ? `✅ REKOMENDASI LOADING:
${data.loadingRecommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}
` : ''}

💡 FITUR ADVANCED YANG TERSEDIA:
- Multi-view container visualization (Side, Front, Top view)
- Professional technical drawing dengan dimensi
- Color-coded loading efficiency analysis
- Interactive grid information dan legends
- Comprehensive cost breakdown dengan analisis per unit
- Loading best practices recommendations

Terima kasih atas kepercayaan Anda kepada PT. MALAKA PASAI GLOBAL.
Untuk informasi lebih lanjut atau konsultasi teknis, silakan hubungi team expert kami.

--
Best Regards,
MPG Export Container Analysis Team
PT. MALAKA PASAI GLOBAL

Generated by: Advanced Container Loading Calculator v${data.metadata?.version || '2.0'}
Timestamp: ${new Date().toLocaleString('id-ID')}
    `;
    
    return emailContent.trim();
  },
  
  // Copy to Clipboard
  async copyToClipboard(data: ExportData): Promise<void> {
    const content = this.generateEmailContent(data);
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy text: ', err);
        throw err;
      }
      document.body.removeChild(textArea);
    }
  }
};