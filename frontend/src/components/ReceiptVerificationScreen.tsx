import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, Eye, AlertCircle, RefreshCw, Upload, Banknote, ShieldCheck, Clock, CheckCircle, XCircle, Printer } from 'lucide-react';
import { PrintableReceiptModal } from './PrintableReceiptModal';

export const ReceiptVerificationScreen: React.FC = () => {
  const [installments, setInstallments] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PROVISIONAL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Cash collection modal state
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashTargetInst, setCashTargetInst] = useState<any>(null);
  const [cashierName, setCashierName] = useState('Thu ngân tại quầy');
  const [customerGivenAmount, setCustomerGivenAmount] = useState<number>(0);
  const [cashNote, setCashNote] = useState('Phụ huynh đóng tiền mặt trực tiếp tại quầy');

  // Printable receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Upload state (Chứng từ)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState('');
  const [uploadRef, setUploadRef] = useState('');
  const [uploadTargetId, setUploadTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/installments`);
      const data = await res.json();
      if (data.success) {
        setInstallments(data.data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetId || !uploadFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn đợt thanh toán và file ảnh chứng từ' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('receipt', uploadFile);

      // 1. Upload file ảnh
      const uploadRes = await fetch(`${API_BASE_URL}/api/pos/upload-receipt`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        setMessage({ type: 'error', text: uploadData.message });
        return;
      }

      // 2. Chạy quy trình Kiểm Tra Tự Động & Hạch Toán Tạm
      const attachRes = await fetch(`${API_BASE_URL}/api/pos/installments/${uploadTargetId}/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofImageUrl: uploadData.url,
          proofNote: uploadNote,
          transactionRef: uploadRef || `UNC-${Date.now().toString().slice(-6)}`,
          transferAmount: transferAmount || undefined,
        }),
      });
      const attachData = await attachRes.json();

      if (attachData.success) {
        setMessage({
          type: attachData.isProvisionallyApproved ? 'success' : 'warning',
          text: attachData.message,
        });
        setUploadFile(null);
        setUploadNote('');
        setUploadRef('');
        setUploadTargetId('');
        setTransferAmount(0);
        fetchInstallments();
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // Kế toán xác nhận tiền đã vào tài khoản ngân hàng -> Hoàn tất gạch nợ
  const handleConfirmBankReceived = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/installments/${id}/confirm-bank-received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountantName: 'Kế toán trưởng Nguyễn Thu Hà',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setPreviewImage(null);
        if (data.receipt) {
          setReceiptData(data.receipt);
          setShowReceiptModal(true);
        }
        fetchInstallments();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // Hủy hạch toán tạm (nếu sao kê ngân hàng không thấy tiền)
  const handleRejectProvisional = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối (VD: Tiền chưa vào tài khoản sau 24h đối soát / Bill chỉnh sửa):');
    if (!reason) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/installments/${id}/reject-provisional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountantName: 'Kế toán trưởng Nguyễn Thu Hà',
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'warning', text: data.message });
        setPreviewImage(null);
        fetchInstallments();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Thu tiền mặt trực tiếp tại quầy
  const handleConfirmCashPayment = async () => {
    if (!cashTargetInst) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/installments/${cashTargetInst.id}/pay-cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierName,
          receivedAmount: customerGivenAmount,
          note: cashNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setShowCashModal(false);
        setReceiptData(data.receipt);
        setShowReceiptModal(true);
        fetchInstallments();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // Filter logic
  const filteredInstallments = installments.filter((item) => {
    if (filterTab === 'PROVISIONAL') return item.isProvisionallyApproved && item.status !== 'PAID';
    if (filterTab === 'COMPLETED') return item.status === 'PAID';
    if (filterTab === 'PENDING') return item.status !== 'PAID' && !item.isProvisionallyApproved;
    return true;
  });

  const countProvisional = installments.filter((i) => i.isProvisionallyApproved && i.status !== 'PAID').length;
  const countCompleted = installments.filter((i) => i.status === 'PAID').length;
  const countPending = installments.filter((i) => i.status !== 'PAID' && !i.isProvisionallyApproved).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-emerald-600" />
            Quy Trình Kiểm Tra Tự Động, Hạch Toán Tạm & Duyệt Tiền Nổi
          </h1>
          <p className="text-slate-500 text-sm">
            Tự động đối soát bill $\rightarrow$ <strong>Hạch toán tạm cho học viên vào lớp ngay</strong> $\rightarrow$ Kế toán xác nhận tiền vào TK để hoàn tất chính thức
          </p>
        </div>
        <button
          onClick={fetchInstallments}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border hover:bg-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm Mới
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Pipeline 3 Trạng Thái Nghiệp Vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterTab('PENDING')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterTab === 'PENDING'
              ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-400'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-semibold uppercase text-slate-500">
            <span>1. Chờ Nộp Tiền / Nộp Bill</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{countPending}</span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-1">Chưa Thanh Toán</div>
          <div className="text-xs text-slate-400 mt-1">Chờ phụ huynh chuyển khoản hoặc thu tiền mặt tại quầy</div>
        </div>

        <div
          onClick={() => setFilterTab('PROVISIONAL')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterTab === 'PROVISIONAL'
              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
              : 'border-slate-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-semibold uppercase text-amber-700">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              2. Đã Hạch Toán Tạm
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{countProvisional}</span>
          </div>
          <div className="text-lg font-bold text-amber-900 mt-1">Chờ Kế Toán Đối Soát Sao Kê</div>
          <div className="text-xs text-amber-700 mt-1">Đã qua kiểm tra tự động • Học viên được giữ chỗ vào lớp</div>
        </div>

        <div
          onClick={() => setFilterTab('COMPLETED')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterTab === 'COMPLETED'
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-semibold uppercase text-emerald-700">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              3. Tiền Đã Vào Tài Khoản
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{countCompleted}</span>
          </div>
          <div className="text-lg font-bold text-emerald-900 mt-1">Đã Hoàn Tất Gạch Nợ Chính Thức</div>
          <div className="text-xs text-emerald-700 mt-1">Kế toán đã xác nhận tiền nổi • Xuất phiếu thu chính thức</div>
        </div>
      </div>

      {/* Bố cục Grid: Form Upload Chứng Từ + Danh Sách */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tải Lên Chứng Từ & Kiểm Tra Tự Động */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Nộp Bill & Kiểm Tra Tự Động
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Auto-Check</span>
          </div>

          <form onSubmit={handleUploadProof} className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-slate-500 font-medium">Chọn đợt thanh toán cần nộp bill:</label>
              <select
                value={uploadTargetId}
                onChange={(e) => {
                  setUploadTargetId(e.target.value);
                  const found = installments.find((i) => i.id === e.target.value);
                  if (found) {
                    setTransferAmount(Number(found.amount));
                  }
                }}
                className="w-full border rounded p-2 text-xs mt-1 bg-white"
              >
                <option value="">-- Chọn đợt thanh toán --</option>
                {installments
                  .filter((i) => i.status !== 'PAID')
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.order?.orderCode} - Đợt {i.installmentNo} ({Number(i.amount).toLocaleString('vi-VN')} đ) - {i.order?.student?.fullName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">File ảnh biên lai chuyển tiền / Bill banking:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full border rounded p-1.5 text-xs mt-1 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Số tiền trên bill chuyển khoản (VNĐ):</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full border rounded p-2 text-xs mt-1 font-semibold text-blue-700"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Mã giao dịch ngân hàng / Ref No:</label>
              <input
                type="text"
                placeholder="VD: MB-99882211"
                value={uploadRef}
                onChange={(e) => setUploadRef(e.target.value)}
                className="w-full border rounded p-2 text-xs mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Ghi chú đối soát:</label>
              <input
                type="text"
                placeholder="VD: Phụ huynh gửi qua Zalo..."
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                className="w-full border rounded p-2 text-xs mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition shadow"
            >
              Nộp Bill & Hạch Toán Tạm Tự Động
            </button>
          </form>
        </div>

        {/* Bảng Danh Sách Đợt Thanh Toán & Hai Bước Duyệt */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Danh Sách Đợt Đóng Phí & Tình Trạng Tiền Nổi
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterTab('ALL')}
                className={`text-xs px-2.5 py-1 rounded font-medium ${
                  filterTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Tất cả ({installments.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3">Đơn / Học Viên</th>
                  <th className="p-3">Đợt / Hạn</th>
                  <th className="p-3">Số Tiền</th>
                  <th className="p-3">Chứng Từ</th>
                  <th className="p-3">Trạng Thái Hạch Toán</th>
                  <th className="p-3 text-right">Thao Tác Kế Toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInstallments.map((inst) => {
                  const hasProof = Boolean(inst.proofImageUrl);
                  const isPaid = inst.status === 'PAID';
                  const isCash = inst.paymentMethod === 'CASH';
                  const isProvisional = inst.isProvisionallyApproved && !isPaid;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{inst.order?.orderCode}</div>
                        <div className="text-xs text-slate-500">
                          {inst.order?.student?.fullName} • PH: {inst.order?.student?.parentPhone}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="font-medium text-slate-700">Đợt {inst.installmentNo}</div>
                        <div className="text-slate-400">
                          Hạn: {new Date(inst.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-blue-700">
                        {Number(inst.amount).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 text-xs">
                        {isPaid && isCash ? (
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <Banknote className="w-3 h-3" />
                            Tiền mặt
                          </span>
                        ) : hasProof ? (
                          <button
                            onClick={() => {
                              setSelectedInst(inst);
                              setPreviewImage(`${API_BASE_URL}${inst.proofImageUrl}`);
                            }}
                            className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem bill
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Chưa nộp bill</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isPaid ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            TIỀN ĐÃ VÀO TK (HOÀN TẤT)
                          </span>
                        ) : isProvisional ? (
                          <div className="space-y-0.5">
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                              <Clock className="w-3.5 h-3.5" />
                              ĐÃ HẠCH TOÁN TẠM
                            </span>
                            <div className="text-[10px] text-amber-700 italic">Chờ sao kê nổi tiền</div>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                            CHỜ THU
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isProvisional ? (
                          <div className="flex justify-end gap-1.5">
                            {/* Nút Xác Nhận Hoàn Tất khi Kế toán thấy tiền vào tài khoản */}
                            <button
                              onClick={() => handleConfirmBankReceived(inst.id)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 shadow flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Tiền Đã Nổi (Hoàn Tất)
                            </button>
                            <button
                              onClick={() => handleRejectProvisional(inst.id)}
                              className="px-2 py-1 border border-rose-300 text-rose-600 rounded text-xs hover:bg-rose-50"
                            >
                              Hủy tạm
                            </button>
                          </div>
                        ) : !isPaid ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCashTargetInst(inst);
                                setCustomerGivenAmount(Number(inst.amount));
                                setShowCashModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 shadow flex items-center gap-1"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Thu Tiền Mặt
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                            <span>Duyệt bởi: <strong>{inst.finalConfirmedBy || inst.confirmedBy}</strong></span>
                            <button
                              onClick={() => {
                                setReceiptData({
                                  receiptNo: inst.transactionRef || `PT-${inst.order?.orderCode}`,
                                  orderCode: inst.order?.orderCode,
                                  studentName: inst.order?.student?.fullName,
                                  parentName: inst.order?.student?.parentName,
                                  parentPhone: inst.order?.student?.parentPhone,
                                  amount: Number(inst.amount),
                                  cashierName: inst.finalConfirmedBy || inst.confirmedBy || 'Kế toán SBR',
                                  date: inst.finalConfirmedAt || inst.paidAt || new Date(),
                                  branchName: inst.order?.branch?.name,
                                  note: `Thanh toán đợt ${inst.installmentNo} (${inst.paymentMethod})`,
                                });
                                setShowReceiptModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 ml-1 underline font-medium"
                            >
                              In phiếu
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XEM ẢNH BILL & THAO TÁC XÁC NHẬN TIỀN VÀO TÀI KHOẢN */}
      {previewImage && selectedInst && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-base">
                Đối Soát Chứng Từ: {selectedInst.order?.orderCode} (Đợt {selectedInst.installmentNo})
              </h3>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-semibold text-slate-800">{selectedInst.order?.student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền cần đối soát:</span>
                <span className="font-bold text-blue-700 text-sm">
                  {Number(selectedInst.amount).toLocaleString('vi-VN')} đ
                </span>
              </div>
              {selectedInst.transactionRef && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã giao dịch / Ref No:</span>
                  <span className="font-mono">{selectedInst.transactionRef}</span>
                </div>
              )}
              {selectedInst.autoVerifyDetails && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Kết Quả Kiểm Tra Tự Động: {selectedInst.autoVerifyDetails.autoStatus} (Độ tin cậy: {selectedInst.autoVerifyDetails.confidenceScore}%)
                  </div>
                  <div>• Trùng lặp mã giao dịch: {selectedInst.autoVerifyDetails.duplicateRef ? 'CÓ (Cảnh báo!)' : 'Không trùng (An toàn)'}</div>
                  <div>• Khớp số tiền: {selectedInst.autoVerifyDetails.amountMatched ? 'Chính xác 100%' : 'Sai lệch số tiền'}</div>
                </div>
              )}
            </div>

            <div className="border rounded-xl p-2 bg-slate-50 max-h-80 overflow-auto flex justify-center">
              <img
                src={previewImage}
                alt="Chứng từ chuyển khoản"
                className="max-h-72 object-contain rounded-lg shadow"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              {selectedInst.status !== 'PAID' && (
                <>
                  <button
                    onClick={() => handleRejectProvisional(selectedInst.id)}
                    className="px-3 py-2 border border-rose-300 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50"
                  >
                    Bác Bỏ & Hủy Hạch Toán Tạm
                  </button>
                  <button
                    onClick={() => handleConfirmBankReceived(selectedInst.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Xác Nhận Tiền Đã Vào TK & Hoàn Tất
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL THU TIỀN MẶT TRỰC TIẾP */}
      {showCashModal && cashTargetInst && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Thu Tiền Mặt: {cashTargetInst.order?.orderCode} (Đợt {cashTargetInst.installmentNo})
              </h3>
              <button onClick={() => setShowCashModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div><strong>Học viên:</strong> {cashTargetInst.order?.student?.fullName}</div>
                <div><strong>Phụ huynh:</strong> {cashTargetInst.order?.student?.parentName} ({cashTargetInst.order?.student?.parentPhone})</div>
                <div className="flex justify-between text-sm pt-1 border-t mt-1 font-bold">
                  <span className="text-slate-700">Số tiền cần thu:</span>
                  <span className="text-emerald-700">{Number(cashTargetInst.amount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Số tiền khách đưa (VNĐ):</label>
                <input
                  type="number"
                  value={customerGivenAmount}
                  onChange={(e) => setCustomerGivenAmount(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 font-bold text-sm text-slate-800 bg-white mt-1"
                />
              </div>

              <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-blue-900 font-bold">
                <span>Tiền thối lại khách:</span>
                <span className="text-sm">
                  {Math.max(0, customerGivenAmount - Number(cashTargetInst.amount)).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Tên thu ngân / Người thu tiền:</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full border rounded p-1.5 mt-1 bg-white"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Ghi chú phiếu thu:</label>
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full border rounded p-1.5 mt-1 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowCashModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmCashPayment}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow flex items-center gap-1.5"
              >
                <Banknote className="w-4 h-4" />
                Xác Nhận Thu Tiền & In Phiếu Thu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE CASH RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <PrintableReceiptModal receipt={receiptData} onClose={() => setShowReceiptModal(false)} />
      )}
    </div>
  );
};
