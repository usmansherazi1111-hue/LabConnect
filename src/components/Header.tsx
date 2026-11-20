/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLanguage, PatientPortalTab, PortalRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { getAppFlavor } from '../api/client';
import { Users, LogIn, LogOut, ArrowLeft, Activity, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  currentRoute: PortalRoute;
  onNavigate: (route: PortalRoute) => void;
  onOpenAuth: () => void;
  onOpenFamily: () => void;
  patientTab?: PatientPortalTab;
  onSelectPatientTab?: (tab: PatientPortalTab) => void;
  language?: AppLanguage;
  onToggleLanguage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
  onOpenFamily,
  patientTab,
  onSelectPatientTab,
  language = 'en',
  onToggleLanguage,
}) => {
  const { patientUser, labUser, phlebUser, adminUser, activeFamilyMember, logoutScope } = useAuth();
  const appFlavor = getAppFlavor();

  const isPatientApp = appFlavor !== 'courier' && (currentRoute === '/' || currentRoute === '/patient');
  const isCourierBrand = appFlavor === 'courier' || currentRoute === '/phlebotomist';

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
    <header className="sticky top-0 z-40 lc-glass border-b border-[#D9E9E5] pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Clean Brand Wordmark */}
        <a
          href={isPatientApp ? '/' : currentRoute}
          onClick={(e) => {
            e.preventDefault();
            if (isPatientApp) onNavigate('/');
          }}
          className="flex items-center gap-2.5 shrink-0 text-[#172C32] font-bold text-[17px] tracking-tight whitespace-nowrap group"
        >
          <span className="w-9 h-9 rounded-xl lc-gradient-ocean text-white flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(8,127,140,0.45)] transition-transform duration-200 group-hover:scale-[1.04]">
            <Activity className="w-4 h-4 stroke-[2.3] text-[#21D4C2]" />
          </span>
          <span>{isCourierBrand ? 'LabConnect Courier' : 'LabConnect'}</span>
        </a>

        {/* Zone 2: Single-Line Navigation */}
        {currentRoute === '/' && (
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#556B70]">
            {[
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#partners', label: 'Verified Labs' },
              { href: '#passport', label: 'Health Passport' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#073B43] transition-colors whitespace-nowrap py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {currentRoute === '/patient' && patientUser && onSelectPatientTab && (
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium">
            {[
              { id: 'DISCOVER' as PatientPortalTab, label: language === 'ur' ? 'ٹیسٹ تلاش کریں' : 'Find & Book' },
              { id: 'TRACKING' as PatientPortalTab, label: language === 'ur' ? 'ٹریکنگ' : 'Track Sample' },
              { id: 'REPORTS' as PatientPortalTab, label: language === 'ur' ? 'رپورٹس' : 'PDF Reports' },
              {
                id: 'INTELLIGENCE' as PatientPortalTab,
                label: language === 'ur' ? 'اے آئی گائیڈ' : 'Intelligence',
                isAi: true,
              },
              { id: 'PROFILE' as PatientPortalTab, label: language === 'ur' ? 'اکاؤنٹ' : 'Account' },
            ].map((item) => {
              const isActive = patientTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPatientTab(item.id)}
                  className={`relative py-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#073B43] font-semibold'
                      : 'text-[#556B70] hover:text-[#172C32]'
                  }`}
                >
                  {item.isAi && <Sparkles className="w-3.5 h-3.5 text-[#087F8C]" />}
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="header-patient-tab"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] lc-gradient-aqua rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Role-Isolated Actions & Auth Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {currentRoute === '/patient' && patientUser && onToggleLanguage && (
            <button
              type="button"
              onClick={onToggleLanguage}
              title="Switch English / Urdu interface"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-semibold bg-[#F3F7F4] hover:bg-[#D9E9E5] text-[#073B43] rounded-lg border border-[#C8DDD7] min-h-[36px] whitespace-nowrap transition-colors"
            >
              {language === 'en' ? 'اردو' : 'EN'}
            </button>
          )}

          {currentRoute === '/patient' && patientUser && (
            <button
              type="button"
              onClick={onOpenFamily}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#D9E9E5]/70 hover:bg-[#D9E9E5] text-[#073B43] rounded-lg border border-[#C8DDD7] min-h-[36px] whitespace-nowrap transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#087F8C]" />
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
                  className="px-3.5 py-1.5 text-xs font-semibold lc-gradient-ocean hover:brightness-110 text-white rounded-lg min-h-[36px] whitespace-nowrap transition-all shadow-2xs"
                >
                  Open Patient Portal
                </button>
              )}
              <div className="hidden md:flex items-center gap-2 text-right">
                <span className="text-xs font-semibold text-[#172C32] max-w-[140px] truncate">{activeUser.name}</span>
                <span className="text-[11px] font-medium text-[#087F8C]">
                  {activeUser.role === 'PATIENT'
                    ? 'Patient'
                    : activeUser.role === 'LAB_ADMIN'
                    ? 'Branch Lead'
                    : activeUser.role === 'PHLEBOTOMIST'
                    ? 'Field Courier'
                    : activeUser.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : activeUser.role === 'PHC_INSPECTOR'
                    ? 'PHC Inspector'
                    : activeUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logoutScope(activeScope)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#D9E9E5]/50 text-[#172C32] rounded-lg border border-[#C8DDD7] min-h-[36px] whitespace-nowrap transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#087F8C]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : currentRoute === '/' ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#D9E9E5]/50 text-[#172C32] rounded-lg border border-[#C8DDD7] min-h-[36px] whitespace-nowrap transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#087F8C]" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/patient')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold lc-gradient-ocean hover:brightness-110 text-white rounded-lg min-h-[36px] whitespace-nowrap transition-all active:scale-[0.98]"
              >
                <span>Patient Portal</span>
              </button>
            </div>
          ) : currentRoute === '/patient' ? (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#556B70] hover:text-[#172C32] bg-white border border-[#C8DDD7] rounded-lg min-h-[36px] whitespace-nowrap transition-colors"
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
