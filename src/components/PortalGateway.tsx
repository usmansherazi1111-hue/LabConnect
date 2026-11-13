/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PortalRoute } from '../types';
import { User, Building2, Bike, ShieldCheck, ArrowRight, FileCheck2, Lock, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface PortalGatewayProps {
  onNavigate: (route: PortalRoute) => void;
}

export const PortalGateway: React.FC<PortalGatewayProps> = ({ onNavigate }) => {
  const portals: {
    route: PortalRoute;
    title: string;
    audience: string;
    summary: string;
    capabilities: string[];
    actionLabel: string;
    icon: React.ReactNode;
    accentClass: string;
  }[] = [
    {
      route: '/patient',
      title: 'Patient Marketplace & Reports',
      audience: 'Patients & Families in Lahore',
      summary: 'Compare authentic PKR rates across PHC-recognized labs, schedule home sampling, track sample cold-chain checkpoints, and download PDF reports.',
      capabilities: [
        'Official PKR tariff comparison (PHC-verified labs only)',
        'Live step-by-step vacutainer & courier tracking',
        'Signed PDF report viewer + lab-dispatched email delivery',
      ],
      actionLabel: 'Open Patient Portal',
      icon: <User className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] border-emerald-200',
    },
    {
      route: '/lab',
      title: 'Laboratory Operations SaaS',
      audience: 'Lab Branch Leads & Pathologists',
      summary: 'Isolated institutional workspace per diagnostic brand and Lahore branch. Accept orders, dispatch riders, update tariffs, and publish signed PDF reports.',
      capabilities: [
        'Strict brand & Lahore branch login gate',
        'Live appointment queue & analyzer status updates',
        'Structured PDF result generator & auto-email patient',
      ],
      actionLabel: 'Sign In to Lab Console',
      icon: <Building2 className="w-6 h-6" />,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      route: '/phlebotomist',
      title: 'Phlebotomist Field Courier App',
      audience: 'Home Sample Collection Riders',
      summary: 'Mobile-first field execution portal for verified riders. Validate fasting checks, scan vacutainer barcodes, and log 2.0°C–8.0°C cold-chain readings.',
      capabilities: [
        'Rider Code & CNIC last-4 identity gate',
        'Exact Lahore home street address dispatch',
        'Barcode & cold-chain milestones synced to patient tracker',
      ],
      actionLabel: 'Open Courier Route App',
      icon: <Bike className="w-6 h-6" />,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      route: '/admin',
      title: 'PHC Regulatory & Admin Console',
      audience: 'Platform Oversight & PHC Inspectors',
      summary: 'Strict least-privilege governance portal for certifying Punjab Healthcare Commission licences, auditing commissions, and reviewing report email logs.',
      capabilities: [
        'Mandatory SUPER_ADMIN / PHC_INSPECTOR sign-in',
        'Real-time 8% settlement ledger across Lahore labs',
        'Append-only security audit & email dispatch trail',
      ],
      actionLabel: 'Open Regulatory Console',
      icon: <ShieldCheck className="w-6 h-6" />,
      accentClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ];

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Role-Isolated Access Control</span>
          <span aria-hidden="true">·</span>
          <span>Lahore Diagnostic Network</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight max-w-3xl">
          Select Your LabConnect Portal
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Each stakeholder operates on an isolated route with dedicated authentication and strict server-side role permissions. Install on iOS or Android for standalone app access.
        </p>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <Smartphone className="w-4 h-4 text-[#0F5132] shrink-0" />
            <span>Installable PWA with offline test catalog caching & home-screen shortcuts</span>
          </div>
          <PWAInstallButton variant="card" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((portal) => (
          <div
            key={portal.route}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${portal.accentClass}`}>
                  {portal.icon}
                </div>
                <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                  {portal.route}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  {portal.audience}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{portal.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{portal.summary}</p>
              </div>

              <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                {portal.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onNavigate(portal.route)}
              className="w-full py-3 px-4 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-between min-h-[46px]"
            >
              <span>{portal.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
