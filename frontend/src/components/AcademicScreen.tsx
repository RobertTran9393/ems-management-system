import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { GraduationCap, Clock, Award, ShieldAlert, ArrowRight, Play, CheckCircle, AlertTriangle, Calendar, FileText } from 'lucide-react';

export const AcademicScreen: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('');
  const [enrollmentDetail, setEnrollmentDetail] = useState<any>(null);

  // Reservation Modal state
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reserveStartDate, setReserveStartDate] = useState('2026-10-20');
  const [reserveEndDate, setReserveEndDate] = useState('2026-11-20');
  const [reserveReason, setReserveReason] = useState('Học viên bận thi học kỳ ở trường');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setEnrollments(data.data);
        setSelectedEnrollmentId(data.data[0].id);
        fetchDetail(data.data[0].id);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments/${id}`);
      const data = await res.json();
      if (data.success) {
        setEnrollmentDetail(data.data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSelectEnrollment = (id: string) => {
    setSelectedEnrollmentId(id);
    fetchDetail(id);
  };

  const handleCreateReservation = async () => {
    if (!selectedEnrollmentId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments/${selectedEnrollmentId}/reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: reserveStartDate,
          endDate: reserveEndDate,
          reason: reserveReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Tạo phiếu bảo lưu thành công! Đã đóng băng số buổi học.' });
        setShowReservationModal(false);
        fetchDetail(selectedEnrollmentId);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const handleResumeReservation = async (reservationId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic/reservations/${reservationId}/resume`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchDetail(selectedEnrollmentId);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleActivateNextCombo = async () => {
    if (!selectedEnrollmentId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments/${selectedEnrollmentId}/activate-next-combo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchEnrollments();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  if (!enrollmentDetail) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu hồ sơ đào tạo học viên...</div>;
  }

  const en = enrollmentDetail;
  const progressPercent = Math.round((en.attendedSessions / en.totalSessions) * 100);

  const entryTest = en.assessments?.find((a: any) => a.testType === 'ENTRY_TEST');
  const midTest = en.assessments?.find((a: any) => a.testType === 'MIDTERM_TEST');
  const finalTest = en.assessments?.find((a: any) => a.testType === 'FINAL_TEST');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            Quản Lý Tiến Độ 24 Buổi, Lớp Học & Bảo Lưu
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Phân hệ dành cho Giáo vụ theo dõi lộ trình đào tạo, học bù và tình trạng học viên</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium text-slate-600">Chọn Học Viên:</label>
          <select
            value={selectedEnrollmentId}
            onChange={(e) => handleSelectEnrollment(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            {enrollments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.student?.fullName} ({item.course?.courseCode}) - {item.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. THANH LỘ TRÌNH COMBO (Pipeline Ngang) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Lộ Trình Gói Combo Khóa Học (Pipeline Trực Quan)
          </h2>
          {en.combo && en.isQualifiedForNextLevel && (
            <button
              onClick={handleActivateNextCombo}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow"
            >
              <Play className="w-3.5 h-3.5" />
              Kích Hoạt Khóa Kế Tiếp
            </button>
          )}
        </div>

        {en.combo ? (
          <div className="flex items-center gap-3 overflow-x-auto py-2">
            {en.combo.items?.map((item: any, idx: number) => {
              const isCurrent = item.sequenceOrder === en.sequenceInCombo;
              const isPast = (en.sequenceInCombo || 1) > item.sequenceOrder;
              return (
                <React.Fragment key={item.id}>
                  <div
                    className={`flex-1 min-w-[200px] p-3 rounded-lg border ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-400'
                        : isPast
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50 opacity-75'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                      <span>Khóa {item.sequenceOrder}</span>
                      {isPast && <span className="text-emerald-700 font-bold">HOÀN TẤT</span>}
                      {isCurrent && <span className="text-indigo-700 font-bold">ĐANG HỌC</span>}
                      {!isCurrent && !isPast && <span className="text-slate-500">CHỜ KÍCH HOẠT</span>}
                    </div>
                    <div className="font-semibold text-slate-800 text-sm truncate">{item.course?.name}</div>
                    <div className="text-xs text-slate-500 mt-1">24 buổi • Chuẩn 3 tháng</div>
                  </div>
                  {idx < en.combo.items.length - 1 && <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded">
            Học viên đang học Khóa học đơn (không thuộc Gói Combo).
          </div>
        )}
      </div>

      {/* 2. KHỐI TIẾN ĐỘ 24 BUỔI & MỐC THỜI HẠN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tiến độ buổi học */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Tiến Độ Học Tập ({en.attendedSessions}/{en.totalSessions} buổi)
            </h3>
            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {progressPercent}% hoàn thành
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-lg font-bold text-emerald-700">{en.attendedSessions}</div>
              <div className="text-xs text-slate-500">Đã học (Có mặt)</div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-lg font-bold text-amber-700">{en.makeupPendingSessions}</div>
              <div className="text-xs text-slate-500">Vắng có phép (Chờ bù)</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-slate-700">{en.remainingSessions}</div>
              <div className="text-xs text-slate-500">Buổi còn lại</div>
            </div>
          </div>
        </div>

        {/* Mốc thời gian & Hạn hoàn thành */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Mốc Hạn Chuẩn (3T) & Tối Đa (4T)
            </h3>
            <button
              onClick={() => setShowReservationModal(true)}
              className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded border border-purple-200 hover:bg-purple-100"
            >
              + Tạo Phiếu Bảo Lưu
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-slate-500">Ngày học buổi 1 (T0):</span>
              <span className="font-semibold text-slate-800">
                {en.activationDate ? new Date(en.activationDate).toLocaleDateString('vi-VN') : 'Chưa kích hoạt'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-slate-500">Hạn chuẩn 3 tháng (Xét KPI GV):</span>
              <span className="font-semibold text-blue-600">
                {en.standardDeadlineDate ? new Date(en.standardDeadlineDate).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-slate-500">Hạn tối đa hoàn thành (4 tháng + bù bảo lưu):</span>
              <span className="font-semibold text-rose-600">
                {en.maxExpiredDate ? new Date(en.maxExpiredDate).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Trạng thái Lên khoá Đúng hạn:</span>
              <span className={en.isOnTimeLevelUp ? 'font-bold text-emerald-600' : 'text-slate-500'}>
                {en.isOnTimeLevelUp ? '✔ ĐẠT CHUẨN ĐÚNG HẠN (Thưởng 300k)' : 'Đang theo dõi / Chưa chốt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI 3 BÀI KIỂM TRA BẮT BUỘC MỖI KHOÁ */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          Khảo Thí: Kết Quả 3 Bài Kiểm Tra Bắt Buộc
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buổi 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buổi 1 / Học thử</div>
            <div className="font-semibold text-slate-800 text-sm">Kiểm Tra Đầu Khoá (Entry Test)</div>
            {entryTest ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-xl font-bold text-blue-600">{entryTest.score} điểm</div>
                <div className="text-slate-600">{entryTest.evaluationDetails}</div>
                <div className="text-emerald-600 font-semibold">Đã kiểm tra</div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-400 italic">Chưa có điểm kiểm tra đầu khoá</div>
            )}
          </div>

          {/* Buổi 12 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buổi 12</div>
            <div className="font-semibold text-slate-800 text-sm">Kiểm Tra Giữa Khoá (Midterm)</div>
            {midTest ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-xl font-bold text-blue-600">{midTest.score} điểm</div>
                <div className="text-slate-600">{midTest.evaluationDetails}</div>
                <div className="text-emerald-600 font-semibold">Đã kiểm tra</div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-400 italic">Chưa tới buổi 12</div>
            )}
          </div>

          {/* Buổi 24 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buổi 24 (Cuối khoá)</div>
            <div className="font-semibold text-slate-800 text-sm">Kiểm Tra Cuối Khoá (Final Test)</div>
            {finalTest ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-xl font-bold text-blue-600">{finalTest.score} điểm</div>
                <div className="text-slate-600">{finalTest.evaluationDetails}</div>
                <div className={finalTest.isPassed ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {finalTest.isPassed ? '✔ ĐỦ ĐIỀU KIỆN LÊN KHOÁ (PASS)' : '✖ CHƯA ĐẠT (FAIL - Cần phụ đạo)'}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-400 italic">Chưa tới buổi 24 (Bắt buộc xét PASS để lên khoá)</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. DANH SÁCH BẢO LƯU */}
      {en.reservations && en.reservations.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Lịch Sử Phiếu Bảo Lưu (Tối đa 90 ngày)
          </h3>
          <div className="divide-y text-xs">
            {en.reservations.map((res: any) => (
              <div key={res.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800">
                    Từ {new Date(res.startDate).toLocaleDateString('vi-VN')} đến{' '}
                    {new Date(res.endDate).toLocaleDateString('vi-VN')} ({res.extendedDays} ngày)
                  </span>
                  <div className="text-slate-500">Lý do: {res.reason}</div>
                </div>
                <div>
                  {res.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleResumeReservation(res.id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                    >
                      Mở lại lớp & Cộng bù ngày
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">Đã kết thúc bảo lưu</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TẠO PHIẾU BẢO LƯU */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Tạo Phiếu Bảo Lưu (Tối Đa 90 Ngày)</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-medium">Ngày bắt đầu bảo lưu:</label>
                <input
                  type="date"
                  value={reserveStartDate}
                  onChange={(e) => setReserveStartDate(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Ngày dự kiến học lại:</label>
                <input
                  type="date"
                  value={reserveEndDate}
                  onChange={(e) => setReserveEndDate(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Lý do bảo lưu:</label>
                <textarea
                  value={reserveReason}
                  onChange={(e) => setReserveReason(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReservationModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreateReservation}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                Lưu Phiếu Bảo Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
