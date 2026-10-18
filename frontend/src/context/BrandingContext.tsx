import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export interface BrandingConfig {
  systemName: string;
  systemSlogan: string;
  systemLogoUrl: string;
  systemLogoText: string;
  systemPrimaryColor: string;
  systemAccentColor: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  systemName: 'EMS SBR',
  systemSlogan: 'Toán Trí Tuệ & Kỹ Năng Sống • SRS v2.0',
  systemLogoUrl: '',
  systemLogoText: 'SBR',
  systemPrimaryColor: '#4f46e5', // Indigo
  systemAccentColor: '#2563eb',  // Blue
};

interface BrandingContextType {
  branding: BrandingConfig;
  loading: boolean;
  updateBranding: (newConfig: Partial<BrandingConfig>) => Promise<boolean>;
  resetBranding: () => Promise<boolean>;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ems_branding_config';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse cached branding:', e);
    }
    return DEFAULT_BRANDING;
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
      const res = await fetch(`${API_BASE_URL}/api/core/branding`);
      const data = await res.json();
      if (data.success && data.data) {
        const merged: BrandingConfig = {
          systemName: data.data.systemName || DEFAULT_BRANDING.systemName,
          systemSlogan: data.data.systemSlogan ?? DEFAULT_BRANDING.systemSlogan,
          systemLogoUrl: data.data.systemLogoUrl || '',
          systemLogoText: data.data.systemLogoText || DEFAULT_BRANDING.systemLogoText,
          systemPrimaryColor: data.data.systemPrimaryColor || DEFAULT_BRANDING.systemPrimaryColor,
          systemAccentColor: data.data.systemAccentColor || DEFAULT_BRANDING.systemAccentColor,
        };
        setBranding(merged);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      console.error('Error fetching branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBranding();
  }, []);

  const updateBranding = async (newConfig: Partial<BrandingConfig>): Promise<boolean> => {
    const nextBranding = { ...branding, ...newConfig };
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

  const resetBranding = async (): Promise<boolean> => {
    return await updateBranding(DEFAULT_BRANDING);
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, updateBranding, resetBranding, refreshBranding }}>
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
