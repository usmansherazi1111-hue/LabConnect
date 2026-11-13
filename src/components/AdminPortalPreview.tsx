/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LahoreLaboratory, EmailDispatchLog, AuditLogEntry } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, AlertCircle, RotateCw, Mail } from 'lucide-react';

interface SettlementRow {
  labId: string;
  labName: string;
  phcLicence: string;
  verificationStatus: string;
  bookingsCount: number;
  completedCount: number;
  grossPkr: number;
  commissionPkr: number;
  netPayablePkr: number;
}

export const AdminPortalPreview: React.FC = () => {
  const { adminUser, loginAdmin } = useAuth();

  const [email, setEmail] = useState<string>('admin@labconnect.pk');
  const [password, setPassword] = useState<string>('PhcAdmin@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'PHC_VERIFICATION' | 'COMMISSION_LEDGER' | 'EMAIL_DISPATCH' | 'AUDIT_LOGS'>(
    'PHC_VERIFICATION'
  );
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [metrics, setMetrics] = useState<{
    totalBookings: number;
    totalReports: number;
    totalEmailsSent: number;
    grossVolumePkr: number;
    totalCommissionPkr: number;
  }>({
    totalBookings: 0,
    totalReports: 0,
    totalEmailsSent: 0,
    grossVolumePkr: 0,
    totalCommissionPkr: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchOverview = useCallback(async () => {
    if (!adminUser) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getAdminOverview();
      if (res.success && res.data) {
        setLaboratories(res.data.laboratories || []);
        setSettlements(res.data.settlements || []);
        setAuditLogs(res.data.auditLogs || []);
        setEmailLogs(res.data.emailLogs || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchOverview();
    }
  }, [adminUser, fetchOverview]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await loginAdmin(email.trim(), password);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Access denied');
    }
  };

  const handleToggleVerification = async (labId: string) => {
    const res = await apiClient.toggleLabVerification(labId);
    if (res.success) {
      fetchOverview();
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">PHC Regulatory & Admin Sign In</h1>
            <p className="text-xs text-slate-500">
              Restricted to SUPER_ADMIN and Punjab Healthcare Commission Inspectors
            </p>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Regulatory Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? 'Verifying...' : 'Sign In to Admin Console'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <span className="font-semibold text-slate-700 block">Authorized Regulatory Accounts:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@labconnect.pk');
                setPassword('PhcAdmin@2026');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex justify-between font-mono"
            >
              <span>Platform Director (admin@labconnect.pk)</span>
              <span className="text-[#0F5132] font-semibold">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('inspector@phc.punjab.gov.pk');
                setPassword('PhcInspect@2026');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex justify-between font-mono"
            >
              <span>PHC Inspector (inspector@phc.punjab.gov.pk)</span>
              <span className="text-[#0F5132] font-semibold">Fill</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            {adminUser.role} · Punjab Healthcare Commission Division
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Governance, Licencing & Live Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live platform totals computed dynamically from runtime bookings, reports, and email logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            {[
              { id: 'PHC_VERIFICATION', label: 'PHC Licences' },
              { id: 'COMMISSION_LEDGER', label: 'Settlements' },
              { id: 'EMAIL_DISPATCH', label: `Emails (${emailLogs.length})` },
              { id: 'AUDIT_LOGS', label: `Audit (${auditLogs.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap min-h-[36px] ${
                  activeTab === t.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchOverview}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
            title="Refresh live data"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'PHC_VERIFICATION' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lahore Accredited Laboratories ({laboratories.length})
            </span>
            <span className="text-[11px] text-slate-600">
              Revoking a lab&apos;s PHC licence immediately disables patient booking across the Patient Portal &amp; API.
            </span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {laboratories.map((lab) => {
              const isVerified = lab.verificationStatus === 'VERIFIED';
              return (
                <div key={lab.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{lab.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isVerified ? 'PHC VERIFIED' : 'PHC LICENCE REVOKED — BOOKINGS BLOCKED'}
                      </span>
                    </div>
                    <div className="text-slate-600">{lab.tagline}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      PHC: {lab.phcLicence} · Branches: {lab.branches.length} · Updated By: {lab.verifiedBy}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleVerification(lab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold min-h-[40px] shrink-0 ${
                      isVerified
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-[#0F5132] hover:bg-emerald-800 text-white border border-emerald-700'
                    }`}
                  >
                    {isVerified ? 'Revoke PHC Licence' : 'Recognize & Restore PHC Licence'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'COMMISSION_LEDGER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Live Gross Booking Volume</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                PKR {metrics.grossVolumePkr.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">{metrics.totalBookings} total active bookings</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Platform Commission (8%)</span>
              <div className="text-2xl font-bold font-mono text-[#0F5132] mt-1 tabular-nums">
                PKR {metrics.totalCommissionPkr.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">Calculated directly from DB</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase">Reports Published & Emailed</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {metrics.totalReports} PDFs · {metrics.totalEmailsSent} Emails
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Laboratory</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Completed</th>
                  <th className="py-3 px-4">Gross PKR</th>
                  <th className="py-3 px-4">Fee (8%)</th>
                  <th className="py-3 px-4">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {settlements.map((row) => (
                  <tr key={row.labId}>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{row.labName}</td>
                    <td className="py-3 px-4 tabular-nums">{row.bookingsCount}</td>
                    <td className="py-3 px-4 tabular-nums">{row.completedCount}</td>
                    <td className="py-3 px-4 tabular-nums">PKR {row.grossPkr.toLocaleString()}</td>
                    <td className="py-3 px-4 tabular-nums text-emerald-800">PKR {row.commissionPkr.toLocaleString()}</td>
                    <td className="py-3 px-4 tabular-nums font-bold">PKR {row.netPayablePkr.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'EMAIL_DISPATCH' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            Patient Report Email Dispatch Ledger ({emailLogs.length})
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {emailLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span className="font-bold text-slate-900">{log.recipientEmail}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                      {log.status}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium">{log.subject}</div>
                  <div className="text-[11px] font-mono text-slate-500">Attachment: {log.attachmentFileName}</div>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {new Date(log.sentAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            Append-Only Security & Clinical Audit Trail ({auditLogs.length})
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.actor}</span>
                    <span className="text-[10px] font-mono text-slate-500">({log.role})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">Target: {log.target}</div>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
