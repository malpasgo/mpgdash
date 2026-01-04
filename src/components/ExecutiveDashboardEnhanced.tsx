import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, FileText, 
  AlertTriangle, RefreshCw, Target, CreditCard, Wallet,
  BarChart3, PieChart, LineChart, Activity, Clock,
  AlertCircle, CheckCircle, Calendar, Filter, Bell
} from 'lucide-react';
import { dashboardAnalyticsService, catatanPentingService, CatatanPentingItem, alertsService } from '../lib/supabase';
import { useDashboardDataSync } from '../contexts/DataSyncContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// ApexCharts imports
import Chart from 'react-apexcharts';

// Enhanced Dashboard Components
import ExecutiveScorecardDashboard from './dashboard/ExecutiveScorecardDashboard';
import FinancialAnalyticsSuite from './dashboard/FinancialAnalyticsSuite';
import CustomerIntelligenceDashboard from './dashboard/CustomerIntelligenceDashboard';
import RiskManagementDashboard from './dashboard/RiskManagementDashboard';
import OperationalEfficiencyDashboard from './dashboard/OperationalEfficiencyDashboard';

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

type DateRange = '7' | '30' | '90' | '180' | '365';

interface ExecutiveDashboardEnhancedProps {
  onNavigate?: (page: string) => void;
}

const ExecutiveDashboardEnhanced: React.FC<ExecutiveDashboardEnhancedProps> = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [catatanPentingData, setCatatanPentingData] = useState<CatatanPentingItem[]>([]);
  const [businessAlertsData, setBusinessAlertsData] = useState<{
    receivables: any[];
    overdueInvoices: any[];
    lcExpiry: any[];
  }>({ receivables: [], overdueInvoices: [], lcExpiry: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [activeTab, setActiveTab] = useState('live-alert');
  
  const handleTabChange = (value: string) => {
    console.log('📊 ExecutiveDashboard: Tab changing to:', value);
    setActiveTab(value);
    console.log('📊 ExecutiveDashboard: Active tab set to:', value);
  };
  
  // Debug current active tab
  console.log('📊 ExecutiveDashboard: Current activeTab state:', activeTab);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data sync integration for real-time updates
  const { refreshDashboard, lastUpdated, isRefreshing, connectionStatus, forceRefresh } = useDashboardDataSync();

  // Fetch dashboard analytics data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardAnalyticsService.getDashboardData(dateRange);
      setDashboardData(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Fetch all alert data
  const fetchAllAlertsData = useCallback(async () => {
    try {
      const catatanData = await catatanPentingService.getActiveCatatanPenting();
      setCatatanPentingData(catatanData);

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
    } catch (err: any) {
      console.error('Error fetching alerts data:', err);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
    fetchAllAlertsData();
  }, [fetchDashboardData, fetchAllAlertsData, dateRange, forceRefresh]);

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchAllAlertsData(),
      refreshDashboard()
    ]);
  }, [fetchDashboardData, fetchAllAlertsData, refreshDashboard]);

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

  // Navigation handlers for alerts
  const handleAlertNavigation = (alert: any, type: 'receivable' | 'lc') => {
    if (!onNavigate) return;
    
    if (type === 'receivable') {
      // Navigate to Invoice Management for receivable alerts
      onNavigate('invoice');
    } else if (type === 'lc') {
      // Navigate to LC Management for LC-related alerts
      onNavigate('lc');
    }
  };

  const handleCriticalNoteNavigation = (note: any) => {
    if (!onNavigate) return;
    
    // Check if note is LC-related
    const isLCRelated = note.title?.toLowerCase().includes('lc') || 
                       note.title?.toLowerCase().includes('letter of credit') ||
                       note.description?.toLowerCase().includes('lc') ||
                       note.description?.toLowerCase().includes('letter of credit');
    
    if (isLCRelated) {
      onNavigate('lc');
    } else {
      onNavigate('catatan');
    }
  };

  // KPI Card Component
  const KPICard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<any>;
    trend?: { value: number; isPositive: boolean };
    color?: string;
    sparklineData?: number[];
  }> = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', sparklineData }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-8">
            <Chart
              type="line"
              height={32}
              series={[{ name: 'Trend', data: sparklineData }]}
              options={{
                chart: {
                  type: 'line',
                  sparkline: { enabled: true },
                  animations: { enabled: true, speed: 400 }
                },
                stroke: {
                  curve: 'smooth',
                  width: 2
                },
                colors: [`var(--color-${color}-500)`],
                tooltip: { enabled: false },
                grid: { show: false },
                xaxis: { labels: { show: false } },
                yaxis: { labels: { show: false } }
              }}
            />
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-white/10 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-white/10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Dashboard Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={handleManualRefresh} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalAlerts = catatanPentingData.length + businessAlertsData.receivables.length + 
                     businessAlertsData.overdueInvoices.length + businessAlertsData.lcExpiry.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Executive Dashboard
              </h1>
              <p className="text-gray-600">
                Comprehensive business intelligence and real-time analytics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">6 Months</option>
                <option value="365">1 Year</option>
              </select>
              
              {/* Alerts Badge */}
              {totalAlerts > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    {totalAlerts} Alerts
                  </span>
                </div>
              )}
              
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border ${
                connectionStatus === 'connected' 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium capitalize">{connectionStatus}</span>
              </div>
              
              {/* Refresh Button */}
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Last Updated Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {format(lastUpdated || lastRefresh, 'PPpp', { locale: localeId })}
            </p>
          </div>
        </div>

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(dashboardData?.revenue.current || 0)}
            subtitle="Current Period"
            icon={DollarSign}
            trend={dashboardData ? getGrowthIndicator(dashboardData.revenue.current, dashboardData.revenue.previous) : undefined}
            color="blue"
            sparklineData={dashboardData?.revenue.monthlyTrends.slice(-7).map(t => t.revenue) || []}
          />
          
          <KPICard
            title="Outstanding Receivables"
            value={formatCurrency(dashboardData?.cashFlow.outstandingReceivables || 0)}
            subtitle={`${dashboardData?.cashFlow.paymentCollectionRate.toFixed(1)}% Collection Rate`}
            icon={CreditCard}
            color="orange"
          />
          
          <KPICard
            title="Active LCs"
            value={formatNumber(dashboardData?.operations.activeLCs || 0)}
            subtitle={`${dashboardData?.operations.expiringLCs || 0} Expiring Soon`}
            icon={FileText}
            color="green"
          />
          
          <KPICard
            title="Business Alerts"
            value={formatNumber(totalAlerts)}
            subtitle="Require Attention"
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Enhanced Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-200/50 flex-wrap justify-center">
              <TabsTrigger value="live-alert" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Live Alerts
              </TabsTrigger>
              <TabsTrigger value="scorecard" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Executive Scorecard
              </TabsTrigger>
              <TabsTrigger value="financial" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Financial Analytics
              </TabsTrigger>
              <TabsTrigger value="customer" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Customer Intelligence
              </TabsTrigger>
              <TabsTrigger value="risk" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Risk Management
              </TabsTrigger>
              <TabsTrigger value="operations" className="px-4 sm:px-6 py-3 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                Operations
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content will be added in the next components */}
          <div className="min-h-[600px]">
            <TabsContent value="live-alert" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Business Alerts and Critical Notes Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Alerts */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Business Alerts</h3>
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      {businessAlertsData.receivables.length + businessAlertsData.overdueInvoices.length + businessAlertsData.lcExpiry.length} Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-120 overflow-y-auto">
                    {/* Outstanding Receivables Alerts */}
                    {businessAlertsData.receivables.slice(0, 3).map((alert, index) => (
                      <motion.div
                        key={`receivable-${alert.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl border border-red-200 cursor-pointer hover:bg-red-100 hover:shadow-md transition-all duration-200"
                        onClick={() => handleAlertNavigation(alert, 'receivable')}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-red-900">{alert.invoice_number}</p>
                          <p className="text-sm text-red-700">
                            Outstanding: {formatCurrency(alert.remaining_amount_idr)}
                          </p>
                          <p className="text-xs text-red-600">
                            {alert.overdue_days} days overdue
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* LC Expiry Alerts */}
                    {businessAlertsData.lcExpiry.slice(0, 3).map((alert, index) => (
                      <motion.div
                        key={`lc-${alert.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (businessAlertsData.receivables.length + index) * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 hover:shadow-md transition-all duration-200"
                        onClick={() => handleAlertNavigation(alert, 'lc')}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500 text-white">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900">{alert.lc_number}</p>
                          <p className="text-sm text-yellow-700">
                            Value: {formatCurrency(alert.amount_idr)}
                          </p>
                          <p className="text-xs text-yellow-600">
                            Expires in {alert.days_to_expiry} days
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Show message when no alerts */}
                    {businessAlertsData.receivables.length === 0 && businessAlertsData.lcExpiry.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">No Active Business Alerts</p>
                        <p className="text-sm">All payments and LCs are on track!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Critical Notes */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Critical Notes</h3>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      {catatanPentingData.length} Items
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-120 overflow-y-auto">
                    {catatanPentingData.slice(0, 6).map((note, index) => {
                      const priorityColors = {
                        critical: 'red',
                        high: 'yellow',
                        medium: 'blue',
                        low: 'green'
                      };
                      const color = priorityColors[note.priority] || 'gray';
                      
                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-start space-x-3 p-3 bg-${color}-50 rounded-xl border border-${color}-200 cursor-pointer hover:bg-${color}-100 hover:shadow-md transition-all duration-200`}
                          onClick={() => handleCriticalNoteNavigation(note)}
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${color}-500 text-white mt-0.5`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-${color}-900`}>{note.title}</p>
                            {note.description && (
                              <p className={`text-sm text-${color}-700 line-clamp-2`}>
                                {note.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className={`text-${color}-700 border-${color}-300 text-xs`}>
                                {note.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className={`text-${color}-700 border-${color}-300 text-xs`}>
                                {note.status}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {/* Show message when no notes */}
                    {catatanPentingData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">No Critical Notes</p>
                        <p className="text-sm">All critical items have been addressed!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </TabsContent>
            
            <TabsContent value="scorecard" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ExecutiveScorecardDashboard data={dashboardData} />
            </TabsContent>
            
            <TabsContent value="financial" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FinancialAnalyticsSuite data={dashboardData} />
            </TabsContent>
            
            <TabsContent value="customer" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CustomerIntelligenceDashboard data={dashboardData} />
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <RiskManagementDashboard 
                data={dashboardData}
                businessAlerts={businessAlertsData}
                catatanPenting={catatanPentingData}
              />
            </TabsContent>
            
            <TabsContent value="operations" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <OperationalEfficiencyDashboard data={dashboardData} />
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutiveDashboardEnhanced;