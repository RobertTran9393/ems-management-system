import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { LeadStatus, AttendanceStatus } from '@prisma/client';

export const crmRouter = Router();

// 1. Get Leads
crmRouter.get('/leads', async (req: Request, res: Response) => {
  try {
    const { branchId, status } = req.query;
    const leads = await prisma.lead.findMany({
      where: {
        branchId: branchId ? String(branchId) : undefined,
        status: status ? (status as LeadStatus) : undefined,
      },
      include: {
        assignedUser: { select: { id: true, fullName: true } },
        trialSessions: {
          include: { teacher: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: leads });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Create Lead
crmRouter.post('/leads', async (req: Request, res: Response) => {
  try {
    const { branchId, parentName, parentPhone, studentName, studentDob, interestedSubject, leadSource, assignedUserId, notes } = req.body;
    const lead = await prisma.lead.create({
      data: {
        branchId,
        parentName,
        parentPhone,
        studentName,
        studentDob: studentDob ? new Date(studentDob) : null,
        interestedSubject,
        leadSource,
        assignedUserId,
        notes,
        status: LeadStatus.NEW,
      },
    });
    return res.json({ success: true, data: lead });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Update Lead Status
crmRouter.patch('/leads/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: status as LeadStatus,
        notes: notes !== undefined ? notes : undefined,
      },
    });
    return res.json({ success: true, data: lead });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Book Trial Session & Record Entry Test
crmRouter.post('/leads/:id/trial', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teacherId, trialDate, attendanceStatus, entryTestScore, teacherEvaluation } = req.body;

    const trial = await prisma.trialSession.create({
      data: {
        leadId: id,
        teacherId,
        trialDate: new Date(trialDate),
        attendanceStatus: attendanceStatus || AttendanceStatus.PRESENT,
        entryTestScore: entryTestScore ? Number(entryTestScore) : null,
        teacherEvaluation,
      },
    });

    await prisma.lead.update({
      where: { id },
      data: {
        status: entryTestScore ? LeadStatus.TRIAL_ATTENDED : LeadStatus.TRIAL_SCHEDULED,
      },
    });

    return res.json({ success: true, data: trial });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
