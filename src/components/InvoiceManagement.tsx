import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calculator,
  Filter,
  ArrowUpDown,
  Receipt,
  Target,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { invoiceService, Invoice } from '@/lib/supabase';
import { useDataChangeNotification } from '@/contexts/DataSyncContext';
import InvoiceForm from './InvoiceForm';
import InvoiceDetail from './InvoiceDetail';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  partial: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalPaid: number;
}

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    draft: 0,
    sent: 0,
    partial: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    totalPaid: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [sortBy, setSortBy] = useState<string>('invoice_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data sync integration
  const { notifyInvoiceChange } = useDataChangeNotification();

  useEffect(() => {
    loadInvoices();
    loadOverdueInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading invoices...');
      const data = await invoiceService.getAllInvoices();
      console.log('📊 Loaded invoices:', data.length, 'invoices');
      setInvoices(data);
      calculateStats(data);
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      // Set some demo data if real data fails
      const demoInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'INV-2025-001',
          customer_name: 'PT ABC Company',
          invoice_date: '2025-01-15',
          due_date: '2025-02-15',
          invoice_type: 'Commercial',
          status: 'Sent',
          payment_status: 'Unpaid',
          currency: 'USD',
          total_amount: 50000,
          total_amount_idr: 750000000,
          subtotal: 45000,
          exchange_rate: 15000,
          tax_amount: 5000,
          tax_rate: 10,
          payment_terms: '30 days',
          notes: 'Payment for exported goods',
          internal_notes: 'Priority customer',
          customer_address: 'Jakarta, Indonesia',
          customer_email: 'finance@abc.co.id',
          customer_phone: '+62-21-12345678',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        },
        {
          id: '2',
          invoice_number: 'INV-2025-002',
          customer_name: 'CV XYZ Trading',
          invoice_date: '2025-01-20',
          due_date: '2025-02-20',
          invoice_type: 'Proforma',
          status: 'Draft',
          payment_status: 'Unpaid',
          currency: 'EUR',
          total_amount: 25000,
          total_amount_idr: 425000000,
          subtotal: 22500,
          exchange_rate: 17000,
          tax_amount: 2500,
          tax_rate: 10,
          payment_terms: '45 days',
          notes: 'Proforma for upcoming shipment',
          internal_notes: 'New customer',
          customer_address: 'Surabaya, Indonesia',
          customer_email: 'orders@xyz.co.id',
          customer_phone: '+62-31-87654321',
          created_at: '2025-01-20T00:00:00Z',
          updated_at: '2025-01-20T00:00:00Z'
        }
      ];
      console.log('📊 Using demo data instead:', demoInvoices.length, 'invoices');
      setInvoices(demoInvoices);
      calculateStats(demoInvoices);
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueInvoices = async () => {
    try {
      const overdue = await invoiceService.getOverdueInvoices();
      setOverdueInvoices(overdue);
    } catch (error) {
      console.error('Error loading overdue invoices:', error);
    }
  };

  const calculateStats = (invoiceData: Invoice[]) => {
    const newStats = invoiceData.reduce(
      (acc, invoice) => {
        acc.total++;
        acc[invoice.status.toLowerCase() as keyof InvoiceStats]++;
        
        if (invoice.payment_status !== 'Paid') {
          acc.totalOutstanding += invoice.total_amount_idr || 0;
        }
        
        if (invoice.payment_status === 'Paid') {
          acc.totalPaid += invoice.total_amount_idr || 0;
        }
        
        // Check if overdue
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        if (dueDate < today && invoice.payment_status !== 'Paid') {
          acc.overdue++;
          acc.totalOverdue += invoice.total_amount_idr || 0;
        }
        
        return acc;
      },
      {
        total: 0,
        draft: 0,
        sent: 0,
        partial: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        totalPaid: 0
      }
    );
    
    setStats(newStats);
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchQuery) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (invoice.notes && invoice.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status.toLowerCase() === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.invoice_type.toLowerCase().replace(' ', '') === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'invoice_number':
          valueA = a.invoice_number;
          valueB = b.invoice_number;
          break;
        case 'customer_name':
          valueA = a.customer_name;
          valueB = b.customer_name;
          break;
        case 'invoice_date':
          valueA = new Date(a.invoice_date);
          valueB = new Date(b.invoice_date);
          break;
        case 'due_date':
          valueA = new Date(a.due_date);
          valueB = new Date(b.due_date);
          break;
        case 'total_amount':
          valueA = a.total_amount_idr || 0;
          valueB = b.total_amount_idr || 0;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = new Date(a.invoice_date);
          valueB = new Date(b.invoice_date);
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    setFilteredInvoices(filtered);
  };

  const handleHeaderSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'Paid') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 bg-green-50 flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold shadow-sm">
          <CheckCircle className="w-4 h-4" />
          Paid
        </Badge>
      );
    }
    
    const statusConfig = {
      Draft: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText, bgClass: 'bg-gray-50' },
      Sent: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: TrendingUp, bgClass: 'bg-blue-50' },
      Partial: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, bgClass: 'bg-yellow-50' },
      Paid: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, bgClass: 'bg-green-50' },
      Overdue: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, bgClass: 'bg-red-50' },
      Cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle, bgClass: 'bg-gray-50' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} ${config.bgClass} flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold shadow-sm`}>
        <Icon className="w-4 h-4" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      Proforma: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Receipt, bgClass: 'bg-purple-50' },
      Commercial: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText, bgClass: 'bg-blue-50' },
      'Credit Note': { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TrendingDown, bgClass: 'bg-orange-50' },
      'Debit Note': { color: 'bg-red-100 text-red-800 border-red-300', icon: TrendingUp, bgClass: 'bg-red-50' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['Proforma'];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} ${config.bgClass} flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold shadow-sm`}>
        <Icon className="w-4 h-4" />
        {type}
      </Badge>
    );
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleInvoiceCreated = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    loadInvoices();
    loadOverdueInvoices();
    // Notify Executive Dashboard of data change
    notifyInvoiceChange();
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('👁️ View invoice clicked:', invoice.invoice_number);
    setSelectedInvoice(invoice);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setDeletingInvoice(invoice);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    
    try {
      await invoiceService.deleteInvoice(deletingInvoice.id);
      await loadInvoices();
      await loadOverdueInvoices();
      setShowDeleteConfirm(false);
      setDeletingInvoice(null);
      // Notify Executive Dashboard of data change
      notifyInvoiceChange();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert(error instanceof Error ? error.message : 'Gagal menghapus invoice. Silakan coba lagi.');
    }
  };

  const cancelDeleteInvoice = () => {
    setShowDeleteConfirm(false);
    setDeletingInvoice(null);
  };

  const handleDownloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Fetch invoice items for Invoice Items table
      let items = [];
      
      try {
        items = await invoiceService.getInvoiceItems(invoice.id);
      } catch (error) {
        console.error('Error loading invoice items for PDF:', error);
        // Continue with empty array if data fetch fails
      }

      // Create a temporary div to render Invoice content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Generate items table HTML for Invoice List PDF
      const itemsHTML = items.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Invoice Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">#</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Qty</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Unit Price</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.line_number}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">
                    ${item.description}${item.hs_code ? `<br/><small>HS: ${item.hs_code}</small>` : ''}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.quantity} ${item.unit_of_measure}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${item.unit_price.toLocaleString('id-ID')} ${item.currency}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${item.amount.toLocaleString('id-ID')} ${item.currency}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Subtotal:</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${invoice.subtotal.toLocaleString('id-ID')} ${invoice.currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : '';
      
      // Create simplified Invoice content HTML for list download with Invoice Items
      const invoiceHTML = `
        <div style="max-width: 720px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1f2937; padding-bottom: 20px;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">${invoice.invoice_number}</h1>
            <p style="font-size: 16px; color: #6b7280; margin: 10px 0 0 0;">${invoice.invoice_type} Invoice</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Invoice Information</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Number:</strong><br/><span style="color: #1f2937;">${invoice.invoice_number}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Type:</strong><br/><span style="color: #1f2937;">${invoice.invoice_type}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Status:</strong><br/><span style="color: #1f2937;">${invoice.status}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Payment Status:</strong><br/><span style="color: #1f2937;">${invoice.payment_status}</span></div>

              </div>
            </div>
            
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Customer Information</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Customer Name:</strong><br/><span style="color: #1f2937;">${invoice.customer_name}</span></div>
                ${invoice.customer_address ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Address:</strong><br/><span style="color: #1f2937;">${invoice.customer_address.replace(/\n/g, '<br/>')}</span></div>` : ''}
                ${invoice.customer_email ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Email:</strong><br/><span style="color: #1f2937;">${invoice.customer_email}</span></div>` : ''}
                ${invoice.customer_phone ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Phone:</strong><br/><span style="color: #1f2937;">${invoice.customer_phone}</span></div>` : ''}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Important Dates</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Date:</strong><br/><span style="color: #1f2937;">${new Date(invoice.invoice_date).toLocaleDateString('id-ID')}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Due Date:</strong><br/><span style="color: #1f2937;">${new Date(invoice.due_date).toLocaleDateString('id-ID')}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Payment Terms:</strong><br/><span style="color: #1f2937;">${invoice.payment_terms || '-'}</span></div>
            </div>
          </div>
          
          ${itemsHTML}
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Financial Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Subtotal:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${invoice.subtotal.toLocaleString('id-ID')} ${invoice.currency}</span></div>
                ${invoice.tax_amount && invoice.tax_amount > 0 ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Tax (${invoice.tax_rate}%):</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${invoice.tax_amount.toLocaleString('id-ID')} ${invoice.currency}</span></div>` : ''}
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Total (${invoice.currency}):</strong><br/><span style="color: #1f2937; font-size: 20px; font-weight: bold;">${invoice.total_amount.toLocaleString('id-ID')} ${invoice.currency}</span></div>
              </div>
              <div>

              </div>
            </div>
          </div>
          
          ${invoice.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Notes</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${invoice.notes}</p>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Invoice document generated automatically on ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      `;
      
      tempDiv.innerHTML = invoiceHTML;
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
      const filename = `Invoice_${invoice.invoice_number}_${timestamp}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  // If selectedInvoice is set, show full-page detail view
  if (selectedInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <InvoiceDetail
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={() => {
            setEditingInvoice(selectedInvoice);
            setSelectedInvoice(null);
            setShowInvoiceForm(true);
          }}
          onRefresh={loadInvoices}
        />
      </div>
    );
  }

  // If showInvoiceForm is set, show full-page form view
  if (showInvoiceForm) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  setShowInvoiceForm(false);
                  setEditingInvoice(null);
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Kembali</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {editingInvoice ? 'Edit Invoice' : 'Buat Invoice Baru'}
                </h1>
                <p className="text-white/80 mt-1">
                  {editingInvoice ? 'Ubah detail invoice yang sudah ada' : 'Masukkan detail invoice baru'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="max-w-7xl mx-auto p-6">
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <InvoiceForm
                invoice={editingInvoice}
                onSave={handleInvoiceCreated}
                onCancel={() => {
                  setShowInvoiceForm(false);
                  setEditingInvoice(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with gradient background and professional styling */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                  <Receipt className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold leading-tight">Invoice Management</h1>
                  <p className="text-purple-100 text-xl mt-2 font-medium">
                    Kelola Proforma Invoice, Commercial Invoice, dan Payment Tracking dengan efisien
                  </p>
                </div>
              </div>
              
              {/* Enhanced Quick Stats in Header */}
              {/* Removed as per user request */}
            </div>
            
            {/* Enhanced Action Button */}
            <Button 
              className="bg-white text-purple-600 hover:bg-purple-50 shadow-2xl px-8 py-4 text-lg font-bold rounded-2xl border-2 border-white/20 transition-all duration-300 hover:scale-105"
              onClick={() => {
                console.log('➕ Create Invoice button clicked!');
                setEditingInvoice(null);
                setShowInvoiceForm(true);
              }}
            >
              <Plus className="w-6 h-6 mr-3" />
              Buat Invoice Baru
            </Button>
          </div>
        </div>



        {/* Stats Cards - Layout Responsif dengan Icon di Kiri */}
        <div className="grid grid-cols-12 gap-4">
          {/* Total Invoice - Card Pendek */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-2">
            <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group h-24">
              <CardContent className="p-4 h-full flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Invoice</p>
                  <span className="text-2xl font-bold text-blue-900">{stats.total}</span>
                  <p className="text-xs text-blue-600 font-medium">Semua Invoice</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue - Card Pendek */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-2">
            <Card className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 group h-24">
              <CardContent className="p-4 h-full flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Overdue</p>
                  <span className="text-2xl font-bold text-red-900">{stats.overdue}</span>
                  <p className="text-xs text-red-600 font-medium">Invoice Terlambat</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outstanding - Card Panjang untuk Nominal */}
          <div className="col-span-12 sm:col-span-12 lg:col-span-4">
            <Card className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 group h-24">
              <CardContent className="p-4 h-full flex items-center space-x-3">
                <div className="p-2 bg-orange-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Outstanding</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-orange-900 truncate">
                      {formatCurrency(stats.totalOutstanding, 'IDR').replace('IDR', 'Rp').replace(',00', '')}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">Belum Terbayar</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Paid - Card Panjang untuk Nominal */}
          <div className="col-span-12 sm:col-span-12 lg:col-span-4">
            <Card className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 group h-24">
              <CardContent className="p-4 h-full flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Paid</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-green-900 truncate">
                      {formatCurrency(stats.totalPaid, 'IDR').replace('IDR', 'Rp').replace(',00', '')}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 font-medium">Sudah Terbayar</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice Overdue Alert - Posisi di bawah stats cards sesuai gambar referensi */}
        {overdueInvoices.length > 0 && (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-lg">Invoice Overdue Alert</strong>
                      <p className="mt-1">Ada {overdueInvoices.length} invoice yang sudah jatuh tempo.</p>
                      <p className="text-sm text-red-700 mt-2">
                        Total nilai overdue: <span className="font-semibold">{formatCurrency(stats.totalOverdue, 'IDR')}</span>
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-100 ml-4"
                      onClick={() => {
                        const invoiceListElement = document.getElementById('invoice-list-section');
                        if (invoiceListElement) {
                          invoiceListElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Type</SelectItem>
                <SelectItem value="proforma">Proforma</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="creditnote">Credit Note</SelectItem>
                <SelectItem value="debitnote">Debit Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card id="invoice-list-section">
        <CardHeader>
          <CardTitle>Daftar Invoice</CardTitle>
          <CardDescription>
            Menampilkan {filteredInvoices.length} dari {invoices.length} total invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Tidak ada invoice yang sesuai dengan filter'
                : 'Belum ada invoice yang terdaftar'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('invoice_number')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Invoice</span>
                        {sortBy === 'invoice_number' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('customer_name')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Customer</span>
                        {sortBy === 'customer_name' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('invoice_date')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Tanggal</span>
                        {sortBy === 'invoice_date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('due_date')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Jatuh Tempo</span>
                        {sortBy === 'due_date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('total_amount')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Amount</span>
                        {sortBy === 'total_amount' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 select-none"
                      onClick={() => handleHeaderSort('status')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date);
                    const isOverdue = daysOverdue > 0 && invoice.payment_status !== 'Paid';
                    
                    return (
                      <tr key={invoice.id} className={`border-b hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="font-medium text-blue-600">{invoice.invoice_number}</div>
                              {getTypeBadge(invoice.invoice_type)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{invoice.customer_name}</div>
                          {invoice.lc_id && (
                            <div className="text-sm text-gray-500">Linked to LC</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{formatDate(invoice.invoice_date)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-medium ${
                            isOverdue ? 'text-red-600' : ''
                          }`}>
                            {formatDate(invoice.due_date)}
                          </div>
                          {isOverdue && (
                            <div className="text-sm text-red-600 font-medium">
                              {daysOverdue} hari terlambat
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(invoice.total_amount_idr, 'IDR')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {getStatusBadge(invoice.status, invoice.payment_status)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditInvoice(invoice)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadInvoicePDF(invoice)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="text-red-600 hover:bg-red-100 border-red-300 hover:border-red-400"
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
              Hapus Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus Invoice berikut?
            </p>
            {deletingInvoice && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="font-semibold text-gray-900">{deletingInvoice.invoice_number}</div>
                <div className="text-sm text-gray-500">{deletingInvoice.customer_name}</div>
                <div className="text-sm text-gray-500">
                  {deletingInvoice.currency} {deletingInvoice.total_amount?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Status: {deletingInvoice.status}</div>
              </div>
            )}
            <p className="text-red-600 text-sm mt-4 font-medium">
              ⚠️ Tindakan ini tidak dapat dibatalkan!
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={cancelDeleteInvoice}
              className="border-gray-300"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteInvoice}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
  );
};

export default InvoiceManagement;