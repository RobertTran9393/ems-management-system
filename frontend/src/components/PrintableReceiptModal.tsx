import React from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptData {
  receiptNo: string;
  orderCode: string;
  studentName: string;
  parentName?: string;
  parentPhone?: string;
  amount: number;
  cashierName?: string;
  date: string | Date;
  branchName?: string;
  note?: string;
}

export const PrintableReceiptModal: React.FC<{
  receipt: ReceiptData;
  onClose: () => void;
}> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
        {/* Printable Area */}
        <div id="printable-receipt" className="border-2 border-dashed border-slate-300 p-6 rounded-xl bg-white space-y-4">
          <div className="text-center border-b pb-3">
            <h2 className="text-lg font-black text-slate-800 tracking-wide uppercase">
              {receipt.branchName || 'TRUNG TÂM TOÁN TRÍ TUỆ & KỸ NĂNG SỐNG SBR'}
            </h2>
            <p className="text-xs text-slate-500">Số 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội • Hotline: 0901.000.001</p>
            <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-full">
              PHIẾU THU TIỀN MẶT
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">Số: {receipt.receiptNo}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Ngày thu tiền:</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-blue-600">{receipt.orderCode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Học sinh:</span>
              <span className="font-bold text-slate-900">{receipt.studentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Người nộp tiền (Phụ huynh):</span>
              <span className="font-semibold text-slate-800">
                {receipt.parentName || 'Phụ huynh'} {receipt.parentPhone ? `(${receipt.parentPhone})` : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dotted">
              <span className="text-slate-500">Hình thức thanh toán:</span>
              <span className="font-bold text-emerald-700">TIỀN MẶT TẠI QUẦY (CASH)</span>
            </div>
            {receipt.note && (
              <div className="flex justify-between py-1 border-b border-dotted">
                <span className="text-slate-500">Nội dung / Ghi chú:</span>
                <span className="text-slate-800">{receipt.note}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 text-sm font-bold text-slate-900">
              <span>SỐ TIỀN THỰC THU:</span>
              <span className="text-xl text-emerald-600">
                {Number(receipt.amount).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center text-xs pt-4 text-slate-600">
            <div>
              <div className="font-bold text-slate-800">Người Nộp Tiền</div>
              <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-12"></div>
              <div className="font-medium">{receipt.parentName || 'Phụ huynh'}</div>
            </div>
            <div>
              <div className="font-bold text-slate-800">Người Thu Tiền (Thủ Quỹ)</div>
              <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-12"></div>
              <div className="font-medium text-emerald-700 font-bold">{receipt.cashierName || 'Thu ngân tại quầy'}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            In Phiếu Thu
          </button>
        </div>
      </div>
    </div>
  );
};
