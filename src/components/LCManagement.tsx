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
  ArrowLeft
} from 'lucide-react';
import { lcService, LetterOfCredit } from '@/lib/supabase';
import { useDataChangeNotification } from '@/contexts/DataSyncContext';
import LCForm from './LCForm';
import LCDetail from './LCDetail';
import { formatCurrency, formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

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
  const [lcs, setLCs] = useState<LetterOfCredit[]>([]);
  const [filteredLCs, setFilteredLCs] = useState<LetterOfCredit[]>([]);
  const [expiringLCs, setExpiringLCs] = useState<LetterOfCredit[]>([]);
  const [stats, setStats] = useState<LCStats>({
    total: 0,
    draft: 0,
    issued: 0,
    confirmed: 0,
    amended: 0,
    utilized: 0,
    expired: 0,
    expiring: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('expiry_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLC, setSelectedLC] = useState<LetterOfCredit | null>(null);
  const [showLCForm, setShowLCForm] = useState(false);
  const [editingLC, setEditingLC] = useState<LetterOfCredit | null>(null);
  const [deletingLC, setDeletingLC] = useState<LetterOfCredit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Data sync integration
  const { notifyLCChange } = useDataChangeNotification();

  useEffect(() => {
    loadLCs();
    loadExpiringLCs();
  }, []);

  useEffect(() => {
    filterLCs();
  }, [lcs, searchQuery, statusFilter, sortBy, sortOrder]);

  const loadLCs = async () => {
    try {
      setLoading(true);
      const data = await lcService.getAllLCs();
      setLCs(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading LCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringLCs = async () => {
    try {
      const expiring = await lcService.getExpiringLCs();
      setExpiringLCs(expiring);
    } catch (error) {
      console.error('Error loading expiring LCs:', error);
    }
  };

  const calculateStats = (lcData: LetterOfCredit[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const newStats = lcData.reduce((acc, lc) => {
      acc.total++;
      acc[lc.status.toLowerCase() as keyof LCStats]++;
      acc.totalValue += lc.amount_idr || 0;
      
      // Calculate expiring count from actual data
      if (lc.expiry_date && lc.status !== 'Expired') {
        const expiryDate = new Date(lc.expiry_date);
        if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
          acc.expiring++;
        }
      }
      
      return acc;
    }, {
      total: 0,
      draft: 0,
      issued: 0,
      confirmed: 0,
      amended: 0,
      utilized: 0,
      expired: 0,
      expiring: 0,
      totalValue: 0
    });
    
    setStats(newStats);
  };

  const filterLCs = () => {
    let filtered = lcs;

    if (searchQuery) {
      filtered = filtered.filter(lc => 
        lc.lc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lc.applicant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lc.beneficiary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lc.issuing_bank?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lc => lc.status.toLowerCase() === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'lc_number':
          valueA = a.lc_number;
          valueB = b.lc_number;
          break;
        case 'applicant':
          valueA = a.applicant || '';
          valueB = b.applicant || '';
          break;
        case 'beneficiary':
          valueA = a.beneficiary || '';
          valueB = b.beneficiary || '';
          break;
        case 'amount':
          valueA = a.lc_amount || 0;
          valueB = b.lc_amount || 0;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'expiry_date':
          valueA = new Date(a.expiry_date || '1970-01-01');
          valueB = new Date(b.expiry_date || '1970-01-01');
          break;
        default:
          valueA = a.lc_number;
          valueB = b.lc_number;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    setFilteredLCs(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText },
      'Issued': { variant: 'default' as const, color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      'Confirmed': { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Amended': { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Edit },
      'Utilized': { variant: 'default' as const, color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp },
      'Expired': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 px-3 py-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getDaysToExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleLCCreated = () => {
    setShowLCForm(false);
    setEditingLC(null);
    loadLCs();
    loadExpiringLCs();
    // Notify Executive Dashboard of data change
    notifyLCChange();
  };

  const handleEditLC = (lc: LetterOfCredit) => {
    setEditingLC(lc);
    setShowLCForm(true);
  };

  const handleViewLC = (lc: LetterOfCredit) => {
    setSelectedLC(lc);
  };

  const handleLihatDetail = () => {
    console.log('🔍 Tombol Lihat Detail diklik!');
    
    // Set sorting to expiry date ascending (yang akan expired pertama di atas)
    console.log('⚙️ Mengubah sorting ke Tanggal Expiry (ascending)');
    setSortBy('expiry_date');
    setSortOrder('asc');
    
    // Visual feedback untuk user
    console.log('✨ Menampilkan feedback loading');
    
    // Scroll smooth ke tabel LC dengan delay untuk memastikan sorting selesai
    setTimeout(() => {
      console.log('🎯 Mencari target element untuk scroll');
      
      // Try multiple selectors untuk memastikan ketemu
      let tableElement = document.querySelector('[data-lc-table]');
      if (!tableElement) {
        console.log('❌ Selector [data-lc-table] tidak ditemukan, mencoba selector alternatif');
        tableElement = document.querySelector('.overflow-x-auto');
      }
      if (!tableElement) {
        console.log('❌ Selector .overflow-x-auto tidak ditemukan, mencoba selector table');
        tableElement = document.querySelector('table');
      }
      
      if (tableElement) {
        console.log('✅ Target element ditemukan, melakukan scroll');
        tableElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Add visual highlight effect
        const card = tableElement.closest('.shadow-lg') as HTMLElement;
        if (card) {
          card.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.3)';
          setTimeout(() => {
            card.style.boxShadow = '';
          }, 2000);
        }
        
        console.log('🎉 Scroll dan highlight selesai!');
      } else {
        console.error('❌ Tidak dapat menemukan target element untuk scroll');
      }
    }, 150);
  };

  const handleHeaderSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const exportToExcel = () => {
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(filteredLCs.map(lc => ({
      'Nomor LC': lc.lc_number,
      'Applicant': lc.applicant || '-',
      'Beneficiary': lc.beneficiary || '-',
      'Nilai LC': lc.lc_amount || 0,
      'Nilai IDR': lc.amount_idr || 0,
      'Status': lc.status,
      'Tanggal Penerbitan': lc.issue_date || '-',
      'Tanggal Expiry': lc.expiry_date || '-',
      'Bank Penerbit': lc.issuing_bank || '-',
      'Bank Pemberitahu': lc.advising_bank || '-',
      'Jenis LC': lc.lc_type || '-'
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Letter of Credit');
    
    // Generate filename
    const filename = `letter_of_credit_${currentDate}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
  };

  const handleDeleteLC = (lc: LetterOfCredit) => {
    setDeletingLC(lc);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLC = async () => {
    if (!deletingLC) return;
    
    try {
      await lcService.deleteLC(deletingLC.id);
      await loadLCs();
      await loadExpiringLCs();
      setShowDeleteConfirm(false);
      setDeletingLC(null);
    } catch (error) {
      console.error('Error deleting LC:', error);
      alert('Gagal menghapus LC. Silakan coba lagi.');
    }
  };

  const handleDownloadLC = async (lc: LetterOfCredit) => {
    try {
      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Create a temporary div to render LC content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Create LC content HTML
      const lcHTML = `
        <div style="max-width: 720px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1f2937; padding-bottom: 20px;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">${lc.lc_number}</h1>
            <p style="font-size: 16px; color: #6b7280; margin: 10px 0 0 0;">${lc.lc_type || '-'}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📄 Informasi Dasar</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Nomor LC:</strong><br/><span style="color: #1f2937;">${lc.lc_number}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Jenis LC:</strong><br/><span style="color: #1f2937;">${lc.lc_type || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Status:</strong><br/><span style="color: #1f2937;">${lc.status}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Kurs Pertukaran:</strong><br/><span style="color: #1f2937;">1 ${lc.lc_currency || 'USD'} = ${(lc.exchange_rate || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDR</span></div>
              </div>
            </div>
            
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">👥 Pihak Terlibat</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Applicant:</strong><br/><span style="color: #1f2937;">${lc.applicant || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Beneficiary:</strong><br/><span style="color: #1f2937;">${lc.beneficiary || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Issuing Bank:</strong><br/><span style="color: #1f2937;">${lc.issuing_bank || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Advising Bank:</strong><br/><span style="color: #1f2937;">${lc.advising_bank || '-'}</span></div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📅 Tanggal Penting</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px;">
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Tanggal Penerbitan:</strong><br/><span style="color: #1f2937;">${lc.issue_date ? new Date(lc.issue_date).toLocaleDateString('id-ID') : '-'}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Tanggal Expiry:</strong><br/><span style="color: #1f2937;">${lc.expiry_date ? new Date(lc.expiry_date).toLocaleDateString('id-ID') : '-'}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Batas Pengiriman:</strong><br/><span style="color: #1f2937;">${lc.shipment_deadline ? new Date(lc.shipment_deadline).toLocaleDateString('id-ID') : '-'}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Batas Negosiasi:</strong><br/><span style="color: #1f2937;">${lc.negotiation_deadline ? new Date(lc.negotiation_deadline).toLocaleDateString('id-ID') : '-'}</span></div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">💰 Detail Finansial</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div><strong style="color: #4b5563;">Nilai LC:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${(lc.lc_amount || 0).toLocaleString('id-ID', { style: 'currency', currency: lc.lc_currency || 'USD' })}</span></div>
              <div><strong style="color: #4b5563;">Kurs:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${(lc.exchange_rate || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div><strong style="color: #4b5563;">Nilai dalam IDR:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${(lc.amount_idr || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
            </div>
          </div>
          
          ${lc.payment_terms ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">💳 Syarat Pembayaran</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${lc.payment_terms}</p>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Dokumen ini digenerate secara otomatis pada ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      `;
      
      tempDiv.innerHTML = lcHTML;
      document.body.appendChild(tempDiv);
      
      // Wait for fonts and content to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configure html2canvas options for better quality
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // A4 dimensions
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Set margins
      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 15;
      const bottomMargin = 15;
      
      // Calculate available content area
      const contentWidth = pageWidth - leftMargin - rightMargin;
      const contentHeight = pageHeight - topMargin - bottomMargin;
      
      // Calculate scale to fit content in single page
      const scaleByWidth = contentWidth / (canvas.width / 1.5);
      const scaleByHeight = contentHeight / (canvas.height / 1.5);
      const scale = Math.min(scaleByWidth, scaleByHeight);
      
      // Calculate final dimensions
      const finalWidth = (canvas.width / 1.5) * scale;
      const finalHeight = (canvas.height / 1.5) * scale;
      
      // Center the content
      const xPosition = leftMargin + (contentWidth - finalWidth) / 2;
      const yPosition = topMargin;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `LC_${lc.lc_number}_${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error downloading LC:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const cancelDeleteLC = () => {
    setShowDeleteConfirm(false);
    setDeletingLC(null);
  };

  // If showLCForm is set, show full-page form view
  if (showLCForm) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold leading-tight mb-2">
                  {editingLC ? 'Edit Letter of Credit' : 'Tambah Letter of Credit Baru'}
                </h1>
                <p className="text-blue-100 text-lg">
                  {editingLC ? 'Perbarui informasi Letter of Credit yang dipilih' : 'Buat Letter of Credit baru untuk transaksi ekspor impor'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowLCForm(false);
                  setEditingLC(null);
                }}
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 border-0"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-8">
              <LCForm
                lc={editingLC}
                onSave={() => {
                  handleLCCreated();
                }}
                onCancel={() => {
                  setShowLCForm(false);
                  setEditingLC(null);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If selectedLC is set, show full-page detail view
  if (selectedLC) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <LCDetail
          lc={selectedLC}
          onClose={() => setSelectedLC(null)}
          onEdit={() => {
            setEditingLC(selectedLC);
            setSelectedLC(null);
            setShowLCForm(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with gradient background and improved layout */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                  <FileText className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold leading-tight">Letter of Credit Management</h1>
                  <p className="text-blue-100 text-xl mt-2 font-medium">
                    Kelola dan pantau Letter of Credit untuk transaksi ekspor impor dengan mudah
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Action Button */}
            <Button 
              onClick={() => setShowLCForm(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl px-8 py-4 text-lg font-bold rounded-2xl border-2 border-white/20 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-6 h-6 mr-3" />
              Tambah LC Baru
            </Button>
          </div>
        </div>



        {/* Enhanced Stats Cards with Superior Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
                  <p className="text-blue-100 font-medium text-sm">Total LC</p>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0 rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-2xl font-bold">{stats.confirmed}</CardTitle>
                  <p className="text-green-100 font-medium text-sm">Confirmed</p>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-xl border-0 rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-2xl font-bold">{stats.expiring}</CardTitle>
                  <p className="text-yellow-100 font-medium text-sm">Expiring Soon</p>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 md:col-span-2">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <CardTitle className="text-xl font-bold">{formatCurrency(stats.totalValue, 'IDR')}</CardTitle>
                  <p className="text-purple-100 font-medium text-sm">Total Value</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Enhanced Alerts for Expiring LCs with better design */}
        {expiringLCs.length > 0 && (
          <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg rounded-2xl border-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-xl border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-amber-900">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <strong className="text-lg font-bold">Peringatan LC Akan Expired</strong>
                      <p className="text-base font-medium">Ada {expiringLCs.length} LC yang akan expired dalam 30 hari ke depan.</p>
                      <p className="text-amber-700 text-sm font-medium bg-amber-100 px-2 py-1 rounded-lg inline-block">
                        Segera lakukan tindakan yang diperlukan untuk menghindari keterlambatan.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-amber-400 text-amber-700 hover:bg-amber-100 hover:border-amber-500 hover:shadow-md rounded-xl px-4 py-2 font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
                      onClick={handleLihatDetail}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat Detail
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Enhanced Filters with Better Layout */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Cari LC berdasarkan nomor, applicant, beneficiary, atau bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] h-12 pl-10 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="amended">Amended</SelectItem>
                      <SelectItem value="utilized">Utilized</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced LC Table with Better Design */}
        <Card className="shadow-lg border-0" data-lc-table>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900">Daftar Letter of Credit</CardTitle>
                <CardDescription className="text-lg mt-1">
                  Menampilkan {filteredLCs.length} dari {lcs.length} total LC
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-gray-300" onClick={exportToExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Memuat data LC...</p>
                </div>
              </div>
            ) : filteredLCs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Tidak ada LC yang sesuai dengan filter' 
                    : 'Belum ada LC yang terdaftar'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Coba ubah filter pencarian atau tambah LC baru'
                    : 'Mulai dengan menambahkan Letter of Credit pertama'
                  }
                </p>
                <Button onClick={() => setShowLCForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah LC Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('lc_number')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Nomor LC</span>
                          {sortBy === 'lc_number' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('applicant')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Applicant</span>
                          {sortBy === 'applicant' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('beneficiary')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Beneficiary</span>
                          {sortBy === 'beneficiary' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('amount')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Nilai</span>
                          {sortBy === 'amount' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('status')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Status</span>
                          {sortBy === 'status' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-4 px-6 font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                        onClick={() => handleHeaderSort('expiry_date')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>Tanggal Expiry</span>
                          {sortBy === 'expiry_date' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLCs.map((lc, index) => {
                      const daysToExpiry = lc.expiry_date ? getDaysToExpiry(lc.expiry_date) : null;
                      return (
                        <tr key={lc.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-blue-600 text-lg">{lc.lc_number}</div>
                                <div className="text-sm text-gray-500 font-medium">{lc.lc_type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-gray-900">{lc.applicant}</div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {lc.issuing_bank}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-gray-900">{lc.beneficiary}</div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Building2 className="w-3 h-3 mr-1" />
                                {lc.advising_bank}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-lg text-gray-900">
                                {formatCurrency(lc.lc_amount || 0, lc.lc_currency || 'USD')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(lc.amount_idr || 0, 'IDR')}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(lc.status)}
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">
                                {lc.expiry_date ? formatDate(lc.expiry_date) : '-'}
                              </div>
                              {daysToExpiry !== null && (
                                <div className={`text-sm font-medium flex items-center mt-1 ${
                                  daysToExpiry <= 7 ? 'text-red-600' :
                                  daysToExpiry <= 30 ? 'text-amber-600' : 'text-green-600'
                                }`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {daysToExpiry > 0 ? `${daysToExpiry} hari lagi` : 'Expired'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewLC(lc)}
                                className="text-blue-600 hover:bg-blue-100 h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditLC(lc)}
                                className="text-emerald-600 hover:bg-emerald-100 h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDownloadLC(lc)}
                                className="text-gray-600 hover:bg-gray-100 h-8 w-8 p-0"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteLC(lc)}
                                className="text-red-600 hover:bg-red-100 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Hapus Letter of Credit
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus Letter of Credit berikut?
              </p>
              {deletingLC && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="font-semibold text-gray-900">{deletingLC.lc_number}</div>
                  <div className="text-sm text-gray-500">{deletingLC.applicant}</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(deletingLC.lc_amount || 0, deletingLC.lc_currency || 'USD')}
                  </div>
                </div>
              )}
              <p className="text-red-600 text-sm mt-4 font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelDeleteLC}
                className="border-gray-300"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteLC}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus LC
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LCManagement;