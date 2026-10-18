import React, { useState } from 'react';
import { POSScreen } from './components/POSScreen';
import { ReceiptVerificationScreen } from './components/ReceiptVerificationScreen';
import { AcademicScreen } from './components/AcademicScreen';
import { PayrollScreen } from './components/PayrollScreen';
import { TeacherMobileScreen } from './components/TeacherMobileScreen';
import { CrmScreen } from './components/CrmScreen';
import { ShoppingCart, FileCheck, GraduationCap, DollarSign, Smartphone, Users } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'POS' | 'RECEIPTS' | 'ACADEMIC' | 'PAYROLL' | 'MOBILE' | 'CRM'>('POS');

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
          <nav className="flex space-x-1 sm:space-x-2">
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
        Hệ Thống Quản Lý Nội Bộ & Đào Tạo Trung Tâm Toán Trí Tuệ và Kỹ Năng Sống (ERP & CRM v2.0) • Chạy Trực Tiếp Localhost
      </footer>
    </div>
  );
}

export default App;
