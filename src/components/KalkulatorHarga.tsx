import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Package, MapPin, DollarSign, TrendingUp, FileText, Truck, Shield, Receipt, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CalculatorData {
  // Product Information
  productName: string;
  origin: string;
  portOfLoading: string;
  portOfDestination: string;
  quantity: number;
  unit: 'Kg' | 'Unit' | 'Pcs';
  containerType: '20ft' | '40ft' | '40ft HC' | '45ft';
  
  // Exchange Rate
  buyRate: number;
  sellRate: number;
  
  // Ex Work Costs (per unit)
  manufacturingCost: number;
  packagingCost: number;
  stuffingCostTotal: number; // total amount, will auto-divide by quantity
  lcPaymentCost: number;
  ttPaymentCost: number;
  documentationCost: number;
  truckingCost: number;
  exportPermitCost: number;
  taxPph: number;
  ppn: number;
  
  // FOB Additional Costs
  forwarderFees: number;
  
  // CFR Additional Costs
  oceanFreightTotal: number; // total amount, will auto-divide by quantity
  
  // Insurance percentage (0.5% default)
  insurancePercentage: number;
}

interface ValidationErrors {
  quantity?: string;
  manufacturingCost?: string;
  packagingCost?: string;
  stuffingCostTotal?: string;
  lcPaymentCost?: string;
  ttPaymentCost?: string;
  documentationCost?: string;
  truckingCost?: string;
  exportPermitCost?: string;
  taxPph?: string;
  ppn?: string;
  forwarderFees?: string;
  oceanFreightTotal?: string;
  insurancePercentage?: string;
}

interface CalculationResults {
  exWork: {
    total: number;
    perUnit: number;
  };
  fob: {
    total: number;
    perUnit: number;
  };
  cfr: {
    total: number;
    perUnit: number;
  };
  cif: {
    total: number;
    perUnit: number;
  };
}

export const KalkulatorHarga: React.FC = () => {
  const [data, setData] = useState<CalculatorData>({
    productName: '',
    origin: '',
    portOfLoading: '',
    portOfDestination: '',
    quantity: 0,
    unit: 'Kg',
    containerType: '20ft',
    buyRate: 0,
    sellRate: 0,
    manufacturingCost: 0,
    packagingCost: 0,
    stuffingCostTotal: 0,
    lcPaymentCost: 0,
    ttPaymentCost: 0,
    documentationCost: 0,
    truckingCost: 0,
    exportPermitCost: 0,
    taxPph: 0,
    ppn: 0,
    forwarderFees: 0,
    oceanFreightTotal: 0,
    insurancePercentage: 0.5
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [results, setResults] = useState<CalculationResults>({
    exWork: { total: 0, perUnit: 0 },
    fob: { total: 0, perUnit: 0 },
    cfr: { total: 0, perUnit: 0 },
    cif: { total: 0, perUnit: 0 }
  });

  // Calculate results whenever data changes
  useEffect(() => {
    validateInputs();
    calculatePrices();
  }, [data]);

  const validateInputs = () => {
    const newErrors: ValidationErrors = {};
    
    // Quantity must be positive
    if (data.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    // Cost fields must be non-negative
    if (data.manufacturingCost < 0) {
      newErrors.manufacturingCost = 'Manufacturing cost cannot be negative';
    }
    if (data.packagingCost < 0) {
      newErrors.packagingCost = 'Packaging cost cannot be negative';
    }
    if (data.stuffingCostTotal < 0) {
      newErrors.stuffingCostTotal = 'Stuffing cost cannot be negative';
    }
    if (data.lcPaymentCost < 0) {
      newErrors.lcPaymentCost = 'LC payment cost cannot be negative';
    }
    if (data.ttPaymentCost < 0) {
      newErrors.ttPaymentCost = 'TT payment cost cannot be negative';
    }
    if (data.documentationCost < 0) {
      newErrors.documentationCost = 'Documentation cost cannot be negative';
    }
    if (data.truckingCost < 0) {
      newErrors.truckingCost = 'Trucking cost cannot be negative';
    }
    if (data.exportPermitCost < 0) {
      newErrors.exportPermitCost = 'Export permit cost cannot be negative';
    }
    if (data.taxPph < 0) {
      newErrors.taxPph = 'Tax PPh cannot be negative';
    }
    if (data.ppn < 0) {
      newErrors.ppn = 'PPN cannot be negative';
    }
    if (data.forwarderFees < 0) {
      newErrors.forwarderFees = 'Forwarder fees cannot be negative';
    }
    if (data.oceanFreightTotal < 0) {
      newErrors.oceanFreightTotal = 'Ocean freight cannot be negative';
    }
    if (data.insurancePercentage < 0) {
      newErrors.insurancePercentage = 'Insurance percentage cannot be negative';
    }
    
    setErrors(newErrors);
  };

  const calculatePrices = () => {
    // Don't calculate if there are validation errors or quantity is invalid
    if (data.quantity <= 0 || Object.keys(errors).length > 0) {
      setResults({
        exWork: { total: 0, perUnit: 0 },
        fob: { total: 0, perUnit: 0 },
        cfr: { total: 0, perUnit: 0 },
        cif: { total: 0, perUnit: 0 }
      });
      return;
    }

    // Calculate stuffing cost per unit
    const stuffingCostPerUnit = data.stuffingCostTotal / data.quantity;
    
    // Calculate ocean freight per unit
    const oceanFreightPerUnit = data.oceanFreightTotal / data.quantity;

    // Ex Work calculation (per unit)
    const exWorkPerUnit = (
      data.manufacturingCost +
      data.packagingCost +
      stuffingCostPerUnit +
      data.lcPaymentCost +
      data.ttPaymentCost +
      data.documentationCost +
      data.truckingCost +
      data.exportPermitCost +
      data.taxPph +
      data.ppn
    );
    
    const exWorkTotal = exWorkPerUnit * data.quantity;

    // FOB calculation
    const fobTotal = exWorkTotal + data.forwarderFees;
    const fobPerUnit = fobTotal / data.quantity;

    // CFR calculation
    const cfrTotal = fobTotal + data.oceanFreightTotal;
    const cfrPerUnit = cfrTotal / data.quantity;

    // CIF calculation (insurance is 0.5% of CFR value)
    const insuranceAmount = cfrTotal * (data.insurancePercentage / 100);
    const cifTotal = cfrTotal + insuranceAmount;
    const cifPerUnit = cifTotal / data.quantity;

    setResults({
      exWork: { total: exWorkTotal, perUnit: exWorkPerUnit },
      fob: { total: fobTotal, perUnit: fobPerUnit },
      cfr: { total: cfrTotal, perUnit: cfrPerUnit },
      cif: { total: cifTotal, perUnit: cifPerUnit }
    });
  };

  const updateData = (field: keyof CalculatorData, value: any) => {
    // Ensure numeric fields are non-negative (except for initial input)
    if (typeof value === 'number' && field !== 'quantity') {
      // Allow temporary negative values for validation to catch them
      setData(prev => ({ ...prev, [field]: value }));
    } else if (field === 'quantity' && typeof value === 'number') {
      // Allow temporary non-positive values for validation to catch them
      setData(prev => ({ ...prev, [field]: value }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyPerUnit = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-3 rounded-xl">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kalkulator Harga</h1>
              <p className="text-gray-600">Export Price Calculator with Input Validation</p>
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
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">Input Validation Errors</h3>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please correct the highlighted fields below to see accurate calculations.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Forms - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.productName}
                    onChange={(e) => updateData('productName', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin/Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.origin}
                    onChange={(e) => updateData('origin', e.target.value)}
                    placeholder="Enter origin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port of Loading
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.portOfLoading}
                    onChange={(e) => updateData('portOfLoading', e.target.value)}
                    placeholder="Enter port of loading"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port of Destination
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.portOfDestination}
                    onChange={(e) => updateData('portOfDestination', e.target.value)}
                    placeholder="Enter port of destination"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        value={data.quantity}
                        onChange={(e) => updateData('quantity', Number(e.target.value))}
                        placeholder="0"
                      />
                      {errors.quantity && (
                        <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>
                      )}
                    </div>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={data.unit}
                      onChange={(e) => updateData('unit', e.target.value as 'Kg' | 'Unit' | 'Pcs')}
                    >
                      <option value="Kg">Kg</option>
                      <option value="Unit">Unit</option>
                      <option value="Pcs">Pcs</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.containerType}
                    onChange={(e) => updateData('containerType', e.target.value as '20ft' | '40ft' | '40ft HC' | '45ft')}
                  >
                    <option value="20ft">20ft</option>
                    <option value="40ft">40ft</option>
                    <option value="40ft HC">40ft HC</option>
                    <option value="45ft">45ft</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Exchange Rate */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Exchange Rate</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buy Rate (Kurs Beli)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.buyRate}
                    onChange={(e) => updateData('buyRate', Number(e.target.value))}
                    placeholder="15000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sell Rate (Kurs Jual)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={data.sellRate}
                    onChange={(e) => updateData('sellRate', Number(e.target.value))}
                    placeholder="16000"
                  />
                </div>
              </div>
            </Card>

            {/* Ex Work Costs */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Ex Work Costs</h2>
                <span className="text-sm text-gray-500">(per unit unless specified)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturing Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.manufacturingCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.manufacturingCost}
                    onChange={(e) => updateData('manufacturingCost', Number(e.target.value))}
                    placeholder="98000"
                  />
                  {errors.manufacturingCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.manufacturingCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Packaging Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.packagingCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.packagingCost}
                    onChange={(e) => updateData('packagingCost', Number(e.target.value))}
                    placeholder="200"
                  />
                  {errors.packagingCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.packagingCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stuffing Cost (total amount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.stuffingCostTotal ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.stuffingCostTotal}
                    onChange={(e) => updateData('stuffingCostTotal', Number(e.target.value))}
                    placeholder="2000000"
                  />
                  {errors.stuffingCostTotal && (
                    <p className="text-xs text-red-600 mt-1">{errors.stuffingCostTotal}</p>
                  )}
                  {data.quantity > 0 && !errors.stuffingCostTotal && (
                    <p className="text-xs text-gray-500 mt-1">
                      Per unit: {formatCurrencyPerUnit(data.stuffingCostTotal / data.quantity)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LC Payment Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lcPaymentCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.lcPaymentCost}
                    onChange={(e) => updateData('lcPaymentCost', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.lcPaymentCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.lcPaymentCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TT Payment Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ttPaymentCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.ttPaymentCost}
                    onChange={(e) => updateData('ttPaymentCost', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.ttPaymentCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.ttPaymentCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documentation Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.documentationCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.documentationCost}
                    onChange={(e) => updateData('documentationCost', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.documentationCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.documentationCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trucking to Port (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.truckingCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.truckingCost}
                    onChange={(e) => updateData('truckingCost', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.truckingCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.truckingCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Permit Cost (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.exportPermitCost ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.exportPermitCost}
                    onChange={(e) => updateData('exportPermitCost', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.exportPermitCost && (
                    <p className="text-xs text-red-600 mt-1">{errors.exportPermitCost}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax PPh (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.taxPph ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.taxPph}
                    onChange={(e) => updateData('taxPph', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.taxPph && (
                    <p className="text-xs text-red-600 mt-1">{errors.taxPph}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PPN (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ppn ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.ppn}
                    onChange={(e) => updateData('ppn', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.ppn && (
                    <p className="text-xs text-red-600 mt-1">{errors.ppn}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Additional Costs */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Additional Costs</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forwarder Fees (total)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.forwarderFees ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.forwarderFees}
                    onChange={(e) => updateData('forwarderFees', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.forwarderFees && (
                    <p className="text-xs text-red-600 mt-1">{errors.forwarderFees}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ocean/Air Freight (total)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.oceanFreightTotal ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.oceanFreightTotal}
                    onChange={(e) => updateData('oceanFreightTotal', Number(e.target.value))}
                    placeholder="0"
                  />
                  {errors.oceanFreightTotal && (
                    <p className="text-xs text-red-600 mt-1">{errors.oceanFreightTotal}</p>
                  )}
                  {data.quantity > 0 && !errors.oceanFreightTotal && (
                    <p className="text-xs text-gray-500 mt-1">
                      Per unit: {formatCurrencyPerUnit(data.oceanFreightTotal / data.quantity)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.insurancePercentage ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={data.insurancePercentage}
                    onChange={(e) => updateData('insurancePercentage', Number(e.target.value))}
                    placeholder="0.5"
                  />
                  {errors.insurancePercentage && (
                    <p className="text-xs text-red-600 mt-1">{errors.insurancePercentage}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 0.5% of CFR value
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Results - Right Side */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-indigo-500 p-2 rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Calculation Results</h2>
              </div>
              
              {hasValidationErrors && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Results hidden due to validation errors. Please fix the errors to see calculations.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Ex Work */}
                <motion.div 
                  className={`rounded-lg p-4 border ${
                    hasValidationErrors 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className={`font-semibold mb-2 ${
                    hasValidationErrors ? 'text-gray-600' : 'text-blue-900'
                  }`}>Ex Work</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-blue-700'
                      }`}>Total:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-blue-900'
                      }`}>{formatCurrency(results.exWork.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-blue-700'
                      }`}>Per {data.unit}:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-blue-900'
                      }`}>{formatCurrencyPerUnit(results.exWork.perUnit)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* FOB */}
                <motion.div 
                  className={`rounded-lg p-4 border ${
                    hasValidationErrors 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className={`font-semibold mb-2 ${
                    hasValidationErrors ? 'text-gray-600' : 'text-green-900'
                  }`}>FOB</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-green-700'
                      }`}>Total:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-green-900'
                      }`}>{formatCurrency(results.fob.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-green-700'
                      }`}>Per {data.unit}:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-green-900'
                      }`}>{formatCurrencyPerUnit(results.fob.perUnit)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* CFR */}
                <motion.div 
                  className={`rounded-lg p-4 border ${
                    hasValidationErrors 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className={`font-semibold mb-2 ${
                    hasValidationErrors ? 'text-gray-600' : 'text-orange-900'
                  }`}>CFR</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-orange-700'
                      }`}>Total:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-orange-900'
                      }`}>{formatCurrency(results.cfr.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-orange-700'
                      }`}>Per {data.unit}:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-orange-900'
                      }`}>{formatCurrencyPerUnit(results.cfr.perUnit)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* CIF */}
                <motion.div 
                  className={`rounded-lg p-4 border ${
                    hasValidationErrors 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-purple-50 border-purple-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className={`font-semibold mb-2 ${
                    hasValidationErrors ? 'text-gray-600' : 'text-purple-900'
                  }`}>CIF</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-purple-700'
                      }`}>Total:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-purple-900'
                      }`}>{formatCurrency(results.cif.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${
                        hasValidationErrors ? 'text-gray-500' : 'text-purple-700'
                      }`}>Per {data.unit}:</span>
                      <span className={`font-medium ${
                        hasValidationErrors ? 'text-gray-600' : 'text-purple-900'
                      }`}>{formatCurrencyPerUnit(results.cif.perUnit)}</span>
                    </div>
                    {!hasValidationErrors && (
                      <div className="flex justify-between mt-2 pt-2 border-t border-purple-200">
                        <span className="text-xs text-purple-600">Insurance ({data.insurancePercentage}%):</span>
                        <span className="text-xs font-medium text-purple-800">
                          {formatCurrency(results.cfr.total * (data.insurancePercentage / 100))}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Summary */}
                {data.quantity > 0 && (
                  <motion.div 
                    className={`rounded-lg p-4 border mt-6 ${
                      hasValidationErrors 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product:</span>
                        <span className="font-medium text-gray-900">{data.productName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{data.quantity.toLocaleString()} {data.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Container:</span>
                        <span className="font-medium text-gray-900">{data.containerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          hasValidationErrors ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {hasValidationErrors ? 'Validation Errors' : 'Valid Calculation'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KalkulatorHarga;