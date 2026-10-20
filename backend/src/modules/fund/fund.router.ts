import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { FundTransactionType, FundCategory, PaymentMethod } from '@prisma/client';

export const fundRouter = Router();

/**
 * GET /api/fund/summary
 * Cash Book and Fund summary (Quỹ tiền mặt, Tài khoản ngân hàng, Tổng thu, Tổng chi)
 */
fundRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate, month, year } = req.query;

    const where: any = { status: 'COMPLETED' };
    if (branchId && branchId !== 'all') {
      where.branchId = String(branchId);
    }

    // Filter by date range or month/year
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    } else if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    }

    // 1. Period Transactions
    const periodTransactions = await prisma.fundTransaction.findMany({
      where,
      select: {
        type: true,
        category: true,
        amount: true,
        paymentMethod: true,
      },
    });

    let periodReceiptsCash = 0;
    let periodReceiptsBank = 0;
    let periodPaymentsCash = 0;
    let periodPaymentsBank = 0;

    const categoryBreakdown: Record<string, { receipts: number; payments: number }> = {};

    for (const t of periodTransactions) {
      const amt = Number(t.amount);
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { receipts: 0, payments: 0 };
      }

      if (t.type === FundTransactionType.RECEIPT) {
        if (t.paymentMethod === PaymentMethod.CASH) {
          periodReceiptsCash += amt;
        } else {
          periodReceiptsBank += amt;
        }
        categoryBreakdown[t.category].receipts += amt;
      } else {
        if (t.paymentMethod === PaymentMethod.CASH) {
          periodPaymentsCash += amt;
        } else {
          periodPaymentsBank += amt;
        }
        categoryBreakdown[t.category].payments += amt;
      }
    }

    // 2. All-Time Totals for Live Balance (Tồn Quỹ Thực Tế Đến Hiện Tại)
    const allTimeWhere: any = { status: 'COMPLETED' };
    if (branchId && branchId !== 'all') {
      allTimeWhere.branchId = String(branchId);
    }

    const allTimeTransactions = await prisma.fundTransaction.findMany({
      where: allTimeWhere,
      select: {
        type: true,
        amount: true,
        paymentMethod: true,
      },
    });

    let allTimeReceiptsCash = 0;
    let allTimeReceiptsBank = 0;
    let allTimePaymentsCash = 0;
    let allTimePaymentsBank = 0;

    for (const t of allTimeTransactions) {
      const amt = Number(t.amount);
      if (t.type === FundTransactionType.RECEIPT) {
        if (t.paymentMethod === PaymentMethod.CASH) allTimeReceiptsCash += amt;
        else allTimeReceiptsBank += amt;
      } else {
        if (t.paymentMethod === PaymentMethod.CASH) allTimePaymentsCash += amt;
        else allTimePaymentsBank += amt;
      }
    }

    // Also include student receipts from orders if branch matches (Revenue from student fees)
    const installmentWhere: any = {
      status: 'PAID',
    };
    if (branchId && branchId !== 'all') {
      installmentWhere.order = { branchId: String(branchId) };
    }
    const studentPaidInstallments = await prisma.paymentInstallment.findMany({
      where: installmentWhere,
      select: {
        amount: true,
        paymentMethod: true,
      },
    });

    let studentReceiptsCash = 0;
    let studentReceiptsBank = 0;
    for (const inst of studentPaidInstallments) {
      const amt = Number(inst.amount);
      if (inst.paymentMethod === PaymentMethod.CASH) {
        studentReceiptsCash += amt;
      } else {
        studentReceiptsBank += amt;
      }
    }

    const liveCashBalance = (allTimeReceiptsCash + studentReceiptsCash) - allTimePaymentsCash;
    const liveBankBalance = (allTimeReceiptsBank + studentReceiptsBank) - allTimePaymentsBank;
    const liveTotalBalance = liveCashBalance + liveBankBalance;

    return res.json({
      success: true,
      data: {
        liveCashBalance,
        liveBankBalance,
        liveTotalBalance,
        period: {
          receiptsCash: periodReceiptsCash,
          receiptsBank: periodReceiptsBank,
          totalReceipts: periodReceiptsCash + periodReceiptsBank,
          paymentsCash: periodPaymentsCash,
          paymentsBank: periodPaymentsBank,
          totalPayments: periodPaymentsCash + periodPaymentsBank,
          netFlow: (periodReceiptsCash + periodReceiptsBank) - (periodPaymentsCash + periodPaymentsBank),
        },
        categoryBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fund summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/fund/transactions
 * Query vouchers with comprehensive filters
 */
fundRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      month,
      year,
      userId,
      search,
    } = req.query;

    const where: any = {};

    if (branchId && branchId !== 'all') {
      where.branchId = String(branchId);
    }

    if (type && type !== 'all') {
      where.type = type as FundTransactionType;
    }

    if (category && category !== 'all') {
      where.category = category as FundCategory;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod as PaymentMethod;
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    } else if (month && year) {
      const m = Number(month);
      const y = Number(year);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { recipientName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { referenceRef: { contains: q, mode: 'insensitive' } },
      ];
    }

    const transactions = await prisma.fundTransaction.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, fullName: true, role: true, phone: true } },
        creator: { select: { id: true, fullName: true } },
        payroll: { select: { id: true, month: true, year: true, netSalary: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 200,
    });

    return res.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/fund/transactions
 * Create a new Receipt or Payment voucher (Phiếu Thu / Phiếu Chi / Tạm Ứng Lương)
 */
fundRouter.post('/transactions', async (req: Request, res: Response) => {
  try {
    const {
      type, // RECEIPT or PAYMENT
      category,
      amount,
      paymentMethod = 'CASH',
      branchId,
      recipientName,
      recipientPhone,
      userId,
      targetMonth,
      targetYear,
      transactionDate,
      bankAccountInfo,
      referenceRef,
      proofImageUrl,
      description,
      createdById,
      approvedBy,
    } = req.body;

    if (!type || !category || !amount || !branchId || !recipientName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: Loại phiếu (Thu/Chi), Danh mục, Số tiền, Chi nhánh, Người nhận/nộp và Nội dung',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thu chi phải là số dương lớn hơn 0',
      });
    }

    // If salary advance (TAM_UNG_LUONG), user and target month/year are mandatory
    if (category === 'TAM_UNG_LUONG') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn nhân viên được tạm ứng lương',
        });
      }
      if (!targetMonth || !targetYear) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn tháng và năm của kỳ lương tạm ứng',
        });
      }
    }

    // Generate readable code
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typePrefix = category === 'TAM_UNG_LUONG' ? 'TU' : (type === 'RECEIPT' ? 'PT' : 'PC');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${typePrefix}-${datePrefix}-${randomSuffix}`;

    const newTransaction = await prisma.fundTransaction.create({
      data: {
        code,
        type: type as FundTransactionType,
        category: category as FundCategory,
        amount: numAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        branchId,
        recipientName: String(recipientName).trim(),
        recipientPhone: recipientPhone ? String(recipientPhone).trim() : null,
        userId: userId || null,
        targetMonth: targetMonth ? Number(targetMonth) : null,
        targetYear: targetYear ? Number(targetYear) : null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        bankAccountInfo: bankAccountInfo ? String(bankAccountInfo).trim() : null,
        referenceRef: referenceRef ? String(referenceRef).trim() : null,
        proofImageUrl: proofImageUrl || null,
        description: String(description).trim(),
        createdById: createdById || null,
        approvedBy: approvedBy || 'Kế toán trưởng',
        status: 'COMPLETED',
      },
      include: {
        branch: true,
        user: true,
        creator: true,
      },
    });

    const typeLabel = type === 'RECEIPT' ? 'Phiếu Thu' : (category === 'TAM_UNG_LUONG' ? 'Phiếu Tạm Ứng Lương' : 'Phiếu Chi');
    return res.status(201).json({
      success: true,
      data: newTransaction,
      message: `Đã lập ${typeLabel} ${code} thành công với số tiền ${numAmount.toLocaleString('vi-VN')} đ!`,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/fund/transactions/:id
 * Cancel / Delete voucher
 */
fundRouter.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tx = await prisma.fundTransaction.findUnique({
      where: { id },
      include: { payroll: true },
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chứng từ thu chi' });
    }

    if (tx.payrollId && tx.payroll?.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Chứng từ này gắn liền với Bảng lương đã hoàn tất chi trả. Không thể xóa trực tiếp!',
      });
    }

    await prisma.fundTransaction.delete({ where: { id } });

    return res.json({
      success: true,
      message: `Đã hủy chứng từ ${tx.code} thành công!`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
