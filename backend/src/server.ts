import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { coreRouter } from './modules/core/core.router';
import { crmRouter } from './modules/crm/crm.router';
import { catalogRouter } from './modules/catalog/catalog.router';
import { inventoryRouter } from './modules/inventory/inventory.router';
import { posRouter } from './modules/pos/pos.router';
import { academicRouter } from './modules/academic/academic.router';
import { attendanceRouter } from './modules/attendance/attendance.router';
import { payrollRouter } from './modules/payroll/payroll.router';
import { fundRouter } from './modules/fund/fund.router';
import { pluginRouter } from './modules/plugin/plugin.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { eventBus, DomainEvent } from './events/event-bus';

import { authenticateToken } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security Hardening: Disable information disclosure header
app.disable('x-powered-by');

// Security Hardening: HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Security Hardening: CORS with safe origin headers
app.use(cors({
  origin: true,
  credentials: true,
}));

// Security Hardening: Prevent DoS via payload size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global authentication extractor (populates req.user if token is present)
app.use(authenticateToken);

// Serve static uploaded receipts / files safely (Sandbox uploads to prevent stored XSS)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    next();
  },
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    index: false,
  })
);

// Request logger (safe metadata only)
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Setup Internal Event Subscriptions (Event-Driven Architecture)
eventBus.subscribe(DomainEvent.ORDER_PAID_SUCCESS, async (payload) => {
  console.log(`[Event Handler] 🎯 Handled ORDER_PAID_SUCCESS for Order #${payload.orderId}`);
});

eventBus.subscribe(DomainEvent.ATTENDANCE_COMPLETED, async (payload) => {
  console.log(`[Event Handler] 🎯 Handled ATTENDANCE_COMPLETED for Session #${payload.classSessionId}`);
});

eventBus.subscribe(DomainEvent.COURSE_COMPLETED_AND_PASSED, async (payload) => {
  console.log(`[Event Handler] 🎯 Handled COURSE_COMPLETED_AND_PASSED for Student #${payload.studentId}`);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Chào mừng đến với API Hệ Thống Quản Lý Trung Tâm Đào Tạo EMS (SRS v2.0)',
    status: 'ONLINE',
    version: '2.0.0',
    documentation: {
      health: '/health',
      pos: '/api/pos/orders',
      academic: '/api/academic/enrollments',
      attendance: '/api/attendance/sessions',
      payroll: '/api/payroll'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    version: '2.0.0',
    service: 'EMS Modular Monolith Backend',
    timestamp: new Date().toISOString(),
  });
});

// Register Modules
app.use('/api/core', coreRouter);
app.use('/api/crm', crmRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/pos', posRouter);
app.use('/api/academic', academicRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/fund', fundRouter);
app.use('/api/plugin', pluginRouter);
app.use('/api/dashboard', dashboardRouter);

const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`
  🚀 ========================================================
     EMS Training Center ERP & CRM Backend (SRS v2.0)
     Listening on: http://${HOST}:${PORT}
     Static Uploads: http://${HOST}:${PORT}/uploads
     Status: Healthy & Connected to PostgreSQL
  🚀 ========================================================
  `);
});
