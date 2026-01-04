import React, { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Components
import Header from '@/components/Header';
import StatsSummary from '@/components/StatsSummary';
import DashboardCharts from '@/components/DashboardCharts';
import Timeline from '@/components/Timeline';
import DetailModal from '@/components/DetailModal';
import RoadmapSummary from '@/components/RoadmapSummary';

import DocumentCenter from '@/components/DocumentCenter';
import BuyerDatabase from '@/components/BuyerDatabase';
import CatatanPenting from '@/components/CatatanPenting';
import KeuanganEkspor from '@/components/KeuanganEkspor';
import LCManagement from '@/components/LCManagement';
import PaymentTermsManagement from '@/components/PaymentTermsManagement';
import InvoiceManagement from '@/components/InvoiceManagement';
import ExecutiveDashboard from '@/components/ExecutiveDashboard';

// Hooks
import { useRoadmapData } from '@/hooks/useRoadmapData';
import { RoadmapItem } from '@/lib/supabase';

// Progress Context
import { ProgressProvider } from '@/contexts/ProgressContext';
import { DataSyncProvider } from '@/contexts/DataSyncContext';

type MenuItem = 'dashboard' | 'executive-dashboard' | 'documents' | 'buyers' | 'catatan-penting' | 'keuangan-ekspor' | 'lc-management' | 'payment-terms' | 'invoice-management';

const RoadmapDashboard: React.FC = () => {
  const {
    roadmapItems,
    loading,
    error,
    statistics,
    progressStats
  } = useRoadmapData();

  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState<MenuItem>('dashboard');

  // Page navigation
  const handlePageChange = (page: MenuItem) => {
    console.log('Page change requested to:', page);
    setCurrentPage(page);
    // Close any open modals when switching pages
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Modal navigation
  const handleItemClick = (item: RoadmapItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleNextItem = () => {
    if (!selectedItem) return;
    const currentIndex = roadmapItems.findIndex(item => item.id === selectedItem.id);
    if (currentIndex < roadmapItems.length - 1) {
      setSelectedItem(roadmapItems[currentIndex + 1]);
    }
  };

  const handlePreviousItem = () => {
    if (!selectedItem) return;
    const currentIndex = roadmapItems.findIndex(item => item.id === selectedItem.id);
    if (currentIndex > 0) {
      setSelectedItem(roadmapItems[currentIndex - 1]);
    }
  };

  const canNavigateNext = selectedItem ? 
    roadmapItems.findIndex(item => item.id === selectedItem.id) < roadmapItems.length - 1 : false;
  
  const canNavigatePrevious = selectedItem ? 
    roadmapItems.findIndex(item => item.id === selectedItem.id) > 0 : false;



  // Render page content based on current page
  const renderDashboardContent = () => (
    <div className="flex-1 px-6 lg:px-8">
      {/* Dashboard Overview Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
        <StatsSummary 
          roadmapItems={roadmapItems} 
          filteredCount={statistics.total}
          progressStats={progressStats}
        />
      </div>

      {/* Timeline Section */}
      <div id="timeline-section" className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Timeline Roadmap Interaktif</h2>
        <Timeline
          roadmapItems={roadmapItems}
          onItemClick={handleItemClick}
          selectedItem={selectedItem}
        />
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary Overview</h2>
        <RoadmapSummary roadmapItems={roadmapItems} />
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Visualizations</h2>
        <DashboardCharts roadmapItems={roadmapItems} />
      </div>

      {/* Empty State */}
      {roadmapItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data yang ditemukan</h3>
          <p className="text-gray-600 mb-4">Mohon tunggu atau coba refresh halaman</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      )}
    </div>
  );

  const renderPageContent = () => {
    console.log('Rendering page content for:', currentPage);
    switch (currentPage) {
      case 'executive-dashboard':
        return <ExecutiveDashboard />;
        
      case 'documents':
        return <DocumentCenter />;
      
      case 'buyers':
        return <BuyerDatabase />;
        
      case 'catatan-penting':
        return <CatatanPenting />;
        
      case 'keuangan-ekspor':
        return <KeuanganEkspor />;
      
      case 'lc-management':
        return <LCManagement />;
      
      case 'payment-terms':
        return <PaymentTermsManagement />;
      
      case 'invoice-management':
        return <InvoiceManagement />;
      
      default: // dashboard
        // Loading state for dashboard only
        if (loading) {
          return (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-lg text-gray-600">Memuat data roadmap...</p>
                <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
              </div>
            </div>
          );
        }

        // Error state for dashboard only
        if (error) {
          return (
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Data</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mx-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            {/* Dashboard Overview Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              <StatsSummary 
                roadmapItems={roadmapItems} 
                filteredCount={statistics.total}
                progressStats={progressStats}
              />
            </section>

            {/* Timeline Section */}
            <section id="timeline-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Timeline Roadmap Interaktif</h2>
              <Timeline
                roadmapItems={roadmapItems}
                onItemClick={handleItemClick}
                selectedItem={selectedItem}
              />
            </section>

            {/* Summary Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary Overview</h2>
              <RoadmapSummary roadmapItems={roadmapItems} />
            </section>

            {/* Charts Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Visualizations</h2>
              <DashboardCharts roadmapItems={roadmapItems} />
            </section>

            {/* Empty State */}
            {roadmapItems.length === 0 && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data yang ditemukan</h3>
                <p className="text-gray-600 mb-4">Mohon tunggu atau coba refresh halaman</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2 inline" />
                  Refresh
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <ProgressProvider>
      <DataSyncProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header 
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          
          <div className="flex-1 px-6 lg:px-8">
            {renderPageContent()}
          </div>

          {/* Detail Modal - Only show on dashboard */}
          {currentPage === 'dashboard' && (
            <DetailModal
              item={selectedItem}
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onNext={handleNextItem}
              onPrevious={handlePreviousItem}
              canNavigateNext={canNavigateNext}
              canNavigatePrevious={canNavigatePrevious}
              allItems={roadmapItems}
            />
          )}

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-gray-600">
                <p className="text-sm">
                  © 2025 Roadmap Ekspor PT. MALAKA PASAI GLOBAL. Dashboard interaktif untuk monitoring progress ekspor.
                </p>
                <p className="text-xs mt-2 text-gray-500">
                  Dibuat oleh MiniMax Agent - Periode Agustus 2025 hingga Desember 2030
                </p>
              </div>
            </div>
          </footer>
        </div>
      </DataSyncProvider>
    </ProgressProvider>
  );
};

export default RoadmapDashboard;