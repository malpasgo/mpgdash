import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Building2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  Filter,
  ArrowUpDown,
  TrendingUp,
  BarChart3,
  Bell,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Zap
} from 'lucide-react';
import { lcService, LetterOfCredit } from '@/lib/supabase';
import { useDataChangeNotification } from '@/contexts/DataSyncContext';
import LCForm from './LCForm';
import LCDetail from './LCDetail';
import { formatCurrency, formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

// Loading skeleton components
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="bg-gray-200 w-12 h-12 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

// Optimized LC card component
const LCCard = React.memo(({ lc, onClick, onEdit, onDelete }: {
  lc: LetterOfCredit;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'Draft': { color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
      'Issued': { color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
      'Confirmed': { color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      'Amended': { color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
      'Utilized': { color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
      'Expired': { color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
    };
    return configs[status as keyof typeof configs] || configs.Draft;
  };

  const statusConfig = getStatusConfig(lc.status);
  const isExpiring = lc.expiry_date && new Date(lc.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {lc.lc_number}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{lc.applicant}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {isExpiring && (
              <div className="bg-red-100 p-1.5 rounded-lg" title="Akan segera expired">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            )}
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              statusConfig.bgColor
            } ${
              statusConfig.textColor
            }`}>
              {lc.status}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(lc.amount_idr || 0, 'IDR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
            <p className="font-semibold text-gray-900">
              {lc.expiry_date ? formatDate(lc.expiry_date) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{lc.issuing_bank || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
              title="Edit LC"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              title="Delete LC"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

interface LCStats {
  total: number;
  draft: number;
  issued: number;
  confirmed: number;
  amended: number;
  utilized: number;
  expired: number;
  expiring: number;
  totalValue: number;
}

const LCManagement: React.FC = () => {
  // State management
  const [lcs, setLCs] = useState<LetterOfCredit[]>([]);
  const [filteredLCs, setFilteredLCs] = useState<LetterOfCredit[]>([]);
  const [expiringLCs, setExpiringLCs] = useState<LetterOfCredit[]>([]);
  const [stats, setStats] = useState<LCStats>({
    total: 0, draft: 0, issued: 0, confirmed: 0, amended: 0,
    utilized: 0, expired: 0, expiring: 0, totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('expiry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLC, setSelectedLC] = useState<LetterOfCredit | null>(null);
  const [showLCForm, setShowLCForm] = useState(false);
  const [editingLC, setEditingLC] = useState<LetterOfCredit | null>(null);
  const [deletingLC, setDeletingLC] = useState<LetterOfCredit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Data sync integration
  const { notifyLCChange } = useDataChangeNotification();

  // Load LCs with error handling
  const loadLCs = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📄 Loading LCs...');
      
      const data = await lcService.getAllLCs();
      console.log(`✅ Loaded ${data.length} LCs`);
      
      setLCs(data);
      calculateStats(data);
      
      // Load expiring LCs
      const expiring = await lcService.getExpiringLCs();
      setExpiringLCs(expiring);
    } catch (error) {
      console.error('❌ Error loading LCs:', error);
      // Set demo data on error
      setDemoData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Set demo data for fallback
  const setDemoData = useCallback(() => {
    const demoLCs: LetterOfCredit[] = [
      {
        id: '1',
        lc_number: 'LC-2025-001',
        issuing_bank: 'Bank Mandiri',
        advising_bank: 'HSBC Singapore',
        applicant: 'PT ABC Company',
        beneficiary: 'PT Malaka Pasai Global',
        lc_amount: 100000,
        lc_currency: 'USD',
        exchange_rate: 15000,
        amount_idr: 1500000000,
        issue_date: '2025-01-01',
        expiry_date: '2025-06-01',
        shipment_deadline: '2025-05-15',
        status: 'Issued',
        lc_type: 'Sight',
        payment_terms: '30 days',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        lc_number: 'LC-2025-002',
        issuing_bank: 'Bank BCA',
        advising_bank: 'Standard Chartered',
        applicant: 'PT XYZ Trading',
        beneficiary: 'PT Malaka Pasai Global',
        lc_amount: 75000,
        lc_currency: 'USD',
        exchange_rate: 15000,
        amount_idr: 1125000000,
        issue_date: '2025-01-15',
        expiry_date: '2025-07-15',
        shipment_deadline: '2025-07-01',
        status: 'Confirmed',
        lc_type: 'Usance',
        payment_terms: '60 days',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z'
      }
    ];
    setLCs(demoLCs);
    calculateStats(demoLCs);
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((lcData: LetterOfCredit[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const newStats = lcData.reduce((acc, lc) => {
      acc.total++;
      acc[lc.status.toLowerCase() as keyof LCStats]++;
      acc.totalValue += lc.amount_idr || 0;
      
      // Calculate expiring count
      if (lc.expiry_date && lc.status !== 'Expired') {
        const expiryDate = new Date(lc.expiry_date);
        if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
          acc.expiring++;
        }
      }
      
      return acc;
    }, {
      total: 0, draft: 0, issued: 0, confirmed: 0, amended: 0,
      utilized: 0, expired: 0, expiring: 0, totalValue: 0
    } as LCStats);
    
    setStats(newStats);
  }, []);

  // Filter and sort LCs
  const filterLCs = useCallback(() => {
    let filtered = lcs.filter(lc => {
      const matchesSearch = lc.lc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lc.applicant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lc.issuing_bank?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort filtered data
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof LetterOfCredit] || '';
      const bValue = b[sortBy as keyof LetterOfCredit] || '';
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredLCs(filtered);
  }, [lcs, searchQuery, statusFilter, sortBy, sortOrder]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLCs();
    setRefreshing(false);
  }, [loadLCs]);

  // Handle LC actions
  const handleAdd = useCallback(() => {
    setEditingLC(null);
    setShowLCForm(true);
  }, []);

  const handleEdit = useCallback((lc: LetterOfCredit) => {
    setEditingLC(lc);
    setShowLCForm(true);
  }, []);

  const handleView = useCallback((lc: LetterOfCredit) => {
    setSelectedLC(lc);
  }, []);

  const handleDelete = useCallback((lc: LetterOfCredit) => {
    setDeletingLC(lc);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deletingLC) {
      try {
        await lcService.deleteLC(deletingLC.id);
        await loadLCs();
        notifyLCChange();
        setShowDeleteConfirm(false);
        setDeletingLC(null);
      } catch (error) {
        console.error('Error deleting LC:', error);
      }
    }
  }, [deletingLC, loadLCs, notifyLCChange]);

  // Effects
  useEffect(() => {
    loadLCs();
  }, [loadLCs]);

  useEffect(() => {
    filterLCs();
  }, [filterLCs]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const exportData = filteredLCs.map(lc => ({
      'LC Number': lc.lc_number,
      'Issuing Bank': lc.issuing_bank,
      'Applicant': lc.applicant,
      'Amount (USD)': lc.lc_amount,
      'Amount (IDR)': lc.amount_idr,
      'Issue Date': lc.issue_date,
      'Expiry Date': lc.expiry_date,
      'Status': lc.status,
      'Type': lc.lc_type
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LC Management');
    XLSX.writeFile(wb, `lc_management_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredLCs]);

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Letter of Credit Management</h1>
            <p className="text-gray-600">Kelola dan monitor Letter of Credit untuk transaksi ekspor</p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah LC</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total LC</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Letter of Credit</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active LC</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.issued + stats.confirmed + stats.amended}
                </p>
                <p className="text-xs text-gray-500">Issued, Confirmed, Amended</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                <p className="text-xs text-gray-500">Dalam 30 hari</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalValue, 'IDR')}
                </p>
                <p className="text-xs text-gray-500">Total exposure</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari LC number, applicant, bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Amended">Amended</option>
              <option value="Utilized">Utilized</option>
              <option value="Expired">Expired</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="expiry_date">Sort by Expiry</option>
              <option value="lc_number">Sort by LC Number</option>
              <option value="amount_idr">Sort by Amount</option>
              <option value="created_at">Sort by Created Date</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </span>
              </button>
              
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                  title="Grid View"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-3 transition-colors ${
                    viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                  title="Table View"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* LC List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredLCs.map((lc) => (
                  <LCCard
                    key={lc.id}
                    lc={lc}
                    onClick={() => handleView(lc)}
                    onEdit={() => handleEdit(lc)}
                    onDelete={() => handleDelete(lc)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LC Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLCs.map((lc, index) => (
                      <motion.tr
                        key={lc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleView(lc)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lc.lc_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lc.applicant}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatCurrency(lc.amount_idr || 0, 'IDR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lc.expiry_date ? formatDate(lc.expiry_date) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            lc.status === 'Draft' ? 'bg-gray-50 text-gray-700' :
                            lc.status === 'Issued' ? 'bg-blue-50 text-blue-700' :
                            lc.status === 'Confirmed' ? 'bg-green-50 text-green-700' :
                            lc.status === 'Amended' ? 'bg-yellow-50 text-yellow-700' :
                            lc.status === 'Utilized' ? 'bg-purple-50 text-purple-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {lc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(lc);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(lc);
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLCs.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Tidak ada LC yang ditemukan</p>
                  <p className="text-gray-500 text-sm mt-2">Coba ubah filter pencarian atau tambah LC baru</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {filteredLCs.length === 0 && viewMode === 'grid' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-lg mx-auto">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada LC yang ditemukan</h3>
              <p className="text-gray-600 mb-6">Coba ubah filter pencarian atau tambah LC baru</p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4" />
                Tambah LC Pertama
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLCForm && (
          <LCForm
            lc={editingLC}
            onCancel={() => {
              setShowLCForm(false);
              setEditingLC(null);
            }}
            onSave={() => {
              setShowLCForm(false);
              setEditingLC(null);
              loadLCs().then(() => notifyLCChange());
            }}
          />
        )}
        
        {selectedLC && (
          <LCDetail
            lc={selectedLC}
            onClose={() => setSelectedLC(null)}
            onEdit={() => {
              setEditingLC(selectedLC);
              setSelectedLC(null);
              setShowLCForm(true);
            }}
          />
        )}
        
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete LC <strong>{deletingLC?.lc_number}</strong>?
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                >
                  Delete LC
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LCManagement;