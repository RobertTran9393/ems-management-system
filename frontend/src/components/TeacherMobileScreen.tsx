import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Send, Smartphone, Award, ShieldCheck, MessageCircle, Copy, ExternalLink, Check } from 'lucide-react';

export const TeacherMobileScreen: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // GPS State
  const [simulatedLat, setSimulatedLat] = useState<number>(21.033340);
  const [simulatedLng, setSimulatedLng] = useState<number>(105.800010);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isGpsValid, setIsGpsValid] = useState<boolean>(false);

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: string }>({});
  const [comments, setComments] = useState<{ [studentId: string]: string }>({});
  const [assessments, setAssessments] = useState<{
    [studentId: string]: { score: number; evaluationDetails: string; isPassed: boolean };
  }>({});

  // Zalo Personal Modal State
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloTargetStudent, setZaloTargetStudent] = useState<any>(null);
  const [zaloMessageContent, setZaloMessageContent] = useState('');
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/sessions`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSessions(data.data);
        const s = data.data[0];
        setSelectedSessionId(s.id);
        setSelectedSession(s);
        setIsGpsValid(s.isGpsValid || false);

        const records: any = {};
        const comms: any = {};
        s.class?.enrollments?.forEach((en: any) => {
          records[en.studentId] = 'PRESENT';
          comms[en.studentId] = 'Bé tập trung tính toán tốt, thao tác bàn tính nhanh.';
        });
        setAttendanceRecords(records);
        setComments(comms);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSelectSession = (sId: string) => {
    setSelectedSessionId(sId);
    const s = sessions.find((item) => item.id === sId);
    if (s) {
      setSelectedSession(s);
      setIsGpsValid(s.isGpsValid || false);
    }
  };

  const handleCheckinGPS = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/sessions/${selectedSessionId}/checkin-gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: simulatedLat, lng: simulatedLng }),
      });
      const data = await res.json();
      if (data.success) {
        setDistanceMeters(data.distanceMeters);
        setIsGpsValid(data.isGpsValid);
        setMessage({
          type: data.isGpsValid ? 'success' : 'error',
          text: data.message,
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleOpenZaloModal = (en: any) => {
    const student = en.student;
    const status = attendanceRecords[student.id] || 'PRESENT';
    const comment = comments[student.id] || 'Bé học tập chăm chỉ và tập trung.';
    const statusText = status === 'PRESENT' ? 'Có mặt' : status === 'ABSENT_EXCUSED' ? 'Vắng có phép (được xếp học bù)' : 'Vắng không phép';

    const msg = `[TRUNG TÂM TOÁN TRÍ TUỆ SBR]\n` +
      `Dạ chào Phụ huynh ${student.parentName || ''},\n` +
      `Hôm nay bé ${student.fullName} đã hoàn thành Buổi ${selectedSession.sessionNumber}/24:\n` +
      `• Tình trạng: ${statusText}\n` +
      `• Nhận xét của cô giáo: ${comment}\n` +
      `Chúc bé luôn vui vẻ và tiếp tục tiến bộ!`;

    setZaloTargetStudent(student);
    setZaloMessageContent(msg);
    setCopied(false);
    setShowZaloModal(true);
  };

  const handleCopyAndOpenZalo = () => {
    navigator.clipboard.writeText(zaloMessageContent);
    setCopied(true);
    if (zaloTargetStudent?.parentPhone) {
      const cleanPhone = zaloTargetStudent.parentPhone.replace(/\D/g, '');
      window.open(`https://zalo.me/${cleanPhone}`, '_blank');
    }
  };

  const handleSubmitAttendance = async () => {
    if (!isGpsValid) {
      setMessage({ type: 'error', text: 'Chưa Check-in GPS hợp lệ. Không thể lưu điểm danh!' });
      return;
    }

    setSubmitting(true);
    const records = selectedSession.class.enrollments.map((en: any) => ({
      studentId: en.studentId,
      enrollmentId: en.id,
      status: attendanceRecords[en.studentId] || 'PRESENT',
      attendanceType: 'REGULAR',
      teacherComment: comments[en.studentId] || '',
      studentName: en.student.fullName,
      parentPhone: en.student.parentPhone,
    }));

    const assessmentPayload: any = {};
    if (selectedSession.sessionNumber === 1 || selectedSession.sessionNumber === 12 || selectedSession.sessionNumber === 24) {
      const testType =
        selectedSession.sessionNumber === 1
          ? 'ENTRY_TEST'
          : selectedSession.sessionNumber === 12
          ? 'MIDTERM_TEST'
          : 'FINAL_TEST';

      selectedSession.class.enrollments.forEach((en: any) => {
        const ass = assessments[en.studentId] || { score: 9.0, evaluationDetails: 'Đạt chuẩn yêu cầu', isPassed: true };
        assessmentPayload[en.studentId] = {
          testType,
          score: ass.score,
          evaluationDetails: ass.evaluationDetails,
          isPassed: ass.isPassed,
        };
      });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/sessions/${selectedSessionId}/submit-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          assessmentData: assessmentPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedSession) {
    return <div className="p-8 text-center text-slate-500">Đang tải lịch dạy ca học...</div>;
  }

  const s = selectedSession;
  const isSpecialAssessmentSession = s.sessionNumber === 1 || s.sessionNumber === 12 || s.sessionNumber === 24;

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Mobile Mockup Frame */}
      <div className="bg-slate-900 text-white rounded-3xl p-3 shadow-2xl border-4 border-slate-700">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 py-1 text-xs text-slate-400 border-b border-slate-800">
          <span>08:30</span>
          <div className="flex items-center gap-1 font-bold text-white">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            App Giáo Viên (Web Responsive)
          </div>
          <span>GPS • 4G • 98%</span>
        </div>

        {/* Content Area */}
        <div className="bg-slate-50 text-slate-900 rounded-2xl p-4 my-2 max-h-[80vh] overflow-y-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Chọn Ca Học:</h2>
            <select
              value={selectedSessionId}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 max-w-[200px]"
            >
              {sessions.map((item) => (
                <option key={item.id} value={item.id}>
                  Buổi {item.sessionNumber}/24 - {item.class?.classCode}
                </option>
              ))}
            </select>
          </div>

          {/* KHU VỰC 1: HEADER CHECK-IN GPS */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-900 text-sm">{s.class?.course?.name}</div>
                <div className="text-xs text-slate-500">
                  {s.class?.roomName} • Ca: {s.startTime} - {s.endTime}
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Buổi {s.sessionNumber}/24
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                isGpsValid ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <MapPin className={`w-4 h-4 ${isGpsValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>
                  {isGpsValid
                    ? `Định vị GPS Hợp Lệ (${distanceMeters !== null ? distanceMeters + 'm' : '< 150m'})`
                    : 'Chưa Check-in tại cơ sở (Bị khoá)'}
                </span>
              </div>
              {isGpsValid && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
            </div>

            <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between items-center">
                <span>Vị trí Giáo viên:</span>
                <button
                  onClick={() => {
                    if (simulatedLat === 21.03334) {
                      setSimulatedLat(21.039999);
                      setSimulatedLng(105.815);
                    } else {
                      setSimulatedLat(21.03334);
                      setSimulatedLng(105.80001);
                    }
                  }}
                  className="text-blue-600 underline font-medium"
                >
                  Đổi vị trí (Tại lớp 45m / Ở xa 500m)
                </button>
              </div>
              <div className="font-mono text-slate-500">
                Lat: {simulatedLat.toFixed(5)}, Lng: {simulatedLng.toFixed(5)}
              </div>
            </div>

            <button
              onClick={handleCheckinGPS}
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1.5 ${
                isGpsValid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {isGpsValid ? 'Check-in Lại Vị Trí GPS' : 'Bấm Check-in Bắt Đầu Ca Dạy (GPS)'}
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* KHU VỰC 2: DANH SÁCH HỌC VIÊN */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
              <span>DANH SÁCH HỌC VIÊN ({s.class?.enrollments?.length || 0})</span>
              {!isGpsValid && <span className="text-rose-600 font-semibold">🔒 Bị khoá do chưa GPS</span>}
            </div>

            <div className={!isGpsValid ? 'opacity-40 pointer-events-none' : 'space-y-3'}>
              {s.class?.enrollments?.map((en: any) => {
                const student = en.student;
                const status = attendanceRecords[student.id] || 'PRESENT';
                const comment = comments[student.id] || '';
                const ass = assessments[student.id] || {
                  score: 9.0,
                  evaluationDetails: 'Tiếp thu tốt, thao tác tính toán chuẩn xác',
                  isPassed: true,
                };

                return (
                  <div key={student.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
                        <div className="text-[11px] text-slate-500">Mã: {student.studentCode} • PH: {student.parentPhone}</div>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Buổi {en.attendedSessions + 1}/24
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Học chính
                        </span>
                      </div>
                    </div>

                    {/* Trạng thái điểm danh */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: 'PRESENT' }))}
                        className={`py-1.5 rounded text-xs font-semibold border transition ${
                          status === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Có mặt
                      </button>
                      <button
                        onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: 'ABSENT_EXCUSED' }))}
                        className={`py-1.5 rounded text-xs font-semibold border transition ${
                          status === 'ABSENT_EXCUSED'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Vắng phép (Bù)
                      </button>
                      <button
                        onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: 'ABSENT_UNEXCUSED' }))}
                        className={`py-1.5 rounded text-xs font-semibold border transition ${
                          status === 'ABSENT_UNEXCUSED'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Vắng K.phép
                      </button>
                    </div>

                    {/* Nhận xét giáo viên */}
                    <div>
                      <input
                        type="text"
                        placeholder="Nhận xét buổi học..."
                        value={comment}
                        onChange={(e) => setComments((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        className="w-full text-xs border rounded p-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>

                    {/* NÚT GỬI ZALO CÁ NHÂN CHO PHỤ HUYNH */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleOpenZaloModal(en)}
                        className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                        Gửi Zalo Cá Nhân Phụ Huynh
                      </button>
                    </div>

                    {/* Hộp thoại khảo thí mốc 1, 12, 24 */}
                    {isSpecialAssessmentSession && (
                      <div className="p-2.5 bg-amber-50 border-2 border-amber-400 rounded-lg space-y-2">
                        <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-amber-600" />
                            {s.sessionNumber === 1 && 'KHẢO THÍ BUỔI 1: KIỂM TRA ĐẦU KHOÁ'}
                            {s.sessionNumber === 12 && 'KHẢO THÍ BUỔI 12: KIỂM TRA GIỮA KHOÁ'}
                            {s.sessionNumber === 24 && 'KHẢO THÍ BUỔI 24: KIỂM TRA CUỐI KHOÁ'}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <label className="text-xs font-medium text-amber-800">Điểm:</label>
                          <input
                            type="number"
                            step="0.5"
                            value={ass.score}
                            onChange={(e) =>
                              setAssessments((prev) => ({
                                ...prev,
                                [student.id]: { ...ass, score: Number(e.target.value) },
                              }))
                            }
                            className="w-16 border rounded p-1 text-xs text-center font-bold bg-white"
                          />
                          {s.sessionNumber === 24 && (
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() =>
                                  setAssessments((prev) => ({
                                    ...prev,
                                    [student.id]: { ...ass, isPassed: true },
                                  }))
                                }
                                className={`text-[11px] px-2 py-1 rounded font-bold ${
                                  ass.isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                PASS
                              </button>
                              <button
                                onClick={() =>
                                  setAssessments((prev) => ({
                                    ...prev,
                                    [student.id]: { ...ass, isPassed: false },
                                  }))
                                }
                                className={`text-[11px] px-2 py-1 rounded font-bold ${
                                  !ass.isPassed ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                FAIL
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 border-t space-y-2">
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || !isGpsValid}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Đang lưu...' : 'Lưu Điểm Danh & Trừ Buổi Vào Hệ Thống'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GỬI TIN NHẮN ZALO CÁ NHÂN */}
      {showZaloModal && zaloTargetStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Gửi Tin Zalo Cho Phụ Huynh
              </div>
              <button onClick={() => setShowZaloModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div><strong>Học viên:</strong> {zaloTargetStudent.fullName}</div>
              <div><strong>Phụ huynh:</strong> {zaloTargetStudent.parentName} ({zaloTargetStudent.parentPhone})</div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Nội dung tin nhắn Zalo soạn sẵn:</label>
              <textarea
                value={zaloMessageContent}
                onChange={(e) => setZaloMessageContent(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-xs mt-1 bg-slate-50 font-sans"
                rows={6}
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyAndOpenZalo}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow"
              >
                <ExternalLink className="w-4 h-4" />
                {copied ? 'Đã Copy! Đang Mở Zalo...' : 'Copy Nội Dung & Mở Zalo Phụ Huynh'}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                (Click vào nút sẽ tự động copy tin nhắn và mở cửa sổ chat Zalo trực tiếp với số điện thoại của Phụ huynh)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
