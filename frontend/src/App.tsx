import React, { useState, useEffect } from 'react';
import { POSScreen } from './components/POSScreen';
import { ReceiptVerificationScreen } from './components/ReceiptVerificationScreen';
import { AcademicScreen } from './components/AcademicScreen';
import { PayrollScreen } from './components/PayrollScreen';
import { TeacherMobileScreen } from './components/TeacherMobileScreen';
import { CrmScreen } from './components/CrmScreen';
import { LoginScreen } from './components/LoginScreen';
import { ShoppingCart, FileCheck, GraduationCap, DollarSign, Smartphone, Users, LogOut, UserCheck } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'POS' | 'RECEIPTS' | 'ACADEMIC' | 'PAYROLL' | 'MOBILE' | 'CRM'>('POS');

  // Check saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ems_token');
    const savedUser = localStorage.getItem('ems_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user: any, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    if (user.role === 'TEACHER') {
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
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-lg">
              SBR
            </div>
            <div>
              <div className="font-bold text-base tracking-wide flex items-center gap-1.5">
                EMS ĐÀO TẠO & NỘI BỘ
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-semibold border border-blue-400/30">
                  SRS v2.0
                </span>
              </div>
              <div className="text-xs text-slate-400">Toán Trí Tuệ & Kỹ Năng Sống</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('POS')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'POS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Thu Ngân</span>
            </button>

            <button
              onClick={() => setActiveTab('RECEIPTS')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'RECEIPTS'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Duyệt Chứng Từ & Gạch Nợ</span>
            </button>

            <button
              onClick={() => setActiveTab('ACADEMIC')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ACADEMIC'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Giáo Vụ & 24 Buổi</span>
            </button>

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'PAYROLL'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Bảng Lương KPI</span>
            </button>

            <button
              onClick={() => setActiveTab('MOBILE')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'MOBILE'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>App GV & Zalo</span>
            </button>

            <button
              onClick={() => setActiveTab('CRM')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'CRM'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>CRM Leads</span>
            </button>

            {/* User Profile Badge & Logout */}
            <div className="pl-2 ml-2 border-l border-slate-700 flex items-center gap-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">{currentUser.fullName}</span>
                <span className="text-[10px] text-blue-400 font-medium">{roleNameMap[currentUser.role] || currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        {activeTab === 'POS' && <POSScreen />}
        {activeTab === 'RECEIPTS' && <ReceiptVerificationScreen />}
        {activeTab === 'ACADEMIC' && <AcademicScreen />}
        {activeTab === 'PAYROLL' && <PayrollScreen />}
        {activeTab === 'MOBILE' && <TeacherMobileScreen />}
        {activeTab === 'CRM' && <CrmScreen />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Hệ Thống Quản Lý Nội Bộ & Đào Tạo Trung Tâm Toán Trí Tuệ và Kỹ Năng Sống (ERP & CRM v2.0) • Đang đăng nhập: {currentUser.fullName} ({roleNameMap[currentUser.role] || currentUser.role})
      </footer>
    </div>
  );
}

export default App;
