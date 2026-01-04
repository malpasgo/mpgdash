import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, TrendingUp, AlertTriangle, Calendar, Clock, Target
} from 'lucide-react';
import { RoadmapItem, parseDetailedActionPlan, catatanPentingService, CatatanPentingItem } from '@/lib/supabase';
import { useProgress } from '@/contexts/ProgressContext';

interface RoadmapKPICardsProps {
  roadmapItems: RoadmapItem[];
  progressStats?: any;
  statistics?: any;
}

const RoadmapKPICards: React.FC<RoadmapKPICardsProps> = ({ 
  roadmapItems, 
  progressStats, 
  statistics 
}) => {
  const { checkboxStates } = useProgress();
  const [catatanData, setCatatanData] = useState<CatatanPentingItem[]>([]);
  const [catatanLoading, setCatatanLoading] = useState(true);

  // Load real catatan data from Supabase
  useEffect(() => {
    const loadCatatanData = async () => {
      try {
        setCatatanLoading(true);
        const realCatatanData = await catatanPentingService.getActiveCatatanPenting();
        setCatatanData(realCatatanData);
      } catch (error) {
        console.error('Error loading real catatan data:', error);
        setCatatanData([]);
      } finally {
        setCatatanLoading(false);
      }
    };

    loadCatatanData();
  }, []);

  // Calculate current month tasks
  const getCurrentMonthTaskStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const currentMonthItems = roadmapItems.filter(item => {
      return item.month === currentMonth && item.year === currentYear;
    });
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    currentMonthItems.forEach(item => {
      const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
      totalTasks += actionItems.length;
      
      actionItems.forEach((_, index) => {
        const checkboxKey = `${item.id}_${index}`;
        const isCompleted = checkboxStates[checkboxKey] || false;
        if (isCompleted) {
          completedTasks++;
        }
      });
    });
    
    return { completed: completedTasks, total: totalTasks };
  };

  // Calculate overdue items
  const getOverdueItemsStats = () => {
    const now = new Date();
    let overdueCount = 0;
    let totalPastDueTasks = 0;
    
    roadmapItems.forEach(item => {
      const itemDate = new Date(item.year, item.month - 1, 1);
      if (itemDate < now) {
        const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
        actionItems.forEach((_, index) => {
          const checkboxKey = `${item.id}_${index}`;
          const isCompleted = checkboxStates[checkboxKey] || false;
          if (!isCompleted) {
            overdueCount++;
          }
          totalPastDueTasks++;
        });
      }
    });
    
    return { overdue: overdueCount, total: totalPastDueTasks };
  };

  // Calculate upcoming milestones (30 days)
  const getUpcomingMilestonesStats = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    let upcomingCount = 0;
    let totalUpcomingTasks = 0;
    
    roadmapItems.forEach(item => {
      const itemDate = new Date(item.year, item.month - 1, 1);
      if (itemDate >= now && itemDate <= thirtyDaysFromNow) {
        const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
        totalUpcomingTasks += actionItems.length;
        upcomingCount++;
      }
    });
    
    return { periods: upcomingCount, tasks: totalUpcomingTasks };
  };

  // Get catatan stats
  const getCatatanStats = () => {
    if (catatanLoading) {
      return { total: 0, critical: 0, high: 0, loading: true };
    }

    const total = catatanData.length;
    const critical = catatanData.filter(item => item.priority === 'critical').length;
    const high = catatanData.filter(item => item.priority === 'high').length;
    
    return { total, critical, high, loading: false };
  };

  // Get current month name
  const getCurrentMonthName = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[new Date().getMonth()];
  };

  const currentMonthStats = getCurrentMonthTaskStats();
  const overdueStats = getOverdueItemsStats();
  const upcomingStats = getUpcomingMilestonesStats();
  const catatanStats = getCatatanStats();

  const kpiCards = [
    {
      title: 'Tugas Bulan Ini',
      value: `${currentMonthStats.completed} / ${currentMonthStats.total}`,
      subtitle: `Tugas yang telah selesai di ${getCurrentMonthName()} 2025`,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      progress: currentMonthStats.total > 0 ? Math.round((currentMonthStats.completed / currentMonthStats.total) * 100) : 0
    },
    {
      title: 'Progress Keseluruhan',
      value: `${progressStats?.progressPercentage?.toFixed(1) || 0}%`,
      subtitle: `${progressStats?.completedItems || 0} dari ${progressStats?.totalItems || 0} tasks`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      progress: progressStats?.progressPercentage || 0
    },
    {
      title: 'Overdue Items Alert',
      value: overdueStats.overdue.toString(),
      subtitle: `Tasks yang melewati deadline dari ${overdueStats.total} total`,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      progress: overdueStats.total > 0 ? Math.round((overdueStats.overdue / overdueStats.total) * 100) : 0
    },
    {
      title: 'Upcoming Milestones (30 Days)',
      value: upcomingStats.periods.toString(),
      subtitle: `${upcomingStats.tasks} tasks dalam ${upcomingStats.periods} periode mendatang`,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      progress: 0 // No progress bar for upcoming items
    },
    {
      title: 'Catatan Penting',
      value: catatanStats.loading ? '...' : catatanStats.total.toString(),
      subtitle: catatanStats.loading ? 'Memuat data...' : 
               catatanStats.critical > 0 ? `${catatanStats.critical} critical, ${catatanStats.high} high` : 
               catatanStats.total > 0 ? 'Semua kendala terkendali' : 'Tidak ada kendala',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600',
      progress: 0 // No progress bar for catatan
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {kpiCards.map((card, index) => {
        const IconComponent = card.icon;
        
        return (
          <div
            key={index}
            className="group relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative p-6">
              {/* Header with Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.bgColor} ring-1 ring-black/5`}>
                  <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              
              {/* Stats */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {card.title}
                </div>
                <div className="text-xs text-gray-500">
                  {card.subtitle}
                </div>
              </div>
              
              {/* Progress Bar (if applicable) */}
              {card.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={card.textColor}>Progress</span>
                    <span className="text-gray-600 font-medium">{card.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${card.color} h-2 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoadmapKPICards;