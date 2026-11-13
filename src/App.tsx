/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PortalRoute } from './types';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { PortalGateway } from './components/PortalGateway';
import { PatientPortalPreview } from './components/PatientPortalPreview';
import { LabPortalPreview } from './components/LabPortalPreview';
import { PhlebotomistPortal } from './components/PhlebotomistPortal';
import { AdminPortalPreview } from './components/AdminPortalPreview';
import { RequirementsHub } from './components/RequirementsHub';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { FamilyProfilesModal } from './components/FamilyProfilesModal';

function resolveRouteFromPath(pathname: string): PortalRoute {
  if (pathname.startsWith('/patient')) return '/patient';
  if (pathname.startsWith('/lab')) return '/lab';
  if (pathname.startsWith('/phlebotomist')) return '/phlebotomist';
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/specs')) return '/specs';
  return '/';
}

function SpecsShell() {
  const [subView, setSubView] = useState<'PRD' | 'ERD'>('PRD');
  return (
    <div className="space-y-4">
      <div className="max-w-7xl mx-auto px-6 pt-6 flex items-center gap-2">
        <button
          onClick={() => setSubView('PRD')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
            subView === 'PRD' ? 'bg-[#0F5132] text-white' : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Requirements & PRD
        </button>
        <button
          onClick={() => setSubView('ERD')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
            subView === 'ERD' ? 'bg-[#0F5132] text-white' : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Database Schema & ERD
        </button>
      </div>
      {subView === 'PRD' ? <RequirementsHub /> : <ArchitectureViewer />}
    </div>
  );
}

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>(() =>
    resolveRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const [patientTab, setPatientTab] = useState<'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE'>('DISCOVER');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);

  const navigate = useCallback((route: PortalRoute) => {
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(resolveRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 flex flex-col font-sans">
      <Header
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFamily={() => setIsFamilyModalOpen(true)}
        patientTab={patientTab}
        onSelectPatientTab={setPatientTab}
      />

      <main className="flex-1 pb-24 lg:pb-8">
        {currentRoute === '/' && <PortalGateway onNavigate={navigate} />}
        {currentRoute === '/patient' && (
          <PatientPortalPreview
            activeTab={patientTab}
            onSelectTab={setPatientTab}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenFamily={() => setIsFamilyModalOpen(true)}
          />
        )}
        {currentRoute === '/lab' && <LabPortalPreview />}
        {currentRoute === '/phlebotomist' && <PhlebotomistPortal />}
        {currentRoute === '/admin' && <AdminPortalPreview />}
        {currentRoute === '/specs' && <SpecsShell />}
      </main>

      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={navigate}
        activeTab={patientTab}
        onSelectTab={setPatientTab}
      />
      <OfflineIndicator />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <FamilyProfilesModal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} />

      <footer className="hidden lg:block border-t border-slate-200 bg-white py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded bg-[#0F5132] text-white flex items-center justify-center text-[10px] font-bold">
              LC
            </span>
            <span>LabConnect Pakistan · Lahore Diagnostic Network</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-slate-600">
            <a href="/patient" onClick={(e) => { e.preventDefault(); navigate('/patient'); }} className="hover:text-slate-900">
              Patient Portal
            </a>
            <a href="/lab" onClick={(e) => { e.preventDefault(); navigate('/lab'); }} className="hover:text-slate-900">
              Laboratory SaaS
            </a>
            <a href="/phlebotomist" onClick={(e) => { e.preventDefault(); navigate('/phlebotomist'); }} className="hover:text-slate-900">
              Home Samplers
            </a>
            <a href="/admin" onClick={(e) => { e.preventDefault(); navigate('/admin'); }} className="hover:text-slate-900">
              PHC Admin
            </a>
            <a href="/specs" onClick={(e) => { e.preventDefault(); navigate('/specs'); }} className="hover:text-slate-900">
              System Specs & ERD
            </a>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            PHC Compliant · RBAC Isolated Routes
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
