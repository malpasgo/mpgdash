import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, Search, Filter, Mail, Phone, MessageCircle, Building, Globe, FileText } from 'lucide-react';
import { FormModal } from './FormModal';
import '../styles/svg-flags.css';

interface Buyer {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  country: string;
  industry?: string;
  addedDate: string;
}

interface BuyerDatabaseProps {}

export const BuyerDatabase: React.FC<BuyerDatabaseProps> = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [buyerNameFilter, setBuyerNameFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [sortBy, setSortBy] = useState<'country' | 'date' | 'industry' | 'company'>('country');
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    country: '',
    customCountry: '', // Added for manual country input
    industry: ''
  });

  // Sample data
  useEffect(() => {
    const sampleBuyers: Buyer[] = [
      {
        id: '1',
        companyName: 'Global Trade Solutions Pte Ltd',
        fullName: 'John Anderson',
        email: 'j.anderson@globaltrade.sg',
        phoneNumber: '+65 9123 4567',
        whatsappNumber: '+65 9123 4567',
        country: 'Singapore',
        industry: 'Import/Export',
        addedDate: '2025-01-15'
      },
      {
        id: '2',
        companyName: 'Emirates Food Distribution LLC',
        fullName: 'Ahmed Al-Rashid',
        email: 'ahmed.rashid@emiratesfood.ae',
        phoneNumber: '+971 50 123 4567',
        whatsappNumber: '+971 50 123 4567',
        country: 'United Arab Emirates',
        industry: 'Food & Beverage',
        addedDate: '2025-01-12'
      },
      {
        id: '3',
        companyName: 'Malaysian Spice Trading Sdn Bhd',
        fullName: 'Siti Aminah',
        email: 'siti.aminah@malayspice.my',
        phoneNumber: '+60 12 345 6789',
        whatsappNumber: '+60 12 345 6789',
        country: 'Malaysia',
        industry: 'Spices & Herbs',
        addedDate: '2025-01-10'
      },
      {
        id: '4',
        companyName: 'Thai Premium Products Co., Ltd',
        fullName: 'Somchai Jaidee',
        email: 'somchai@thaipremium.th',
        phoneNumber: '+66 81 234 5678',
        whatsappNumber: '+66 81 234 5678',
        country: 'Thailand',
        industry: 'Agriculture',
        addedDate: '2025-01-08'
      },
      {
        id: '5',
        companyName: 'Vietnam Export Alliance JSC',
        fullName: 'Nguyen Van Duc',
        email: 'duc.nguyen@vnexport.vn',
        phoneNumber: '+84 901 234 567',
        whatsappNumber: '+84 901 234 567',
        country: 'Vietnam',
        industry: 'Manufacturing',
        addedDate: '2025-01-05'
      }
    ];
    
    const saved = localStorage.getItem('buyers');
    if (saved) {
      setBuyers(JSON.parse(saved));
    } else {
      setBuyers(sampleBuyers);
      localStorage.setItem('buyers', JSON.stringify(sampleBuyers));
    }
  }, []);

  const countries = [
    'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines',
    'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait',
    'Japan', 'South Korea', 'China', 'Taiwan', 'Hong Kong',
    'United States', 'United Kingdom', 'Germany', 'Netherlands',
    'Australia', 'New Zealand', 'Other'
  ];

  const industries = [
    'Import/Export', 'Food & Beverage', 'Spices & Herbs',
    'Agriculture', 'Manufacturing', 'Retail', 'Wholesale',
    'Technology', 'Healthcare', 'Automotive', 'Textiles',
    'Electronics', 'Other'
  ];

  const filteredAndSortedBuyers = buyers
    .filter(buyer => {
      const matchesBuyerName = 
        buyerNameFilter === '' ||
        buyer.companyName.toLowerCase().includes(buyerNameFilter.toLowerCase()) ||
        buyer.fullName.toLowerCase().includes(buyerNameFilter.toLowerCase()) ||
        buyer.email.toLowerCase().includes(buyerNameFilter.toLowerCase()) ||
        (buyer.phoneNumber && buyer.phoneNumber.toLowerCase().includes(buyerNameFilter.toLowerCase())) ||
        (buyer.whatsappNumber && buyer.whatsappNumber.toLowerCase().includes(buyerNameFilter.toLowerCase()));
      
      const matchesCountry = 
        (selectedCountry === 'all' || buyer.country === selectedCountry) &&
        (countryFilter === 'all' || buyer.country === countryFilter);
      
      return matchesBuyerName && matchesCountry;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'country':
          return a.country.localeCompare(b.country);
        case 'industry':
          const industryA = a.industry || '';
          const industryB = b.industry || '';
          return industryA.localeCompare(industryB);
        case 'date':
          // Sort by date (newest first)
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default:
          return 0;
      }
    });

  const handleAddBuyer = () => {
    setEditingBuyer(null);
    setFormData({
      companyName: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      country: '',
      customCountry: '', // Reset custom country
      industry: ''
    });
    setIsModalOpen(true);
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    
    // Check if buyer's country is in the predefined list
    const isCustomCountry = !countries.includes(buyer.country) || buyer.country === 'Other';
    
    setFormData({
      companyName: buyer.companyName,
      fullName: buyer.fullName,
      email: buyer.email,
      phoneNumber: buyer.phoneNumber,
      whatsappNumber: buyer.whatsappNumber,
      country: isCustomCountry ? 'Other' : buyer.country,
      customCountry: isCustomCountry ? buyer.country : '', // Set custom country if not in list
      industry: buyer.industry || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteBuyer = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data buyer ini?')) {
      const newBuyers = buyers.filter(buyer => buyer.id !== id);
      setBuyers(newBuyers);
      localStorage.setItem('buyers', JSON.stringify(newBuyers));
    }
  };

  // Handler for country dropdown change
  const handleCountryChange = (selectedCountry: string) => {
    setFormData({
      ...formData,
      country: selectedCountry,
      customCountry: selectedCountry === 'Other' ? formData.customCountry : '' // Clear custom country if not "Other"
    });
  };

  const handleSubmit = () => {
    // Check required fields
    if (!formData.companyName || !formData.fullName || !formData.email || !formData.country) {
      alert('Field yang wajib diisi: Nama Perusahaan, Nama Lengkap, Email, dan Negara!');
      return;
    }

    // Validate custom country when "Other" is selected
    if (formData.country === 'Other' && !formData.customCountry.trim()) {
      alert('Silakan masukkan nama negara secara manual!');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Format email tidak valid!');
      return;
    }

    // Determine final country value
    const finalCountry = formData.country === 'Other' ? formData.customCountry.trim() : formData.country;

    const newBuyer: Buyer = {
      id: editingBuyer ? editingBuyer.id : Date.now().toString(),
      companyName: formData.companyName,
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      whatsappNumber: formData.whatsappNumber,
      country: finalCountry, // Use final country (either selected or custom)
      industry: formData.industry,
      addedDate: editingBuyer ? editingBuyer.addedDate : new Date().toISOString().split('T')[0]
    };

    let newBuyers;
    if (editingBuyer) {
      newBuyers = buyers.map(buyer => buyer.id === editingBuyer.id ? newBuyer : buyer);
    } else {
      newBuyers = [...buyers, newBuyer];
    }

    setBuyers(newBuyers);
    localStorage.setItem('buyers', JSON.stringify(newBuyers));
    setIsModalOpen(false);
  };

  const getCountryFlagClass = (country: string) => {
    const flagClassMap: { [key: string]: string } = {
      'Singapore': 'flag-icon-sg',
      'Malaysia': 'flag-icon-my',
      'Thailand': 'flag-icon-th',
      'Vietnam': 'flag-icon-vn',
      'Philippines': 'flag-icon-ph',
      'United Arab Emirates': 'flag-icon-ae',
      'Saudi Arabia': 'flag-icon-sa',
      'Qatar': 'flag-icon-qa',
      'Kuwait': 'flag-icon-kw',
      'Japan': 'flag-icon-jp',
      'South Korea': 'flag-icon-kr',
      'China': 'flag-icon-cn',
      'Taiwan': 'flag-icon-tw',
      'Hong Kong': 'flag-icon-hk',
      'United States': 'flag-icon-us',
      'United Kingdom': 'flag-icon-gb',
      'Germany': 'flag-icon-de',
      'Netherlands': 'flag-icon-nl',
      'Australia': 'flag-icon-au',
      'New Zealand': 'flag-icon-nz',
      'Indonesia': 'flag-icon-id',
      'India': 'flag-icon-in',
      'France': 'flag-icon-fr',
      'Italy': 'flag-icon-it',
      'Spain': 'flag-icon-es',
      'Brazil': 'flag-icon-br',
      'Canada': 'flag-icon-ca',
      'Russia': 'flag-icon-ru',
      'Mexico': 'flag-icon-mx',
      'South Africa': 'flag-icon-za'
    };
    return flagClassMap[country] || 'flag-icon-unknown';
  };





  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Database</h1>
            <p className="text-gray-600">Kelola data pembeli dan mitra bisnis ekspor</p>
          </div>
          <motion.button
            onClick={handleAddBuyer}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Buyer</span>
          </motion.button>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="flex flex-col space-y-4">
          {/* Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Nama Buyer</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama perusahaan, nama lengkap, email, nomor HP, atau WhatsApp..."
                  value={buyerNameFilter}
                  onChange={(e) => setBuyerNameFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Negara Buyer</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="all">Semua Negara</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Urutkan Data</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'country' | 'date' | 'industry' | 'company')}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="country">Urutkan: Negara</option>
                <option value="date">Urutkan: Tanggal</option>
                <option value="industry">Urutkan: Industri</option>
                <option value="company">Urutkan: Perusahaan</option>
              </select>
            </div>
          </div>
          
          {/* Filter Summary and Actions */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <div className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold text-gray-900">{filteredAndSortedBuyers.length}</span> dari <span className="font-semibold text-gray-900">{buyers.length}</span> total buyer
              {(buyerNameFilter || countryFilter !== 'all') && (
                <span className="ml-2 text-blue-600">
                  (Terfilter:
                  {buyerNameFilter && ` Nama: "${buyerNameFilter}"`}
                  {countryFilter !== 'all' && ` Negara: "${countryFilter}"`}
                  )
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {(buyerNameFilter || countryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setBuyerNameFilter('');
                    setCountryFilter('all');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Reset Filter
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Buyers</p>
              <p className="text-2xl font-bold text-gray-900">{buyers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Globe className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Negara</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(buyers.map(b => b.country)).size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Industri</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(buyers.map(b => b.industry).filter(Boolean)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perusahaan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negara</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredAndSortedBuyers.map((buyer) => (
                  <motion.tr
                    key={buyer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{buyer.companyName}</div>
                        <div className="text-sm text-gray-500">{buyer.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`mailto:${buyer.email}`} className="hover:text-blue-600">{buyer.email}</a>
                        </div>
                        {buyer.phoneNumber && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <a href={`tel:${buyer.phoneNumber}`} className="hover:text-blue-600">{buyer.phoneNumber}</a>
                          </div>
                        )}
                        {buyer.whatsappNumber && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                            <a href={`https://wa.me/${buyer.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">WhatsApp</a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flag-container">
                        <span 
                          className={`flag-icon ${getCountryFlagClass(buyer.country)}`}
                          title={buyer.country}
                        ></span>
                        <span className="country-name">{buyer.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {buyer.industry || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {buyer.addedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditBuyer(buyer)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuyer(buyer.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredAndSortedBuyers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada buyer ditemukan</h3>
            <p className="text-gray-500">Coba ubah kata kunci pencarian atau filter negara</p>
          </div>
        )}
      </div>

      {/* Add/Edit Buyer Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBuyer ? 'Edit Data Buyer' : 'Tambah Buyer Baru'}
        onSubmit={handleSubmit}
        submitLabel={editingBuyer ? 'Update' : 'Tambah'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Perusahaan *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan nama perusahaan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan nama lengkap kontak person"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan alamat email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor HP
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan nomor HP (contoh: +62 812 3456 7890)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan nomor WhatsApp (contoh: +62 812 3456 7890)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negara *
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Pilih negara</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Conditional input field for custom country */}
          {formData.country === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Negara *
              </label>
              <input
                type="text"
                value={formData.customCountry}
                onChange={(e) => setFormData({ ...formData, customCountry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Masukkan nama negara"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industri
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Pilih industri</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default BuyerDatabase;