import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, Edit2, Trash2, Save, X, Clock, ChevronDown, Filter } from 'lucide-react';
import { FormModal } from './FormModal';
import { catatanPentingService, CatatanPentingItem } from '../lib/supabase';

// Using CatatanPentingItem from supabase.ts instead of local interface

interface CatatanPentingProps {}

export const CatatanPenting: React.FC<CatatanPentingProps> = () => {
  const [catatan, setCatatan] = useState<CatatanPentingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCatatan, setEditingCatatan] = useState<CatatanPentingItem | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'insight' as CatatanPentingItem['category'],
    priority: 'medium' as CatatanPentingItem['priority']
  });

  // Priority configurations
  const priorityConfig = {
    critical: { label: 'Critical', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
    high: { label: 'High', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
    medium: { label: 'Medium', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
    low: { label: 'Low', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' }
  };

  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

  // Load data from database
  useEffect(() => {
    loadCatatanPenting();
  }, []);

  const loadCatatanPenting = async () => {
    try {
      setLoading(true);
      const data = await catatanPentingService.getAllCatatanPenting();
      setCatatan(data);
    } catch (error) {
      console.error('Error loading catatan penting:', error);
    } finally {
      setLoading(false);
    }
  };

  // This function is no longer needed as we save directly to database

  // Filter and sort catatan
  const filteredAndSortedCatatan = catatan
    .filter(item => filterPriority === 'all' || item.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Get statistics
  const getStats = () => {
    const total = catatan.length;
    const critical = catatan.filter(item => item.priority === 'critical').length;
    const high = catatan.filter(item => item.priority === 'high').length;
    const topItems = catatan
      .filter(item => ['critical', 'high'].includes(item.priority))
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 3);
    
    return { total, critical, high, topItems };
  };

  // Handle add
  const handleAdd = () => {
    setEditingCatatan(null);
    setFormData({ title: '', description: '', category: 'insight', priority: 'medium' });
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (item: CatatanPentingItem) => {
    setEditingCatatan(item);
    setFormData({ 
      title: item.title, 
      description: item.description || '', 
      category: item.category,
      priority: item.priority 
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      try {
        const success = await catatanPentingService.deleteCatatanPenting(id);
        if (success) {
          await loadCatatanPenting(); // Reload data
        } else {
          alert('Gagal menghapus catatan. Silakan coba lagi.');
        }
      } catch (error) {
        console.error('Error deleting catatan:', error);
        alert('Gagal menghapus catatan. Silakan coba lagi.');
      }
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Judul catatan harus diisi!');
      return;
    }

    if (!formData.description.trim()) {
      alert('Deskripsi catatan harus diisi!');
      return;
    }

    try {
      if (editingCatatan) {
        // Update existing
        const updated = await catatanPentingService.updateCatatanPenting(
          editingCatatan.id, 
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority
          }
        );
        
        if (!updated) {
          alert('Gagal mengupdate catatan. Silakan coba lagi.');
          return;
        }
      } else {
        // Add new
        const newItem = await catatanPentingService.createCatatanPenting({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: 'open'
        });
        
        if (!newItem) {
          alert('Gagal menambahkan catatan. Silakan coba lagi.');
          return;
        }
      }
      
      await loadCatatanPenting(); // Reload data
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving catatan:', error);
      alert('Gagal menyimpan catatan. Silakan coba lagi.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Catatan Penting</h1>
            <p className="text-gray-600">Kelola kendala dan hal-hal penting yang perlu segera ditangani dalam roadmap ekspor</p>
          </div>
          <motion.button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Catatan</span>
          </motion.button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Catatan</p>
                <p className="text-2xl font-bold text-gray-900">{getStats().total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">{getStats().critical}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{getStats().high}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="priority">Urutkan: Prioritas</option>
              <option value="date">Urutkan: Tanggal</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="all">Semua Prioritas</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catatan List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedCatatan.map((item) => {
            const config = priorityConfig[item.priority];
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white rounded-xl shadow-sm border-2 ${config.borderColor} p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} text-white`}>
                        {config.label}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Ditambahkan {formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    {item.updated_at !== item.created_at && (
                      <p className="text-sm text-gray-500">Diupdate {formatDate(item.updated_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAndSortedCatatan.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {catatan.length === 0 ? 'Belum ada catatan penting' : 'Tidak ada catatan yang sesuai filter'}
          </h3>
          <p className="text-gray-500 mb-4">
            {catatan.length === 0 ? 'Tambahkan catatan penting untuk memulai manajemen kendala' : 'Coba ubah filter atau sorting'}
          </p>
          {catatan.length === 0 && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
            >
              Tambah Catatan Pertama
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCatatan ? 'Edit Catatan Penting' : 'Tambah Catatan Penting'}
        onSubmit={handleSubmit}
        submitLabel={editingCatatan ? 'Update' : 'Tambah'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Judul catatan penting..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Deskripsikan kendala atau hal penting yang perlu ditangani secara detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as CatatanPentingItem['category'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="insight">Insight - Wawasan penting</option>
              <option value="update">Update - Pembaruan informasi</option>
              <option value="issue">Issue - Masalah yang perlu diselesaikan</option>
              <option value="task">Task - Tugas yang harus dikerjakan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level Prioritas *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as CatatanPentingItem['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="critical">Critical - Harus segera ditangani</option>
              <option value="high">High - Prioritas tinggi</option>
              <option value="medium">Medium - Prioritas sedang</option>
              <option value="low">Low - Dapat ditunda</option>
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default CatatanPenting;
