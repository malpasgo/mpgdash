import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Container, Package, Ruler, Calculator, BarChart3, CheckCircle, AlertTriangle, 
  Maximize, Eye, RotateCcw, DollarSign, FileDown, Mail, Save, MapPin, 
  Clock, Scale, Layers, Download, Settings, Globe, TrendingUp, Loader
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContainerVisualization from '@/components/ContainerVisualization';
import { 
  ContainerType, 
  ShippingRoute, 
  ContainerCalculation,
  containerTypesService,
  shippingRoutesService,
  calculationsService,
  costComponentsService,
  loadingPlansService
} from '@/services/containerService';
import { exportService, ExportData } from '@/services/exportService';

// Types
export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number; // Jumlah box/unit (optional, default 1)
  unit: 'cm' | 'mm' | 'inches';
  weightUnit: 'kg' | 'lbs' | 'tons';
}

interface CostBreakdown {
  containerRental: number;
  handling: number;
  documentation: number;
  insurance: number;
  total: number;
}

export interface ArrangementResult {
  lengthCount: number;
  widthCount: number;
  heightCount: number;
  totalBoxes: number;
  maxCapacity?: number; // Kapasitas maksimal kontainer
  efficiency: number;
  totalWeight: number;
  remainingSpace: {
    length: number;
    width: number;
    height: number;
  };
}

export const KalkulatorKontainer: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('capacity');
  const [boxData, setBoxData] = useState<BoxDimensions>({
    length: 0, width: 0, height: 0, weight: 0, quantity: 1,
    unit: 'cm', weightUnit: 'kg'
  });
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [shippingRoutes, setShippingRoutes] = useState<ShippingRoute[]>([]);
  const [selectedContainerType, setSelectedContainerType] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [cargoValue, setCargoValue] = useState(50000);
  const [results, setResults] = useState<ArrangementResult | null>(null);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<ContainerCalculation[]>([]);
  const [currentCalculationId, setCurrentCalculationId] = useState<string | null>(null);

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [containerTypesData, routesData, historyData] = await Promise.all([
        containerTypesService.getAll(),
        shippingRoutesService.getAll(),
        calculationsService.getHistory(10)
      ]);
      
      setContainerTypes(containerTypesData);
      setShippingRoutes(routesData);
      setCalculationHistory(historyData);
      
      // Set default selections
      if (containerTypesData.length > 0) {
        setSelectedContainerType(containerTypesData[0].id);
      }
      if (routesData.length > 0) {
        setSelectedRoute(routesData[0].id);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      setErrors({ general: 'Gagal memuat data master. Silakan refresh halaman.' });
    } finally {
      setLoading(false);
    }
  };

  // Unit conversion utilities
  const convertToMeters = (value: number, unit: string): number => {
    switch (unit) {
      case 'cm': return value / 100;
      case 'mm': return value / 1000;
      case 'inches': return value * 0.0254;
      default: return value;
    }
  };

  const convertToKg = (value: number, unit: string): number => {
    switch (unit) {
      case 'lbs': return value * 0.453592;
      case 'tons': return value * 1000;
      default: return value;
    }
  };

  const convertToCBM = (l: number, w: number, h: number, unit: string): number => {
    const lengthM = convertToMeters(l, unit);
    const widthM = convertToMeters(w, unit);
    const heightM = convertToMeters(h, unit);
    return lengthM * widthM * heightM;
  };

  // Calculate container loading capacity
  const calculateCapacity = (): ArrangementResult | null => {
    if (boxData.length <= 0 || boxData.width <= 0 || boxData.height <= 0 || !selectedContainerType) return null;

    const container = containerTypes.find(c => c.id === selectedContainerType);
    if (!container) return null;

    const boxL = convertToMeters(boxData.length, boxData.unit);
    const boxW = convertToMeters(boxData.width, boxData.unit);
    const boxH = convertToMeters(boxData.height, boxData.unit);
    const boxWeight = convertToKg(boxData.weight, boxData.weightUnit);
    const requestedQuantity = Math.max(1, boxData.quantity || 1); // Minimum 1

    // Calculate all possible orientations
    const orientations = [
      [boxL, boxW, boxH],
      [boxL, boxH, boxW],
      [boxW, boxL, boxH],
      [boxW, boxH, boxL],
      [boxH, boxL, boxW],
      [boxH, boxW, boxL]
    ];

    let bestArrangement: ArrangementResult | null = null;

    orientations.forEach(([l, w, h]) => {
      const lengthCount = Math.floor(container.internal_length / l);
      const widthCount = Math.floor(container.internal_width / w);
      const heightCount = Math.floor(container.internal_height / h);
      
      if (lengthCount > 0 && widthCount > 0 && heightCount > 0) {
        const maxBoxesPerContainer = lengthCount * widthCount * heightCount;
        const totalWeight = maxBoxesPerContainer * boxWeight;
        
        // Check weight constraint
        if (totalWeight <= container.max_payload) {
          const usedVolume = maxBoxesPerContainer * (l * w * h);
          const containerVolume = container.internal_length * container.internal_width * container.internal_height;
          const efficiency = (usedVolume / containerVolume) * 100;
          
          // Calculate based on requested quantity
          const actualBoxes = Math.min(maxBoxesPerContainer, requestedQuantity);
          const actualWeight = actualBoxes * boxWeight;
          
          const arrangement: ArrangementResult = {
            lengthCount, widthCount, heightCount,
            totalBoxes: actualBoxes,
            maxCapacity: maxBoxesPerContainer, // Add max capacity info
            efficiency: efficiency,
            totalWeight: actualWeight,
            remainingSpace: {
              length: container.internal_length - (lengthCount * l),
              width: container.internal_width - (widthCount * w),
              height: container.internal_height - (heightCount * h)
            }
          };
          
          if (!bestArrangement || maxBoxesPerContainer > (bestArrangement as any).maxCapacity) {
            bestArrangement = arrangement;
          }
        }
      }
    });

    return bestArrangement;
  };

  // Calculate shipping costs
  const calculateCosts = (): CostBreakdown | null => {
    const container = containerTypes.find(c => c.id === selectedContainerType);
    const route = shippingRoutes.find(r => r.id === selectedRoute);
    
    if (!container || !route) return null;
    
    const containerRental = container.rental_cost;
    const handling = route.base_handling_cost;
    const documentation = route.documentation_fee;
    const insurance = cargoValue * (route.insurance_rate / 100); // Convert percentage to decimal
    
    const total = containerRental + handling + documentation + insurance;
    
    return { containerRental, handling, documentation, insurance, total };
  };

  // Update calculations when data changes
  useEffect(() => {
    if (containerTypes.length > 0 && shippingRoutes.length > 0) {
      const newResults = calculateCapacity();
      const newCosts = calculateCosts();
      setResults(newResults);
      setCosts(newCosts);
    }
  }, [boxData, selectedContainerType, selectedRoute, cargoValue, containerTypes, shippingRoutes]);

  // Input handlers
  const updateBoxData = (field: keyof BoxDimensions, value: any) => {
    setBoxData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get color code based on efficiency
  const getEfficiencyColorCode = (efficiency: number): string => {
    if (efficiency >= 85) return 'Green (Excellent)';
    if (efficiency >= 70) return 'Blue (Good)';
    if (efficiency >= 50) return 'Orange (Fair)';
    return 'Red (Poor)';
  };

  // Helper function to generate loading recommendations
  const getLoadingRecommendations = (): string[] => {
    return [
      'Muat barang berat di bagian bawah kontainer untuk stabilitas optimal',
      'Distribusikan berat secara merata di seluruh lantai kontainer',
      'Sisakan minimal 10cm ruang untuk sirkulasi udara dan akses pekerja',
      'Gunakan dunnage/pallet untuk melindungi barang dari kerusakan',
      'Pastikan total loading tidak melebihi batas berat maksimal kontainer',
      'Amankan barang dengan tali atau strap untuk mencegah pergeseran selama transit',
      'Gunakan moisture absorber untuk cargo yang sensitif terhadap kelembaban',
      'Dokumentasikan proses loading dengan foto untuk keperluan klaim asuransi'
    ];
  };

  // Save calculation to database
  const saveCalculation = async () => {
    if (!results || !costs) {
      setErrors({ save: 'Tidak ada perhitungan untuk disimpan' });
      return;
    }

    setSaving(true);
    try {
      const calculationData: ContainerCalculation = {
        container_type_id: selectedContainerType,
        shipping_route_id: selectedRoute || undefined,
        cargo_length: boxData.length,
        cargo_width: boxData.width,
        cargo_height: boxData.height,
        cargo_weight: boxData.weight,
        cargo_quantity: boxData.quantity || 1,
        dimension_unit: boxData.unit,
        weight_unit: boxData.weightUnit,
        cargo_value: cargoValue,
        max_boxes: results.totalBoxes,
        loading_efficiency: results.efficiency,
        total_weight: results.totalWeight,
        total_cbm: convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * (boxData.quantity || 1),
        total_cost: costs.total,
        calculation_data: {
          results,
          costs,
          arrangement: `${results.lengthCount}P × ${results.widthCount}L × ${results.heightCount}T`
        }
      };

      const calculationId = await calculationsService.save(calculationData);
      setCurrentCalculationId(calculationId);

      // Save cost components
      const costComponents = [
        { calculation_id: calculationId, component_name: 'Container Rental', component_cost: costs.containerRental, component_type: 'rental' },
        { calculation_id: calculationId, component_name: 'Handling Charges', component_cost: costs.handling, component_type: 'handling' },
        { calculation_id: calculationId, component_name: 'Documentation Fee', component_cost: costs.documentation, component_type: 'documentation' },
        { calculation_id: calculationId, component_name: 'Insurance', component_cost: costs.insurance, component_type: 'insurance' }
      ];

      await costComponentsService.save(costComponents);

      // Reload calculation history
      const historyData = await calculationsService.getHistory(10);
      setCalculationHistory(historyData);

      setErrors({});
      alert('Perhitungan berhasil disimpan!');
    } catch (error) {
      console.error('Error saving calculation:', error);
      setErrors({ save: 'Gagal menyimpan perhitungan. Silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  // Export functions
  const exportToPDF = async () => {
    if (!results || !costs) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    try {
      const container = containerTypes.find(c => c.id === selectedContainerType);
      const route = shippingRoutes.find(r => r.id === selectedRoute);
      
      if (!container) {
        throw new Error('Container type not found');
      }

      const exportData: ExportData = {
        calculation: {
          container_type_id: selectedContainerType,
          cargo_length: boxData.length,
          cargo_width: boxData.width,
          cargo_height: boxData.height,
          cargo_weight: boxData.weight,
          cargo_quantity: boxData.quantity || 1,
          dimension_unit: boxData.unit,
          weight_unit: boxData.weightUnit,
          cargo_value: cargoValue
        },
        containerType: container,
        shippingRoute: route,
        costComponents: [
          { component_name: 'Container Rental', component_cost: costs.containerRental, component_type: 'rental', calculation_id: '' },
          { component_name: 'Handling Charges', component_cost: costs.handling, component_type: 'handling', calculation_id: '' },
          { component_name: 'Documentation Fee', component_cost: costs.documentation, component_type: 'documentation', calculation_id: '' },
          { component_name: 'Insurance', component_cost: costs.insurance, component_type: 'insurance', calculation_id: '' }
        ],
        results: {
          maxBoxes: results.totalBoxes,
          maxCapacity: results.maxCapacity,
          loadingEfficiency: results.efficiency,
          totalWeight: results.totalWeight,
          totalCBM: convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * (boxData.quantity || 1),
          totalCost: costs.total,
          arrangementPattern: `${results.lengthCount}P × ${results.widthCount}L × ${results.heightCount}T`,
          visualization: {
            lengthCount: results.lengthCount,
            widthCount: results.widthCount,
            heightCount: results.heightCount,
            efficiency: results.efficiency,
            colorCode: getEfficiencyColorCode(results.efficiency),
            recommendedViews: ['Side View', 'Front View', 'Top View']
          }
        },
        loadingRecommendations: getLoadingRecommendations(),
        metadata: {
          generatedAt: new Date().toISOString(),
          version: 'v2.0-Advanced',
          hasQuantityField: true,
          quantityUsed: boxData.quantity || 1
        }
      };

      await exportService.exportToPDF(exportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!results || !costs) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    try {
      const container = containerTypes.find(c => c.id === selectedContainerType);
      const route = shippingRoutes.find(r => r.id === selectedRoute);
      
      if (!container) {
        throw new Error('Container type not found');
      }

      const exportData: ExportData = {
        calculation: {
          container_type_id: selectedContainerType,
          cargo_length: boxData.length,
          cargo_width: boxData.width,
          cargo_height: boxData.height,
          cargo_weight: boxData.weight,
          cargo_quantity: boxData.quantity || 1,
          dimension_unit: boxData.unit,
          weight_unit: boxData.weightUnit,
          cargo_value: cargoValue
        },
        containerType: container,
        shippingRoute: route,
        costComponents: [
          { component_name: 'Container Rental', component_cost: costs.containerRental, component_type: 'rental', calculation_id: '' },
          { component_name: 'Handling Charges', component_cost: costs.handling, component_type: 'handling', calculation_id: '' },
          { component_name: 'Documentation Fee', component_cost: costs.documentation, component_type: 'documentation', calculation_id: '' },
          { component_name: 'Insurance', component_cost: costs.insurance, component_type: 'insurance', calculation_id: '' }
        ],
        results: {
          maxBoxes: results.totalBoxes,
          maxCapacity: results.maxCapacity,
          loadingEfficiency: results.efficiency,
          totalWeight: results.totalWeight,
          totalCBM: convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * (boxData.quantity || 1),
          totalCost: costs.total,
          arrangementPattern: `${results.lengthCount}P × ${results.widthCount}L × ${results.heightCount}T`,
          visualization: {
            lengthCount: results.lengthCount,
            widthCount: results.widthCount,
            heightCount: results.heightCount,
            efficiency: results.efficiency,
            colorCode: getEfficiencyColorCode(results.efficiency),
            recommendedViews: ['Side View', 'Front View', 'Top View']
          }
        },
        loadingRecommendations: getLoadingRecommendations(),
        metadata: {
          generatedAt: new Date().toISOString(),
          version: 'v2.0-Advanced',
          hasQuantityField: true,
          quantityUsed: boxData.quantity || 1
        }
      };

      await exportService.exportToExcel(exportData);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Gagal mengekspor Excel. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const resetCalculator = () => {
    setBoxData({ length: 0, width: 0, height: 0, weight: 0, quantity: 1, unit: 'cm', weightUnit: 'kg' });
    if (containerTypes.length > 0) {
      setSelectedContainerType(containerTypes[0].id);
    }
    if (shippingRoutes.length > 0) {
      setSelectedRoute(shippingRoutes[0].id);
    }
    setCargoValue(50000);
    setResults(null);
    setCosts(null);
    setCurrentCalculationId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Memuat Kalkulator Kontainer</h3>
          <p className="text-gray-500">Mohon tunggu, sedang memuat data master...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.general) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-500 mb-4">{errors.general}</p>
          <Button onClick={loadMasterData} className="bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Container className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kalkulator Kontainer Profesional</h1>
                <p className="text-gray-600">Comprehensive Container Loading & Cost Calculator for Export Operations</p>
              </div>
            </div>
            <Button onClick={resetCalculator} variant="outline" className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>Reset All</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Calculator Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="capacity" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Kapasitas</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Biaya</span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Loading Plan</span>
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>CBM & Konversi</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Capacity Calculator Tab */}
          <TabsContent value="capacity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Box Dimensions Card */}
                <Card className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Dimensi & Berat Barang</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Panjang *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.length}
                        onChange={(e) => updateBoxData('length', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lebar *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.width}
                        onChange={(e) => updateBoxData('width', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.height}
                        onChange={(e) => updateBoxData('height', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Berat *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.weight}
                        onChange={(e) => updateBoxData('weight', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Box</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.quantity || 1}
                        onChange={(e) => updateBoxData('quantity', Math.max(1, Number(e.target.value) || 1))}
                        placeholder="1"
                        title="Opsional - kosongkan atau isi 1 jika hanya 1 unit"
                      />
                      <p className="text-xs text-gray-500 mt-1">Opsional - default 1</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Dimensi</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.unit}
                        onChange={(e) => updateBoxData('unit', e.target.value)}
                      >
                        <option value="cm">Centimeter (cm)</option>
                        <option value="mm">Millimeter (mm)</option>
                        <option value="inches">Inches</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Berat</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={boxData.weightUnit}
                        onChange={(e) => updateBoxData('weightUnit', e.target.value)}
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="lbs">Pounds (lbs)</option>
                        <option value="tons">Tons</option>
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Container Selection Card */}
                <Card className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Container className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Spesifikasi Kontainer</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Kontainer</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={selectedContainerType}
                        onChange={(e) => setSelectedContainerType(e.target.value)}
                        disabled={loading}
                      >
                        {loading ? (
                          <option>Loading...</option>
                        ) : (
                          containerTypes.map((container) => (
                            <option key={container.id} value={container.id}>
                              {container.name} - Max {(container.max_payload/1000).toFixed(1)}t
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Dimensi Internal:</h4>
                      {(() => {
                        const container = containerTypes.find(c => c.id === selectedContainerType);
                        return container ? (
                          <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
                            <div><strong>P:</strong> {container.internal_length}m</div>
                            <div><strong>L:</strong> {container.internal_width}m</div>
                            <div><strong>T:</strong> {container.internal_height}m</div>
                          </div>
                        ) : (
                          <div className="text-sm text-blue-800">Pilih tipe kontainer...</div>
                        );
                      })()}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="space-y-6">
                {/* Main Results */}
                <Card className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Hasil Perhitungan</h2>
                  </div>
                  
                  {results ? (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Primary Result */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-green-900">
                            {boxData.quantity > 1 ? 'Hasil untuk ' + boxData.quantity.toLocaleString() + ' Box' : 'Kapasitas Maksimum'}
                          </h3>
                        </div>
                        <div className="text-3xl font-bold text-green-900 mb-2">
                          {results.totalBoxes.toLocaleString()} boxes
                        </div>
                        <div className="text-sm text-green-700">
                          Susunan: {results.lengthCount}P × {results.widthCount}L × {results.heightCount}T
                        </div>
                        {results.maxCapacity && results.maxCapacity !== results.totalBoxes && (
                          <div className="text-sm text-orange-700 mt-2">
                            ⚠️ Kapasitas maksimal kontainer: {results.maxCapacity.toLocaleString()} boxes
                          </div>
                        )}
                      </div>
                      
                      {/* Efficiency & Weight */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <div className="text-sm text-blue-700 mb-1">Efisiensi Loading</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {results.efficiency.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                          <div className="text-sm text-purple-700 mb-1">Total Berat</div>
                          <div className="text-lg font-bold text-purple-900">
                            {(results.totalWeight/1000).toFixed(1)}t
                          </div>
                        </div>
                      </div>
                      
                      {/* CBM Calculation */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-3">Volume CBM</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-orange-700">Per Box:</span>
                            <span className="font-medium">{convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit).toFixed(4)} CBM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">Total:</span>
                            <span className="font-medium">{(convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * results.totalBoxes).toFixed(2)} CBM</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Masukkan Data Barang</h3>
                      <p className="text-gray-500">
                        Isi dimensi dan berat barang untuk menghitung kapasitas kontainer
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Cost Estimation Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Route & Cargo Input */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Rute & Nilai Kargo</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rute Pengiriman</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      disabled={loading}
                    >
                      {loading ? (
                        <option>Loading...</option>
                      ) : (
                        shippingRoutes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.origin_port} → {route.destination_port} ({route.transit_days} days)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Kargo (USD)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={cargoValue}
                      onChange={(e) => setCargoValue(Number(e.target.value))}
                      placeholder="50000"
                    />
                  </div>
                  
                  {/* Route Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Informasi Rute:</h4>
                    {(() => {
                      const route = shippingRoutes.find(r => r.id === selectedRoute);
                      return route ? (
                        <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                          <div><strong>Jarak:</strong> {route.distance_km.toLocaleString()} km</div>
                          <div><strong>Transit:</strong> {route.transit_days} hari</div>
                        </div>
                      ) : (
                        <div className="text-sm text-blue-800">Pilih rute pengiriman...</div>
                      );
                    })()}
                  </div>
                </div>
              </Card>
              
              {/* Cost Breakdown */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Rincian Biaya</h2>
                </div>
                
                {costs && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Sewa Kontainer ({(() => {
                          const container = containerTypes.find(c => c.id === selectedContainerType);
                          return container ? container.name : 'Unknown';
                        })()})</span>
                        <span className="font-medium">${costs.containerRental.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Handling Charges</span>
                        <span className="font-medium">${costs.handling.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Documentation Fee</span>
                        <span className="font-medium">${costs.documentation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Asuransi</span>
                        <span className="font-medium">${costs.insurance.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-green-900">Total Biaya</span>
                        <span className="text-2xl font-bold text-green-900">${costs.total.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-green-700 mt-2">
                        Per CBM: ${results ? (costs.total / (convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * results.totalBoxes)).toFixed(2) : '0'}/CBM
                      </div>
                    </div>
                    
                    {/* Cost per unit calculations */}
                    {results && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <div className="text-sm text-blue-700 mb-1">Biaya per Box</div>
                          <div className="text-lg font-bold text-blue-900">
                            ${(costs.total / results.totalBoxes).toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                          <div className="text-sm text-purple-700 mb-1">ROI Estimate</div>
                          <div className="text-lg font-bold text-purple-900">
                            {((cargoValue - costs.total) / costs.total * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Loading Plan Visualization Tab */}
          <TabsContent value="planning" className="space-y-6">
            {/* Multi-View Container Visualization */}
            <ContainerVisualization 
              containerDimensions={{
                length: (() => {
                  const container = containerTypes.find(c => c.id === selectedContainerType);
                  return container ? container.internal_length : 5.898;
                })(),
                width: (() => {
                  const container = containerTypes.find(c => c.id === selectedContainerType);
                  return container ? container.internal_width : 2.352;
                })(),
                height: (() => {
                  const container = containerTypes.find(c => c.id === selectedContainerType);
                  return container ? container.internal_height : 2.393;
                })()
              }}
              boxDimensions={{
                length: convertToMeters(boxData.length, boxData.unit),
                width: convertToMeters(boxData.width, boxData.unit),
                height: convertToMeters(boxData.height, boxData.unit)
              }}
              arrangement={results ? {
                lengthCount: results.lengthCount,
                widthCount: results.widthCount,
                heightCount: results.heightCount
              } : null}
              containerType={(() => {
                const container = containerTypes.find(c => c.id === selectedContainerType);
                return container ? container.name : 'Unknown Container';
              })()}
              unit={boxData.unit}
              hasValidationErrors={Object.keys(errors).length > 0}
              quantity={boxData.quantity || 1}
            />
            
            {/* Actions and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Actions */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Export & Save</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={exportToPDF}
                    disabled={!results || !costs || exporting}
                    className="h-12"
                  >
                    {exporting ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Export PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportToExcel}
                    disabled={!results || !costs || exporting}
                    className="h-12"
                  >
                    {exporting ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Excel Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={saveCalculation}
                    disabled={!results || !costs || saving}
                    className="h-12 col-span-2"
                  >
                    {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save to Database
                  </Button>
                </div>
              </Card>
              
              {/* Loading Recommendations */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Loading Best Practices</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Muat barang berat di bagian bawah kontainer</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Distribusikan berat secara merata di seluruh lantai</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Sisakan 10cm ruang untuk sirkulasi udara</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Gunakan dunnage/pallet untuk melindungi barang</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Pastikan loading tidak melebihi batas berat maksimal</span>
                  </li>
                  {results && (
                    <li className="flex items-start space-x-2 pt-2 border-t border-gray-200">
                      <Scale className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-blue-900">Current Load: </span>
                        <span className="text-blue-800">{(results.totalWeight/1000).toFixed(1)}t</span>
                        <span className="text-gray-500"> / </span>
                        <span className="text-green-800">{(() => {
                          const container = containerTypes.find(c => c.id === selectedContainerType);
                          return container ? (container.max_payload/1000).toFixed(1) : '0.0';
                        })()}t max</span>
                      </div>
                    </li>
                  )}
                </ul>
              </Card>
            </div>
          </TabsContent>

          {/* CBM & Unit Converter Tab */}
          <TabsContent value="converter" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CBM Calculator */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">CBM Calculator</h2>
                </div>
                
                <div className="space-y-4">
                  {boxData.length > 0 && boxData.width > 0 && boxData.height > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3">Current Calculation:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Dimensi:</span>
                          <span className="font-medium">{boxData.length} × {boxData.width} × {boxData.height} {boxData.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">CBM per unit:</span>
                          <span className="font-medium text-blue-900">{convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit).toFixed(4)} CBM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Berat per CBM:</span>
                          <span className="font-medium">{boxData.weight > 0 ? (convertToKg(boxData.weight, boxData.weightUnit) / convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit)).toFixed(2) : '0'} kg/CBM</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* LCL vs FCL Comparison */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-3">LCL vs FCL Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Container Volume:</span>
                        <span className="font-medium">{(() => {
                          const container = containerTypes.find(c => c.id === selectedContainerType);
                          return container ? (container.internal_length * container.internal_width * container.internal_height).toFixed(2) : '0.00';
                        })()} CBM</span>
                      </div>
                      {results && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-orange-700">Used Volume:</span>
                            <span className="font-medium">{(convertToCBM(boxData.length, boxData.width, boxData.height, boxData.unit) * results.totalBoxes).toFixed(2)} CBM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700">Recommendation:</span>
                            <span className="font-medium text-orange-900">{results.efficiency > 60 ? 'FCL (Full Container)' : 'Consider LCL (Less Container)'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Unit Converter */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Unit Converter</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Length Conversion */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Length Conversion</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Centimeters</div>
                        <div className="font-bold">{boxData.unit === 'cm' ? boxData.length : boxData.unit === 'mm' ? (boxData.length / 10).toFixed(1) : boxData.unit === 'inches' ? (boxData.length * 2.54).toFixed(1) : 0} cm</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Inches</div>
                        <div className="font-bold">{boxData.unit === 'inches' ? boxData.length : boxData.unit === 'cm' ? (boxData.length / 2.54).toFixed(1) : boxData.unit === 'mm' ? (boxData.length / 25.4).toFixed(1) : 0} in</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Meters</div>
                        <div className="font-bold">{convertToMeters(boxData.length, boxData.unit).toFixed(3)} m</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Weight Conversion */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Weight Conversion</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Kilograms</div>
                        <div className="font-bold">{convertToKg(boxData.weight, boxData.weightUnit).toFixed(2)} kg</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Pounds</div>
                        <div className="font-bold">{(convertToKg(boxData.weight, boxData.weightUnit) / 0.453592).toFixed(2)} lbs</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 mb-1">Tons</div>
                        <div className="font-bold">{(convertToKg(boxData.weight, boxData.weightUnit) / 1000).toFixed(3)} t</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Additional Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stacking Calculator */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Stacking Calculator</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stack Strength (kg)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="500"
                    />
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Stacking Recommendations:</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>• Maximum 3 layers untuk barang elektronik</li>
                      <li>• Maximum 5 layers untuk barang tahan banting</li>
                      <li>• Gunakan pallet untuk distribusi berat</li>
                      <li>• Hindari stacking barang berbeda ukuran</li>
                    </ul>
                  </div>
                </div>
              </Card>
              
              {/* Transit Time Estimator */}
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Transit Time Estimator</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-medium text-indigo-900 mb-3">Current Route: {(() => {
                      const route = shippingRoutes.find(r => r.id === selectedRoute);
                      return route ? `${route.origin_port} → ${route.destination_port}` : 'Pilih rute...';
                    })()}</h4>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <div className="flex justify-between">
                        <span>Sea Transit:</span>
                        <span className="font-medium">{(() => {
                          const route = shippingRoutes.find(r => r.id === selectedRoute);
                          return route ? `${route.transit_days} days` : '-';
                        })()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Port Clearance:</span>
                        <span className="font-medium">2-3 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inland Transport:</span>
                        <span className="font-medium">1-2 days</span>
                      </div>
                      <div className="border-t border-indigo-200 pt-2 mt-3 flex justify-between font-semibold">
                        <span>Total Estimate:</span>
                        <span>{(() => {
                          const route = shippingRoutes.find(r => r.id === selectedRoute);
                          return route ? `${route.transit_days + 4}-${route.transit_days + 6} days` : '-';
                        })()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Export & Save Options */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Export & Integration</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col" 
                    onClick={exportToPDF}
                    disabled={!results || !costs || exporting}
                  >
                    {exporting ? <Loader className="w-6 h-6 mb-2 animate-spin" /> : <FileDown className="w-6 h-6 mb-2" />}
                    <span>Export PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={exportToExcel}
                    disabled={!results || !costs || exporting}
                  >
                    {exporting ? <Loader className="w-6 h-6 mb-2 animate-spin" /> : <Download className="w-6 h-6 mb-2" />}
                    <span>Excel Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" disabled>
                    <Mail className="w-6 h-6 mb-2" />
                    <span>Email Quote</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={saveCalculation}
                    disabled={!results || !costs || saving}
                  >
                    {saving ? <Loader className="w-6 h-6 mb-2 animate-spin" /> : <Save className="w-6 h-6 mb-2" />}
                    <span>Save History</span>
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Quick Integration:</h4>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Add to Invoice
                    </Button>
                    <Button size="sm" variant="outline">
                      <Globe className="w-4 h-4 mr-2" />
                      Track Container
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KalkulatorKontainer;