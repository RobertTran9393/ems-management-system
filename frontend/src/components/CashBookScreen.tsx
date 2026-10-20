import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building2,
  Calendar,
  Filter,
  Search,
  PlusCircle,
  MinusCircle,
  FileText,
  Printer,
  RefreshCw,
  CreditCard,
  Banknote,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  Clock,
  Trash2,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { PrintableFundVoucherModal, type FundVoucherData } from './PrintableFundVoucherModal';

export const CashBookScreen: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'today' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Voucher Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'RECEIPT' | 'PAYMENT' | 'ADVANCE'>('PAYMENT');
  const [savingVoucher, setSavingVoucher] = useState<boolean>(false);

  // Form State
  const [formCategory, setFormCategory] = useState<string>('CHI_KHAC');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formMethod, setFormMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [formBranchId, setFormBranchId] = useState<string>('');
  const [formRecipientName, setFormRecipientName] = useState<string>('');
  const [formRecipientPhone, setFormRecipientPhone] = useState<string>('');
  const [formUserId, setFormUserId] = useState<string>('');
  const [formTargetMonth, setFormTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [formTargetYear, setFormTargetYear] = useState<number>(new Date().getFullYear());
  const [formBankAccountInfo, setFormBankAccountInfo] = useState<string>('');
  const [formReferenceRef, setFormReferenceRef] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTransactionDate, setFormTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formApprovedBy, setFormApprovedBy] = useState<string>('Kế toán trưởng');

  // Printable Modal State
  const [activePrintVoucher, setActivePrintVoucher] = useState<FundVoucherData | null>(null);

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('ems_user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFundData();
  }, [
    selectedBranchId,
    filterPeriod,
    filterMonth,
    filterYear,
    customStartDate,
    customEndDate,
    filterType,
    filterCategory,
    filterMethod,
  ]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('ems_token');
      const [resB, resS] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/branches`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/dashboard/staff-targets`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }).then((r) => r.json()),
      ]);

      if (resB.data) {
        setBranches(resB.data);
        if (resB.data.length > 0 && !formBranchId) {
          setFormBranchId(resB.data[0].id);
        }
      }
      if (resS.data?.staffTargets) {
        setStaffList(resS.data.staffTargets);
      }
    } catch (e) {
      console.error('Initial data fetch error:', e);
    }
  };

  const fetchFundData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ems_token');
      const params = new URLSearchParams();

      if (selectedBranchId && selectedBranchId !== 'all') {
        params.append('branchId', selectedBranchId);
      }

      if (filterPeriod === 'month') {
        params.append('month', String(filterMonth));
        params.append('year', String(filterYear));
      } else if (filterPeriod === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.append('startDate', todayStr + 'T00:00:00.000Z');
        params.append('endDate', todayStr + 'T23:59:59.999Z');
      } else if (filterPeriod === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate + 'T00:00:00.000Z');
        if (customEndDate) params.append('endDate', customEndDate + 'T23:59:59.999Z');
      }

      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterMethod !== 'all') params.append('paymentMethod', filterMethod);
      if (searchQuery) params.append('search', searchQuery);

      const [resSummary, resTx] = await Promise.all([
        fetch(`${API_BASE_URL}/api/fund/summary?${params.toString()}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/fund/transactions?${params.toString()}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }).then((r) => r.json()),
      ]);

      if (resSummary.success) setSummary(resSummary.data);
      if (resTx.success) setTransactions(resTx.data);
    } catch (e) {
      console.error('Fetch fund data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (mode: 'RECEIPT' | 'PAYMENT' | 'ADVANCE') => {
    setModalMode(mode);
    setFormAmount(0);
    setFormDescription('');
    setFormBankAccountInfo('');
    setFormReferenceRef('');
    setFormTransactionDate(new Date().toISOString().split('T')[0]);
    setFormApprovedBy(currentUser?.fullName || 'Kế toán trưởng');
    setFormBranchId(selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '');

    if (mode === 'RECEIPT') {
      setFormCategory('THU_KHAC');
      setFormRecipientName('');
      setFormRecipientPhone('');
      setFormUserId('');
    } else if (mode === 'ADVANCE') {
      setFormCategory('TAM_UNG_LUONG');
      setFormTargetMonth(filterMonth);
      setFormTargetYear(filterYear);
      if (staffList.length > 0) {
        setFormUserId(staffList[0].userId);
        setFormRecipientName(staffList[0].fullName);
        setFormRecipientPhone(staffList[0].phone || '');
      }
    } else {
      setFormCategory('VAN_PHONG_PHAM');
      setFormRecipientName('');
      setFormRecipientPhone('');
      setFormUserId('');
    }

    setShowCreateModal(true);
  };

  const handleStaffChange = (userId: string) => {
    setFormUserId(userId);
    const found = staffList.find((s) => s.userId === userId);
    if (found) {
      setFormRecipientName(found.fullName);
      setFormRecipientPhone(found.phone || '');
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || formAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }
    if (!formRecipientName.trim()) {
      alert('Vui lòng nhập tên người nộp / nhận tiền');
      return;
    }
    if (!formDescription.trim()) {
      alert('Vui lòng nhập lý do / nội dung thu chi');
      return;
    }

    try {
      setSavingVoucher(true);
      const token = localStorage.getItem('ems_token');
      const voucherType = modalMode === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT';

      const res = await fetch(`${API_BASE_URL}/api/fund/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: voucherType,
          category: formCategory,
          amount: formAmount,
          paymentMethod: formMethod,
          branchId: formBranchId || branches[0]?.id,
          recipientName: formRecipientName,
          recipientPhone: formRecipientPhone,
          userId: formUserId || undefined,
          targetMonth: formCategory === 'TAM_UNG_LUONG' ? formTargetMonth : undefined,
          targetYear: formCategory === 'TAM_UNG_LUONG' ? formTargetYear : undefined,
          transactionDate: formTransactionDate,
          bankAccountInfo: formMethod === 'BANK_TRANSFER' ? formBankAccountInfo : undefined,
          referenceRef: formReferenceRef,
          description: formDescription,
          createdById: currentUser?.id,
          approvedBy: formApprovedBy,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        fetchFundData();
        // Prompt to print voucher immediately
        setActivePrintVoucher({
          id: json.data.id,
          code: json.data.code,
          type: json.data.type,
          category: json.data.category,
          amount: Number(json.data.amount),
          paymentMethod: json.data.paymentMethod,
          recipientName: json.data.recipientName,
          recipientPhone: json.data.recipientPhone,
          branchName: branches.find((b) => b.id === json.data.branchId)?.name,
          transactionDate: json.data.transactionDate,
          bankAccountInfo: json.data.bankAccountInfo,
          referenceRef: json.data.referenceRef,
          description: json.data.description,
          approvedBy: json.data.approvedBy,
          creatorName: currentUser?.fullName,
          targetMonth: json.data.targetMonth,
          targetYear: json.data.targetYear,
        });
      } else {
        alert(json.message || 'Lỗi khi tạo chứng từ thu chi');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi mạng khi lưu chứng từ');
    } finally {
      setSavingVoucher(false);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy/xóa chứng từ ${code} không?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('ems_token');
      const res = await fetch(`${API_BASE_URL}/api/fund/transactions/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        fetchFundData();
      } else {
        alert(json.message || 'Lỗi khi xóa chứng từ');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối máy chủ');
    }
  };

  const categoryLabels: Record<string, { label: string; color: string }> = {
    TAM_UNG_LUONG: { label: 'Tạm Ứng Lương', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    CHI_LUONG: { label: 'Chi Trả Lương', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    THUE_MAT_BANG: { label: 'Thuê Mặt Bằng', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    DIEN_NUOC_NET: { label: 'Điện, Nước, Net', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    VAN_PHONG_PHAM: { label: 'Văn Phòng Phẩm', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    MARKETING_QUANG_CAO: { label: 'Marketing & QC', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    SUA_CHUA_BAO_TRI: { label: 'Bảo Trì CSVC', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    HOAT_DONG_SU_KIEN: { label: 'Sự Kiện & Thi Đấu', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    THU_THANH_LY: { label: 'Thu Thanh Lý', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    THU_HOAN_UNG: { label: 'Hoàn Tạm Ứng', color: 'bg-green-100 text-green-800 border-green-200' },
    THU_KHAC: { label: 'Thu Khác', color: 'bg-lime-100 text-lime-800 border-lime-200' },
    CHI_KHAC: { label: 'Chi Khác', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Title Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Sổ Quỹ & Thu Chi Khác
                {loading && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
              </h1>
              <p className="text-xs text-slate-500">
                Theo dõi quỹ tiền mặt, tài khoản ngân hàng, tạm ứng lương nhân viên và các khoản chi phí vận hành
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Thu / Chi / Tạm ứng */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenCreateModal('RECEIPT')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lập Phiếu Thu</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal('PAYMENT')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer transition"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Lập Phiếu Chi</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal('ADVANCE')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition"
          >
            <DollarSign className="w-4 h-4" />
            <span>Tạm Ứng Lương</span>
          </button>
        </div>
      </div>

      {/* 2. Live Fund Balances & Flow (3 Hero Balance Cards + 2 Flow Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Quỹ Tiền Mặt */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Quỹ Tiền Mặt (Tại Quầy)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tracking-tight">
            {Number(summary?.liveCashBalance || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-semibold text-slate-500">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Tiền mặt két trung tâm</div>
        </div>

        {/* Card 2: Quỹ Tài Khoản Ngân Hàng */}
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Tài Khoản Ngân Hàng
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tracking-tight">
            {Number(summary?.liveBankBalance || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-semibold text-slate-500">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Chuyển khoản VietQR & Bank</div>
        </div>

        {/* Card 3: Tổng Tồn Quỹ Hiện Tại */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-white rounded-2xl p-4 border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Tổng Tồn Quỹ Hiện Tại
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-indigo-700 tracking-tight">
            {Number(summary?.liveTotalBalance || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-semibold text-slate-500">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-semibold">Tiền mặt + Ngân hàng</div>
        </div>

        {/* Card 4: Tổng Thu Trong Kỳ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              Tổng Thu Kỳ Này
            </span>
          </div>
          <div className="mt-2 text-lg font-black text-emerald-600">
            +{Number(summary?.period?.totalReceipts || 0).toLocaleString('vi-VN')} đ
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            TM: {Number(summary?.period?.receiptsCash || 0).toLocaleString('vi-VN')} đ • CK:{' '}
            {Number(summary?.period?.receiptsBank || 0).toLocaleString('vi-VN')} đ
          </div>
        </div>

        {/* Card 5: Tổng Chi Trong Kỳ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Tổng Chi Kỳ Này
            </span>
          </div>
          <div className="mt-2 text-lg font-black text-rose-600">
            -{Number(summary?.period?.totalPayments || 0).toLocaleString('vi-VN')} đ
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            TM: {Number(summary?.period?.paymentsCash || 0).toLocaleString('vi-VN')} đ • CK:{' '}
            {Number(summary?.period?.paymentsBank || 0).toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cơ Sở / Trung Tâm:</label>
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none w-full cursor-pointer"
              >
                <option value="all">🏢 Tất Cả Trung Tâm</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kỳ Thời Gian:</label>
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 outline-none w-full cursor-pointer"
              >
                <option value="month">Theo Tháng</option>
                <option value="today">Hôm Nay</option>
                <option value="custom">Tùy Chọn Ngày</option>
              </select>
            </div>
          </div>

          {/* Month & Year Select if period = month */}
          {filterPeriod === 'month' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tháng:</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 bg-slate-50 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Năm:</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 bg-slate-50 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Custom Date Pickers */}
          {filterPeriod === 'custom' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Từ Ngày:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Đến Ngày:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 outline-none"
                />
              </div>
            </>
          )}

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại Phiếu:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 bg-slate-50 outline-none"
            >
              <option value="all">Tất Cả (Thu & Chi)</option>
              <option value="RECEIPT">🟢 Phiếu Thu</option>
              <option value="PAYMENT">🔴 Phiếu Chi</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Hình Thức:</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 bg-slate-50 outline-none"
            >
              <option value="all">Tất Cả Hình Thức</option>
              <option value="CASH">💵 Tiền Mặt</option>
              <option value="BANK_TRANSFER">🏦 Chuyển Khoản Ngân Hàng</option>
            </select>
          </div>
        </div>

        {/* Search & Category row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã phiếu, tên người nhận/nộp, nội dung..."
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none bg-slate-50 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Phân loại chi phí:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-50 outline-none cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="TAM_UNG_LUONG">🟣 Tạm Ứng Lương</option>
              <option value="CHI_LUONG">🔵 Chi Trả Lương</option>
              <option value="THUE_MAT_BANG">🟠 Thuê Mặt Bằng</option>
              <option value="DIEN_NUOC_NET">🌐 Điện, Nước, Internet</option>
              <option value="VAN_PHONG_PHAM">🟢 Văn Phòng Phẩm</option>
              <option value="MARKETING_QUANG_CAO">📢 Marketing & QC</option>
              <option value="SUA_CHUA_BAO_TRI">🔧 Bảo Trì CSVC</option>
              <option value="HOAT_DONG_SU_KIEN">🏆 Sự Kiện & Thi Đấu</option>
              <option value="THU_THANH_LY">♻️ Thu Thanh Lý</option>
              <option value="THU_HOAN_UNG">↩️ Hoàn Tạm Ứng</option>
              <option value="THU_KHAC">➕ Thu Khác</option>
              <option value="CHI_KHAC">➖ Chi Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Voucher Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Nhật Ký Sổ Quỹ Thu Chi ({transactions.length} chứng từ)
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchFundData}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Mã Chứng Từ</th>
                <th className="py-2.5 px-3">Ngày Lập</th>
                <th className="py-2.5 px-3">Loại & Danh Mục</th>
                <th className="py-2.5 px-3">Người Nộp / Nhận</th>
                <th className="py-2.5 px-3">Nội Dung Chi Tiết</th>
                <th className="py-2.5 px-3">Hình Thức</th>
                <th className="py-2.5 px-3 text-right">Số Tiền</th>
                <th className="py-2.5 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isReceipt = tx.type === 'RECEIPT';
                const catMeta = categoryLabels[tx.category] || {
                  label: tx.category,
                  color: 'bg-slate-100 text-slate-700',
                };

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900">{tx.code}</div>
                      <div className="text-[10px] text-slate-400">
                        {tx.branch?.name || 'Toàn hệ thống'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div>
                        {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.transactionDate).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isReceipt
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isReceipt ? 'Phiếu Thu' : 'Phiếu Chi'}
                        </span>
                        <div
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${catMeta.color} block w-fit`}
                        >
                          {catMeta.label}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{tx.recipientName}</div>
                      {tx.recipientPhone && (
                        <div className="text-[10px] text-slate-400">{tx.recipientPhone}</div>
                      )}
                      {tx.category === 'TAM_UNG_LUONG' && tx.targetMonth && (
                        <div className="text-[10px] font-bold text-purple-700">
                          Tạm ứng Lương T{tx.targetMonth}/{tx.targetYear}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs text-slate-700">
                      <p className="line-clamp-2">{tx.description}</p>
                      {tx.bankAccountInfo && (
                        <span className="text-[10px] text-blue-600 font-mono block">
                          TK: {tx.bankAccountInfo}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                          tx.paymentMethod === 'CASH'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {tx.paymentMethod === 'CASH' ? 'Tiền Mặt' : 'Chuyển Khoản'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-sm font-black ${
                          isReceipt ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isReceipt ? '+' : '-'}
                        {Number(tx.amount).toLocaleString('vi-VN')} đ
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePrintVoucher({
                              id: tx.id,
                              code: tx.code,
                              type: tx.type,
                              category: tx.category,
                              amount: Number(tx.amount),
                              paymentMethod: tx.paymentMethod,
                              recipientName: tx.recipientName,
                              recipientPhone: tx.recipientPhone,
                              branchName: tx.branch?.name,
                              transactionDate: tx.transactionDate,
                              bankAccountInfo: tx.bankAccountInfo,
                              referenceRef: tx.referenceRef,
                              description: tx.description,
                              approvedBy: tx.approvedBy,
                              creatorName: tx.creator?.fullName,
                              targetMonth: tx.targetMonth,
                              targetYear: tx.targetYear,
                            })
                          }
                          title="In chứng từ"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(tx.id, tx.code)}
                          title="Hủy chứng từ"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 italic">
                    Chưa có chứng từ thu chi nào trong kỳ đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE VOUCHER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm ${
                    modalMode === 'RECEIPT'
                      ? 'bg-emerald-600'
                      : modalMode === 'ADVANCE'
                      ? 'bg-purple-600'
                      : 'bg-rose-600'
                  }`}
                >
                  {modalMode === 'RECEIPT' ? (
                    <PlusCircle className="w-5 h-5" />
                  ) : modalMode === 'ADVANCE' ? (
                    <DollarSign className="w-5 h-5" />
                  ) : (
                    <MinusCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {modalMode === 'RECEIPT'
                      ? 'Lập Phiếu Thu Khác'
                      : modalMode === 'ADVANCE'
                      ? 'Lập Phiếu Tạm Ứng Lương'
                      : 'Lập Phiếu Chi Khác'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận vào sổ quỹ và tự động cập nhật số dư tiền mặt / ngân hàng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-4 text-xs">
              {/* Branch Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cơ sở / Chi nhánh áp dụng:
                </label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-slate-50"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector if not ADVANCE */}
              {modalMode === 'PAYMENT' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Danh mục chi phí:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-slate-50"
                  >
                    <option value="VAN_PHONG_PHAM">🟢 Văn Phòng Phẩm & Giáo Trình</option>
                    <option value="THUE_MAT_BANG">🟠 Thuê Mặt Bằng / Phòng Học</option>
                    <option value="DIEN_NUOC_NET">🌐 Điện, Nước, Rác, Internet</option>
                    <option value="MARKETING_QUANG_CAO">📢 Marketing, Facebook Ads, Tờ Rơi</option>
                    <option value="SUA_CHUA_BAO_TRI">🔧 Sửa Chữa, Bảo Trì Điều Hòa, CSVC</option>
                    <option value="HOAT_DONG_SU_KIEN">🏆 Tổ Chức Khai Giảng, Dã Ngoại, Cuộc Thi</option>
                    <option value="CHI_KHAC">➖ Chi Khác</option>
                  </select>
                </div>
              )}

              {modalMode === 'RECEIPT' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Danh mục thu tiền:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-slate-50"
                  >
                    <option value="THU_THANH_LY">♻️ Thu Thanh Lý Tài Sản / Đồ Dùng</option>
                    <option value="THU_HOAN_UNG">↩️ Thu Hoàn Tạm Ứng Nhân Viên</option>
                    <option value="THU_KHAC">➕ Thu Khác</option>
                  </select>
                </div>
              )}

              {/* Salary Advance Specific Controls */}
              {modalMode === 'ADVANCE' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Cấu hình Tạm Ứng Lương Nhân Viên:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-purple-800 mb-0.5">
                        Chọn Nhân Viên:
                      </label>
                      <select
                        value={formUserId}
                        onChange={(e) => handleStaffChange(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none"
                        required
                      >
                        {staffList.map((s) => (
                          <option key={s.userId} value={s.userId}>
                            {s.fullName} ({s.role === 'TEACHER' ? 'Giáo viên' : s.role}) -{' '}
                            {s.branchName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-purple-800 mb-0.5">
                        Tháng Lương Trừ Ứng:
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={formTargetMonth}
                          onChange={(e) => setFormTargetMonth(Number(e.target.value))}
                          className="w-1/2 bg-white border border-purple-200 rounded-xl px-1.5 py-1.5 font-bold text-slate-800 outline-none"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                              T{m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={formTargetYear}
                          onChange={(e) => setFormTargetYear(Number(e.target.value))}
                          className="w-1/2 bg-white border border-purple-200 rounded-xl px-1 py-1.5 font-bold text-slate-800 outline-none"
                        >
                          {[2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-purple-700 leading-relaxed">
                    💡 <strong>Cơ chế tự động:</strong> Khi Ban Quản Trị tính bảng lương tháng{' '}
                    <strong>
                      {formTargetMonth}/{formTargetYear}
                    </strong>
                    , hệ thống sẽ tự động trừ số tiền tạm ứng này vào mục giảm trừ của nhân viên.
                  </div>
                </div>
              )}

              {/* Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số Tiền (VNĐ):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="10000"
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    placeholder="Ví dụ: 2000000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {Number(formAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hình Thức Thu / Chi:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormMethod('CASH')}
                      className={`py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        formMethod === 'CASH'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tiền Mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMethod('BANK_TRANSFER')}
                      className={`py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        formMethod === 'BANK_TRANSFER'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Ngân Hàng</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Account Details if Bank Transfer */}
              {formMethod === 'BANK_TRANSFER' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Thông tin Tài Khoản / Ngân Hàng chuyển khoản:
                  </label>
                  <input
                    type="text"
                    value={formBankAccountInfo}
                    onChange={(e) => setFormBankAccountInfo(e.target.value)}
                    placeholder="Ví dụ: MB Bank - STK: 0987654321 - NGUYEN VAN A"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Recipient info & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {modalMode === 'RECEIPT' ? 'Họ tên người nộp:' : 'Họ tên người nhận tiền:'}
                  </label>
                  <input
                    type="text"
                    value={formRecipientName}
                    onChange={(e) => setFormRecipientName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ngày hạch toán:
                  </label>
                  <input
                    type="date"
                    value={formTransactionDate}
                    onChange={(e) => setFormTransactionDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Description & Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lý do / Nội dung thu chi:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi rõ nội dung thanh toán / mua sắm / tạm ứng..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Reference Ref & Approver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mã tham chiếu / Số hóa đơn (nếu có):
                  </label>
                  <input
                    type="text"
                    value={formReferenceRef}
                    onChange={(e) => setFormReferenceRef(e.target.value)}
                    placeholder="Số HĐ / Mã GD ngân hàng"
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Người duyệt chi / ký duyệt:
                  </label>
                  <input
                    type="text"
                    value={formApprovedBy}
                    onChange={(e) => setFormApprovedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingVoucher}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition disabled:opacity-50 ${
                    modalMode === 'RECEIPT'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : modalMode === 'ADVANCE'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {savingVoucher ? 'Đang Lưu...' : 'Xác Nhận & Xuất Chứng Từ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PRINTABLE VOUCHER MODAL */}
      {activePrintVoucher && (
        <PrintableFundVoucherModal
          voucher={activePrintVoucher}
          onClose={() => setActivePrintVoucher(null)}
        />
      )}
    </div>
  );
};
