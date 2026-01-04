import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { 
  Clock, TrendingUp, TrendingDown, Activity,
  FileText, Truck, BarChart3, Zap, CheckCircle, AlertTriangle
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

interface OperationalEfficiencyProps {
  data: DashboardData | null;
}

const OperationalEfficiencyDashboard: React.FC<OperationalEfficiencyProps> = ({ data }) => {
  const [activeEfficiencyView, setActiveEfficiencyView] = useState('processing');

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // LC Processing Time Analysis
  const lcProcessingMetrics = useMemo(() => {
    if (!data) return null;
    
    // Simulated LC processing data based on real operations
    const avgProcessingTime = Math.max(3, Math.min(21, 14 - (data.operations.activeLCs * 0.5))); // 3-21 days range
    const targetProcessingTime = 10; // Target: 10 days
    const processingEfficiency = Math.min(100, (targetProcessingTime / avgProcessingTime) * 100);
    
    // Generate monthly processing time trends
    const monthlyProcessingTrends = data.revenue.monthlyTrends.map((trend, index) => {
      const seasonalFactor = 1 + (Math.sin((index / 12) * 2 * Math.PI) * 0.3);
      const volumeFactor = 1 + ((trend.count - 3) * 0.1); // More volume = slightly longer processing
      const processingTime = Math.max(3, avgProcessingTime * seasonalFactor * volumeFactor);
      
      return {
        month: trend.month,
        processingTime: processingTime,
        lcVolume: Math.max(1, Math.round(trend.count * 0.8)), // Assume 80% of invoices have LCs
        efficiency: Math.min(100, (targetProcessingTime / processingTime) * 100)
      };
    });
    
    return {
      avgProcessingTime,
      targetProcessingTime,
      processingEfficiency,
      monthlyTrends: monthlyProcessingTrends,
      completionRate: Math.min(100, data.operations.activeLCs > 0 ? 
        ((data.summary.totalLCs - data.operations.activeLCs) / data.summary.totalLCs) * 100 : 95),
      qualityScore: Math.max(75, 100 - (data.operations.expiringLCs * 5)) // Quality decreases with expiring LCs
    };
  }, [data]);

  // Invoice-to-Payment Cycle Analysis
  const invoicePaymentCycle = useMemo(() => {
    if (!data) return null;
    
    const avgCycleTime = data.cashFlow.avgPaymentDays;
    const targetCycleTime = 30; // Target: 30 days
    const cycleEfficiency = Math.min(100, (targetCycleTime / avgCycleTime) * 100);
    
    // Breakdown of cycle stages
    const stageBreakdown = {
      invoiceGeneration: Math.max(1, Math.round(avgCycleTime * 0.1)), // 10% of cycle
      customerReview: Math.max(2, Math.round(avgCycleTime * 0.2)),    // 20% of cycle
      paymentProcessing: Math.max(3, Math.round(avgCycleTime * 0.3)), // 30% of cycle
      bankTransfer: Math.max(2, Math.round(avgCycleTime * 0.15)),     // 15% of cycle
      reconciliation: Math.max(1, Math.round(avgCycleTime * 0.25))    // 25% of cycle
    };
    
    return {
      avgCycleTime,
      targetCycleTime,
      cycleEfficiency,
      stageBreakdown,
      collectionRate: data.cashFlow.paymentCollectionRate,
      bottleneck: Object.entries(stageBreakdown).reduce((a, b) => 
        stageBreakdown[a[0] as keyof typeof stageBreakdown] > stageBreakdown[b[0] as keyof typeof stageBreakdown] ? a : b
      )[0]
    };
  }, [data]);

  // Container Utilization Metrics (Simulated)
  const containerUtilization = useMemo(() => {
    if (!data) return null;
    
    // Simulate container data based on revenue and customer count
    const totalContainers = Math.max(5, Math.round((data.revenue.current / 500000000))); // 1 container per 500M IDR
    const utilizationRate = Math.min(95, Math.max(60, 75 + (data.customers.topCustomers.length * 2)));
    const avgLoadingEfficiency = Math.min(98, Math.max(70, 80 + (data.operations.activeLCs * 0.5)));
    
    // Generate container efficiency trends
    const containerTrends = data.revenue.monthlyTrends.map((trend, index) => {
      const seasonalFactor = 1 + (Math.sin((index / 12) * 2 * Math.PI) * 0.1);
      const demandFactor = 1 + ((trend.revenue / data.revenue.current - 1) * 0.2);
      
      return {
        month: trend.month,
        utilization: Math.min(100, Math.max(50, utilizationRate * seasonalFactor * demandFactor)),
        efficiency: Math.min(100, Math.max(60, avgLoadingEfficiency * seasonalFactor)),
        containers: Math.max(1, Math.round(totalContainers * demandFactor)),
        costPerCBM: Math.max(50000, 75000 / Math.max(0.5, demandFactor)) // Lower cost with higher utilization
      };
    });
    
    return {
      totalContainers,
      utilizationRate,
      avgLoadingEfficiency,
      containerTrends,
      costOptimization: Math.max(0, (utilizationRate - 70) * 2), // Higher utilization = better cost optimization
      capacityUtilization: Math.min(100, utilizationRate + avgLoadingEfficiency) / 2
    };
  }, [data]);

  // Overall Operational Efficiency Score
  const overallEfficiency = useMemo(() => {
    if (!data || !lcProcessingMetrics || !invoicePaymentCycle || !containerUtilization) return null;
    
    const weights = {
      processing: 0.3,
      payment: 0.3,
      container: 0.2,
      collection: 0.2
    };
    
    const score = (
      lcProcessingMetrics.processingEfficiency * weights.processing +
      invoicePaymentCycle.cycleEfficiency * weights.payment +
      containerUtilization.utilizationRate * weights.container +
      data.cashFlow.paymentCollectionRate * weights.collection
    );
    
    return {
      score: Math.round(score),
      grade: score >= 90 ? 'Excellent' :
             score >= 80 ? 'Good' :
             score >= 70 ? 'Average' :
             score >= 60 ? 'Below Average' : 'Poor',
      trend: data.revenue.growth > 0 ? 'improving' : 'declining'
    };
  }, [data, lcProcessingMetrics, invoicePaymentCycle, containerUtilization]);

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
          Operational Efficiency Dashboard
        </h2>
        <p className="text-gray-300">
          Process optimization, cycle time analysis, and operational performance metrics
        </p>
      </div>

      {/* Overall Efficiency Score */}
      {overallEfficiency && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Overall Efficiency Score
                </h3>
                <p className="text-gray-600">
                  Composite operational performance indicator
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {overallEfficiency.score}%
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                overallEfficiency.grade === 'Excellent' ? 'text-green-600' :
                overallEfficiency.grade === 'Good' ? 'text-blue-600' :
                overallEfficiency.grade === 'Average' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {overallEfficiency.trend === 'improving' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{overallEfficiency.grade}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Efficiency Tabs */}
      <div className="py-6">
        <Tabs value={activeEfficiencyView} onValueChange={setActiveEfficiencyView}>
          <div className="py-4 border-b mb-6">
            <div className="flex justify-center">
              <TabsList className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-200/50 flex-wrap justify-center">
                <TabsTrigger value="processing" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                  LC Processing
                </TabsTrigger>
                <TabsTrigger value="cycles" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                  Payment Cycles
                </TabsTrigger>
                <TabsTrigger value="container" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                  Container Utilization
                </TabsTrigger>
                <TabsTrigger value="trends" className="px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap">
                  Efficiency Trends
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 py-6">
              <TabsContent value="processing" className="space-y-6">
          {/* LC Processing Time Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Average Processing Time Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">LC Processing Time</h4>
                  <p className="text-sm text-gray-600">Target: {lcProcessingMetrics?.targetProcessingTime} days</p>
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {lcProcessingMetrics?.avgProcessingTime.toFixed(1)} days
                </Badge>
              </div>
              
              <div className="h-48">
                <Chart
                  type="radialBar"
                  height={192}
                  series={[lcProcessingMetrics?.processingEfficiency || 0]}
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
                            formatter: () => `${lcProcessingMetrics?.processingEfficiency.toFixed(0)}%`
                          }
                        },
                        track: {
                          background: '#F3F4F6',
                          strokeWidth: '100%'
                        }
                      }
                    },
                    colors: [
                      lcProcessingMetrics && lcProcessingMetrics.processingEfficiency >= 80 ? '#10B981' :
                      lcProcessingMetrics && lcProcessingMetrics.processingEfficiency >= 60 ? '#F59E0B' : '#EF4444'
                    ],
                    stroke: {
                      lineCap: 'round'
                    }
                  }}
                />
              </div>
            </motion.div>
            
            {/* Completion Rate Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Completion Rate</h4>
                  <p className="text-sm text-gray-600">LCs processed successfully</p>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {lcProcessingMetrics?.completionRate.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="h-48">
                <Chart
                  type="radialBar"
                  height={192}
                  series={[lcProcessingMetrics?.completionRate || 0]}
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
                            formatter: () => `${lcProcessingMetrics?.completionRate.toFixed(0)}%`
                          }
                        },
                        track: {
                          background: '#F3F4F6',
                          strokeWidth: '100%'
                        }
                      }
                    },
                    colors: ['#10B981'],
                    stroke: {
                      lineCap: 'round'
                    }
                  }}
                />
              </div>
            </motion.div>
            
            {/* Quality Score Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Quality Score</h4>
                  <p className="text-sm text-gray-600">Process quality indicator</p>
                </div>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  {lcProcessingMetrics?.qualityScore.toFixed(0)}%
                </Badge>
              </div>
              
              <div className="h-48">
                <Chart
                  type="radialBar"
                  height={192}
                  series={[lcProcessingMetrics?.qualityScore || 0]}
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
                            formatter: () => `${lcProcessingMetrics?.qualityScore.toFixed(0)}%`
                          }
                        },
                        track: {
                          background: '#F3F4F6',
                          strokeWidth: '100%'
                        }
                      }
                    },
                    colors: ['#8B5CF6'],
                    stroke: {
                      lineCap: 'round'
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* LC Processing Trends */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  LC Processing Time Trends
                </h3>
                <p className="text-gray-600">
                  Monthly processing time and volume analysis
                </p>
              </div>
            </div>
            
            {lcProcessingMetrics && (
              <div className="h-80">
                <Chart
                  type="line"
                  height={320}
                  series={[
                    {
                      name: 'Processing Time (days)',
                      data: lcProcessingMetrics.monthlyTrends.map(trend => trend.processingTime)
                    },
                    {
                      name: 'LC Volume',
                      data: lcProcessingMetrics.monthlyTrends.map(trend => trend.lcVolume)
                    },
                    {
                      name: 'Efficiency (%)',
                      data: lcProcessingMetrics.monthlyTrends.map(trend => trend.efficiency)
                    }
                  ]}
                  options={{
                    chart: {
                      type: 'line',
                      stacked: false,
                      toolbar: { show: false }
                    },
                    colors: ['#3B82F6', '#10B981', '#F59E0B'],
                    stroke: {
                      curve: 'smooth',
                      width: [3, 2, 2]
                    },
                    xaxis: {
                      categories: lcProcessingMetrics.monthlyTrends.map(trend => trend.month),
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        }
                      }
                    },
                    yaxis: {
                      title: {
                        text: 'Values',
                        style: {
                          color: '#3B82F6'
                        }
                      },
                      labels: {
                        formatter: (val) => Math.round(Number(val)).toString(),
                        style: {
                          colors: ['#3B82F6']
                        }
                      }
                    },
                    tooltip: {
                      y: {
                        formatter: (val: number, { seriesIndex }) => {
                          if (seriesIndex === 0) {
                            // Processing Time (days) - max 2 decimal places
                            return `${val.toFixed(2)} days`;
                          } else if (seriesIndex === 1) {
                            // LC Volume - no decimal places (whole numbers)
                            return `${Math.round(val)} LCs`;
                          } else if (seriesIndex === 2) {
                            // Efficiency (%) - max 2 decimal places
                            return `${val.toFixed(2)}%`;
                          }
                          return val.toString();
                        }
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

        <TabsContent value="cycles" className="space-y-6">
          {/* Invoice-to-Payment Cycle Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cycle Time Breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Invoice-to-Payment Cycle Breakdown
                  </h3>
                  <p className="text-gray-600">
                    Average time spent in each stage
                  </p>
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {invoicePaymentCycle?.avgCycleTime.toFixed(0)} days total
                </Badge>
              </div>
              
              {invoicePaymentCycle && (
                <div className="h-80">
                  <Chart
                    type="bar"
                    height={320}
                    series={[{
                      name: 'Days',
                      data: Object.values(invoicePaymentCycle.stageBreakdown)
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
                            position: 'start'
                          }
                        }
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: (val) => {
                          const days = Math.round(Number(val));
                          return `${days} ${days === 1 ? 'Day' : 'Days'}`;
                        },
                        offsetX: 10, // Proper spacing from the start of the bar
                        style: {
                          fontSize: '12px',
                          fontWeight: 700,
                          colors: ['#FFFFFF']
                        },
                        dropShadow: {
                          enabled: true,
                          color: '#000000',
                          top: 1,
                          left: 1,
                          blur: 2,
                          opacity: 0.8
                        }
                      },
                      xaxis: {
                        categories: [
                          'Invoice Generation',
                          'Customer Review',
                          'Payment Processing',
                          'Bank Transfer',
                          'Reconciliation'
                        ],
                        labels: {
                          formatter: (val) => `${val} days`
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
                          formatter: (val) => `${val} days`
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
            
            {/* Cycle Efficiency Metrics */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Cycle Efficiency Metrics
                  </h3>
                  <p className="text-gray-600">
                    Performance indicators and bottleneck analysis
                  </p>
                </div>
              </div>
              
              {invoicePaymentCycle && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {invoicePaymentCycle.cycleEfficiency.toFixed(0)}%
                      </div>
                      <p className="text-sm font-medium text-blue-700">Cycle Efficiency</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {invoicePaymentCycle.collectionRate.toFixed(0)}%
                      </div>
                      <p className="text-sm font-medium text-green-700">Collection Rate</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-900">Primary Bottleneck</span>
                    </div>
                    <p className="text-yellow-800 capitalize">
                      {invoicePaymentCycle.bottleneck.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {invoicePaymentCycle.stageBreakdown[invoicePaymentCycle.bottleneck as keyof typeof invoicePaymentCycle.stageBreakdown]} days average
                    </p>
                  </div>
                  
                  {/* Cycle Efficiency Gauge */}
                  <div className="h-40">
                    <Chart
                      type="radialBar"
                      height={160}
                      series={[invoicePaymentCycle.cycleEfficiency]}
                      options={{
                        chart: {
                          type: 'radialBar'
                        },
                        plotOptions: {
                          radialBar: {
                            startAngle: -90,
                            endAngle: 90,
                            hollow: {
                              size: '50%'
                            },
                            dataLabels: {
                              name: {
                                show: true
                              },
                              value: {
                                fontSize: '16px',
                                fontWeight: 600,
                                formatter: () => `${invoicePaymentCycle.cycleEfficiency.toFixed(0)}%`
                              }
                            }
                          }
                        },
                        colors: [
                          invoicePaymentCycle.cycleEfficiency >= 80 ? '#10B981' :
                          invoicePaymentCycle.cycleEfficiency >= 60 ? '#F59E0B' : '#EF4444'
                        ]
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="container" className="space-y-6">
          {/* Container Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Rate */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Container Utilization Rate
                  </h3>
                  <p className="text-gray-600">
                    Current capacity utilization and efficiency
                  </p>
                </div>
              </div>
              
              {containerUtilization && (
                <div className="space-y-4">
                  <div className="h-48">
                    <Chart
                      type="radialBar"
                      height={192}
                      series={[containerUtilization.utilizationRate, containerUtilization.avgLoadingEfficiency]}
                      options={{
                        chart: {
                          type: 'radialBar'
                        },
                        plotOptions: {
                          radialBar: {
                            dataLabels: {
                              name: {
                                fontSize: '12px',
                                offsetY: -10
                              },
                              value: {
                                fontSize: '16px',
                                fontWeight: 600
                              },
                              total: {
                                show: true,
                                label: 'Overall',
                                formatter: () => `${containerUtilization.capacityUtilization.toFixed(0)}%`
                              }
                            }
                          }
                        },
                        colors: ['#3B82F6', '#10B981'],
                        labels: ['Utilization', 'Efficiency']
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <div className="text-lg font-bold text-blue-600">{containerUtilization.totalContainers}</div>
                      <p className="text-xs font-medium text-blue-700">Total Containers</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <div className="text-lg font-bold text-green-600">{containerUtilization.costOptimization.toFixed(0)}%</div>
                      <p className="text-xs font-medium text-green-700">Cost Optimization</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Container Efficiency Trends */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Container Performance Trends
                  </h3>
                  <p className="text-gray-600">
                    Monthly utilization and efficiency tracking
                  </p>
                </div>
              </div>
              
              {containerUtilization && (
                <div className="h-64">
                  <Chart
                    type="area"
                    height={256}
                    series={[
                      {
                        name: 'Utilization Rate (%)',
                        data: containerUtilization.containerTrends.map(trend => trend.utilization)
                      },
                      {
                        name: 'Loading Efficiency (%)',
                        data: containerUtilization.containerTrends.map(trend => trend.efficiency)
                      }
                    ]}
                    options={{
                      chart: {
                        type: 'area',
                        stacked: false,
                        toolbar: { show: false }
                      },
                      colors: ['#3B82F6', '#10B981'],
                      fill: {
                        type: 'gradient',
                        gradient: {
                          opacityFrom: 0.6,
                          opacityTo: 0.1
                        }
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 2
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: (val) => `${Number(val).toFixed(2)}%`,
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
                      xaxis: {
                        categories: containerUtilization.containerTrends.map(trend => trend.month)
                      },
                      yaxis: {
                        min: 0,
                        max: 100,
                        labels: {
                          formatter: (val) => `${Number(val).toFixed(1)}%`
                        }
                      },
                      tooltip: {
                        y: {
                          formatter: (val) => `${Number(val).toFixed(2)}%`
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
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Comprehensive Efficiency Trends */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Comprehensive Efficiency Trends
                </h3>
                <p className="text-gray-600">
                  Multi-dimensional operational performance analysis
                </p>
              </div>
            </div>
            
            {lcProcessingMetrics && containerUtilization && (
              <div className="h-96">
                <Chart
                  type="line"
                  height={384}
                  series={[
                    {
                      name: 'LC Processing Efficiency (%)',
                      data: lcProcessingMetrics.monthlyTrends.map(trend => trend.efficiency)
                    },
                    {
                      name: 'Container Utilization (%)',
                      data: containerUtilization.containerTrends.map(trend => trend.utilization)
                    },
                    {
                      name: 'Loading Efficiency (%)',
                      data: containerUtilization.containerTrends.map(trend => trend.efficiency)
                    },
                    {
                      name: 'Overall Score (%)',
                      data: lcProcessingMetrics.monthlyTrends.map((_, index) => {
                        const lcEff = lcProcessingMetrics.monthlyTrends[index].efficiency;
                        const containerUtil = containerUtilization.containerTrends[index].utilization;
                        const loadingEff = containerUtilization.containerTrends[index].efficiency;
                        return (lcEff + containerUtil + loadingEff) / 3;
                      })
                    }
                  ]}
                  options={{
                    chart: {
                      type: 'line',
                      toolbar: { show: false }
                    },
                    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                    stroke: {
                      curve: 'smooth',
                      width: [2, 2, 2, 4],
                      dashArray: [0, 0, 0, 5]
                    },
                    xaxis: {
                      categories: lcProcessingMetrics.monthlyTrends.map(trend => trend.month),
                      labels: {
                        style: {
                          fontSize: '12px',
                          fontWeight: 500
                        }
                      }
                    },
                    yaxis: {
                      min: 0,
                      max: 100,
                      labels: {
                        formatter: (val) => `${val.toFixed(0)}%`
                      }
                    },
                    legend: {
                      position: 'top',
                      horizontalAlign: 'right'
                    },
                    grid: {
                      borderColor: '#F3F4F6',
                      strokeDashArray: 3
                    },
                    markers: {
                      size: 6,
                      hover: {
                        size: 8
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Efficiency Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                title: 'LC Processing', 
                value: lcProcessingMetrics?.processingEfficiency.toFixed(0) + '%', 
                icon: FileText, 
                color: 'blue',
                trend: lcProcessingMetrics && lcProcessingMetrics.processingEfficiency > 75 ? 'up' : 'down'
              },
              { 
                title: 'Payment Cycles', 
                value: invoicePaymentCycle?.cycleEfficiency.toFixed(0) + '%', 
                icon: Clock, 
                color: 'green',
                trend: invoicePaymentCycle && invoicePaymentCycle.cycleEfficiency > 70 ? 'up' : 'down'
              },
              { 
                title: 'Container Utilization', 
                value: containerUtilization?.utilizationRate.toFixed(0) + '%', 
                icon: Truck, 
                color: 'yellow',
                trend: containerUtilization && containerUtilization.utilizationRate > 80 ? 'up' : 'down'
              },
              { 
                title: 'Overall Efficiency', 
                value: overallEfficiency?.score + '%', 
                icon: Activity, 
                color: 'purple',
                trend: overallEfficiency?.trend === 'improving' ? 'up' : 'down'
              }
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
                </div>
              </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default OperationalEfficiencyDashboard;