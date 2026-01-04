import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Download, Filter, BarChart3, PieChart, Calendar, Clock, FileText, ChevronDown, ChevronUp, Info, Search, RefreshCw } from 'lucide-react';
import { FormModal } from './FormModal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { keuanganEksporService, lcService, type LetterOfCredit } from '../lib/supabase';
// Buat interface custom untuk KeuanganEkspor yang digunakan di file ini
interface KeuanganEkspor {
  id: string;
  description: string;
  category: 'operasional' | 'marketing' | 'logistik' | 'administrasi' | 'lainnya';
  period: string;
  budget: number;
  realisasi: number;
  budget_usd?: number;
  realisasi_usd?: number;
  exchange_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
import { useDataChangeNotification } from '../contexts/DataSyncContext';
import ExcelExportButton from './ExcelExportButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Direct imports are used instead of lazy loading to fix build errors
// const LazyBar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
// const LazyPie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
// const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Chart loading fallback component
const ChartSkeleton = () => (
  <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse flex items-center justify-center border border-gray-200">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Memuat grafik...</p>
    </div>
  </div>
);

// Loading skeleton for cards
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="bg-gray-200 w-12 h-12 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

// Optimized table row component
const TableRow = React.memo(({ item, index, onEdit, onDelete, selectedCurrency, formatCurrency, getCategoryConfig }: any) => (
  <motion.tr 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="hover:bg-gray-50/50 transition-all duration-200 group"
  >
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      {item.description}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
        getCategoryConfig(item.category).bgColor
      } ${
        getCategoryConfig(item.category).textColor
      }`}>
        {getCategoryConfig(item.category).label}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
      {item.period}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
      {formatCurrency(item.budget, selectedCurrency)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
      {formatCurrency(item.realisasi, selectedCurrency)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
      <span className={item.budget - item.realisasi >= 0 ? 'text-green-600' : 'text-red-600'}>
        {formatCurrency(item.budget - item.realisasi, selectedCurrency)}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => onEdit(item)}
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-all duration-200"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </td>
  </motion.tr>
));

type TabType = 'budget-planning' | 'cashflow-tracking' | 'analysis';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  isBase?: boolean;
}

// Currency Configuration
const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', isBase: true },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' }
];

const BASE_CURRENCY = 'IDR';

interface KeuanganEksporProps {}

const KeuanganEkspor: React.FC<KeuanganEksporProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('budget-planning');
  const [keuanganData, setKeuanganData] = useState<KeuanganEkspor[]>([]);
  const [lcData, setLcData] = useState<LetterOfCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(BASE_CURRENCY);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedItem, setSelectedItem] = useState<KeuanganEkspor | null>(null);
  const [formData, setFormData] = useState<any>({
    description: '',
    category: 'operasional',
    period: '',
    budget: 0,
    realisasi: 0,
    notes: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Hooks
  const { notifyKeuanganChange } = useDataChangeNotification();

  // Category configuration with modern styling
  const categoryConfig = useMemo(() => ({
    'operasional': {
      label: 'Operasional',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    'marketing': {
      label: 'Marketing',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    'logistik': {
      label: 'Logistik',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    'administrasi': {
      label: 'Administrasi',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    'lainnya': {
      label: 'Lainnya',
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200'
    }
  }), []);

  const getCategoryConfig = useCallback((category: string) => {
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.lainnya;
  }, [categoryConfig]);

  // Format currency function with proper formatting
  const formatCurrency = useCallback((amount: number, currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    const formattedAmount = amount.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${currency?.symbol}${formattedAmount}`;
  }, []);

  // Load data with error handling
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Loading keuangan ekspor data...');
      
      const [keuanganResult, lcResult] = await Promise.all([
        keuanganEksporService.getAllKeuanganItems(),
        lcService.getAllLCs()
      ]);

      // Konversi data ke format KeuanganEkspor yang digunakan di file ini
      const mappedKeuanganData = keuanganResult.map(item => ({
        id: item.id,
        description: item.description || '',
        category: item.category,
        period: `${item.year}-${String(item.month).padStart(2, '0')}`,
        budget: item.type === 'BUDGET' ? item.amount : 0,
        realisasi: item.type === 'REALISASI' ? item.amount : 0,
        budget_usd: item.type === 'BUDGET' ? item.original_amount : 0,
        realisasi_usd: item.type === 'REALISASI' ? item.original_amount : 0,
        exchange_rate: item.exchange_rate,
        notes: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setKeuanganData(mappedKeuanganData);
      setLcData(lcResult);
      console.log(`✅ Loaded ${keuanganResult.length} keuangan records and ${lcResult.length} LC records`);
    } catch (error) {
      console.error('❌ Error loading keuangan ekspor data:', error);
      // Set demo data on error
      setDemoData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Set demo data for fallback
  const setDemoData = useCallback(() => {
    const demoKeuanganData: KeuanganEkspor[] = [
      {
        id: '1',
        description: 'Export Preparation Cost',
        category: 'operasional',
        period: '2025-01',
        budget: 500000000,
        realisasi: 450000000,
        budget_usd: 33333,
        realisasi_usd: 30000,
        exchange_rate: 15000,
        notes: 'Monthly operational budget',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '2',
        description: 'Marketing & Promotion',
        category: 'marketing',
        period: '2025-01',
        budget: 300000000,
        realisasi: 280000000,
        budget_usd: 20000,
        realisasi_usd: 18667,
        exchange_rate: 15000,
        notes: 'Marketing campaign for new markets',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z'
      }
    ];
    setKeuanganData(demoKeuanganData);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Filtered data with performance optimization
  const filteredData = useMemo(() => {
    return keuanganData.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           getCategoryConfig(item.category).label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesPeriod = filterPeriod === 'all' || item.period === filterPeriod;
      
      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [keuanganData, searchQuery, filterCategory, filterPeriod, getCategoryConfig]);

  // Analysis data with memoization
  const analysisData = useMemo(() => {
    const totalBudget = filteredData.reduce((sum, item) => sum + item.budget, 0);
    const totalRealisasi = filteredData.reduce((sum, item) => sum + item.realisasi, 0);
    const variance = totalBudget - totalRealisasi;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    
    let healthStatus: 'good' | 'warning' | 'critical';
    if (Math.abs(variancePercentage) <= 5) healthStatus = 'good';
    else if (Math.abs(variancePercentage) <= 15) healthStatus = 'warning';
    else healthStatus = 'critical';

    return {
      totalBudget,
      totalRealisasi,
      variance,
      variancePercentage,
      healthStatus
    };
  }, [filteredData]);

  // Available periods
  const availablePeriods = useMemo(() => {
    return [...new Set(keuanganData.map(item => item.period))].sort();
  }, [keuanganData]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const categoryData = filteredData.reduce((acc, item) => {
      const category = getCategoryConfig(item.category).label;
      if (!acc[category]) {
        acc[category] = { budget: 0, realisasi: 0 };
      }
      acc[category].budget += item.budget;
      acc[category].realisasi += item.realisasi;
      return acc;
    }, {} as Record<string, { budget: number; realisasi: number }>);

    return {
      labels: Object.keys(categoryData),
      datasets: [
        {
          label: 'Budget',
          data: Object.values(categoryData).map(item => item.budget / 1000000), // Convert to millions
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: 'Realisasi',
          data: Object.values(categoryData).map(item => item.realisasi / 1000000), // Convert to millions
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [filteredData, getCategoryConfig]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update form data when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        description: selectedItem.description || '',
        category: selectedItem.category || 'operasional',
        period: selectedItem.period || '',
        budget: selectedItem.budget || 0,
        realisasi: selectedItem.realisasi || 0,
        notes: selectedItem.notes || ''
      });
    } else {
      setFormData({
        description: '',
        category: 'operasional',
        period: '',
        budget: 0,
        realisasi: 0,
        notes: ''
      });
    }
  }, [selectedItem]);

  // Handle add new item
  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setIsEditing(false);
    setShowModal(true);
  }, []);

  // Handle edit item
  const handleEdit = useCallback((item: KeuanganEkspor) => {
    setSelectedItem(item);
    setIsEditing(true);
    setShowModal(true);
  }, []);

  // Handle delete item
  const handleDelete = useCallback(async (item: KeuanganEkspor) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      try {
        await keuanganEksporService.deleteKeuanganItem(item.id);
        await loadData();
        notifyKeuanganChange();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  }, [loadData, notifyKeuanganChange]);

  // Handle save
  const handleSave = useCallback(async (data: Partial<KeuanganEkspor>) => {
    try {
      // Konversi data ke format yang diharapkan oleh API
      const apiData: any = {
        name: data.description,
        category: data.category,
        description: data.notes,
        type: 'BUDGET',
        amount: data.budget || 0,
        original_amount: data.budget_usd || 0,
        exchange_rate: data.exchange_rate || 15000,
        currency: 'IDR',
        status: 'planned',
        cash_flow_type: 'cash-out'
      };
      
      // Extract year and month from period (YYYY-MM format)
      if (data.period) {
        const [year, month] = data.period.split('-');
        apiData.year = parseInt(year);
        apiData.month = parseInt(month);
      }
      
      if (isEditing && selectedItem) {
        await keuanganEksporService.updateKeuanganItem(selectedItem.id, apiData);
      } else {
        await keuanganEksporService.createKeuanganItem(apiData);
      }
      await loadData();
      notifyKeuanganChange();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [isEditing, selectedItem, loadData, notifyKeuanganChange]);

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Keuangan Ekspor</h1>
            <p className="text-gray-600">Kelola budget dan realisasi keuangan untuk aktivitas ekspor</p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            
            <ExcelExportButton data={filteredData} activeTab="budget-planning" />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Data</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari deskripsi atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="all">Semua Kategori</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="all">Semua Periode</option>
              {availablePeriods.map(period => {
                const [year, month] = period.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                return (
                  <option key={period} value={period}>{monthName}</option>
                );
              })}
            </select>
            
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analysisData.totalBudget, selectedCurrency)}
                </p>
                <p className="text-xs text-gray-500">Rencana anggaran</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Realisasi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analysisData.totalRealisasi, selectedCurrency)}
                </p>
                <p className="text-xs text-gray-500">Actual amount</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                analysisData.variance >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {analysisData.variance >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Variance</p>
                <p className={`text-2xl font-bold ${
                  analysisData.variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(analysisData.variance), selectedCurrency)}
                </p>
                <p className="text-xs text-gray-500">
                  {analysisData.variancePercentage >= 0 ? '+' : ''}
                  {analysisData.variancePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                analysisData.healthStatus === 'good' ? 'bg-green-100' :
                analysisData.healthStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <BarChart3 className={`h-6 w-6 ${
                  analysisData.healthStatus === 'good' ? 'text-green-600' :
                  analysisData.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Health Status</p>
                <p className={`text-xl font-bold ${
                  analysisData.healthStatus === 'good' ? 'text-green-600' :
                  analysisData.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysisData.healthStatus === 'good' ? 'Excellent' :
                   analysisData.healthStatus === 'warning' ? 'Warning' : 'Critical'}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.abs(analysisData.variancePercentage).toFixed(1)}% variance
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget vs Actual Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Budget vs Realisasi</h3>
                <p className="text-sm text-gray-600">Per kategori (dalam juta)</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            
            <Suspense fallback={<ChartSkeleton />}>
              <div className="h-64">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: { size: 12 }
                        }
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0,0,0,0.05)',
                        },
                        ticks: {
                          callback: (value) => `${value}M`,
                          font: { size: 11 }
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: { size: 11 }
                        }
                      }
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    }
                  }}
                />
              </div>
            </Suspense>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Distribusi Budget</h3>
                <p className="text-sm text-gray-600">Per kategori</p>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg">
                <PieChart className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            
            <Suspense fallback={<ChartSkeleton />}>
              <div className="h-64">
                <Pie
                  data={{
                    labels: chartData.labels,
                    datasets: [{
                      data: chartData.datasets[0].data,
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(107, 114, 128, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(147, 51, 234, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(107, 114, 128, 1)',
                      ],
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: { size: 12 }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value}M (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Suspense>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detail Keuangan Ekspor</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {filteredData.length} dari {keuanganData.length} item
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Realisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredData.map((item, index) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      selectedCurrency={selectedCurrency}
                      formatCurrency={formatCurrency}
                      getCategoryConfig={getCategoryConfig}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada data yang ditemukan</p>
                <p className="text-gray-500 text-sm mt-2">Coba ubah filter pencarian atau tambah data baru</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showModal && (
          <FormModal
            title={isEditing ? 'Edit Data Keuangan' : 'Tambah Data Keuangan'}
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={() => handleSave(formData)}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData?.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Masukkan deskripsi..."
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={formData?.category || 'operasional'}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="period">Periode</Label>
                <Input
                  id="period"
                  value={formData?.period || ''}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  placeholder="YYYY-MM"
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget (IDR)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData?.budget || 0}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                  placeholder="Masukkan budget..."
                />
              </div>
              <div>
                <Label htmlFor="realisasi">Realisasi (IDR)</Label>
                <Input
                  id="realisasi"
                  type="number"
                  value={formData?.realisasi || 0}
                  onChange={(e) => setFormData({...formData, realisasi: parseFloat(e.target.value)})}
                  placeholder="Masukkan realisasi..."
                />
              </div>
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData?.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Catatan tambahan (opsional)..."
                />
              </div>
            </div>
          </FormModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KeuanganEkspor;