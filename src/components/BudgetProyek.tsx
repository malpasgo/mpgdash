import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit2, Trash2, Save, X, Clock, ChevronDown, Filter, TrendingUp, Wallet } from 'lucide-react';
import { FormModal } from './FormModal';

interface BudgetItem {
  id: string;
  name: string;
  category: 'operasional' | 'marketing' | 'produksi' | 'transportasi' | 'legal' | 'lainnya';
  amount: number;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetProyekProps {}

export const BudgetProyek: React.FC<BudgetProyekProps> = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'operasional' as BudgetItem['category'],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Category configurations
  const categoryConfig = {
    operasional: { label: 'Operasional', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
    marketing: { label: 'Marketing', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
    produksi: { label: 'Produksi', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
    transportasi: { label: 'Transportasi', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
    legal: { label: 'Legal & Dokumentasi', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
    lainnya: { label: 'Lainnya', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' }
  };

  // Load data from localStorage
  useEffect(() => {
    const savedBudget = localStorage.getItem('budget-proyek');
    if (savedBudget) {
      try {
        setBudgetItems(JSON.parse(savedBudget));
      } catch (error) {
        console.error('Error loading budget from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage
  const saveBudget = (newBudgetItems: BudgetItem[]) => {
    setBudgetItems(newBudgetItems);
    try {
      localStorage.setItem('budget-proyek', JSON.stringify(newBudgetItems));
    } catch (error) {
      console.error('Error saving budget to localStorage:', error);
    }
  };

  // Filter and sort budget items
  const filteredAndSortedBudget = budgetItems
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount;
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Get statistics
  const getStats = () => {
    const total = budgetItems.length;
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);
    const avgBudget = total > 0 ? totalBudget / total : 0;
    
    // Budget by category
    const budgetByCategory = budgetItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Highest category
    const highestCategory = Object.entries(budgetByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    return { 
      total, 
      totalBudget, 
      avgBudget, 
      budgetByCategory,
      highestCategory: highestCategory ? {
        category: highestCategory[0],
        amount: highestCategory[1]
      } : null
    };
  };

  // Handle add
  const handleAdd = () => {
    setEditingBudget(null);
    setFormData({ 
      name: '', 
      category: 'operasional', 
      amount: '', 
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (item: BudgetItem) => {
    setEditingBudget(item);
    setFormData({ 
      name: item.name, 
      category: item.category, 
      amount: item.amount.toString(),
      date: item.date,
      description: item.description
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    const itemToDelete = budgetItems.find(item => item.id === id);
    if (!itemToDelete) {
      alert('Item budget tidak ditemukan!');
      return;
    }
    
    const confirmMessage = `Apakah Anda yakin ingin menghapus "${itemToDelete.name}" dengan budget ${formatCurrency(itemToDelete.amount)}?`;
    if (window.confirm(confirmMessage)) {
      try {
        const newBudgetItems = budgetItems.filter(item => item.id !== id);
        saveBudget(newBudgetItems);
        
        // Optional: Add success notification
        setTimeout(() => {
          console.log('Budget item berhasil dihapus:', itemToDelete.name);
        }, 100);
      } catch (error) {
        console.error('Error menghapus budget item:', error);
        alert('Gagal menghapus item budget. Silakan coba lagi.');
      }
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Nama item budget harus diisi!');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Jumlah budget harus lebih dari 0!');
      return;
    }
    if (!formData.date) {
      alert('Tanggal harus diisi!');
      return;
    }

    const now = new Date().toISOString();
    const amount = parseFloat(formData.amount);
    
    if (editingBudget) {
      // Update existing
      const newBudgetItems = budgetItems.map(item => 
        item.id === editingBudget.id 
          ? { 
              ...item, 
              name: formData.name, 
              category: formData.category, 
              amount,
              date: formData.date,
              description: formData.description,
              updatedAt: now 
            }
          : item
      );
      saveBudget(newBudgetItems);
    } else {
      // Add new
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        amount,
        date: formData.date,
        description: formData.description,
        createdAt: now,
        updatedAt: now
      };
      saveBudget([...budgetItems, newItem]);
    }
    
    setIsModalOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const stats = getStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Proyek</h1>
            <p className="text-gray-600">Kelola budget dan alokasi biaya untuk roadmap ekspor perusahaan</p>
          </div>
          <motion.button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Budget</span>
          </motion.button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Item</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgBudget)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kategori Tertinggi</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.highestCategory ? categoryConfig[stats.highestCategory.category as keyof typeof categoryConfig].label : 'Belum ada'}
                </p>
                {stats.highestCategory && (
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.highestCategory.amount)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'amount' | 'date' | 'category')}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="date">Urutkan: Tanggal</option>
              <option value="amount">Urutkan: Jumlah</option>
              <option value="category">Urutkan: Kategori</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Semua Kategori</option>
              <option value="operasional">Operasional</option>
              <option value="marketing">Marketing</option>
              <option value="produksi">Produksi</option>
              <option value="transportasi">Transportasi</option>
              <option value="legal">Legal & Dokumentasi</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedBudget.map((item) => {
            const config = categoryConfig[item.category];
            
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
                        <span>Tanggal: {formatDate(item.date)}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(item.amount)}</p>
                    {item.description && (
                      <p className="text-gray-600 mb-2">{item.description}</p>
                    )}
                    {item.updatedAt !== item.createdAt && (
                      <p className="text-sm text-gray-500">Diupdate {new Date(item.updatedAt).toLocaleDateString('id-ID')}</p>
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
      {filteredAndSortedBudget.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {budgetItems.length === 0 ? 'Belum ada item budget' : 'Tidak ada item yang sesuai filter'}
          </h3>
          <p className="text-gray-500 mb-4">
            {budgetItems.length === 0 ? 'Tambahkan item budget untuk memulai manajemen anggaran' : 'Coba ubah filter atau sorting'}
          </p>
          {budgetItems.length === 0 && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Tambah Budget Pertama
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget Item' : 'Tambah Budget Item'}
        onSubmit={handleSubmit}
        submitLabel={editingBudget ? 'Update' : 'Tambah'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Item Budget *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Biaya sertifikat ekspor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as BudgetItem['category'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="operasional">Operasional</option>
              <option value="marketing">Marketing</option>
              <option value="produksi">Produksi</option>
              <option value="transportasi">Transportasi</option>
              <option value="legal">Legal & Dokumentasi</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Budget (IDR) *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: 5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Deskripsi detail tentang item budget ini..."
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default BudgetProyek;