/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortalRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  onOpenAuth: () => void;
  onOpenFamily: () => void;
  patientTab?: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE';
  onSelectPatientTab?: (tab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE') => void;
}

const ROUTE_META: Record<PortalRoute, { label: string; audience: string }> = {
  '/': { label: 'Portal Gateway', audience: 'Lahore Verified Diagnostic Network' },
  '/patient': { label: 'Patient Portal', audience: 'Test Discovery, Tracking & PDF Reports' },
  '/lab': { label: 'Laboratory SaaS', audience: 'Branch Operations & Report Release' },
  '/phlebotomist': { label: 'Home Sampler App', audience: 'Cold-Chain Courier Dispatch' },
  '/admin': { label: 'PHC Admin Console', audience: 'Regulatory Audit & Settlement' },
  '/specs': { label: 'Architecture & Specs', audience: 'Engineering Blueprint & ERD' },
};

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
  onOpenFamily,
  patientTab,
  onSelectPatientTab,
}) => {
  const { patientUser, labUser, phlebUser, adminUser, activeFamilyMember, logoutScope } = useAuth();
  const meta = ROUTE_META[currentRoute];

  const activeUser =
    currentRoute === '/patient'
      ? patientUser
      : currentRoute === '/lab'
      ? labUser
      : currentRoute === '/phlebotomist'
      ? phlebUser
      : currentRoute === '/admin'
      ? adminUser
      : null;

  const activeScope =
    currentRoute === '/patient'
      ? 'patient'
      : currentRoute === '/lab'
      ? 'lab'
      : currentRoute === '/phlebotomist'
      ? 'phlebotomist'
      : currentRoute === '/admin'
      ? 'admin'
      : null;

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBF9]/95 backdrop-blur-md border-b border-slate-200 pt-safe">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Current Portal Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="flex items-center gap-2 shrink-0 text-slate-900 font-bold text-lg tracking-tight whitespace-nowrap"
          >
            <span className="w-7 h-7 rounded-lg bg-[#0F5132] text-white flex items-center justify-center font-bold text-xs">
              LC
            </span>
            <span>LabConnect</span>
          </a>

          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#0F5132] truncate">{meta.label}</span>
            <span className="text-[11px] text-slate-500 truncate">{meta.audience}</span>
          </div>
        </div>

        {/* Center: Clean Role-Specific Navigation (Patient tabs on desktop) */}
        {currentRoute === '/patient' && onSelectPatientTab && (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {[
              { id: 'DISCOVER', label: 'Find & Book' },
              { id: 'TRACKING', label: 'Track Sample' },
              { id: 'REPORTS', label: 'PDF Reports' },
              { id: 'PROFILE', label: 'Account' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectPatientTab(item.id as typeof patientTab & string)}
                className={`py-1 whitespace-nowrap transition-colors ${
                  patientTab === item.id
                    ? 'text-[#0F5132] font-semibold border-b-2 border-[#0F5132]'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right: Isolated Session Status, PWA Install & Switch Portal Link */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          {currentRoute === '/patient' && patientUser && (
            <button
              onClick={onOpenFamily}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 min-h-[36px] whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {activeFamilyMember
                  ? activeFamilyMember.name.split(' ')[0]
                  : `Family (${patientUser.familyMembers.length})`}
              </span>
            </button>
          )}

          {activeUser && activeScope ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end text-right leading-tight">
                <span className="text-xs font-bold text-slate-900 max-w-[160px] truncate">{activeUser.name}</span>
                <span className="text-[10px] font-mono text-emerald-800">{activeUser.role}</span>
              </div>
              <button
                onClick={() => logoutScope(activeScope)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 min-h-[36px] whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : currentRoute === '/patient' ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0F5132] hover:bg-emerald-800 text-white rounded-lg min-h-[36px] whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Patient Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          ) : null}

          {currentRoute !== '/' && (
            <button
              onClick={() => onNavigate('/')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg min-h-[36px] whitespace-nowrap"
              title="Back to All Portals"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portals</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
