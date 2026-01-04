import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText,
  CalendarDays,
  DollarSign,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  Edit,
  Download,
  Plus,
  CreditCard,
  Building2,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import { invoiceService, Invoice, InvoiceItem, InvoicePayment } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import PaymentForm from './PaymentForm';
import EditPaymentForm from './EditPaymentForm';

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ 
  invoice, 
  onClose, 
  onEdit, 
  onRefresh 
}) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditPaymentForm, setShowEditPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<InvoicePayment | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<InvoicePayment | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadInvoiceItems();
    loadInvoicePayments();
  }, [invoice.id]);

  const loadInvoiceItems = async () => {
    try {
      const data = await invoiceService.getInvoiceItems(invoice.id);
      setItems(data);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const loadInvoicePayments = async () => {
    try {
      const data = await invoiceService.getInvoicePayments(invoice.id);
      setPayments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading invoice payments:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'Paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    
    const statusConfig = {
      Draft: { color: 'bg-gray-100 text-gray-800' },
      Sent: { color: 'bg-blue-100 text-blue-800' },
      Partial: { color: 'bg-yellow-100 text-yellow-800' },
      Paid: { color: 'bg-green-100 text-green-800' },
      Overdue: { color: 'bg-red-100 text-red-800' },
      Cancelled: { color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft'];
    return <Badge className={config.color}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      Proforma: { color: 'bg-purple-100 text-purple-800' },
      Commercial: { color: 'bg-blue-100 text-blue-800' },
      'Credit Note': { color: 'bg-orange-100 text-orange-800' },
      'Debit Note': { color: 'bg-red-100 text-red-800' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['Proforma'];
    return <Badge variant="outline" className={config.color}>{type}</Badge>;
  };

  const getDaysOverdue = () => {
    if (!invoice.due_date || invoice.payment_status === 'Paid') return null;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount_idr, 0);
  };

  const getOutstandingAmount = () => {
    return invoice.total_amount_idr - getTotalPayments();
  };

  const getPaymentProgress = () => {
    const totalPaid = getTotalPayments();
    const totalAmount = invoice.total_amount_idr;
    return totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
  };

  const handlePaymentAdded = () => {
    setShowPaymentForm(false);
    loadInvoicePayments();
    onRefresh(); // Refresh parent component to update stats
  };

  const handleEditPayment = (payment: InvoicePayment) => {
    setEditingPayment(payment);
    setShowEditPaymentForm(true);
  };

  const handlePaymentUpdated = () => {
    setShowEditPaymentForm(false);
    setEditingPayment(null);
    loadInvoicePayments();
    onRefresh(); // Refresh parent component to update stats
  };

  const handleDeletePayment = (payment: InvoicePayment) => {
    setDeletingPayment(payment);
    setShowDeleteConfirmation(true);
  };

  const confirmDeletePayment = async () => {
    if (!deletingPayment) return;
    
    try {
      await invoiceService.deleteInvoicePayment(deletingPayment.id);
      setShowDeleteConfirmation(false);
      setDeletingPayment(null);
      loadInvoicePayments();
      onRefresh(); // Refresh parent component to update stats
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Terjadi kesalahan saat menghapus payment');
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Create a temporary div to render Invoice content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Generate items table HTML
      const itemsHTML = items.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📋 Invoice Items</h3>
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
      
      // Generate payments table HTML
      const paymentsHTML = payments.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">💳 Payment History</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Method</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Amount</th>
                <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Reference</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(payment.payment_date).toLocaleDateString('id-ID')}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${payment.payment_method}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${payment.amount_idr.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">${payment.reference_number || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';
      
      // Create Invoice content HTML
      const invoiceHTML = `
        <div style="max-width: 720px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1f2937; padding-bottom: 20px;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">${invoice.invoice_number}</h1>
            <p style="font-size: 16px; color: #6b7280; margin: 10px 0 0 0;">${invoice.invoice_type} Invoice</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📄 Invoice Information</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Number:</strong><br/><span style="color: #1f2937;">${invoice.invoice_number}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Type:</strong><br/><span style="color: #1f2937;">${invoice.invoice_type}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Status:</strong><br/><span style="color: #1f2937;">${invoice.status}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Payment Status:</strong><br/><span style="color: #1f2937;">${invoice.payment_status}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Exchange Rate:</strong><br/><span style="color: #1f2937;">1 ${invoice.currency} = ${(invoice.exchange_rate || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDR</span></div>
              </div>
            </div>
            
            <div>
              <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">👥 Customer Information</h3>
              <div style="space-y: 10px;">
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Customer Name:</strong><br/><span style="color: #1f2937;">${invoice.customer_name}</span></div>
                ${invoice.customer_address ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Address:</strong><br/><span style="color: #1f2937;">${invoice.customer_address.replace(/\n/g, '<br/>')}</span></div>` : ''}
                ${invoice.customer_email ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Email:</strong><br/><span style="color: #1f2937;">${invoice.customer_email}</span></div>` : ''}
                ${invoice.customer_phone ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Phone:</strong><br/><span style="color: #1f2937;">${invoice.customer_phone}</span></div>` : ''}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📅 Important Dates</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Invoice Date:</strong><br/><span style="color: #1f2937;">${new Date(invoice.invoice_date).toLocaleDateString('id-ID')}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Due Date:</strong><br/><span style="color: #1f2937;">${new Date(invoice.due_date).toLocaleDateString('id-ID')}</span></div>
              <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Payment Terms:</strong><br/><span style="color: #1f2937;">${invoice.payment_terms || '-'}</span></div>
            </div>
          </div>
          
          ${itemsHTML}
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">💰 Financial Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Subtotal:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${invoice.subtotal.toLocaleString('id-ID')} ${invoice.currency}</span></div>
                ${invoice.tax_amount && invoice.tax_amount > 0 ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Tax (${invoice.tax_rate}%):</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${invoice.tax_amount.toLocaleString('id-ID')} ${invoice.currency}</span></div>` : ''}
                ${invoice.discount_amount && invoice.discount_amount > 0 ? `<div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Discount:</strong><br/><span style="color: #dc2626; font-size: 18px; font-weight: bold;">-${invoice.discount_amount.toLocaleString('id-ID')} ${invoice.currency}</span></div>` : ''}
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Total (${invoice.currency}):</strong><br/><span style="color: #1f2937; font-size: 20px; font-weight: bold;">${invoice.total_amount.toLocaleString('id-ID')} ${invoice.currency}</span></div>
              </div>
              <div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Exchange Rate:</strong><br/><span style="color: #1f2937; font-size: 18px; font-weight: bold;">${invoice.exchange_rate.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Total in IDR:</strong><br/><span style="color: #1f2937; font-size: 20px; font-weight: bold;">${invoice.total_amount_idr.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Total Paid:</strong><br/><span style="color: #16a34a; font-size: 18px; font-weight: bold;">${getTotalPayments().toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Outstanding:</strong><br/><span style="color: #dc2626; font-size: 18px; font-weight: bold;">${getOutstandingAmount().toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span></div>
              </div>
            </div>
          </div>
          
          ${paymentsHTML}
          
          ${invoice.notes || invoice.internal_notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📝 Notes</h3>
            ${invoice.notes ? `<div style="margin-bottom: 15px;"><strong style="color: #4b5563;">Customer Notes:</strong><br/><div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;"><p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${invoice.notes}</p></div></div>` : ''}
            ${invoice.internal_notes ? `<div style="margin-bottom: 15px;"><strong style="color: #4b5563;">Internal Notes:</strong><br/><div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;"><p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${invoice.internal_notes}</p></div></div>` : ''}
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
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const daysOverdue = getDaysOverdue();
  const paymentProgress = getPaymentProgress();
  const outstandingAmount = getOutstandingAmount();

  return (
    <div className="space-y-6 p-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h2>
            {getStatusBadge(invoice.status, invoice.payment_status)}
            {getTypeBadge(invoice.invoice_type)}
          </div>
          <p className="text-gray-600">
            Dibuat: {formatDate(invoice.created_at)} | 
            Diperbarui: {formatDate(invoice.updated_at)}
          </p>
        </div>
        
        {/* Action Buttons in Header */}
        <div className="flex space-x-2">
          <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 disabled:bg-red-400 disabled:border-red-400"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
          <Button onClick={onClose} className="bg-black hover:bg-gray-800 text-white border-black hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2 text-white" />
            <span className="text-white">Kembali</span>
          </Button>
        </div>
      </div>

      {/* Overdue Warning */}
      {daysOverdue && daysOverdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Invoice Overdue</h4>
              <p className="text-red-700">
                Invoice ini sudah terlambat {daysOverdue} hari dari tanggal jatuh tempo.
                Outstanding amount: {formatCurrency(outstandingAmount, 'IDR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-lg font-bold">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(invoice.total_amount_idr, 'IDR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-lg font-bold">
                  {formatCurrency(getTotalPayments(), 'IDR')}
                </p>
                <p className="text-sm text-gray-500">{paymentProgress}% paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-lg font-bold">
                  {formatCurrency(outstandingAmount, 'IDR')}
                </p>
                <p className="text-sm text-gray-500">Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-lg font-bold">
                  {formatDate(invoice.due_date)}
                </p>
                {daysOverdue ? (
                  <p className="text-sm text-red-600 font-medium">
                    {daysOverdue} days overdue
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">On time</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Original Tabbed Layout */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Informasi Umum</TabsTrigger>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="details">Detail Finansial</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoice Information */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Informasi Dasar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nomor Invoice</Label>
                    <p className="font-medium">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label>Jenis Invoice</Label>
                    <p className="font-medium">{invoice.invoice_type}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(invoice.status, invoice.payment_status)}</div>
                  </div>
                  <div>
                    <Label>Kurs Pertukaran</Label>
                    <p className="font-medium">
                      1 {invoice.currency} = {invoice.exchange_rate?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDR
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Informasi Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nama Customer</Label>
                    <p className="font-medium">{invoice.customer_name}</p>
                  </div>
                  {invoice.customer_address && (
                    <div>
                      <Label>Alamat</Label>
                      <p className="font-medium whitespace-pre-wrap">{invoice.customer_address}</p>
                    </div>
                  )}
                  {invoice.customer_email && (
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium">{invoice.customer_email}</p>
                    </div>
                  )}
                  {invoice.customer_phone && (
                    <div>
                      <Label>Telepon</Label>
                      <p className="font-medium">{invoice.customer_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dates */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Tanggal Penting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Tanggal Invoice</Label>
                    <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div>
                    <Label>Tanggal Jatuh Tempo</Label>
                    <p className={`font-medium ${
                      daysOverdue !== null && daysOverdue > 0 ? 'text-red-600' : ''
                    }`}>
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <p className="font-medium">{invoice.payment_terms || '-'}</p>
                  </div>
                  {invoice.lc_id && (
                    <div>
                      <Label>Linked LC</Label>
                      <p className="font-medium text-blue-600">Connected to LC</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(invoice.notes || invoice.internal_notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.notes && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Notes untuk Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </CardContent>
                  </Card>
                )}
                
                {invoice.internal_notes && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Internal Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{invoice.internal_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-6">
            {/* Additional Financial Details */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Detail Finansial Lengkap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Subtotal</Label>
                    <p className="text-xl font-bold">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </p>
                  </div>
                  {invoice.tax_amount && invoice.tax_amount > 0 && (
                    <div>
                      <Label>Pajak ({invoice.tax_rate}%)</Label>
                      <p className="text-xl font-bold">
                        {formatCurrency(invoice.tax_amount, invoice.currency)}
                      </p>
                    </div>
                  )}
                  {invoice.discount_amount && invoice.discount_amount > 0 && (
                    <div>
                      <Label>Diskon</Label>
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(invoice.discount_amount, invoice.currency)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>Total ({invoice.currency})</Label>
                    <p className="text-xl font-bold">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Kurs Pertukaran</Label>
                    <p className="font-medium">
                      1 {invoice.currency} = {invoice.exchange_rate.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDR
                    </p>
                  </div>
                  <div className="text-right">
                    <Label>Total dalam IDR</Label>
                    <p className="text-2xl font-bold">
                      {formatCurrency(invoice.total_amount_idr, 'IDR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Progress */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Payment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Payment Progress</span>
                    <span>{paymentProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        paymentProgress === 100 
                          ? 'bg-green-600' 
                          : paymentProgress >= 50 
                          ? 'bg-blue-600' 
                          : 'bg-orange-600'
                      }`}
                      style={{ width: `${paymentProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Paid: {formatCurrency(getTotalPayments(), 'IDR')}</span>
                    <span>Outstanding: {formatCurrency(outstandingAmount, 'IDR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(invoice.notes || invoice.internal_notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.notes && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Notes untuk Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </CardContent>
                  </Card>
                )}
                
                {invoice.internal_notes && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Internal Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{invoice.internal_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="items">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Items ({items.length})
              </CardTitle>
              <CardDescription>
                Daftar item dalam invoice ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada item dalam invoice ini
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Deskripsi</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Qty</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Unit Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Total Harga</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Amount (IDR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{item.line_number}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.hs_code && (
                                <p className="text-sm text-gray-500">HS: {item.hs_code}</p>
                              )}
                              {(item.weight || item.dimension) && (
                                <p className="text-sm text-gray-500">
                                  {item.weight && `${item.weight}kg`}
                                  {item.weight && item.dimension && ' • '}
                                  {item.dimension}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {item.quantity} {item.unit_of_measure}
                          </td>
                          <td className="py-3 px-4">
                            {formatCurrency(item.unit_price, item.currency)}
                          </td>
                          <td className="py-3 px-4 font-medium bg-white border border-blue-200">
                            {formatCurrency(item.quantity * item.unit_price, item.currency)}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(item.amount, item.currency)}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(item.amount_idr, 'IDR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-white">
                        <td colSpan={5} className="py-3 px-4 font-bold text-right">Total:</td>
                        <td className="py-3 px-4 font-bold">
                          {formatCurrency(invoice.subtotal, invoice.currency)}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {formatCurrency(items.reduce((sum, item) => sum + item.amount_idr, 0), 'IDR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment History ({payments.length})
                  </CardTitle>
                  <CardDescription>
                    Daftar pembayaran untuk invoice ini
                  </CardDescription>
                </div>
                {invoice.payment_status !== 'Paid' && outstandingAmount > 0 && (
                  <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white">
                      <DialogHeader>
                        <DialogTitle>Add Payment</DialogTitle>
                      </DialogHeader>
                      <PaymentForm
                        invoice={invoice}
                        onSave={handlePaymentAdded}
                        onCancel={() => setShowPaymentForm(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada payment untuk invoice ini
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{payment.payment_method}</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {formatDate(payment.payment_date)}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold mt-2">
                            {formatCurrency(payment.amount_idr, 'IDR')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(payment.amount, payment.currency)} @ {payment.exchange_rate}
                          </p>
                          {payment.reference_number && (
                            <p className="text-sm text-gray-600 mt-1">
                              Ref: {payment.reference_number}
                            </p>
                          )}
                          {payment.bank_account && (
                            <p className="text-sm text-gray-600">
                              Bank: {payment.bank_account}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="text-right text-sm text-gray-500 mr-2">
                            <p>Recorded: {formatDate(payment.created_at)}</p>
                            {payment.received_by && (
                              <p>By: {payment.received_by}</p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPayment(payment)}
                              className="h-8 w-8 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              title="Edit Payment"
                            >
                              <Pencil className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePayment(payment)}
                              className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                              title="Delete Payment"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      
      {/* Edit Payment Dialog with Robust Event Handling */}
      <Dialog 
        open={showEditPaymentForm} 
        onOpenChange={(open) => {
          // Only allow closing when explicitly requested
          if (!open) {
            setShowEditPaymentForm(false);
            setEditingPayment(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <EditPaymentForm
              payment={editingPayment}
              invoice={invoice}
              onSave={handlePaymentUpdated}
              onCancel={() => {
                setShowEditPaymentForm(false);
                setEditingPayment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Delete Payment</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>
            {deletingPayment && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="font-semibold text-lg">
                  {formatCurrency(deletingPayment.amount_idr, 'IDR')}
                </p>
                <p className="text-sm text-gray-600">
                  {deletingPayment.payment_method} - {formatDate(deletingPayment.payment_date)}
                </p>
                {deletingPayment.reference_number && (
                  <p className="text-sm text-gray-600">
                    Ref: {deletingPayment.reference_number}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeletePayment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for labels
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-gray-600">{children}</label>
);

export default InvoiceDetail;