import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  ShieldAlert,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  UserPlus,
  Plus,
  Building2,
  BookOpen,
  Users,
  X,
  Sparkles,
} from 'lucide-react';

export const AcademicScreen: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('');
  const [enrollmentDetail, setEnrollmentDetail] = useState<any>(null);

  // In-progress Course Modal state
  const [showInProgressModal, setShowInProgressModal] = useState(false);
  const [submittingInProgress, setSubmittingInProgress] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Default start date: 2 months ago (T0)
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  };

  const [inProgressForm, setInProgressForm] = useState({
    branchId: '',
    fullName: '',
    dob: '',
    gender: 'Nam',
    parentName: '',
    parentPhone: '',
    courseId: '',
    classId: '',
    teacherId: '',
    totalSessions: 24,
    attendedSessions: 8,
    makeupPendingSessions: 0,
    startDate: getDefaultStartDate(),
    standardMonths: 3,
    maxMonths: 4,
    entryScore: '',
    entryComment: '',
    midtermScore: '',
    midtermComment: '',
    notes: 'Học viên hiện hữu đang học dở dang trước khi số hóa hệ thống EMS',
  });

  // Reservation Modal state
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reserveStartDate, setReserveStartDate] = useState('2026-10-20');
  const [reserveEndDate, setReserveEndDate] = useState('2026-11-20');
  const [reserveReason, setReserveReason] = useState('Học viên bận thi học kỳ ở trường');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEnrollments();
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [branchesRes, coursesRes, classesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/branches`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/catalog/courses`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/catalog/classes`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/core/users`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);
      if (branchesRes.success) {
        setBranches(branchesRes.data);
        if (branchesRes.data.length > 0) {
          setInProgressForm((prev) => ({ ...prev, branchId: prev.branchId || branchesRes.data[0].id }));
        }
      }
      if (coursesRes.success) {
        setCourses(coursesRes.data);
        if (coursesRes.data.length > 0) {
          setInProgressForm((prev) => ({ ...prev, courseId: prev.courseId || coursesRes.data[0].id }));
        }
      }
      if (classesRes.success) setClasses(classesRes.data);
      if (usersRes.success) {
        setTeachers(usersRes.data.filter((u: any) => u.role === 'TEACHER'));
      }
    } catch (e) {
      console.error(e);
    }
  };


  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setEnrollments(data.data);
        setSelectedEnrollmentId(data.data[0].id);
        fetchDetail(data.data[0].id);
      } else {
        setEnrollments([]);
        setEnrollmentDetail(null);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleCreateInProgressEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inProgressForm.branchId || !inProgressForm.courseId || !inProgressForm.fullName || !inProgressForm.parentPhone) {
      alert('Vui lòng điền đầy đủ: Cơ sở, Khóa học, Họ tên học viên và Số điện thoại phụ huynh');
      return;
    }

    try {
      setSubmittingInProgress(true);
      const res = await fetch(`${API_BASE_URL}/api/academic/enrollments/in-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inProgressForm,
          totalSessions: Number(inProgressForm.totalSessions),
          attendedSessions: Number(inProgressForm.attendedSessions),
          makeupPendingSessions: Number(inProgressForm.makeupPendingSessions),
          entryScore: inProgressForm.entryScore !== '' ? Number(inProgressForm.entryScore) : undefined,
          midtermScore: inProgressForm.midtermScore !== '' ? Number(inProgressForm.midtermScore) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Khởi tạo hồ sơ khóa học dở dang thành công!' });
        setShowInProgressModal(false);
        // Refresh enrollments and select the new enrollment
        const enrollRes = await fetch(`${API_BASE_URL}/api/academic/enrollments`);
        const enrollData = await enrollRes.json();
        if (enrollData.success && enrollData.data.length > 0) {
          setEnrollments(enrollData.data);
          const newId = data.data?.id || enrollData.data[0].id;
          setSelectedEnrollmentId(newId);
          fetchDetail(newId);
        }
      } else {
        alert(data.message || 'Lỗi khi khởi tạo khóa học dở dang');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setSubmittingInProgress(false);
    }
  };

  const renderInProgressModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 text-left">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                <UserPlus className="w-5 h-5 text-white" />
              </span>
              <h3 className="text-base font-bold">Khởi Tạo Khóa Học Đang Dở Dang</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Nhập thông tin học viên đang theo học thực tế tại trung tâm trước khi số hóa lên hệ thống EMS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInProgressModal(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainer callout */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Hệ thống sẽ tự động tính số buổi còn lại (<strong>{Math.max(0, Number(inProgressForm.totalSessions) - Number(inProgressForm.attendedSessions) - Number(inProgressForm.makeupPendingSessions))} buổi</strong>), kích hoạt trạng thái ĐANG HỌC, thiết lập hạn chuẩn 3 tháng & tối đa 4 tháng, đồng thời đồng bộ điểm danh các buổi đã học vào tiến độ 24 buổi.
          </span>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreateInProgressEnrollment} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* 1. THÔNG TIN HỌC VIÊN */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              1. Thông Tin Học Viên & Phụ Huynh
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cơ Sở Chi Nhánh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inProgressForm.branchId}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, branchId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ và Tên Học Viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Bảo An"
                  value={inProgressForm.fullName}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số Điện Thoại Phụ Huynh (Zalo) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912345678"
                  value={inProgressForm.parentPhone}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-indigo-700 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ Tên Phụ Huynh</label>
                <input
                  type="text"
                  placeholder="VD: Chị Mai (Mẹ bé)"
                  value={inProgressForm.parentName}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, parentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày Sinh Bé</label>
                <input
                  type="date"
                  value={inProgressForm.dob}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giới Tính</label>
                <select
                  value={inProgressForm.gender}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. KHÓA HỌC & LỚP HỌC */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              2. Khóa Học & Lớp Học Hiện Tại
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Khóa Học Đang Theo Học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inProgressForm.courseId}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, courseId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Lớp Học (Nếu đã xếp lớp)</label>
                <select
                  value={inProgressForm.classId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const targetClass = classes.find((cl) => cl.id === cId);
                    setInProgressForm({
                      ...inProgressForm,
                      classId: cId,
                      teacherId: targetClass?.mainTeacherId || inProgressForm.teacherId,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">-- Chưa xếp lớp cụ thể --</option>
                  {classes
                    .filter((cl) => !inProgressForm.branchId || cl.branchId === inProgressForm.branchId)
                    .map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.classCode} ({cl.roomName}) - {cl.scheduleDays} {cl.scheduleTime}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giáo Viên Phụ Trách</label>
                <select
                  value={inProgressForm.teacherId}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="">-- Tự động theo lớp hoặc phân bổ sau --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ngày Bắt Đầu Học Thực Tế (T0) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={inProgressForm.startDate}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* 3. TIẾN ĐỘ BUỔI HỌC DỞ DANG */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                3. Tiến Độ Buổi Học Dở Dang (24 Buổi Chuẩn)
              </span>
              <span className="text-indigo-700 font-bold">
                Đã học {Math.round((Number(inProgressForm.attendedSessions) / Number(inProgressForm.totalSessions)) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tổng Số Buổi Khóa</label>
                <input
                  type="number"
                  min="1"
                  value={inProgressForm.totalSessions}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, totalSessions: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                  Số Buổi Đã Học Xong <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={inProgressForm.totalSessions}
                  required
                  value={inProgressForm.attendedSessions}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, attendedSessions: Number(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-emerald-400 rounded-xl bg-white font-bold text-emerald-700 text-center text-sm shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-800 mb-1">Số Buổi Vắng Chờ Bù</label>
                <input
                  type="number"
                  min="0"
                  value={inProgressForm.makeupPendingSessions}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, makeupPendingSessions: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-amber-700 text-center"
                />
              </div>
            </div>

            {/* Remaining calculation banner */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Số buổi còn lại được học:</span>
              <span className="text-sm font-bold text-indigo-700 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-200">
                {Math.max(0, inProgressForm.totalSessions - inProgressForm.attendedSessions - inProgressForm.makeupPendingSessions)} buổi
              </span>
            </div>

            {/* Visual Progress Bar preview */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((Number(inProgressForm.attendedSessions) / Number(inProgressForm.totalSessions)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* 4. ĐÁNH GIÁ ĐÃ CÓ (TÙY CHỌN) */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              4. Điểm Đánh Giá Lịch Sử (Tùy chọn)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Điểm Test Đầu Vào (0-10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="VD: 8.5"
                  value={inProgressForm.entryScore}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, entryScore: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Điểm Test Giữa Kỳ - Buổi 12 {inProgressForm.attendedSessions < 12 ? '(Chưa đến buổi 12)' : ''}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  disabled={inProgressForm.attendedSessions < 12}
                  placeholder={inProgressForm.attendedSessions < 12 ? 'Học viên chưa học đến buổi 12' : 'VD: 9.0'}
                  value={inProgressForm.midtermScore}
                  onChange={(e) => setInProgressForm({ ...inProgressForm, midtermScore: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* 5. GHI CHÚ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Ghi Chú Hồ Sơ Dở Dang</label>
            <textarea
              rows={2}
              value={inProgressForm.notes}
              onChange={(e) => setInProgressForm({ ...inProgressForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowInProgressModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Huỷ Bỏ
            </button>
            <button
              type="submit"
              disabled={submittingInProgress}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow flex items-center gap-2 cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submittingInProgress ? 'Đang khởi tạo...' : '✨ Khởi Tạo Hồ Sơ & Đưa Vào Lộ Trình 24 Buổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
        <div className="text-xs font-semibold">Đang tải dữ liệu hồ sơ đào tạo học viên...</div>
      </div>
    );
  }

  if (!enrollmentDetail || enrollments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Chưa Có Hồ Sơ Học Viên Nào</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hiện chưa có học viên nào được xếp lớp. Bạn có thể khởi tạo trực tiếp hồ sơ học viên đang học dở dang tại trung tâm để đưa vào lộ trình 24 buổi chuẩn, hoặc tạo đơn tuyển sinh mới tại phân hệ POS.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInProgressModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              + Nhập Học Viên Đang Học Dở Dang
            </button>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ems_navigate_tab', { detail: { tab: 'POS' } }));
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
            >
              Đi đến màn hình POS Bán Khóa Học →
            </button>
          </div>
        </div>
        {showInProgressModal && renderInProgressModal()}
      </div>
    );
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
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowInProgressModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            + Nhập Học Viên Đang Học
          </button>
          <label className="text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">Chọn Học Viên:</label>
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

      {/* MODAL KHỞI TẠO KHÓA HỌC DỞ DANG */}
      {showInProgressModal && renderInProgressModal()}
    </div>
  );
};

