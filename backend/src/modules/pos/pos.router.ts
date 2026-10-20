import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { OrderStatus, InstallmentStatus, PaymentMethod, LeadStatus } from '@prisma/client';
import { eventBus, DomainEvent } from '../../events/event-bus';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const posRouter = Router();

// Configure Multer for Receipt Uploads with Strict Security Whitelist
const uploadDir = path.join(__dirname, '../../../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.png';
    const uniqueName = `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Tệp không hợp lệ: Chỉ chấp nhận ảnh biên lai định dạng JPG, PNG hoặc WEBP'));
    }
    cb(null, true);
  },
});

// 1. Upload Receipt Image
posRouter.post('/upload-receipt', (req: Request, res: Response) => {
  upload.single('receipt')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Lỗi khi tải ảnh chứng từ' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa chọn file ảnh chứng từ' });
    }
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    return res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      message: 'Tải lên chứng từ thành công',
    });
  });
});

// 2. Get Installments list (for Accounting & Verification)
posRouter.get('/installments', async (req: Request, res: Response) => {
  try {
    const { status, hasProof } = req.query;
    const installments = await prisma.paymentInstallment.findMany({
      where: {
        status: status ? (status as InstallmentStatus) : undefined,
        proofImageUrl: hasProof === 'true' ? { not: null } : undefined,
      },
      include: {
        order: {
          include: {
            student: true,
            branch: true,
            items: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return res.json({ success: true, data: installments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Submit Proof of Payment with Automated Verification & Provisional Accounting (Hạch Toán Tạm Tự Động)
posRouter.post('/installments/:id/submit-proof', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { proofImageUrl, proofNote, transactionRef, transferAmount } = req.body;

    const installment = await prisma.paymentInstallment.findUnique({
      where: { id },
      include: {
        order: {
          include: { student: true, branch: true, items: true },
        },
      },
    });

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thanh toán' });
    }

    // --- AUTOMATED VERIFICATION ENGINE (KIỂM TRA TỰ ĐỘNG) ---
    const checkResults: any = {
      fileValid: Boolean(proofImageUrl && proofImageUrl.length > 5),
      duplicateRef: false,
      amountMatched: true,
      confidenceScore: 95,
      autoStatus: 'PASSED',
    };

    // 1. Anti-fraud Duplicate Check: kiểm tra mã giao dịch đã từng dùng cho đợt khác chưa
    if (transactionRef) {
      const existingRef = await prisma.paymentInstallment.findFirst({
        where: {
          id: { not: id },
          transactionRef: transactionRef.trim(),
          status: InstallmentStatus.PAID,
        },
      });
      if (existingRef) {
        checkResults.duplicateRef = true;
        checkResults.autoStatus = 'FLAGGED_DUPLICATE';
        checkResults.confidenceScore = 30;
      }
    }

    // 2. Amount Match Check
    if (transferAmount && Number(transferAmount) !== Number(installment.amount)) {
      checkResults.amountMatched = false;
      checkResults.autoStatus = 'AMOUNT_MISMATCH';
      checkResults.confidenceScore = 60;
    }

    const isAutoPassed = checkResults.autoStatus === 'PASSED';

    // Update with Provisional Accounting (HẠCH TOÁN TẠM)
    const updated = await prisma.paymentInstallment.update({
      where: { id },
      data: {
        proofImageUrl,
        proofNote: proofNote || (isAutoPassed ? 'Đã kiểm tra tự động hợp lệ. Hạch toán tạm chờ sao kê ngân hàng.' : 'Cần đối soát thủ công do nghi vấn.'),
        transactionRef,
        autoVerified: isAutoPassed,
        autoVerifyDetails: checkResults,
        isProvisionallyApproved: isAutoPassed, // HẠCH TOÁN TẠM NẾU PASS TỰ ĐỘNG
        provisionalAt: isAutoPassed ? new Date() : null,
      },
      include: { order: { include: { student: true } } },
    });

    // If installment 1 passed provisional check, ensure student can enter class without delay
    if (isAutoPassed && installment.installmentNo === 1) {
      eventBus.publish(DomainEvent.ORDER_PAID_SUCCESS, {
        orderId: installment.orderId,
        studentId: installment.order.studentId,
        branchId: installment.order.branchId,
        items: installment.order.items,
      });
    }

    return res.json({
      success: true,
      data: updated,
      checkResults,
      isProvisionallyApproved: isAutoPassed,
      message: isAutoPassed
        ? `Hệ thống đã kiểm tra tự động thành công! Đã HẠCH TOÁN TẠM cho học viên ${installment.order.student.fullName} vào lớp ngay.`
        : `Chứng từ đã được tải lên nhưng có cảnh báo: ${checkResults.autoStatus}. Kế toán cần kiểm tra kỹ trước khi duyệt.`,
    });
  } catch (error: any) {
    console.error('Submit proof error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Confirm Bank Received (Kế toán kiểm tra tiền đã vào tài khoản ngân hàng -> Hoàn tất gạch nợ chính thức)
posRouter.post('/installments/:id/confirm-bank-received', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accountantName = 'Kế toán trưởng', transactionRef, note } = req.body;

    const installment = await prisma.paymentInstallment.findUnique({
      where: { id },
      include: {
        order: {
          include: { installments: true, items: true, student: true, branch: true },
        },
      },
    });

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thanh toán' });
    }

    if (installment.status === InstallmentStatus.PAID && installment.finalConfirmedAt) {
      return res.status(400).json({ success: false, message: 'Đợt thanh toán này đã được xác nhận tiền vào tài khoản trước đó' });
    }

    const finalReceiptNo = `PT-BANK-${Date.now().toString().slice(-8)}`;

    const updated = await prisma.$transaction(async (tx) => {
      const inst = await tx.paymentInstallment.update({
        where: { id },
        data: {
          status: InstallmentStatus.PAID,
          paidAt: new Date(),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          isProvisionallyApproved: true,
          finalConfirmedAt: new Date(),
          finalConfirmedBy: accountantName,
          confirmedBy: accountantName,
          transactionRef: transactionRef || installment.transactionRef || finalReceiptNo,
          proofNote: note || `Kế toán ${accountantName} đã đối soát sao kê: Tiền đã nổi vào tài khoản ngân hàng của trung tâm.`,
        },
      });

      const order = installment.order;
      const newPaid = Number(order.paidAmount) + Number(installment.amount);
      const newDebt = Math.max(0, Number(order.finalTotal) - newPaid);
      const newStatus = newDebt === 0 ? OrderStatus.PAID : OrderStatus.PARTIALLY_PAID;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: newPaid,
          remainingDebt: newDebt,
          paymentStatus: newStatus,
        },
      });

      return inst;
    });

    if (installment.installmentNo === 1) {
      eventBus.publish(DomainEvent.ORDER_PAID_SUCCESS, {
        orderId: installment.orderId,
        studentId: installment.order.studentId,
        branchId: installment.order.branchId,
        items: installment.order.items,
      });
    }

    return res.json({
      success: true,
      data: updated,
      receipt: {
        receiptNo: finalReceiptNo,
        orderCode: installment.order.orderCode,
        studentName: installment.order.student.fullName,
        parentName: installment.order.student.parentName,
        parentPhone: installment.order.student.parentPhone,
        amount: Number(installment.amount),
        cashierName: accountantName,
        date: new Date(),
        branchName: installment.order.branch.name,
        paymentMethodName: 'CHUYỂN KHOẢN NGÂN HÀNG (ĐÃ NỔI TIỀN)',
      },
      message: `Đã xác nhận tiền vào tài khoản thành công! Hoàn tất gạch nợ chính thức ${Number(installment.amount).toLocaleString('vi-VN')} đ.`,
    });
  } catch (error: any) {
    console.error('Confirm bank received error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4.1 Reject Provisional Accounting (Hủy Hạch Toán Tạm Nếu Tiền Không Vào Tài Khoản)
posRouter.post('/installments/:id/reject-provisional', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accountantName = 'Kế toán trưởng', reason = 'Tiền không nổi vào tài khoản sau thời gian đối soát' } = req.body;

    const installment = await prisma.paymentInstallment.findUnique({ where: { id } });
    if (!installment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thanh toán' });
    }

    const updated = await prisma.paymentInstallment.update({
      where: { id },
      data: {
        isProvisionallyApproved: false,
        proofNote: `BỊ TỪ CHỐI BỞI ${accountantName}: ${reason}`,
        status: InstallmentStatus.PENDING,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Đã hủy hạch toán tạm thành công. Khôi phục trạng thái chờ nộp tiền.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4.1 Collect Cash directly (Thu Tiền Mặt Trực Tiếp Tại Quầy)
posRouter.post('/installments/:id/pay-cash', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cashierName = 'Thu ngân tại quầy', receivedAmount, note } = req.body;

    const installment = await prisma.paymentInstallment.findUnique({
      where: { id },
      include: {
        order: {
          include: { student: true, branch: true, items: true },
        },
      },
    });

    if (!installment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thanh toán' });
    }

    if (installment.status === InstallmentStatus.PAID) {
      return res.status(400).json({ success: false, message: 'Đợt thanh toán này đã được hoàn tất trước đó' });
    }

    const receiptNo = `PT-${Date.now().toString().slice(-8)}`;

    const updated = await prisma.$transaction(async (tx) => {
      const inst = await tx.paymentInstallment.update({
        where: { id },
        data: {
          status: InstallmentStatus.PAID,
          paidAt: new Date(),
          paymentMethod: PaymentMethod.CASH,
          confirmedBy: cashierName,
          transactionRef: receiptNo,
          proofNote: note || `Thu tiền mặt tại quầy. Khách đưa: ${Number(receivedAmount || installment.amount).toLocaleString('vi-VN')} đ`,
        },
      });

      const order = installment.order;
      const newPaid = Number(order.paidAmount) + Number(installment.amount);
      const newDebt = Math.max(0, Number(order.finalTotal) - newPaid);
      const newStatus = newDebt === 0 ? OrderStatus.PAID : OrderStatus.PARTIALLY_PAID;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: newPaid,
          remainingDebt: newDebt,
          paymentStatus: newStatus,
        },
      });

      return inst;
    });

    if (installment.installmentNo === 1) {
      eventBus.publish(DomainEvent.ORDER_PAID_SUCCESS, {
        orderId: installment.orderId,
        studentId: installment.order.studentId,
        branchId: installment.order.branchId,
        items: installment.order.items,
      });
    }

    return res.json({
      success: true,
      data: updated,
      receipt: {
        receiptNo,
        orderCode: installment.order.orderCode,
        studentName: installment.order.student.fullName,
        parentName: installment.order.student.parentName,
        parentPhone: installment.order.student.parentPhone,
        amount: Number(installment.amount),
        cashierName,
        date: new Date(),
        branchName: installment.order.branch.name,
      },
      message: `Đã thu tiền mặt thành công ${Number(installment.amount).toLocaleString('vi-VN')} đ! Xuất phiếu thu ${receiptNo}.`,
    });
  } catch (error: any) {
    console.error('Pay cash error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Get Orders list
posRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const { branchId, studentId } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        branchId: branchId ? String(branchId) : undefined,
        studentId: studentId ? String(studentId) : undefined,
      },
      include: {
        student: true,
        items: true,
        installments: { orderBy: { installmentNo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 6. POS Checkout (Create Order with Installments & optional proof image)
posRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      studentId: existingStudentId,
      leadId,
      newStudentInfo,
      courseId,
      classId,
      comboId,
      products,
      discountAmount = 0,
      discountType,
      discountRate = 0,
      discountReason,
      installments,
      proofImageUrl,
      proofNote,
      transactionRef,
      createdById,
      cashierName,
    } = req.body;

    let targetStudentId = existingStudentId;

    if (!targetStudentId && leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (lead) {
        const studentCode = `HV-${Date.now().toString().slice(-6)}`;
        const student = await prisma.student.create({
          data: {
            studentCode,
            branchId: lead.branchId,
            fullName: lead.studentName,
            dob: lead.studentDob,
            parentName: lead.parentName,
            parentPhone: lead.parentPhone,
          },
        });
        targetStudentId = student.id;

        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: LeadStatus.CONVERTED,
            convertedStudentId: student.id,
          },
        });
      }
    } else if (!targetStudentId && newStudentInfo) {
      const studentCode = `HV-${Date.now().toString().slice(-6)}`;
      const student = await prisma.student.create({
        data: {
          studentCode,
          branchId,
          fullName: newStudentInfo.fullName,
          dob: newStudentInfo.dob ? new Date(newStudentInfo.dob) : null,
          gender: newStudentInfo.gender,
          parentName: newStudentInfo.parentName,
          parentPhone: newStudentInfo.parentPhone,
        },
      });
      targetStudentId = student.id;
    }

    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin Học viên để tạo đơn hàng' });
    }

    let totalTuitionFee = 0;
    let totalProductFee = 0;
    const orderItemsData: any[] = [];

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (course) {
        totalTuitionFee += Number(course.tuitionFee);
        orderItemsData.push({
          itemType: 'COURSE',
          referenceId: course.id,
          quantity: 1,
          unitPrice: course.tuitionFee,
          totalPrice: course.tuitionFee,
        });
      }
    }

    if (comboId) {
      const combo = await prisma.courseCombo.findUnique({ where: { id: comboId } });
      if (combo) {
        totalTuitionFee += Number(combo.comboPrice);
        orderItemsData.push({
          itemType: 'COMBO',
          referenceId: combo.id,
          quantity: 1,
          unitPrice: combo.comboPrice,
          totalPrice: combo.comboPrice,
        });
      }
    }

    if (Array.isArray(products)) {
      for (const p of products) {
        const itemTotal = Number(p.quantity) * Number(p.unitPrice);
        totalProductFee += itemTotal;
        orderItemsData.push({
          itemType: 'PRODUCT',
          referenceId: p.productId,
          productId: p.productId,
          quantity: Number(p.quantity),
          unitPrice: p.unitPrice,
          totalPrice: itemTotal,
        });
      }
    }

    const finalTotal = Math.max(0, totalTuitionFee + totalProductFee - Number(discountAmount));
    const orderCode = `ORD-${Date.now().toString().slice(-8)}`;

    let initialPaid = 0;
    const installmentsData: any[] = [];
    const isCashPayment = req.body.initialPaymentMethod === 'CASH';
    const effectiveCashierName = cashierName || req.body.cashierName || 'Thu ngân tại quầy';
    const cashReceiptNo = `PT-${Date.now().toString().slice(-8)}`;

    if (Array.isArray(installments) && installments.length > 0) {
      for (const inst of installments) {
        const isInst1 = inst.installmentNo === 1;
        const isPaid = isInst1 ? (isCashPayment || inst.isPaidNow || false) : false;
        if (isPaid) {
          initialPaid += Number(inst.amount);
        }

        const qrString = `https://api.vietqr.io/image/970422-123456789-compact2.png?amount=${inst.amount}&addInfo=${encodeURIComponent(orderCode + ' D' + inst.installmentNo)}&accountName=TRUNG%20TAM%20SBR`;

        installmentsData.push({
          installmentNo: inst.installmentNo,
          amount: inst.amount,
          dueDate: new Date(inst.dueDate),
          paidAt: isPaid ? new Date() : null,
          paymentMethod: isPaid ? (isCashPayment && isInst1 ? PaymentMethod.CASH : (inst.paymentMethod || PaymentMethod.BANK_TRANSFER)) : null,
          qrCodeString: qrString,
          proofImageUrl: isInst1 && !isCashPayment ? proofImageUrl : null,
          proofNote: isCashPayment && isInst1 ? `Thu tiền mặt tại quầy bởi ${effectiveCashierName}` : (isInst1 ? proofNote : null),
          transactionRef: isCashPayment && isInst1 ? cashReceiptNo : (isInst1 ? transactionRef : null),
          confirmedBy: isCashPayment && isInst1 ? effectiveCashierName : null,
          status: isPaid ? InstallmentStatus.PAID : InstallmentStatus.PENDING,
        });
      }
    } else {
      const qrString = `https://api.vietqr.io/image/970422-123456789-compact2.png?amount=${finalTotal}&addInfo=${encodeURIComponent(orderCode)}&accountName=TRUNG%20TAM%20SBR`;
      const isPaid = isCashPayment || Boolean(proofImageUrl);
      if (isPaid) {
        initialPaid = finalTotal;
      }

      installmentsData.push({
        installmentNo: 1,
        amount: finalTotal,
        dueDate: new Date(),
        paidAt: isPaid ? new Date() : null,
        paymentMethod: isCashPayment ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER,
        qrCodeString: qrString,
        proofImageUrl: isCashPayment ? null : proofImageUrl,
        proofNote: isCashPayment ? `Thu tiền mặt 100% tại quầy bởi ${effectiveCashierName}` : proofNote,
        transactionRef: isCashPayment ? cashReceiptNo : transactionRef,
        confirmedBy: isCashPayment ? effectiveCashierName : null,
        status: isPaid ? InstallmentStatus.PAID : InstallmentStatus.PENDING,
      });
    }

    const remainingDebt = Math.max(0, finalTotal - initialPaid);
    const paymentStatus = remainingDebt === 0 ? OrderStatus.PAID : OrderStatus.PARTIALLY_PAID;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          studentId: targetStudentId,
          branchId,
          createdById: createdById || null,
          cashierName: effectiveCashierName,
          totalTuitionFee,
          totalProductFee,
          discountAmount: Number(discountAmount),
          discountType: discountType || null,
          discountRate: discountRate ? Number(discountRate) : 0,
          discountReason: discountReason || null,
          finalTotal,
          paidAmount: initialPaid,
          remainingDebt,
          paymentStatus,
          items: { create: orderItemsData },
          installments: { create: installmentsData },
        },
        include: { items: true, installments: true, student: true },
      });

      if (Array.isArray(products)) {
        for (const p of products) {
          await tx.branchStock.updateMany({
            where: { branchId, productId: p.productId },
            data: { quantity: { decrement: Number(p.quantity) } },
          });

          await tx.inventoryLog.create({
            data: {
              branchId,
              productId: p.productId,
              changeQty: -Number(p.quantity),
              actionType: 'POS_SALE',
              referenceId: order.id,
            },
          });
        }
      }

      if (courseId) {
        const activationDate = new Date();
        const stdDeadline = new Date(activationDate);
        stdDeadline.setMonth(stdDeadline.getMonth() + 3);
        const maxExp = new Date(activationDate);
        maxExp.setMonth(maxExp.getMonth() + 4);

        await tx.enrollment.create({
          data: {
            studentId: targetStudentId,
            orderId: order.id,
            courseId,
            currentClassId: classId || null,
            totalSessions: 24,
            remainingSessions: 24,
            activationDate,
            standardDeadlineDate: stdDeadline,
            maxExpiredDate: maxExp,
            status: 'ACTIVE',
          },
        });
      }

      if (comboId) {
        const comboItems = await tx.comboItem.findMany({
          where: { comboId },
          orderBy: { sequenceOrder: 'asc' },
        });

        for (const item of comboItems) {
          const isFirst = item.sequenceOrder === 1;
          const activationDate = isFirst ? new Date() : null;
          let stdDeadline = null;
          let maxExp = null;

          if (isFirst) {
            stdDeadline = new Date(activationDate!);
            stdDeadline.setMonth(stdDeadline.getMonth() + 3);
            maxExp = new Date(activationDate!);
            maxExp.setMonth(maxExp.getMonth() + 4);
          }

          await tx.enrollment.create({
            data: {
              studentId: targetStudentId,
              orderId: order.id,
              comboId,
              sequenceInCombo: item.sequenceOrder,
              courseId: item.courseId,
              currentClassId: isFirst ? classId || null : null,
              totalSessions: 24,
              remainingSessions: 24,
              activationDate,
              standardDeadlineDate: stdDeadline,
              maxExpiredDate: maxExp,
              status: isFirst ? 'ACTIVE' : 'WAITING_IN_QUEUE',
            },
          });
        }
      }

      return order;
    });

    eventBus.publish(DomainEvent.ORDER_PAID_SUCCESS, {
      orderId: newOrder.id,
      studentId: targetStudentId,
      branchId,
      items: orderItemsData,
    });

    return res.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
