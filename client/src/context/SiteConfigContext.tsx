import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface HeroSlide {
  isActive: boolean;
  promoBadge: string;
  yearLabel: string;
  mainTitle: string;
  bgImage: string;
  startDate?: string;
  endDate?: string;
}

interface SiteConfig {
  announcementBar?: { text: string; color: string; isActive: boolean };
  freeShippingThreshold?: number;
  returnPolicyDays?: number;
  storeName?: string;
  storePhone?: string;
  storeEmail?: string;
  socialLinks?: { instagram: string; facebook: string; whatsapp: string };
  defaultMeta?: { title: string; description: string; ogImage: string };
  offerZones?: {
    hero?: HeroSlide[];
    countdown?: {
      isActive: boolean;
      offerName: string;
      description: string;
      bgImage: string;
      expiresAt?: string;
    };
    popup?: {
      isActive: boolean;
      image: string;
      title: string;
      targetUrl: string;
      delay: number;
      discount: number;
      couponCode: string;
    };
  };
}

interface SiteConfigContextType {
  config: SiteConfig | null;
  loading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({ config: null, loading: true });

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteConfig = () => useContext(SiteConfigContext);

export const SiteConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setConfig(data); })
      .catch(err => console.error('Failed to load site config:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
};