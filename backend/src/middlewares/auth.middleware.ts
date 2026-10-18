import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ems_secret_key_2026';

export interface AuthUser {
  userId: string;
  role: string;
  branchId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Extracts and verifies JWT Bearer token if provided.
 * Attaches user to `req.user` without blocking unauthenticated requests if optional.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    // Token was supplied but is expired or invalid
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực (Token) không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }
};

/**
 * Enforces mandatory authentication. Returns 401 if token is missing or invalid.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Yêu cầu đăng nhập: Vui lòng cung cấp mã xác thực hợp lệ (Authorization: Bearer <token>)',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
    });
  }
};

/**
 * Enforces Role-Based Access Control (RBAC). ADMIN always has full access.
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập để thực hiện thao tác này',
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Từ chối truy cập: Vai trò [${req.user.role}] không có quyền thực hiện thao tác này`,
      });
    }

    next();
  };
};
