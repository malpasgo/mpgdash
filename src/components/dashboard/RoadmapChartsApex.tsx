import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { RoadmapItem } from '@/lib/supabase';
import { 
  BarChart3, TrendingUp, PieChart, Calendar
} from 'lucide-react';

interface RoadmapChartsApexProps {
  roadmapItems: RoadmapItem[];
  progressStats?: any;
}

const RoadmapChartsApex: React.FC<RoadmapChartsApexProps> = ({ 
  roadmapItems, 
  progressStats 
}) => {
  
  // Prepare yearly progress data
  const yearlyProgressData = React.useMemo(() => {
    if (!progressStats?.yearlyProgress) return [];
    
    return Object.entries(progressStats.yearlyProgress).map(([year, data]: [string, any]) => ({
      year: parseInt(year),
      completed: data.completedItems,
      total: data.totalItems,
      percentage: data.progressPercentage
    }));
  }, [progressStats]);

  // Prepare status distribution data
  const statusDistribution = React.useMemo(() => {
    const statusCounts = roadmapItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: Math.round((count / roadmapItems.length) * 100)
    }));
  }, [roadmapItems]);

  // Prepare monthly distribution data
  const monthlyDistribution = React.useMemo(() => {
    const monthCounts = roadmapItems.reduce((acc, item) => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthYear, count]) => ({
        period: monthYear,
        count
      }));
  }, [roadmapItems]);

  // Chart configurations
  const yearlyProgressChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 350,
      toolbar: { show: false }
    },
    colors: ['#3B82F6'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        dataLabels: {
          position: 'top' as const
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#374151']
      }
    },
    xaxis: {
      categories: yearlyProgressData.map(item => item.year.toString()),
      title: {
        text: 'Tahun',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Progress Percentage (%)',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      },
      max: 100
    },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 3
    },
    tooltip: {
      y: {
        formatter: (val: number, opts: any) => {
          const dataIndex = opts.dataPointIndex;
          const yearData = yearlyProgressData[dataIndex];
          return `${val}% (${yearData.completed}/${yearData.total} tasks)`;
        }
      }
    }
  };

  const statusDistributionChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350
    },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    labels: statusDistribution.map(item => item.status),
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Periods',
              formatter: () => roadmapItems.length.toString()
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom' as const,
      fontSize: '14px'
    },
    tooltip: {
      y: {
        formatter: (val: number, opts: any) => {
          const dataIndex = opts.seriesIndex;
          return `${statusDistribution[dataIndex].count} periods`;
        }
      }
    }
  };

  const monthlyDistributionChartOptions = {
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: { show: false }
    },
    colors: ['#8B5CF6'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    xaxis: {
      categories: monthlyDistribution.map(item => item.period),
      title: {
        text: 'Period',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      },
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Number of Items',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }
      }
    },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 3
    },
    tooltip: {
      x: {
        format: 'MMM yyyy'
      }
    }
  };

  const charts = [
    {
      title: 'Yearly Progress Overview',
      description: 'Progress percentage by year',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      component: (
        <ReactApexChart
          options={yearlyProgressChartOptions}
          series={[{
            name: 'Progress Percentage',
            data: yearlyProgressData.map(item => item.percentage)
          }]}
          type="bar"
          height={350}
        />
      )
    },
    {
      title: 'Status Distribution',
      description: 'Distribution of roadmap items by status',
      icon: PieChart,
      color: 'from-green-500 to-green-600',
      component: (
        <ReactApexChart
          options={statusDistributionChartOptions}
          series={statusDistribution.map(item => item.count)}
          type="donut"
          height={350}
        />
      )
    },
    {
      title: 'Timeline Distribution',
      description: 'Distribution of roadmap items over time',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      component: (
        <ReactApexChart
          options={monthlyDistributionChartOptions}
          series={[{
            name: 'Items Count',
            data: monthlyDistribution.map(item => item.count)
          }]}
          type="area"
          height={350}
        />
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, index) => {
        const IconComponent = chart.icon;
        
        return (
          <div 
            key={index}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 ${index === 0 ? 'lg:col-span-2' : ''}`}
          >
            {/* Chart Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${chart.color} shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {chart.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {chart.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Chart Content */}
            <div className="p-6">
              {chart.component}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapChartsApex;