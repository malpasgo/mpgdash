import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, roadmapService, ProgressStats as RoadmapProgressStats, RoadmapItem } from '@/lib/supabase';
import { COMPREHENSIVE_ROADMAP_DATA } from '@/lib/roadmapData';

interface ProgressContextType {
  progressStats: RoadmapProgressStats | null;
  loading: boolean;
  toggleCheckbox: (periodId: number, actionItemIndex: number, isCompleted: boolean) => Promise<void>;
  refreshProgress: () => Promise<void>;
  getItemProgress: (periodId: number, actionItemIndex: number) => boolean;
  isCheckboxLoading: (periodId: number, actionItemIndex: number) => boolean;
  checkboxStates: Record<string, boolean>;
  checkboxLoading: Record<string, boolean>;
  showError: (message: string) => void;
  errorMessage: string | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: React.ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [progressStats, setProgressStats] = useState<RoadmapProgressStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
  const [checkboxLoading, setCheckboxLoading] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);



  // Error handling
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    // Auto-hide error after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  // Convert comprehensive data to RoadmapItem format
  const convertToRoadmapItem = useCallback((item: any): RoadmapItem => ({
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
  }), []);

  // Fetch progress statistics
  const refreshProgress = useCallback(async () => {
    setLoading(true);
    try {
      console.log('=== PROGRESS CONTEXT: Using comprehensive local data ===');
      
      // Use comprehensive local data with detailed action plans (same as dashboard)
      const roadmapItems = COMPREHENSIVE_ROADMAP_DATA.map(convertToRoadmapItem);
      
      // DEBUG: Verify all data is loaded
      console.log('COMPREHENSIVE_ROADMAP_DATA.length:', COMPREHENSIVE_ROADMAP_DATA.length);
      console.log('roadmapItems.length after conversion:', roadmapItems.length);
      
      // Count total checkboxes manually to verify
      let manualTotalCheckboxes = 0;
      roadmapItems.forEach(item => {
        try {
          const actionPlanDetails = JSON.parse(item.action_plan_detailed);
          manualTotalCheckboxes += actionPlanDetails.length;
          console.log(`Period ${item.id} (${item.period}): ${actionPlanDetails.length} checkboxes`);
        } catch (e) {
          console.error(`Error parsing action plan for period ${item.id}:`, e);
        }
      });
      
      console.log('MANUAL TOTAL CHECKBOXES COUNT:', manualTotalCheckboxes);
      console.log('EXPECTED: 455 checkboxes (65 months × 7 each)');
      
      // Get action item statuses from database (real user interactions)
      const actionItemStatuses = await roadmapService.getActionItemStatuses();
      
      console.log('Progress calculation - Items:', roadmapItems.length, 'Statuses:', actionItemStatuses.length);
      console.log('Sample August 2025 data:', roadmapItems.find(item => item.month === 8 && item.year === 2025));

      // Calculate progress using roadmapService with comprehensive data
      const progressData = await roadmapService.calculateProgress(roadmapItems, actionItemStatuses);
      console.log('Calculated progress stats:', progressData);
      
      setProgressStats(progressData);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      showError('Failed to load progress statistics');
    } finally {
      setLoading(false);
    }
  }, [convertToRoadmapItem, showError]);

  // Load checkbox states from database
  const loadCheckboxStates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('action_item_status')
        .select('period_id, action_item_index, is_completed');

      if (error) {
        console.error('Error loading checkbox states:', error);
        return;
      }

      const states: Record<string, boolean> = {};
      data?.forEach(item => {
        const key = `${item.period_id}_${item.action_item_index}`;
        states[key] = item.is_completed;
      });

      setCheckboxStates(states);
    } catch (error) {
      console.error('Error loading checkbox states:', error);
    }
  }, []);





  // Toggle checkbox state
  const toggleCheckbox = useCallback(async (periodId: number, actionItemIndex: number, isCompleted: boolean) => {
    const key = `${periodId}_${actionItemIndex}`;
    
    console.log('ToggleCheckbox called with:', { periodId, actionItemIndex, isCompleted });
    console.log('Key generated:', key);
    
    // Set loading state for this specific checkbox
    setCheckboxLoading(prev => ({ ...prev, [key]: true }));
    
    // Optimistic update
    setCheckboxStates(prev => ({
      ...prev,
      [key]: isCompleted
    }));

    try {
      // Use roadmapService to update action item status
      await roadmapService.updateActionItemStatus(periodId, actionItemIndex, isCompleted);
      
      console.log('Checkbox toggle successful, refreshing progress...');
      // Refresh progress statistics after successful update
      await refreshProgress();
      
    } catch (error) {
      console.error('Error toggling checkbox:', error);
      showError('Failed to save status. Please try again.');
      
      // Revert optimistic update on error
      setCheckboxStates(prev => ({
        ...prev,
        [key]: !isCompleted
      }));
    } finally {
      // Remove loading state
      setCheckboxLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [refreshProgress, showError]);

  // Get checkbox state for specific item
  const getItemProgress = useCallback((periodId: number, actionItemIndex: number): boolean => {
    const key = `${periodId}_${actionItemIndex}`;
    return checkboxStates[key] || false;
  }, [checkboxStates]);

  // Get checkbox loading state for specific item
  const isCheckboxLoading = useCallback((periodId: number, actionItemIndex: number): boolean => {
    const key = `${periodId}_${actionItemIndex}`;
    return checkboxLoading[key] || false;
  }, [checkboxLoading]);

  // Load initial data
  useEffect(() => {
    loadCheckboxStates();
    refreshProgress();
  }, [loadCheckboxStates, refreshProgress]);

  const value: ProgressContextType = {
    progressStats,
    loading,
    toggleCheckbox,
    refreshProgress,
    getItemProgress,
    isCheckboxLoading,
    checkboxStates,
    checkboxLoading,
    showError,
    errorMessage
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export default ProgressProvider;