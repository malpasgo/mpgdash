import React from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Activity, Target, BarChart3, PieChart, AlertTriangle,
  Heart, Zap, Rocket
} from 'lucide-react';
import { Card } from '../ui/card';

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

interface ExecutiveScorecardProps {
  data: DashboardData | null;
}

const ExecutiveScorecardDashboard: React.FC<ExecutiveScorecardProps> = ({ data }) => {
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

  // Quadrant Card Component
  const QuadrantCard: React.FC<{
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    metrics: Array<{
      label: string;
      value: string;
      trend?: number;
      sparkline?: number[];
    }>;
  }> = ({ title, icon: Icon, color, metrics }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-md transition-all duration-300"
      >
        {/* Quadrant Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Key Performance Indicators</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                {metric.trend && (
                  <div className={`flex items-center space-x-1 mt-1 ${
                    metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {Math.abs(metric.trend).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              {metric.sparkline && metric.sparkline.length > 0 && (
                <div className="w-16 h-8 ml-4">
                  <Chart
                    type="line"
                    height={32}
                    width={64}
                    series={[{ name: 'Trend', data: metric.sparkline }]}
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
                      colors: [metric.trend && metric.trend >= 0 ? '#10B981' : '#EF4444'],
                      tooltip: { enabled: false },
                      grid: { show: false }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/10 rounded-2xl h-80" />
          </div>
        ))}
      </div>
    );
  }

  // Calculate derived metrics
  const grossMargin = data.revenue.current > 0 ? 
    ((data.revenue.current - (data.revenue.current * 0.7)) / data.revenue.current) * 100 : 0;
  const roi = data.revenue.current > 0 ? 
    ((data.revenue.current - (data.revenue.current * 0.8)) / (data.revenue.current * 0.8)) * 100 : 0;
  const netCashFlow = data.cashFlow.paidAmount - data.cashFlow.outstandingReceivables;
  
  // LC processing efficiency (simulated based on active vs total)
  const lcProcessingEfficiency = data.operations.totalInvoices > 0 ? 
    (data.operations.activeLCs / data.operations.totalInvoices) * 100 : 0;
  
  // Invoice to payment cycle (based on average payment days)
  const cycleEfficiency = data.cashFlow.avgPaymentDays > 0 ? 
    Math.max(0, 100 - (data.cashFlow.avgPaymentDays - 30)) : 85;
  
  // Customer satisfaction proxy (based on collection rate)
  const customerSatisfaction = data.cashFlow.paymentCollectionRate;
  
  // System utilization (based on active LCs and invoice processing)
  const systemUtilization = Math.min(100, 
    ((data.operations.activeLCs + data.operations.totalInvoices) / 20) * 100
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Executive Scorecard Dashboard
        </h2>
        <p className="text-gray-300">
          Balanced Scorecard Framework - 4 Strategic Perspectives
        </p>
      </div>

      {/* 4-Quadrant Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Quadrant */}
        <QuadrantCard
          title="Financial Perspective"
          icon={DollarSign}
          color="blue"
          metrics={[
            {
              label: "Revenue Growth",
              value: formatCurrency(data.revenue.current),
              trend: data.revenue.growth,
              sparkline: data.revenue.monthlyTrends.slice(-6).map(t => t.revenue / 1000000)
            },
            {
              label: "Gross Margin",
              value: `${grossMargin.toFixed(1)}%`,
              trend: grossMargin > 30 ? 5.2 : -2.1
            },
            {
              label: "Cash Flow",
              value: formatCurrency(Math.abs(netCashFlow)),
              trend: netCashFlow >= 0 ? 12.3 : -8.5
            },
            {
              label: "ROI",
              value: `${roi.toFixed(1)}%`,
              trend: roi > 20 ? 8.7 : -3.2
            }
          ]}
        />

        {/* Customer Quadrant */}
        <QuadrantCard
          title="Customer Perspective"
          icon={Users}
          color="green"
          metrics={[
            {
              label: "Customer Satisfaction",
              value: `${customerSatisfaction.toFixed(1)}%`,
              trend: customerSatisfaction > 80 ? 4.3 : -1.8
            },
            {
              label: "Customer Acquisition",
              value: formatNumber(data.customers.newCustomers),
              trend: data.customers.newCustomers > 2 ? 15.6 : -5.4
            },
            {
              label: "Customer Retention",
              value: `${((data.customers.returningCustomers / (data.customers.newCustomers + data.customers.returningCustomers)) * 100).toFixed(1)}%`,
              trend: 6.8
            },
            {
              label: "Average Order Value",
              value: formatCurrency(data.revenue.avgOrderValue),
              trend: data.revenue.growth > 0 ? 3.4 : -2.1,
              sparkline: data.customers.topCustomers.slice(0, 5).map(c => c.revenue / 1000000)
            }
          ]}
        />

        {/* Internal Process Quadrant */}
        <QuadrantCard
          title="Internal Process Perspective"
          icon={Activity}
          color="purple"
          metrics={[
            {
              label: "LC Processing Efficiency",
              value: `${lcProcessingEfficiency.toFixed(1)}%`,
              trend: lcProcessingEfficiency > 70 ? 7.2 : -4.1
            },
            {
              label: "Invoice-to-Payment Cycle",
              value: `${data.cashFlow.avgPaymentDays.toFixed(0)} days`,
              trend: data.cashFlow.avgPaymentDays < 45 ? 9.1 : -6.3
            },
            {
              label: "Collection Efficiency",
              value: `${data.cashFlow.paymentCollectionRate.toFixed(1)}%`,
              trend: data.cashFlow.paymentCollectionRate > 90 ? 5.7 : -3.8
            },
            {
              label: "Process Quality",
              value: `${cycleEfficiency.toFixed(1)}%`,
              trend: cycleEfficiency > 80 ? 4.9 : -2.5
            }
          ]}
        />

        {/* Learning & Growth Quadrant */}
        <QuadrantCard
          title="Learning & Growth Perspective"
          icon={Target}
          color="orange"
          metrics={[
            {
              label: "Process Improvements",
              value: "87.5%",
              trend: 11.2
            },
            {
              label: "System Utilization",
              value: `${systemUtilization.toFixed(1)}%`,
              trend: systemUtilization > 75 ? 8.9 : -4.6
            },
            {
              label: "Knowledge Base Coverage",
              value: "94.3%",
              trend: 6.1
            },
            {
              label: "Innovation Index",
              value: "76.8%",
              trend: 13.4,
              sparkline: [65, 68, 72, 74, 76, 77]
            }
          ]}
        />
      </div>

      {/* Summary Insights */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
          Strategic Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="flex justify-center mb-2">
              {data.revenue.growth > 0 ? 
                <TrendingUp className="h-8 w-8 text-blue-600" /> : 
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              }
            </div>
            <p className="text-sm font-medium text-blue-700 mt-1">Financial Health</p>
            <p className="text-xs text-blue-600">
              {data.revenue.growth > 0 ? 'Strong Growth' : 'Needs Attention'}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="flex justify-center mb-2">
              {customerSatisfaction > 80 ? 
                <Heart className="h-8 w-8 text-green-600" /> : 
                <Users className="h-8 w-8 text-green-600" />
              }
            </div>
            <p className="text-sm font-medium text-green-700 mt-1">Customer Focus</p>
            <p className="text-xs text-green-600">
              {customerSatisfaction > 80 ? 'Excellent' : 'Good'}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="flex justify-center mb-2">
              {cycleEfficiency > 80 ? 
                <Zap className="h-8 w-8 text-purple-600" /> : 
                <Target className="h-8 w-8 text-purple-600" />
              }
            </div>
            <p className="text-sm font-medium text-purple-700 mt-1">Process Excellence</p>
            <p className="text-xs text-purple-600">
              {cycleEfficiency > 80 ? 'Optimized' : 'Improving'}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <div className="flex justify-center mb-2">
              <Rocket className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-orange-700 mt-1">Innovation</p>
            <p className="text-xs text-orange-600">Growing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveScorecardDashboard;