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
  const { branding } = useBranding();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'POS' | 'RECEIPTS' | 'ACADEMIC' | 'PAYROLL' | 'MOBILE' | 'CRM'>('POS');

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

  const isAdmin = currentUser.role === 'ADMIN';

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

          {/* Navigation Tabs - Balanced & Modern Pill Design */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none max-w-full">
            {/* Admin Tab */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'ADMIN'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-purple-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quản Trị</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('POS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'POS'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Thu Ngân POS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RECEIPTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'RECEIPTS'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Duyệt Chứng Từ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACADEMIC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'ACADEMIC'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Giáo Vụ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PAYROLL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'PAYROLL'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bảng Lương</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MOBILE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'MOBILE'
                  ? 'bg-violet-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Giáo Viên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CRM')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'CRM'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tuyển Sinh CRM</span>
            </button>
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
