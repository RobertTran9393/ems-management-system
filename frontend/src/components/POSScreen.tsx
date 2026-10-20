import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  QrCode,
  CheckCircle2,
  UserCheck,
  Layers,
  Package,
  CreditCard,
  AlertCircle,
  Banknote,
  Printer,
  Sparkles,
  GraduationCap,
  Tag,
  Percent,
  X,
  Gift,
} from 'lucide-react';
import { PrintableReceiptModal } from './PrintableReceiptModal';

export const POSScreen: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Selected item state
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<{ [productId: string]: number }>({});
  
  // Discount, Scholarship & Promotion state
  const [discountType, setDiscountType] = useState<'NONE' | 'SCHOLARSHIP' | 'PROMOTION' | 'SIBLING' | 'VOUCHER' | 'CUSTOM'>('NONE');
  const [discountUnit, setDiscountUnit] = useState<'PERCENT' | 'VND'>('VND');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Installments & Payment Method state
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'INSTALLMENTS'>('INSTALLMENTS');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('CASH'); // CASH or VIETQR
  const [cashierName, setCashierName] = useState<string>('Thu ngân tại quầy');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customerGivenAmount, setCustomerGivenAmount] = useState<number>(0);

  const [installment1Amount, setInstallment1Amount] = useState<number>(0);
  const [installment2Date, setInstallment2Date] = useState<string>('2026-11-15');
  const [installment3Date, setInstallment3Date] = useState<string>('2026-12-15');

  // Order result state
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
    const saved = localStorage.getItem('ems_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        if (u.fullName) {
          setCashierName(u.fullName);
        }
      } catch (e) {}
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resB, resC, resCb, resP, resL] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/branches`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/catalog/courses`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/catalog/combos`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/inventory/products`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/crm/leads`).then((r) => r.json()),
      ]);

      if (resB.data && resB.data.length > 0) {
        setBranches(resB.data);
        setSelectedBranchId(resB.data[0].id);
      }
      setCourses(resC.data || []);
      setCombos(resCb.data || []);
      setProducts(resP.data || []);
      setLeads(resL.data || []);

      // Auto-select lead if passed from CRM
      const passedLeadId = sessionStorage.getItem('ems_pos_selected_lead');
      if (passedLeadId) {
        setSelectedLeadId(passedLeadId);
        sessionStorage.removeItem('ems_pos_selected_lead');
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail?.leadId) {
        setSelectedLeadId(e.detail.leadId);
      }
    };
    window.addEventListener('ems_navigate_tab', handleNav);
    return () => window.removeEventListener('ems_navigate_tab', handleNav);
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedCombo = combos.find((c) => c.id === selectedComboId);

  const tuitionFee = selectedCombo
    ? Number(selectedCombo.comboPrice)
    : selectedCourse
    ? Number(selectedCourse.tuitionFee)
    : 0;

  const productFee = Object.entries(selectedProducts).reduce((acc, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return acc + (prod ? Number(prod.sellingPrice) * qty : 0);
  }, 0);

  // Compute discount amount (Học bổng / Ưu đãi / Voucher)
  const discountAmount = useMemo(() => {
    if (discountType === 'NONE' || discountValue <= 0) return 0;
    if (discountUnit === 'PERCENT') {
      const base = tuitionFee > 0 ? tuitionFee : (tuitionFee + productFee);
      return Math.min(base, Math.round((base * discountValue) / 100));
    }
    return Math.min(tuitionFee + productFee, discountValue);
  }, [discountType, discountUnit, discountValue, tuitionFee, productFee]);

  const handleApplyPresetDiscount = (
    type: 'SCHOLARSHIP' | 'PROMOTION' | 'SIBLING' | 'VOUCHER' | 'CUSTOM',
    unit: 'PERCENT' | 'VND',
    value: number,
    reason: string
  ) => {
    setDiscountType(type);
    setDiscountUnit(unit);
    setDiscountValue(value);
    setDiscountReason(reason);
  };

  const handleClearDiscount = () => {
    setDiscountType('NONE');
    setDiscountUnit('VND');
    setDiscountValue(0);
    setDiscountReason('');
  };

  const finalTotal = Math.max(0, tuitionFee + productFee - Number(discountAmount));

  useEffect(() => {
    if (paymentMode === 'INSTALLMENTS') {
      const half = Math.round(finalTotal * 0.5);
      setInstallment1Amount(half);
      setCustomerGivenAmount(half);
    } else {
      setInstallment1Amount(finalTotal);
      setCustomerGivenAmount(finalTotal);
    }
  }, [finalTotal, paymentMode]);

  const changeReturnAmount = Math.max(0, customerGivenAmount - installment1Amount);

  const handleProductQtyChange = (productId: string, delta: number) => {
    setSelectedProducts((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleCheckout = async () => {
    if (!selectedBranchId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn cơ sở' });
      return;
    }
    if (!selectedLeadId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Khách hàng / Học viên' });
      return;
    }
    if (!selectedCourseId && !selectedComboId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Khoá học đơn hoặc Gói Combo' });
      return;
    }

    if (paymentMethod === 'CASH' && customerGivenAmount < installment1Amount) {
      setMessage({ type: 'error', text: 'Số tiền khách đưa chưa đủ để thanh toán Đợt 1' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const productsPayload = Object.entries(selectedProducts).map(([pId, qty]) => {
      const prod = products.find((p) => p.id === pId);
      return { productId: pId, quantity: qty, unitPrice: Number(prod.sellingPrice) };
    });

    let installmentsPayload = [];
    if (paymentMode === 'INSTALLMENTS') {
      const debt = finalTotal - installment1Amount;
      const halfDebt = Math.round(debt / 2);
      installmentsPayload = [
        { installmentNo: 1, amount: installment1Amount, dueDate: new Date().toISOString(), isPaidNow: paymentMethod === 'CASH' },
        { installmentNo: 2, amount: halfDebt, dueDate: new Date(installment2Date).toISOString(), isPaidNow: false },
        { installmentNo: 3, amount: debt - halfDebt, dueDate: new Date(installment3Date).toISOString(), isPaidNow: false },
      ];
    } else {
      installmentsPayload = [
        { installmentNo: 1, amount: finalTotal, dueDate: new Date().toISOString(), isPaidNow: paymentMethod === 'CASH' },
      ];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          leadId: selectedLeadId,
          courseId: selectedCourseId || undefined,
          comboId: selectedComboId || undefined,
          products: productsPayload,
          discountAmount,
          discountType: discountType !== 'NONE' ? discountType : undefined,
          discountRate: discountUnit === 'PERCENT' ? discountValue : 0,
          discountReason: discountReason || undefined,
          installments: installmentsPayload,
          initialPaymentMethod: paymentMethod,
          cashierName: cashierName || currentUser?.fullName || 'Thu ngân tại quầy',
          createdById: currentUser?.id || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder(data.data);
        const selectedLead = leads.find((l) => l.id === selectedLeadId);

        if (paymentMethod === 'CASH') {
          // Open Cash Receipt
          setReceiptData({
            receiptNo: `PT-${data.data.orderCode}`,
            orderCode: data.data.orderCode,
            studentName: selectedLead?.studentName || 'Học viên',
            parentName: selectedLead?.parentName || 'Phụ huynh',
            parentPhone: selectedLead?.parentPhone,
            amount: installment1Amount,
            totalTuitionFee: tuitionFee,
            totalProductFee: productFee,
            discountAmount,
            discountReason: discountReason || (discountType === 'SCHOLARSHIP' ? 'Học bổng' : 'Ưu đãi trung tâm'),
            finalTotal,
            cashierName,
            date: new Date(),
            branchName: branches.find((b) => b.id === selectedBranchId)?.name,
            note: paymentMode === 'INSTALLMENTS' ? 'Thu tiền mặt Đợt 1 tại quầy' : 'Thu tiền mặt 100% tại quầy',
          });
          setShowReceiptModal(true);
          setMessage({
            type: 'success',
            text: `Đã thu tiền mặt thành công ${installment1Amount.toLocaleString('vi-VN')} đ! Xuất phiếu thu tiền mặt.`,
          });
        } else {
          setMessage({
            type: 'success',
            text: `Tạo đơn hàng ${data.data.orderCode} thành công! Sinh mã VietQR chuyển khoản.`,
          });
        }
        fetchInitialData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            Thu Ngân, Bán Khóa Học & Vật Tư (POS)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Đóng tiền mặt tại quầy + Sinh phiếu thu & Chuyển khoản VietQR / Chia đợt học phí
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Cơ sở:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Split-Screen 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CỘT TRÁI (60%): Thông tin Đăng ký & Hàng hóa */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mục 1: Chọn Khách hàng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Mục 1: Chọn Khách hàng (Tự động nhận diện Lead học thử)
            </h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-medium">Danh sách Khách hàng / Học viên tiềm năng:</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-50 focus:bg-white"
              >
                <option value="">-- Chọn khách hàng / học sinh --</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.studentName} - PH: {lead.parentName} ({lead.parentPhone}) [{lead.status}]
                  </option>
                ))}
              </select>
              {selectedLeadId && (
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  ⚡ <strong>Quy tắc SRS:</strong> Khi hoàn tất đơn này, Lead sẽ được tự động chuyển đổi thành Học viên chính thức và kích hoạt thưởng KPI "Học viên mới".
                </div>
              )}
            </div>
          </div>

          {/* Mục 2: Chọn Khoá học / Combo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-purple-600" />
              Mục 2: Chọn Khoá học đơn hoặc Gói Combo
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
                  ⭐ Gói Combo Liên tiếp (Tiết kiệm chi phí):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {combos.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedComboId(selectedComboId === c.id ? '' : c.id);
                        setSelectedCourseId('');
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedComboId === c.id
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-400'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                        <span className="font-bold text-purple-700 text-sm">
                          {Number(c.comboPrice).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>{c.totalCourses} khoá liên tiếp (48 buổi)</span>
                        <span className="line-through text-slate-400">
                          {Number(c.originalPrice).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">
                  Hoặc chọn Khoá học đơn (24 buổi):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {courses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCourseId(selectedCourseId === c.id ? '' : c.id);
                        setSelectedComboId('');
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedCourseId === c.id
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-400'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-slate-800 text-xs">{c.name}</div>
                      <div className="font-bold text-blue-600 text-sm mt-1">
                        {Number(c.tuitionFee).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mục 3: Mua lẻ Giáo trình & Vật tư */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-emerald-600" />
              Mục 3: Mua lẻ Giáo trình, Bàn tính Soroban & Vật tư (Trừ kho trực tiếp)
            </h2>
            <div className="space-y-3">
              {products.map((p) => {
                const stockQty = p.branchStocks?.[0]?.quantity ?? 0;
                const qty = selectedProducts[p.id] || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {Number(p.sellingPrice).toLocaleString('vi-VN')} đ / {p.unit} •{' '}
                        <span className={stockQty > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                          Kho còn: {stockQty}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProductQtyChange(p.id, -1)}
                        className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center font-bold bg-white text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => handleProductQtyChange(p.id, 1)}
                        className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center font-bold bg-white text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mục 4: Ưu Đãi / Giảm Giá / Học Bổng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Mục 4: Chính Sách Ưu Đãi / Giảm Giá / Học Bổng
              </h2>
              {discountType !== 'NONE' && (
                <button
                  type="button"
                  onClick={handleClearDiscount}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa ưu đãi</span>
                </button>
              )}
            </div>

            {/* Quick Presets Group 1: Học bổng */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
                <GraduationCap className="w-4 h-4" />
                <span>Chính Sách Học Bổng (Scholarship):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('SCHOLARSHIP', 'PERCENT', 100, 'Học bổng 100% (Toàn phần)')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    discountType === 'SCHOLARSHIP' && discountValue === 100
                      ? 'border-purple-600 bg-purple-100/80 text-purple-900 ring-2 ring-purple-400'
                      : 'border-slate-200 bg-purple-50/40 text-purple-800 hover:bg-purple-100/50'
                  }`}
                >
                  <span className="text-sm font-black text-purple-700">100%</span>
                  <span className="text-[11px] font-medium text-slate-600">Toàn phần</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('SCHOLARSHIP', 'PERCENT', 50, 'Học bổng 50% (Bán phần)')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    discountType === 'SCHOLARSHIP' && discountValue === 50
                      ? 'border-purple-600 bg-purple-100/80 text-purple-900 ring-2 ring-purple-400'
                      : 'border-slate-200 bg-purple-50/40 text-purple-800 hover:bg-purple-100/50'
                  }`}
                >
                  <span className="text-sm font-black text-purple-700">50%</span>
                  <span className="text-[11px] font-medium text-slate-600">Bán phần</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('SCHOLARSHIP', 'PERCENT', 30, 'Học bổng tài năng 30%')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    discountType === 'SCHOLARSHIP' && discountValue === 30
                      ? 'border-purple-600 bg-purple-100/80 text-purple-900 ring-2 ring-purple-400'
                      : 'border-slate-200 bg-purple-50/40 text-purple-800 hover:bg-purple-100/50'
                  }`}
                >
                  <span className="text-sm font-black text-purple-700">30%</span>
                  <span className="text-[11px] font-medium text-slate-600">Tài năng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('SCHOLARSHIP', 'PERCENT', 20, 'Học bổng khuyến học 20%')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    discountType === 'SCHOLARSHIP' && discountValue === 20
                      ? 'border-purple-600 bg-purple-100/80 text-purple-900 ring-2 ring-purple-400'
                      : 'border-slate-200 bg-purple-50/40 text-purple-800 hover:bg-purple-100/50'
                  }`}
                >
                  <span className="text-sm font-black text-purple-700">20%</span>
                  <span className="text-[11px] font-medium text-slate-600">Khuyến học</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Group 2: Ưu đãi & Khuyến mãi */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                <Tag className="w-4 h-4" />
                <span>Ưu Đãi & Khuyến Mãi Phổ Biến:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('SIBLING', 'PERCENT', 10, 'Ưu đãi Anh chị em ruột (-10%)')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    discountType === 'SIBLING'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 hover:bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-800">Anh chị em</div>
                  <div className="text-[11px] text-slate-500">Giảm 10% học phí</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('PROMOTION', 'VND', 500000, 'Ưu đãi Đăng ký sớm (-500.000 đ)')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    discountType === 'PROMOTION' && discountValue === 500000
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 hover:bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-800">Đăng ký sớm</div>
                  <div className="text-[11px] text-slate-500">-500.000 đ</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('PROMOTION', 'PERCENT', 15, 'Học viên cũ tái tục khóa tiếp theo (-15%)')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    discountType === 'PROMOTION' && discountValue === 15
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 hover:bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-800">Học sinh cũ</div>
                  <div className="text-[11px] text-slate-500">Tái tục giảm 15%</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPresetDiscount('VOUCHER', 'VND', 200000, 'Voucher quà tặng / Tri ân (-200.000 đ)')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    discountType === 'VOUCHER' && discountValue === 200000
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50 hover:bg-amber-50/50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-800">Voucher tri ân</div>
                  <div className="text-[11px] text-slate-500">-200.000 đ</div>
                </button>
              </div>
            </div>

            {/* Custom Input Block */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Hoặc nhập mức giảm giá tùy chỉnh:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountUnit('VND');
                      if (discountType === 'NONE') setDiscountType('CUSTOM');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      discountUnit === 'VND' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    VNĐ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountUnit('PERCENT');
                      if (discountType === 'NONE') setDiscountType('CUSTOM');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      discountUnit === 'PERCENT' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">
                    {discountUnit === 'PERCENT' ? 'Tỷ lệ giảm (%):' : 'Số tiền giảm (VNĐ):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountUnit === 'PERCENT' ? 100 : undefined}
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDiscountValue(val);
                      if (val > 0 && discountType === 'NONE') {
                        setDiscountType('CUSTOM');
                      }
                    }}
                    placeholder={discountUnit === 'PERCENT' ? 'Ví dụ: 10' : 'Ví dụ: 300000'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Lý do / Tên chương trình ưu đãi:</label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => {
                      setDiscountReason(e.target.value);
                      if (discountType === 'NONE') setDiscountType('CUSTOM');
                    }}
                    placeholder="VD: Học bổng tài năng, Giảm giá người quen..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Discount Callout */}
              {discountAmount > 0 && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        {discountReason || (discountType === 'SCHOLARSHIP' ? 'Học bổng' : 'Ưu đãi đặc biệt')}
                      </div>
                      <div className="text-[11px] text-amber-700">
                        {discountUnit === 'PERCENT' ? `Giảm ${discountValue}% học phí` : 'Giảm trực tiếp'} • Tiết kiệm{' '}
                        <strong>{discountAmount.toLocaleString('vi-VN')} đ</strong> cho phụ huynh
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearDiscount}
                    className="w-6 h-6 rounded-full hover:bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (40%): Thanh toán & Tiền Mặt / VietQR */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mục 5: Tổng hợp Đơn hàng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Mục 5: Tổng hợp Đơn hàng
            </h2>
            <div className="space-y-2 text-sm border-b pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Tổng học phí khoá/combo:</span>
                <span className="font-medium text-slate-800">{tuitionFee.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>(+) Tiền sách & vật tư:</span>
                <span className="font-medium text-slate-800">{productFee.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span>(-) Ưu đãi / Học bổng:</span>
                  {discountType !== 'NONE' && discountAmount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {discountType === 'SCHOLARSHIP' ? 'Học bổng' : 'Ưu đãi'}
                    </span>
                  )}
                </span>
                <span className={`font-bold ${discountAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {discountAmount > 0 ? `- ${discountAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
              {discountReason && discountAmount > 0 && (
                <div className="text-[11px] text-amber-700 italic text-right">
                  ({discountReason})
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-3 text-base font-bold text-slate-900">
              <span>(=) TỔNG THANH TOÁN:</span>
              <span className="text-xl text-blue-600">{finalTotal.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Mục 6: Cấu hình Chia đợt & Hình thức thu tiền */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-800">
              Mục 6: Đóng phí & Hình thức thu tiền
            </h2>

            {/* Chế độ đóng phí */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="pmode"
                  checked={paymentMode === 'INSTALLMENTS'}
                  onChange={() => setPaymentMode('INSTALLMENTS')}
                />
                Chia nhiều đợt
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="pmode"
                  checked={paymentMode === 'FULL'}
                  onChange={() => setPaymentMode('FULL')}
                />
                Đóng 100% một lần
              </label>
            </div>

            {/* Chọn hình thức: Tiền Mặt vs Chuyển Khoản VietQR */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Phương Thức Thu Tiền Đợt 1:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  TIỀN MẶT TẠI QUẦY
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    paymentMethod === 'VIETQR'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-blue-600" />
                  CHUYỂN KHOẢN VIETQR
                </button>
              </div>
            </div>

            {/* Giao diện tính tiền mặt tại quầy */}
            {paymentMethod === 'CASH' && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Số tiền Đợt 1 cần thu:</span>
                  <span className="font-bold text-sm text-emerald-700">
                    {installment1Amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div>
                  <label className="text-slate-600 font-medium">Tiền khách đưa (VNĐ):</label>
                  <input
                    type="number"
                    value={customerGivenAmount}
                    onChange={(e) => setCustomerGivenAmount(Number(e.target.value))}
                    className="w-full border rounded-lg p-2 mt-1 font-bold text-slate-800 bg-white text-sm"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-emerald-200 font-bold">
                  <span className="text-slate-700">Tiền thối lại khách:</span>
                  <span className="text-sm text-blue-700">
                    {changeReturnAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div>
                  <label className="text-slate-600">Tên thu ngân / Người thu:</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full border rounded p-1.5 mt-1 bg-white text-xs"
                  />
                </div>
              </div>
            )}

            {paymentMode === 'INSTALLMENTS' && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border text-xs">
                <div className="font-semibold text-slate-700">Lịch Hẹn Thu Các Đợt Sau:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500">Hạn Đợt 2:</label>
                    <input
                      type="date"
                      value={installment2Date}
                      onChange={(e) => setInstallment2Date(e.target.value)}
                      className="w-full border rounded px-2 py-1 mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500">Hạn Đợt 3:</label>
                    <input
                      type="date"
                      value={installment3Date}
                      onChange={(e) => setInstallment3Date(e.target.value)}
                      className="w-full border rounded px-2 py-1 mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || finalTotal === 0}
              className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading
                ? 'Đang xử lý đơn...'
                : paymentMethod === 'CASH'
                ? 'Xác Nhận Thu Tiền Mặt & Xuất Phiếu Thu'
                : 'Xác Nhận & Xuất Mã VietQR'}
            </button>
          </div>

          {/* Khối hiển thị sau khi tạo đơn */}
          {createdOrder && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="text-xs font-bold text-slate-700">Đơn hàng: {createdOrder.orderCode}</div>
              {paymentMethod === 'CASH' ? (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 mx-auto shadow"
                >
                  <Printer className="w-4 h-4" />
                  Mở & In Phiếu Thu Tiền Mặt
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-blue-700 font-medium">Mã VietQR động đợt 1:</div>
                  <img
                    src={`https://api.vietqr.io/image/970422-123456789-compact2.png?amount=${installment1Amount}&addInfo=${encodeURIComponent(
                      createdOrder.orderCode + ' D1'
                    )}&accountName=TRUNG%20TAM%20SBR`}
                    alt="VietQR Code"
                    className="w-40 h-40 border-2 border-blue-400 rounded-lg shadow-md mx-auto bg-white p-1"
                  />
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('ems_navigate_tab', { detail: { tab: 'RECEIPTS' } }));
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <span>Sang phân hệ Duyệt Chứng Từ & Đối Soát Phiếu Thu</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE CASH RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <PrintableReceiptModal receipt={receiptData} onClose={() => setShowReceiptModal(false)} />
      )}
    </div>
  );
};
