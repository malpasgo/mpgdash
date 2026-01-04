import { useState, useEffect } from 'react';
import { RoadmapItem, roadmapService, ActionItemStatus, ProgressStats } from '@/lib/supabase';
import { COMPREHENSIVE_ROADMAP_DATA } from '@/lib/roadmapData';

export interface FilterOptions {
  year?: number;
  status?: string;
  searchQuery?: string;
}

// Convert comprehensive data to RoadmapItem format
const convertToRoadmapItem = (item: any): RoadmapItem => ({
  id: item.id,
  period: item.period,
  year: item.year,
  month: item.month,
  month_name: item.month_name,
  focus: item.focus,
  action_plan: item.action_plan,
  action_plan_detailed: JSON.stringify(item.action_plan_detailed), // Convert array to JSON string
  financial_note: item.financial_note,
  status: item.status,
  status_color: item.status_color,
  sort_date: item.sort_date
});

export const useRoadmapData = () => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [actionItemStatuses, setActionItemStatuses] = useState<ActionItemStatus[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalItems: 0,
    completedItems: 0,
    progressPercentage: 0,
    yearlyProgress: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadRoadmapData = async () => {
      try {
        setLoading(true);
        
        // Use comprehensive local data with detailed action plans
        console.log('Loading comprehensive roadmap data with detailed action plans');
        const roadmapData = COMPREHENSIVE_ROADMAP_DATA.map(convertToRoadmapItem);
        console.log('August 2025 data:', roadmapData.find(item => item.month === 8 && item.year === 2025));
        
        // Load action item statuses from database (user interactions)
        const statusesData = await roadmapService.getActionItemStatuses();
        
        setRoadmapItems(roadmapData);
        setActionItemStatuses(statusesData);
        
        // Calculate progress stats using real data
        const progress = await roadmapService.calculateProgress(roadmapData, statusesData);
        setProgressStats(progress);
        
        console.log('Data loaded - Items:', roadmapData.length, 'Statuses:', statusesData.length);
        
      } catch (err) {
        console.error('Error loading comprehensive roadmap data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load roadmap data');
      } finally {
        setLoading(false);
      }
    };

    loadRoadmapData();
  }, []);

  // Action Item Status Functions
  const updateActionItemStatus = async (periodId: number, actionItemIndex: number, isCompleted: boolean) => {
    try {
      // Update the status in database
      await roadmapService.updateActionItemStatus(periodId, actionItemIndex, isCompleted);
      
      // Reload statuses and recalculate progress
      const updatedStatuses = await roadmapService.getActionItemStatuses();
      setActionItemStatuses(updatedStatuses);
      
      // Recalculate progress stats using comprehensive data
      const updatedProgress = await roadmapService.calculateProgress(roadmapItems, updatedStatuses);
      setProgressStats(updatedProgress);
      
      console.log(`Updated checkbox ${periodId}_${actionItemIndex} to ${isCompleted}`);
      
    } catch (err) {
      console.error('Error updating action item status:', err);
      throw err;
    }
  };

  const getActionItemStatusesForPeriod = (periodId: number): ActionItemStatus[] => {
    return actionItemStatuses.filter(status => status.period_id === periodId);
  };

  const isActionItemCompleted = (periodId: number, actionItemIndex: number): boolean => {
    const status = actionItemStatuses.find(
      s => s.period_id === periodId && s.action_item_index === actionItemIndex
    );
    return status?.is_completed || false;
  };

  // Statistics
  const getStatistics = () => {
    const total = roadmapItems.length;
    const statusCounts = roadmapItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const yearCounts = roadmapItems.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      statusCounts,
      yearCounts
    };
  };

  return {
    roadmapItems,
    actionItemStatuses,
    progressStats,
    loading,
    error,
    updateActionItemStatus,
    getActionItemStatusesForPeriod,
    isActionItemCompleted,
    statistics: getStatistics()
  };
};

// Hook for getting fallback data from JSON file
export const useRoadmapDataFallback = () => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFallbackData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/roadmap_processed.json');
        if (!response.ok) {
          throw new Error('Failed to load roadmap data');
        }
        const data = await response.json();
        setRoadmapItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roadmap data');
      } finally {
        setLoading(false);
      }
    };

    loadFallbackData();
  }, []);

  return { roadmapItems, loading, error };
};