import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AttendanceStatus, AttendanceType } from '@prisma/client';
import { eventBus, DomainEvent } from '../../events/event-bus';

export const attendanceRouter = Router();

// Haversine Formula: Calculate distance between two GPS coordinates in meters
function calculateGpsDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 1. Get Teacher's Sessions for Day/Week (Mobile Screen 1)
attendanceRouter.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { teacherId, date } = req.query;
    const targetDate = date ? new Date(String(date)) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const sessions = await prisma.classSession.findMany({
      where: {
        teacherId: teacherId ? String(teacherId) : undefined,
      },
      include: {
        class: {
          include: {
            branch: true,
            course: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { student: true },
            },
          },
        },
        attendances: { include: { student: true } },
      },
      orderBy: { sessionDate: 'asc' },
    });

    return res.json({ success: true, data: sessions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Check-in GPS (Mobile Screen 1 - Header Check-in)
attendanceRouter.post('/sessions/:id/checkin-gps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: {
        class: { include: { branch: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ca học' });
    }

    const branch = session.class.branch;
    const distanceMeters = calculateGpsDistanceMeters(
      Number(lat),
      Number(lng),
      Number(branch.gpsLatitude),
      Number(branch.gpsLongitude)
    );

    const isGpsValid = distanceMeters <= branch.gpsRadiusMeters;

    const updated = await prisma.classSession.update({
      where: { id },
      data: {
        checkinTime: new Date(),
        checkinLat: Number(lat),
        checkinLng: Number(lng),
        isGpsValid,
      },
    });

    eventBus.publish(DomainEvent.SESSION_CHECKIN_GPS, {
      sessionId: id,
      teacherId: session.teacherId,
      distanceMeters,
      isGpsValid,
    });

    return res.json({
      success: true,
      data: updated,
      distanceMeters,
      allowedRadius: branch.gpsRadiusMeters,
      isGpsValid,
      message: isGpsValid
        ? `Định vị GPS hợp lệ (Khoảng cách: ${distanceMeters}m / Bán kính cho phép: ${branch.gpsRadiusMeters}m). Đã mở khoá danh sách điểm danh!`
        : `Bạn đang ở cách cơ sở ${distanceMeters}m (Vượt quá bán kính cho phép ${branch.gpsRadiusMeters}m). Vui lòng check-in tại cơ sở đào tạo!`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Submit Attendance & Assessments (Mobile Screen 1 - Action Bar)
attendanceRouter.post('/sessions/:id/submit-attendance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { records, assessmentData } = req.body;
    // records: Array of { studentId, enrollmentId, status, attendanceType, teacherComment }
    // assessmentData: Optional { testType, score, evaluationDetails, isPassed } for special sessions (1, 12, 24)

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ca học' });
    }

    if (!session.isGpsValid) {
      return res.status(403).json({
        success: false,
        message: 'Chưa Check-in GPS hợp lệ. Toàn bộ danh sách điểm danh bị khoá theo quy định.',
      });
    }

    // Process attendance records inside transaction
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        await tx.attendance.upsert({
          where: {
            classSessionId_studentId: {
              classSessionId: id,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status as AttendanceStatus,
            attendanceType: (rec.attendanceType as AttendanceType) || AttendanceType.REGULAR,
            teacherComment: rec.teacherComment,
            zaloZnsSent: true,
          },
          create: {
            classSessionId: id,
            studentId: rec.studentId,
            enrollmentId: rec.enrollmentId,
            status: rec.status as AttendanceStatus,
            attendanceType: (rec.attendanceType as AttendanceType) || AttendanceType.REGULAR,
            teacherComment: rec.teacherComment,
            zaloZnsSent: true,
          },
        });

        // Update enrollment session counts
        const enrollment = await tx.enrollment.findUnique({ where: { id: rec.enrollmentId } });
        if (enrollment) {
          if (rec.status === AttendanceStatus.PRESENT || rec.status === AttendanceStatus.ABSENT_UNEXCUSED) {
            // Deduct 1 session
            const newAttended = enrollment.attendedSessions + (rec.status === AttendanceStatus.PRESENT ? 1 : 0);
            const newRemaining = Math.max(0, enrollment.remainingSessions - 1);

            await tx.enrollment.update({
              where: { id: rec.enrollmentId },
              data: {
                attendedSessions: newAttended,
                remainingSessions: newRemaining,
              },
            });
          } else if (rec.status === AttendanceStatus.ABSENT_EXCUSED) {
            // Does not deduct session, add to makeup queue
            await tx.enrollment.update({
              where: { id: rec.enrollmentId },
              data: {
                makeupPendingSessions: { increment: 1 },
              },
            });
          }
        }

        // Check if there is an assessment submission for this student (Session 1, 12, or 24)
        if (assessmentData && assessmentData[rec.studentId]) {
          const ass = assessmentData[rec.studentId];
          await tx.studentAssessment.upsert({
            where: {
              enrollmentId_testType: {
                enrollmentId: rec.enrollmentId,
                testType: ass.testType,
              },
            },
            update: {
              score: Number(ass.score),
              evaluationDetails: ass.evaluationDetails,
              isPassed: Boolean(ass.isPassed),
              sessionNumber: session.sessionNumber,
            },
            create: {
              enrollmentId: rec.enrollmentId,
              studentId: rec.studentId,
              teacherId: session.teacherId,
              testType: ass.testType,
              sessionNumber: session.sessionNumber,
              score: Number(ass.score),
              evaluationDetails: ass.evaluationDetails,
              isPassed: Boolean(ass.isPassed),
            },
          });

          // If Final Test at session 24 is PASSED:
          if (ass.testType === 'FINAL_TEST') {
            const completionDate = new Date();
            const stdDeadline = enrollment?.standardDeadlineDate ? new Date(enrollment.standardDeadlineDate) : null;
            const isOnTime = stdDeadline ? completionDate <= stdDeadline : false;

            await tx.enrollment.update({
              where: { id: rec.enrollmentId },
              data: {
                isQualifiedForNextLevel: Boolean(ass.isPassed),
                isOnTimeLevelUp: isOnTime && Boolean(ass.isPassed),
                completionDate: Boolean(ass.isPassed) ? completionDate : null,
                status: Boolean(ass.isPassed) ? 'COMPLETED' : 'ACTIVE',
              },
            });
          }
        }

        // Simulate Zalo ZNS log
        await tx.znsLog.create({
          data: {
            phone: rec.parentPhone || '0900000000',
            templateId: 'ZNS_ATTENDANCE_NOTIFY',
            params: {
              studentName: rec.studentName || 'Học viên',
              sessionNumber: session.sessionNumber,
              status: rec.status,
              teacherComment: rec.teacherComment || 'Bé học tập chăm chỉ và tập trung.',
            },
            status: 'SENT',
          },
        });
      }

      await tx.classSession.update({
        where: { id },
        data: { sessionStatus: 'COMPLETED' },
      });
    });

    eventBus.publish(DomainEvent.ATTENDANCE_COMPLETED, {
      classSessionId: id,
      teacherId: session.teacherId,
      attendances: records,
    });

    return res.json({
      success: true,
      message: 'Hoàn tất điểm danh & Đã gửi tin nhắn Zalo ZNS thông báo đến Phụ huynh thành công!',
    });
  } catch (error: any) {
    console.error('Submit attendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
