import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { EnrollmentStatus, OrderStatus, InstallmentStatus } from '@prisma/client';

export const dashboardRouter = Router();

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  intervals: { label: string; start: Date; end: Date }[];
}

/**
 * Helper to compute date bounds and chart intervals
 */
function getDateRange(period: string, refDateStr?: string, customStart?: string, customEnd?: string): DateRange {
  const ref = refDateStr ? new Date(refDateStr) : new Date();
  const y = ref.getFullYear();
  const m = ref.getMonth(); // 0-11
  const d = ref.getDate();

  let start: Date;
  let end: Date;
  let prevStart: Date;
  let prevEnd: Date;
  const intervals: { label: string; start: Date; end: Date }[] = [];

  if (period === 'day') {
    start = new Date(y, m, d, 0, 0, 0, 0);
    end = new Date(y, m, d, 23, 59, 59, 999);
    prevStart = new Date(y, m, d - 1, 0, 0, 0, 0);
    prevEnd = new Date(y, m, d - 1, 23, 59, 59, 999);

    // 6 time buckets during daytime
    const hours = [
      { label: '07h-10h', h1: 7, h2: 10 },
      { label: '10h-12h', h1: 10, h2: 12 },
      { label: '12h-15h', h1: 12, h2: 15 },
      { label: '15h-17h', h1: 15, h2: 17 },
      { label: '17h-19h', h1: 17, h2: 19 },
      { label: '19h-22h', h1: 19, h2: 22 },
    ];
    for (const h of hours) {
      intervals.push({
        label: h.label,
        start: new Date(y, m, d, h.h1, 0, 0, 0),
        end: new Date(y, m, d, h.h2, 0, 0, 0),
      });
    }
  } else if (period === 'week') {
    const dayOfWeek = ref.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start = new Date(y, m, d + diffToMonday, 0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 7);
    prevEnd = new Date(prevStart);
    prevEnd.setDate(prevStart.getDate() + 6);
    prevEnd.setHours(23, 59, 59, 999);

    const weekLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    for (let i = 0; i < 7; i++) {
      const curDayStart = new Date(start);
      curDayStart.setDate(start.getDate() + i);
      const curDayEnd = new Date(curDayStart);
      curDayEnd.setHours(23, 59, 59, 999);
      intervals.push({
        label: `${weekLabels[i]} (${curDayStart.getDate()}/${curDayStart.getMonth() + 1})`,
        start: curDayStart,
        end: curDayEnd,
      });
    }
  } else if (period === 'year') {
    start = new Date(y, 0, 1, 0, 0, 0, 0);
    end = new Date(y, 11, 31, 23, 59, 59, 999);
    prevStart = new Date(y - 1, 0, 1, 0, 0, 0, 0);
    prevEnd = new Date(y - 1, 11, 31, 23, 59, 59, 999);

    for (let mo = 0; mo < 12; mo++) {
      const moStart = new Date(y, mo, 1, 0, 0, 0, 0);
      const moEnd = new Date(y, mo + 1, 0, 23, 59, 59, 999);
      intervals.push({
        label: `Thg ${mo + 1}`,
        start: moStart,
        end: moEnd,
      });
    }
  } else if (period === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    const duration = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);

    // Split custom range into 4 equal segments
    const step = Math.floor(duration / 4);
    for (let i = 0; i < 4; i++) {
      const segStart = new Date(start.getTime() + i * step);
      const segEnd = i === 3 ? end : new Date(start.getTime() + (i + 1) * step - 1);
      intervals.push({
        label: `${segStart.getDate()}/${segStart.getMonth() + 1} - ${segEnd.getDate()}/${segEnd.getMonth() + 1}`,
        start: segStart,
        end: segEnd,
      });
    }
  } else {
    // Default: 'month'
    start = new Date(y, m, 1, 0, 0, 0, 0);
    end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    prevStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(y, m, 0, 23, 59, 59, 999);

    // 4 weeks of the month
    const totalDays = end.getDate();
    intervals.push({
      label: 'Tuần 1 (1-7)',
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(y, m, 7, 23, 59, 59, 999),
    });
    intervals.push({
      label: 'Tuần 2 (8-14)',
      start: new Date(y, m, 8, 0, 0, 0, 0),
      end: new Date(y, m, 14, 23, 59, 59, 999),
    });
    intervals.push({
      label: 'Tuần 3 (15-21)',
      start: new Date(y, m, 15, 0, 0, 0, 0),
      end: new Date(y, m, 21, 23, 59, 59, 999),
    });
    intervals.push({
      label: `Tuần 4 (22-${totalDays})`,
      start: new Date(y, m, 22, 0, 0, 0, 0),
      end: new Date(y, m, totalDays, 23, 59, 59, 999),
    });
  }

  return { start, end, prevStart, prevEnd, intervals };
}

/**
 * GET /api/dashboard/metrics
 * Main analytical API for Admin, Managers, and Teachers
 */
dashboardRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const {
      period = 'month',
      date,
      startDate,
      endDate,
      branchId = 'all',
      teacherId,
      scope = 'all', // 'all' or 'mine'
    } = req.query;

    const authUser = req.user;
    const isTeacher = authUser?.role === 'TEACHER';
    const effectiveTeacherId = isTeacher ? authUser.userId : (teacherId as string | undefined);
    const effectiveBranchId = (branchId === 'all' || !branchId) ? undefined : String(branchId);

    const teacherUser = effectiveTeacherId
      ? await prisma.user.findUnique({ where: { id: effectiveTeacherId }, select: { fullName: true } })
      : null;

    // 1. Calculate Date Bounds
    const dateRange = getDateRange(
      String(period),
      date ? String(date) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );

    const { start, end, prevStart, prevEnd, intervals } = dateRange;

    // 2. Fetch Branches
    const branches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, code: true, name: true },
    });

    // 3. Compute Metrics for CURRENT Period & PREVIOUS Period
    // --- 3.1. DOANH THU (Revenue) ---
    // Orders in current period
    const orderWhere: any = {
      createdAt: { gte: start, lte: end },
    };
    if (effectiveBranchId) {
      orderWhere.branchId = effectiveBranchId;
    }
    if (effectiveTeacherId) {
      const teacherClassCourses = await prisma.class.findMany({
        where: { mainTeacherId: effectiveTeacherId },
        select: { courseId: true },
      });
      const courseIds = teacherClassCourses.map((c) => c.courseId);

      orderWhere.OR = [
        { createdById: effectiveTeacherId },
        ...(teacherUser?.fullName ? [{ cashierName: teacherUser.fullName }] : []),
        ...(courseIds.length > 0 ? [{ items: { some: { referenceId: { in: courseIds } } } }] : []),
      ];
    }

    const currentOrders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderCode: true,
        finalTotal: true,
        paidAmount: true,
        remainingDebt: true,
        paymentStatus: true,
        createdAt: true,
        branchId: true,
        createdById: true,
        items: { select: { itemType: true, totalPrice: true } },
      },
    });

    // Collected cash installments in current period
    const installmentWhere: any = {
      status: InstallmentStatus.PAID,
      paidAt: { gte: start, lte: end },
    };
    if (effectiveBranchId) {
      installmentWhere.order = { branchId: effectiveBranchId };
    }
    if (effectiveTeacherId) {
      installmentWhere.confirmedBy = effectiveTeacherId;
    }

    const currentInstallments = await prisma.paymentInstallment.findMany({
      where: installmentWhere,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        paymentMethod: true,
        order: { select: { branchId: true } },
      },
    });

    const totalRevenueCurrent = currentOrders.reduce((sum, o) => sum + Number(o.paidAmount), 0);
    const totalOrderValueCurrent = currentOrders.reduce((sum, o) => sum + Number(o.finalTotal), 0);
    const totalDebtCurrent = currentOrders.reduce((sum, o) => sum + Number(o.remainingDebt), 0);

    // Previous period revenue for growth calculation
    const prevOrderWhere: any = {
      createdAt: { gte: prevStart, lte: prevEnd },
    };
    if (effectiveBranchId) prevOrderWhere.branchId = effectiveBranchId;
    if (effectiveTeacherId) {
      prevOrderWhere.OR = [{ createdById: effectiveTeacherId }];
    }
    const prevOrders = await prisma.order.findMany({
      where: prevOrderWhere,
      select: { paidAmount: true },
    });
    const totalRevenuePrev = prevOrders.reduce((sum, o) => sum + Number(o.paidAmount), 0);

    // --- 3.2. SỐ HỌC VIÊN ĐANG HỌC (Active Students) ---
    const activeEnrollmentWhere: any = {
      status: EnrollmentStatus.ACTIVE,
    };
    if (effectiveBranchId) {
      activeEnrollmentWhere.student = { branchId: effectiveBranchId };
    }
    if (effectiveTeacherId) {
      activeEnrollmentWhere.OR = [
        { assignedTeacherId: effectiveTeacherId },
        { currentClass: { mainTeacherId: effectiveTeacherId } },
      ];
    }

    const activeEnrollments = await prisma.enrollment.findMany({
      where: activeEnrollmentWhere,
      select: {
        id: true,
        studentId: true,
        courseId: true,
        student: { select: { branchId: true } },
        course: { select: { subjectType: true, name: true } },
      },
    });

    const uniqueActiveStudentIds = new Set(activeEnrollments.map((e) => e.studentId));
    const activeStudentsCount = uniqueActiveStudentIds.size;
    const activeEnrollmentsCount = activeEnrollments.length;

    // --- 3.3. SỐ HỌC VIÊN HOÀN TẤT KHOÁ TRONG KỲ (Completed Students) ---
    const completedEnrollmentWhere: any = {
      status: EnrollmentStatus.COMPLETED,
      completionDate: { gte: start, lte: end },
    };
    if (effectiveBranchId) {
      completedEnrollmentWhere.student = { branchId: effectiveBranchId };
    }
    if (effectiveTeacherId) {
      completedEnrollmentWhere.OR = [
        { assignedTeacherId: effectiveTeacherId },
        { currentClass: { mainTeacherId: effectiveTeacherId } },
      ];
    }

    const completedEnrollments = await prisma.enrollment.findMany({
      where: completedEnrollmentWhere,
      select: {
        id: true,
        studentId: true,
        completionDate: true,
        isOnTimeLevelUp: true,
        student: { select: { id: true, fullName: true, studentCode: true, branchId: true } },
        course: { select: { name: true } },
      },
      orderBy: { completionDate: 'desc' },
    });

    const completedStudentsCount = new Set(completedEnrollments.map((e) => e.studentId)).size;
    const onTimeLevelUpCount = completedEnrollments.filter((e) => e.isOnTimeLevelUp).length;

    // Previous period completed for growth
    const prevCompletedWhere: any = {
      status: EnrollmentStatus.COMPLETED,
      completionDate: { gte: prevStart, lte: prevEnd },
    };
    if (effectiveBranchId) prevCompletedWhere.student = { branchId: effectiveBranchId };
    if (effectiveTeacherId) {
      prevCompletedWhere.OR = [
        { assignedTeacherId: effectiveTeacherId },
        { currentClass: { mainTeacherId: effectiveTeacherId } },
      ];
    }
    const prevCompleted = await prisma.enrollment.findMany({
      where: prevCompletedWhere,
      select: { studentId: true },
    });
    const completedStudentsPrev = new Set(prevCompleted.map((e) => e.studentId)).size;

    // --- 3.4. SỐ HỌC VIÊN MỚI TRONG KỲ (New Students) ---
    let newStudentsCount = 0;
    let recentNewStudentsList: any[] = [];

    if (effectiveTeacherId) {
      // New enrollments assigned to this teacher in this period
      const newTeacherEnrollments = await prisma.enrollment.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          OR: [
            { assignedTeacherId: effectiveTeacherId },
            { currentClass: { mainTeacherId: effectiveTeacherId } },
          ],
        },
        select: {
          id: true,
          studentId: true,
          createdAt: true,
          student: { select: { id: true, fullName: true, studentCode: true, parentPhone: true, branchId: true } },
          course: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      newStudentsCount = new Set(newTeacherEnrollments.map((e) => e.studentId)).size;
      recentNewStudentsList = newTeacherEnrollments.slice(0, 5).map((e) => ({
        id: e.student.id,
        fullName: e.student.fullName,
        studentCode: e.student.studentCode,
        parentPhone: e.student.parentPhone,
        courseName: e.course?.name,
        createdAt: e.createdAt,
      }));
    } else {
      const studentWhere: any = {
        createdAt: { gte: start, lte: end },
      };
      if (effectiveBranchId) studentWhere.branchId = effectiveBranchId;

      const newStudents = await prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          parentPhone: true,
          branchId: true,
          createdAt: true,
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      newStudentsCount = newStudents.length;
      recentNewStudentsList = newStudents.slice(0, 5);
    }

    // Previous new students
    let newStudentsPrev = 0;
    if (effectiveTeacherId) {
      const prevTeEnrollments = await prisma.enrollment.findMany({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd },
          OR: [
            { assignedTeacherId: effectiveTeacherId },
            { currentClass: { mainTeacherId: effectiveTeacherId } },
          ],
        },
        select: { studentId: true },
      });
      newStudentsPrev = new Set(prevTeEnrollments.map((e) => e.studentId)).size;
    } else {
      const prevStudentWhere: any = { createdAt: { gte: prevStart, lte: prevEnd } };
      if (effectiveBranchId) prevStudentWhere.branchId = effectiveBranchId;
      newStudentsPrev = await prisma.student.count({ where: prevStudentWhere });
    }

    // --- 4. TREND CHART DATA (Chuỗi thời gian) ---
    const trendData = [];
    for (const interval of intervals) {
      // Revenue in interval
      const intervalOrders = currentOrders.filter(
        (o) => o.createdAt >= interval.start && o.createdAt <= interval.end
      );
      const intervalRev = intervalOrders.reduce((sum, o) => sum + Number(o.paidAmount), 0);

      // Completed in interval
      const intervalCompleted = completedEnrollments.filter(
        (e) => e.completionDate && e.completionDate >= interval.start && e.completionDate <= interval.end
      );

      // New enrollments/students in interval
      const intervalNew = await prisma.enrollment.count({
        where: {
          createdAt: { gte: interval.start, lte: interval.end },
          ...(effectiveBranchId ? { student: { branchId: effectiveBranchId } } : {}),
          ...(effectiveTeacherId
            ? {
                OR: [
                  { assignedTeacherId: effectiveTeacherId },
                  { currentClass: { mainTeacherId: effectiveTeacherId } },
                ],
              }
            : {}),
        },
      });

      trendData.push({
        label: interval.label,
        revenue: intervalRev,
        newStudents: intervalNew,
        completedStudents: intervalCompleted.length,
      });
    }

    // --- 5. BREAKDOWN BY BRANCH (Khi xem tổng thể hoặc so sánh) ---
    const branchBreakdown = [];
    for (const b of branches) {
      const bOrders = currentOrders.filter((o) => o.branchId === b.id);
      const bRev = bOrders.reduce((sum, o) => sum + Number(o.paidAmount), 0);
      const bActive = activeEnrollments.filter((e) => e.student.branchId === b.id).length;
      const bCompleted = completedEnrollments.filter((e) => e.student.branchId === b.id).length;

      branchBreakdown.push({
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        revenue: bRev,
        activeStudents: bActive,
        completedStudents: bCompleted,
      });
    }

    // --- 6. BREAKDOWN BY SUBJECT / PRODUCT ---
    let toanCount = 0;
    let kyNangCount = 0;
    let productCount = 0;
    let toanRevenue = 0;
    let kyNangRevenue = 0;
    let productRevenue = 0;

    for (const order of currentOrders) {
      for (const item of order.items) {
        const val = Number(item.totalPrice);
        if (item.itemType === 'PRODUCT') {
          productCount++;
          productRevenue += val;
        } else if (item.itemType === 'COURSE' || item.itemType === 'COMBO') {
          toanCount++;
          toanRevenue += val;
        }
      }
    }

    for (const enr of activeEnrollments) {
      if (enr.course?.subjectType === 'TOAN_TRI_TUE') {
        toanCount++;
      } else if (enr.course?.subjectType === 'KY_NANG_SONG') {
        kyNangCount++;
      }
    }

    // --- 7. RECENT RECEIPTS / ORDERS ---
    const recentOrders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderCode: true,
        finalTotal: true,
        paidAmount: true,
        paymentStatus: true,
        createdAt: true,
        cashierName: true,
        student: { select: { fullName: true, studentCode: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Helper for percentage growth
    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenueCurrent,
          revenueGrowth: calcGrowth(totalRevenueCurrent, totalRevenuePrev),
          totalOrderValue: totalOrderValueCurrent,
          remainingDebt: totalDebtCurrent,
          paymentCollectionRate: totalOrderValueCurrent > 0 ? Math.round((totalRevenueCurrent / totalOrderValueCurrent) * 100) : 100,

          activeStudentsCount,
          activeEnrollmentsCount,

          completedStudentsCount,
          completedGrowth: calcGrowth(completedStudentsCount, completedStudentsPrev),
          onTimeLevelUpCount,

          newStudentsCount,
          newStudentsGrowth: calcGrowth(newStudentsCount, newStudentsPrev),
        },
        meta: {
          period,
          dateRangeFormatted: `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`,
          selectedBranchId: effectiveBranchId || 'all',
          isTeacherScope: Boolean(effectiveTeacherId),
          teacherName: teacherUser ? teacherUser.fullName : null,
          role: authUser?.role || 'ADMIN',
        },
        trendData,
        branchBreakdown,
        subjectBreakdown: [
          { name: 'Toán Trí Tuệ (SBR)', count: toanCount, revenue: toanRevenue },
          { name: 'Kỹ Năng Sống', count: kyNangCount, revenue: kyNangRevenue },
          { name: 'Sách & Học Phẩm', count: productCount, revenue: productRevenue },
        ],
        recentActivities: {
          orders: recentOrders,
          newStudents: recentNewStudentsList,
          completedEnrollments: completedEnrollments.slice(0, 5),
        },
        branches,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
