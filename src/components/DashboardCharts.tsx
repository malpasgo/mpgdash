import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Chart from 'react-apexcharts';
import { RoadmapItem, ROADMAP_PHASES } from '@/lib/supabase';
import { useProgress } from '@/contexts/ProgressContext';
import { TrendingUp, BarChart3, Activity, PieChart, Calendar } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardChartsProps {
  roadmapItems: RoadmapItem[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ roadmapItems }) => {
  const { progressStats, loading } = useProgress();

  // Prepare yearly progress data from progressStats
  const yearlyProgressData = React.useMemo(() => {
    if (!progressStats?.yearlyProgress) return [];
    
    return Object.entries(progressStats.yearlyProgress).map(([year, data]) => ({
      year: parseInt(year),
      completed: data.completedItems,
      total: data.totalItems,
      percentage: data.progressPercentage
    }));
  }, [progressStats]);
  
  // Prepare status distribution data
  const statusDistributionData = React.useMemo(() => {
    const statusCounts = roadmapItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: {
        'positive': '#10B981',
        'stable': '#3B82F6', 
        'mixed': '#F59E0B',
        'caution': '#8B5CF6',
        'neutral': '#6B7280'
      }[status] || '#6B7280'
    }));
  }, [roadmapItems]);
  
  // Prepare timeline distribution data
  const timelineDistributionData = React.useMemo(() => {
    const yearCounts = roadmapItems.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [roadmapItems]);
  
  const years = yearlyProgressData.map(year => year.year.toString());
  const completedData = yearlyProgressData.map(year => year.completed);
  const totalData = yearlyProgressData.map(year => year.total);
  const percentageData = yearlyProgressData.map(year => year.percentage);

  // Status Distribution Chart Configuration (ApexCharts Donut)
  const statusDistributionChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 300,
      toolbar: { show: false }
    },
    labels: statusDistributionData.map(item => {
      const statusLabels = {
        'positive': 'Positif',
        'stable': 'Stabil', 
        'mixed': 'Campuran',
        'caution': 'Waspada',
        'neutral': 'Netral'
      };
      return statusLabels[item.status as keyof typeof statusLabels] || item.status;
    }),
    colors: statusDistributionData.map(item => item.color),
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              color: '#374151'
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: 'Inter, sans-serif',
              color: '#111827',
              fontWeight: 600
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Periode',
              fontSize: '14px',
              color: '#6B7280'
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' periode';
        }
      }
    }
  };

  const statusDistributionSeries = statusDistributionData.map(item => item.count);

  // Timeline Distribution Chart Configuration (ApexCharts Column)
  const timelineDistributionChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 300,
      toolbar: { show: false }
    },
    colors: ['#3B82F6'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: timelineDistributionData.map(item => item.year.toString()),
      title: {
        text: 'Tahun',
        style: {
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          color: '#6B7280'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Jumlah Periode',
        style: {
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          color: '#6B7280'
        }
      }
    },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 3
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' periode';
        }
      }
    }
  };

  const timelineDistributionSeries = [{
    name: 'Jumlah Periode',
    data: timelineDistributionData.map(item => item.count)
  }];

  // Progress percentage chart with modern styling
  const percentageChartData = {
    labels: years,
    datasets: [
      {
        label: 'Progress Percentage',
        data: percentageData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 40,
        maxBarThickness: 50,
      },
    ],
  };

  // Chart options with modern professional styling
  const percentageBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function(context) {
            return `Tahun ${context[0].label}`;
          },
          label: function(context) {
            return `Progress: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          padding: 8,
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Persentase Progress (%)',
          color: '#475569',
          font: {
            size: 13,
            weight: 600,
            family: 'Inter, sans-serif',
          },
          padding: { bottom: 10 }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: 500,
          },
          padding: 8,
        },
        title: {
          display: true,
          text: 'Tahun',
          color: '#475569',
          font: {
            size: 13,
            weight: 600,
            family: 'Inter, sans-serif',
          },
          padding: { top: 10 }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        },
      }
    },
    onHover: (event, elements) => {
      const canvas = event.native?.target as HTMLCanvasElement;
      if (canvas) {
        canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      }
    },
  };

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded-lg w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
            </div>
          </div>
          
          {/* Chart skeleton */}
          <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <BarChart3 className="h-8 w-8 animate-spin" />
              <span className="text-lg font-medium">Memuat chart...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Original Progress Chart */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
        {/* Modern Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Persentase Progres per Tahun
                </h3>
                <p className="text-sm text-gray-600">
                  Visualisasi progress completion untuk setiap tahun perencanaan
                </p>
              </div>
            </div>
            
            {/* Stats badges */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {years.length} Tahun
                </span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  Live Data
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="p-6">
          <div className="relative">
            {/* Chart */}
            <div className="h-80 relative">
              <Bar data={percentageChartData} options={percentageBarOptions} />
            </div>
            
            {/* Chart insights */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {yearlyProgressData.slice(0, 3).map((year, index) => (
                <div key={year.year} className="group p-4 bg-gray-50/80 rounded-xl border border-gray-200/50 hover:bg-blue-50/50 hover:border-blue-200/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Tahun {year.year}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      year.percentage >= 80 ? 'bg-green-500' :
                      year.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {year.percentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {year.completed} dari {year.total} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Chart */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Status Distribution
                </h3>
                <p className="text-sm text-gray-600">
                  Distribusi status untuk semua periode roadmap
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="h-80">
              <Chart
                options={statusDistributionChartOptions}
                series={statusDistributionSeries}
                type="donut"
                height={300}
              />
            </div>
          </div>
        </div>

        {/* Timeline Distribution Chart */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Timeline Distribution
                </h3>
                <p className="text-sm text-gray-600">
                  Distribusi periode roadmap berdasarkan tahun
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="h-80">
              <Chart
                options={timelineDistributionChartOptions}
                series={timelineDistributionSeries}
                type="bar"
                height={300}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;