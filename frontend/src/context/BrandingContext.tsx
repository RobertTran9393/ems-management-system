import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export interface BrandingConfig {
  systemName: string;
  systemSlogan: string;
  systemLogoUrl: string;
  systemLogoText: string;
  systemPrimaryColor: string;
  systemAccentColor: string;
  moduleNames: Record<string, string>;
}

export const DEFAULT_MODULE_NAMES: Record<string, string> = {
  DASHBOARD: 'Dashboard Thống Kê',
  POS: 'Thu Ngân POS',
  RECEIPTS: 'Duyệt Chứng Từ',
  CASHBOOK: 'Sổ Quỹ Thu Chi',
  ACADEMIC: 'Giáo Vụ',
  PAYROLL: 'Bảng Lương',
  MOBILE: 'App Giáo Viên',
  CRM: 'Tuyển Sinh CRM',
  ADMIN: 'Quản Trị',
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['DASHBOARD', 'ADMIN', 'POS', 'RECEIPTS', 'CASHBOOK', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM'],
  ACCOUNTANT: ['DASHBOARD', 'POS', 'RECEIPTS', 'CASHBOOK', 'PAYROLL'],
  ACADEMIC_AFFAIRS: ['DASHBOARD', 'ACADEMIC', 'CRM'],
  SALE: ['DASHBOARD', 'CRM', 'POS'],
  TEACHER: ['DASHBOARD', 'MOBILE'],
};

export const ALL_MODULE_KEYS = ['DASHBOARD', 'POS', 'RECEIPTS', 'CASHBOOK', 'ACADEMIC', 'PAYROLL', 'MOBILE', 'CRM', 'ADMIN'];

export const DEFAULT_BRANDING: BrandingConfig = {
  systemName: 'EMS SBR',
  systemSlogan: 'Toán Trí Tuệ & Kỹ Năng Sống • SRS v2.0',
  systemLogoUrl: '',
  systemLogoText: 'SBR',
  systemPrimaryColor: '#4f46e5', // Indigo
  systemAccentColor: '#2563eb',  // Blue
  moduleNames: { ...DEFAULT_MODULE_NAMES },
};

interface BrandingContextType {
  branding: BrandingConfig;
  rolePermissions: Record<string, string[]>;
  userPermissions: Record<string, string[]>;
  loading: boolean;
  updateBranding: (newConfig: Partial<BrandingConfig>) => Promise<boolean>;
  resetBranding: () => Promise<boolean>;
  refreshBranding: () => Promise<void>;
  updateRolePermissions: (roles: Record<string, string[]>) => Promise<boolean>;
  updateUserPermissions: (userId: string, modules: string[] | null) => Promise<boolean>;
  hasModuleAccess: (user: any, moduleKey: string) => boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ems_branding_config';
const LOCAL_STORAGE_PERMISSIONS_KEY = 'ems_permissions_cache';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_BRANDING,
          ...parsed,
          moduleNames: { ...DEFAULT_MODULE_NAMES, ...(parsed.moduleNames || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to parse cached branding:', e);
    }
    return DEFAULT_BRANDING;
  });

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ROLE_PERMISSIONS, ...(parsed.rolePermissions || {}) };
      }
    } catch (e) {}
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.userPermissions || {};
      }
    } catch (e) {}
    return {};
  });

  const [loading, setLoading] = useState(false);

  // Sync document title and CSS variables when branding changes
  useEffect(() => {
    if (branding.systemName) {
      document.title = `${branding.systemName} - Quản Lý Giáo Dục`;
    }
  }, [branding.systemName]);

  const refreshBranding = async () => {
    try {
      setLoading(true);
      const [brandingRes, permsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/core/branding`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/api/core/permissions`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (brandingRes.success && brandingRes.data) {
        const merged: BrandingConfig = {
          systemName: brandingRes.data.systemName || DEFAULT_BRANDING.systemName,
          systemSlogan: brandingRes.data.systemSlogan ?? DEFAULT_BRANDING.systemSlogan,
          systemLogoUrl: brandingRes.data.systemLogoUrl || '',
          systemLogoText: brandingRes.data.systemLogoText || DEFAULT_BRANDING.systemLogoText,
          systemPrimaryColor: brandingRes.data.systemPrimaryColor || DEFAULT_BRANDING.systemPrimaryColor,
          systemAccentColor: brandingRes.data.systemAccentColor || DEFAULT_BRANDING.systemAccentColor,
          moduleNames: { ...DEFAULT_MODULE_NAMES, ...(brandingRes.data.moduleNames || {}) },
        };
        setBranding(merged);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      }

      if (permsRes.success && permsRes.data) {
        const rPerms = { ...DEFAULT_ROLE_PERMISSIONS, ...(permsRes.data.rolePermissions || {}) };
        const uPerms = permsRes.data.userPermissions || {};
        setRolePermissions(rPerms);
        setUserPermissions(uPerms);
        localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_KEY, JSON.stringify({
          rolePermissions: rPerms,
          userPermissions: uPerms,
        }));
      }
    } catch (err) {
      console.error('Error fetching branding & permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBranding();
  }, []);

  const updateBranding = async (newConfig: Partial<BrandingConfig>): Promise<boolean> => {
    const nextBranding: BrandingConfig = {
      ...branding,
      ...newConfig,
      moduleNames: { ...branding.moduleNames, ...(newConfig.moduleNames || {}) },
    };
    setBranding(nextBranding);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextBranding));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextBranding),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Error updating branding:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermissions = async (roles: Record<string, string[]>): Promise<boolean> => {
    setRolePermissions(roles);
    localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_KEY, JSON.stringify({
      rolePermissions: roles,
      userPermissions,
    }));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/permissions/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: roles }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Error updating role permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (userId: string, modules: string[] | null): Promise<boolean> => {
    const nextUserPerms = { ...userPermissions };
    if (modules === null) {
      delete nextUserPerms[userId];
    } else {
      nextUserPerms[userId] = modules;
    }
    setUserPermissions(nextUserPerms);
    localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_KEY, JSON.stringify({
      rolePermissions,
      userPermissions: nextUserPerms,
    }));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/core/permissions/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Error updating user permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasModuleAccess = (user: any, moduleKey: string): boolean => {
    if (!user) return false;
    // Super admin role always has full access
    if (user.role === 'ADMIN') return true;

    // Check custom individual user override first
    if (userPermissions && userPermissions[user.id] && Array.isArray(userPermissions[user.id])) {
      return userPermissions[user.id].includes(moduleKey);
    }

    // Fall back to role permissions matrix
    const allowed = rolePermissions[user.role] || [];
    return allowed.includes(moduleKey);
  };

  const resetBranding = async (): Promise<boolean> => {
    return await updateBranding(DEFAULT_BRANDING);
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        rolePermissions,
        userPermissions,
        loading,
        updateBranding,
        resetBranding,
        refreshBranding,
        updateRolePermissions,
        updateUserPermissions,
        hasModuleAccess,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
