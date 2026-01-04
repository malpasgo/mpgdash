import { useState, useEffect, useCallback } from 'react';
import { useDataSync } from '../contexts/DataSyncContext';

/**
 * Custom hook untuk container data synchronization
 * Menangani real-time sync untuk container-related data changes
 */
export const useContainerSync = () => {
  const { notifyDataChange } = useDataSync();
  const [containerForceRefresh, setContainerForceRefresh] = useState(0);
  const [lastContainerUpdate, setLastContainerUpdate] = useState<Date>(new Date());

  // Listen for container-specific data changes
  useEffect(() => {
    const handleContainerDataChange = (event: CustomEvent) => {
      const detail = event.detail;
      
      // Check if the change is related to container data
      if (detail.source === 'container' || 
          detail.moduleType === 'container' ||
          detail.table?.includes('container') ||
          detail.table?.includes('loading_plans') ||
          detail.table?.includes('shipping_routes')) {
        
        console.log('📦 Container data change detected:', detail);
        setContainerForceRefresh(prev => prev + 1);
        setLastContainerUpdate(new Date());
      }
    };

    window.addEventListener('dashboardDataChange', handleContainerDataChange as EventListener);
    
    return () => {
      window.removeEventListener('dashboardDataChange', handleContainerDataChange as EventListener);
    };
  }, []);

  // Notify container data change
  const notifyContainerChange = useCallback((changeType?: string, data?: any) => {
    console.log('🔔 Notifying container data change:', { changeType, data });
    
    // Create a custom event with container-specific details
    const containerEvent = new CustomEvent('dashboardDataChange', {
      detail: {
        timestamp: new Date().toISOString(),
        source: 'container',
        moduleType: 'container',
        changeType: changeType || 'update',
        data: data
      }
    });
    
    window.dispatchEvent(containerEvent);
    
    // Also notify through the data sync context
    notifyDataChange('container');
    
    // Force local refresh
    setContainerForceRefresh(prev => prev + 1);
    setLastContainerUpdate(new Date());
  }, [notifyDataChange]);

  // Manual refresh function
  const refreshContainerData = useCallback(() => {
    console.log('🔄 Manual container data refresh triggered');
    notifyContainerChange('manual_refresh');
  }, [notifyContainerChange]);

  return {
    // State values
    containerForceRefresh, // Use this as a dependency in useEffect to trigger re-renders
    lastContainerUpdate,
    
    // Action functions
    notifyContainerChange,
    refreshContainerData,
    
    // Helper functions
    notifyCalculationSaved: (calculationId: string) => 
      notifyContainerChange('calculation_saved', { calculationId }),
    notifyLoadingPlanSaved: (planId: string) => 
      notifyContainerChange('loading_plan_saved', { planId }),
    notifyContainerTypeUpdated: (containerTypeId: string) => 
      notifyContainerChange('container_type_updated', { containerTypeId })
  };
};

export default useContainerSync;