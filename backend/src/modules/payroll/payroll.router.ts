import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { PayrollStatus, ContractType, AllowanceType } from '@prisma/client';

export const payrollRouter = Router();

// 1. Get Payroll List for a Month/Year (Wireframe 3 - Nửa Trên)
payrollRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { month = 10, year = 2026, branchId } = req.query;

    const payrolls = await prisma.payroll.findMany({
      where: {
        month: Number(month),
        year: Number(year),
        user: branchId ? { branchId: String(branchId) } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            contractType: true,
            baseSalary: true,
            standardMonthlyHours: true,
            hourlyTeachingRate: true,
            branch: { select: { id: true, name: true } },
          },
        },
        items: true,
      },
      orderBy: { netSalary: 'desc' },
    });

    return res.json({ success: true, data: payrolls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Calculate / Generate Payroll for all teachers in month (Wireframe 3 Calculation Engine)
payrollRouter.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { month = 10, year = 2026 } = req.body;

    const m = Number(month);
    const y = Number(year);

    // Get all system configs in PAYROLL category + bonus configs
    const payrollConfigs = await prisma.systemConfig.findMany({
      where: {
        OR: [
          { category: 'PAYROLL' },
          { key: { in: ['NEW_STUDENT_BONUS', 'ON_TIME_LEVELUP_BONUS'] } },
        ],
      },
    });

    const newStudentConfig = payrollConfigs.find((c) => c.key === 'NEW_STUDENT_BONUS');
    const levelUpConfig = payrollConfigs.find((c) => c.key === 'ON_TIME_LEVELUP_BONUS');

    const newStudentBonusUnit = newStudentConfig ? Number(newStudentConfig.value) : 200000;
    const levelUpBonusUnit = levelUpConfig ? Number(levelUpConfig.value) : 300000;

    // Fetch all active staff across roles (ADMIN, TEACHER, ACADEMIC_AFFAIRS, ACCOUNTANT, SALE)
    const staffMembers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: { branch: true },
    });

    const results = [];

    for (const staff of staffMembers) {
      let totalTeachingHours = 0;
      let totalAdminHours = 0;
      let workingSalary = 0;
      let newStudentCount = 0;
      let newStudentBonusAmount = 0;
      let onTimeLevelupCount = 0;
      let onTimeLevelupBonusAmount = 0;

      // 1. Calculate Hours & Base Working Salary
      if (staff.role === 'TEACHER') {
        // Teaching hours with GPS validation
        const sessions = await prisma.classSession.findMany({
          where: {
            teacherId: staff.id,
            isGpsValid: true,
            sessionStatus: 'COMPLETED',
            sessionDate: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        });
        totalTeachingHours = sessions.reduce((acc, s) => acc + Number(s.durationHours), 0);

        // Admin hours
        const timesheets = await prisma.adminTimesheet.findMany({
          where: {
            userId: staff.id,
            workDate: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        });
        totalAdminHours = timesheets.reduce((acc, t) => acc + Number(t.hoursWorked), 0);

        if (staff.contractType === ContractType.FULLTIME) {
          const stdHours = Number(staff.standardMonthlyHours) || 160;
          const totalActualHours = totalTeachingHours + totalAdminHours;
          workingSalary = totalActualHours > 0
            ? Math.round((Number(staff.baseSalary) / stdHours) * totalActualHours)
            : Number(staff.baseSalary);
        } else {
          // PARTTIME
          workingSalary = Math.round(totalTeachingHours * Number(staff.hourlyTeachingRate));
        }

        // Teacher KPI 1: New Student Count
        const newEnrollments = await prisma.enrollment.findMany({
          where: {
            assignedTeacherId: staff.id,
            createdAt: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        });
        newStudentCount = newEnrollments.length;
        newStudentBonusAmount = newStudentCount * newStudentBonusUnit;

        // Teacher KPI 2: On-time Level up count
        const onTimeEnrollments = await prisma.enrollment.findMany({
          where: {
            assignedTeacherId: staff.id,
            isOnTimeLevelUp: true,
            completionDate: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        });
        onTimeLevelupCount = onTimeEnrollments.length;
        onTimeLevelupBonusAmount = onTimeLevelupCount * levelUpBonusUnit;

      } else {
        // Non-TEACHER roles (ADMIN, ACADEMIC_AFFAIRS, ACCOUNTANT, SALE)
        const timesheets = await prisma.adminTimesheet.findMany({
          where: {
            userId: staff.id,
            workDate: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        });
        const recordedHours = timesheets.reduce((acc, t) => acc + Number(t.hoursWorked), 0);
        const stdHours = Number(staff.standardMonthlyHours) || 160;

        if (staff.contractType === ContractType.FULLTIME) {
          totalAdminHours = recordedHours > 0 ? recordedHours : stdHours;
          workingSalary = recordedHours > 0
            ? Math.round((Number(staff.baseSalary) / stdHours) * recordedHours)
            : Number(staff.baseSalary);
        } else {
          totalAdminHours = recordedHours;
          const hourlyRate = Number(staff.hourlyTeachingRate) || Math.round(Number(staff.baseSalary) / stdHours);
          workingSalary = Math.round(recordedHours * hourlyRate);
        }

        // Sale KPI: Converted leads
        if (staff.role === 'SALE') {
          const convertedLeads = await prisma.lead.count({
            where: {
              assignedUserId: staff.id,
              status: 'CONVERTED',
              createdAt: {
                gte: new Date(y, m - 1, 1),
                lt: new Date(y, m, 1),
              },
            },
          });
          newStudentCount = convertedLeads;
          newStudentBonusAmount = newStudentCount * newStudentBonusUnit;
        }
      }

      // 2. Calculate Allowances (Fixed Allowance + Dynamic SystemConfig Allowances)
      let totalAllowances = 0;
      const allowanceItems: any[] = [];

      // a. Fixed allowance from AllowanceConfig table if FULLTIME
      if (staff.contractType === ContractType.FULLTIME) {
        const fixedAllowance = await prisma.allowanceConfig.findFirst({
          where: { allowanceType: AllowanceType.FIXED_MONTHLY, isActive: true },
        });
        if (fixedAllowance) {
          totalAllowances += Number(fixedAllowance.defaultAmount);
          allowanceItems.push({
            allowanceConfigId: fixedAllowance.id,
            title: fixedAllowance.name,
            amount: fixedAllowance.defaultAmount,
            isDeduction: false,
            note: 'Phụ cấp cố định hàng tháng',
          });
        }
      }

      // b. Tự Động Áp Dụng Phụ Cấp Từ SystemConfig (VD: PHUCAP_QUANLY, PHUCAP_GIAOVU...)
      for (const cfg of payrollConfigs) {
        const keyUpper = cfg.key.toUpperCase();
        if (keyUpper.startsWith('PHUCAP_') || keyUpper.startsWith('ALLOWANCE_') || keyUpper.includes('PHUCAP')) {
          const amount = Number(cfg.value) || 0;
          if (amount <= 0) continue;

          let isApplicable = false;

          // 1. Quản lý / Ban Giám Đốc (ADMIN)
          if (
            staff.role === 'ADMIN' &&
            (keyUpper.includes('QUANLY') || keyUpper.includes('ADMIN') || keyUpper.includes('GIAMDOC') || keyUpper.includes('LEADER'))
          ) {
            isApplicable = true;
          }
          // 2. Giáo vụ (ACADEMIC_AFFAIRS)
          else if (
            staff.role === 'ACADEMIC_AFFAIRS' &&
            (keyUpper.includes('GIAOVU') || keyUpper.includes('ACADEMIC') || keyUpper.includes('DAOTAO'))
          ) {
            isApplicable = true;
          }
          // 3. Kế toán (ACCOUNTANT)
          else if (
            staff.role === 'ACCOUNTANT' &&
            (keyUpper.includes('KETOAN') || keyUpper.includes('THUNGAN') || keyUpper.includes('ACCOUNTANT'))
          ) {
            isApplicable = true;
          }
          // 4. Tuyển sinh / Sales (SALE)
          else if (
            staff.role === 'SALE' &&
            (keyUpper.includes('SALE') || keyUpper.includes('TUVAN') || keyUpper.includes('TUYENSINH'))
          ) {
            isApplicable = true;
          }
          // 5. Giáo viên (TEACHER)
          else if (
            staff.role === 'TEACHER' &&
            (keyUpper.includes('GIAOVIEN') || keyUpper.includes('TEACHER'))
          ) {
            isApplicable = true;
          }
          // 6. Phụ cấp chung cho nhân sự Fulltime (Ăn trưa, xăng xe, điện thoại, chuyên cần)
          else if (
            staff.contractType === ContractType.FULLTIME &&
            (keyUpper.includes('AN_TRUA') || keyUpper.includes('XANG_XE') || keyUpper.includes('DIEN_THOAI') || keyUpper.includes('CHUYEN_CAN') || keyUpper.includes('CHUNG'))
          ) {
            isApplicable = true;
          }

          if (isApplicable) {
            totalAllowances += amount;
            allowanceItems.push({
              allowanceConfigId: null,
              title: cfg.description || cfg.key,
              amount: amount,
              isDeduction: false,
              note: `Tự động trích xuất từ tham số hệ thống: ${cfg.key}`,
            });
          }
        }
      }

      const totalDeductions = 0;
      const netSalary = workingSalary + newStudentBonusAmount + onTimeLevelupBonusAmount + totalAllowances - totalDeductions;

      // Upsert payroll
      const payroll = await prisma.payroll.upsert({
        where: { userId_month_year: { userId: staff.id, month: m, year: y } },
        update: {
          contractTypeSnapshot: staff.contractType,
          totalTeachingHours,
          totalAdminHours,
          workingSalaryAmount: workingSalary,
          newStudentCount,
          newStudentBonusAmount,
          onTimeLevelupCount,
          onTimeLevelupBonusAmount,
          totalOptionalAllowances: totalAllowances,
          totalDeductions,
          netSalary,
        },
        create: {
          userId: staff.id,
          month: m,
          year: y,
          contractTypeSnapshot: staff.contractType,
          totalTeachingHours,
          totalAdminHours,
          workingSalaryAmount: workingSalary,
          newStudentCount,
          newStudentBonusAmount,
          onTimeLevelupCount,
          onTimeLevelupBonusAmount,
          totalOptionalAllowances: totalAllowances,
          totalDeductions,
          netSalary,
          status: PayrollStatus.DRAFT,
        },
      });

      // Synchronize payroll items (delete old items and insert fresh ones)
      await prisma.payrollItem.deleteMany({ where: { payrollId: payroll.id } });
      if (allowanceItems.length > 0) {
        await prisma.payrollItem.createMany({
          data: allowanceItems.map((item) => ({
            payrollId: payroll.id,
            allowanceConfigId: item.allowanceConfigId || null,
            title: item.title,
            amount: item.amount,
            isDeduction: item.isDeduction,
            note: item.note,
          })),
        });
      }

      const fullPayroll = await prisma.payroll.findUnique({
        where: { id: payroll.id },
        include: { items: true, user: true },
      });

      results.push(fullPayroll);
    }

    return res.json({
      success: true,
      data: results,
      message: `Đã tính toán bảng lương tháng ${m}/${y} cho ${results.length} nhân sự (Quản lý, Giáo viên, Nhân viên hành chính)!`,
    });
  } catch (error: any) {
    console.error('Calculate payroll error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Add Custom Allowance / Deduction Item to Payroll (Wireframe 3 - Nút Thêm Phụ Cấp)
payrollRouter.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, isDeduction = false, note } = req.body;

    const item = await prisma.payrollItem.create({
      data: {
        payrollId: id,
        title,
        amount: Number(amount),
        isDeduction: Boolean(isDeduction),
        note,
      },
    });

    // Recompute total allowances and net salary
    const allItems = await prisma.payrollItem.findMany({ where: { payrollId: id } });
    const totalAllowances = allItems.filter((i) => !i.isDeduction).reduce((acc, i) => acc + Number(i.amount), 0);
    const totalDeductions = allItems.filter((i) => i.isDeduction).reduce((acc, i) => acc + Number(i.amount), 0);

    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (payroll) {
      const netSalary =
        Number(payroll.workingSalaryAmount) +
        Number(payroll.newStudentBonusAmount) +
        Number(payroll.onTimeLevelupBonusAmount) +
        totalAllowances -
        totalDeductions;

      await prisma.payroll.update({
        where: { id },
        data: {
          totalOptionalAllowances: totalAllowances,
          totalDeductions,
          netSalary,
        },
      });
    }

    return res.json({ success: true, data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Approve & Send Payslip to Teacher App (Wireframe 3 - Duyệt & Gửi Phiếu Lương)
payrollRouter.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payroll = await prisma.payroll.update({
      where: { id },
      data: { status: PayrollStatus.APPROVED },
      include: { user: true },
    });

    return res.json({
      success: true,
      data: payroll,
      message: `Đã phê duyệt và phát hành phiếu lương thành công cho Giáo viên ${payroll.user.fullName}!`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
