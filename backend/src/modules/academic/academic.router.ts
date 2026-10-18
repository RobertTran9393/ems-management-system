import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AssessmentType, EnrollmentStatus } from '@prisma/client';
import { eventBus, DomainEvent } from '../../events/event-bus';

export const academicRouter = Router();

// 1. Get Enrollments with Full Progress Pipeline (Wireframe 2)
academicRouter.get('/enrollments', async (req: Request, res: Response) => {
  try {
    const { studentId, classId, status } = req.query;
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId ? String(studentId) : undefined,
        currentClassId: classId ? String(classId) : undefined,
        status: status ? (status as EnrollmentStatus) : undefined,
      },
      include: {
        student: true,
        course: true,
        combo: true,
        currentClass: true,
        assessments: { orderBy: { sessionNumber: 'asc' } },
        reservations: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: enrollments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Single Enrollment Detail
academicRouter.get('/enrollments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        combo: {
          include: {
            items: { include: { course: true }, orderBy: { sequenceOrder: 'asc' } },
          },
        },
        currentClass: {
          include: {
            mainTeacher: true,
            sessions: { orderBy: { sessionNumber: 'asc' } },
          },
        },
        assessments: true,
        reservations: true,
        attendances: {
          include: { classSession: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
    }

    return res.json({ success: true, data: enrollment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Create Reservation (Bảo lưu tối đa 90 ngày)
academicRouter.post('/enrollments/:id/reservation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason, approvedBy } = req.body;

    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      return res.status(400).json({ success: false, message: 'Thời gian bảo lưu vượt quá 90 ngày (tối đa 3 tháng theo quy định)' });
    }

    const reservation = await prisma.reservation.create({
      data: {
        enrollmentId: id,
        studentId: enrollment.studentId,
        startDate: start,
        endDate: end,
        extendedDays: diffDays,
        reason,
        approvedBy: approvedBy || 'Giáo vụ',
      },
    });

    // Update enrollment status to RESERVED
    await prisma.enrollment.update({
      where: { id },
      data: { status: EnrollmentStatus.RESERVED },
    });

    eventBus.publish(DomainEvent.RESERVATION_CREATED, { enrollmentId: id, diffDays });

    return res.json({ success: true, data: reservation });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Resume From Reservation (Học viên đi học lại -> Tự động bù ngày vào Max_Expired_Date)
academicRouter.post('/reservations/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { enrollment: true },
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo lưu' });
    }

    const actualResumeDate = new Date();
    const actualDays = Math.max(1, Math.ceil((actualResumeDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    await prisma.reservation.update({
      where: { id },
      data: {
        actualResumeDate,
        extendedDays: actualDays,
        status: 'RESUMED',
      },
    });

    // Extend Max_Expired_Date by actual reserved days
    const currentMax = new Date(reservation.enrollment.maxExpiredDate || reservation.enrollment.createdAt);
    currentMax.setDate(currentMax.getDate() + actualDays);

    await prisma.enrollment.update({
      where: { id: reservation.enrollmentId },
      data: {
        status: EnrollmentStatus.ACTIVE,
        maxExpiredDate: currentMax,
      },
    });

    eventBus.publish(DomainEvent.RESERVATION_RESUMED, {
      enrollmentId: reservation.enrollmentId,
      actualDays,
      newMaxExpiredDate: currentMax,
    });

    return res.json({ success: true, message: 'Đã mở lại khoá học và gia hạn ngày hết hạn tối đa', actualDays, newMaxExpiredDate: currentMax });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Submit Assessment (Buổi 1, 12, 24)
academicRouter.post('/enrollments/:id/assessments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId, testType, sessionNumber, score, evaluationDetails, isPassed, attachmentUrls } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoá học của học viên' });
    }

    const assessment = await prisma.studentAssessment.upsert({
      where: { enrollmentId_testType: { enrollmentId: id, testType: testType as AssessmentType } },
      update: {
        score: Number(score),
        evaluationDetails,
        isPassed: Boolean(isPassed),
        attachmentUrls: attachmentUrls || [],
      },
      create: {
        enrollmentId: id,
        studentId: enrollment.studentId,
        teacherId,
        testType: testType as AssessmentType,
        sessionNumber: Number(sessionNumber),
        score: Number(score),
        evaluationDetails,
        isPassed: Boolean(isPassed),
        attachmentUrls: attachmentUrls || [],
      },
    });

    // If Final Test (Buổi 24) is passed
    if (testType === 'FINAL_TEST') {
      const completionDate = new Date();
      const standardDeadline = enrollment.standardDeadlineDate ? new Date(enrollment.standardDeadlineDate) : null;
      const isOnTime = standardDeadline ? completionDate <= standardDeadline : false;

      await prisma.enrollment.update({
        where: { id },
        data: {
          isQualifiedForNextLevel: Boolean(isPassed),
          isOnTimeLevelUp: isOnTime && Boolean(isPassed),
          completionDate: Boolean(isPassed) ? completionDate : null,
          status: Boolean(isPassed) ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
        },
      });

      if (isPassed) {
        eventBus.publish(DomainEvent.COURSE_COMPLETED_AND_PASSED, {
          enrollmentId: id,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          finalScore: Number(score),
          isPassed: true,
        });
      }
    }

    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Activate Next Course in Combo (Wireframe 2 - Nút Kích Hoạt Khoá Kế Tiếp)
academicRouter.post('/enrollments/:id/activate-next-combo', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newClassId } = req.body;

    const currentEnrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { combo: true },
    });

    if (!currentEnrollment || !currentEnrollment.comboId || !currentEnrollment.sequenceInCombo) {
      return res.status(400).json({ success: false, message: 'Học viên không thuộc gói Combo hoặc không hợp lệ' });
    }

    if (!currentEnrollment.isQualifiedForNextLevel) {
      return res.status(400).json({ success: false, message: 'Học viên chưa PASS bài kiểm tra cuối khoá (Buổi 24), không đủ điều kiện kích hoạt khoá tiếp theo' });
    }

    const nextSeq = currentEnrollment.sequenceInCombo + 1;
    const nextEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: currentEnrollment.studentId,
        comboId: currentEnrollment.comboId,
        sequenceInCombo: nextSeq,
        status: EnrollmentStatus.WAITING_IN_QUEUE,
      },
    });

    if (!nextEnrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoá học tiếp theo trong hàng đợi Combo' });
    }

    const activationDate = new Date();
    const stdDeadline = new Date(activationDate);
    stdDeadline.setMonth(stdDeadline.getMonth() + 3);
    const maxExp = new Date(activationDate);
    maxExp.setMonth(maxExp.getMonth() + 4);

    const activated = await prisma.enrollment.update({
      where: { id: nextEnrollment.id },
      data: {
        status: EnrollmentStatus.ACTIVE,
        currentClassId: newClassId || null,
        activationDate,
        standardDeadlineDate: stdDeadline,
        maxExpiredDate: maxExp,
      },
    });

    return res.json({ success: true, data: activated, message: `Đã kích hoạt thành công Khoá ${nextSeq} trong Combo!` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
