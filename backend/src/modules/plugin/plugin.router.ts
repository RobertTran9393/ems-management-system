import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const pluginRouter = Router();

// 1. Generate formatted message for Zalo cá nhân
pluginRouter.post('/zalo/format-message', async (req: Request, res: Response) => {
  try {
    const { type, studentName, parentName, sessionNumber, score, teacherComment, amount, dueDate, orderCode } = req.body;

    let messageContent = '';

    if (type === 'ATTENDANCE') {
      messageContent = `[TRUNG TÂM TOÁN TRÍ TUỆ SBR]\n` +
        `Kính gửi Phụ huynh ${parentName || ''},\n` +
        `Hôm nay bé ${studentName} đã hoàn thành Buổi học số ${sessionNumber}/24.\n` +
        `• Tình trạng: Có mặt đầy đủ\n` +
        `• Nhận xét của Giáo viên: ${teacherComment || 'Bé tập trung, thao tác bàn tính nhanh và chính xác.'}\n` +
        `Chúc bé luôn hào hứng và tiến bộ mỗi ngày!`;
    } else if (type === 'ASSESSMENT') {
      messageContent = `[KẾT QUẢ KHẢO THÍ SBR]\n` +
        `Kính gửi Phụ huynh,\n` +
        `Trung tâm SBR xin gửi kết quả bài kiểm tra Buổi ${sessionNumber} của bé ${studentName}:\n` +
        `• Điểm số: ${score} điểm\n` +
        `• Đánh giá: ${teacherComment || 'Đạt yêu cầu kiến thức chuẩn'}\n` +
        `Trân trọng thông báo đến Quý phụ huynh!`;
    } else if (type === 'TUITION_REMINDER') {
      messageContent = `[THÔNG BÁO HỌC PHÍ SBR]\n` +
        `Kính gửi Phụ huynh bé ${studentName},\n` +
        `Trung tâm SBR xin gửi thông tin học phí đợt tiếp theo:\n` +
        `• Số tiền: ${Number(amount).toLocaleString('vi-VN')} đ\n` +
        `• Hạn đóng: ${dueDate || 'Trong tuần này'}\n` +
        `• Nội dung chuyển khoản: ${orderCode || 'HP'}\n` +
        `• Số TK: 123456789 - MB Bank - CTK: TRUNG TAM TOAN TRI TUE SBR\n` +
        `Xin cảm ơn Quý phụ huynh!`;
    }

    return res.json({
      success: true,
      content: messageContent,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Log Zalo Personal Message and return Direct Zalo Link
pluginRouter.post('/zalo/send-personal', async (req: Request, res: Response) => {
  try {
    const { parentPhone, messageContent, studentName, messageType } = req.body;

    if (!parentPhone) {
      return res.status(400).json({ success: false, message: 'Thiếu số điện thoại Phụ huynh' });
    }

    // Clean phone number (e.g. 0988111222 -> 84988111222 or 0988111222)
    const cleanPhone = parentPhone.replace(/\D/g, '');
    const zaloChatUrl = `https://zalo.me/${cleanPhone}`;

    // Log to ZnsLog for history
    await prisma.znsLog.create({
      data: {
        phone: parentPhone,
        templateId: messageType || 'ZALO_PERSONAL_CHAT',
        params: {
          studentName,
          content: messageContent,
        },
        status: 'SENT_MANUAL_VIA_ZALO_ME',
      },
    });

    return res.json({
      success: true,
      zaloChatUrl,
      messageContent,
      message: `Đã chuẩn bị tin nhắn gửi đến Zalo Phụ huynh (${parentPhone})!`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
