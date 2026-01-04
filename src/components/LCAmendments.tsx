import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  Plus,
  Calendar as CalendarIcon,
  History,
  AlertCircle,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { lcService, LCAmendment } from '@/lib/supabase';
import { formatDate, cn } from '@/lib/utils';

interface LCAmendmentsProps {
  lcId: string;
  amendments: LCAmendment[];
  onAmendmentsChange: () => void;
}

const LCAmendments: React.FC<LCAmendmentsProps> = ({ lcId, amendments, onAmendmentsChange }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAmendment, setNewAmendment] = useState({
    amendment_number: '',
    amendment_date: null as Date | null,
    changes: ''
  });
  const [editingAmendment, setEditingAmendment] = useState<LCAmendment | null>(null);
  const [deletingAmendment, setDeletingAmendment] = useState<LCAmendment | null>(null);

  const handleAddAmendment = async () => {
    if (!newAmendment.amendment_number || !newAmendment.amendment_date || !newAmendment.changes) {
      alert('Harap lengkapi semua field yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      await lcService.createLCAmendment({
        lc_id: lcId,
        amendment_number: parseInt(newAmendment.amendment_number),
        amendment_date: format(newAmendment.amendment_date, 'yyyy-MM-dd'),
        changes: newAmendment.changes
      });
      
      setNewAmendment({ amendment_number: '', amendment_date: null, changes: '' });
      setShowAddDialog(false);
      onAmendmentsChange();
    } catch (error) {
      console.error('Error adding amendment:', error);
      alert('Terjadi kesalahan saat menambah amendment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAmendment = async () => {
    if (!editingAmendment || !editingAmendment.amendment_date || !editingAmendment.changes) {
      alert('Harap lengkapi semua field yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      const amendmentDate = typeof editingAmendment.amendment_date === 'string' 
        ? editingAmendment.amendment_date 
        : format(editingAmendment.amendment_date, 'yyyy-MM-dd');

      await lcService.updateLCAmendment(editingAmendment.id, {
        amendment_number: editingAmendment.amendment_number,
        amendment_date: amendmentDate,
        changes: editingAmendment.changes
      });
      
      setEditingAmendment(null);
      setShowEditDialog(false);
      onAmendmentsChange();
    } catch (error) {
      console.error('Error updating amendment:', error);
      alert('Terjadi kesalahan saat mengubah amendment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAmendment = async () => {
    if (!deletingAmendment) return;

    setLoading(true);
    try {
      await lcService.deleteLCAmendment(deletingAmendment.id);
      setDeletingAmendment(null);
      setShowDeleteConfirm(false);
      onAmendmentsChange();
    } catch (error) {
      console.error('Error deleting amendment:', error);
      alert('Terjadi kesalahan saat menghapus amendment');
    } finally {
      setLoading(false);
    }
  };

  const getNextAmendmentNumber = () => {
    if (amendments.length === 0) return 1;
    const maxNumber = Math.max(...amendments.map(a => a.amendment_number));
    return maxNumber + 1;
  };

  const formatDateForDisplay = (date: Date | null) => {
    return date ? format(date, 'dd/MM/yyyy', { locale: id }) : 'Pilih tanggal';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Amendment LC</h3>
          <p className="text-gray-600">
            {amendments.length} amendment telah dibuat untuk LC ini
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Amendment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Amendment Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amendment_number">Nomor Amendment *</Label>
                <Input
                  id="amendment_number"
                  type="number"
                  value={newAmendment.amendment_number}
                  onChange={(e) => setNewAmendment(prev => ({ ...prev, amendment_number: e.target.value }))}
                  placeholder={`Nomor berikutnya: ${getNextAmendmentNumber()}`}
                />
              </div>
              
              <div>
                <Label>Tanggal Amendment *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newAmendment.amendment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateForDisplay(newAmendment.amendment_date)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newAmendment.amendment_date || undefined}
                      onSelect={(date) => setNewAmendment(prev => ({ ...prev, amendment_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="changes">Perubahan yang Dilakukan *</Label>
                <Textarea
                  id="changes"
                  value={newAmendment.changes}
                  onChange={(e) => setNewAmendment(prev => ({ ...prev, changes: e.target.value }))}
                  placeholder="Jelaskan secara detail perubahan yang dilakukan pada LC ini..."
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Jelaskan perubahan seperti nilai LC, tanggal expiry, syarat pembayaran, dll.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddAmendment} disabled={loading}>
                  {loading ? 'Menambah...' : 'Tambah Amendment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Amendments List */}
      {amendments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileEdit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada amendment untuk LC ini</p>
            <p className="text-sm text-gray-400 mt-1">
              Amendment diperlukan jika ada perubahan pada syarat-syarat LC
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {amendments.map((amendment, index) => (
            <Card key={amendment.id} className="bg-white hover:shadow-md transition-shadow border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileEdit className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        Amendment #{amendment.amendment_number}
                      </CardTitle>
                      <CardDescription>
                        Tanggal: {formatDate(amendment.amendment_date)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <History className="w-3 h-3 mr-1" />
                      Dibuat: {formatDate(amendment.created_at)}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                        onClick={() => {
                          setEditingAmendment({
                            ...amendment,
                            amendment_date: amendment.amendment_date
                          });
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => {
                          setDeletingAmendment(amendment);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Perubahan yang Dilakukan:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{amendment.changes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Amendment Guidelines */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            Panduan Amendment
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700">
          <ul className="space-y-2 text-sm">
            <li>• Amendment diperlukan untuk setiap perubahan pada syarat-syarat LC</li>
            <li>• Nomor amendment harus berurutan (1, 2, 3, dst.)</li>
            <li>• Dokumentasikan secara detail semua perubahan yang dilakukan</li>
            <li>• Amendment harus mendapat persetujuan dari semua pihak terkait</li>
            <li>• Simpan salinan amendment untuk audit dan compliance</li>
          </ul>
        </CardContent>
      </Card>

      {/* Amendment Summary */}
      {amendments.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Amendment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{amendments.length}</p>
                <p className="text-sm text-gray-600">Total Amendment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {amendments[0]?.amendment_number || '-'}
                </p>
                <p className="text-sm text-gray-600">Amendment Terbaru</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {amendments[0] ? formatDate(amendments[0].amendment_date) : '-'}
                </p>
                <p className="text-sm text-gray-600">Tanggal Terakhir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Amendment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Amendment</DialogTitle>
          </DialogHeader>
          {editingAmendment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_amendment_number">Nomor Amendment *</Label>
                <Input
                  id="edit_amendment_number"
                  type="number"
                  value={editingAmendment.amendment_number}
                  onChange={(e) => setEditingAmendment(prev => 
                    prev ? { ...prev, amendment_number: parseInt(e.target.value) } : null
                  )}
                />
              </div>
              
              <div>
                <Label>Tanggal Amendment *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingAmendment.amendment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateForDisplay(typeof editingAmendment.amendment_date === 'string' 
                        ? new Date(editingAmendment.amendment_date) 
                        : editingAmendment.amendment_date)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={typeof editingAmendment.amendment_date === 'string'
                        ? new Date(editingAmendment.amendment_date)
                        : editingAmendment.amendment_date}
                      onSelect={(date) => setEditingAmendment(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          amendment_date: date ? format(date, 'yyyy-MM-dd') : null
                        };
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="edit_changes">Perubahan yang Dilakukan *</Label>
                <Textarea
                  id="edit_changes"
                  value={editingAmendment.changes}
                  onChange={(e) => setEditingAmendment(prev => 
                    prev ? { ...prev, changes: e.target.value } : null
                  )}
                  placeholder="Jelaskan secara detail perubahan yang dilakukan pada LC ini..."
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Jelaskan perubahan seperti nilai LC, tanggal expiry, syarat pembayaran, dll.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleEditAmendment} disabled={loading}>
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
              Hapus Amendment
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {deletingAmendment && (
              <>
                <p className="text-gray-700 mb-4">
                  Apakah Anda yakin ingin menghapus Amendment #{deletingAmendment.amendment_number}?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border mb-4">
                  <p className="font-medium">Tanggal: {formatDate(deletingAmendment.amendment_date)}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{deletingAmendment.changes}</p>
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
              onClick={handleDeleteAmendment}
              disabled={loading}
            >
              {loading ? 'Menghapus...' : 'Hapus Amendment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LCAmendments;