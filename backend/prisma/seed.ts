import { PrismaClient, UserRole, ContractType, LeadStatus, AttendanceStatus, AllowanceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data according to SRS v2.0...');

  // 1. Core: System Configs
  await prisma.systemConfig.createMany({
    data: [
      { key: 'NEW_STUDENT_BONUS', value: '200000', description: 'Định mức thưởng Học viên Mới cho Giáo viên/Sale' },
      { key: 'ON_TIME_LEVELUP_BONUS', value: '300000', description: 'Định mức thưởng HV Lên khoá Đúng hạn 3 tháng' },
      { key: 'STANDARD_MONTHS', value: '3', description: 'Hạn chuẩn hoàn thành khoá học (tháng)' },
      { key: 'MAX_MONTHS', value: '4', description: 'Hạn tối đa hoàn thành khoá học (tháng)' },
      { key: 'MAX_RESERVATION_DAYS', value: '90', description: 'Thời gian bảo lưu tối đa (ngày)' },
    ],
    skipDuplicates: true,
  });

  // 2. Core: Branch
  const branch = await prisma.branch.upsert({
    where: { code: 'CN01' },
    update: {},
    create: {
      code: 'CN01',
      name: 'Trung Tâm Toán Trí Tuệ SBR - Cơ sở Cầu Giấy',
      address: 'Số 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
      gpsLatitude: 21.033333,
      gpsLongitude: 105.799999,
      gpsRadiusMeters: 200,
      status: 'ACTIVE',
    },
  });

  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. Core: Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.ADMIN,
      fullName: 'Quản Trị Viên Hệ Thống',
      phone: '0901000001',
      email: 'admin@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.FULLTIME,
      baseSalary: 20000000,
    },
  });

  const academicUser = await prisma.user.upsert({
    where: { email: 'giaovu@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.ACADEMIC_AFFAIRS,
      fullName: 'Nguyễn Thị Giáo Vụ',
      phone: '0901000002',
      email: 'giaovu@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.FULLTIME,
      baseSalary: 12000000,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'ketoan@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.ACCOUNTANT,
      fullName: 'Trần Văn Kế Toán',
      phone: '0901000003',
      email: 'ketoan@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.FULLTIME,
      baseSalary: 13000000,
    },
  });

  const saleUser = await prisma.user.upsert({
    where: { email: 'sale@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.SALE,
      fullName: 'Lê Hoàng Tư Vấn',
      phone: '0901000004',
      email: 'sale@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.FULLTIME,
      baseSalary: 10000000,
    },
  });

  const teacherFulltime = await prisma.user.upsert({
    where: { email: 'gv.ngoc@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.TEACHER,
      fullName: 'Cô Hoàng Bảo Ngọc',
      phone: '0901000005',
      email: 'gv.ngoc@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.FULLTIME,
      baseSalary: 12000000,
      standardMonthlyHours: 160,
      hourlyTeachingRate: 100000,
    },
  });

  const teacherParttime = await prisma.user.upsert({
    where: { email: 'gv.dung@sbr.edu.vn' },
    update: {},
    create: {
      branchId: branch.id,
      role: UserRole.TEACHER,
      fullName: 'Thầy Phạm Anh Dũng',
      phone: '0901000006',
      email: 'gv.dung@sbr.edu.vn',
      passwordHash,
      contractType: ContractType.PARTTIME,
      baseSalary: 0,
      standardMonthlyHours: 0,
      hourlyTeachingRate: 120000,
    },
  });

  // 4. Catalog: Courses & Combo
  const course1 = await prisma.course.upsert({
    where: { courseCode: 'SOROBAN-01' },
    update: {},
    create: {
      courseCode: 'SOROBAN-01',
      name: 'Toán Trí Tuệ Soroban - Cấp Độ 1 (Cơ Bản)',
      subjectType: 'TOAN_TRI_TUE',
      levelOrder: 1,
      totalSessions: 24,
      standardMonths: 3,
      maxMonths: 4,
      tuitionFee: 3600000,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { courseCode: 'SOROBAN-02' },
    update: {},
    create: {
      courseCode: 'SOROBAN-02',
      name: 'Toán Trí Tuệ Soroban - Cấp Độ 2 (Nâng Cao)',
      subjectType: 'TOAN_TRI_TUE',
      levelOrder: 2,
      totalSessions: 24,
      standardMonths: 3,
      maxMonths: 4,
      tuitionFee: 3600000,
    },
  });

  const courseLifeSkills = await prisma.course.upsert({
    where: { courseCode: 'KNS-01' },
    update: {},
    create: {
      courseCode: 'KNS-01',
      name: 'Kỹ Năng Sống - Tự Tin Giao Tiếp & Thuyết Trình',
      subjectType: 'KY_NANG_SONG',
      levelOrder: 1,
      totalSessions: 24,
      standardMonths: 3,
      maxMonths: 4,
      tuitionFee: 3200000,
    },
  });

  const combo2Courses = await prisma.courseCombo.upsert({
    where: { comboCode: 'COMBO-SB-2' },
    update: {},
    create: {
      comboCode: 'COMBO-SB-2',
      name: 'Combo Toán Trí Tuệ Vàng (Soroban 1 + Soroban 2 - 48 Buổi)',
      totalCourses: 2,
      originalPrice: 7200000,
      comboPrice: 6480000,
    },
  });

  await prisma.comboItem.upsert({
    where: { comboId_sequenceOrder: { comboId: combo2Courses.id, sequenceOrder: 1 } },
    update: {},
    create: {
      comboId: combo2Courses.id,
      courseId: course1.id,
      sequenceOrder: 1,
    },
  });

  await prisma.comboItem.upsert({
    where: { comboId_sequenceOrder: { comboId: combo2Courses.id, sequenceOrder: 2 } },
    update: {},
    create: {
      comboId: combo2Courses.id,
      courseId: course2.id,
      sequenceOrder: 2,
    },
  });

  // 5. Inventory: Products & Stock
  const p1 = await prisma.product.upsert({
    where: { sku: 'BOOK-SB1' },
    update: {},
    create: {
      sku: 'BOOK-SB1',
      name: 'Sách Giáo Trình Soroban Cấp Độ 1',
      unit: 'Quyển',
      costPrice: 80000,
      sellingPrice: 150000,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: 'ABACUS-01' },
    update: {},
    create: {
      sku: 'ABACUS-01',
      name: 'Bàn Tính Soroban Tiêu Chuẩn 13 Cột',
      unit: 'Cái',
      costPrice: 60000,
      sellingPrice: 120000,
    },
  });

  const p3 = await prisma.product.upsert({
    where: { sku: 'UNIFORM-SBR' },
    update: {},
    create: {
      sku: 'UNIFORM-SBR',
      name: 'Đồng Phục & Balo Trung Tâm SBR',
      unit: 'Bộ',
      costPrice: 120000,
      sellingPrice: 250000,
    },
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branch.id, productId: p1.id } },
    update: {},
    create: { branchId: branch.id, productId: p1.id, quantity: 100 },
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branch.id, productId: p2.id } },
    update: {},
    create: { branchId: branch.id, productId: p2.id, quantity: 80 },
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branch.id, productId: p3.id } },
    update: {},
    create: { branchId: branch.id, productId: p3.id, quantity: 60 },
  });

  // 6. Payroll: Allowance Configs
  await prisma.allowanceConfig.createMany({
    data: [
      { name: 'Phụ cấp trách nhiệm cơ sở', allowanceType: AllowanceType.FIXED_MONTHLY, defaultAmount: 1000000 },
      { name: 'Phụ cấp dạy ca tối / cuối tuần', allowanceType: AllowanceType.PER_SESSION, defaultAmount: 50000 },
      { name: 'Thưởng thi đua giảng dạy xuất sắc', allowanceType: AllowanceType.MANUAL, defaultAmount: 500000 },
    ],
    skipDuplicates: true,
  });

  // 7. Academic: Classes & 24 Sessions
  const class1 = await prisma.class.upsert({
    where: { classCode: 'SB1-2026-T24' },
    update: {},
    create: {
      classCode: 'SB1-2026-T24',
      courseId: course1.id,
      branchId: branch.id,
      roomName: 'Phòng 201 (Thông minh)',
      mainTeacherId: teacherFulltime.id,
      scheduleDays: 'Thứ 2, Thứ 4',
      scheduleTime: '17:30 - 19:00',
      startDate: new Date('2026-10-01'),
      expectedEndDate: new Date('2026-12-31'),
      maxStudents: 12,
    },
  });

  // Generate 24 Class Sessions
  const now = new Date();
  for (let i = 1; i <= 24; i++) {
    const sessionDate = new Date('2026-10-01');
    sessionDate.setDate(sessionDate.getDate() + (i - 1) * 3.5); // Cách mỗi 3-4 ngày một buổi
    await prisma.classSession.upsert({
      where: { classId_sessionNumber: { classId: class1.id, sessionNumber: i } },
      update: {},
      create: {
        classId: class1.id,
        sessionNumber: i,
        sessionDate,
        startTime: '17:30',
        endTime: '19:00',
        durationHours: 1.5,
        teacherId: teacherFulltime.id,
        isGpsValid: i <= 5, // 5 buổi đầu đã học và GPS hợp lệ
        sessionStatus: i <= 5 ? 'COMPLETED' : 'SCHEDULED',
        checkinTime: i <= 5 ? sessionDate : null,
        checkinLat: i <= 5 ? 21.033340 : null,
        checkinLng: i <= 5 ? 105.800010 : null,
      },
    });
  }

  // 8. CRM: Leads
  let lead1 = await prisma.lead.findFirst({
    where: { parentPhone: '0988111222' },
  });
  if (!lead1) {
    lead1 = await prisma.lead.create({
      data: {
        branchId: branch.id,
        parentName: 'Nguyễn Văn Minh',
        parentPhone: '0988111222',
        studentName: 'Nguyễn Minh Khang',
        studentDob: new Date('2019-05-15'),
        interestedSubject: 'Toán trí tuệ Soroban',
        leadSource: 'Facebook Ads',
        assignedUserId: saleUser.id,
        status: LeadStatus.TRIAL_ATTENDED,
      },
    });
  }

  // 9. Academic: Student & Enrollment
  let student = await prisma.student.findUnique({
    where: { studentCode: 'HV-2026-001' },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        studentCode: 'HV-2026-001',
        branchId: branch.id,
        fullName: 'Trần Gia Bảo',
        dob: new Date('2019-03-20'),
        gender: 'Nam',
        parentName: 'Trần Thị Mai',
        parentPhone: '0977333444',
        status: 'ACTIVE',
      },
    });
  }

  const activationDate = new Date('2026-10-01');
  const standardDeadline = new Date(activationDate);
  standardDeadline.setMonth(standardDeadline.getMonth() + 3);
  const maxExpiredDate = new Date(activationDate);
  maxExpiredDate.setMonth(maxExpiredDate.getMonth() + 4);

  let enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId: course1.id },
  });
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course1.id,
        currentClassId: class1.id,
        assignedTeacherId: teacherFulltime.id,
        totalSessions: 24,
        attendedSessions: 5,
        makeupPendingSessions: 1,
        remainingSessions: 18,
        activationDate,
        standardDeadlineDate: standardDeadline,
        maxExpiredDate,
        status: 'ACTIVE',
      },
    });
  }

  // Entry Test assessment for session 1
  const existingAssessment = await prisma.studentAssessment.findFirst({
    where: { studentId: student.id, sessionNumber: 1 },
  });
  if (!existingAssessment) {
    await prisma.studentAssessment.create({
      data: {
        enrollmentId: enrollment.id,
        studentId: student.id,
        teacherId: teacherFulltime.id,
        testType: 'ENTRY_TEST',
        sessionNumber: 1,
        testDate: activationDate,
        score: 8.5,
        evaluationDetails: 'Học sinh tiếp thu tư duy số học nhanh, phản xạ bàn tính nhạy bén.',
        isPassed: true,
      },
    });
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed notice (continuing to start server):', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
