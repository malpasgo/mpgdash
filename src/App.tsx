import React, { useState, useEffect } from 'react';
import RoadmapDashboard from '@/components/RoadmapDashboard';
import ExecutiveDashboardEnhanced from '@/components/ExecutiveDashboardEnhanced';
import KeuanganEkspor from '@/components/KeuanganEkspor';
import LCManagement from '@/components/LCManagement';
import InvoiceManagement from '@/components/InvoiceManagement';
import PaymentTermsManagement from '@/components/PaymentTermsManagement';
import CatatanPenting from '@/components/CatatanPenting';
import DocumentCenter from '@/components/DocumentCenter';
import BuyerDatabase from '@/components/BuyerDatabase';
import KalkulatorHarga from '@/components/KalkulatorHarga';
import KalkulatorKontainer from '@/components/KalkulatorKontainerNew';
import UserManagement from '@/components/UserManagement';
import { DataSyncProvider } from '@/contexts/DataSyncContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, FileText, Target, Users, Menu, X,
  StickyNote, AlertTriangle, Clock, Calculator, 
  Wallet, FileCheck, Package, ChevronDown, Bell, LogOut, UserCog
} from 'lucide-react';
import './App.css';

type ActivePage = 'executive' | 'roadmap' | 'keuangan' | 'lc' | 'invoice' | 'payment' | 'catatan' | 'documents' | 'buyers' | 'kalkulator' | 'kalkulator-kontainer' | 'user-management';

interface NavigationItem {
  id: ActivePage;
  name: string;
  icon: any;
  description: string;
  color: string;
  submenu?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { id: 'executive' as const, name: 'Executive Dashboard', icon: BarChart3, description: 'Real-time Analytics', color: 'bg-purple-500' },
  { id: 'roadmap' as const, name: 'Roadmap Dashboard', icon: Target, description: 'Timeline dan strategi', color: 'bg-green-400' },
  { id: 'keuangan' as const, name: 'Keuangan Ekspor', icon: Wallet, description: 'Budget & Cashflow', color: 'bg-teal-500' },
  { id: 'lc' as const, name: 'LC Management', icon: FileText, description: 'Letter of Credit', color: 'bg-blue-500' },
  { id: 'invoice' as const, name: 'Invoice Management', icon: Calculator, description: 'Manajemen Invoice', color: 'bg-pink-500' },
  { id: 'payment' as const, name: 'Payment Terms', icon: Clock, description: 'Monitoring Pembayaran', color: 'bg-teal-400' },
  { id: 'catatan' as const, name: 'Catatan Penting', icon: AlertTriangle, description: 'Manajemen Kendala', color: 'bg-orange-500' },
  { id: 'documents' as const, name: 'Document Center', icon: FileCheck, description: 'Kelola Dokumen', color: 'bg-green-600' },
  { id: 'buyers' as const, name: 'Buyer Database', icon: Users, description: 'Data Pembeli', color: 'bg-purple-600' },
  {
    id: 'kalkulator' as const,
    name: 'Kalkulator Ekspor',
    icon: Calculator,
    description: 'Tools kalkulasi ekspor',
    color: 'bg-emerald-600',
    submenu: [
      { id: 'kalkulator' as const, name: 'Kalkulator Harga', icon: Calculator, description: 'Export Price Calculator', color: 'bg-emerald-500' },
      { id: 'kalkulator-kontainer' as const, name: 'Kalkulator Kontainer', icon: Package, description: 'Container Loading Calculator', color: 'bg-blue-500' }
    ]
  },
  { id: 'user-management' as const, name: 'User Management', icon: UserCog, description: 'Manage user access', color: 'bg-gray-500' }
];

// Login Component
const LoginForm = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    try {
      setError('');
      await signIn(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email atau password salah.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email belum diverifikasi. Silakan periksa email Anda.');
      } else {
        setError(error.message || 'Terjadi kesalahan saat login.');
      }
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-xs p-6 space-y-6 bg-white rounded-lg">
        <div className="text-center">
          <img src="/logo.png" alt="MPG Export Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk melanjutkan ke MPG Export
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-base border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 text-base border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div>
            <Button 
              onClick={handleLogin} 
              className="w-full py-3 text-base" 
              disabled={loading}
            >
              {loading ? 'Sedang Masuk...' : 'Masuk'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500">
          © 2025 MPG Export. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  
  // State management
  const [activePage, setActivePage] = useState<ActivePage>('executive');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isAutoHideMode, setIsAutoHideMode] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mouseNearLeftEdge, setMouseNearLeftEdge] = useState(false);

  // Set default landing page based on user role after login
  useEffect(() => {
    if (profile && !loading) {
      // Set default page based on role
      if (profile.role === 'admin') {
        // Admin users default to Executive Dashboard
        setActivePage('executive');
      } else if (profile.role === 'executive') {
        // Executive users default to Executive Dashboard
        setActivePage('executive');
      } else if (profile.role === 'finance') {
        // Finance users default to "Catatan Penting" page
        setActivePage('catatan');
      } else {
        // Fallback for any other role
        setActivePage('catatan');
      }
    }
  }, [profile, loading]);

  // ✅ Auto-expand parent menu when submenu item is active - MOVED TO TOP
  useEffect(() => {
    if (activePage === 'kalkulator' || activePage === 'kalkulator-kontainer') {
      if (!expandedMenus.includes('kalkulator')) {
        setExpandedMenus(prev => [...prev, 'kalkulator']);
      }
    }
  }, [activePage, expandedMenus]);
  
  // ✅ Auto-hide sidebar mouse detection - MOVED TO TOP
  useEffect(() => {
    if (!isAutoHideMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const leftThreshold = 50;
      const isNearLeftEdge = e.clientX <= leftThreshold;
      
      if (isNearLeftEdge !== mouseNearLeftEdge) {
        setMouseNearLeftEdge(isNearLeftEdge);
        setShowSidebar(isNearLeftEdge);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const sidebarWidth = 256;
      if (e.clientX > sidebarWidth + 20) {
        setShowSidebar(false);
        setMouseNearLeftEdge(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isAutoHideMode, mouseNearLeftEdge]);
  
  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <img src="/logo.png" alt="MPG Export Logo" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  // ✅ Show login form if not authenticated - AFTER ALL HOOKS
  if (!user) {
    return <LoginForm />;
  }
  
  // Navigation handler function
  const handleNavigation = (pageId: ActivePage) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const handleSidebarClick = () => {
    // No collapse/expand logic needed anymore - always show full menu
  };

  const toggleAutoHideMode = () => {
    setIsAutoHideMode(!isAutoHideMode);
    if (!isAutoHideMode) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting to logout...');
      
      // First, try the normal Supabase signOut
      try {
        await signOut();
      } catch (error) {
        console.warn('Supabase signOut failed, proceeding with force logout:', error);
      }
      
      // Force clear all browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn('Storage clear failed:', error);
      }
      
      // Force navigation to login page immediately
      window.location.href = window.location.origin;
      
    } catch (error) {
      console.error('Complete logout process failed, forcing page reload:', error);
      // Ultimate fallback - force reload to home page
      window.location.href = window.location.origin;
    }
  };

  // Get filtered navigation based on user role
  const getFilteredNavigation = () => {
    if (profile?.role === 'admin') {
      // Admin: Access to ALL menu items including User Management
      return navigation;
    } else if (profile?.role === 'executive') {
      // Executive: Access to all except User Management
      return navigation.filter(item => item.id !== 'user-management');
    } else if (profile?.role === 'finance') {
      // Finance: Limited access to financial and operational tools
      const allowedPages = ['keuangan', 'lc', 'invoice', 'catatan', 'kalkulator'];
      return navigation.filter(item => allowedPages.includes(item.id));
    }
    // Fallback: no menu access
    return [];
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = isMenuExpanded(item.id);
    const isSubmenuItem = level > 0;
    
    const isSubmenuActive = hasSubmenu && item.submenu!.some(subItem => activePage === subItem.id);
    const shouldShowAsActive = isActive || isSubmenuActive;

    return (
      <div key={item.id}>
        <div className="relative group">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (hasSubmenu && !isSubmenuItem) {
                toggleMenu(item.id);
                return;
              }
              
              handleNavigation(item.id);
            }}
            className={`
              w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-50
              ${isSubmenuItem ? 'ml-4 px-4 py-2' : ''}
              ${shouldShowAsActive ? 'bg-gray-50' : ''}
            `}
          >
            <div className={`
              ${isSubmenuItem ? 'w-8 h-8 mr-3' : 'w-10 h-10 mr-3'} 
              ${item.color} rounded-xl flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105
            `}>
              <Icon className={`${isSubmenuItem ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
            </div>
            
            <div className="text-left flex-1">
              <div className={`font-medium ${
                shouldShowAsActive ? 'text-gray-900' : 'text-gray-700'
              } ${isSubmenuItem ? 'text-sm' : ''}`}>{item.name}</div>
              <div className={`text-xs text-gray-500`}>{item.description}</div>
            </div>
            
            {hasSubmenu && (
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            )}
          </button>
        </div>
        
        {hasSubmenu && isExpanded && (
          <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.submenu!.map((subItem) => renderNavigationItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderActivePage = () => {
    try {
      switch (activePage) {
        case 'executive':
          return <ExecutiveDashboardEnhanced onNavigate={(page) => {
            const targetPage = page as ActivePage;
            handleNavigation(targetPage);
          }} />;
        case 'roadmap':
          return <RoadmapDashboard />;
        case 'keuangan':
          return <KeuanganEkspor />;
        case 'lc':
          return <LCManagement />;
        case 'invoice':
          return <InvoiceManagement />;
        case 'payment':
          return <PaymentTermsManagement />;
        case 'catatan':
          return <CatatanPenting />;
        case 'documents':
          return <DocumentCenter />;
        case 'buyers':
          return <BuyerDatabase />;
        case 'kalkulator':
          return <KalkulatorHarga />;
        case 'kalkulator-kontainer':
          return <KalkulatorKontainer />;
        case 'user-management':
          return <UserManagement />;
        default:
          return <ExecutiveDashboardEnhanced />;
      }
    } catch (error) {
      console.error('❌ Error rendering page:', activePage, error);
      return <div className="p-8 text-center"><p className="text-red-600">Error loading page: {activePage}</p></div>;
    }
  };

  return (
    <DataSyncProvider>
      <div className={`min-h-screen bg-gray-50 ${isAutoHideMode ? 'relative' : 'flex'}`}>
        {/* Mobile sidebar backdrop */}
        {(sidebarOpen || (isAutoHideMode && showSidebar)) && (
          <div 
            className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
            onClick={() => {
              if (isAutoHideMode) {
                setShowSidebar(false);
              } else {
                setSidebarOpen(false);
              }
            }}
          />
        )}
        
        {/* Sidebar */}
        <div 
          className={`
            bg-white shadow-lg transform transition-all duration-300 ease-in-out w-64
            fixed lg:fixed h-screen
            ${isAutoHideMode ? 'auto-hide-sidebar' : ''}
            ${isAutoHideMode 
              ? (showSidebar ? 'left-0 top-0 z-50 translate-x-0' : 'left-0 top-0 z-50 -translate-x-full') 
              : 'lg:left-0 lg:top-0'
            }
            ${!isAutoHideMode && sidebarOpen ? 'left-0 top-0 z-50 translate-x-0' : ''}
            ${!isAutoHideMode && !sidebarOpen ? 'left-0 top-0 z-50 -translate-x-full lg:translate-x-0' : ''}
          `}
          onClick={handleSidebarClick}
          onMouseEnter={() => isAutoHideMode && setShowSidebar(true)}
          onMouseLeave={(e) => {
            if (isAutoHideMode) {
              setTimeout(() => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right || 
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                  setShowSidebar(false);
                }
              }, 100);
            }
          }}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="MPG Export Logo" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">MPG Export</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={toggleAutoHideMode}
                title={isAutoHideMode ? 'Disable auto-hide' : 'Enable auto-hide'}
              >
                <Bell className={`w-4 h-4 ${isAutoHideMode ? 'text-blue-500' : 'text-gray-400'}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
              <nav className="p-4 pb-6">
                <div className="space-y-2">
                  {getFilteredNavigation().map((item) => renderNavigationItem(item))}
                  
                  {/* Logout Button as regular menu item - no divider */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 mr-3 bg-red-500 rounded-xl flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105">
                      <LogOut className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-700">Logout</div>
                      <div className="text-xs text-gray-500">Keluar dari sistem</div>
                    </div>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`
          transition-all duration-300 ease-in-out relative min-h-screen
          ${isAutoHideMode ? 'w-full' : 'flex-1'}
        `}>
          {/* Mobile Menu Button */}
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-40 rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
            onClick={() => {
              if (isAutoHideMode) {
                setShowSidebar(!showSidebar);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Page content */}
          <main className={`
            flex-1 min-h-screen
            ${isAutoHideMode ? 'w-full' : ''}
            ${!isAutoHideMode ? 'lg:ml-64' : ''}
            ${['executive', 'roadmap', 'keuangan'].includes(activePage) 
              ? 'p-0 lg:p-0' 
              : isAutoHideMode 
                ? 'p-4 pt-16 lg:pt-4' 
                : 'p-4 pt-16 lg:pt-4'
            }
          `}>
            <div className={`
              animate-fade-in h-full
              ${['executive', 'roadmap', 'keuangan'].includes(activePage) 
                ? 'min-h-screen' 
                : ''
              }
            `} key={activePage}>
              {renderActivePage()}
            </div>
          </main>
        </div>
      </div>
    </DataSyncProvider>
  );
};

// App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;