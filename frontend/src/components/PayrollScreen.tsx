import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, Send, CheckCircle2, PlusCircle, AlertCircle, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

export const PayrollScreen: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('');
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);

  // New allowance state
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [allowanceTitle, setAllowanceTitle] = useState('');
  const [allowanceAmount, setAllowanceAmount] = useState<number>(200000);
  const [isDeduction, setIsDeduction] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setPayrolls(data.data);
        if (data.data.length > 0) {
          const target = data.data.find((p: any) => p.id === selectedPayrollId) || data.data[0];
          setSelectedPayrollId(target.id);
          setSelectedPayroll(target);
        } else {
          setSelectedPayroll(null);
        }
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchPayrolls();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleSelectPayroll = (p: any) => {
    setSelectedPayrollId(p.id);
    setSelectedPayroll(p);
  };

  const handleAddAllowanceItem = async () => {
    if (!selectedPayrollId || !allowanceTitle) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/${selectedPayrollId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: allowanceTitle,
          amount: allowanceAmount,
          isDeduction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Thêm phụ cấp/khấu trừ thành công!' });
        setShowAddAllowance(false);
        setAllowanceTitle('');
        fetchPayrolls();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleApprovePayroll = async () => {
    if (!selectedPayrollId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/${selectedPayrollId}/approve`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchPayrolls();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            Bảng Tính Lương, Thưởng KPI & Phụ Cấp
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tự động tổng hợp giờ công GPS + Thưởng học viên mới + Thưởng lên khoá đúng hạn 3 tháng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span>Kỳ lương:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-18 border border-slate-300 rounded px-2 py-1 text-sm bg-white"
            />
          </div>
          <button
            onClick={handleCalculatePayroll}
            className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-blue-700 shadow"
          >
            <Calculator className="w-4 h-4" />
            Chạy Tính Lương Tự Động
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* NỬA TRÊN - DANH SÁCH TỔNG HỢP LƯƠNG TOÀN BỘ NHÂN SỰ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Danh Sách Bảng Lương Nhân Sự & Giáo Viên Tháng {month}/{year}
          </h2>
          <span className="text-xs text-slate-500">{payrolls.length} nhân sự</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3">Nhân Sự & Vai Trò</th>
                <th className="p-3">Hợp Đồng</th>
                <th className="p-3">Giờ Dạy / Công</th>
                <th className="p-3">Lương Giờ Công</th>
                <th className="p-3">Thưởng KPI</th>
                <th className="p-3">Phụ Cấp</th>
                <th className="p-3">Thực Lĩnh (NET)</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payrolls.map((p) => {
                const isSelected = selectedPayrollId === p.id;
                const totalKpi = Number(p.newStudentBonusAmount) + Number(p.onTimeLevelupBonusAmount);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectPayroll(p)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span>{p.user?.fullName}</span>
                        {p.user?.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Quản lý
                          </span>
                        )}
                        {p.user?.role === 'ACADEMIC_AFFAIRS' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Giáo vụ
                          </span>
                        )}
                        {p.user?.role === 'ACCOUNTANT' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Kế toán
                          </span>
                        )}
                        {p.user?.role === 'SALE' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Sale
                          </span>
                        )}
                        {p.user?.role === 'TEACHER' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Giáo viên
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{p.user?.phone}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          p.contractTypeSnapshot === 'FULLTIME'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.contractTypeSnapshot}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {Number(p.totalTeachingHours) > 0 ? `${p.totalTeachingHours}h dạy` : `${p.totalAdminHours || 160}h HC`}
                    </td>
                    <td className="p-3">{Number(p.workingSalaryAmount).toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-emerald-600 font-medium">+{totalKpi.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-indigo-700 font-bold">+{Number(p.totalOptionalAllowances).toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 font-bold text-base text-blue-700">
                      {Number(p.netSalary).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPayroll(p);
                        }}
                        className="text-xs text-blue-600 underline font-medium hover:text-blue-800"
                      >
                        Xem phiếu lương
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NỬA DƯỚI - CHI TIẾT PHIẾU LƯƠNG (MASTER-DETAIL STRUCTURE) */}
      {selectedPayroll && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Chi Tiết Phiếu Lương: {selectedPayroll.user?.fullName} ({selectedPayroll.contractTypeSnapshot})
              </h2>
              <p className="text-xs text-slate-500">Kỳ thanh toán: Tháng {month}/{year}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddAllowance(true)}
                className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border hover:bg-slate-200"
              >
                <PlusCircle className="w-4 h-4 text-slate-500" />
                + Thêm Phụ Cấp / Thưởng Đột Xuất
              </button>
              {selectedPayroll.status !== 'APPROVED' ? (
                <button
                  onClick={handleApprovePayroll}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 shadow"
                >
                  <Send className="w-4 h-4" />
                  Duyệt & Gửi Phiếu Lương Về App Giáo Viên
                </button>
              ) : (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">
                  ✔ Đã Phê Duyệt & Bắn Thông Báo App
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phần 1: Lương giờ làm việc */}
            <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Phần 1: Lương Giờ Làm Việc
              </h3>
              <div className="space-y-2 text-xs">
                {selectedPayroll.contractTypeSnapshot === 'FULLTIME' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lương căn bản:</span>
                      <span className="font-semibold">{Number(selectedPayroll.user?.baseSalary).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Định mức giờ chuẩn tháng:</span>
                      <span>{selectedPayroll.user?.standardMonthlyHours} giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giờ dạy thực tế (hợp lệ GPS):</span>
                      <span className="font-bold text-blue-700">{selectedPayroll.totalTeachingHours} giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giờ hành chính:</span>
                      <span>{selectedPayroll.totalAdminHours} giờ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Đơn giá giờ dạy Part-time:</span>
                      <span className="font-semibold">{Number(selectedPayroll.user?.hourlyTeachingRate).toLocaleString('vi-VN')} đ / giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng giờ dạy hợp lệ GPS:</span>
                      <span className="font-bold text-blue-700">{selectedPayroll.totalTeachingHours} giờ</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-slate-800">
                  <span>Thành tiền lương giờ công:</span>
                  <span className="text-blue-600">
                    {Number(selectedPayroll.workingSalaryAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Phần 2: Thưởng KPI tự động */}
            <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Phần 2: Thưởng KPI Tự Động (Theo Thuật Toán SRS)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Thưởng Học viên mới ({selectedPayroll.newStudentCount} HV × 200.000 đ):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    +{Number(selectedPayroll.newStudentBonusAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Thưởng Lên khoá Đúng hạn 3 tháng ({selectedPayroll.onTimeLevelupCount} HV × 300.000 đ):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    +{Number(selectedPayroll.onTimeLevelupBonusAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-xs">
                  ⚡ <strong>Kiểm duyệt 4 điều kiện SRS:</strong> Hoàn thành 24/24 buổi • Trong hạn 3 tháng tiêu chuẩn • PASS bài thi cuối khoá • Kích hoạt khoá tiếp theo.
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-slate-800">
                  <span>Tổng thưởng KPI:</span>
                  <span className="text-emerald-600">
                    +{(Number(selectedPayroll.newStudentBonusAmount) + Number(selectedPayroll.onTimeLevelupBonusAmount)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Phần 3 & 4: Phụ cấp & Khấu trừ */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm">Phần 3 & 4: Danh Mục Phụ Cấp & Khấu Trừ Chi Tiết</h3>
            <div className="divide-y text-xs">
              {selectedPayroll.items?.map((item: any) => (
                <div key={item.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-800">{item.title}</span>
                    {item.note && <span className="text-slate-400 ml-2">({item.note})</span>}
                  </div>
                  <span className={item.isDeduction ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>
                    {item.isDeduction ? '-' : '+'}{Number(item.amount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
              {(!selectedPayroll.items || selectedPayroll.items.length === 0) && (
                <div className="py-2 text-slate-400 italic">Chưa có phụ cấp bổ sung ngoài lương</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t text-base font-bold text-slate-900">
              <span>LƯƠNG THỰC LĨNH (NET SALARY):</span>
              <span className="text-2xl text-emerald-600">
                {Number(selectedPayroll.netSalary).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM PHỤ CẤP */}
      {showAddAllowance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Thêm Phụ Cấp Hoặc Khấu Trừ Đột Xuất</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-medium">Tên khoản tiền:</label>
                <input
                  type="text"
                  placeholder="VD: Thưởng thi đua tuần, Phụ cấp xăng xe..."
                  value={allowanceTitle}
                  onChange={(e) => setAllowanceTitle(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Số tiền (VNĐ):</label>
                <input
                  type="number"
                  value={allowanceAmount}
                  onChange={(e) => setAllowanceAmount(Number(e.target.value))}
                  className="w-full border rounded p-2 mt-1 font-semibold"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="allowType"
                    checked={!isDeduction}
                    onChange={() => setIsDeduction(false)}
                  />
                  Phụ cấp / Thưởng (+)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="allowType"
                    checked={isDeduction}
                    onChange={() => setIsDeduction(true)}
                  />
                  Khấu trừ phạt (-)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddAllowance(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleAddAllowanceItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Lưu Vào Phiếu Lương
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
