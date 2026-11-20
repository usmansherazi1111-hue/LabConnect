/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PatientPortalTab, PortalRoute } from '../types';
import { Search, MapPin, FileText, User, Home, Building2, HeartPulse, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  activeTab: PatientPortalTab;
  onSelectTab: (tab: PatientPortalTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  activeTab,
  onSelectTab,
}) => {
  const { patientUser } = useAuth();

  // Only show Patient mobile tabs when authenticated inside /patient
  if (currentRoute === '/patient') {
    if (!patientUser) return null;

    const patientItems: { id: PatientPortalTab; label: string; icon: React.ReactNode }[] = [
      { id: 'DISCOVER', label: 'Discover', icon: <Search className="w-4 h-4" /> },
      { id: 'TRACKING', label: 'Track', icon: <MapPin className="w-4 h-4" /> },
      { id: 'REPORTS', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
      { id: 'INTELLIGENCE', label: 'AI Guide', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'PROFILE', label: 'Profile', icon: <User className="w-4 h-4" /> },
    ];

    return (
      <nav
        aria-label="Patient mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 lc-glass border-t border-[#C8DDD7] px-1.5 pt-1 pb-safe grid grid-cols-5 items-center text-[10px] font-medium text-[#556B70] shadow-[0_-8px_28px_rgba(7,59,67,0.08)]"
      >
        {patientItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors active:scale-95 min-h-[48px] ${
                isActive ? 'text-[#073B43] font-semibold' : 'hover:text-[#172C32]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-patient-nav"
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                  className="absolute top-0 w-7 h-[2.5px] rounded-full lc-gradient-aqua"
                />
              )}
              {item.icon}
              <span className="whitespace-nowrap tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // On customer landing page (/), show ONLY customer-focused anchors
  if (currentRoute === '/') {
    return (
      <nav
        aria-label="Customer mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 lc-glass border-t border-[#C8DDD7] px-2 pt-1 pb-safe grid grid-cols-4 items-center text-[10px] font-medium text-[#556B70] shadow-[0_-8px_28px_rgba(7,59,67,0.08)]"
      >
        <a
          href="#how-it-works"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#073B43] min-h-[48px]"
        >
          <Home className="w-4 h-4" />
          <span className="whitespace-nowrap tracking-tight">How It Works</span>
        </a>
        <a
          href="#partners"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#073B43] min-h-[48px]"
        >
          <Building2 className="w-4 h-4" />
          <span className="whitespace-nowrap tracking-tight">Lahore Labs</span>
        </a>
        <a
          href="#passport"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#073B43] min-h-[48px]"
        >
          <HeartPulse className="w-4 h-4" />
          <span className="whitespace-nowrap tracking-tight">Passport</span>
        </a>
        <button
          type="button"
          onClick={() => onNavigate('/patient')}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[#073B43] font-semibold min-h-[48px]"
        >
          <User className="w-4 h-4" />
          <span className="whitespace-nowrap tracking-tight">Portal</span>
        </button>
      </nav>
    );
  }

  return null;
};
