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

// 5. Create / Update User (Quản trị nhân sự)
coreRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { branchId, role, fullName, email, phone, password, contractType, baseSalary, hourlyTeachingRate } = req.body;
    const passwordHash = await bcrypt.hash(password || '123456', 10);

    const user = await prisma.user.create({
      data: {
        branchId,
        role,
        fullName,
        email,
        phone,
        passwordHash,
        contractType: contractType || 'FULLTIME',
        baseSalary: baseSalary ? Number(baseSalary) : 0,
        hourlyTeachingRate: hourlyTeachingRate ? Number(hourlyTeachingRate) : 0,
      },
    });

    return res.json({ success: true, data: user, message: 'Tạo tài khoản nhân viên thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Create Branch (Quản trị cơ sở)
coreRouter.post('/branches', async (req: Request, res: Response) => {
  try {
    const { code, name, address, gpsLatitude, gpsLongitude, gpsRadiusMeters } = req.body;
    const branch = await prisma.branch.create({
      data: {
        code,
        name,
        address,
        gpsLatitude: Number(gpsLatitude || 21.033333),
        gpsLongitude: Number(gpsLongitude || 105.799999),
        gpsRadiusMeters: Number(gpsRadiusMeters || 200),
      },
    });
    return res.json({ success: true, data: branch, message: 'Thêm cơ sở thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Update System Config (Cấu hình tham số hệ thống)
coreRouter.put('/configs/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    return res.json({ success: true, data: config, message: 'Cập nhật cấu hình hệ thống thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 8. System Dashboard Overview (Thống kê quản trị tổng quan)
coreRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const [userCount, studentCount, orderCount, classCount] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.order.count(),
      prisma.class.count(),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers: userCount,
        totalStudents: studentCount,
        totalOrders: orderCount,
        totalClasses: classCount,
        systemStatus: 'ONLINE_SECURE',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
