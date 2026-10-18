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

    // Get configs
    const newStudentConfig = await prisma.systemConfig.findUnique({ where: { key: 'NEW_STUDENT_BONUS' } });
    const levelUpConfig = await prisma.systemConfig.findUnique({ where: { key: 'ON_TIME_LEVELUP_BONUS' } });

    const newStudentBonusUnit = newStudentConfig ? Number(newStudentConfig.value) : 200000;
    const levelUpBonusUnit = levelUpConfig ? Number(levelUpConfig.value) : 300000;

    // Fetch teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', status: 'ACTIVE' },
    });

    const results = [];

    for (const teacher of teachers) {
      // 1. Calculate Teaching Hours with GPS validation
      const sessions = await prisma.classSession.findMany({
        where: {
          teacherId: teacher.id,
          isGpsValid: true,
          sessionStatus: 'COMPLETED',
          sessionDate: {
            gte: new Date(y, m - 1, 1),
            lt: new Date(y, m, 1),
          },
        },
      });

      const totalTeachingHours = sessions.reduce((acc, s) => acc + Number(s.durationHours), 0);

      // Admin hours
      const timesheets = await prisma.adminTimesheet.findMany({
        where: {
          userId: teacher.id,
          workDate: {
            gte: new Date(y, m - 1, 1),
            lt: new Date(y, m, 1),
          },
        },
      });
      const totalAdminHours = timesheets.reduce((acc, t) => acc + Number(t.hoursWorked), 0);

      // Working salary
      let workingSalary = 0;
      if (teacher.contractType === ContractType.FULLTIME) {
        const stdHours = Number(teacher.standardMonthlyHours) || 160;
        const totalActualHours = totalTeachingHours + totalAdminHours;
        workingSalary = Math.round((Number(teacher.baseSalary) / stdHours) * totalActualHours);
      } else {
        // PARTTIME
        workingSalary = Math.round(totalTeachingHours * Number(teacher.hourlyTeachingRate));
      }

      // 2. KPI: New Student Count (leads converted or new enrollments assigned this month)
      const newEnrollments = await prisma.enrollment.findMany({
        where: {
          assignedTeacherId: teacher.id,
          createdAt: {
            gte: new Date(y, m - 1, 1),
            lt: new Date(y, m, 1),
          },
        },
      });
      const newStudentCount = newEnrollments.length;
      const newStudentBonusAmount = newStudentCount * newStudentBonusUnit;

      // 3. KPI: On-time Level up count (satisfies 4 conditions)
      const onTimeEnrollments = await prisma.enrollment.findMany({
        where: {
          assignedTeacherId: teacher.id,
          isOnTimeLevelUp: true,
          completionDate: {
            gte: new Date(y, m - 1, 1),
            lt: new Date(y, m, 1),
          },
        },
      });
      const onTimeLevelupCount = onTimeEnrollments.length;
      const onTimeLevelupBonusAmount = onTimeLevelupCount * levelUpBonusUnit;

      // 4. Default Allowances (Fixed monthly if Fulltime)
      let totalAllowances = 0;
      const allowanceItems: any[] = [];

      if (teacher.contractType === ContractType.FULLTIME) {
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
          });
        }
      }

      const totalDeductions = 0;
      const netSalary = workingSalary + newStudentBonusAmount + onTimeLevelupBonusAmount + totalAllowances - totalDeductions;

      // Upsert payroll
      const payroll = await prisma.payroll.upsert({
        where: { userId_month_year: { userId: teacher.id, month: m, year: y } },
        update: {
          contractTypeSnapshot: teacher.contractType,
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
          userId: teacher.id,
          month: m,
          year: y,
          contractTypeSnapshot: teacher.contractType,
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
          items: { create: allowanceItems },
        },
        include: { items: true, user: true },
      });

      results.push(payroll);
    }

    return res.json({ success: true, data: results, message: `Đã tính toán bảng lương tháng ${m}/${y} cho ${results.length} giáo viên` });
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
