import React, { useState, useEffect } from 'react';
import { DashboardScreen } from './components/DashboardScreen';
import { POSScreen } from './components/POSScreen';
import { ReceiptVerificationScreen } from './components/ReceiptVerificationScreen';
import { CashBookScreen } from './components/CashBookScreen';
import { AcademicScreen } from './components/AcademicScreen';
import { PayrollScreen } from './components/PayrollScreen';
import { TeacherMobileScreen } from './components/TeacherMobileScreen';
import { CrmScreen } from './components/CrmScreen';
import { AdminScreen } from './components/AdminScreen';
import { LoginScreen } from './components/LoginScreen';
import {
  BarChart3,
  ShoppingCart,
  FileCheck,
  GraduationCap,
  DollarSign,
  Smartphone,
  Users,
  ShieldCheck,
  LogOut,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useBranding } from './context/BrandingContext';

export function App() {
  const { branding, hasModuleAccess } = useBranding();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ADMIN' | 'POS' | 'RECEIPTS' | 'CASHBOOK' | 'ACADEMIC' | 'PAYROLL' | 'MOBILE' | 'CRM'>('DASHBOARD');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ems_sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      localStorage.setItem('ems_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  const navTabs = [
    {
      key: 'DASHBOARD' as const,
      label: branding.moduleNames.DASHBOARD || 'Dashboard',
      icon: BarChart3,
      colorClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold',
      inactiveColorClass: 'text-indigo-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'ADMIN' as const,
      label: branding.moduleNames.ADMIN || 'Quản Trị',
      icon: ShieldCheck,
      colorClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold',
      inactiveColorClass: 'text-purple-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'POS' as const,
      label: branding.moduleNames.POS || 'Thu Ngân POS',
      icon: ShoppingCart,
      colorClass: 'bg-blue-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'RECEIPTS' as const,
      label: branding.moduleNames.RECEIPTS || 'Duyệt Chứng Từ',
      icon: FileCheck,
      colorClass: 'bg-emerald-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'CASHBOOK' as const,
      label: branding.moduleNames.CASHBOOK || 'Sổ Quỹ Thu Chi',
      icon: Wallet,
      colorClass: 'bg-teal-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'ACADEMIC' as const,
      label: branding.moduleNames.ACADEMIC || 'Giáo Vụ',
      icon: GraduationCap,
      colorClass: 'bg-indigo-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'PAYROLL' as const,
      label: branding.moduleNames.PAYROLL || 'Bảng Lương',
      icon: DollarSign,
      colorClass: 'bg-amber-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'MOBILE' as const,
      label: branding.moduleNames.MOBILE || 'App Giáo Viên',
      icon: Smartphone,
      colorClass: 'bg-violet-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
    {
      key: 'CRM' as const,
      label: branding.moduleNames.CRM || 'Tuyển Sinh CRM',
      icon: Users,
      colorClass: 'bg-sky-600 text-white font-semibold',
      inactiveColorClass: 'text-slate-300 hover:text-white hover:bg-slate-800/70',
    },
  ];

  // List of tabs this user is permitted to see
  const allowedTabs = navTabs.filter((tab) => hasModuleAccess(currentUser, tab.key));

  // Check saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ems_token');
    const savedUser = localStorage.getItem('ems_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (hasModuleAccess(parsed, 'DASHBOARD')) {
          setActiveTab('DASHBOARD');
        } else if (parsed.role === 'ADMIN') {
          setActiveTab('ADMIN');
        }
      } catch (e) {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
      }
    }
  }, []);

  // Guard: If current activeTab is not permitted, auto-switch to first allowed tab
  useEffect(() => {
    if (currentUser && !hasModuleAccess(currentUser, activeTab)) {
      const firstAllowed = navTabs.find((t) => hasModuleAccess(currentUser, t.key));
      if (firstAllowed) {
        setActiveTab(firstAllowed.key);
      }
    }
  }, [currentUser, activeTab, hasModuleAccess]);

  // Cross-module Navigation Event Listener for frictionless workflow transitions
  useEffect(() => {
    const handleCrossModuleNav = (e: any) => {
      const targetTab = e.detail?.tab;
      if (targetTab && (!currentUser || hasModuleAccess(currentUser, targetTab))) {
        setActiveTab(targetTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('ems_navigate_tab', handleCrossModuleNav);
    return () => window.removeEventListener('ems_navigate_tab', handleCrossModuleNav);
  }, [currentUser, hasModuleAccess]);

  const handleLoginSuccess = (user: any, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    if (hasModuleAccess(user, 'DASHBOARD')) {
      setActiveTab('DASHBOARD');
    } else if (user.role === 'ADMIN') {
      setActiveTab('ADMIN');
    } else if (user.role === 'TEACHER') {
      setActiveTab('MOBILE');
    } else if (user.role === 'ACCOUNTANT') {
      setActiveTab('RECEIPTS');
    } else if (user.role === 'ACADEMIC_AFFAIRS') {
      setActiveTab('ACADEMIC');
    } else {
      setActiveTab('POS');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setCurrentUser(null);
    setToken(null);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const roleNameMap: Record<string, string> = {
    ADMIN: 'Quản Trị Viên',
    ACCOUNTANT: 'Kế Toán',
    ACADEMIC_AFFAIRS: 'Giáo Vụ',
    TEACHER: 'Giáo Viên',
    SALE: 'Tư Vấn Tuyển Sinh',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-4 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            {branding.systemLogoUrl ? (
              <img
                src={branding.systemLogoUrl}
                alt={branding.systemName}
                className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${branding.systemPrimaryColor}, ${branding.systemAccentColor})`,
                }}
              >
                {branding.systemLogoText || 'EMS'}
              </div>
            )}
            <span className="font-bold text-sm text-white truncate max-w-[150px]">
              {branding.systemName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar (Desktop Fixed/Sticky + Mobile Slide-out Drawer) */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 lg:z-30 bg-slate-900 border-r border-slate-800 text-white flex flex-col transition-all duration-300 shadow-2xl lg:shadow-none shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72`}
      >
        {/* Sidebar Header: Logo & Brand */}
        <div className="h-16 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {branding.systemLogoUrl ? (
              <div className="w-9 h-9 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img
                  src={branding.systemLogoUrl}
                  alt={branding.systemName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-900/40 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${branding.systemPrimaryColor}, ${branding.systemAccentColor})`,
                }}
              >
                {branding.systemLogoText || 'EMS'}
              </div>
            )}
            {(!isSidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{branding.systemName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/20 shrink-0">
                    v2.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {branding.systemSlogan}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {(!isSidebarCollapsed || mobileMenuOpen) && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Danh Mục Chức Năng
            </div>
          )}

          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setMobileMenuOpen(false);
                }}
                title={tab.label}
                style={{
                  backgroundColor: isActive ? branding.systemPrimaryColor : undefined,
                }}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed && !mobileMenuOpen
                    ? 'justify-center p-3'
                    : 'gap-3 px-3.5 py-2.5 text-xs font-semibold'
                } ${
                  isActive
                    ? 'text-white shadow-lg shadow-indigo-950/40 ring-1 ring-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
                }`}
              >
                <Icon className={`${isSidebarCollapsed && !mobileMenuOpen ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
                {(!isSidebarCollapsed || mobileMenuOpen) && (
                  <span className="truncate">{tab.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout at Bottom */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
          {(!isSidebarCollapsed || mobileMenuOpen) ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium truncate">
                    {roleNameMap[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${currentUser.fullName} (${roleNameMap[currentUser.role] || currentUser.role})`}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm cursor-default"
              >
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 min-h-screen">
        {/* Screen Content */}
        <main className="flex-1">
          {activeTab === 'DASHBOARD' && <DashboardScreen />}
          {activeTab === 'ADMIN' && <AdminScreen />}
          {activeTab === 'POS' && <POSScreen />}
          {activeTab === 'RECEIPTS' && <ReceiptVerificationScreen />}
          {activeTab === 'CASHBOOK' && <CashBookScreen />}
          {activeTab === 'ACADEMIC' && <AcademicScreen />}
          {activeTab === 'PAYROLL' && <PayrollScreen />}
          {activeTab === 'MOBILE' && <TeacherMobileScreen />}
          {activeTab === 'CRM' && <CrmScreen />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
          {branding.systemName} • {branding.systemSlogan} • Đang đăng nhập: {currentUser.fullName} ({roleNameMap[currentUser.role] || currentUser.role})
        </footer>
      </div>
    </div>
  );
}

export default App;
