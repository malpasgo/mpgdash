import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { lcService, LCDocument } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface LCDocumentsProps {
  lcId: string;
  documents: LCDocument[];
  onDocumentsChange: () => void;
}

const LCDocuments: React.FC<LCDocumentsProps> = ({ lcId, documents, onDocumentsChange }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    document_type: '',
    document_name: '',
    document_url: '',
    is_required: true
  });
  const [editingDocument, setEditingDocument] = useState<LCDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<LCDocument | null>(null);

  const documentTypes = [
    'Bill of Lading',
    'Commercial Invoice',
    'Packing List',
    'Certificate of Origin',
    'Insurance Policy',
    'Inspection Certificate',
    'Weight Certificate',
    'Phytosanitary Certificate',
    'Health Certificate',
    'Export License',
    'Import License',
    'Other'
  ];

  const handleAddDocument = async () => {
    if (!newDocument.document_type || !newDocument.document_name) {
      alert('Harap lengkapi semua field yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      await lcService.createLCDocument({
        lc_id: lcId,
        document_type: newDocument.document_type,
        document_name: newDocument.document_name,
        document_url: newDocument.document_url || undefined,
        is_required: newDocument.is_required,
        is_submitted: false
      });
      
      setNewDocument({ document_type: '', document_name: '', document_url: '', is_required: true });
      setShowAddDialog(false);
      onDocumentsChange();
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Terjadi kesalahan saat menambah dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocument = async () => {
    if (!editingDocument || !editingDocument.document_type || !editingDocument.document_name) {
      alert('Harap lengkapi semua field yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      await lcService.updateLCDocument(editingDocument.id, {
        document_type: editingDocument.document_type,
        document_name: editingDocument.document_name,
        document_url: editingDocument.document_url || undefined,
        is_required: editingDocument.is_required
      });
      
      setEditingDocument(null);
      setShowEditDialog(false);
      onDocumentsChange();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Terjadi kesalahan saat mengubah dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return;

    setLoading(true);
    try {
      await lcService.deleteLCDocument(deletingDocument.id);
      setDeletingDocument(null);
      setShowDeleteConfirm(false);
      onDocumentsChange();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Terjadi kesalahan saat menghapus dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubmitted = async (docId: string, isSubmitted: boolean) => {
    setLoading(true);
    try {
      await lcService.updateLCDocumentStatus(docId, isSubmitted);
      onDocumentsChange();
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Terjadi kesalahan saat memperbarui status dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc: LCDocument) => {
    if (doc.document_url && doc.document_url.trim()) {
      window.open(doc.document_url, '_blank');
    } else {
      alert('URL dokumen tidak tersedia');
    }
  };

  const getDocumentStatusBadge = (doc: LCDocument) => {
    if (doc.is_submitted) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Diserahkan
        </Badge>
      );
    } else if (doc.is_required) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Belum Diserahkan
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Opsional
        </Badge>
      );
    }
  };

  const submittedCount = documents.filter(doc => doc.is_submitted).length;
  const requiredCount = documents.filter(doc => doc.is_required).length;
  const notSubmittedCount = Math.max(0, requiredCount - submittedCount); // Ensure it's never negative
  const completionRate = requiredCount > 0 ? Math.round((submittedCount / requiredCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dokumen LC</h3>
          <p className="text-gray-600">
            {submittedCount} dari {requiredCount} dokumen wajib telah diserahkan ({completionRate}%)
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Dokumen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Dokumen Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document_type">Jenis Dokumen *</Label>
                <Select
                  value={newDocument.document_type}
                  onValueChange={(value) => setNewDocument(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis dokumen" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="document_name">Nama Dokumen *</Label>
                <Input
                  id="document_name"
                  value={newDocument.document_name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="Masukkan nama dokumen"
                />
              </div>

              <div>
                <Label htmlFor="document_url">URL Dokumen</Label>
                <Input
                  id="document_url"
                  type="url"
                  value={newDocument.document_url}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, document_url: e.target.value }))}
                  placeholder="https://example.com/document.pdf"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_required"
                  checked={newDocument.is_required}
                  onCheckedChange={(checked) => 
                    setNewDocument(prev => ({ ...prev, is_required: !!checked }))
                  }
                />
                <Label htmlFor="is_required">Dokumen wajib</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddDocument} disabled={loading}>
                  {loading ? 'Menambah...' : 'Tambah Dokumen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada dokumen yang terdaftar</p>
            <p className="text-sm text-gray-400 mt-1">
              Klik tombol "Tambah Dokumen" untuk memulai
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="bg-white hover:shadow-md transition-shadow border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.document_name}</h4>
                        <p className="text-sm text-gray-600">{doc.document_type}</p>
                        {doc.submission_date && (
                          <p className="text-sm text-green-600">
                            Diserahkan: {formatDate(doc.submission_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {getDocumentStatusBadge(doc)}
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={doc.is_submitted ? "outline" : "default"}
                        onClick={() => handleToggleSubmitted(doc.id, !doc.is_submitted)}
                        disabled={loading}
                      >
                        {doc.is_submitted ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Batalkan
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Tandai Diserahkan
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                        onClick={() => {
                          setEditingDocument(doc);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => {
                          setDeletingDocument(doc);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDocument(doc)}
                        disabled={!doc.document_url || !doc.document_url.trim()}
                        title={doc.document_url ? "Buka dokumen" : "URL dokumen tidak tersedia"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Summary */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
              <p className="text-sm text-gray-600">Total Dokumen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
              <p className="text-sm text-gray-600">Diserahkan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{notSubmittedCount}</p>
              <p className="text-sm text-gray-600">Belum Diserahkan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dokumen</DialogTitle>
          </DialogHeader>
          {editingDocument && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_document_type">Jenis Dokumen *</Label>
                <Select
                  value={editingDocument.document_type}
                  onValueChange={(value) => setEditingDocument(prev => 
                    prev ? { ...prev, document_type: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis dokumen" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_document_name">Nama Dokumen *</Label>
                <Input
                  id="edit_document_name"
                  value={editingDocument.document_name}
                  onChange={(e) => setEditingDocument(prev => 
                    prev ? { ...prev, document_name: e.target.value } : null
                  )}
                  placeholder="Masukkan nama dokumen"
                />
              </div>

              <div>
                <Label htmlFor="edit_document_url">URL Dokumen</Label>
                <Input
                  id="edit_document_url"
                  type="url"
                  value={editingDocument.document_url || ''}
                  onChange={(e) => setEditingDocument(prev => 
                    prev ? { ...prev, document_url: e.target.value } : null
                  )}
                  placeholder="https://example.com/document.pdf"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_required"
                  checked={editingDocument.is_required}
                  onCheckedChange={(checked) => 
                    setEditingDocument(prev => 
                      prev ? { ...prev, is_required: !!checked } : null
                    )
                  }
                />
                <Label htmlFor="edit_is_required">Dokumen wajib</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleEditDocument} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Hapus Dokumen
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {deletingDocument && (
              <>
                <p className="text-gray-700 mb-4">
                  Apakah Anda yakin ingin menghapus dokumen "{deletingDocument.document_name}"?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border mb-4">
                  <p className="font-medium">Jenis: {deletingDocument.document_type}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {deletingDocument.is_submitted ? "Sudah diserahkan" : "Belum diserahkan"}
                  </p>
                </div>
                <p className="text-red-600 text-sm font-medium">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteDocument}
              disabled={loading}
            >
              {loading ? 'Menghapus...' : 'Hapus Dokumen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LCDocuments;