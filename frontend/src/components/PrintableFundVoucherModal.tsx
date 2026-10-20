import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';

export interface FundVoucherData {
  id: string;
  code: string;
  type: 'RECEIPT' | 'PAYMENT';
  category: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  recipientName: string;
  recipientPhone?: string;
  branchName?: string;
  transactionDate: string | Date;
  bankAccountInfo?: string;
  referenceRef?: string;
  description: string;
  approvedBy?: string;
  creatorName?: string;
  targetMonth?: number;
  targetYear?: number;
}

export const PrintableFundVoucherModal: React.FC<{
  voucher: FundVoucherData;
  onClose: () => void;
}> = ({ voucher, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isReceipt = voucher.type === 'RECEIPT';
  const isAdvance = voucher.category === 'TAM_UNG_LUONG';
  const isSalary = voucher.category === 'CHI_LUONG';

  const title = isReceipt
    ? 'PHIẾU THU KHÁC'
    : isAdvance
    ? 'PHIẾU TẠM ỨNG LƯƠNG'
    : isSalary
    ? 'PHIẾU CHI LƯƠNG'
    : 'PHIẾU CHI';

  const formattedDate = new Date(voucher.transactionDate).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col my-auto">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chứng Từ Kế Toán Sổ Quỹ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Printable Area */}
        <div
          id="printable-fund-voucher"
          className="border-2 border-dashed border-slate-300 p-6 rounded-2xl bg-white space-y-4 overflow-y-auto flex-1 text-slate-800"
        >
          {/* Header */}
          <div className="text-center border-b pb-3">
            <h2 className="text-base font-black text-slate-900 tracking-wide uppercase">
              {voucher.branchName || 'HỆ THỐNG TOÁN TRÍ TUỆ & KỸ NĂNG SỐNG SBR'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Quy chuẩn chứng từ kế toán nội bộ • Quản lý Sổ quỹ thu chi
            </p>
            <div
              className={`mt-2 inline-block px-3.5 py-1 text-xs font-black rounded-full border ${
                isReceipt
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isAdvance
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {title}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono font-semibold">
              Mã chứng từ: <span className="text-slate-900">{voucher.code}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Ngày lập phiếu:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">
                {isReceipt ? 'Người nộp tiền:' : 'Người nhận tiền:'}
              </span>
              <span className="font-bold text-slate-900">
                {voucher.recipientName}{' '}
                {voucher.recipientPhone ? `(${voucher.recipientPhone})` : ''}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Hình thức thanh toán:</span>
              <span
                className={`font-bold ${
                  voucher.paymentMethod === 'CASH' ? 'text-emerald-700' : 'text-blue-700'
                }`}
              >
                {voucher.paymentMethod === 'CASH'
                  ? 'TIỀN MẶT TẠI QUẦY (CASH)'
                  : 'CHUYỂN KHOẢN NGÂN HÀNG (BANK)'}
              </span>
            </div>

            {voucher.bankAccountInfo && (
              <div className="flex justify-between py-1 border-b border-dotted">
                <span className="text-slate-500">Thông tin TK ngân hàng:</span>
                <span className="font-semibold text-blue-800 font-mono">
                  {voucher.bankAccountInfo}
                </span>
              </div>
            )}

            {(isAdvance || isSalary) && voucher.targetMonth && voucher.targetYear && (
              <div className="flex justify-between py-1 border-b border-dotted">
                <span className="text-slate-500">Kỳ lương áp dụng:</span>
                <span className="font-bold text-indigo-700">
                  Tháng {voucher.targetMonth}/{voucher.targetYear}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Nội dung / Lý do:</span>
              <span className="text-slate-900 font-medium text-right max-w-[260px]">
                {voucher.description}
              </span>
            </div>

            {voucher.referenceRef && (
              <div className="flex justify-between py-1 border-b border-dotted">
                <span className="text-slate-500">Mã tham chiếu / Hóa đơn:</span>
                <span className="font-mono text-slate-700">{voucher.referenceRef}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 text-sm font-bold border-t border-slate-200">
              <span>SỐ TIỀN {isReceipt ? 'THỰC THU:' : 'THỰC CHI:'}</span>
              <span
                className={`text-xl font-black ${
                  isReceipt ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {Number(voucher.amount).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 text-center text-[11px] pt-4 text-slate-600 gap-1 border-t border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Thủ Trưởng</div>
              <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
              <div className="h-10"></div>
              <div className="font-medium text-slate-700">
                {voucher.approvedBy || 'Ban Giám Đốc'}
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-800">Kế Toán / Thủ Quỹ</div>
              <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
              <div className="h-10"></div>
              <div className="font-medium text-slate-700">
                {voucher.creatorName || 'Người lập'}
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-800">
                {isReceipt ? 'Người Nộp' : 'Người Nhận'}
              </div>
              <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
              <div className="h-10"></div>
              <div className="font-medium text-slate-900">{voucher.recipientName}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Chứng Từ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
