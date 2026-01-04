import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Bell,
  CreditCard,
  BarChart3,
  PieChart,
  Settings,
  Filter,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { paymentTermsService, invoiceService, PaymentTracking, PaymentAlert, PaymentTermsMaster, Invoice } from '@/lib/supabase';
import { useDataChangeNotification } from '@/contexts/DataSyncContext';
import PaymentTermsForm from './PaymentTermsForm';
import PaymentTrackingDetail from './PaymentTrackingDetail';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentTermsStats {
  totalOutstanding: number;
  totalOverdue: number;
  upcomingPayments: number;
  completedPayments: number; // Now represents total amount
  completedPaymentsCount: number; // Count of completed payments
  partialPayments: number;
  overdueCount: number;
  activeAlertsCount: number;
  averagePaymentDays: number;
}

const PaymentTermsManagement: React.FC = () => {
  const [paymentTrackings, setPaymentTrackings] = useState<PaymentTracking[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsMaster[]>([]);
  const [paymentAlerts, setPaymentAlerts] = useState<PaymentAlert[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredTrackings, setFilteredTrackings] = useState<PaymentTracking[]>([]);
  const [stats, setStats] = useState<PaymentTermsStats>({
    totalOutstanding: 0,
    totalOverdue: 0,
    upcomingPayments: 0,
    completedPayments: 0,
    completedPaymentsCount: 0,
    partialPayments: 0,
    overdueCount: 0,
    activeAlertsCount: 0,
    averagePaymentDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTracking, setSelectedTracking] = useState<PaymentTracking | null>(null);
  const [showTermForm, setShowTermForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTermsMaster | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Data sync integration
  const { notifyPaymentChange } = useDataChangeNotification();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTrackings();
  }, [paymentTrackings, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trackingsData, termsData, alertsData, invoicesData] = await Promise.all([
        paymentTermsService.getInvoiceBasedPaymentTracking(), // Use invoice-based tracking
        paymentTermsService.getAllPaymentTerms(),
        paymentTermsService.getActiveAlerts(),
        invoiceService.getAllInvoices()
      ]);
      
      setPaymentTrackings(trackingsData);
      setPaymentTerms(termsData);
      setPaymentAlerts(alertsData);
      setInvoices(invoicesData);
      await calculateStats(trackingsData, alertsData);
    } catch (error) {
      console.error('Error loading payment terms data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (trackings: PaymentTracking[], alerts: PaymentAlert[]) => {
    try {
      const analytics = await paymentTermsService.getPaymentTermsAnalytics();
      
      // Calculate completed payments amount and count from trackings since service gives count
      const completedPaymentsAmount = trackings
        .filter(t => t.status === 'Completed')
        .reduce((sum, t) => sum + t.paid_amount_idr, 0);
      const completedPaymentsCount = trackings.filter(t => t.status === 'Completed').length;
      
      setStats({
        totalOutstanding: analytics.totalOutstanding,
        totalOverdue: analytics.totalOverdue,
        upcomingPayments: analytics.upcomingPayments,
        completedPayments: completedPaymentsAmount, // Use calculated amount instead of service count
        completedPaymentsCount: completedPaymentsCount,
        partialPayments: analytics.partialPayments,
        overdueCount: analytics.overdueCount,
        activeAlertsCount: alerts.filter(a => !a.is_acknowledged).length,
        averagePaymentDays: analytics.averagePaymentDays
      });
    } catch (error) {
      console.error('Error getting payment terms analytics:', error);
      
      // Fallback to direct calculation if service call fails
      const totalOutstanding = trackings
        .filter(t => t.status !== 'Completed')
        .reduce((sum, t) => sum + t.remaining_amount_idr, 0);
      
      const totalOverdue = trackings
        .filter(t => t.status === 'Overdue')
        .reduce((sum, t) => sum + t.remaining_amount_idr, 0);
      
      const today = new Date();
      const upcomingPayments = trackings
        .filter(t => {
          if (!t.target_date || t.status === 'Completed') return false;
          const target = new Date(t.target_date);
          const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 30 && daysDiff >= 0;
        })
        .reduce((sum, t) => sum + t.remaining_amount_idr, 0);
      
      const completedPayments = trackings
        .filter(t => t.status === 'Completed')
        .reduce((sum, t) => sum + t.paid_amount_idr, 0); // Total amount of completed payments
      const completedPaymentsCount = trackings.filter(t => t.status === 'Completed').length; // Count of completed payments
      const partialPayments = trackings.filter(t => t.status === 'Partial').length;
      const overdueCount = trackings.filter(t => t.status === 'Overdue').length;
      const activeAlertsCount = alerts.filter(a => !a.is_acknowledged).length;
      
      // Calculate average payment days
      const completedTrackings = trackings.filter(t => t.status === 'Completed' && t.actual_date && t.target_date);
      const averagePaymentDays = completedTrackings.length > 0
        ? completedTrackings.reduce((sum, t) => {
            const target = new Date(t.target_date!);
            const actual = new Date(t.actual_date!);
            return sum + Math.ceil((actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / completedTrackings.length
        : 0;
      
      setStats({
        totalOutstanding,
        totalOverdue,
        upcomingPayments,
        completedPayments,
        completedPaymentsCount,
        partialPayments,
        overdueCount,
        activeAlertsCount,
        averagePaymentDays
      });
    }
  };

  const filterTrackings = () => {
    let filtered = paymentTrackings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tracking => {
        const invoice = invoices.find(inv => inv.id === tracking.invoice_id);
        return (
          invoice?.invoice_number.toLowerCase().includes(query) ||
          invoice?.customer_name.toLowerCase().includes(query) ||
          tracking.notes?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tracking => tracking.status.toLowerCase().replace(' ', '') === statusFilter);
    }

    setFilteredTrackings(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Not Started': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
      'Partial': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: TrendingUp },
      'Completed': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Overdue': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Not Started'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 px-3 py-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getDaysInfo = (targetDate: string, status: string) => {
    if (!targetDate) return null;
    
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (status === 'Completed') {
      return <span className="text-green-600">Selesai</span>;
    } else if (diffDays < 0) {
      return <span className="text-red-600">{Math.abs(diffDays)} hari terlambat</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600">Jatuh tempo hari ini</span>;
    } else if (diffDays <= 7) {
      return <span className="text-orange-600">{diffDays} hari lagi</span>;
    } else {
      return <span className="text-blue-600">{diffDays} hari lagi</span>;
    }
  };

  const handleTermCreated = () => {
    setShowTermForm(false);
    setEditingTerm(null);
    loadData();
    // Notify Executive Dashboard of data change
    notifyPaymentChange();
  };

  const handleEditTerm = (term: PaymentTermsMaster) => {
    setEditingTerm(term);
    setShowTermForm(true);
  };

  const handleDeleteTerm = async (term: PaymentTermsMaster) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus payment term "${term.term_name}"?`)) {
      return;
    }

    try {
      // Soft delete by setting is_active to false
      await paymentTermsService.updatePaymentTerm(term.id, { is_active: false });
      loadData();
      // Notify Executive Dashboard of data change
      notifyPaymentChange();
    } catch (error) {
      console.error('Error deleting payment term:', error);
      alert('Terjadi kesalahan saat menghapus payment term.');
    }
  };

  const handleViewTracking = (tracking: PaymentTracking) => {
    setSelectedTracking(tracking);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await paymentTermsService.acknowledgeAlert(alertId, 'User');
      loadData();
      // Notify Executive Dashboard of data change
      notifyPaymentChange();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with gradient background */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CreditCard className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Payment Terms Monitoring</h1>
                  <p className="text-emerald-100 text-lg mt-1">
                    Monitoring dan tracking pembayaran berdasarkan payment terms secara real-time
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex gap-3">
              <Dialog open={showTermForm} onOpenChange={setShowTermForm}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg px-6 py-3 text-lg font-semibold">
                    <Settings className="w-5 h-5 mr-2" />
                    Kelola Payment Terms
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-black">
                      {editingTerm ? 'Edit Payment Term' : 'Tambah Payment Term Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <PaymentTermsForm
                    term={editingTerm}
                    onSave={handleTermCreated}
                    onCancel={() => {
                      setShowTermForm(false);
                      setEditingTerm(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Modern Minimalist Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Outstanding Card */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(stats.totalOutstanding, 'IDR')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Belum Terbayar</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Overdue Card */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Overdue</h3>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(stats.totalOverdue, 'IDR')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{stats.overdueCount} pembayaran</p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Payments Card */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Upcoming (30 hari)</h3>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(stats.upcomingPayments, 'IDR')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Akan Jatuh Tempo</p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Payments Card */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Completed Payments</h3>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.completedPayments, 'IDR')}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {stats.completedPaymentsCount} completed payments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Active Alerts with improved design */}
        {paymentAlerts.length > 0 && (
          <Alert className="border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-2xl rounded-3xl border-2">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-orange-100 rounded-2xl border border-orange-200">
                <Bell className="h-7 w-7 text-orange-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-orange-900">
                  <div className="space-y-4">
                    <div>
                      <strong className="text-2xl font-bold">Payment Alerts Aktif</strong>
                      <p className="text-lg font-medium mt-1">Ada {stats.activeAlertsCount} alert yang memerlukan perhatian segera.</p>
                    </div>
                    <div className="space-y-3">
                      {paymentAlerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className="flex justify-between items-center bg-white/90 rounded-2xl p-4 border border-orange-200 shadow-sm">
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800">{alert.message || `${alert.alert_type} - ${formatDate(alert.due_date)}`}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="px-4 py-2 border-orange-300 text-orange-700 hover:bg-orange-100 rounded-xl font-semibold"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tandai Dibaca
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Payment Tracking</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="terms">Master Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  Pembayaran Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTrackings
                    .filter(t => t.status === 'Overdue')
                    .slice(0, 5)
                    .map(tracking => {
                      const invoice = invoices.find(inv => inv.id === tracking.invoice_id);
                      return (
                        <div key={tracking.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{invoice?.invoice_number}</p>
                            <p className="text-sm text-gray-600">{invoice?.customer_name}</p>
                            <p className="text-sm text-red-600">
                              {tracking.overdue_days} hari terlambat
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(tracking.remaining_amount_idr, 'IDR')}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTracking(tracking)}
                              className="mt-1 h-6 px-2 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Detail
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {filteredTrackings.filter(t => t.status === 'Overdue').length === 0 && (
                    <p className="text-gray-500 text-center py-4">Tidak ada pembayaran overdue</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-600 mr-2" />
                  Pembayaran Akan Jatuh Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTrackings
                    .filter(t => {
                      if (!t.target_date || t.status === 'Completed') return false;
                      const today = new Date();
                      const target = new Date(t.target_date);
                      const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return daysDiff <= 30 && daysDiff >= 0;
                    })
                    .slice(0, 5)
                    .map(tracking => {
                      const invoice = invoices.find(inv => inv.id === tracking.invoice_id);
                      return (
                        <div key={tracking.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{invoice?.invoice_number}</p>
                            <p className="text-sm text-gray-600">{invoice?.customer_name}</p>
                            <p className="text-sm text-orange-600">
                              {getDaysInfo(tracking.target_date || '', tracking.status)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(tracking.remaining_amount_idr, 'IDR')}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTracking(tracking)}
                              className="mt-1 h-6 px-2 text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Detail
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {filteredTrackings.filter(t => {
                    if (!t.target_date || t.status === 'Completed') return false;
                    const today = new Date();
                    const target = new Date(t.target_date);
                    const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysDiff <= 30 && daysDiff >= 0;
                  }).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Tidak ada pembayaran akan jatuh tempo</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari berdasarkan nomor invoice, customer, atau notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="notstarted">Not Started</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Tracking List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Tracking</CardTitle>
              <CardDescription>
                Monitoring status pembayaran untuk setiap invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTrackings.map(tracking => {
                  const invoice = invoices.find(inv => inv.id === tracking.invoice_id);
                  const paymentTerm = paymentTerms.find(term => term.id === tracking.payment_term_id);
                  
                  return (
                    <div key={tracking.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {invoice?.invoice_number || 'N/A'}
                            </h3>
                            {getStatusBadge(tracking.status)}
                          </div>
                          <p className="text-gray-600 mb-1">{invoice?.customer_name}</p>
                          <p className="text-sm text-gray-500">
                            Payment Term: {paymentTerm?.term_name || 'N/A'}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Target: {tracking.target_date ? formatDate(tracking.target_date) : 'N/A'}
                            </span>
                            <span className="text-gray-600">
                              {getDaysInfo(tracking.target_date || '', tracking.status)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-semibold">
                              {formatCurrency(tracking.total_amount_idr, 'IDR')}
                            </p>
                          </div>
                          <div className="mb-2">
                            <p className="text-sm text-gray-600">Sisa</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(tracking.remaining_amount_idr, 'IDR')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTracking(tracking)}
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress Pembayaran</span>
                          <span>
                            {tracking.total_amount > 0 
                              ? Math.round((tracking.paid_amount / tracking.total_amount) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${tracking.total_amount > 0 
                                ? Math.round((tracking.paid_amount / tracking.total_amount) * 100)
                                : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredTrackings.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada data payment tracking ditemukan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 text-orange-600 mr-2" />
                Payment Alerts
              </CardTitle>
              <CardDescription>
                Alert dan notifikasi untuk pembayaran yang memerlukan perhatian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentAlerts.map(alert => {
                  const invoice = invoices.find(inv => inv.id === alert.invoice_id);
                  
                  const alertTypeConfig = {
                    'UPCOMING': { color: 'bg-orange-100 text-orange-800', label: 'Akan Jatuh Tempo' },
                    'OVERDUE': { color: 'bg-red-100 text-red-800', label: 'Terlambat' },
                    'PARTIAL_FOLLOW_UP': { color: 'bg-yellow-100 text-yellow-800', label: 'Follow Up Partial' }
                  };
                  
                  const config = alertTypeConfig[alert.alert_type as keyof typeof alertTypeConfig];
                  
                  return (
                    <div key={alert.id} className={`border rounded-lg p-4 ${
                      alert.is_acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={config?.color}>
                              {config?.label}
                            </Badge>
                            {alert.is_acknowledged && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Sudah Dibaca
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 mb-1">
                            {invoice?.invoice_number} - {invoice?.customer_name}
                          </p>
                          <p className="text-gray-600 mb-2">
                            {alert.message || `${alert.alert_type} - Jatuh tempo: ${formatDate(alert.due_date)}`}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Alert Date: {formatDate(alert.alert_date)}</span>
                            <span>Due Date: {formatDate(alert.due_date)}</span>
                            {alert.days_overdue > 0 && (
                              <span className="text-red-600">
                                {alert.days_overdue} hari terlambat
                              </span>
                            )}
                            {alert.days_before_due > 0 && (
                              <span className="text-orange-600">
                                {alert.days_before_due} hari sebelum jatuh tempo
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!alert.is_acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Tandai Dibaca
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {paymentAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada alert aktif saat ini</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Master Payment Terms</CardTitle>
                  <CardDescription>
                    Kelola jenis-jenis payment terms yang tersedia
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTermForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Term Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentTerms.map(term => (
                  <div key={term.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{term.term_name}</h3>
                        <p className="text-sm text-gray-600">{term.term_code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {term.is_default && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            Default
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTerm(term)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTerm(term)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{term.term_description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type: {term.term_type}</span>
                      <span className="text-gray-600">
                        {term.days_to_pay > 0 ? `${term.days_to_pay} hari` : 'Immediate'}
                      </span>
                    </div>
                    {term.percentage > 0 && term.percentage < 100 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Percentage: {term.percentage}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Tracking Detail Dialog */}
      {selectedTracking && (
        <Dialog open={!!selectedTracking} onOpenChange={() => setSelectedTracking(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Payment Tracking</DialogTitle>
            </DialogHeader>
            <PaymentTrackingDetail
              tracking={selectedTracking}
              invoice={invoices.find(inv => inv.id === selectedTracking.invoice_id)}
              paymentTerm={paymentTerms.find(term => term.id === selectedTracking.payment_term_id)}
              onUpdate={loadData}
              onClose={() => setSelectedTracking(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  </div>
  );
};

export default PaymentTermsManagement;