import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle2, Target, Clock, BarChart3, FileText, DollarSign, AlertCircle, CalendarClock } from 'lucide-react';
import { RoadmapItem, parseDetailedActionPlan } from '@/lib/supabase';
import { useProgress } from '@/contexts/ProgressContext';

interface StatsSummaryProps {
  roadmapItems: RoadmapItem[];
  filteredCount: number;
  progressStats?: any; // Add progressStats prop
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ roadmapItems, filteredCount, progressStats: propProgressStats }) => {
  const { progressStats: contextProgressStats, loading, checkboxStates } = useProgress();

  
  // Use progressStats from prop if available, otherwise fall back to context
  const progressStats = propProgressStats || contextProgressStats;
  
  // DEBUG: Log which data source is being used
  React.useEffect(() => {
    console.log('=== STATS SUMMARY DEBUG ===');
    console.log('Using progressStats from:', propProgressStats ? 'PROP (useRoadmapData)' : 'CONTEXT (useProgress)');
    console.log('Progress Stats:', progressStats);
    console.log('Total items:', progressStats?.totalItems);
    console.log('Completed items:', progressStats?.completedItems);
    console.log('Expected: 455 total items');
  }, [progressStats, propProgressStats]);
  
  // DEBUG: Log real data being used
  React.useEffect(() => {
    console.log('=== REAL DATA DASHBOARD STATS ===');
    console.log('Progress Stats (from real checkboxes):', progressStats);
    console.log('Checkbox States (all real user interactions):', Object.keys(checkboxStates).length, 'checkboxes tracked');
    console.log('Roadmap Items:', roadmapItems.length, 'periods loaded');
    if (progressStats) {
      console.log(`Overall Progress: ${progressStats.completedItems}/${progressStats.totalItems} = ${progressStats.progressPercentage}%`);
    }
  }, [progressStats, checkboxStates, roadmapItems]);





  // Calculate current month tasks with completion status
  const getCurrentMonthTaskStats = () => {
    // Dynamic current date based on system time
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = now.getFullYear();
    
    console.log('Current month calculation:', { currentMonth, currentYear });
    
    // Get roadmap items for current month
    const currentMonthItems = roadmapItems.filter(item => {
      return item.month === currentMonth && item.year === currentYear;
    });
    
    console.log('Current month items found:', currentMonthItems.length, currentMonthItems);
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Count all action items in current month's roadmap items
    currentMonthItems.forEach(item => {
      const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
      totalTasks += actionItems.length;
      
      console.log(`Item ${item.id}: ${actionItems.length} action items`);
      
      // Count completed action items for this period - using REAL checkbox states
      actionItems.forEach((_, index) => {
        const checkboxKey = `${item.id}_${index}`;
        const isCompleted = checkboxStates[checkboxKey] || false;
        console.log(`Checkbox ${checkboxKey}: ${isCompleted}`);
        
        if (isCompleted) {
          completedTasks++;
        }
      });
    });
    
    console.log('Final current month stats:', { completed: completedTasks, total: totalTasks });
    return { completed: completedTasks, total: totalTasks };
  };

  // Calculate overdue items (past their planned month/year)
  const getOverdueItemsStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const overdueItems = roadmapItems.filter(item => {
      // Item is overdue if its planned date is before current date
      if (item.year < currentYear) return true;
      if (item.year === currentYear && item.month < currentMonth) return true;
      return false;
    });
    
    // Count total tasks in overdue items and how many are incomplete
    let totalOverdueTasks = 0;
    let incompleteOverdueTasks = 0;
    
    overdueItems.forEach(item => {
      const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
      totalOverdueTasks += actionItems.length;
      
      actionItems.forEach((_, index) => {
        const checkboxKey = `${item.id}_${index}`;
        const isCompleted = checkboxStates[checkboxKey] || false;
        if (!isCompleted) {
          incompleteOverdueTasks++;
        }
      });
    });
    
    console.log('Overdue stats:', { items: overdueItems.length, totalTasks: totalOverdueTasks, incompleteTasks: incompleteOverdueTasks });
    return {
      items: overdueItems.length,
      incompleteTasks: incompleteOverdueTasks,
      totalTasks: totalOverdueTasks,
      overdueItemsList: overdueItems.slice(0, 3) // First 3 for preview
    };
  };

  // Calculate upcoming milestones (next 30 days)
  const getUpcomingMilestonesStats = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const upcomingItems = roadmapItems.filter(item => {
      const itemDate = new Date(item.year, item.month - 1, 1); // month - 1 because Date uses 0-indexed months
      return itemDate >= now && itemDate <= thirtyDaysFromNow;
    });
    
    // Count total tasks in upcoming items
    let totalUpcomingTasks = 0;
    let completedUpcomingTasks = 0;
    
    upcomingItems.forEach(item => {
      const actionItems = parseDetailedActionPlan(item.action_plan_detailed);
      totalUpcomingTasks += actionItems.length;
      
      actionItems.forEach((_, index) => {
        const checkboxKey = `${item.id}_${index}`;
        const isCompleted = checkboxStates[checkboxKey] || false;
        if (isCompleted) {
          completedUpcomingTasks++;
        }
      });
    });
    
    console.log('Upcoming milestones stats:', { items: upcomingItems.length, totalTasks: totalUpcomingTasks, completedTasks: completedUpcomingTasks });
    return {
      items: upcomingItems.length,
      totalTasks: totalUpcomingTasks,
      completedTasks: completedUpcomingTasks,
      upcomingItemsList: upcomingItems.slice(0, 3) // First 3 for preview
    };
  };

  // Calculate basic statistics
  const totalPeriods = roadmapItems.length;
  const currentMonthTaskStats = getCurrentMonthTaskStats();
  const overdueStats = getOverdueItemsStats();
  const upcomingMilestonesStats = getUpcomingMilestonesStats();
  
  // Format current month display - dynamic
  const getCurrentMonthName = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const now = new Date();
    return months[now.getMonth()]; // getMonth() returns 0-11, perfect for array index
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const stats = [
    {
      // REAL DATA: This counts actual checkboxes checked in current month's action plans
      label: 'Tugas Bulan Ini',
      value: `${currentMonthTaskStats.completed} / ${currentMonthTaskStats.total} Tugas`,
      subtext: `Tugas yang telah selesai di ${getCurrentMonthName()} ${getCurrentYear()}`,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      progressValue: currentMonthTaskStats.total > 0 ? Math.round((currentMonthTaskStats.completed / currentMonthTaskStats.total) * 100) : 0,
      // Debug info to show real data source
      realDataSource: {
        completedFromCheckboxes: currentMonthTaskStats.completed,
        totalFromActionPlans: currentMonthTaskStats.total
      }
    },

    {
      label: 'Progress Keseluruhan',
      value: loading ? '...' : `${progressStats?.progressPercentage || 0}%`,
      subtext: loading ? 'Memuat...' : `${progressStats?.completedItems || 0} dari ${progressStats?.totalItems || 0} tasks`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      // This data comes directly from REAL checkbox states across ALL months
      realData: {
        totalItems: progressStats?.totalItems || 0,
        completedItems: progressStats?.completedItems || 0,
        percentage: progressStats?.progressPercentage || 0
      }
    },
    {
      // NEW: Overdue Items Alert
      label: 'Overdue Items Alert',
      value: overdueStats.incompleteTasks,
      subtext: overdueStats.incompleteTasks === 0 
        ? 'Tidak ada tugas yang terlambat' 
        : `${overdueStats.items} periode dengan tugas terlambat`,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      preview: overdueStats.overdueItemsList || [],
      alertLevel: overdueStats.incompleteTasks > 0 ? 'high' : 'none'
    },
    {
      // NEW: Upcoming Milestones (30 Days)
      label: 'Upcoming Milestones (30 Days)',
      value: upcomingMilestonesStats.items,
      subtext: upcomingMilestonesStats.items === 0 
        ? 'Tidak ada milestone mendatang' 
        : `${upcomingMilestonesStats.totalTasks} total tasks dalam 30 hari`,
      icon: CalendarClock,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      iconColor: 'text-indigo-600',
      preview: upcomingMilestonesStats.upcomingItemsList || [],
      progressValue: upcomingMilestonesStats.totalTasks > 0 
        ? Math.round((upcomingMilestonesStats.completedTasks / upcomingMilestonesStats.totalTasks) * 100) 
        : 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const isProgressCard = stat.label === 'Progress Keseluruhan';
        const isCatatanCard = false;
        const isTugasCard = stat.label === 'Tugas Bulan Ini';
        const isOverdueCard = stat.label === 'Overdue Items Alert';
        const isUpcomingCard = stat.label === 'Upcoming Milestones (30 Days)';
        const progressValue = progressStats?.progressPercentage || 0;
        const tugasProgressValue = stat.progressValue || 0;
        const upcomingProgressValue = isUpcomingCard ? (stat.progressValue || 0) : 0;
        
        return (
          <div 
            key={index} 
            className={`group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Gradient Background */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300`}
            />
            
            {/* Content */}
            <div className="relative p-6">
              {/* Header with Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} ring-1 ring-black/5`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>


              </div>
              
              {/* Stats */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.subtext}</p>
              </div>
              

              {/* Preview for Overdue Items */}
              {isOverdueCard && stat.preview && stat.preview.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Periode Terlambat:</p>
                  {stat.preview.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <p className="text-xs text-gray-600 line-clamp-1">{item.period} - {item.focus}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Preview for Upcoming Milestones */}
              {isUpcomingCard && stat.preview && stat.preview.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Milestone Mendatang:</p>
                  {stat.preview.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="text-xs text-gray-600 line-clamp-1">{item.period} - {item.focus}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Progress bar for overall progress */}
              {isProgressCard && !loading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className={`font-medium ${stat.textColor}`}>{progressValue}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Progress bar for current month tasks */}
              {isTugasCard && currentMonthTaskStats.total > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress Bulan Ini</span>
                    <span className={`font-medium ${stat.textColor}`}>{tugasProgressValue}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${tugasProgressValue}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Progress bar for upcoming milestones */}
              {isUpcomingCard && upcomingMilestonesStats.totalTasks > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress Milestone</span>
                    <span className={`font-medium ${stat.textColor}`}>{upcomingProgressValue}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${upcomingProgressValue}%` }}
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

export default StatsSummary;