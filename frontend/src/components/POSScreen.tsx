import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, QrCode, CheckCircle2, UserCheck, Layers, Package, CreditCard, AlertCircle, Banknote, Printer } from 'lucide-react';
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
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Installments & Payment Method state
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'INSTALLMENTS'>('INSTALLMENTS');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('CASH'); // CASH or VIETQR
  const [cashierName, setCashierName] = useState<string>('Thu ngân tại quầy');
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
    } catch (e: any) {
      console.error('Fetch error:', e);
    }
  };

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
          installments: installmentsPayload,
          initialPaymentMethod: paymentMethod,
          cashierName,
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Màn Hình Thu Ngân Bán Hàng (POS Wireframe 4)
          </h1>
          <p className="text-slate-500 text-sm">
            Hỗ trợ Đóng Tiền Mặt Tại Quầy + Sinh Phiếu Thu & Chuyển Khoản VietQR / Chia Đợt
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
        </div>

        {/* CỘT PHẢI (40%): Thanh toán & Tiền Mặt / VietQR */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mục 4: Tổng hợp Đơn hàng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Mục 4: Tổng hợp Đơn hàng
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
                <span>(-) Giảm giá / Voucher:</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-28 text-right border border-slate-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 text-base font-bold text-slate-900">
              <span>(=) TỔNG THANH TOÁN:</span>
              <span className="text-xl text-blue-600">{finalTotal.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Mục 5: Cấu hình Chia đợt & Hình thức thu tiền */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-800">
              Mục 5: Đóng phí & Hình thức thu tiền
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
