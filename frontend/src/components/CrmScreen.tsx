import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { Users, Phone, UserPlus, Calendar, Award, CheckCircle, AlertCircle } from 'lucide-react';

export const CrmScreen: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // New Lead Modal state
  const [showAddLead, setShowAddLead] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [interestedSubject, setInterestedSubject] = useState('Toán trí tuệ Soroban');

  // Trial Modal state
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [trialDate, setTrialDate] = useState('2026-10-25');
  const [entryScore, setEntryScore] = useState<number>(8.5);
  const [trialEvaluation, setTrialEvaluation] = useState('Bé tiếp thu nhanh, phản xạ tính toán tốt');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchBranches();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/crm/leads`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/core/branches`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setBranches(data.data);
        setSelectedBranchId(data.data[0].id);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateLead = async () => {
    if (!parentName || !parentPhone || !studentName || !selectedBranchId) {
      setMessage({ type: 'error', text: 'Vui lòng điền đủ thông tin phụ huynh và học sinh' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          parentName,
          parentPhone,
          studentName,
          interestedSubject,
          leadSource: 'Trực tiếp / Hotline',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Thêm khách hàng tiềm năng thành công!' });
        setShowAddLead(false);
        setParentName('');
        setParentPhone('');
        setStudentName('');
        fetchLeads();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleScheduleTrial = async () => {
    if (!activeLead) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/crm/leads/${activeLead.id}/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialDate,
          entryTestScore: entryScore,
          teacherEvaluation: trialEvaluation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Xếp lịch học thử & Ghi nhận kết quả Entry Test thành công!' });
        setShowTrialModal(false);
        fetchLeads();
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
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            Tuyển Sinh & Chăm Sóc Khách Hàng (CRM)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Quy trình: Tiếp nhận Lead → Xếp học thử → Khảo thí Entry Test → Chuyển đổi đóng phí POS
          </p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          <UserPlus className="w-4 h-4" />
          + Tiếp Nhận Lead Mới
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3">Học Sinh / Phụ Huynh</th>
              <th className="p-3">Số Điện Thoại</th>
              <th className="p-3">Bộ Môn Quan Tâm</th>
              <th className="p-3">Trạng Thái Tiến Trình</th>
              <th className="p-3">Bài Test Đầu Vào (Entry)</th>
              <th className="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50 transition">
                <td className="p-3">
                  <div className="font-semibold text-slate-800">{l.studentName}</div>
                  <div className="text-xs text-slate-500">PH: {l.parentName}</div>
                </td>
                <td className="p-3 font-mono text-slate-700 flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {l.parentPhone}
                </td>
                <td className="p-3 text-slate-700">{l.interestedSubject}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      l.status === 'CONVERTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : l.status === 'TRIAL_ATTENDED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="p-3">
                  {l.trialSessions?.[0]?.entryTestScore ? (
                    <div className="text-xs">
                      <span className="font-bold text-blue-600">{l.trialSessions[0].entryTestScore} điểm</span>
                      <div className="text-slate-500 truncate max-w-[180px]">{l.trialSessions[0].teacherEvaluation}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa kiểm tra</span>
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => {
                      setActiveLead(l);
                      setShowTrialModal(true);
                    }}
                    className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded font-semibold hover:bg-purple-100"
                  >
                    Xếp Học Thử / Nhập Điểm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Lead */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Tiếp Nhận Lead Khách Hàng Mới</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-medium">Họ tên Bé / Học sinh:</label>
                <input
                  type="text"
                  placeholder="VD: Bé Nguyễn Gia Hân"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Họ tên Phụ huynh:</label>
                <input
                  type="text"
                  placeholder="VD: Chị Mai"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Số điện thoại liên hệ:</label>
                <input
                  type="text"
                  placeholder="VD: 0988777666"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full border rounded p-2 mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Bộ môn quan tâm:</label>
                <select
                  value={interestedSubject}
                  onChange={(e) => setInterestedSubject(e.target.value)}
                  className="w-full border rounded p-2 mt-1 bg-white"
                >
                  <option value="Toán trí tuệ Soroban">Toán trí tuệ Soroban</option>
                  <option value="Kỹ năng sống & Tự tin">Kỹ năng sống & Tự tin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddLead(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreateLead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Lưu Khách Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Học Thử & Entry Test */}
      {showTrialModal && activeLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Lịch Học Thử & Khảo Thí: {activeLead.studentName}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-medium">Ngày học thử:</label>
                <input
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Điểm bài kiểm tra đầu vào (Entry Test):</label>
                <input
                  type="number"
                  step="0.5"
                  value={entryScore}
                  onChange={(e) => setEntryScore(Number(e.target.value))}
                  className="w-full border rounded p-2 mt-1 font-bold text-blue-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Đánh giá / Nhận xét của Giáo viên:</label>
                <textarea
                  value={trialEvaluation}
                  onChange={(e) => setTrialEvaluation(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTrialModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleScheduleTrial}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                Lưu Kết Quả Khảo Thí
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
