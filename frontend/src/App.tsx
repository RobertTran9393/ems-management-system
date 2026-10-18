import React, { useState, useEffect } from 'react';
import { POSScreen } from './components/POSScreen';
import { ReceiptVerificationScreen } from './components/ReceiptVerificationScreen';
import { AcademicScreen } from './components/AcademicScreen';
import { PayrollScreen } from './components/PayrollScreen';
import { TeacherMobileScreen } from './components/TeacherMobileScreen';
import { CrmScreen } from './components/CrmScreen';
import { AdminScreen } from './components/AdminScreen';
import { LoginScreen } from './components/LoginScreen';
import { ShoppingCart, FileCheck, GraduationCap, DollarSign, Smartphone, Users, ShieldCheck, LogOut } from 'lucide-react';
import { useBranding } from './context/BrandingContext';

export function App() {
  const { branding, hasModuleAccess } = useBranding();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'POS' | 'RECEIPTS' | 'ACADEMIC' | 'PAYROLL' | 'MOBILE' | 'CRM'>('POS');

  const navTabs = [
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
        if (parsed.role === 'ADMIN') {
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

  const handleLoginSuccess = (user: any, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    if (user.role === 'ADMIN') {
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Modern Balanced Top Navbar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            {branding.systemLogoUrl ? (
              <div className="w-9 h-9 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src={branding.systemLogoUrl}
                  alt={branding.systemName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-900/30"
                style={{
                  background: `linear-gradient(135deg, ${branding.systemPrimaryColor}, ${branding.systemAccentColor})`,
                }}
              >
                {branding.systemLogoText || 'EMS'}
              </div>
            )}
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>{branding.systemName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/20">
                  v2.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden xl:block leading-tight">
                {branding.systemSlogan}
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Filtered by Permissions & Custom Renamed */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none max-w-full">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                    isActive ? `${tab.colorClass} shadow-sm` : tab.inactiveColorClass
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 shrink-0 pl-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">
                {roleNameMap[currentUser.role] || currentUser.role}
              </span>
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
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        {activeTab === 'ADMIN' && <AdminScreen />}
        {activeTab === 'POS' && <POSScreen />}
        {activeTab === 'RECEIPTS' && <ReceiptVerificationScreen />}
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
  );
}

export default App;
