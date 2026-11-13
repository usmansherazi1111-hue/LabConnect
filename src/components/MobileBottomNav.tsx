/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortalRoute } from '../types';
import { Search, MapPin, FileText, User, LayoutGrid, Building2, Bike, ShieldCheck } from 'lucide-react';

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
  if (currentRoute === '/patient') {
    const patientItems: { id: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE'; label: string; icon: React.ReactNode }[] = [
      { id: 'DISCOVER', label: 'Find & Book', icon: <Search className="w-5 h-5" /> },
      { id: 'TRACKING', label: 'Track', icon: <MapPin className="w-5 h-5" /> },
      { id: 'REPORTS', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
      { id: 'PROFILE', label: 'Account', icon: <User className="w-5 h-5" /> },
    ];

    return (
      <nav
        aria-label="Patient mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pt-1 pb-safe grid grid-cols-4 items-center text-[10px] font-medium text-slate-500 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      >
        {patientItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-transform active:scale-95 min-h-[48px] ${
                isActive ? 'text-[#0F5132] font-bold' : 'hover:text-slate-900'
              }`}
            >
              {isActive && <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#0F5132]" />}
              {item.icon}
              <span className="whitespace-nowrap tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  const portalItems: { route: PortalRoute; label: string; icon: React.ReactNode }[] = [
    { route: '/', label: 'Portals', icon: <LayoutGrid className="w-5 h-5" /> },
    { route: '/patient', label: 'Patient', icon: <User className="w-5 h-5" /> },
    { route: '/lab', label: 'Lab Ops', icon: <Building2 className="w-5 h-5" /> },
    { route: '/phlebotomist', label: 'Courier', icon: <Bike className="w-5 h-5" /> },
    { route: '/admin', label: 'PHC Admin', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="Stakeholder mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 pt-1 pb-safe grid grid-cols-5 items-center text-[10px] font-medium text-slate-500 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
    >
      {portalItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.route}
            type="button"
            onClick={() => onNavigate(item.route)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-transform active:scale-95 min-h-[48px] ${
              isActive ? 'text-[#0F5132] font-bold' : 'hover:text-slate-900'
            }`}
          >
            {isActive && <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#0F5132]" />}
            {item.icon}
            <span className="whitespace-nowrap tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
