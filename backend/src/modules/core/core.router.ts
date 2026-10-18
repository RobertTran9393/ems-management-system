import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export const coreRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ems_secret_key_2026';

// 1. Login
coreRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, branchId: user.branchId, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        contractType: user.contractType,
        branch: user.branch,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Branches
coreRouter.get('/branches', async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { users: true, students: true, classes: true },
        },
      },
    });
    return res.json({ success: true, data: branches });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get System Configs
coreRouter.get('/configs', async (req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    return res.json({ success: true, data: configs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get Users / Teachers
coreRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        contractType: true,
        baseSalary: true,
        standardMonthlyHours: true,
        hourlyTeachingRate: true,
        branch: { select: { id: true, name: true } },
      },
    });
    return res.json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
