/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortalRoute } from '../types';
import { Search, MapPin, FileText, User, Home, Building2, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  activeTab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE';
  onSelectTab: (tab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE') => void;
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

    const patientItems: { id: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE'; label: string; icon: React.ReactNode }[] = [
      { id: 'DISCOVER', label: 'Find & Book', icon: <Search className="w-5 h-5" /> },
      { id: 'TRACKING', label: 'Track', icon: <MapPin className="w-5 h-5" /> },
      { id: 'REPORTS', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
      { id: 'PROFILE', label: 'Account', icon: <User className="w-5 h-5" /> },
    ];

    return (
      <nav
        aria-label="Patient mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE4DE] px-2 pt-1 pb-safe grid grid-cols-4 items-center text-[10px] font-medium text-[#737D78] shadow-[0_-6px_24px_rgba(32,42,39,0.06)]"
      >
        {patientItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors active:scale-95 min-h-[48px] ${
                isActive ? 'text-[#174C3C] font-semibold' : 'hover:text-[#202A27]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-patient-nav"
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                  className="absolute top-0 w-7 h-[2.5px] rounded-full bg-[#174C3C]"
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

  // On customer landing page (/), show ONLY customer-focused anchors (zero staff/admin portals)
  if (currentRoute === '/') {
    return (
      <nav
        aria-label="Customer mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE4DE] px-2 pt-1 pb-safe grid grid-cols-4 items-center text-[10px] font-medium text-[#737D78] shadow-[0_-6px_24px_rgba(32,42,39,0.06)]"
      >
        <a
          href="#how-it-works"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#174C3C] min-h-[48px]"
        >
          <Home className="w-5 h-5" />
          <span className="whitespace-nowrap tracking-tight">How It Works</span>
        </a>
        <a
          href="#partners"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#174C3C] min-h-[48px]"
        >
          <Building2 className="w-5 h-5" />
          <span className="whitespace-nowrap tracking-tight">Lahore Labs</span>
        </a>
        <a
          href="#passport"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl hover:text-[#174C3C] min-h-[48px]"
        >
          <HeartPulse className="w-5 h-5" />
          <span className="whitespace-nowrap tracking-tight">Passport</span>
        </a>
        <button
          type="button"
          onClick={() => onNavigate('/patient')}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[#174C3C] font-semibold min-h-[48px]"
        >
          <User className="w-5 h-5" />
          <span className="whitespace-nowrap tracking-tight">Portal</span>
        </button>
      </nav>
    );
  }

  // Dedicated standalone portals (/lab, /phlebotomist, /admin, /specs) never render cross-portal nav
  return null;
};
