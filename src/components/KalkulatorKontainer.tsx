import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Package, Ruler, Calculator, BarChart3, CheckCircle, AlertTriangle, Maximize, Eye, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Container3ViewVisualization from '@/components/Container3ViewVisualization';

interface ContainerSpecs {
  name: string;
  length: number; // in meters
  width: number;
  height: number;
}

interface BoxDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'mm' | 'inches';
}

interface CalculatorData {
  boxDimensions: BoxDimensions;
  containerType: string;
  customContainer?: ContainerSpecs;
  isManualBoxQuantity?: boolean;
  manualBoxQuantity?: number;
}

interface ArrangementResult {
  lengthCount: number;
  widthCount: number;
  heightCount: number;
  totalBoxes: number;
  efficiency: number;
  remainingSpace: {
    length: number;
    width: number;
    height: number;
  };
}

interface ValidationErrors {
  boxLength?: string;
  boxWidth?: string;
  boxHeight?: string;
  customLength?: string;
  customWidth?: string;
  customHeight?: string;
  manualBoxQuantity?: string;
}

const STANDARD_CONTAINERS: Record<string, ContainerSpecs> = {
  '20ft': { name: '20ft Standard', length: 5.898, width: 2.352, height: 2.393 },
  '40ft': { name: '40ft Standard', length: 12.032, width: 2.352, height: 2.393 },
  '40ft-hc': { name: '40ft High Cube', length: 12.032, width: 2.352, height: 2.698 },
  '45ft-hc': { name: '45ft High Cube', length: 13.556, width: 2.352, height: 2.698 },
  'custom': { name: 'Custom Container', length: 0, width: 0, height: 0 }
};

export const KalkulatorKontainer: React.FC = () => {
  const [data, setData] = useState<CalculatorData>({
    boxDimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    },
    containerType: '20ft',
    customContainer: undefined,
    isManualBoxQuantity: false,
    manualBoxQuantity: 0
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [results, setResults] = useState<ArrangementResult[]>([]);
  const [bestArrangement, setBestArrangement] = useState<ArrangementResult | null>(null);

  // Convert dimensions to meters for calculation
  const convertToMeters = (value: number, unit: 'cm' | 'mm' | 'inches'): number => {
    switch (unit) {
      case 'cm': return value / 100;
      case 'mm': return value / 1000;
      case 'inches': return value * 0.0254;
      default: return value;
    }
  };

  const convertFromMeters = (value: number, unit: 'cm' | 'mm' | 'inches'): number => {
    switch (unit) {
      case 'cm': return value * 100;
      case 'mm': return value * 1000;
      case 'inches': return value / 0.0254;
      default: return value;
    }
  };

  // Calculate all possible arrangements
  const calculateArrangements = (): ArrangementResult[] => {
    const boxL = convertToMeters(data.boxDimensions.length, data.boxDimensions.unit);
    const boxW = convertToMeters(data.boxDimensions.width, data.boxDimensions.unit);
    const boxH = convertToMeters(data.boxDimensions.height, data.boxDimensions.unit);
    
    // Only proceed if all box dimensions are positive
    if (boxL <= 0 || boxW <= 0 || boxH <= 0) return [];
    
    const container = data.containerType === 'custom' && data.customContainer
      ? data.customContainer
      : STANDARD_CONTAINERS[data.containerType];
    
    if (!container || container.length <= 0 || container.width <= 0 || container.height <= 0) {
      return [];
    }
    
    // Try all 6 possible box orientations
    const boxOrientations = [
      [boxL, boxW, boxH], // LWH
      [boxL, boxH, boxW], // LHW
      [boxW, boxL, boxH], // WLH
      [boxW, boxH, boxL], // WHL
      [boxH, boxL, boxW], // HLW
      [boxH, boxW, boxL]  // HWL
    ];
    
    const arrangements: ArrangementResult[] = [];
    
    boxOrientations.forEach(([l, w, h]) => {
      const lengthCount = Math.floor(container.length / l);
      const widthCount = Math.floor(container.width / w);
      const heightCount = Math.floor(container.height / h);
      
      if (lengthCount > 0 && widthCount > 0 && heightCount > 0) {
        const totalBoxes = lengthCount * widthCount * heightCount;
        const usedVolume = totalBoxes * (l * w * h);
        const containerVolume = container.length * container.width * container.height;
        const efficiency = (usedVolume / containerVolume) * 100;
        
        arrangements.push({
          lengthCount,
          widthCount,
          heightCount,
          totalBoxes,
          efficiency,
          remainingSpace: {
            length: container.length - (lengthCount * l),
            width: container.width - (widthCount * w),
            height: container.height - (heightCount * h)
          }
        });
      }
    });
    
    // Sort by total boxes (descending), then by efficiency (descending)
    return arrangements.sort((a, b) => {
      if (b.totalBoxes !== a.totalBoxes) {
        return b.totalBoxes - a.totalBoxes;
      }
      return b.efficiency - a.efficiency;
    });
  };

  // Validate inputs
  const validateInputs = () => {
    const newErrors: ValidationErrors = {};
    
    if (data.boxDimensions.length <= 0) {
      newErrors.boxLength = 'Box length must be greater than 0';
    }
    if (data.boxDimensions.width <= 0) {
      newErrors.boxWidth = 'Box width must be greater than 0';
    }
    if (data.boxDimensions.height <= 0) {
      newErrors.boxHeight = 'Box height must be greater than 0';
    }
    
    // Validate manual box quantity if enabled
    if (data.isManualBoxQuantity) {
      if (!data.manualBoxQuantity || data.manualBoxQuantity <= 0) {
        newErrors.manualBoxQuantity = 'Manual box quantity must be greater than 0';
      } else if (bestArrangement && data.manualBoxQuantity > bestArrangement.totalBoxes) {
        newErrors.manualBoxQuantity = `Quantity exceeds container capacity (max: ${bestArrangement.totalBoxes})`;
      }
    }
    
    if (data.containerType === 'custom') {
      if (!data.customContainer?.length || data.customContainer.length <= 0) {
        newErrors.customLength = 'Container length must be greater than 0';
      }
      if (!data.customContainer?.width || data.customContainer.width <= 0) {
        newErrors.customWidth = 'Container width must be greater than 0';
      }
      if (!data.customContainer?.height || data.customContainer.height <= 0) {
        newErrors.customHeight = 'Container height must be greater than 0';
      }
    }
    
    setErrors(newErrors);
  };

  // Update calculations when data changes
  useEffect(() => {
    validateInputs();
    // Always try to calculate arrangements, regardless of validation errors
    // The calculateArrangements function will handle its own validation
    const arrangements = calculateArrangements();
    setResults(arrangements);
    setBestArrangement(arrangements[0] || null);
  }, [data]);

  // Reset all data to default state
  const resetCalculator = () => {
    setData({
      boxDimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm'
      },
      containerType: '20ft',
      customContainer: undefined,
      isManualBoxQuantity: false,
      manualBoxQuantity: 0
    });
    setErrors({});
    setResults([]);
    setBestArrangement(null);
  };

  const updateBoxDimension = (field: keyof BoxDimensions, value: any) => {
    setData(prev => ({
      ...prev,
      boxDimensions: {
        ...prev.boxDimensions,
        [field]: value
      }
    }));
  };

  const updateCustomContainer = (field: keyof ContainerSpecs, value: number) => {
    setData(prev => ({
      ...prev,
      customContainer: {
        ...prev.customContainer,
        name: 'Custom Container',
        [field]: value
      }
    }));
  };

  const updateManualBoxQuantity = (enabled: boolean, quantity?: number) => {
    setData(prev => ({
      ...prev,
      isManualBoxQuantity: enabled,
      manualBoxQuantity: quantity ?? prev.manualBoxQuantity
    }));
  };

  const formatDimension = (value: number, unit: string = 'm') => {
    return `${value.toFixed(2)}${unit}`;
  };

  const formatArrangement = (arrangement: ArrangementResult) => {
    return `${arrangement.lengthCount}L × ${arrangement.widthCount}W × ${arrangement.heightCount}H`;
  };

  // Get effective box quantity (manual or calculated)
  const getEffectiveBoxQuantity = () => {
    if (data.isManualBoxQuantity && data.manualBoxQuantity && data.manualBoxQuantity > 0) {
      return data.manualBoxQuantity;
    }
    return bestArrangement ? bestArrangement.totalBoxes : 0;
  };

  // Get display label for box quantity source
  const getBoxQuantityLabel = () => {
    if (data.isManualBoxQuantity && data.manualBoxQuantity && data.manualBoxQuantity > 0) {
      return 'Manual Input';
    }
    return 'Auto Calculated';
  };

  const hasValidationErrors = Object.keys(errors).length > 0;
  const isCustomContainer = data.containerType === 'custom';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Container className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kalkulator Kontainer</h1>
              <p className="text-gray-600">Container Loading Calculator for Logistics Planning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Validation Alert */}
        {hasValidationErrors && (
          <motion.div 
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">Input Validation Errors</h3>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please correct the highlighted fields below to see accurate calculations.
            </p>
          </motion.div>
        )}

        {/* 3-View Visualization - Always Visible */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">3-View Container Analysis</h2>
                  <div className="text-sm text-gray-500">Professional technical drawing with Top, Front, and Side views</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCalculator}
                className="flex items-center space-x-2 hover:bg-gray-50"
                title="Reset Calculator"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            </div>
            
            <Container3ViewVisualization 
              containerDimensions={{
                length: data.containerType === 'custom' && data.customContainer
                  ? data.customContainer.length
                  : STANDARD_CONTAINERS[data.containerType].length,
                width: data.containerType === 'custom' && data.customContainer
                  ? data.customContainer.width
                  : STANDARD_CONTAINERS[data.containerType].width,
                height: data.containerType === 'custom' && data.customContainer
                  ? data.customContainer.height
                  : STANDARD_CONTAINERS[data.containerType].height
              }}
              boxDimensions={{
                length: convertToMeters(data.boxDimensions.length, data.boxDimensions.unit),
                width: convertToMeters(data.boxDimensions.width, data.boxDimensions.unit),
                height: convertToMeters(data.boxDimensions.height, data.boxDimensions.unit)
              }}
              arrangement={bestArrangement ? {
                lengthCount: bestArrangement.lengthCount,
                widthCount: bestArrangement.widthCount,
                heightCount: bestArrangement.heightCount
              } : null}
              containerType={data.containerType}
              unit={data.boxDimensions.unit}
              hasValidationErrors={hasValidationErrors}
            />
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Forms - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Box Dimensions */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Box/Carton Dimensions</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.boxLength ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.boxDimensions.length}
                    onChange={(e) => updateBoxDimension('length', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.boxLength && (
                    <p className="text-xs text-red-600 mt-1">{errors.boxLength}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.boxWidth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.boxDimensions.width}
                    onChange={(e) => updateBoxDimension('width', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.boxWidth && (
                    <p className="text-xs text-red-600 mt-1">{errors.boxWidth}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.boxHeight ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.boxDimensions.height}
                    onChange={(e) => updateBoxDimension('height', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.boxHeight && (
                    <p className="text-xs text-red-600 mt-1">{errors.boxHeight}</p>
                  )}
                </div>
              </div>
              
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={data.boxDimensions.unit}
                  onChange={(e) => updateBoxDimension('unit', e.target.value as 'cm' | 'mm' | 'inches')}
                >
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="inches">Inches</option>
                </select>
              </div>

              {/* Manual Box Quantity Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="manualBoxQuantity"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    checked={data.isManualBoxQuantity || false}
                    onChange={(e) => updateManualBoxQuantity(e.target.checked, data.manualBoxQuantity)}
                  />
                  <label htmlFor="manualBoxQuantity" className="text-sm font-medium text-gray-700">
                    Input jumlah box manual (opsional)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Jika tidak dicentang, jumlah box akan otomatis terhitung berdasarkan kapasitas maksimum container.
                </p>
                
                {data.isManualBoxQuantity && (
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Box *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.manualBoxQuantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      value={data.manualBoxQuantity || ''}
                      onChange={(e) => updateManualBoxQuantity(true, Number(e.target.value))}
                      placeholder="Masukkan jumlah box"
                    />
                    {errors.manualBoxQuantity && (
                      <p className="text-xs text-red-600 mt-1">{errors.manualBoxQuantity}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Container Selection */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Container className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Container Specifications</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.containerType}
                    onChange={(e) => setData(prev => ({ ...prev, containerType: e.target.value }))}
                  >
                    {Object.entries(STANDARD_CONTAINERS).map(([key, container]) => (
                      <option key={key} value={key}>
                        {container.name}
                        {key !== 'custom' && ` (${formatDimension(container.length)}L × ${formatDimension(container.width)}W × ${formatDimension(container.height)}H)`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {isCustomContainer && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Length (meters) *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.customLength ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        value={data.customContainer?.length || 0}
                        onChange={(e) => updateCustomContainer('length', Number(e.target.value))}
                        placeholder="0"
                      />
                      {errors.customLength && (
                        <p className="text-xs text-red-600 mt-1">{errors.customLength}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (meters) *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.customWidth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        value={data.customContainer?.width || 0}
                        onChange={(e) => updateCustomContainer('width', Number(e.target.value))}
                        placeholder="0"
                      />
                      {errors.customWidth && (
                        <p className="text-xs text-red-600 mt-1">{errors.customWidth}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (meters) *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.customHeight ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        value={data.customContainer?.height || 0}
                        onChange={(e) => updateCustomContainer('height', Number(e.target.value))}
                        placeholder="0"
                      />
                      {errors.customHeight && (
                        <p className="text-xs text-red-600 mt-1">{errors.customHeight}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Container Info Display */}
              {!isCustomContainer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Internal Dimensions:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
                    <div>
                      <span className="font-medium">Length:</span> {formatDimension(STANDARD_CONTAINERS[data.containerType].length)}
                    </div>
                    <div>
                      <span className="font-medium">Width:</span> {formatDimension(STANDARD_CONTAINERS[data.containerType].width)}
                    </div>
                    <div>
                      <span className="font-medium">Height:</span> {formatDimension(STANDARD_CONTAINERS[data.containerType].height)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Results - Right Side */}
          <div className="space-y-6">
            {/* Main Results */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Calculation Results</h2>
              </div>
              
              {bestArrangement && !hasValidationErrors ? (
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
                        {data.isManualBoxQuantity ? 'Jumlah Box (Manual)' : 'Kapasitas Maksimum'}
                      </h3>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {getEffectiveBoxQuantity().toLocaleString()} boxes
                    </div>
                    <div className="text-sm text-green-700">
                      {data.isManualBoxQuantity 
                        ? `Mode: ${getBoxQuantityLabel()}` 
                        : `Optimal arrangement: ${formatArrangement(bestArrangement)}`}
                    </div>
                    {data.isManualBoxQuantity && bestArrangement && (
                      <div className="text-xs text-green-600 mt-1">
                        Max capacity: {bestArrangement.totalBoxes.toLocaleString()} boxes
                      </div>
                    )}
                  </div>
                  
                  {/* Efficiency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-700 mb-1">Loading Efficiency</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {bestArrangement.efficiency.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-700 mb-1">Space Utilization</div>
                      <div className="text-lg font-bold text-purple-900">
                        {bestArrangement.efficiency > 85 ? 'Excellent' :
                         bestArrangement.efficiency > 70 ? 'Good' :
                         bestArrangement.efficiency > 50 ? 'Fair' : 'Poor'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Remaining Space */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Remaining Space</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Length:</span>
                        <div className="font-medium">
                          {formatDimension(bestArrangement.remainingSpace.length)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Width:</span>
                        <div className="font-medium">
                          {formatDimension(bestArrangement.remainingSpace.width)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Height:</span>
                        <div className="font-medium">
                          {formatDimension(bestArrangement.remainingSpace.height)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alternative Arrangements */}
                  {results.length > 1 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-3">Alternative Arrangements</h4>
                      <div className="space-y-2">
                        {results.slice(1, 4).map((arrangement, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-orange-800">
                              {formatArrangement(arrangement)}
                            </span>
                            <span className="font-medium text-orange-900">
                              {arrangement.totalBoxes} boxes ({arrangement.efficiency.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Enter Box Dimensions</h3>
                  <p className="text-gray-500">
                    {hasValidationErrors 
                      ? 'Please correct the validation errors above'
                      : 'Fill in the box dimensions and container type to calculate loading capacity'}
                  </p>
                </div>
              )}
            </Card>
            
            {/* Summary */}
            {bestArrangement && !hasValidationErrors && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-indigo-500 p-2 rounded-lg">
                    <Ruler className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Summary</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Box Size:</span>
                    <span className="font-medium text-gray-900">
                      {data.boxDimensions.length} × {data.boxDimensions.width} × {data.boxDimensions.height} {data.boxDimensions.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Container:</span>
                    <span className="font-medium text-gray-900">
                      {STANDARD_CONTAINERS[data.containerType].name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {data.isManualBoxQuantity ? 'Total Boxes:' : 'Max Boxes:'}
                    </span>
                    <span className="font-medium text-green-600">
                      {getEffectiveBoxQuantity().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className={`font-medium ${
                      bestArrangement.efficiency > 85 ? 'text-green-600' :
                      bestArrangement.efficiency > 70 ? 'text-blue-600' :
                      bestArrangement.efficiency > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {bestArrangement.efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KalkulatorKontainer;