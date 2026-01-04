import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Download, Filter, BarChart3, PieChart, Calendar, Clock, FileText, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { FormModal } from './FormModal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { keuanganEksporService, lcService, type KeuanganEkspor, type LetterOfCredit } from '../lib/supabase';
import { useDataChangeNotification } from '../contexts/DataSyncContext';
import ExcelExportButton from './ExcelExportButton';

// Lazy load chart components for better performance
const LazyBar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const LazyPie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));

// Chart loading fallback component
const ChartSkeleton = () => (
  <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
    <BarChart3 className="w-12 h-12 text-gray-400" />
  </div>
);

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

type LCStatus = LetterOfCredit['status'];
type LCType = LetterOfCredit['lc_type'];
type DocumentType = 'Commercial Invoice' | 'Packing List' | 'Bill of Lading' | 'Certificate of Origin' | 
                   'Insurance Certificate' | 'Inspection Certificate' | 'Other';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  isBase?: boolean;
  flagIcon?: string;
}

interface KeuanganEksporProps {}

type TabType = 'budget-planning' | 'cashflow-tracking' | 'analysis';

// Currency Configuration
const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', isBase: true, flagIcon: '🇮🇩' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flagIcon: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flagIcon: '🇪🇺' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flagIcon: '🇸🇬' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flagIcon: '🇨🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flagIcon: '🇯🇵' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flagIcon: '🇲🇾' }
];

const BASE_CURRENCY = 'IDR';

// LC Configuration
const LC_STATUS_CONFIG = {
  'draft': { label: 'Draft', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' },
  'issued': { label: 'Issued', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  'confirmed': { label: 'Confirmed', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  'amended': { label: 'Amended', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  'utilized': { label: 'Utilized', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  'expired': { label: 'Expired', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  'closed': { label: 'Closed', color: 'bg-gray-600', bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-300' }
};

const LC_TYPE_CONFIG = {
  'sight': { label: 'Sight LC', description: 'Payment upon presentation of documents' },
  'usance': { label: 'Usance LC', description: 'Payment after specified period' },
  'revolving': { label: 'Revolving LC', description: 'Automatically renewable LC' },
  'standby': { label: 'Standby LC', description: 'Guarantee instrument' }
};

const REQUIRED_DOCUMENTS = [
  'Commercial Invoice',
  'Packing List',
  'Bill of Lading',
  'Certificate of Origin',
  'Insurance Certificate',
  'Inspection Certificate',
  'Other'
];

const DEFAULT_COMPLIANCE_CHECKLIST = [
  'LC Amount within limit',
  'Expiry date not passed',
  'Shipment deadline compliance',
  'Document presentation timeline',
  'Goods description match',
  'Partial shipment terms',
  'Transhipment terms',
  'Insurance coverage',
  'Certificate requirements'
];

export const KeuanganEksporComponent: React.FC<KeuanganEksporProps> = () => {
  const [keuanganItems, setKeuanganItems] = useState<KeuanganEkspor[]>([]);
  const [letterOfCredits, setLetterOfCredits] = useState<LCDisplay[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KeuanganEkspor | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('budget-planning');
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [tabInfoVisible, setTabInfoVisible] = useState<Record<TabType, boolean>>({
    'budget-planning': false,
    'cashflow-tracking': false,
    'analysis': false
  });
  const [isBreakdownCollapsed, setIsBreakdownCollapsed] = useState(true);
  const [formData, setFormData] = useState({
    type: 'BUDGET' as KeuanganEkspor['type'],
    name: '',
    category: 'operasional' as KeuanganEkspor['category'],
    amount: '',
    currency: 'IDR',
    exchange_rate: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'planned' as KeuanganEkspor['status'],
    cash_flow_type: 'cash-in' as KeuanganEkspor['cash_flow_type']
  });

  // LC State Management (simplified)
  const [selectedLC, setSelectedLC] = useState<LCDisplay | null>(null);
  const [lcFilter, setLCFilter] = useState({
    status: 'all',
    type: 'all',
    bank: 'all'
  });

  // Simplified currency state (no exchange rates)
  const [selectedCurrency, setSelectedCurrency] = useState('IDR');

  // Data sync integration
  const { notifyKeuanganChange } = useDataChangeNotification();

  // Category configurations
  const categoryConfig = {
    operasional: { label: 'Operasional', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
    marketing: { label: 'Marketing', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
    logistik: { label: 'Logistik', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
    administrasi: { label: 'Administrasi', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
    lainnya: { label: 'Lainnya', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' }
  };

  const statusConfig = {
    planned: { label: 'Direncanakan', color: 'bg-blue-500' },
    'in-progress': { label: 'Dalam Proses', color: 'bg-yellow-500' },
    completed: { label: 'Selesai', color: 'bg-green-500' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-500' }
  };

  const cashFlowConfig = {
    'cash-in': { label: 'Cash In (Pemasukan)', color: 'bg-green-600', icon: '+' },
    'cash-out': { label: 'Cash Out (Pengeluaran)', color: 'bg-red-600', icon: '-' }
  };

  // Tab information configuration
  const tabInfoConfig = {
    'budget-planning': {
      title: 'BUDGET PLANNING (Perencanaan Budget)',
      icon: 'PieChart',
      description: 'Buat rencana dan target keuangan di awal periode',
      when: 'Di awal bulan/quarter untuk menetapkan target',
      content: 'Target pemasukan & pengeluaran yang ingin dicapai',
      example: 'Target penjualan ekspor Rp 500M, budget marketing Rp 50M',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    },
    'cashflow-tracking': {
      title: 'CASHFLOW TRACKING (Pelacakan Arus Kas Aktual)',
      icon: 'DollarSign',
      description: 'Catat transaksi riil yang benar-benar terjadi',
      when: 'Setiap hari saat ada transaksi masuk/keluar',
      content: 'Data aktual cash in dan cash out',
      example: 'Terima pembayaran ekspor Rp 200M, bayar shipping Rp 10M',
      color: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    'analysis': {
      title: 'ANALISIS (Evaluasi Performa)',
      icon: 'BarChart3',
      description: 'Bandingkan budget vs realisasi dan lihat trend',
      when: 'Berkala untuk evaluasi bulanan/quarterly',
      content: 'Variance, performa, dan insights bisnis',
      example: 'Variance penjualan +20%, trend pengeluaran meningkat',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600'
    }
  };

  // Currency Utility Functions
  const getCurrencyInfo = useCallback((currencyCode: string): Currency | undefined => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  }, []);

  // Simplified currency formatting (no conversions)
  const formatCurrencyAmount = useCallback((amount: number, currencyCode: string): string => {
    const currency = getCurrencyInfo(currencyCode);
    if (!currency) return amount.toString();
    
    // Format based on currency
    const formatter = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyCode === 'IDR' ? 'IDR' : 'USD', // Use USD format for non-IDR
      minimumFractionDigits: 0, // Hilangkan ,00 di akhir
      maximumFractionDigits: 0  // Hilangkan ,00 di akhir
    });
    
    if (currencyCode !== 'IDR') {
      // For non-IDR currencies, use symbol prefix
      return `${currency.symbol} ${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0, // Hilangkan desimal untuk non-IDR juga
        maximumFractionDigits: 0
      })}`;
    }
    
    return formatter.format(amount);
  }, [getCurrencyInfo]);

  // LC Utility Functions (simplified)
  const getLCStatusInfo = useCallback((status: string) => {
    return LC_STATUS_CONFIG[status as keyof typeof LC_STATUS_CONFIG] || LC_STATUS_CONFIG['draft'];
  }, []);

  const calculateLCDaysToExpiry = useCallback((expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const isLCExpiringSoon = useCallback((expiryDate: string, days: number = 30): boolean => {
    return calculateLCDaysToExpiry(expiryDate) <= days;
  }, [calculateLCDaysToExpiry]);

  const calculateLCUtilization = useCallback((lc: LCDisplay): number => {
    // For simplified display, return a mock utilization percentage
    return Math.random() * 50; // 0-50% utilization
  }, []);

  // Simplified LC types for display purposes
  interface LCDisplay {
    id: string;
    lc_number: string;
    issuing_bank: string;
    advising_bank: string;
    applicant: string;
    lc_amount: number;
    lc_currency: string;
    status: string;
    lc_type: string;
    expiry_date: string;
  }

  // Simplified create functions - removed for now
  const createDefaultLCDocuments = useCallback(() => [], []);
  const createDefaultComplianceChecklist = useCallback(() => [], []);

  // Simplified data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load keuangan ekspor data
        const keuanganData = await keuanganEksporService.getAllKeuanganItems();
        const analytics = await keuanganEksporService.getKeuanganAnalytics();
        
        setKeuanganItems(keuanganData);
        setAnalyticsData(analytics);
        
        console.log('Data loaded successfully:', { 
          keuanganCount: keuanganData.length
        });
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Gagal memuat data. Silakan refresh halaman.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Refresh analytics when keuangan items change
  useEffect(() => {
    const refreshAnalytics = async () => {
      try {
        const analytics = await keuanganEksporService.getKeuanganAnalytics();
        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Error refreshing analytics:', err);
      }
    };
    
    if (keuanganItems.length > 0) {
      refreshAnalytics();
    }
  }, [keuanganItems]);

  // Helper functions
  const formatCurrency = useCallback((amount: number, currencyCode?: string) => {
    const currency = currencyCode || 'IDR';
    return formatCurrencyAmount(amount, currency);
  }, [formatCurrencyAmount]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const getAvailablePeriods = useCallback(() => {
    const periods = new Set<string>();
    keuanganItems.forEach(item => {
      periods.add(`${item.year}-${item.month.toString().padStart(2, '0')}`);
    });
    return Array.from(periods).sort().reverse();
  }, [keuanganItems]);

  // Tab switching
  const handleTabSwitch = useCallback((newTab: TabType) => {
    console.log(`Switching from ${activeTab} to ${newTab}`);
    setActiveTab(newTab);
    setForceRenderKey(prev => prev + 1);
    setSearchQuery('');
    setFilterCategory('all');
    setFilterType('all');
    
    setFormData(prev => ({
      ...prev,
      type: newTab === 'budget-planning' ? 'BUDGET' : 'REALISASI',
      cash_flow_type: newTab === 'budget-planning' ? 'cash-out' : 'cash-in'
    }));
  }, [activeTab]);

  const toggleTabInfo = useCallback((tab: TabType) => {
    setTabInfoVisible(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  }, []);

  const toggleBreakdownCollapse = useCallback(() => {
    setIsBreakdownCollapsed(prev => !prev);
  }, []);

  const isTabInfoVisible = useCallback((tab: TabType) => {
    return tabInfoVisible[tab];
  }, [tabInfoVisible]);

  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
    setForceRenderKey(prev => prev + 1);
  }, [activeTab]);

  // Simplified LC analytics
  const getFilteredLCs = useMemo(() => {
    return letterOfCredits; // Since it's empty, just return as is
  }, [letterOfCredits]);

  const lcAnalytics = useMemo(() => {
    return {
      totalLCs: letterOfCredits.length,
      activeLCs: 0,
      expiringSoon: 0,
      totalLCValue: 0,
      utilizedValue: 0,
      utilizationRate: 0
    };
  }, [letterOfCredits]);

  const filteredLCs = useMemo(() => {
    return getFilteredLCs;
  }, [getFilteredLCs]);

  // Refresh analytics when keuangan items change
  useEffect(() => {
    const refreshAnalytics = async () => {
      try {
        const analytics = await keuanganEksporService.getKeuanganAnalytics();
        setAnalyticsData(analytics);
      } catch (err) {
        console.error('Error refreshing analytics:', err);
      }
    };
    
    if (keuanganItems.length > 0) {
      refreshAnalytics();
    }
  }, [keuanganItems]);

  // Save to Supabase
  const saveKeuangan = useCallback(async (newItems: KeuanganEkspor[]) => {
    setKeuanganItems(newItems);
    console.log('Keuangan items updated in state');
  }, []);

  // Refresh data after operations
  const refreshData = useCallback(async () => {
    try {
      const keuanganData = await keuanganEksporService.getAllKeuanganItems();
      
      setKeuanganItems(keuanganData);
      
      console.log('Data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Gagal memuat ulang data.');
    }
  }, []);

  // Filter items based on current tab and filters - optimized with useMemo
  const getFilteredItems = useMemo(() => {
    let filtered = keuanganItems;

    // Filter by tab
    if (activeTab === 'budget-planning') {
      filtered = filtered.filter(item => item.type === 'BUDGET');
    } else if (activeTab === 'cashflow-tracking') {
      filtered = filtered.filter(item => item.type === 'REALISASI');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.amount.toString().includes(query) ||
        categoryConfig[item.category].label.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    // Apply type filter (for analysis tab)
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    // Apply period filter
    if (filterPeriod !== 'all') {
      const [year, month] = filterPeriod.split('-').map(Number);
      filtered = filtered.filter(item => item.year === year && item.month === month);
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [keuanganItems, activeTab, searchQuery, filterCategory, filterType, filterPeriod, sortBy, categoryConfig]);

  // Get analysis data with filtering support - optimized with useMemo
  const getAnalysisData = useMemo(() => {
    // Apply filtering based on current filter settings
    let dataToAnalyze = keuanganItems;
    
    // Apply category filter if set
    if (filterCategory !== 'all') {
      dataToAnalyze = dataToAnalyze.filter(item => item.category === filterCategory);
    }
    
    // Apply period filter if set  
    if (filterPeriod !== 'all') {
      const [year, month] = filterPeriod.split('-').map(Number);
      dataToAnalyze = dataToAnalyze.filter(item => item.year === year && item.month === month);
    }
    
    // Get budget items (same logic as Budget Planning)
    const budgetItems = dataToAnalyze.filter(item => item.type === 'BUDGET');
    
    // Get realisasi items with cash-out filter (same logic as Cashflow Tracking)
    const realisasiItems = dataToAnalyze.filter(item => 
      item.type === 'REALISASI' && item.cash_flow_type === 'cash-out'
    );
    
    // Calculate totals using amount_idr for consistency
    const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const totalRealisasi = realisasiItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    const variance = totalRealisasi - totalBudget;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    
    // Analysis by category - ONLY show categories that exist in Budget Planning
    const budgetCategories = [...new Set(budgetItems.map(item => item.category))];
    const categoryAnalysis = budgetCategories
      .filter(category => filterCategory === 'all' || category === filterCategory)
      .map(category => {
      const categoryBudget = budgetItems
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryRealisasi = realisasiItems
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const categoryVariance = categoryRealisasi - categoryBudget;
      
      return {
        category,
        budget: categoryBudget,
        realisasi: categoryRealisasi,
        variance: categoryVariance,
        variancePercentage: categoryBudget > 0 ? (categoryVariance / categoryBudget) * 100 : null
      };
    }).filter(item => item.budget > 0); // Only show categories with actual budget
    
    return {
      totalBudget,
      totalRealisasi,
      variance,
      variancePercentage,
      categoryAnalysis,
      healthStatus: Math.abs(variancePercentage) <= 10 ? 'good' : 
                   Math.abs(variancePercentage) <= 25 ? 'warning' : 'critical'
    };
  }, [keuanganItems, filterCategory, filterPeriod, categoryConfig]);

  // Budget Planning Analytics - untuk menampilkan total di Budget Planning tab
  const getBudgetPlanningAnalytics = useMemo(() => {
    // Filter hanya budget items untuk tab Budget Planning
    const budgetItems = getFilteredItems.filter(item => item.type === 'BUDGET');
    
    // Total keseluruhan budget dalam IDR (sum of amount_idr)
    const totalBudgetIdr = budgetItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    
    // Total untuk foreign currency (USD) - sum of original amounts for USD items
    const usdItems = budgetItems.filter(item => item.currency === 'USD');
    const totalBudgetUsd = usdItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Breakdown berdasarkan cash flow type (menggunakan amount_idr)
    const cashInBudgetIdr = budgetItems
      .filter(item => item.cash_flow_type === 'cash-in')
      .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
    
    const cashOutBudgetIdr = budgetItems
      .filter(item => item.cash_flow_type === 'cash-out')
      .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);

    // USD breakdown for cash flow types
    const cashInBudgetUsd = budgetItems
      .filter(item => item.cash_flow_type === 'cash-in' && item.currency === 'USD')
      .reduce((sum, item) => sum + item.amount, 0);
      
    const cashOutBudgetUsd = budgetItems
      .filter(item => item.cash_flow_type === 'cash-out' && item.currency === 'USD')
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Breakdown berdasarkan kategori
    const categoryBreakdown = Object.keys(categoryConfig).map(category => {
      const categoryItems = budgetItems.filter(item => item.category === category);
      const totalAmountIdr = categoryItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const percentage = totalBudgetIdr > 0 ? (totalAmountIdr / totalBudgetIdr) * 100 : 0;
      
      return {
        category,
        label: categoryConfig[category as keyof typeof categoryConfig].label,
        amount: totalAmountIdr,
        percentage,
        count: categoryItems.length,
        color: categoryConfig[category as keyof typeof categoryConfig].color
      };
    }).filter(item => item.amount > 0);
    
    // Breakdown berdasarkan status
    const statusBreakdown = Object.keys(statusConfig).map(status => {
      const statusItems = budgetItems.filter(item => item.status === status);
      const totalAmountIdr = statusItems.reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const percentage = totalBudgetIdr > 0 ? (totalAmountIdr / totalBudgetIdr) * 100 : 0;
      
      return {
        status,
        label: statusConfig[status as keyof typeof statusConfig].label,
        amount: totalAmountIdr,
        percentage,
        count: statusItems.length,
        color: statusConfig[status as keyof typeof statusConfig].color
      };
    }).filter(item => item.amount > 0);
    
    return {
      totalBudget: totalBudgetIdr, // IDR equivalent
      totalBudgetUsd, // USD original amounts
      cashInBudget: cashInBudgetIdr, // IDR equivalent
      cashInBudgetUsd, // USD original amounts
      cashOutBudget: cashOutBudgetIdr, // IDR equivalent
      cashOutBudgetUsd, // USD original amounts
      netBudgetPlanning: cashInBudgetIdr - cashOutBudgetIdr, // IDR equivalent
      netBudgetPlanningUsd: cashInBudgetUsd - cashOutBudgetUsd, // USD original amounts
      totalItems: budgetItems.length,
      categoryBreakdown,
      statusBreakdown
    };
  }, [getFilteredItems, categoryConfig, statusConfig]);

  // Enhanced Export Excel Functions with Professional Formatting
  const exportBudgetPlanningToExcel = useCallback(() => {
    try {
      console.log('Starting Budget Planning Excel export...');
      const budgetData = getBudgetPlanningAnalytics;
      const budgetItems = getFilteredItems.filter(item => item.type === 'BUDGET');
      
      if (budgetItems.length === 0) {
        alert('Tidak ada data budget planning untuk diekspor!');
        return;
      }
      
      const wb = XLSX.utils.book_new();
      const currentDate = new Date().toLocaleDateString('id-ID');
      const currentTime = new Date().toLocaleTimeString('id-ID');
      
      // Sheet 1: Summary
      const summaryData = [
        ['PT. MALAKA PASAI GLOBAL'],
        ['LAPORAN BUDGET PLANNING'],
        [''],
        ['Tanggal Export:', currentDate],
        ['Waktu Export:', currentTime],
        [''],
        ['RINGKASAN BUDGET'],
        ['Total Budget (IDR):', budgetData.totalBudget.toString()],
        ['Budget Pemasukan (IDR):', budgetData.cashInBudget.toString()],
        ['Budget Pengeluaran (IDR):', budgetData.cashOutBudget.toString()],
        ['Net Budget Planning (IDR):', budgetData.netBudgetPlanning.toString()],
        ['Total Item:', budgetData.totalItems.toString()],
        ['']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Sheet 2: Breakdown by Category
      const categoryData = [
        ['BREAKDOWN BY CATEGORY'],
        [''],
        ['Kategori', 'Jumlah (IDR)', 'Persentase (%)', 'Jumlah Item']
      ];
      
      budgetData.categoryBreakdown.forEach(cat => {
        categoryData.push([
          cat.label,
          cat.amount.toString(),
          cat.percentage.toFixed(2),
          cat.count.toString()
        ]);
      });
      
      const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, categoryWs, 'Breakdown');
      
      // Sheet 3: Complete Budget Items
      const itemsData = [
        ['DAFTAR LENGKAP BUDGET ITEMS'],
        [''],
        ['Tanggal', 'Nama Item', 'Kategori', 'Jumlah Original', 'Mata Uang', 'Rate ke IDR', 'Jumlah IDR', 'Cash Flow Type', 'Status', 'Deskripsi']
      ];
      
      budgetItems.forEach(item => {
        itemsData.push([
          formatDate(item.date),
          item.name,
          categoryConfig[item.category].label,
          item.amount.toString(),
          item.currency,
          (item.exchange_rate || 1).toString(),
          (item.amount_idr || item.amount).toString(),
          cashFlowConfig[item.cash_flow_type].label,
          statusConfig[item.status].label,
          item.description || ''
        ]);
      });
      
      const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, itemsWs, 'Items');
      
      const fileName = `Budget_Planning_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ File Budget Planning Excel berhasil diunduh! (${budgetItems.length} record)`);
      console.log('Budget Planning Excel export completed successfully');
    } catch (error) {
      console.error('Error during Budget Planning Excel export:', error);
      alert('❌ Gagal mengekspor file Excel. Silakan coba lagi.');
    }
  }, [getBudgetPlanningAnalytics, getFilteredItems, formatDate, categoryConfig, cashFlowConfig, statusConfig]);
  
  const exportCashflowTrackingToExcel = useCallback(() => {
    try {
      console.log('Starting Cashflow Tracking Excel export...');
      const cashflowItems = getFilteredItems.filter(item => item.type === 'REALISASI');
      
      if (cashflowItems.length === 0) {
        alert('Tidak ada data cashflow tracking untuk diekspor!');
        return;
      }
      
      const wb = XLSX.utils.book_new();
      const currentDate = new Date().toLocaleDateString('id-ID');
      const currentTime = new Date().toLocaleTimeString('id-ID');
      
      // Calculate summaries
      const totalCashIn = cashflowItems
        .filter(item => item.cash_flow_type === 'cash-in')
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const totalCashOut = cashflowItems
        .filter(item => item.cash_flow_type === 'cash-out')
        .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
      const netCashflow = totalCashIn - totalCashOut;
      
      // Sheet 1: Summary
      const summaryData = [
        ['PT. MALAKA PASAI GLOBAL'],
        ['LAPORAN CASHFLOW TRACKING'],
        [''],
        ['Tanggal Export:', currentDate],
        ['Waktu Export:', currentTime],
        [''],
        ['RINGKASAN CASHFLOW'],
        ['Total Cash In (IDR):', totalCashIn.toString()],
        ['Total Cash Out (IDR):', totalCashOut.toString()],
        ['Net Cashflow (IDR):', netCashflow.toString()],
        ['Total Transaksi:', cashflowItems.length.toString()],
        ['']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Sheet 2: Cash In Transactions
      const cashInData = [
        ['TRANSAKSI CASH IN'],
        [''],
        ['Tanggal', 'Nama Transaksi', 'Kategori', 'Jumlah Original', 'Mata Uang', 'Rate ke IDR', 'Jumlah IDR', 'Status', 'Deskripsi']
      ];
      
      cashflowItems
        .filter(item => item.cash_flow_type === 'cash-in')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(item => {
          cashInData.push([
            formatDate(item.date),
            item.name,
            categoryConfig[item.category].label,
            item.amount.toString(),
            item.currency,
            (item.exchange_rate || 1).toString(),
            (item.amount_idr || item.amount).toString(),
            statusConfig[item.status].label,
            item.description || ''
          ]);
        });
      
      const cashInWs = XLSX.utils.aoa_to_sheet(cashInData);
      XLSX.utils.book_append_sheet(wb, cashInWs, 'Cash In');
      
      // Sheet 3: Cash Out Transactions
      const cashOutData = [
        ['TRANSAKSI CASH OUT'],
        [''],
        ['Tanggal', 'Nama Transaksi', 'Kategori', 'Jumlah Original', 'Mata Uang', 'Rate ke IDR', 'Jumlah IDR', 'Status', 'Deskripsi']
      ];
      
      cashflowItems
        .filter(item => item.cash_flow_type === 'cash-out')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(item => {
          cashOutData.push([
            formatDate(item.date),
            item.name,
            categoryConfig[item.category].label,
            item.amount.toString(),
            item.currency,
            (item.exchange_rate || 1).toString(),
            (item.amount_idr || item.amount).toString(),
            statusConfig[item.status].label,
            item.description || ''
          ]);
        });
      
      const cashOutWs = XLSX.utils.aoa_to_sheet(cashOutData);
      XLSX.utils.book_append_sheet(wb, cashOutWs, 'Cash Out');
      
      const fileName = `Cashflow_Tracking_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ File Cashflow Tracking Excel berhasil diunduh! (${cashflowItems.length} record)`);
      console.log('Cashflow Tracking Excel export completed successfully');
    } catch (error) {
      console.error('Error during Cashflow Tracking Excel export:', error);
      alert('❌ Gagal mengekspor file Excel. Silakan coba lagi.');
    }
  }, [getFilteredItems, formatDate, categoryConfig, statusConfig]);
  
  const exportAnalysisToExcel = useCallback(() => {
    try {
      console.log('Starting Analysis Excel export...');
      const analysisData = getAnalysisData;
      
      if (keuanganItems.length === 0) {
        alert('Tidak ada data analysis untuk diekspor!');
        return;
      }
      
      const wb = XLSX.utils.book_new();
      const currentDate = new Date().toLocaleDateString('id-ID');
      const currentTime = new Date().toLocaleTimeString('id-ID');
      
      // Sheet 1: Overview
      const overviewData = [
        ['PT. MALAKA PASAI GLOBAL'],
        ['LAPORAN ANALYSIS REPORT'],
        [''],
        ['Tanggal Export:', currentDate],
        ['Waktu Export:', currentTime],
        [''],
        ['OVERVIEW ANALYSIS'],
        ['Total Budget (IDR):', analysisData.totalBudget.toString()],
        ['Total Realisasi (IDR):', analysisData.totalRealisasi.toString()],
        ['Variance (IDR):', analysisData.variance.toString()],
        ['Variance (%):', `${analysisData.variancePercentage.toFixed(2)}%`],
        ['Health Status:', analysisData.healthStatus],
        ['Period Filter:', filterPeriod === 'all' ? 'Semua Periode' : filterPeriod],
        ['Category Filter:', filterCategory === 'all' ? 'Semua Kategori' : categoryConfig[filterCategory]?.label || filterCategory],
        ['']
      ];
      
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');
      
      // Sheet 2: Category Analysis
      const categoryAnalysisData = [
        ['DETAILED ANALYSIS BY CATEGORY'],
        [''],
        ['Kategori', 'Budget (IDR)', 'Actual (IDR)', 'Variance (IDR)', 'Variance (%)', 'Performance Status']
      ];
      
      analysisData.categoryAnalysis.forEach(item => {
        const performanceStatus = item.variancePercentage === null ? 'N/A' :
                                 Math.abs(item.variancePercentage) <= 10 ? 'Excellent' :
                                 Math.abs(item.variancePercentage) <= 25 ? 'Warning' : 'Critical';
        
        categoryAnalysisData.push([
          categoryConfig[item.category].label,
          item.budget.toString(),
          item.realisasi.toString(),
          item.variance.toString(),
          item.variancePercentage !== null ? `${item.variancePercentage.toFixed(2)}%` : 'N/A',
          performanceStatus
        ]);
      });
      
      const categoryAnalysisWs = XLSX.utils.aoa_to_sheet(categoryAnalysisData);
      XLSX.utils.book_append_sheet(wb, categoryAnalysisWs, 'Category Analysis');
      
      // Sheet 3: Cashflow Trends
      const trendsData = [
        ['CASHFLOW TREND ANALYSIS'],
        [''],
        ['Periode', 'Cash In (IDR)', 'Cash Out (IDR)', 'Net Cashflow (IDR)']
      ];
      
      getAvailablePeriods().reverse().forEach(period => {
        const [year, month] = period.split('-').map(Number);
        const cashIn = keuanganItems
          .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-in')
          .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
        const cashOut = keuanganItems
          .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-out')
          .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
        const netCashflow = cashIn - cashOut;
        
        const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        trendsData.push([
          monthName,
          cashIn.toString(),
          cashOut.toString(),
          netCashflow.toString()
        ]);
      });
      
      const trendsWs = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Cashflow Trends');
      
      const fileName = `Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ File Analysis Report Excel berhasil diunduh!`);
      console.log('Analysis Excel export completed successfully');
    } catch (error) {
      console.error('Error during Analysis Excel export:', error);
      alert('❌ Gagal mengekspor file Excel. Silakan coba lagi.');
    }
  }, [getAnalysisData, keuanganItems, filterPeriod, filterCategory, categoryConfig, getAvailablePeriods]);
  const exportToPDF = useCallback((period?: string) => {
    try {
      console.log('Starting PDF export...');
      let dataToExport = keuanganItems;
      
      if (period && period !== 'all') {
        const [year, month] = period.split('-').map(Number);
        dataToExport = keuanganItems.filter(item => item.year === year && item.month === month);
      }
      
      if (dataToExport.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
      }
      
      const pdf = new jsPDF();
      const analysisData = getAnalysisData;
      
      // Title
      pdf.setFontSize(18);
      pdf.text('LAPORAN KEUANGAN EKSPOR', 20, 20);
      
      // Summary info
      pdf.setFontSize(12);
      pdf.text(`Periode: ${period || 'Semua Data'}`, 20, 35);
      pdf.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 20, 45);
      
      // Summary statistics
      pdf.setFontSize(14);
      pdf.text('RINGKASAN:', 20, 60);
      pdf.setFontSize(10);
      pdf.text(`Total Budget: ${formatCurrency(analysisData.totalBudget)}`, 20, 70);
      pdf.text(`Total Realisasi: ${formatCurrency(analysisData.totalRealisasi)}`, 20, 80);
      pdf.text(`Variance: ${formatCurrency(analysisData.variance)}`, 20, 90);
      pdf.text(`Variance %: ${analysisData.variancePercentage.toFixed(2)}%`, 20, 100);
      
      // Table data
      const tableData = dataToExport.map(item => [
        formatDate(item.date),
        item.type,
        categoryConfig[item.category].label,
        item.name,
        formatCurrency(item.amount),
        statusConfig[item.status].label,
        item.description
      ]);
      
      (pdf as any).autoTable({
        head: [['Tanggal', 'Tipe', 'Kategori', 'Nama Item', 'Jumlah', 'Status', 'Deskripsi']],
        body: tableData,
        startY: 110,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: {
          4: { halign: 'right' }
        }
      });
      
      const fileName = `laporan-keuangan-ekspor-${period || 'lengkap'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      alert(`✅ File PDF berhasil diunduh! (${dataToExport.length} record)`);
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error during PDF export:', error);
      alert('❌ Gagal mengekspor file PDF. Silakan coba lagi.');
    }
  }, [keuanganItems, getAnalysisData, formatCurrency, formatDate, categoryConfig, statusConfig]);

  const exportToCSV = useCallback((period?: string) => {
    try {
      console.log('Starting CSV export...');
      let dataToExport = keuanganItems;
      
      if (period && period !== 'all') {
        const [year, month] = period.split('-').map(Number);
        dataToExport = keuanganItems.filter(item => item.year === year && item.month === month);
      }
      
      if (dataToExport.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
      }
      
      const csvData = dataToExport.map(item => ({
        'Tanggal': formatDate(item.date),
        'Tipe': item.type,
        'Kategori': categoryConfig[item.category].label,
        'Nama Item': item.name,
        'Jumlah': item.amount,
        'Mata Uang': item.currency,
        'Status': statusConfig[item.status].label,
        'Cash Flow': cashFlowConfig[item.cash_flow_type].label,
        'Deskripsi': item.description
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const fileName = `keuangan-ekspor-${period || 'lengkap'}-${new Date().toISOString().split('T')[0]}.csv`;
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      alert(`✅ File CSV berhasil diunduh! (${dataToExport.length} record)`);
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error('Error during CSV export:', error);
      alert('❌ Gagal mengekspor file CSV. Silakan coba lagi.');
    }
  }, [keuanganItems, formatDate, categoryConfig, statusConfig, cashFlowConfig]);

  const exportToExcel = useCallback((period?: string) => {
    try {
      console.log('Starting Excel export...');
      let dataToExport = keuanganItems;
      
      if (period && period !== 'all') {
        const [year, month] = period.split('-').map(Number);
        dataToExport = keuanganItems.filter(item => item.year === year && item.month === month);
      }
      
      if (dataToExport.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
      }
      
      const excelData = dataToExport.map(item => ({
        'Tanggal': formatDate(item.date),
        'Tipe': item.type,
        'Kategori': categoryConfig[item.category].label,
        'Nama Item': item.name,
        'Jumlah': item.amount,
        'Mata Uang': item.currency,
        'Status': statusConfig[item.status].label,
        'Cash Flow': cashFlowConfig[item.cash_flow_type].label,
        'Deskripsi': item.description,
        'Dibuat': formatDate(item.created_at),
        'Diperbarui': formatDate(item.updated_at)
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add summary sheet
      const analysisData = getAnalysisData;
      const summaryData = [
        ['RINGKASAN KEUANGAN EKSPOR'],
        [''],
        ['Periode', period || 'Semua Data'],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        [''],
        ['Total Budget', analysisData.totalBudget],
        ['Total Realisasi', analysisData.totalRealisasi],
        ['Variance', analysisData.variance],
        ['Variance %', `${analysisData.variancePercentage.toFixed(2)}%`],
        [''],
        ['Health Status', analysisData.healthStatus]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Data Keuangan');
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');
      
      const fileName = `keuangan-ekspor-${period || 'lengkap'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ File Excel berhasil diunduh! (${dataToExport.length} record)`);
      console.log('Excel export completed successfully');
    } catch (error) {
      console.error('Error during Excel export:', error);
      alert('❌ Gagal mengekspor file Excel. Silakan coba lagi.');
    }
  }, [keuanganItems, formatDate, categoryConfig, statusConfig, cashFlowConfig, getAnalysisData]);

  // Form handlers
  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setFormData({
      type: activeTab === 'budget-planning' ? 'BUDGET' : 'REALISASI',
      name: '',
      category: 'operasional',
      amount: '',
      currency: 'IDR',
      exchange_rate: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'planned',
      cash_flow_type: 'cash-in'
    });
    setIsModalOpen(true);
  }, [activeTab]);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      alert('Nama item harus diisi!');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Jumlah harus lebih dari 0!');
      return;
    }
    
    // Validasi exchange rate untuk non-IDR currency
    if (formData.currency !== 'IDR' && (!formData.exchange_rate || parseFloat(formData.exchange_rate) <= 0)) {
      alert('Rate ke Rupiah harus diisi untuk mata uang asing!');
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      const exchangeRate = formData.currency === 'IDR' ? 1 : parseFloat(formData.exchange_rate);
      const amountIdr = formData.currency === 'IDR' ? amount : amount * exchangeRate;
      const date = new Date(formData.date);

      const itemData = {
        type: formData.type,
        category: formData.category,
        name: formData.name,
        amount,
        original_amount: amount,
        currency: formData.currency,
        exchange_rate: exchangeRate,
        amount_idr: amountIdr,
        date: formData.date,
        description: formData.description || '',
        status: formData.status,
        cash_flow_type: formData.cash_flow_type,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        lc_number: null
      };

      if (editingItem) {
        await keuanganEksporService.updateKeuanganItem(editingItem.id, itemData);
      } else {
        await keuanganEksporService.createKeuanganItem(itemData);
      }
      
      await refreshData();
      setIsModalOpen(false);
      setEditingItem(null);
      
      // Reset form data
      setFormData({
        type: 'BUDGET',
        name: '',
        category: 'operasional',
        amount: '',
        currency: 'IDR',
        exchange_rate: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'planned',
        cash_flow_type: 'cash-in'
      });
      
      alert(editingItem ? '✅ Item berhasil diperbarui!' : '✅ Item berhasil ditambahkan!');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('❌ Gagal menyimpan item. Silakan coba lagi.');
    }
  }, [formData, editingItem, refreshData]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      try {
        await keuanganEksporService.deleteKeuanganItem(id);
        await refreshData();
        // Notify Executive Dashboard of data change
        notifyKeuanganChange();
        alert('✅ Item berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('❌ Gagal menghapus item. Silakan coba lagi.');
      }
    }
  }, [refreshData, notifyKeuanganChange]);

  const handleEdit = useCallback((item: KeuanganEkspor) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      category: item.category,
      amount: item.amount.toString(),
      currency: item.currency,
      exchange_rate: item.currency === 'IDR' ? '' : item.exchange_rate.toString(),
      date: item.date,
      description: item.description || '',
      status: item.status,
      cash_flow_type: item.cash_flow_type
    });
    setIsModalOpen(true);
  }, []);

  // Main component rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header dengan Integrated Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <DollarSign className="h-10 w-10" />
                  KEUANGAN EKSPOR
                </h1>
                <p className="text-blue-100 text-lg">
                  Management Keuangan Ekspor - Budget Planning, Cashflow Tracking & LC Management
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm">Total Items: {keuanganItems.length}</p>
              </div>
            </div>

            {/* Integrated Tab Navigation */}
            <div className="border-t border-blue-500/30 pt-6">
              <nav className="flex space-x-2">
                {(Object.keys(tabInfoConfig) as TabType[]).map((tab) => {
                  const config = tabInfoConfig[tab];
                  const isActive = activeTab === tab;
                  const IconComponent = tab === 'budget-planning' ? PieChart :
                                     tab === 'cashflow-tracking' ? DollarSign : BarChart3;
                  
                  return (
                    <button
                      key={`${tab}-${forceRenderKey}`}
                      onClick={() => handleTabSwitch(tab)}
                      className={`
                        relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2
                        ${
                          isActive
                            ? 'bg-white text-blue-700 shadow-lg transform scale-105'
                            : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 hover:text-white'
                        }
                      `}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="hidden sm:block">
                        {tab === 'budget-planning' ? 'Budget Planning' :
                         tab === 'cashflow-tracking' ? 'Cashflow Tracking' : 'Analysis'}
                      </span>
                      <span className="sm:hidden">
                        {tab === 'budget-planning' ? 'Budget' :
                         tab === 'cashflow-tracking' ? 'Cashflow' : 'Analysis'}
                      </span>
                      
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-xl shadow-lg"
                          style={{ zIndex: -1 }}
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Info Section */}
          <AnimatePresence>
            {isTabInfoVisible(activeTab) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${tabInfoConfig[activeTab].color} ${tabInfoConfig[activeTab].borderColor} border-t p-6`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Kapan Digunakan</h4>
                    <p className="text-sm text-gray-600">{tabInfoConfig[activeTab].when}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Isi Data</h4>
                    <p className="text-sm text-gray-600">{tabInfoConfig[activeTab].content}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Contoh</h4>
                    <p className="text-sm text-gray-600">{tabInfoConfig[activeTab].example}</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => toggleTabInfo(activeTab)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Toggle Button */}
          {!isTabInfoVisible(activeTab) && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => toggleTabInfo(activeTab)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Lihat Informasi Tab
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${forceRenderKey}`} // Force re-render with key
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Main Content Rendering Logic */}
            {activeTab === 'budget-planning' && (
              <div className="space-y-6">
                {/* Budget Planning Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Budget Planning</h2>
                      <p className="text-gray-600">Buat dan kelola rencana budget untuk kegiatan ekspor</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <ExcelExportButton 
                        data={keuanganItems}
                        activeTab={activeTab}
                        filterPeriod={filterPeriod}
                        className=""
                      />
                      <button
                        onClick={handleAdd}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        Tambah Budget
                      </button>
                    </div>
                  </div>

                  {/* Budget Planning Summary Cards */}
                  {getBudgetPlanningAnalytics.totalItems > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
                    >
                      {/* Total Budget Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Budget</p>
                            <p className="text-lg font-bold text-blue-900">
                              {formatCurrency(getBudgetPlanningAnalytics.totalBudget, 'IDR')}
                            </p>
                            <p className="text-xs text-blue-700">
                              {getBudgetPlanningAnalytics.totalItems} item
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cash In Budget Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Budget Pemasukan</p>
                            <p className="text-lg font-bold text-green-900">
                              {formatCurrency(getBudgetPlanningAnalytics.cashInBudget, 'IDR')}
                            </p>
                            <p className="text-xs text-green-700">
                              {getBudgetPlanningAnalytics.totalBudget > 0 
                                ? `${((getBudgetPlanningAnalytics.cashInBudget / getBudgetPlanningAnalytics.totalBudget) * 100).toFixed(1)}%`
                                : '0%'
                              } dari total
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cash Out Budget Card */}
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-red-600 font-medium">Budget Pengeluaran</p>
                            <p className="text-lg font-bold text-red-900">
                              {formatCurrency(getBudgetPlanningAnalytics.cashOutBudget, 'IDR')}
                            </p>
                            <p className="text-xs text-red-700">
                              {getBudgetPlanningAnalytics.totalBudget > 0 
                                ? `${((getBudgetPlanningAnalytics.cashOutBudget / getBudgetPlanningAnalytics.totalBudget) * 100).toFixed(1)}%`
                                : '0%'
                              } dari total
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Net Budget Planning Card */}
                      <div className={`bg-gradient-to-br ${
                        getBudgetPlanningAnalytics.netBudgetPlanning >= 0 
                          ? 'from-purple-50 to-purple-100 border-purple-200' 
                          : 'from-orange-50 to-orange-100 border-orange-200'
                      } border rounded-xl p-6 shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            getBudgetPlanningAnalytics.netBudgetPlanning >= 0 
                              ? 'bg-purple-500' 
                              : 'bg-orange-500'
                          }`}>
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              getBudgetPlanningAnalytics.netBudgetPlanning >= 0 
                                ? 'text-purple-600' 
                                : 'text-orange-600'
                            }`}>
                              Net Budget Planning
                            </p>
                            <p className={`text-lg font-bold ${
                              getBudgetPlanningAnalytics.netBudgetPlanning >= 0 
                                ? 'text-purple-900' 
                                : 'text-orange-900'
                            }`}>
                              {(() => {
                                const netBudget = getBudgetPlanningAnalytics.netBudgetPlanning;
                                const absValue = Math.abs(netBudget);
                                const prefix = netBudget >= 0 ? '+ ' : '- ';
                                const formattedAmount = new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(absValue);
                                return `${prefix}${formattedAmount}`;
                              })()}
                            </p>
                            <p className={`text-xs ${
                              getBudgetPlanningAnalytics.netBudgetPlanning >= 0 
                                ? 'text-purple-700' 
                                : 'text-orange-700'
                            }`}>
                              {getBudgetPlanningAnalytics.netBudgetPlanning >= 0 ? 'Surplus' : 'Defisit'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Budget Breakdown Section */}
                  {getBudgetPlanningAnalytics.totalItems > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mt-6"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">Breakdown Budget Planning</h3>
                            <p className="text-sm text-gray-600">Distribusi budget berdasarkan kategori dan status</p>
                          </div>
                          <button
                            onClick={toggleBreakdownCollapse}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {isBreakdownCollapsed ? (
                              <>
                                <span>Buka</span>
                                <ChevronDown className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <span>Tutup</span>
                                <ChevronUp className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {!isBreakdownCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                              {/* Category Breakdown */}
                              <div>
                                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                                  <PieChart className="h-4 w-4" />
                                  Berdasarkan Kategori
                                </h4>
                                <div className="space-y-3">
                                  {getBudgetPlanningAnalytics.categoryBreakdown.map(category => (
                                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-800">{category.label}</p>
                                          <p className="text-xs text-gray-500">{category.count} item</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatCurrency(category.amount, selectedCurrency)}
                                        </p>
                                        <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Status Breakdown */}
                              <div>
                                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Berdasarkan Status
                                </h4>
                                <div className="space-y-3">
                                  {getBudgetPlanningAnalytics.statusBreakdown.map(status => (
                                    <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-800">{status.label}</p>
                                          <p className="text-xs text-gray-500">{status.count} item</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatCurrency(status.amount, selectedCurrency)}
                                        </p>
                                        <p className="text-xs text-gray-500">{status.percentage.toFixed(1)}%</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Enhanced Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari budget..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Semua Kategori</option>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    
                    <select
                      value={filterPeriod}
                      onChange={(e) => setFilterPeriod(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Semua Periode</option>
                      {getAvailablePeriods().map(period => {
                        const [year, month] = period.split('-');
                        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                        return (
                          <option key={period} value={period}>{monthName}</option>
                        );
                      })}
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'amount' | 'date' | 'category')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="date">Urutkan: Tanggal</option>
                      <option value="amount">Urutkan: Jumlah</option>
                      <option value="category">Urutkan: Kategori</option>
                    </select>
                  </div>
                </motion.div>

                {/* Budget Items List */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  {getFilteredItems.length === 0 ? (
                    <div className="p-12 text-center">
                      <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-500 mb-2">Belum Ada Data Budget</h3>
                      <p className="text-gray-400 mb-6">Mulai dengan menambahkan item budget pertama Anda</p>
                      <button
                        onClick={handleAdd}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Tambah Budget Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getFilteredItems.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].bgColor} ${categoryConfig[item.category].textColor} ${categoryConfig[item.category].borderColor} border`}>
                                  {categoryConfig[item.category].label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`text-sm font-medium ${
                                  item.cash_flow_type === 'cash-in' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.cash_flow_type === 'cash-in' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                                </div>
                                <div className="text-xs text-gray-500">{item.currency}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {formatDate(item.date)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].color} text-white`}>
                                  {statusConfig[item.status].label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* Similar content for other tabs... */}
            {/* For brevity, I'll include the key structure for other tabs */}
            
            {activeTab === 'cashflow-tracking' && (
              <div className="space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data cashflow...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-red-700 underline hover:text-red-800"
                    >
                      Refresh Halaman
                    </button>
                  </div>
                )}

                {/* Cashflow Tracking Header */}
                {!loading && !error && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cashflow Tracking</h2>
                          <p className="text-gray-600">Kelola arus kas aktual - transaksi riil yang terjadi</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => {
                              setFormData(prev => ({ ...prev, type: 'REALISASI', cash_flow_type: 'cash-in' }));
                              handleAdd();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                          >
                            <TrendingUp className="h-5 w-5" />
                            Cash In
                          </button>
                          <button
                            onClick={() => {
                              setFormData(prev => ({ ...prev, type: 'REALISASI', cash_flow_type: 'cash-out' }));
                              handleAdd();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                          >
                            <TrendingDown className="h-5 w-5" />
                            Cash Out
                          </button>
                          <ExcelExportButton 
                            data={keuanganItems}
                            activeTab={activeTab}
                            filterPeriod={filterPeriod}
                            className=""
                          />
                        </div>
                      </div>

                      {/* Cashflow Summary Cards */}
                      {analyticsData && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="h-8 w-8 text-green-600" />
                              <div>
                                <p className="text-sm text-green-600 font-medium">Total Cash In</p>
                                <p className="text-xl font-bold text-green-800">
                                  {formatCurrency(analyticsData.cashflowSummary?.totalCashIn || 0, 'IDR')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <TrendingDown className="h-8 w-8 text-red-600" />
                              <div>
                                <p className="text-sm text-red-600 font-medium">Total Cash Out</p>
                                <p className="text-xl font-bold text-red-800">
                                  {formatCurrency(analyticsData.cashflowSummary?.totalCashOut || 0, 'IDR')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`${(analyticsData.cashflowSummary?.netCashflow || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                            <div className="flex items-center gap-3">
                              <DollarSign className={`h-8 w-8 ${(analyticsData.cashflowSummary?.netCashflow || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                              <div>
                                <p className={`text-sm font-medium ${(analyticsData.cashflowSummary?.netCashflow || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Cashflow</p>
                                <p className={`text-xl font-bold ${(analyticsData.cashflowSummary?.netCashflow || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                                  {formatCurrency(analyticsData.cashflowSummary?.netCashflow || 0, 'IDR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                        
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Semua Kategori</option>
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Semua Tipe</option>
                          <option value="cash-in">Cash In</option>
                          <option value="cash-out">Cash Out</option>
                        </select>
                        
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'amount' | 'date' | 'category')}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="date">Urutkan: Tanggal</option>
                          <option value="amount">Urutkan: Jumlah</option>
                          <option value="category">Urutkan: Kategori</option>
                        </select>
                      </div>
                    </motion.div>

                    {/* Cashflow Items List */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      {getFilteredItems.length === 0 ? (
                        <div className="p-12 text-center">
                          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-500 mb-2">Belum Ada Transaksi Cashflow</h3>
                          <p className="text-gray-400 mb-6">Mulai dengan menambahkan transaksi cash in atau cash out pertama</p>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={() => {
                                setFormData(prev => ({ ...prev, type: 'REALISASI', cash_flow_type: 'cash-in' }));
                                handleAdd();
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                            >
                              <TrendingUp className="h-5 w-5" />
                              Tambah Cash In
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({ ...prev, type: 'REALISASI', cash_flow_type: 'cash-out' }));
                                handleAdd();
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                            >
                              <TrendingDown className="h-5 w-5" />
                              Tambah Cash Out
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {getFilteredItems.filter(item => item.type === 'REALISASI').map((item, index) => (
                                <motion.tr
                                  key={item.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                      <div className="text-sm text-gray-500">{item.description}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      item.cash_flow_type === 'cash-in' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                      {item.cash_flow_type === 'cash-in' ? (
                                        <><TrendingUp className="h-3 w-3 mr-1" /> Cash In</>
                                      ) : (
                                        <><TrendingDown className="h-3 w-3 mr-1" /> Cash Out</>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].bgColor} ${categoryConfig[item.category].textColor} ${categoryConfig[item.category].borderColor} border`}>
                                      {categoryConfig[item.category].label}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className={`text-sm font-medium ${
                                      item.cash_flow_type === 'cash-in' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {item.cash_flow_type === 'cash-in' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                                    </div>
                                    <div className="text-xs text-gray-500">{item.currency}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {formatDate(item.date)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].color} text-white`}>
                                      {statusConfig[item.status].label}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleEdit(item)}
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data analytics...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-red-700 underline hover:text-red-800"
                    >
                      Refresh Halaman
                    </button>
                  </div>
                )}

                {/* Analysis Content */}
                {!loading && !error && (
                  <>
                    {/* Analysis Header */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics & Analysis</h2>
                          <p className="text-gray-600">Analisis performa keuangan ekspor dengan charts dan insights</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <ExcelExportButton 
                            data={keuanganItems}
                            activeTab={activeTab}
                            filterPeriod={filterPeriod}
                            className=""
                          />
                        </div>
                      </div>

                      {/* Analysis Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Semua Kategori</option>
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterPeriod}
                          onChange={(e) => setFilterPeriod(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Semua Periode</option>
                          {getAvailablePeriods().map(period => {
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
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {SUPPORTED_CURRENCIES.map(currency => (
                            <option key={currency.code} value={currency.code}>
                              {currency.flagIcon} {currency.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>

                    {/* KPI Cards */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <PieChart className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Total Budget</p>
                            <p className="text-xl font-bold text-gray-800">
                              {formatCurrency(getAnalysisData.totalBudget, selectedCurrency)}
                            </p>
                            <p className="text-xs text-gray-500">Planned amount</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Total Realisasi</p>
                            <p className="text-xl font-bold text-gray-800">
                              {formatCurrency(getAnalysisData.totalRealisasi, selectedCurrency)}
                            </p>
                            <p className="text-xs text-gray-500">Actual amount</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            getAnalysisData.variance >= 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {getAnalysisData.variance >= 0 ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Variance</p>
                            <p className={`text-xl font-bold ${
                              getAnalysisData.variance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(getAnalysisData.variance, selectedCurrency)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getAnalysisData.variancePercentage >= 0 ? '+' : ''}
                              {getAnalysisData.variancePercentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            getAnalysisData.healthStatus === 'good' ? 'bg-green-100' :
                            getAnalysisData.healthStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <BarChart3 className={`h-6 w-6 ${
                              getAnalysisData.healthStatus === 'good' ? 'text-green-600' :
                              getAnalysisData.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Health Status</p>
                            <p className={`text-lg font-bold ${
                              getAnalysisData.healthStatus === 'good' ? 'text-green-600' :
                              getAnalysisData.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {getAnalysisData.healthStatus === 'good' ? 'Excellent' :
                               getAnalysisData.healthStatus === 'warning' ? 'Warning' : 'Critical'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.abs(getAnalysisData.variancePercentage).toFixed(1)}% variance
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Budget vs Actual Chart */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Budget vs Actual</h3>
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="h-64">
                          <Bar
                            data={{
                              labels: getAnalysisData.categoryAnalysis?.map(item => categoryConfig[item.category]?.label || item.category) || [],
                              datasets: [
                                {
                                  label: 'Budget',
                                  data: getAnalysisData.categoryAnalysis?.map(item => item.budget) || [],
                                  backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                  borderColor: 'rgba(59, 130, 246, 1)',
                                  borderWidth: 1
                                },
                                {
                                  label: 'Actual',
                                  data: getAnalysisData.categoryAnalysis?.map(item => item.realisasi) || [],
                                  backgroundColor: 'rgba(16, 185, 129, 0.5)',
                                  borderColor: 'rgba(16, 185, 129, 1)',
                                  borderWidth: 1
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top' as const,
                                },
                                title: {
                                  display: false
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: function(value) {
                                      return formatCurrency(Number(value), selectedCurrency);
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* Category Distribution Chart */}
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Distribution by Category</h3>
                          <PieChart className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="h-64">
                          <Pie
                            data={{
                              labels: getAnalysisData.categoryAnalysis.map(item => categoryConfig[item.category].label),
                              datasets: [
                                {
                                  data: getAnalysisData.categoryAnalysis.map(item => item.realisasi),
                                  backgroundColor: [
                                    'rgba(59, 130, 246, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(139, 92, 246, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(107, 114, 128, 0.8)'
                                  ],
                                  borderColor: [
                                    'rgba(59, 130, 246, 1)',
                                    'rgba(16, 185, 129, 1)',
                                    'rgba(139, 92, 246, 1)',
                                    'rgba(245, 158, 11, 1)',
                                    'rgba(107, 114, 128, 1)'
                                  ],
                                  borderWidth: 2
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom' as const,
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const value = context.parsed;
                                      const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                                      const percentage = ((value / total) * 100).toFixed(1);
                                      return `${context.label}: ${formatCurrency(value, selectedCurrency)} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Cashflow Trend Chart */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Cashflow Trend Analysis</h3>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="h-80">
                        <Line
                          data={{
                            labels: getAvailablePeriods().reverse().map(period => {
                              const [year, month] = period.split('-');
                              return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                            }),
                            datasets: [
                              {
                                label: 'Cash In',
                                data: getAvailablePeriods().reverse().map(period => {
                                  const [year, month] = period.split('-').map(Number);
                                  return keuanganItems
                                    .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-in')
                                    .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
                                }),
                                borderColor: 'rgba(16, 185, 129, 1)',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.4,
                                fill: true
                              },
                              {
                                label: 'Cash Out',
                                data: getAvailablePeriods().reverse().map(period => {
                                  const [year, month] = period.split('-').map(Number);
                                  return keuanganItems
                                    .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-out')
                                    .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
                                }),
                                borderColor: 'rgba(239, 68, 68, 1)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.4,
                                fill: true
                              },
                              {
                                label: 'Net Cashflow',
                                data: getAvailablePeriods().reverse().map(period => {
                                  const [year, month] = period.split('-').map(Number);
                                  const cashIn = keuanganItems
                                    .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-in')
                                    .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
                                  const cashOut = keuanganItems
                                    .filter(item => item.year === year && item.month === month && item.cash_flow_type === 'cash-out')
                                    .reduce((sum, item) => sum + (item.amount_idr || item.amount), 0);
                                  return cashIn - cashOut;
                                }),
                                borderColor: 'rgba(59, 130, 246, 1)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4,
                                borderDash: [5, 5]
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: function(value) {
                                    return formatCurrency(Number(value), selectedCurrency);
                                  }
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
                    </motion.div>

                    {/* Detailed Analysis Table */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Detailed Analysis by Category</h3>
                        <p className="text-sm text-gray-600 mt-1">Budget vs Actual performance per category</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance %</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getAnalysisData.categoryAnalysis.map((item, index) => (
                              <tr key={item.category} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].bgColor} ${categoryConfig[item.category].textColor} ${categoryConfig[item.category].borderColor} border`}>
                                    {categoryConfig[item.category].label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(item.budget, selectedCurrency)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(item.realisasi, selectedCurrency)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${
                                    item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance, selectedCurrency)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${
                                    item.variancePercentage !== null && item.variancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {item.variancePercentage !== null ? (
                                      `${item.variancePercentage >= 0 ? '+' : ''}${item.variancePercentage.toFixed(1)}%`
                                    ) : (
                                      'N/A'
                                    )}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    item.variancePercentage === null ? 'bg-gray-100 text-gray-800' :
                                    Math.abs(item.variancePercentage) <= 10 ? 'bg-green-100 text-green-800' :
                                    Math.abs(item.variancePercentage) <= 25 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {item.variancePercentage === null ? 'N/A' :
                                     Math.abs(item.variancePercentage) <= 10 ? 'Excellent' :
                                     Math.abs(item.variancePercentage) <= 25 ? 'Warning' : 'Critical'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* LC Integration Summary */}
                    {letterOfCredits.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Letter of Credit Summary</h3>
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-6 w-6 text-blue-600" />
                              <div>
                                <p className="text-sm text-blue-600 font-medium">Total LCs</p>
                                <p className="text-xl font-bold text-blue-800">{lcAnalytics.totalLCs}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="text-sm text-green-600 font-medium">Active LCs</p>
                                <p className="text-xl font-bold text-green-800">{lcAnalytics.activeLCs}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <Clock className="h-6 w-6 text-yellow-600" />
                              <div>
                                <p className="text-sm text-yellow-600 font-medium">Expiring Soon</p>
                                <p className="text-xl font-bold text-yellow-800">{lcAnalytics.expiringSoon}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">Total LC Value</p>
                              <p className="text-lg font-bold text-gray-800">{formatCurrency(lcAnalytics.totalLCValue, 'USD')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Utilization Rate</p>
                              <p className="text-lg font-bold text-gray-800">{lcAnalytics.utilizationRate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Form Modal */}
        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          title={editingItem ? 'Edit Item Keuangan' : 'Tambah Item Keuangan'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BUDGET">Budget</option>
                <option value="REALISASI">Realisasi</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nama item"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      currency: newCurrency,
                      exchange_rate: newCurrency === 'IDR' ? '' : prev.exchange_rate
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SUPPORTED_CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flagIcon} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Exchange Rate Field */}
            {formData.currency !== 'IDR' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate ke Rupiah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 15750"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan rate manual, contoh: 15750 untuk 1 USD = Rp 15.750
                  </p>
                </div>
                
                {/* Real-time Preview */}
                {formData.amount && formData.exchange_rate && parseFloat(formData.amount) > 0 && parseFloat(formData.exchange_rate) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-800 font-medium">
                        Setara dengan {formatCurrencyAmount(parseFloat(formData.amount) * parseFloat(formData.exchange_rate), 'IDR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash Flow Type</label>
              <select
                value={formData.cash_flow_type}
                onChange={(e) => setFormData(prev => ({ ...prev, cash_flow_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(cashFlowConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Masukkan deskripsi"
              />
            </div>
          </div>
        </FormModal>
      </div>
    </div>
  );
};

export default KeuanganEksporComponent;