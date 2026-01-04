import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CreditCard, 
  FileText, 
  Clock, 
  AlertCircle,
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar
} from 'lucide-react';

interface BusinessAlert {
  id: string;
  invoice_number: string;
  remaining_amount_idr: number;
  overdue_days: number;
  amount_idr: number;
  lc_number?: string;
  days_to_expiry?: number;
}

interface CatatanPentingItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  created_at: string;
  kategori: string;
}

const LiveAlert: React.FC = () => {
  const [businessAlerts, setBusinessAlerts] = useState<{
    receivables: BusinessAlert[];
    overdueInvoices: BusinessAlert[];
    lcExpiry: BusinessAlert[];
  }>({
    receivables: [],
    overdueInvoices: [],
    lcExpiry: []
  });
  
  const [catatanPenting, setCatatanPenting] = useState<CatatanPentingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      
      try {
        // Fetch outstanding receivables (overdue invoices)
        const { data: receivablesData } = await supabase
          .from('payment_tracking')
          .select('*')
          .gt('remaining_amount_idr', 0)
          .order('overdue_days', { ascending: false });

        // Fetch LC expiry alerts
        const { data: lcData } = await supabase
          .from('letter_of_credits')
          .select('*')
          .not('expiry_date', 'is', null)
          .order('expiry_date', { ascending: true });

        // Process LC expiry data to calculate days to expiry
        const processedLcData = lcData?.map(lc => {
          const today = new Date();
          const expiryDate = new Date(lc.expiry_date);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...lc,
            days_to_expiry: diffDays
          };
        }).filter(lc => lc.days_to_expiry <= 30 && lc.days_to_expiry >= 0) || [];

        // Fetch catatan penting
        const { data: catatanData } = await supabase
          .from('catatan_penting')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        setBusinessAlerts({
          receivables: receivablesData || [],
          overdueInvoices: (receivablesData || []).filter((item: any) => item.overdue_days > 0),
          lcExpiry: processedLcData
        });
        
        setCatatanPenting(catatanData || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const totalAlerts = businessAlerts.receivables.length + 
                     businessAlerts.overdueInvoices.length + 
                     businessAlerts.lcExpiry.length;

  const totalOutstanding = businessAlerts.receivables.reduce((sum, item) => sum + item.remaining_amount_idr, 0);
  const criticalNotes = catatanPenting.filter(note => note.priority === 'critical' || note.priority === 'high').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Live Alert Dashboard</h1>
          </div>
          <p className="text-gray-600">Real-time monitoring of critical business alerts and risks</p>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">Active</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalOutstanding).split(',')[0]}M
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 font-medium">Overdue</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">LC Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{businessAlerts.lcExpiry.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600 font-medium">Next 30 days</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Notes</p>
                <p className="text-2xl font-bold text-gray-900">{criticalNotes}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <TrendingDown className="h-4 w-4 text-purple-500" />
              <span className="text-purple-600 font-medium">High Priority</span>
            </div>
          </motion.div>
        </div>

        {/* Live Alerts Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Alerts */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Business Alerts</h3>
              <Badge variant="outline" className="text-red-700 border-red-300">
                {businessAlerts.receivables.length + businessAlerts.overdueInvoices.length + businessAlerts.lcExpiry.length} Active
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {/* Outstanding Receivables Alerts */}
              {businessAlerts.receivables.slice(0, 5).map((alert, index) => (
                <motion.div
                  key={`receivable-${alert.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl border border-red-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{alert.invoice_number}</p>
                    <p className="text-sm text-red-700">
                      Outstanding: {formatCurrency(alert.remaining_amount_idr)}
                    </p>
                    <p className="text-xs text-red-600">
                      {alert.overdue_days} days overdue
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {/* LC Expiry Alerts */}
              {businessAlerts.lcExpiry.slice(0, 3).map((alert, index) => (
                <motion.div
                  key={`lc-${alert.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (businessAlerts.receivables.length + index) * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">{alert.lc_number}</p>
                    <p className="text-sm text-yellow-700">
                      Value: {formatCurrency(alert.amount_idr)}
                    </p>
                    <p className="text-xs text-yellow-600">
                      Expires in {alert.days_to_expiry} days
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Critical Notes */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Critical Notes</h3>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                {catatanPenting.length} Items
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {catatanPenting.slice(0, 8).map((note, index) => {
                const priorityColors = {
                  critical: 'red',
                  high: 'yellow',
                  medium: 'blue',
                  low: 'green'
                };
                const color = priorityColors[note.priority] || 'gray';
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start space-x-3 p-3 bg-${color}-50 rounded-xl border border-${color}-200`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${color}-500 text-white mt-0.5`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-${color}-900`}>{note.title}</p>
                      {note.description && (
                        <p className={`text-sm text-${color}-700 line-clamp-2`}>
                          {note.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className={`text-${color}-700 border-${color}-300 text-xs`}>
                          {note.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={`text-${color}-700 border-${color}-300 text-xs`}>
                          {note.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAlert;