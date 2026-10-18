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

// 5. Create Course (Tạo khóa học mới)
catalogRouter.post('/courses', async (req: Request, res: Response) => {
  try {
    const { courseCode, name, subjectType, levelOrder, totalSessions, standardMonths, maxMonths, tuitionFee } = req.body;
    const course = await prisma.course.create({
      data: {
        courseCode,
        name,
        subjectType: subjectType || 'TOAN_TRI_TUE',
        levelOrder: Number(levelOrder || 1),
        totalSessions: Number(totalSessions || 24),
        standardMonths: Number(standardMonths || 3),
        maxMonths: Number(maxMonths || 4),
        tuitionFee: Number(tuitionFee || 0),
        status: 'ACTIVE',
      },
    });
    return res.json({ success: true, data: course, message: 'Tạo khóa học thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Update Course (Cập nhật học phí & thông tin khóa học)
catalogRouter.put('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subjectType, levelOrder, totalSessions, standardMonths, maxMonths, tuitionFee, status } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subjectType !== undefined) updateData.subjectType = subjectType;
    if (levelOrder !== undefined) updateData.levelOrder = Number(levelOrder);
    if (totalSessions !== undefined) updateData.totalSessions = Number(totalSessions);
    if (standardMonths !== undefined) updateData.standardMonths = Number(standardMonths);
    if (maxMonths !== undefined) updateData.maxMonths = Number(maxMonths);
    if (tuitionFee !== undefined) updateData.tuitionFee = Number(tuitionFee);
    if (status !== undefined) updateData.status = status;

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });
    return res.json({ success: true, data: course, message: 'Cập nhật khóa học thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Delete / Inactivate Course
catalogRouter.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return res.json({ success: true, message: 'Đã chuyển trạng thái khóa học sang Ngưng hoạt động' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Create Course Combo (Tạo combo khóa học ưu đãi)
catalogRouter.post('/combos', async (req: Request, res: Response) => {
  try {
    const { comboCode, name, totalCourses, originalPrice, comboPrice, courseIds } = req.body;
    const combo = await prisma.courseCombo.create({
      data: {
        comboCode,
        name,
        totalCourses: Number(totalCourses || 2),
        originalPrice: Number(originalPrice || 0),
        comboPrice: Number(comboPrice || 0),
        status: 'ACTIVE',
        items: courseIds && Array.isArray(courseIds) ? {
          create: courseIds.map((courseId: string, idx: number) => ({
            courseId,
            sequenceOrder: idx + 1,
          })),
        } : undefined,
      },
      include: { items: { include: { course: true } } },
    });
    return res.json({ success: true, data: combo, message: 'Tạo combo khóa học thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Update Course Combo
catalogRouter.put('/combos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, totalCourses, originalPrice, comboPrice, status } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (totalCourses !== undefined) updateData.totalCourses = Number(totalCourses);
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (comboPrice !== undefined) updateData.comboPrice = Number(comboPrice);
    if (status !== undefined) updateData.status = status;

    const combo = await prisma.courseCombo.update({
      where: { id },
      data: updateData,
    });
    return res.json({ success: true, data: combo, message: 'Cập nhật combo thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
