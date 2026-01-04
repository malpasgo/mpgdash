import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DataSyncContextType {
  refreshDashboard: () => Promise<void>;
  notifyDataChange: (moduleType: 'keuangan' | 'lc' | 'invoice' | 'payment' | 'container') => void;
  lastUpdated: Date;
  isRefreshing: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

interface DataSyncProviderProps {
  children: React.ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced refresh function to avoid excessive API calls
  const refreshDashboard = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log('🔄 Dashboard data refresh triggered at:', new Date().toISOString());
      
      // Clear any existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        setRefreshTimeout(null);
      }
      
      // Trigger data refresh in all dependent components
      const refreshEvent = new CustomEvent('dashboardDataChange', {
        detail: { 
          timestamp: new Date().toISOString(),
          source: 'realtime_sync'
        }
      });
      window.dispatchEvent(refreshEvent);
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshTimeout]);

  // Debounced data change notification
  const notifyDataChange = useCallback((moduleType: 'keuangan' | 'lc' | 'invoice' | 'payment' | 'container') => {
    console.log(`📊 Data change detected in module: ${moduleType}`);
    
    // Clear previous timeout if it exists
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Debounce updates - refresh after 1 second of no new changes
    const timeoutId = setTimeout(() => {
      refreshDashboard();
    }, 1000);
    
    setRefreshTimeout(timeoutId);
  }, [refreshDashboard, refreshTimeout]);

  // Set up Supabase real-time subscriptions
  useEffect(() => {
    console.log('🚀 Setting up Supabase real-time subscriptions...');
    
    // Create a single channel for all table changes
    const channel = supabase.channel('dashboard-sync', {
      config: {
        broadcast: { self: true },
        presence: { key: 'dashboard' }
      }
    });

    // Subscribe to Keuangan Ekspor table changes
    channel.on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'keuangan_ekspor'
      },
      (payload) => {
        console.log('💰 Keuangan Ekspor data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('keuangan');
      }
    );

    // Subscribe to Letter of Credits table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'letter_of_credits'
      },
      (payload) => {
        console.log('📄 LC data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('lc');
      }
    );

    // Subscribe to LC Amendments table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lc_amendments'
      },
      (payload) => {
        console.log('📝 LC Amendment data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('lc');
      }
    );

    // Subscribe to LC Documents table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lc_documents'
      },
      (payload) => {
        console.log('📋 LC Document data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('lc');
      }
    );

    // Subscribe to Invoices table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices'
      },
      (payload) => {
        console.log('🧾 Invoice data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('invoice');
      }
    );

    // Subscribe to Invoice Items table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoice_items'
      },
      (payload) => {
        console.log('📦 Invoice Item data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('invoice');
      }
    );

    // Subscribe to Invoice Payments table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoice_payments'
      },
      (payload) => {
        console.log('💳 Invoice Payment data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('payment');
      }
    );

    // Subscribe to Payment Terms Master table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_terms_master'
      },
      (payload) => {
        console.log('⚙️ Payment Terms Master data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('payment');
      }
    );

    // Subscribe to Payment Tracking table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_tracking'
      },
      (payload) => {
        console.log('📊 Payment Tracking data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('payment');
      }
    );

    // Subscribe to Payment Alerts table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_alerts'
      },
      (payload) => {
        console.log('🚨 Payment Alert data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('payment');
      }
    );

    // Subscribe to Payment History table changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_history'
      },
      (payload) => {
        console.log('📈 Payment History data changed:', payload.eventType, payload.new || payload.old);
        notifyDataChange('payment');
      }
    );

    // Handle subscription status
    channel.on('system', {}, (payload) => {
      console.log('🔌 Real-time connection status:', payload);
      if (payload.status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        console.log('✅ Successfully subscribed to real-time updates');
      } else if (payload.status === 'CHANNEL_ERROR') {
        setConnectionStatus('disconnected');
        console.error('❌ Real-time subscription error:', payload);
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        console.log('🎉 Real-time subscriptions active');
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('disconnected');
        console.error('💥 Subscription failed');
      } else if (status === 'TIMED_OUT') {
        setConnectionStatus('disconnected');
        console.warn('⏰ Subscription timed out');
      }
    });

    setRealtimeChannel(channel);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      channel.unsubscribe();
    };
  }, [notifyDataChange, refreshTimeout]);

  // Auto-refresh every 5 minutes as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered (5 min interval)');
      refreshDashboard();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [refreshTimeout, realtimeChannel]);

  const contextValue: DataSyncContextType = {
    refreshDashboard,
    notifyDataChange,
    lastUpdated,
    isRefreshing,
    connectionStatus
  };

  return (
    <DataSyncContext.Provider value={contextValue}>
      {children}
    </DataSyncContext.Provider>
  );
};

// Hook for components to use data sync
export const useDataChangeNotification = () => {
  const { notifyDataChange } = useDataSync();
  
  return {
    notifyKeuanganChange: () => notifyDataChange('keuangan'),
    notifyLCChange: () => notifyDataChange('lc'),
    notifyInvoiceChange: () => notifyDataChange('invoice'),
    notifyPaymentChange: () => notifyDataChange('payment'),
    notifyDataChange
  };
};

// Hook for Executive Dashboard to listen to data changes
export const useDashboardDataSync = () => {
  const { refreshDashboard, lastUpdated, isRefreshing, connectionStatus } = useDataSync();
  const [forceRefresh, setForceRefresh] = useState(0);

  useEffect(() => {
    const handleDataChange = (event: CustomEvent) => {
      console.log('📊 Dashboard received data change event:', event.detail);
      setForceRefresh(prev => prev + 1);
    };

    window.addEventListener('dashboardDataChange', handleDataChange as EventListener);
    return () => {
      window.removeEventListener('dashboardDataChange', handleDataChange as EventListener);
    };
  }, []);

  return {
    refreshDashboard,
    lastUpdated,
    isRefreshing,
    connectionStatus,
    forceRefresh // Use this as a dependency in useEffect to trigger re-renders
  };
};
