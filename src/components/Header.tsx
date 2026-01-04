import React from 'react';

type MenuItem = 'dashboard' | 'executive-dashboard' | 'documents' | 'buyers' | 'catatan-penting' | 'keuangan-ekspor' | 'lc-management' | 'payment-terms' | 'invoice-management';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentPage?: MenuItem;
  onPageChange?: (page: MenuItem) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Roadmap Ekspor PT. MALAKA PASAI GLOBAL",
  subtitle = "Agustus 2025 - Desember 2030",
  currentPage = 'dashboard',
  onPageChange
}) => {
  return (
    <header className="relative bg-white border-b border-gray-200/60 z-10">
      {/* Modern Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #1e40af 100%)',
        }}
      />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-5 py-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Brand Section */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/30 shadow-lg p-2">
                <img 
                  src="/logo.png" 
                  alt="MPG Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {title}
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom shine effect */}
      <div 
        className="h-0 w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }}
      />
    </header>
  );
};

export default Header;