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
import { AppMotionProvider, PageTransition, AnimatedTabBar } from './components/ui/MotionPrimitives';
import { Activity } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <AnimatedTabBar
          layoutId="specs-subview-tab"
          activeId={subView}
          onChange={setSubView}
          items={[
            { id: 'PRD', label: 'Requirements & PRD' },
            { id: 'ERD', label: 'Database Schema & ERD' },
          ]}
        />
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
  const [discoverySearchSeed, setDiscoverySearchSeed] = useState<string>('');
  const [discoveryCategorySeed, setDiscoveryCategorySeed] = useState<string>('ALL');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);

  const navigate = useCallback((route: PortalRoute, options?: { searchTerm?: string; category?: string; tab?: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE' }) => {
    if (options?.searchTerm !== undefined) {
      setDiscoverySearchSeed(options.searchTerm);
    }
    if (options?.category !== undefined) {
      setDiscoveryCategorySeed(options.category);
    }
    if (options?.tab) {
      setPatientTab(options.tab);
    } else if (route === '/patient' && (options?.searchTerm !== undefined || options?.category !== undefined)) {
      setPatientTab('DISCOVER');
    }

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
    <div className="min-h-screen bg-[#F8F8F3] text-[#202A27] flex flex-col">
      <Header
        currentRoute={currentRoute}
        onNavigate={(r) => navigate(r)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFamily={() => setIsFamilyModalOpen(true)}
        patientTab={patientTab}
        onSelectPatientTab={setPatientTab}
      />

      <main className="flex-1 pb-24 lg:pb-10">
        <PageTransition transitionKey={currentRoute}>
          {currentRoute === '/' && (
            <PortalGateway
              onNavigate={(route, options) => navigate(route, options)}
            />
          )}
          {currentRoute === '/patient' && (
            <PatientPortalPreview
              activeTab={patientTab}
              onSelectTab={setPatientTab}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenFamily={() => setIsFamilyModalOpen(true)}
              initialSearchTerm={discoverySearchSeed}
              initialCategory={discoveryCategorySeed}
            />
          )}
          {currentRoute === '/lab' && <LabPortalPreview />}
          {currentRoute === '/phlebotomist' && <PhlebotomistPortal />}
          {currentRoute === '/admin' && <AdminPortalPreview />}
          {currentRoute === '/specs' && <SpecsShell />}
        </PageTransition>
      </main>

      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={(r) => navigate(r)}
        activeTab={patientTab}
        onSelectTab={setPatientTab}
      />
      <OfflineIndicator />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => navigate('/patient')}
      />
      <FamilyProfilesModal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} />

      <footer className="hidden lg:block border-t border-[#DCE4DE] bg-white py-10 px-6 text-xs text-[#737D78]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-[#202A27] font-semibold">
            <span className="w-6 h-6 rounded-md bg-[#174C3C] text-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span>LabConnect Pakistan</span>
            <span className="text-[#DCE4DE]">·</span>
            <span className="text-[#737D78] font-normal">Lahore Diagnostic Network</span>
          </div>

          {currentRoute === '/' || currentRoute === '/patient' ? (
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#737D78]">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="hover:text-[#174C3C] transition-colors">
                Diagnostic Marketplace
              </a>
              <a href="/patient" onClick={(e) => { e.preventDefault(); navigate('/patient'); }} className="hover:text-[#174C3C] transition-colors">
                Patient Portal
              </a>
              <a href="#partners" onClick={(e) => { if (currentRoute !== '/') { e.preventDefault(); navigate('/'); } }} className="hover:text-[#174C3C] transition-colors">
                Verified Lahore Labs
              </a>
              <a href="#passport" onClick={(e) => { if (currentRoute !== '/') { e.preventDefault(); navigate('/'); } }} className="hover:text-[#174C3C] transition-colors">
                Health Passport
              </a>
            </div>
          ) : (
            <div className="text-xs font-medium text-[#737D78]">
              {currentRoute === '/lab' && 'Branch Lead Operations · Lahore Laboratory Network'}
              {currentRoute === '/phlebotomist' && 'Phlebotomist Field Dispatch · Cold-Chain 2.0°C–8.0°C'}
              {currentRoute === '/admin' && 'Punjab Healthcare Commission Regulatory Console'}
              {currentRoute === '/specs' && 'Architecture & Database Specifications'}
            </div>
          )}

          <div className="text-[11px] font-mono text-[#737D78]">
            PHC Licensed · 2°C–8°C Cold-Chain · Verified Network
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppMotionProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </AppMotionProvider>
  );
}
