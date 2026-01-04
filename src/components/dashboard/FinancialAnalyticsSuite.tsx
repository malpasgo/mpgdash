import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart,
  DollarSign, Target, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

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

interface FinancialAnalyticsProps {
  data: DashboardData | null;
}

const FinancialAnalyticsSuite: React.FC<FinancialAnalyticsProps> = ({ data }) => {
  const [activeAnalysis, setActiveAnalysis] = useState('waterfall');

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    // Round the amount to remove any decimal places
    const roundedAmount = Math.round(amount);
    
    // Format with Indonesian locale for proper thousand separators (dots)
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(roundedAmount);
    
    // Return with "Rp" prefix and proper formatting
    return `Rp ${formatted}`;
  };

  // Waterfall Chart Data
  const waterfallData = useMemo(() => {
    if (!data) return null;
    
    const revenue = data.revenue.current;
    const operationalCosts = Math.round(revenue * 0.35); // 35% operational costs
    const marketingCosts = Math.round(revenue * 0.08);   // 8% marketing costs
    const logisticsCosts = Math.round(revenue * 0.15);   // 15% logistics costs
    const adminCosts = Math.round(revenue * 0.07);       // 7% admin costs
    const netProfit = Math.round(revenue - (operationalCosts + marketingCosts + logisticsCosts + adminCosts));
    
    return {
      series: [{
        name: 'Cash Flow',
        data: [
          { x: 'Starting Revenue', y: revenue },
          { x: 'Operational Costs', y: -operationalCosts },
          { x: 'Marketing Costs', y: -marketingCosts },
          { x: 'Logistics Costs', y: -logisticsCosts },
          { x: 'Admin Costs', y: -adminCosts },
          { x: 'Net Profit', y: netProfit }
        ]
      }],
      costs: {
        operationalCosts,
        marketingCosts,
        logisticsCosts,
        adminCosts,
        totalCosts: Math.round(operationalCosts + marketingCosts + logisticsCosts + adminCosts),
        netProfit
      }
    };
  }, [data]);

  // Predictive Cash Flow Data
  const cashFlowForecast = useMemo(() => {
    if (!data) return null;
    
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate forecast based on current trends and seasonality
    const historical = data.revenue.monthlyTrends.map(trend => trend.revenue);
    const avgGrowth = data.revenue.growth / 100;
    const baseRevenue = data.revenue.current;
    const outstandingReceivables = data.cashFlow.outstandingReceivables;
    
    const forecast = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const seasonalFactor = 1 + (Math.sin((monthIndex / 12) * 2 * Math.PI) * 0.2); // 20% seasonal variation
      const projectedRevenue = baseRevenue * (1 + avgGrowth * i) * seasonalFactor;
      const projectedCashIn = projectedRevenue * (data.cashFlow.paymentCollectionRate / 100);
      const projectedCashOut = projectedRevenue * 0.7; // Assumed 70% cost ratio
      
      forecast.push({
        month: months[monthIndex],
        cashIn: Math.round(projectedCashIn),
        cashOut: Math.round(projectedCashOut),
        netCashFlow: Math.round(projectedCashIn - projectedCashOut),
        outstandingProjection: Math.round(outstandingReceivables * Math.max(0.5, 1 - (i * 0.1))) // Gradual collection
      });
    }
    
    return forecast;
  }, [data]);

  // Expense Treemap Data
  const expenseTreemapData = useMemo(() => {
    if (!waterfallData) return null;
    
    return [
      {
        x: 'Operational',
        y: waterfallData.costs.operationalCosts
      },
      {
        x: 'Logistics',
        y: waterfallData.costs.logisticsCosts
      },
      {
        x: 'Marketing',
        y: waterfallData.costs.marketingCosts
      },
      {
        x: 'Administration',
        y: waterfallData.costs.adminCosts
      }
    ];
  }, [waterfallData]);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-white/10 rounded-2xl h-80" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-2xl h-60" />
            <div className="bg-white/10 rounded-2xl h-60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        /* Cash Flow Chart Data Labels - Using rel attribute selectors */
        .apexcharts-datalabel[rel="0"] .apexcharts-datalabel-label {
          background-color: #10B981 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        .apexcharts-datalabel[rel="1"] .apexcharts-datalabel-label {
          background-color: #EF4444 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        .apexcharts-datalabel[rel="2"] .apexcharts-datalabel-label {
          background-color: #3B82F6 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        
        /* Cash Flow Chart Data Labels - Using series class selectors */
        .apexcharts-series-0 .apexcharts-datalabel-label {
          background-color: #10B981 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        .apexcharts-series-1 .apexcharts-datalabel-label {
          background-color: #EF4444 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        .apexcharts-series-2 .apexcharts-datalabel-label {
          background-color: #3B82F6 !important;
          color: white !important;
          border: 1px solid white !important;
          border-radius: 4px !important;
          padding: 4px !important;
        }
        
        /* Cash Flow Chart Data Labels - Additional background element targeting */
        .apexcharts-series-0 .apexcharts-datalabel-background {
          fill: #10B981 !important;
        }
        .apexcharts-series-1 .apexcharts-datalabel-background {
          fill: #EF4444 !important;
        }
        .apexcharts-series-2 .apexcharts-datalabel-background {
          fill: #3B82F6 !important;
        }
        
        /* Cash Flow Chart Data Labels - Direct background targeting by data-series-index */
        g[data-series-index="0"] .apexcharts-datalabel-background {
          fill: #10B981 !important;
        }
        g[data-series-index="1"] .apexcharts-datalabel-background {
          fill: #EF4444 !important;
        }
        g[data-series-index="2"] .apexcharts-datalabel-background {
          fill: #3B82F6 !important;
        }
        
        /* Text color for all cash flow data labels */
        .apexcharts-datalabel-label tspan {
          fill: #ffffff !important;
        }
      `}</style>
      {/* Dashboard Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Advanced Financial Analytics Suite
        </h2>
        <p className="text-gray-300">
          Comprehensive financial performance analysis and forecasting
        </p>
      </div>

      {/* Financial Analytics Tabs */}
      <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis}>
                <div className="flex justify-center mb-6">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-200/50 flex-wrap justify-center">
            <TabsTrigger value="waterfall" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Waterfall Analysis
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Cash Flow Analysis
            </TabsTrigger>
            <TabsTrigger value="expenses" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Expense Breakdown
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="waterfall" className="space-y-6">
          {/* Waterfall Chart Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Profitability Waterfall Analysis
                </h3>
                <p className="text-gray-600">
                  Revenue breakdown showing path from gross revenue to net profit
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {data.summary.period}
                </Badge>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  waterfallData && waterfallData.costs.netProfit > 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {waterfallData && waterfallData.costs.netProfit > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>Net Profit: {waterfallData && formatCurrency(waterfallData.costs.netProfit)}</span>
                </div>
              </div>
            </div>
            
            {waterfallData && (
              <div className="h-96">
                <Chart
                  type="bar"
                  height={384}
                  series={[{
                    name: 'Amount',
                    data: [
                      { x: 'Starting Revenue', y: waterfallData.costs.operationalCosts + waterfallData.costs.marketingCosts + waterfallData.costs.logisticsCosts + waterfallData.costs.adminCosts + waterfallData.costs.netProfit },
                      { x: 'Operational', y: -waterfallData.costs.operationalCosts },
                      { x: 'Marketing', y: -waterfallData.costs.marketingCosts },
                      { x: 'Logistics', y: -waterfallData.costs.logisticsCosts },
                      { x: 'Administration', y: -waterfallData.costs.adminCosts },
                      { x: 'Net Profit', y: waterfallData.costs.netProfit }
                    ]
                  }]}
                  options={{
                    chart: {
                      type: 'bar',
                      stacked: false,
                      toolbar: { show: false }
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: '60%',
                        borderRadius: 8
                      }
                    },
                    colors: ['#3B82F6', '#EF4444', '#EF4444', '#EF4444', '#EF4444', '#10B981'],
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number) => formatCurrency(val),
                      style: {
                        fontSize: '12px',
                        fontWeight: 600
                      }
                    },
                    xaxis: {
                      categories: ['Starting Revenue', 'Operational', 'Marketing', 'Logistics', 'Administration', 'Net Profit'],
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        }
                      }
                    },
                    yaxis: {
                      labels: {
                        formatter: (val: number) => formatCurrency(val)
                      }
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) => formatCurrency(val)
                      }
                    },
                    grid: {
                      borderColor: '#F3F4F6',
                      strokeDashArray: 3
                    },
                    theme: {
                      mode: 'light'
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.revenue.current)}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Costs</p>
                  <p className="text-xl font-bold text-gray-900">
                    {waterfallData && formatCurrency(waterfallData.costs.totalCosts)}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className="text-xl font-bold text-gray-900">
                    {waterfallData && formatCurrency(waterfallData.costs.netProfit)}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <p className="text-xl font-bold text-gray-900">
                    {waterfallData && ((waterfallData.costs.netProfit / data.revenue.current) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          {/* Predictive Cash Flow Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Predictive Cash Flow Forecasting
                </h3>
                <p className="text-gray-600">
                  12-month cash flow projection based on current trends and patterns
                </p>
              </div>
            </div>
            
            {cashFlowForecast && (
              <div className="h-96">
                <Chart
                  type="area"
                  height={384}
                  series={[
                    {
                      name: 'Cash In',
                      data: cashFlowForecast.map(item => item.cashIn)
                    },
                    {
                      name: 'Cash Out',
                      data: cashFlowForecast.map(item => item.cashOut)
                    },
                    {
                      name: 'Net Cash Flow',
                      data: cashFlowForecast.map(item => item.netCashFlow)
                    }
                  ]}
                  options={{
                    chart: {
                      type: 'area',
                      stacked: false,
                      toolbar: { show: false }
                    },
                    colors: ['#10B981', '#EF4444', '#3B82F6'],
                    dataLabels: {
                      enabled: true,
                      formatter: function(val: number, opts: any) {
                        return formatCurrency(val);
                      },
                      style: {
                        fontSize: '12px',
                        fontWeight: 600
                      },
                      background: {
                        enabled: true,
                        foreColor: '#fff',
                        borderRadius: 4,
                        padding: 4,
                        opacity: 0.8
                      }
                    },
                    fill: {
                      type: 'gradient',
                      gradient: {
                        opacityFrom: 0.1,
                        opacityTo: 0.0
                      }
                    },
                    stroke: {
                      curve: 'smooth',
                      width: 3
                    },
                    xaxis: {
                      categories: cashFlowForecast.map(item => item.month),
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        }
                      }
                    },
                    yaxis: {
                      labels: {
                        formatter: (val: number) => formatCurrency(val)
                      }
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) => formatCurrency(val)
                      }
                    },
                    legend: {
                      position: 'top',
                      horizontalAlign: 'right'
                    },
                    grid: {
                      borderColor: '#F3F4F6',
                      strokeDashArray: 3
                    }
                  }}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Expense Analysis Treemap */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Expense Analysis Treemap
                </h3>
                <p className="text-gray-600">
                  Visual breakdown of cost categories by size and impact
                </p>
              </div>
            </div>
            
            {expenseTreemapData && (
              <div className="h-96">
                <Chart
                  type="treemap"
                  height={384}
                  series={[{
                    data: expenseTreemapData
                  }]}
                  options={{
                    chart: {
                      type: 'treemap',
                      toolbar: { show: false }
                    },
                    colors: ['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'],
                    plotOptions: {
                      treemap: {
                        enableShades: true,
                        shadeIntensity: 0.5,
                        reverseNegativeShade: true,
                        colorScale: {
                          ranges: [
                            {
                              from: 0,
                              to: 1000000000,
                              color: '#EF4444'
                            },
                            {
                              from: 1000000000,
                              to: 2000000000,
                              color: '#F59E0B'
                            },
                            {
                              from: 2000000000,
                              to: 3000000000,
                              color: '#3B82F6'
                            }
                          ]
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        fontSize: '14px',
                        fontWeight: 600,
                        colors: ['#fff']
                      },
                      formatter: (text: string, op: any): string => {
                        return `${text}: ${formatCurrency(op.value)}`;
                      }
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number) => formatCurrency(val)
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {expenseTreemapData && expenseTreemapData.map((expense, index) => {
              const colors = ['blue', 'red', 'yellow', 'purple'];
              const icons = [Activity, TrendingDown, BarChart3, PieChart];
              const Icon = icons[index];
              const percentage = waterfallData ? ((expense.y / waterfallData.costs.totalCosts) * 100).toFixed(1) : '0';
              
              return (
                <motion.div
                  key={expense.x}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-${colors[index]}-500 to-${colors[index]}-600 shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{expense.x} Costs</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.y)}</p>
                      <p className="text-xs text-gray-500">{percentage}% of total costs</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalyticsSuite;