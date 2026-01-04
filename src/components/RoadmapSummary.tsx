import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar, BarChart3, TrendingUp, Target, FileText } from 'lucide-react';
import { RoadmapItem } from '@/lib/supabase';
import { useProgress } from '@/contexts/ProgressContext';

interface RoadmapSummaryProps {
  roadmapItems: RoadmapItem[];
}

export const RoadmapSummary: React.FC<RoadmapSummaryProps> = ({ roadmapItems }) => {
  const { progressStats, loading } = useProgress();

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    if (loading || !progressStats) {
      return {
        totalPeriods: roadmapItems.length,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overallProgress: 0,
        activeYears: 0,
        averageProgressPerYear: 0
      };
    }

    const totalTasks = progressStats.totalItems || 0;
    const completedTasks = progressStats.completedItems || 0;
    const pendingTasks = totalTasks - completedTasks;
    const overallProgress = progressStats.progressPercentage || 0;
    const activeYears = Object.keys(progressStats.yearlyProgress || {}).length;
    
    const yearlyPercentages = Object.values(progressStats.yearlyProgress || {})
      .map((year: any) => year.progressPercentage || 0);
    const averageProgressPerYear = yearlyPercentages.length > 0 
      ? yearlyPercentages.reduce((sum, percentage) => sum + percentage, 0) / yearlyPercentages.length 
      : 0;

    return {
      totalPeriods: roadmapItems.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overallProgress,
      activeYears,
      averageProgressPerYear
    };
  };

  const stats = calculateSummaryStats();

  // Get current phase information
  const getCurrentPhaseInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Find current period
    const currentPeriod = roadmapItems.find(item => 
      item.year === currentYear && item.month === currentMonth
    );

    // Find next upcoming period
    const upcomingPeriods = roadmapItems
      .filter(item => {
        const itemDate = new Date(item.year, item.month - 1);
        return itemDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1);
        const dateB = new Date(b.year, b.month - 1);
        return dateA.getTime() - dateB.getTime();
      });

    return {
      current: currentPeriod,
      upcoming: upcomingPeriods[0],
      totalUpcoming: upcomingPeriods.length
    };
  };

  const phaseInfo = getCurrentPhaseInfo();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Periode',
      value: stats.totalPeriods,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: FileText,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    },
    {
      title: 'Tasks Selesai',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Tasks Pending',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Progress Keseluruhan',
      value: `${stats.overallProgress.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Tahun Aktif',
      value: stats.activeYears,
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      title: 'Rata-rata Progress/Tahun',
      value: `${stats.averageProgressPerYear.toFixed(1)}%`,
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    },
    {
      title: 'Periode Mendatang',
      value: phaseInfo.totalUpcoming,
      icon: AlertTriangle,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Summary Overview
            </h3>
            <p className="text-sm text-gray-600">
              Ringkasan lengkap progress dan statistik roadmap ekspor
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card, index) => {
            const IconComponent = card.icon;
            
            return (
              <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300`} />
                
                <div className="relative p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.bgColor} ring-1 ring-black/5`}>
                      <IconComponent className={`h-5 w-5 ${card.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className={`h-1 bg-gradient-to-r ${card.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
              </div>
            );
          })}
        </div>

        {/* Current Phase Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Period */}
          {phaseInfo.current && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 ring-1 ring-blue-200/50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Periode Saat Ini</h4>
                  <p className="text-sm text-gray-600">{phaseInfo.current.period}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">{phaseInfo.current.focus}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{phaseInfo.current.action_plan}</p>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: phaseInfo.current.status_color }} />
                  <span className="text-xs font-medium" style={{ color: phaseInfo.current.status_color }}>
                    {phaseInfo.current.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Upcoming Period */}
          {phaseInfo.upcoming && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 ring-1 ring-green-200/50">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Periode Selanjutnya</h4>
                  <p className="text-sm text-gray-600">{phaseInfo.upcoming.period}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">{phaseInfo.upcoming.focus}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{phaseInfo.upcoming.action_plan}</p>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: phaseInfo.upcoming.status_color }} />
                  <span className="text-xs font-medium" style={{ color: phaseInfo.upcoming.status_color }}>
                    {phaseInfo.upcoming.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapSummary;