import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  CalendarDays,
  DollarSign,
  FileText,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  Edit,
  Download,
  Plus,
  X,
  ArrowLeft
} from 'lucide-react';
import { lcService, LetterOfCredit, LCAmendment, LCDocument } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import LCDocuments from './LCDocuments';
import LCAmendments from './LCAmendments';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LCDetailProps {
  lc: LetterOfCredit;
  onClose: () => void;
  onEdit: () => void;
}

const LCDetail: React.FC<LCDetailProps> = ({ lc, onClose, onEdit }) => {
  const [amendments, setAmendments] = useState<LCAmendment[]>([]);
  const [documents, setDocuments] = useState<LCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadAmendments();
    loadDocuments();
  }, [lc.id]);

  const loadAmendments = async () => {
    try {
      const data = await lcService.getLCAmendments(lc.id);
      setAmendments(data);
    } catch (error) {
      console.error('Error loading amendments:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await lcService.getLCDocuments(lc.id);
      setDocuments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { color: 'bg-gray-100 text-gray-800' },
      'Issued': { color: 'bg-blue-100 text-blue-800' },
      'Confirmed': { color: 'bg-green-100 text-green-800' },
      'Amended': { color: 'bg-yellow-100 text-yellow-800' },
      'Utilized': { color: 'bg-purple-100 text-purple-800' },
      'Expired': { color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft'];
    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    );
  };

  const getDaysToExpiry = () => {
    if (!lc.expiry_date) return null;
    const today = new Date();
    const expiry = new Date(lc.expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysToExpiry = getDaysToExpiry();
  const submittedDocs = documents.filter(doc => doc.is_submitted).length;
  const totalDocs = documents.length;
  const docCompletionRate = totalDocs > 0 ? Math.round((submittedDocs / totalDocs) * 100) : 0;

  const exportToPDF = async () => {
    setIsExporting(true);
    
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
                <div style="margin-bottom: 12px;"><strong style="color: #4b5563;">Kurs Pertukaran:</strong><br/><span style="color: #1f2937;">1 ${lc.lc_currency || 'USD'} = ${(lc.exchange_rate || 0).toLocaleString('id-ID')} IDR</span></div>
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
      console.error('Error exporting PDF:', error);
      alert('Gagal mengekspor PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* PDF Content Area - This content structure is now handled programmatically */}
      <div className="space-y-6">
        {/* Header with Action Buttons */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{lc.lc_number}</h2>
              {getStatusBadge(lc.status)}
              <Badge variant="outline" className="border-gray-300 text-gray-700">{lc.lc_type}</Badge>
            </div>
            <p className="text-gray-600">
              Dibuat: {formatDate(lc.created_at)} | 
              Diperbarui: {formatDate(lc.updated_at)}
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
              {isExporting ? 'Mengekspor...' : 'Export PDF'}
            </Button>
            <Button onClick={onClose} className="bg-black hover:bg-gray-800 text-white border-black hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2 text-white" />
              <span className="text-white">Kembali</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Nilai LC</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(lc.lc_amount || 0, lc.lc_currency || 'USD')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(lc.amount_idr || 0, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Waktu Expiry</p>
                  <p className="text-lg font-bold">
                    {daysToExpiry !== null ? (
                      daysToExpiry > 0 ? `${daysToExpiry} hari` : 'Expired'
                    ) : '-'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {lc.expiry_date ? formatDate(lc.expiry_date) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Dokumen</p>
                  <p className="text-lg font-bold">{submittedDocs}/{totalDocs}</p>
                  <p className="text-sm text-gray-500">{docCompletionRate}% lengkap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Amendment</p>
                  <p className="text-lg font-bold">{amendments.length}</p>
                  <p className="text-sm text-gray-500">Total perubahan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Warning */}
        {daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <h4 className="font-medium text-orange-800">Peringatan Expiry</h4>
                <p className="text-orange-700">
                  LC ini akan expired dalam {daysToExpiry} hari. Pastikan semua dokumen telah diserahkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detail Information - Direct content for PDF */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nomor LC</Label>
                  <p className="font-medium">{lc.lc_number}</p>
                </div>
                <div>
                  <Label>Jenis LC</Label>
                  <p className="font-medium">{lc.lc_type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(lc.status)}</div>
                </div>
                <div>
                  <Label>Kurs Pertukaran</Label>
                  <p className="font-medium">
                    1 {lc.lc_currency} = {lc.exchange_rate?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} IDR
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Parties */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Pihak Terlibat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Applicant</Label>
                  <p className="font-medium">{lc.applicant || '-'}</p>
                </div>
                <div>
                  <Label>Beneficiary</Label>
                  <p className="font-medium">{lc.beneficiary || '-'}</p>
                </div>
                <div>
                  <Label>Issuing Bank</Label>
                  <p className="font-medium">{lc.issuing_bank || '-'}</p>
                </div>
                <div>
                  <Label>Advising Bank</Label>
                  <p className="font-medium">{lc.advising_bank || '-'}</p>
                </div>
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
                  <Label>Tanggal Penerbitan</Label>
                  <p className="font-medium">{lc.issue_date ? formatDate(lc.issue_date) : '-'}</p>
                </div>
                <div>
                  <Label>Tanggal Expiry</Label>
                  <p className={`font-medium ${
                    daysToExpiry !== null && daysToExpiry <= 7 ? 'text-red-600' :
                    daysToExpiry !== null && daysToExpiry <= 30 ? 'text-orange-600' : ''
                  }`}>
                    {lc.expiry_date ? formatDate(lc.expiry_date) : '-'}
                  </p>
                </div>
                <div>
                  <Label>Batas Pengiriman</Label>
                  <p className="font-medium">{lc.shipment_deadline ? formatDate(lc.shipment_deadline) : '-'}</p>
                </div>
                <div>
                  <Label>Batas Negosiasi</Label>
                  <p className="font-medium">{lc.negotiation_deadline ? formatDate(lc.negotiation_deadline) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Detail Finansial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nilai LC</Label>
                  <p className="text-xl font-bold">
                    {formatCurrency(lc.lc_amount || 0, lc.lc_currency || 'USD')}
                  </p>
                </div>
                <div>
                  <Label>Kurs</Label>
                  <p className="text-xl font-bold">
                    {lc.exchange_rate?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label>Nilai dalam IDR</Label>
                  <p className="text-xl font-bold">
                    {formatCurrency(lc.amount_idr || 0, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          {lc.payment_terms && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Syarat Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{lc.payment_terms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>



      {/* Interactive Tabs - Below action buttons */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Dokumen ({totalDocs})</TabsTrigger>
          <TabsTrigger value="amendments">Amendment ({amendments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <LCDocuments
            lcId={lc.id}
            documents={documents}
            onDocumentsChange={loadDocuments}
          />
        </TabsContent>

        <TabsContent value="amendments">
          <LCAmendments
            lcId={lc.id}
            amendments={amendments}
            onAmendmentsChange={loadAmendments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for labels
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-sm font-medium text-gray-600">{children}</label>
);

export default LCDetail;