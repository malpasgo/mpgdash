import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { 
  AlertTriangle, Shield, TrendingDown, Clock,
  FileText, CreditCard, Calendar, Activity,
  CheckCircle, XCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { CatatanPentingItem } from '../../lib/supabase';

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

interface RiskManagementProps {
  data: DashboardData | null;
  businessAlerts: {
    receivables: any[];
    overdueInvoices: any[];
    lcExpiry: any[];
  };
  catatanPenting: CatatanPentingItem[];
}

const RiskManagementDashboard: React.FC<RiskManagementProps> = ({ data, businessAlerts, catatanPenting }) => {
  const [activeRiskView, setActiveRiskView] = useState('heatmap');

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Risk Heat Map Data
  const riskHeatmapData = useMemo(() => {
    if (!data) return [];
    
    const risks = [
      {
        category: 'Payment Risk',
        risks: [
          {
            name: 'Overdue Invoices',
            probability: businessAlerts.overdueInvoices.length > 0 ? Math.min(90, businessAlerts.overdueInvoices.length * 15) : 10,
            impact: businessAlerts.overdueInvoices.reduce((sum, inv) => sum + inv.total_amount_idr, 0) / 1000000000, // In billions
            severity: businessAlerts.overdueInvoices.length > 3 ? 'Critical' : businessAlerts.overdueInvoices.length > 1 ? 'High' : 'Medium'
          },
          {
            name: 'Outstanding Receivables',
            probability: data.cashFlow.outstandingReceivables > data.revenue.current ? 85 : 45,
            impact: data.cashFlow.outstandingReceivables / 1000000000,
            severity: data.cashFlow.outstandingReceivables > data.revenue.current * 1.5 ? 'Critical' : 'High'
          },
          {
            name: 'Collection Rate',
            probability: 100 - data.cashFlow.paymentCollectionRate,
            impact: (data.revenue.current * (100 - data.cashFlow.paymentCollectionRate) / 100) / 1000000000,
            severity: data.cashFlow.paymentCollectionRate < 70 ? 'Critical' : data.cashFlow.paymentCollectionRate < 85 ? 'High' : 'Medium'
          }
        ]
      },
      {
        category: 'Operational Risk',
        risks: [
          {
            name: 'LC Expiry',
            probability: businessAlerts.lcExpiry.length > 0 ? Math.min(95, businessAlerts.lcExpiry.length * 25) : 5,
            impact: businessAlerts.lcExpiry.reduce((sum, lc) => sum + lc.amount_idr, 0) / 1000000000,
            severity: businessAlerts.lcExpiry.length > 2 ? 'Critical' : businessAlerts.lcExpiry.length > 0 ? 'High' : 'Low'
          },
          {
            name: 'Process Efficiency',
            probability: data.cashFlow.avgPaymentDays > 60 ? 70 : 30,
            impact: 2.5,
            severity: data.cashFlow.avgPaymentDays > 90 ? 'Critical' : data.cashFlow.avgPaymentDays > 60 ? 'High' : 'Medium'
          },
          {
            name: 'System Issues',
            probability: catatanPenting.filter(item => item.priority === 'critical').length > 0 ? 60 : 20,
            impact: 1.8,
            severity: catatanPenting.filter(item => item.priority === 'critical').length > 2 ? 'Critical' : 'Medium'
          }
        ]
      },
      {
        category: 'Customer Risk',
        risks: [
          {
            name: 'Customer Concentration',
            probability: data.customers.topCustomers.length > 0 ? 
              (data.customers.topCustomers[0].revenue / data.revenue.current) * 100 : 25,
            impact: data.customers.topCustomers.length > 0 ? data.customers.topCustomers[0].revenue / 1000000000 : 1,
            severity: data.customers.topCustomers.length > 0 && 
                     (data.customers.topCustomers[0].revenue / data.revenue.current) > 0.4 ? 'Critical' : 'Medium'
          },
          {
            name: 'New Customer Acquisition',
            probability: data.customers.newCustomers < 3 ? 65 : 25,
            impact: 1.5,
            severity: data.customers.newCustomers < 2 ? 'High' : 'Medium'
          },
          {
            name: 'Customer Retention',
            probability: data.customers.returningCustomers < data.customers.newCustomers ? 55 : 25,
            impact: 2.0,
            severity: data.customers.returningCustomers < data.customers.newCustomers * 0.5 ? 'High' : 'Medium'
          }
        ]
      }
    ];
    
    return risks;
  }, [data, businessAlerts, catatanPenting]);

  // Key Risk Indicators (KRI)
  const kriMetrics = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        name: 'Collection Rate',
        value: data.cashFlow.paymentCollectionRate,
        target: 90,
        unit: '%',
        status: data.cashFlow.paymentCollectionRate >= 90 ? 'Good' : 
               data.cashFlow.paymentCollectionRate >= 75 ? 'Warning' : 'Critical',
        trend: data.revenue.growth > 0 ? 'up' : 'down'
      },
      {
        name: 'Overdue Ratio',
        value: businessAlerts.overdueInvoices.length > 0 ? 
               (businessAlerts.overdueInvoices.length / data.operations.totalInvoices) * 100 : 0,
        target: 10,
        unit: '%',
        status: (businessAlerts.overdueInvoices.length / data.operations.totalInvoices) * 100 <= 10 ? 'Good' : 
               (businessAlerts.overdueInvoices.length / data.operations.totalInvoices) * 100 <= 20 ? 'Warning' : 'Critical',
        trend: businessAlerts.overdueInvoices.length > 5 ? 'down' : 'up'
      },
      {
        name: 'LC Expiry Alert',
        value: businessAlerts.lcExpiry.length,
        target: 2,
        unit: 'LCs',
        status: businessAlerts.lcExpiry.length <= 2 ? 'Good' : 
               businessAlerts.lcExpiry.length <= 5 ? 'Warning' : 'Critical',
        trend: businessAlerts.lcExpiry.length > 3 ? 'down' : 'up'
      },
      {
        name: 'Cash Flow Health',
        value: Math.min(100, (data.cashFlow.paidAmount / data.cashFlow.outstandingReceivables) * 100),
        target: 80,
        unit: '%',
        status: (data.cashFlow.paidAmount / data.cashFlow.outstandingReceivables) * 100 >= 80 ? 'Good' : 
               (data.cashFlow.paidAmount / data.cashFlow.outstandingReceivables) * 100 >= 60 ? 'Warning' : 'Critical',
        trend: data.revenue.growth > 0 ? 'up' : 'down'
      }
    ];
  }, [data, businessAlerts]);

  // Invoice Aging Analysis
  const invoiceAgingAnalysis = useMemo(() => {
    if (!data) return null;
    
    const aging = data.operations.invoiceAging;
    const total = Object.values(aging).reduce((sum, amount) => sum + amount, 0);
    
    return {
      categories: Object.keys(aging),
      amounts: Object.values(aging),
      percentages: Object.values(aging).map(amount => total > 0 ? (amount / total) * 100 : 0),
      total
    };
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
          Risk Management Dashboard
        </h2>
        <p className="text-gray-300">
          Comprehensive risk assessment, monitoring, and early warning system
        </p>
      </div>

      {/* Risk Management Tabs */}
      <Tabs value={activeRiskView} onValueChange={setActiveRiskView} className="space-y-6">
        <div className="flex justify-center mb-6">
          <TabsList className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-200/50 flex-wrap justify-center">
            <TabsTrigger value="heatmap" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Risk Heatmap
            </TabsTrigger>
            <TabsTrigger value="kri" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              KRI Monitor
            </TabsTrigger>
            <TabsTrigger value="aging" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
              Aging Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="heatmap" className="space-y-6">
          {/* Risk Heat Map */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Risk Heat Map (Probability vs Impact)
                </h3>
                <p className="text-gray-600">
                  Visual assessment of risk probability and business impact
                </p>
              </div>
            </div>
            
            <div className="h-96">
              <Chart
                type="bar"
                height={384}
                series={riskHeatmapData.map((category, categoryIndex) => ({
                  name: category.category,
                  data: category.risks.map(risk => ({
                    x: risk.name,
                    y: risk.probability,
                    z: risk.impact,
                    severity: risk.severity
                  }))
                }))}
                options={{
                  chart: {
                    type: 'bar',
                    toolbar: { show: false }
                  },
                  colors: ['#EF4444', '#F59E0B', '#3B82F6'],
                  xaxis: {
                    title: {
                      text: 'Probability (%)',
                      style: {
                        fontSize: '14px',
                        fontWeight: 600
                      }
                    },
                    min: 0,
                    max: 100,
                    tickAmount: 10
                  },
                  yaxis: {
                    title: {
                      text: 'Risk Categories',
                      style: {
                        fontSize: '14px',
                        fontWeight: 600
                      }
                    }
                  },
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
                    formatter: (val: number) => {
                      return val.toFixed(2) + '%';
                    },
                    style: {
                      colors: ['#ffffff'],
                      fontSize: '12px',
                      fontWeight: 600
                    }
                  },
                  tooltip: {
                    custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                      const risk = riskHeatmapData[seriesIndex].risks[dataPointIndex];
                      return `
                        <div class="px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg">
                          <div class="font-semibold">${risk.name}</div>
                          <div class="text-sm">
                            <div>Probability: ${risk.probability.toFixed(2)}%</div>
                            <div>Impact: ${formatCurrency(risk.impact * 1000000000)}</div>
                            <div class="mt-1">
                              <span class="px-2 py-1 rounded text-xs ${
                                risk.severity === 'Critical' ? 'bg-red-500' :
                                risk.severity === 'High' ? 'bg-yellow-500' : 'bg-blue-500'
                              }">
                                ${risk.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      `;
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
          </div>
        </TabsContent>

        <TabsContent value="kri" className="space-y-6">
          {/* KRI Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kriMetrics.map((kri, index) => {
              const percentage = Math.min(100, (kri.value / kri.target) * 100);
              const isInverted = kri.name === 'Overdue Ratio'; // Lower is better for some metrics
              const actualPercentage = isInverted ? 100 - percentage : percentage;
              
              return (
                <motion.div
                  key={kri.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{kri.name}</h4>
                      <p className="text-sm text-gray-600">Target: {kri.target}{kri.unit}</p>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      kri.status === 'Good' ? 'bg-green-50 text-green-700' :
                      kri.status === 'Warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {kri.status === 'Good' ? <CheckCircle className="h-3 w-3" /> :
                       kri.status === 'Warning' ? <AlertCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{kri.status}</span>
                    </div>
                  </div>
                  
                  <div className="h-48">
                    <Chart
                      type="radialBar"
                      height={192}
                      series={[actualPercentage]}
                      options={{
                        chart: {
                          type: 'radialBar'
                        },
                        plotOptions: {
                          radialBar: {
                            startAngle: -90,
                            endAngle: 90,
                            hollow: {
                              size: '60%'
                            },
                            dataLabels: {
                              name: {
                                show: false
                              },
                              value: {
                                fontSize: '24px',
                                fontWeight: 600,
                                formatter: () => `${kri.value.toFixed(kri.unit === '%' ? 1 : 0)}${kri.unit}`
                              }
                            },
                            track: {
                              background: '#F3F4F6',
                              strokeWidth: '100%'
                            }
                          }
                        },
                        colors: [
                          kri.status === 'Good' ? '#10B981' :
                          kri.status === 'Warning' ? '#F59E0B' : '#EF4444'
                        ],
                        stroke: {
                          lineCap: 'round'
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    {kri.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      kri.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kri.trend === 'up' ? 'Improving' : 'Declining'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          {/* Invoice Aging Analysis */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Invoice Aging Analysis
                </h3>
                <p className="text-gray-600">
                  Outstanding invoice amounts categorized by aging periods
                </p>
              </div>
            </div>
            
            {invoiceAgingAnalysis && (
              <div className="h-96">
                <Chart
                  type="donut"
                  height={384}
                  series={invoiceAgingAnalysis.amounts}
                  options={{
                    chart: {
                      type: 'donut'
                    },
                    labels: invoiceAgingAnalysis.categories.map(cat => {
                      if (cat === 'current') return 'Current (Not Due)';
                      if (cat === '1-30') return '1-30 Days';
                      if (cat === '31-60') return '31-60 Days';
                      if (cat === '61-90') return '61-90 Days';
                      if (cat === '90+') return '90+ Days';
                      return cat;
                    }),
                    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7C2D12'],
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '60%',
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              label: 'Total Outstanding',
                              formatter: () => formatCurrency(invoiceAgingAnalysis.total)
                            }
                          }
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (val: number, opts: any) => {
                        return val.toFixed(1) + '%'
                      }
                    },
                    tooltip: {
                      y: {
                        formatter: (val) => formatCurrency(val)
                      }
                    },
                    legend: {
                      position: 'bottom',
                      horizontalAlign: 'center'
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Aging Summary Cards */}
          {invoiceAgingAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {invoiceAgingAnalysis.categories.map((category, index) => {
                const amount = invoiceAgingAnalysis.amounts[index];
                const percentage = invoiceAgingAnalysis.percentages[index];
                const isOverdue = index > 0; // Anything beyond current is overdue
                
                const categoryLabels = {
                  'current': 'Current',
                  '1-30': '1-30 Days',
                  '31-60': '31-60 Days',
                  '61-90': '61-90 Days',
                  '90+': '90+ Days'
                };
                
                const colors = ['green', 'blue', 'yellow', 'red', 'red'];
                const icons = [CheckCircle, Clock, AlertCircle, AlertTriangle, XCircle];
                const Icon = icons[index];
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-${colors[index]}-500 to-${colors[index]}-600 shadow-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {categoryLabels[category as keyof typeof categoryLabels] || category}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default RiskManagementDashboard;