import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, FileText, Users, X, AlertTriangle, Banknote, CreditCard, Receipt, Clock, BarChart3 } from 'lucide-react';

type MenuItem = 'dashboard' | 'executive-dashboard' | 'documents' | 'buyers' | 'catatan-penting' | 'keuangan-ekspor' | 'lc-management' | 'payment-terms' | 'invoice-management';

interface MenuDropdownProps {
  currentPage: MenuItem;
  onPageChange: (page: MenuItem) => void;
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
    {
      id: 'dashboard' as MenuItem,
      title: 'Dashboard',
      subtitle: 'Menu Utama',
      icon: Home,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'executive-dashboard' as MenuItem,
      title: 'Executive Dashboard',
      subtitle: 'Real-time Analytics',
      icon: BarChart3,
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'documents' as MenuItem,
      title: 'Document Center',
      subtitle: 'Kelola Dokumen',
      icon: FileText,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'buyers' as MenuItem,
      title: 'Buyer Database',
      subtitle: 'Data Pembeli',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'catatan-penting' as MenuItem,
      title: 'Catatan Penting',
      subtitle: 'Manajemen Kendala',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'keuangan-ekspor' as MenuItem,
      title: 'Keuangan Ekspor',
      subtitle: 'Budget & Cashflow',
      icon: Banknote,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'lc-management' as MenuItem,
      title: 'LC Management',
      subtitle: 'Letter of Credit',
      icon: CreditCard,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'payment-terms' as MenuItem,
      title: 'Payment Terms',
      subtitle: 'Monitoring Pembayaran',
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'invoice-management' as MenuItem,
      title: 'Invoice Management',
      subtitle: 'Manajemen Invoice',
      icon: Receipt,
      color: 'from-pink-500 to-pink-600'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [isOpen]);

  const handleItemClick = (itemId: MenuItem) => {
    console.log('Menu item clicked:', itemId);
    console.log('onPageChange function:', typeof onPageChange);
    try {
      if (onPageChange) {
        onPageChange(itemId);
        console.log('Page change called successfully for:', itemId);
      } else {
        console.error('onPageChange function is not available');
      }
    } catch (error) {
      console.error('Error in handleItemClick:', error);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Menu Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              zIndex: 200
            }}
            className="w-80 max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-y-auto ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg">Menu Navigasi</h3>
              <p className="text-blue-100 text-sm">Pilih halaman yang ingin Anda kunjungi</p>
            </div>

            {/* Menu Items */}
            <div className="p-2 min-h-[300px]" onClick={(e) => e.stopPropagation()}>
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = currentPage === item.id;
                console.log('Rendering menu item:', item.id, 'isActive:', isActive, 'currentPage:', currentPage);
                
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked for item:', item.id, 'title:', item.title);
                      console.log('About to call handleItemClick with:', item.id);
                      handleItemClick(item.id);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    className={`w-full text-left p-3 mb-2 rounded-xl transition-all duration-200 flex items-center space-x-3 group cursor-pointer relative z-10 ${
                      isActive 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    } transition-transform duration-200`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h4 className={`font-bold text-base ${
                        isActive ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </h4>
                      <p className={`text-sm ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 bg-blue-500 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-gray-500 text-center">
                © 2025 PT. MALAKA PASAI GLOBAL
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuDropdown;