import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, FileText, 
  AlertTriangle, Download, RefreshCw, Settings, Calendar,
  Filter, BarChart3, PieChart, LineChart, Eye, EyeOff,
  Maximize2, ChevronUp, ChevronDown, Bell, CheckCircle,
  Clock, AlertCircle, Info, Target, CreditCard, Wallet
} from 'lucide-react';
import { dashboardAnalyticsService, catatanPentingService, CatatanPentingItem, alertsService } from '../lib/supabase';
import { useDashboardDataSync } from '../contexts/DataSyncContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement
);

interface DashboardData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    avgOrderValue: number;
    byCurrency: Record<string, any>;
    monthlyTrends: Array<{month: string; revenue: number; count: number}>;
  };
  cashFlow: {
    outstandingReceivables: number;
    paymentCollectionRate: number;
    avgPaymentDays: number;
    paidAmount: number;
  };
  operations: {
    activeLCs: number;
    expiringLCs: number;
    invoiceAging: Record<string, number>;
    totalInvoices: number;
  };
  customers: {
    topCustomers: Array<{name: string; revenue: number; count: number}>;
    geoRevenue: Record<string, number>;
    newCustomers: number;
    returningCustomers: number;
  };
  summary: {
    totalRevenue: number;
    totalLCs: number;
    totalInvoices: number;
    totalPayments: number;
    period: string;
  };
}

interface AlertData {
  alerts: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    data: any;
    created_at: string;
    action_required: boolean;
    action_url: string;
    priority: 'critical' | 'high' | 'medium';
    category: string;
  }>;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    actionRequired: number;
  };
  last_updated: string;
}

interface ChartData {
  chart_data: {
    type: string;
    data: any[];
    labels: string[];
    datasets: any[];
  };
  chart_type: string;
  period: string;
  filters: any;
  generated_at: string;
}

type DateRange = '7' | '30' | '90' | '180' | '365' | 'custom';
type DashboardLayout = 'executive' | 'operations' | 'finance';

const ExecutiveDashboard: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [catatanPentingData, setCatatanPentingData] = useState<CatatanPentingItem[]>([]);
  const [businessAlertsData, setBusinessAlertsData] = useState<{
    receivables: any[];
    overdueInvoices: any[];
    lcExpiry: any[];
  }>({ receivables: [], overdueInvoices: [], lcExpiry: [] });
  const [chartData, setChartData] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [layout, setLayout] = useState<DashboardLayout>('executive');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [selectedWidgets, setSelectedWidgets] = useState({
    kpiCards: true,
    revenueChart: true,
    alertsPanel: true,
    topCustomers: true,
    cashFlowChart: true,
    lcStatus: true,
    invoiceAging: true,
    exportSegmentBreakdown: true  // Renamed from currencyBreakdown for better context
  });

  // Data sync integration for real-time updates
  const { refreshDashboard, lastUpdated, isRefreshing, connectionStatus, forceRefresh } = useDashboardDataSync();

  // Fetch dashboard analytics data with improved date processing
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate and process custom date range
      if (dateRange === 'custom') {
        if (!customDateRange.start || !customDateRange.end) {
          setError('Silakan pilih tanggal mulai dan tanggal akhir untuk periode custom');
          setLoading(false);
          return;
        }
        
        // Process dates with proper timezone handling
        const startDate = new Date(customDateRange.start + 'T00:00:00');
        const endDate = new Date(customDateRange.end + 'T23:59:59');
        
        // Validate date objects
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          setError('Format tanggal tidak valid. Silakan pilih ulang tanggal.');
          setLoading(false);
          return;
        }
        
        if (startDate > endDate) {
          setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
          setLoading(false);
          return;
        }
        
        // Fix date comparison logic - allow today as end date
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        
        const endDateTime = new Date(customDateRange.end + 'T23:59:59');
        if (endDateTime > today) {
          setError('Tanggal akhir tidak boleh di masa depan');
          setLoading(false);
          return;
        }
        
        // Check if date range is reasonable (max 2 years)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 730) {
          setError('Periode custom maksimal 2 tahun');
          setLoading(false);
          return;
        }
      }

      // Format dates properly for backend API
      const startParam = dateRange === 'custom' ? customDateRange.start : undefined;
      const endParam = dateRange === 'custom' ? customDateRange.end : undefined;
      
      const data = await dashboardAnalyticsService.getDashboardData(
        dateRange,
        startParam,
        endParam
      );

      setDashboardData(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      
      // Enhanced error handling for different error types
      if (err.message?.includes('custom: Invalid date format')) {
        setError('Format tanggal tidak valid. Silakan pilih ulang tanggal.');
      } else if (err.message?.includes('custom: Start date and end date are required')) {
        setError('Tanggal mulai dan akhir harus diisi untuk periode custom.');
      } else if (err.message?.includes('custom: End date cannot be in the future')) {
        setError('Tanggal akhir tidak boleh di masa depan.');
      } else if (err.message?.includes('custom:')) {
        setError('Gagal memproses periode custom. ' + err.message.replace('custom: ', ''));
      } else if (err.message?.includes('API key')) {
        setError('Konfigurasi API key belum lengkap. Silakan hubungi administrator.');
      } else if (err.code === 'PGRST116' || err.message?.includes('database')) {
        setError('Koneksi database bermasalah. Silakan coba lagi dalam beberapa saat.');
      } else {
        setError(err.message || 'Gagal mengambil data dashboard. Silakan refresh halaman.');
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, customDateRange]);

  // Fetch alerts data with error handling - now just for compatibility, real data comes from catatan penting
  const fetchAlertsData = useCallback(async () => {
    try {
      const data = await dashboardAnalyticsService.getRealTimeAlerts();
      setAlertData(data);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      // Provide fallback alerts data to prevent complete failure
      setAlertData({
        alerts: [],
        summary: {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0,
          actionRequired: 0
        },
        last_updated: new Date().toISOString()
      });
    }
  }, []);

  // Fetch all alert data for comprehensive notifications
  const fetchAllAlertsData = useCallback(async () => {
    try {
      // Fetch Catatan Penting data
      const catatanData = await catatanPentingService.getActiveCatatanPenting();
      setCatatanPentingData(catatanData);

      // Fetch Business Alerts data
      const [receivablesData, overdueInvoicesData, lcExpiryData] = await Promise.all([
        alertsService.getOutstandingReceivablesAlerts(),
        alertsService.getOverdueInvoicesAlerts(),
        alertsService.getLCExpiryAlerts()
      ]);

      setBusinessAlertsData({
        receivables: receivablesData,
        overdueInvoices: overdueInvoicesData,
        lcExpiry: lcExpiryData
      });

      console.log(`Loaded alerts - Catatan: ${catatanData.length}, Receivables: ${receivablesData.length}, Overdue: ${overdueInvoicesData.length}, LC: ${lcExpiryData.length}`);
    } catch (err: any) {
      console.error('Error fetching alerts data:', err);
      // Fallback to empty arrays
      setCatatanPentingData([]);
      setBusinessAlertsData({ receivables: [], overdueInvoices: [], lcExpiry: [] });
    }
  }, []);

  // Fetch chart data with error handling
  const fetchChartData = useCallback(async (chartType: string) => {
    try {
      const startParam = dateRange === 'custom' ? customDateRange.start : undefined;
      const endParam = dateRange === 'custom' ? customDateRange.end : undefined;
      
      const data = await dashboardAnalyticsService.getChartData(
        chartType,
        dateRange,
        'month',
        startParam,
        endParam
      );
      
      setChartData(prev => ({ ...prev, [chartType]: data }));
    } catch (err: any) {
      console.error(`Error fetching chart data for ${chartType}:`, err);
      
      // Provide fallback chart data structure
      const fallbackChartData = {
        chart_data: {
          type: 'bar',
          data: [],
          labels: [],
          datasets: [{
            label: 'No Data Available',
            data: [],
            backgroundColor: 'rgba(156, 163, 175, 0.5)',
            borderColor: 'rgba(156, 163, 175, 1)'
          }]
        },
        chart_type: chartType,
        period: dateRange === 'custom' ? 'Custom Period (No Data)' : `${dateRange} hari terakhir (No Data)`,
        filters: { dateRange, groupBy: 'month' },
        generated_at: new Date().toISOString()
      };
      
      setChartData(prev => ({ ...prev, [chartType]: fallbackChartData }));
    }
  }, [dateRange, customDateRange]);

  // Auto-refresh functionality with smart custom date handling
  useEffect(() => {
    // Don't auto-fetch data if custom date range is selected but not yet filled
    if (dateRange === 'custom' && (!customDateRange.start || !customDateRange.end)) {
      console.log('Skipping auto-fetch for custom date range - waiting for user input');
      return;
    }
    
    fetchDashboardData();
    fetchAlertsData();
    fetchAllAlertsData(); // Load all alert data including catatan penting + business alerts
    
    // Fetch chart data for enabled widgets
    if (selectedWidgets.revenueChart) fetchChartData('revenue_trend');
    if (selectedWidgets.topCustomers) fetchChartData('top_customers');
    if (selectedWidgets.cashFlowChart) fetchChartData('cash_flow_projection');
    if (selectedWidgets.lcStatus) fetchChartData('lc_status_distribution');
    if (selectedWidgets.invoiceAging) fetchChartData('invoice_aging');
    if (selectedWidgets.exportSegmentBreakdown) fetchChartData('revenue_by_currency'); // Export segments breakdown
  }, [fetchDashboardData, fetchAlertsData, fetchChartData, selectedWidgets, forceRefresh, dateRange, customDateRange]);

  // Manual refresh with data sync integration
  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchAlertsData(),
      fetchAllAlertsData(), // Include all alerts refresh
      refreshDashboard()
    ]);
  }, [fetchDashboardData, fetchAlertsData, fetchAllAlertsData, refreshDashboard]);

  // Handle date range change with smart custom handling
  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    // Clear any existing errors when changing date range
    if (error) {
      setError(null);
    }
    
    // If switching TO custom, clear existing custom dates and don't auto-fetch
    if (newDateRange === 'custom') {
      setCustomDateRange({ start: '', end: '' });
      setDateRange(newDateRange);
      console.log('Switched to custom date range - waiting for user input');
      return;
    }
    
    // If switching FROM custom to predefined period, clear custom dates
    if (dateRange === 'custom') {
      setCustomDateRange({ start: '', end: '' });
    }
    
    setDateRange(newDateRange);
    console.log(`Switched to predefined date range: ${newDateRange}`);
  }, [error, dateRange]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAlertsData();
      fetchAllAlertsData(); // Include auto refresh for all alerts
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData, fetchAlertsData]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Get growth indicator
  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const growth = ((current - previous) / previous) * 100;
    return {
      value: growth,
      isPositive: growth >= 0,
      icon: growth >= 0 ? TrendingUp : TrendingDown,
      color: growth >= 0 ? 'text-green-600' : 'text-red-600'
    };
  };

  // KPI Card Component - Optimized Professional Design
  const KPICard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    trend?: any;
    icon: React.FC<{ className?: string }>;
    color: string;
    loading?: boolean;
  }> = ({ title, value, subtitle, trend, icon: Icon, color, loading }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 relative overflow-hidden min-h-[160px] group"
    >
      {/* Background accent for visual depth */}
      <div className={`absolute top-0 left-0 w-1 h-full ${color} opacity-60`}></div>
      
      {/* Content Section */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : (
              <p className={`font-bold text-gray-900 leading-tight ${
                title === "Total Revenue" || title === "Outstanding Receivables" 
                  ? "text-2xl" 
                  : "text-3xl"
              }`}>{value}</p>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          )}
          
          {trend && (
            <div className={`flex items-center space-x-1 ${trend.color}`}>
              <trend.icon className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Icon - Absolutely positioned for perfect alignment */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className={`p-3.5 rounded-xl ${color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Subtle background pattern for professional look */}
      <div className="absolute bottom-0 right-0 w-24 h-24 opacity-5">
        <Icon className="w-full h-full text-gray-400" />
      </div>
    </motion.div>
  );

  // Chart Component
  const ChartWidget: React.FC<{
    title: string;
    chartType: string;
    height?: number;
    className?: string;
  }> = ({ title, chartType, height = 300, className = '' }) => {
    const data = chartData[chartType];
    
    if (!data) {
      return (
        <Card className={`bg-white p-6 ${className}`}>
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Card>
      );
    }

    const ChartComponent = {
      line: Line,
      bar: Bar,
      pie: Pie,
      doughnut: Doughnut
    }[data.chart_data.type] || Bar;

    // Create chart-specific tooltip configurations
    const getTooltipConfig = (chartType: string) => {
      switch (chartType) {
        case 'revenue_trend':
          return {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed?.y || context.parsed || context.raw;
                const label = context.dataset.label || '';
                
                // Format the value based on whether it's revenue or growth rate
                if (label === 'Revenue (IDR)') {
                  return `${label}: ${formatCurrency(value)}`;
                } else if (label === 'Revenue Growth Rate (%)') {
                  // Format growth rate as percentage with proper sign and decimal places
                  const formattedValue = value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
                  return `${label}: ${formattedValue}`;
                }
                
                return `${label}: ${typeof value === 'number' ? formatCurrency(value) : value}`;
              }
            }
          };
          
        case 'lc_status_distribution':
          return {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || context.raw;
                // For LC status, show count not currency
                return `${label}: ${value} LC`;
              }
            }
          };
          
        case 'top_customers':
          return {
            callbacks: {
              label: function(context: any) {
                const customerName = context.label || '';
                const value = context.parsed?.y || context.parsed || context.raw;
                return `${customerName} - ${formatCurrency(value)}`;
              }
            }
          };
          
        case 'cash_flow_projection':
          return {
            callbacks: {
              label: function(context: any) {
                const date = context.label || '';
                const value = context.parsed?.y || context.parsed || context.raw;
                return `Tanggal: ${date} - Cash Flow: ${formatCurrency(value)}`;
              }
            }
          };
          
        case 'invoice_aging':
          return {
            callbacks: {
              label: function(context: any) {
                const period = context.label || '';
                const value = context.parsed?.y || context.parsed || context.raw;
                const dataPoint = context.raw;
                
                if (typeof dataPoint === 'object' && dataPoint !== null) {
                  const count = dataPoint.count || '';
                  const amount = dataPoint.amount || dataPoint.y || dataPoint;
                  
                  if (count && typeof count === 'number') {
                    return `Period: ${period} - Jumlah: ${count} invoice - Total: ${formatCurrency(amount)}`;
                  }
                }
                
                return `Period: ${period} - Total: ${formatCurrency(value)}`;
              }
            }
          };
          
        case 'revenue_by_currency':
          return {
            callbacks: {
              label: function(context: any) {
                const currency = context.label || '';
                const value = context.parsed || context.raw;
                return `${currency}: ${formatCurrency(value)}`;
              }
            }
          };
          
        default:
          // Generic fallback for other chart types
          return {
            callbacks: {
              label: function(context: any) {
                const value = context.parsed?.y || context.parsed || context.raw;
                if (typeof value === 'number') {
                  return `${context.dataset.label || ''}: ${formatCurrency(value)}`;
                }
                return `${context.dataset.label || ''}: ${value}`;
              }
            }
          };
      }
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
        tooltip: getTooltipConfig(chartType)
      },
      scales: data.chart_data.type === 'pie' || data.chart_data.type === 'doughnut' ? {} : {
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              // Format left Y-axis for currency (Revenue)
              const numValue = typeof value === 'number' ? value : parseFloat(value);
              if (numValue >= 1000000000) {
                return `${Math.round(numValue / 1000000000)}M`;
              } else if (numValue >= 1000000) {
                return `${Math.round(numValue / 1000000)}Jt`;
              } else if (numValue >= 1000) {
                return `${Math.round(numValue / 1000)}Rb`;
              }
              return Math.round(numValue).toString();
            }
          }
        },
        y1: {
          type: 'linear' as const,
          position: 'right' as const,
          beginAtZero: false,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function(value: any) {
              // Format right Y-axis for percentage (Growth Rate)
              const numValue = typeof value === 'number' ? value : parseFloat(value);
              return `${numValue.toFixed(1)}%`;
            }
          }
        }
      }
    };

    return (
      <Card className={`bg-white p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="outline" size="sm" onClick={() => fetchChartData(chartType)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div style={{ height }}>
          <ChartComponent data={data.chart_data} options={chartOptions} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Data periode: {data.period}
        </p>
      </Card>
    );
  };

  // Alerts Panel Component - Integrated with ALL 4 Types of Real Data
  const AlertsPanel: React.FC = () => {
    // Priority order for sorting (Higher number = Higher priority)
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    // Priority to Indonesian mapping
    const priorityLabels = {
      critical: 'Critical',
      high: 'High', 
      medium: 'Medium',
      low: 'Low'
    };

    // Create combined alerts from all sources
    const allAlerts = [];

    // 1. Catatan Penting Alerts (existing functionality)
    const catatanAlerts = catatanPentingData.map((catatan) => ({
      id: `catatan-${catatan.id}`,
      type: 'CATATAN_PENTING',
      severity: catatan.priority === 'critical' ? 'critical' as const : 
               catatan.priority === 'high' ? 'warning' as const : 'info' as const,
      title: `${priorityLabels[catatan.priority]} - ${catatan.title}`,
      message: catatan.description || '',
      data: catatan,
      created_at: catatan.created_at,
      action_required: true,
      action_url: '/catatan',
      priority: catatan.priority,
      category: 'catatan_penting',
      sortOrder: priorityOrder[catatan.priority]
    }));

    // 2. Outstanding Receivables Alerts
    const receivablesAlerts = businessAlertsData.receivables.map((receivable) => ({
      id: `receivables-${receivable.id}`,
      type: 'OUTSTANDING_RECEIVABLES',
      severity: receivable.remaining_amount_idr > 1500000000 ? 'critical' as const :
               receivable.remaining_amount_idr > 1000000000 ? 'warning' as const : 'info' as const,
      title: `Outstanding Receivables Tinggi`,
      message: `${alertsService.formatCurrency(receivable.remaining_amount_idr)} - ${receivable.customer_name}`,
      data: receivable,
      created_at: new Date().toISOString(),
      action_required: true,
      action_url: '/payment-terms',
      priority: receivable.remaining_amount_idr > 1500000000 ? 'critical' : 
               receivable.remaining_amount_idr > 1000000000 ? 'high' : 'medium',
      category: 'receivables',
      sortOrder: receivable.remaining_amount_idr > 1500000000 ? 4 : 
                 receivable.remaining_amount_idr > 1000000000 ? 3 : 2
    }));

    // 3. Invoice Overdue Alerts
    const overdueAlerts = businessAlertsData.overdueInvoices.map((invoice) => ({
      id: `overdue-${invoice.id}`,
      type: 'INVOICE_OVERDUE',
      severity: invoice.overdue_days > 30 ? 'critical' as const : 
               invoice.overdue_days > 7 ? 'warning' as const : 'info' as const,
      title: `Invoice ${invoice.invoice_number} Overdue`,
      message: `${invoice.overdue_days} hari - ${invoice.customer_name}`,
      data: invoice,
      created_at: new Date().toISOString(),
      action_required: true,
      action_url: '/invoice-management',
      priority: invoice.overdue_days > 30 ? 'critical' : 
               invoice.overdue_days > 7 ? 'high' : 'medium',
      category: 'invoice_overdue',
      sortOrder: invoice.overdue_days > 30 ? 4 : invoice.overdue_days > 7 ? 3 : 2
    }));

    // 4. LC Expiry Alerts
    const lcExpiryAlerts = businessAlertsData.lcExpiry.map((lc) => ({
      id: `lc-expiry-${lc.id}`,
      type: 'LC_EXPIRY',
      severity: lc.days_to_expiry <= 7 ? 'critical' as const : 
               lc.days_to_expiry <= 14 ? 'warning' as const : 'info' as const,
      title: `${lc.lc_number} akan berakhir dalam ${lc.days_to_expiry} hari`,
      message: `${lc.applicant} - ${alertsService.formatCurrency(lc.amount_idr)}`,
      data: lc,
      created_at: new Date().toISOString(),
      action_required: true,
      action_url: '/lc-management',
      priority: lc.days_to_expiry <= 7 ? 'critical' : 
               lc.days_to_expiry <= 14 ? 'high' : 'medium',
      category: 'lc_expiry',
      sortOrder: lc.days_to_expiry <= 7 ? 4 : lc.days_to_expiry <= 14 ? 3 : 2
    }));

    // Combine all alerts
    allAlerts.push(...catatanAlerts, ...receivablesAlerts, ...overdueAlerts, ...lcExpiryAlerts);

    // Sort by priority (sortOrder) and then by creation date
    const sortedAlerts = allAlerts
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return b.sortOrder - a.sortOrder; // Higher priority first
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 8); // Limit to 8 items for better UX
      
    // Navigation handler for action buttons
    const handleActionClick = (actionUrl: string, alertType: string) => {
      if (!onNavigate) {
        console.warn('Navigation function not provided to ExecutiveDashboard');
        return;
      }
      
      // Map alert URLs to actual navigation pages
      let targetPage = 'executive'; // default fallback
      
      if (actionUrl.includes('invoice')) {
        targetPage = 'invoice';
      } else if (actionUrl.includes('payment')) {
        targetPage = 'payment';
      } else if (actionUrl.includes('lc')) {
        targetPage = 'lc';
      } else if (actionUrl.includes('catatan')) {
        targetPage = 'catatan';
      } else if (alertType === 'OUTSTANDING_RECEIVABLES') {
        targetPage = 'payment';
      } else if (alertType === 'INVOICE_OVERDUE') {
        targetPage = 'invoice';
      } else if (alertType === 'LC_EXPIRY') {
        targetPage = 'lc';
      }
      
      console.log(`Navigating to: ${targetPage} from ${alertType} alert`);
      onNavigate(targetPage);
    };
    
    return (
      <Card className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifikasi & Alert
          </h3>
          {sortedAlerts.length > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {sortedAlerts.length} notifikasi
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 overflow-y-auto" style={{ height: 425 }}>
          {sortedAlerts.length > 0 ? sortedAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                alert.severity === 'critical' ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' :
                alert.severity === 'warning' ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500' :
                'bg-gray-50 hover:bg-gray-100 border-l-4 border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 truncate">{alert.title}</h4>
                {alert.message && (
                  <p className="text-xs text-gray-600 truncate mt-1">{alert.message}</p>
                )}
              </div>
              
              <div className="ml-3 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleActionClick(alert.action_url, alert.type)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs font-medium"
                >
                  Lihat
                </Button>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tidak ada notifikasi saat ini</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading && !dashboardData && !(dateRange === 'custom' && (!customDateRange.start || !customDateRange.end))) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-white p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Gagal Memuat Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          
          {/* Specific help for custom date range errors */}
          {error.includes('custom') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
              <h4 className="font-semibold text-blue-800 mb-2">Tips untuk Periode Custom:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pastikan kedua tanggal (mulai dan akhir) sudah dipilih</li>
                <li>• Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir</li>
                <li>• Tanggal akhir boleh sampai hari ini (2025-08-20)</li>
                <li>• Tanggal akhir tidak boleh di masa depan</li>
                <li>• Maksimal periode 2 tahun</li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={handleManualRefresh} disabled={loading || isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Coba Lagi'}
            </Button>
            
            {dateRange === 'custom' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCustomDateRange({ start: '', end: '' });
                  setDateRange('30');
                  setError(null);
                }}
              >
                Reset ke 30 Hari
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Executive Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview Keuangan Ekspor - Update terakhir: {format(lastRefresh, 'dd MMM yyyy HH:mm', { locale: localeId })}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600">
              {connectionStatus === 'connected' ? 'Real-time' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Periode:</label>
            <select 
              value={dateRange} 
              onChange={(e) => handleDateRangeChange(e.target.value as DateRange)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="7">7 Hari</option>
              <option value="30">30 Hari</option>
              <option value="90">90 Hari</option>
              <option value="180">6 Bulan</option>
              <option value="365">1 Tahun</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className={`${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Periode Custom:</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai:</label>
                <input 
                  type="date" 
                  value={customDateRange.start}
                  onChange={(e) => {
                    setCustomDateRange(prev => ({ ...prev, start: e.target.value }));
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Akhir:</label>
                <input 
                  type="date" 
                  value={customDateRange.end}
                  onChange={(e) => {
                    setCustomDateRange(prev => ({ ...prev, end: e.target.value }));
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={customDateRange.start || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={fetchDashboardData}
                  disabled={!customDateRange.start || !customDateRange.end || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    'Terapkan'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCustomDateRange({ start: '', end: '' });
                    setDateRange('30');
                  }}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
          {(!customDateRange.start || !customDateRange.end) && (
            <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-md">
              💡 Tip: Pilih tanggal mulai dan tanggal akhir, kemudian klik "Terapkan" untuk melihat data periode custom. Tanggal akhir boleh sampai hari ini.
            </div>
          )}
        </Card>
      )}

      {/* Custom Date Range Waiting State */}
      {dateRange === 'custom' && (!customDateRange.start || !customDateRange.end) && !error && (
        <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Silakan Pilih Periode Custom</h3>
          <p className="text-gray-600 mb-4">
            Untuk melihat data dashboard, pilih tanggal mulai dan tanggal akhir pada form di atas, 
            kemudian klik tombol "Terapkan".
          </p>
          <div className="bg-blue-100 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Panduan Penggunaan:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pilih tanggal mulai terlebih dahulu</li>
              <li>• Kemudian pilih tanggal akhir (boleh sampai hari ini)</li>
              <li>• Pastikan tanggal akhir ≥ tanggal mulai</li>
              <li>• Maksimal periode 2 tahun</li>
              <li>• Klik "Terapkan" untuk memuat data</li>
            </ul>
          </div>
        </Card>
      )}

      {dashboardData && (
        <>
          {/* KPI Cards */}
          {selectedWidgets.kpiCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <KPICard
                title="Total Revenue"
                value={formatCurrency(dashboardData.revenue.current)}
                subtitle={`Periode: ${dashboardData.summary.period}`}
                trend={getGrowthIndicator(dashboardData.revenue.current, dashboardData.revenue.previous)}
                icon={DollarSign}
                color="bg-blue-500"
              />
              
              <KPICard
                title="Outstanding Receivables"
                value={formatCurrency(dashboardData.cashFlow.outstandingReceivables)}
                subtitle={`Collection Rate: ${dashboardData.cashFlow.paymentCollectionRate.toFixed(1)}%`}
                icon={Wallet}
                color="bg-green-500"
              />
              
              <KPICard
                title="Active LCs"
                value={formatNumber(dashboardData.operations.activeLCs)}
                subtitle={`${dashboardData.operations.expiringLCs} akan expired`}
                icon={FileText}
                color="bg-purple-500"
              />
              
              <KPICard
                title="Average Payment Days"
                value={`${dashboardData.cashFlow.avgPaymentDays.toFixed(0)} hari`}
                subtitle={`${dashboardData.operations.totalInvoices} total invoices`}
                icon={Clock}
                color="bg-orange-500"
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend Chart */}
            {selectedWidgets.revenueChart && (
              <div className="lg:col-span-8">
                <ChartWidget
                  title="Trend Revenue"
                  chartType="revenue_trend"
                  height={400}
                />
              </div>
            )}
            
            {/* Alerts Panel */}
            {selectedWidgets.alertsPanel && (
              <div className="lg:col-span-4">
                <AlertsPanel />
              </div>
            )}
            
            {/* Top Customers */}
            {selectedWidgets.topCustomers && (
              <div className="lg:col-span-6">
                <ChartWidget
                  title="Top 10 Customers"
                  chartType="top_customers"
                  height={350}
                />
              </div>
            )}
            
            {/* Export Segment Breakdown */}
            {selectedWidgets.exportSegmentBreakdown && (
              <div className="lg:col-span-6">
                <ChartWidget
                  title="Revenue by Export Segment"
                  chartType="revenue_by_currency"
                  height={350}
                />
              </div>
            )}
            
            {/* Cash Flow Projection */}
            {selectedWidgets.cashFlowChart && (
              <div className="lg:col-span-8">
                <ChartWidget
                  title="Cash Flow Projection (90 Hari)"
                  chartType="cash_flow_projection"
                  height={300}
                />
              </div>
            )}
            
            {/* LC Status Distribution */}
            {selectedWidgets.lcStatus && (
              <div className="lg:col-span-4">
                <ChartWidget
                  title="Status Distribusi LC"
                  chartType="lc_status_distribution"
                  height={300}
                />
              </div>
            )}
            
            {/* Invoice Aging */}
            {selectedWidgets.invoiceAging && (
              <div className="lg:col-span-12">
                <ChartWidget
                  title="Invoice Aging Analysis"
                  chartType="invoice_aging"
                  height={300}
                />
              </div>
            )}
          </div>

          {/* Summary Footer - Enhanced for Indonesian Export Finance */}
          <Card className="bg-white p-6">
            <h3 className="text-lg font-semibold mb-4">Ringkasan Periode - Keuangan Ekspor</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(dashboardData.summary.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue (IDR)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatNumber(dashboardData.summary.totalLCs)}</p>
                <p className="text-sm text-gray-600">Letter of Credits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(dashboardData.summary.totalInvoices)}</p>
                <p className="text-sm text-gray-600">Total Invoices</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(dashboardData.summary.totalPayments)}</p>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{dashboardData.revenue.avgOrderValue > 0 ? formatCurrency(dashboardData.revenue.avgOrderValue) : '-'}</p>
                <p className="text-sm text-gray-600">Avg Order Value (IDR)</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Semua nilai dalam Rupiah (IDR) - Aplikasi Keuangan Ekspor Indonesia
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ExecutiveDashboard;