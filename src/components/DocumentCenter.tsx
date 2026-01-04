import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Edit2, Trash2, Eye, Upload, Search, Filter } from 'lucide-react';
import { FormModal } from './FormModal';

interface Document {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'pending' | 'expired';
  uploadDate: string;
  url: string;
}

interface DocumentCenterProps {}

export const DocumentCenter: React.FC<DocumentCenterProps> = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    status: 'active' as Document['status'],
    url: ''
  });

  // Sample data
  useEffect(() => {
    const sampleDocuments: Document[] = [
      {
        id: '1',
        name: 'NPWP Perusahaan',
        type: 'Tax Document',
        description: 'Nomor Pokok Wajib Pajak sudah aktif',
        status: 'active',
        uploadDate: '2025-01-15',
        url: 'https://www.pajak.go.id/npwp-validation'
      },
      {
        id: '2',
        name: 'Surat Izin Usaha',
        type: 'Business License',
        description: 'Izin usaha perdagangan ekspor-impor',
        status: 'active',
        uploadDate: '2025-01-10',
        url: 'https://www.oss.go.id/portal'
      },
      {
        id: '3',
        name: 'Sertifikat Halal',
        type: 'Certification',
        description: 'Sertifikat halal produk untuk ekspor',
        status: 'pending',
        uploadDate: '2025-01-12',
        url: 'https://www.halal.go.id/sertifikat'
      },
      {
        id: '4',
        name: 'Form Export Declaration',
        type: 'Export Document',
        description: 'Deklarasi ekspor untuk periode Q1 2025',
        status: 'expired',
        uploadDate: '2024-12-20',
        url: 'https://www.beacukai.go.id/declaration'
      }
    ];
    
    const saved = localStorage.getItem('documents');
    if (saved) {
      setDocuments(JSON.parse(saved));
    } else {
      setDocuments(sampleDocuments);
      localStorage.setItem('documents', JSON.stringify(sampleDocuments));
    }
  }, []);

  const documentTypes = [
    'Tax Document',
    'Business License',
    'Certification',
    'Export Document',
    'Contract',
    'Invoice',
    'Other'
  ];

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || doc.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by date (newest first)
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
    });

  const handleAddDocument = () => {
    setEditingDocument(null);
    setFormData({ name: '', type: '', description: '', status: 'active', url: '' });
    setIsModalOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      description: doc.description,
      status: doc.status,
      url: doc.url
    });
    setIsModalOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      const newDocuments = documents.filter(doc => doc.id !== id);
      setDocuments(newDocuments);
      localStorage.setItem('documents', JSON.stringify(newDocuments));
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.type || !formData.url) {
      alert('Nama dokumen, tipe, dan URL harus diisi!');
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.url);
    } catch {
      alert('Format URL tidak valid!');
      return;
    }

    const newDocument: Document = {
      id: editingDocument ? editingDocument.id : Date.now().toString(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      status: formData.status,
      uploadDate: editingDocument ? editingDocument.uploadDate : new Date().toISOString().split('T')[0],
      url: formData.url
    };

    let newDocuments;
    if (editingDocument) {
      newDocuments = documents.map(doc => doc.id === editingDocument.id ? newDocument : doc);
    } else {
      newDocuments = [...documents, newDocument];
    }

    setDocuments(newDocuments);
    localStorage.setItem('documents', JSON.stringify(newDocuments));
    setIsModalOpen(false);
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending': return 'Pending';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Center</h1>
            <p className="text-gray-600">Kelola dokumen ekspor dan sertifikasi perusahaan</p>
          </div>
          <motion.button
            onClick={handleAddDocument}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Dokumen</span>
          </motion.button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Semua Tipe</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="date">Urutkan: Tanggal</option>
              <option value="name">Urutkan: Nama</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAndSortedDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
            >
              {/* Document Icon and Type */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{doc.type}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Info */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{doc.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{doc.description}</p>
                <div className="text-xs text-gray-500">
                  <span>Ditambahkan pada: {doc.uploadDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  onClick={() => window.open(doc.url, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Lihat</span>
                </button>
                <button
                  onClick={() => handleEditDocument(doc)}
                  className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAndSortedDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada dokumen ditemukan</h3>
          <p className="text-gray-500">Coba ubah kata kunci pencarian atau filter tipe dokumen</p>
        </div>
      )}

      {/* Add/Edit Document Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDocument ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
        onSubmit={handleSubmit}
        submitLabel={editingDocument ? 'Update' : 'Tambah'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Dokumen *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan nama dokumen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Dokumen *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih tipe dokumen</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
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
              placeholder="Masukkan deskripsi dokumen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Dokumen *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/dokumen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Document['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Aktif</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default DocumentCenter;