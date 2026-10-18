import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const catalogRouter = Router();

// 1. Get Courses
catalogRouter.get('/courses', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { levelOrder: 'asc' },
    });
    return res.json({ success: true, data: courses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Combos
catalogRouter.get('/combos', async (req: Request, res: Response) => {
  try {
    const combos = await prisma.courseCombo.findMany({
      where: { status: 'ACTIVE' },
      include: {
        items: {
          include: { course: true },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });
    return res.json({ success: true, data: combos });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Classes
catalogRouter.get('/classes', async (req: Request, res: Response) => {
  try {
    const { branchId, courseId } = req.query;
    const classes = await prisma.class.findMany({
      where: {
        branchId: branchId ? String(branchId) : undefined,
        courseId: courseId ? String(courseId) : undefined,
      },
      include: {
        course: true,
        mainTeacher: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    return res.json({ success: true, data: classes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Create Class & Auto Generate 24 Sessions
catalogRouter.post('/classes', async (req: Request, res: Response) => {
  try {
    const { classCode, courseId, branchId, roomName, mainTeacherId, scheduleDays, scheduleTime, startDate, maxStudents } = req.body;

    const newClass = await prisma.class.create({
      data: {
        classCode,
        courseId,
        branchId,
        roomName,
        mainTeacherId,
        scheduleDays,
        scheduleTime,
        startDate: new Date(startDate),
        maxStudents: maxStudents || 15,
      },
    });

    // Auto generate 24 sessions
    const [startH = '17:30', endH = '19:00'] = scheduleTime ? scheduleTime.split('-').map((s: string) => s.trim()) : [];
    const baseDate = new Date(startDate);

    const sessionData = [];
    for (let i = 1; i <= 24; i++) {
      const sDate = new Date(baseDate);
      sDate.setDate(sDate.getDate() + (i - 1) * 3.5);
      sessionData.push({
        classId: newClass.id,
        sessionNumber: i,
        sessionDate: sDate,
        startTime: startH,
        endTime: endH,
        durationHours: 1.5,
        teacherId: mainTeacherId,
        sessionStatus: 'SCHEDULED',
      });
    }

    await prisma.classSession.createMany({ data: sessionData });

    return res.json({ success: true, data: newClass, sessionsCount: sessionData.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
