import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { 
  Users, TrendingUp, TrendingDown, MapPin, 
  Target, Activity, UserCheck, UserPlus,
  AlertTriangle, CheckCircle, Clock
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

interface CustomerIntelligenceProps {
  data: DashboardData | null;
}

const CustomerIntelligenceDashboard: React.FC<CustomerIntelligenceProps> = ({ data }) => {
  const [activeView, setActiveView] = useState('clv');

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Customer Lifetime Value Analysis
  const clvAnalysis = useMemo(() => {
    if (!data) return null;
    
    return data.customers.topCustomers.map((customer, index) => {
      // Calculate CLV components
      const avgOrderValue = customer.revenue / customer.count;
      const purchaseFrequency = customer.count / 12; // Per month
      const customerValue = avgOrderValue * purchaseFrequency * 12; // Annual
      const avgLifespan = 3; // years (estimated)
      const clv = customerValue * avgLifespan;
      
      // Risk assessment based on payment patterns
      const riskLevel = customer.revenue > data.revenue.current * 0.3 ? 'High' :
                       customer.revenue > data.revenue.current * 0.15 ? 'Medium' : 'Low';
      
      return {
        ...customer,
        avgOrderValue,
        purchaseFrequency,
        customerValue,
        clv,
        riskLevel,
        loyaltyScore: Math.min(100, (customer.count / 10) * 100) // Based on transaction count
      };
    });
  }, [data]);

  // Customer Journey Funnel Data
  const customerJourneyFunnel = useMemo(() => {
    if (!data) return null;
    
    const totalProspects = 100; // Base 100 for percentage calculation
    const proformaStage = 85; // 85% reach proforma stage
    const commercialStage = 70; // 70% proceed to commercial invoice
    const paymentStage = Math.round(data.cashFlow.paymentCollectionRate); // Based on actual collection rate
    const repeatStage = Math.round((data.customers.returningCustomers / (data.customers.newCustomers + data.customers.returningCustomers)) * 100);
    
    return [
      { stage: 'Inquiry', count: totalProspects, percentage: 100 },
      { stage: 'Quote/Proforma', count: proformaStage, percentage: proformaStage },
      { stage: 'Order/Commercial', count: commercialStage, percentage: commercialStage },
      { stage: 'Payment', count: paymentStage, percentage: paymentStage },
      { stage: 'Repeat Business', count: repeatStage, percentage: repeatStage }
    ];
  }, [data]);

  // Customer Concentration Risk Analysis
  const concentrationRisk = useMemo(() => {
    if (!data || data.customers.topCustomers.length === 0) return null;
    
    const totalRevenue = data.revenue.current;
    const concentrationData = data.customers.topCustomers.map((customer, index) => {
      const percentage = (customer.revenue / totalRevenue) * 100;
      return {
        ...customer,
        percentage,
        rank: index + 1,
        riskLevel: percentage > 30 ? 'Critical' :
                  percentage > 20 ? 'High' :
                  percentage > 10 ? 'Medium' : 'Low'
      };
    });
    
    // Calculate concentration metrics
    const top3Revenue = concentrationData.slice(0, 3).reduce((sum, customer) => sum + customer.revenue, 0);
    const top5Revenue = concentrationData.slice(0, 5).reduce((sum, customer) => sum + customer.revenue, 0);
    const concentrationRatio = (top3Revenue / totalRevenue) * 100;
    
    return {
      customers: concentrationData,
      top3Percentage: (top3Revenue / totalRevenue) * 100,
      top5Percentage: (top5Revenue / totalRevenue) * 100,
      concentrationRatio,
      riskLevel: concentrationRatio > 60 ? 'Critical' :
                concentrationRatio > 40 ? 'High' :
                concentrationRatio > 25 ? 'Medium' : 'Low'
    };
  }, [data]);

  // Geographic Revenue Distribution
  const geoRevenueData = useMemo(() => {
    if (!data) return null;
    
    const regions = Object.entries(data.customers.geoRevenue).map(([region, revenue]) => {
      const percentage = (revenue / data.revenue.current) * 100;
      return {
        region,
        revenue,
        percentage
      };
    }).sort((a, b) => b.revenue - a.revenue);
    
    return regions;
  }, [data]);

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
      {/* Dashboard Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Customer Intelligence Dashboard
        </h2>
        <p className="text-gray-300">
          Deep customer analytics, lifetime value, and behavioral insights
        </p>
      </div>

      {/* Customer Analytics Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <div className="flex justify-center mb-6">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-200/50 flex-wrap justify-center">
            <TabsTrigger value="clv" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Customer Value
            </TabsTrigger>
            <TabsTrigger value="journey" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Journey Map
            </TabsTrigger>
            <TabsTrigger value="concentration" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Concentration Risk
            </TabsTrigger>
            <TabsTrigger value="geographic" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Geographic Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="clv" className="space-y-6">
          {/* CLV Bar Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Customer Lifetime Value Analysis
                </h3>
                <p className="text-gray-600">
                  Top customers ranked by projected lifetime value and loyalty score
                </p>
              </div>
            </div>
            
            {clvAnalysis && (
              <div className="h-96">
                <Chart
                  type="bar"
                  height={384}
                  series={[
                    {
                      name: 'Customer Lifetime Value',
                      data: clvAnalysis.slice(0, 8).map(customer => customer.clv)
                    },
                    {
                      name: 'Current Revenue',
                      data: clvAnalysis.slice(0, 8).map(customer => customer.revenue)
                    }
                  ]}
                  options={{
                    chart: {
                      type: 'bar',
                      toolbar: { show: false }
                    },
                    colors: ['#3B82F6', '#10B981'],
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: '60%',
                        borderRadius: 8
                      }
                    },
                    xaxis: {
                      categories: clvAnalysis.slice(0, 8).map(customer => customer.name),
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        },
                        rotate: -45
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
                    dataLabels: {
                      enabled: false
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

          {/* CLV Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clvAnalysis && clvAnalysis.slice(0, 6).map((customer, index) => {
              const riskColors = {
                High: 'red',
                Medium: 'yellow',
                Low: 'green'
              };
              const riskColor = riskColors[customer.riskLevel as keyof typeof riskColors] || 'gray';
              
              return (
                <motion.div
                  key={customer.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={`text-${riskColor}-700 border-${riskColor}-300`}>
                            {customer.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CLV</span>
                      <span className="font-semibold">{formatCurrency(customer.clv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Revenue</span>
                      <span className="font-semibold">{formatCurrency(customer.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Order Value</span>
                      <span className="font-semibold">{formatCurrency(customer.avgOrderValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Loyalty Score</span>
                      <span className="font-semibold">{customer.loyaltyScore.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {/* Loyalty Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Loyalty Score</span>
                      <span>{customer.loyaltyScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${customer.loyaltyScore}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {/* Customer Journey Funnel */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Customer Journey Funnel
                </h3>
                <p className="text-gray-600">
                  Conversion rates through each stage of the customer acquisition process
                </p>
              </div>
            </div>
            
            {customerJourneyFunnel && (
              <div className="space-y-4">
                {customerJourneyFunnel.map((stage, index) => {
                  const width = stage.percentage;
                  const isLast = index === customerJourneyFunnel.length - 1;
                  const conversionRate = index > 0 ? 
                    ((stage.count / customerJourneyFunnel[index - 1].count) * 100).toFixed(1) : '100.0';
                  
                  return (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="relative"
                    >
                      <div className="flex items-center space-x-4 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-purple-500' : 'bg-red-500'
                        } text-white font-semibold text-sm`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-gray-600">
                                {stage.count}% ({conversionRate}% conversion)
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                              className={`h-4 rounded-full ${
                                index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                index === 2 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                index === 3 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-white drop-shadow">
                                {stage.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Journey Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Customers</p>
                  <p className="text-xl font-bold text-gray-900">{data.customers.newCustomers}</p>
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Returning Customers</p>
                  <p className="text-xl font-bold text-gray-900">{data.customers.returningCustomers}</p>
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerJourneyFunnel ? customerJourneyFunnel[3].percentage : 0}%
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
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerJourneyFunnel ? customerJourneyFunnel[4].percentage : 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="concentration" className="space-y-6">
          {/* Concentration Risk Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Customer Concentration Risk Analysis
                </h3>
                <p className="text-gray-600">
                  Revenue distribution and dependency risk assessment
                </p>
              </div>
              {concentrationRisk && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                  concentrationRisk.riskLevel === 'Critical' ? 'bg-red-50 text-red-700' :
                  concentrationRisk.riskLevel === 'High' ? 'bg-yellow-50 text-yellow-700' :
                  concentrationRisk.riskLevel === 'Medium' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">{concentrationRisk.riskLevel} Risk</span>
                </div>
              )}
            </div>
            
            {concentrationRisk && (
              <div className="h-96">
                <Chart
                  type="pie"
                  height={384}
                  series={concentrationRisk.customers.slice(0, 6).map(customer => customer.percentage)}
                  options={{
                    chart: {
                      type: 'pie'
                    },
                    labels: concentrationRisk.customers.slice(0, 6).map(customer => customer.name),
                    colors: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'],
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '40%'
                        },
                        expandOnClick: false,
                        dataLabels: {
                          offset: -10
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number, opts: any) => {
                        return opts.w.config.labels[opts.seriesIndex] + '\n' + val.toFixed(1) + '%'
                      },
                      style: {
                        fontSize: '12px',
                        fontWeight: 600
                      }
                    },
                    legend: {
                      position: 'bottom',
                      horizontalAlign: 'center',
                      fontSize: '12px'
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number, opts: any) => {
                          const customer = concentrationRisk.customers[opts.seriesIndex];
                          return `${val.toFixed(1)}% (${formatCurrency(customer.revenue)})`;
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {concentrationRisk && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Top 3 Concentration</p>
                      <p className="text-xl font-bold text-gray-900">{concentrationRisk.top3Percentage.toFixed(1)}%</p>
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
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Top 5 Concentration</p>
                      <p className="text-xl font-bold text-gray-900">{concentrationRisk.top5Percentage.toFixed(1)}%</p>
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
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Risk Level</p>
                      <p className="text-xl font-bold text-gray-900">{concentrationRisk.riskLevel}</p>
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
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-xl font-bold text-gray-900">{concentrationRisk.customers.length}</p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          {/* Geographic Revenue Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Geographic Revenue Distribution
                </h3>
                <p className="text-gray-600">
                  Revenue breakdown by customer geographic regions
                </p>
              </div>
            </div>
            
            {geoRevenueData && geoRevenueData.length > 0 && (
              <div className="h-96">
                <Chart
                  type="bar"
                  height={384}
                  series={[{
                    name: 'Revenue by Region',
                    data: geoRevenueData.map(region => region.revenue)
                  }]}
                  options={{
                    chart: {
                      type: 'bar',
                      toolbar: { show: false }
                    },
                    colors: ['#3B82F6'],
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        borderRadius: 8,
                        dataLabels: {
                          position: 'center'
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number) => formatCurrency(val),
                      offsetX: 0,
                      style: {
                        fontSize: '12px',
                        fontWeight: 600,
                        colors: ['#ffffff']
                      }
                    },
                    xaxis: {
                      categories: geoRevenueData.map(region => region.region),
                      labels: {
                        formatter: (val: string) => val
                      }
                    },
                    yaxis: {
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        }
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
                    }
                  }}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerIntelligenceDashboard;