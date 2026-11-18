/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortalRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, LogIn, LogOut, ArrowLeft, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  onOpenAuth: () => void;
  onOpenFamily: () => void;
  patientTab?: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE';
  onSelectPatientTab?: (tab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE') => void;
}

const ROUTE_LABEL: Record<PortalRoute, string> = {
  '/': 'Lahore Diagnostic Network',
  '/patient': 'Patient Portal',
  '/lab': 'Branch Lead Operations',
  '/phlebotomist': 'Phlebotomist Courier App',
  '/admin': 'PHC Regulatory Console',
  '/specs': 'Architecture & Specs',
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

  const isPatientApp = currentRoute === '/' || currentRoute === '/patient';

  const activeUser =
    currentRoute === '/patient' || currentRoute === '/'
      ? patientUser
      : currentRoute === '/lab'
      ? labUser
      : currentRoute === '/phlebotomist'
      ? phlebUser
      : currentRoute === '/admin'
      ? adminUser
      : null;

  const activeScope =
    currentRoute === '/patient' || currentRoute === '/'
      ? 'patient'
      : currentRoute === '/lab'
      ? 'lab'
      : currentRoute === '/phlebotomist'
      ? 'phlebotomist'
      : currentRoute === '/admin'
      ? 'admin'
      : null;

  return (
    <header className="sticky top-0 z-40 bg-[#F8F8F3]/92 backdrop-blur-md border-b border-[#DCE4DE] pt-safe">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Zone: Brand + Single-line Standalone App Context */}
        <div className="flex items-center gap-3 min-w-0">
          <a
            href={isPatientApp ? '/' : currentRoute}
            onClick={(e) => {
              e.preventDefault();
              if (isPatientApp) onNavigate('/');
            }}
            className="flex items-center gap-2.5 shrink-0 text-[#202A27] font-bold text-[17px] tracking-tight whitespace-nowrap group"
          >
            <span className="w-8 h-8 rounded-lg bg-[#174C3C] text-white flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]">
              <Activity className="w-4 h-4 stroke-[2.25]" />
            </span>
            <span>LabConnect</span>
          </a>

          <span className="text-[#DCE4DE] hidden sm:inline font-light" aria-hidden="true">/</span>
          <span className="hidden sm:inline text-xs font-medium text-[#737D78] truncate">
            {ROUTE_LABEL[currentRoute]}
          </span>
        </div>

        {/* Center Zone: Customer Landing Links OR Authenticated Patient Tabs */}
        {currentRoute === '/' && (
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#737D78]">
            {[
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#partners', label: 'Lahore Labs' },
              { href: '#passport', label: 'Health Passport' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#174C3C] transition-colors whitespace-nowrap py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {currentRoute === '/patient' && patientUser && onSelectPatientTab && (
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium">
            {[
              { id: 'DISCOVER', label: 'Find & Book' },
              { id: 'TRACKING', label: 'Track Sample' },
              { id: 'REPORTS', label: 'PDF Reports' },
              { id: 'PROFILE', label: 'Account' },
            ].map((item) => {
              const isActive = patientTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPatientTab(item.id as typeof patientTab & string)}
                  className={`relative py-2 whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#174C3C] font-semibold' : 'text-[#737D78] hover:text-[#202A27]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="header-patient-tab"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#174C3C] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Zone: Strictly Role-Isolated Actions & Auth Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {currentRoute === '/patient' && patientUser && (
            <button
              type="button"
              onClick={onOpenFamily}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#E8EFE8] hover:bg-[#DCE7DC] text-[#174C3C] rounded-lg border border-[#28745B]/20 min-h-[36px] whitespace-nowrap transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {activeFamilyMember
                  ? activeFamilyMember.name.split(' ')[0]
                  : `Family (${patientUser.familyMembers.length})`}
              </span>
            </button>
          )}

          {activeUser && activeScope ? (
            <div className="flex items-center gap-2.5">
              {currentRoute === '/' && (
                <button
                  type="button"
                  onClick={() => onNavigate('/patient')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#174C3C] hover:bg-[#28745B] text-white rounded-lg min-h-[36px] whitespace-nowrap transition-colors"
                >
                  Open Patient Portal
                </button>
              )}
              <div className="hidden md:flex items-center gap-2 text-right">
                <span className="text-xs font-semibold text-[#202A27] max-w-[150px] truncate">{activeUser.name}</span>
                <span className="text-[10px] font-mono text-[#737D78]">{activeUser.role}</span>
              </div>
              <button
                type="button"
                onClick={() => logoutScope(activeScope)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#E8EFE8]/60 text-[#202A27] rounded-lg border border-[#DCE4DE] min-h-[36px] whitespace-nowrap transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#737D78]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : currentRoute === '/' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#E8EFE8]/60 text-[#202A27] rounded-lg border border-[#DCE4DE] min-h-[36px] whitespace-nowrap transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#174C3C]" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/patient')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#174C3C] hover:bg-[#28745B] text-white rounded-lg min-h-[36px] whitespace-nowrap transition-colors active:scale-[0.98]"
              >
                <span>Patient Portal</span>
              </button>
            </div>
          ) : currentRoute === '/patient' ? (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#737D78] hover:text-[#202A27] bg-white border border-[#DCE4DE] rounded-lg min-h-[36px] whitespace-nowrap transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
