/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MockBooking,
  LahoreLaboratory,
  DiagnosticTest,
  LaboratoryTestPricing,
  ReportParameter,
  LabPhlebotomistSummary,
} from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  Clock,
  Upload,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Settings,
  RotateCw,
  Lock,
  UserPlus,
  Mail,
  ExternalLink,
  Bike,
  Plus,
} from 'lucide-react';

export const LabPortalPreview: React.FC = () => {
  const { labUser, loginLabStaff, registerLabStaff } = useAuth();

  // 100% Runtime Catalog State
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [pricings, setPricings] = useState<LaboratoryTestPricing[]>([]);

  // Gate State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-chughtai');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('c-branch-jailrd');
  const [loginEmail, setLoginEmail] = useState<string>('kamran.lead@chughtailab.pk');
  const [loginPassword, setLoginPassword] = useState<string>('LabOps@2026');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Operations State
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilterMode, setBranchFilterMode] = useState<'ALL_BRANCHES' | 'MY_BRANCH'>('ALL_BRANCHES');
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'TARIFFS' | 'ANALYTICS'>('QUEUE');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Structured PDF Report & Email Release State
  const [pathologistName, setPathologistName] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Analyzed on calibrated automated clinical chemistry & hematology analyzers. Correlate with clinical findings.'
  );
  const [reportParams, setReportParams] = useState<ReportParameter[]>([]);
  const [sendEmailOnRelease, setSendEmailOnRelease] = useState<boolean>(true);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [isSendingEmailOnly, setIsSendingEmailOnly] = useState<boolean>(false);
  const [emailOnlySuccess, setEmailOnlySuccess] = useState<string | null>(null);
  const [emailOnlyError, setEmailOnlyError] = useState<string | null>(null);

  // Phlebotomist Dispatch State
  const [labRiders, setLabRiders] = useState<LabPhlebotomistSummary[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isDispatchingRider, setIsDispatchingRider] = useState<boolean>(false);

  // Live Tariff Edit State
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');
  const [editTatVal, setEditTatVal] = useState<string>('');

  const loadCatalog = useCallback(async () => {
    try {
      const res = await apiClient.getCatalog();
      if (res.success && res.data) {
        setLaboratories(res.data.laboratories || []);
        setTests(res.data.tests || []);
        setPricings(res.data.pricings || []);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  }, []);

  const fetchLiveBookings = useCallback(async () => {
    if (!labUser) return;
    setIsLoading(true);
    try {
      const [bkRes, ridersRes] = await Promise.all([
        apiClient.getBookings({}, 'lab'),
        apiClient.getLabPhlebotomists(),
      ]);
      if (bkRes.success && Array.isArray(bkRes.data)) {
        setBookings(bkRes.data);
        if (bkRes.data.length > 0) {
          setSelectedBooking((prev) => bkRes.data.find((b: MockBooking) => b.id === prev?.id) || bkRes.data[0]);
        } else {
          setSelectedBooking(null);
        }
      }
      if (ridersRes.success && Array.isArray(ridersRes.data)) {
        setLabRiders(ridersRes.data);
        if (ridersRes.data.length > 0) {
          setSelectedRiderId((prev) => ridersRes.data.some((r: LabPhlebotomistSummary) => r.id === prev) ? prev : ridersRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load lab bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [labUser]);

  useEffect(() => {
    loadCatalog();
    const onFocus = () => loadCatalog();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadCatalog]);

  useEffect(() => {
    if (labUser) {
      setPathologistName(`${labUser.name}, FCPS Pathology`);
      fetchLiveBookings();
    } else {
      setBookings([]);
      setSelectedBooking(null);
      setLabRiders([]);
    }
  }, [labUser, fetchLiveBookings]);

  useEffect(() => {
    if (selectedBooking) {
      setRecipientEmail(selectedBooking.patientEmail || '');
      const initialParams: ReportParameter[] = [];
      for (const tid of selectedBooking.testIds) {
        const testDef = tests.find((t) => t.id === tid);
        if (testDef?.defaultParameters?.length) {
          for (const dp of testDef.defaultParameters) {
            initialParams.push({
              parameter: dp.parameter,
              observedValue: dp.defaultValue,
              unit: dp.unit,
              referenceRange: dp.referenceRange,
              flag: dp.flag,
            });
          }
        } else if (testDef) {
          initialParams.push({
            parameter: testDef.name,
            observedValue: 'Within Reference',
            unit: 'Std',
            referenceRange: testDef.commonNormalRange.slice(0, 32),
            flag: 'NORMAL',
          });
        }
      }
      setReportParams(initialParams);
    } else {
      setReportParams([]);
    }
  }, [selectedBooking?.id, selectedBooking?.patientEmail, tests]);

  const gateLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
  const operatorLab = laboratories.find((l) => l.id === labUser?.labId) || gateLab;
  const operatorBranch =
    operatorLab?.branches.find((b) => b.id === labUser?.branchId) || operatorLab?.branches[0];

  const handleLabLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await loginLabStaff(loginEmail.trim(), loginPassword, selectedLabId, selectedBranchId);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleLabRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await registerLabStaff({
      fullName: regFullName.trim(),
      email: loginEmail.trim(),
      password: loginPassword,
      phone: regPhone.trim(),
      labId: selectedLabId,
      branchId: selectedBranchId,
    });
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Registration failed');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MockBooking['status']) => {
    try {
      const res = await apiClient.updateBookingStatus(id, newStatus, undefined, undefined, 'lab');
      if (res.success && res.data) {
        setBookings((prev) => prev.map((b) => (b.id === id ? res.data : b)));
        setSelectedBooking(res.data);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleReleasePdfReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    const targetEmail = recipientEmail.trim();
    if (sendEmailOnRelease && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setUploadErrorMsg('Enter a valid patient email address so the report can be emailed simultaneously on release.');
      return;
    }

    const cleanedParams = reportParams.filter((p) => p.parameter.trim() && p.observedValue.trim());
    if (cleanedParams.length === 0) {
      setUploadErrorMsg('Enter at least one observed clinical parameter value before publishing the PDF.');
      return;
    }

    setIsUploading(true);

    try {
      const res = await apiClient.uploadReport({
        bookingNumber: selectedBooking.bookingNumber,
        pathologistName: pathologistName.trim(),
        clinicalNotes: clinicalNotes.trim(),
        parameters: cleanedParams,
        sendEmailToPatient: sendEmailOnRelease,
        recipientEmailOverride: targetEmail || undefined,
      });

      if (res.success) {
        setUploadSuccessMsg(res.message || `PDF published for ${selectedBooking.bookingNumber}`);
        await fetchLiveBookings();
      } else {
        setUploadErrorMsg(res.error || 'Failed to publish report');
      }
    } catch {
      setUploadErrorMsg('Network error releasing report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedBooking || !selectedRiderId) return;
    setDispatchMsg(null);
    setDispatchError(null);
    setIsDispatchingRider(true);
    try {
      const res = await apiClient.assignPhlebotomist(selectedBooking.id, selectedRiderId);
      if (res.success && res.data) {
        setDispatchMsg(res.message || 'Phlebotomist dispatched');
        setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? res.data : b)));
        setSelectedBooking(res.data);
      } else {
        setDispatchError(res.error || 'Failed to assign phlebotomist');
      }
    } catch {
      setDispatchError('Network error assigning phlebotomist');
    } finally {
      setIsDispatchingRider(false);
    }
  };

  const handleSendExistingReportEmail = async () => {
    if (!selectedBooking) return;
    setEmailOnlySuccess(null);
    setEmailOnlyError(null);
    const targetEmail = recipientEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setEmailOnlyError('Enter a valid patient email address before sending the PDF report.');
      return;
    }
    setIsSendingEmailOnly(true);
    try {
      const res = await apiClient.sendReportEmail(selectedBooking.bookingNumber, targetEmail, 'lab');
      if (res.success) {
        setEmailOnlySuccess(res.message || `Signed PDF dispatched to ${targetEmail}`);
        await fetchLiveBookings();
      } else {
        setEmailOnlyError(res.error || 'Failed to email report to patient');
      }
    } catch {
      setEmailOnlyError('Network error emailing PDF report');
    } finally {
      setIsSendingEmailOnly(false);
    }
  };

  const handleSaveTariff = async (pricingId: string) => {
    const res = await apiClient.updatePricing(pricingId, {
      pricePkr: Number(editPriceVal),
      statedTurnaroundHours: Number(editTatVal),
    });
    if (res.success) {
      setEditingPricingId(null);
      loadCatalog();
    }
  };

  // Unauthenticated Institutional Gate
  if (!labUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Laboratory Operations Sign In</h1>
            <p className="text-xs text-slate-500">
              Strict institutional access locked to your verified Lahore laboratory & branch
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGN_IN');
                setLoginError(null);
              }}
              className={`py-2 rounded-lg min-h-[38px] ${
                authTab === 'SIGN_IN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Staff Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGN_UP');
                setLoginError(null);
              }}
              className={`py-2 rounded-lg min-h-[38px] ${
                authTab === 'SIGN_UP' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Register Staff
            </button>
          </div>

          <form onSubmit={authTab === 'SIGN_IN' ? handleLabLogin : handleLabRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnostic Laboratory Network:</label>
              <select
                value={selectedLabId}
                onChange={(e) => {
                  const nid = e.target.value;
                  setSelectedLabId(nid);
                  const found = laboratories.find((l) => l.id === nid);
                  if (found && found.branches.length > 0) setSelectedBranchId(found.branches[0].id);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              >
                {laboratories.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.phcLicence})
                  </option>
                ))}
              </select>
            </div>

            {gateLab && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lahore Physical Branch:</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                >
                  {gateLab.branches.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name} — {br.area}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {authTab === 'SIGN_UP' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Legal Name:</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Dr. Kamran Chughtai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile (+92):</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0321 4455667"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institutional Email:</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password:</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
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
              className="w-full py-2.5 bg-[#0F5132] text-white rounded-xl font-semibold hover:bg-emerald-800 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {authTab === 'SIGN_IN' ? <Lock className="w-3.5 h-3.5" /> : <UserPlus className="w-4 h-4" />}
              <span>{isLoggingIn ? 'Verifying...' : authTab === 'SIGN_IN' ? 'Sign In to Lab Console' : 'Register Staff'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <span className="font-semibold text-slate-700 block">Verified Institutional Demo Accounts:</span>
            {[
              { lab: 'lab-chughtai', br: 'c-branch-jailrd', email: 'kamran.lead@chughtailab.pk', pw: 'LabOps@2026', label: 'Chughtai Lab (Jail Rd)' },
              { lab: 'lab-skmch', br: 'sk-branch-johar', email: 'ops@skm.org.pk', pw: 'Skmch@2026', label: 'SKMCH (Johar Town)' },
              { lab: 'lab-idc', br: 'idc-branch-shadman', email: 'ops@idc.net.pk', pw: 'IdcOps@2026', label: 'IDC (Shadman)' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setAuthTab('SIGN_IN');
                  setSelectedLabId(acc.lab);
                  setSelectedBranchId(acc.br);
                  setLoginEmail(acc.email);
                  setLoginPassword(acc.pw);
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex justify-between font-mono"
              >
                <span>{acc.label}</span>
                <span className="text-[#0F5132] font-semibold">Fill</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesBranch = branchFilterMode === 'ALL_BRANCHES' || b.branchId === labUser.branchId;
    return matchesStatus && matchesBranch;
  });

  const labPricings = pricings.filter((p) => p.labId === labUser.labId);
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const grossRevenuePkr = bookings.reduce((sum, b) => sum + (b.totalPkr || 0), 0);

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* Isolated Laboratory Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            {operatorLab?.phcLicence || 'PHC Verified'} · RBAC Scoped to {operatorLab?.name}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{operatorLab?.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Operator: <strong>{labUser.name}</strong> · Active Branch: <strong>{operatorBranch?.name}</strong> ({operatorBranch?.address})
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
          {[
            { id: 'QUEUE', label: `Appointments (${bookings.length})` },
            { id: 'TARIFFS', label: 'Published Tariffs' },
            { id: 'ANALYTICS', label: 'Metrics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap min-h-[38px] ${
                activeSubTab === tab.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {operatorLab && operatorLab.verificationStatus !== 'VERIFIED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">PHC Regulatory Licence Revoked — New Patient Bookings Disabled</div>
            <div className="text-rose-800 mt-0.5">
              PHC Regulatory &amp; Admin Console has marked {operatorLab.name} as{' '}
              <span className="font-mono font-bold">{operatorLab.verificationStatus}</span>. Patients cannot place new
              bookings until PHC verification is restored, though existing in-progress orders can still be completed.
            </div>
          </div>
        </div>
      )}

      {/* QUEUE WORKSPACE */}
      {activeSubTab === 'QUEUE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bookings List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Branch Queue ({filteredBookings.length})
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={branchFilterMode}
                  onChange={(e) => setBranchFilterMode(e.target.value as 'ALL_BRANCHES' | 'MY_BRANCH')}
                  className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1"
                >
                  <option value="ALL_BRANCHES">All Lab Branches</option>
                  <option value="MY_BRANCH">My Branch Only</option>
                </select>
                <button onClick={fetchLiveBookings} className="text-xs text-[#0F5132] font-semibold flex items-center gap-1">
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['ALL', 'PENDING', 'ACCEPTED', 'DISPATCHED', 'SAMPLE_COLLECTED', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap ${
                    statusFilter === st ? 'bg-[#0F5132] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredBookings.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No appointments in queue for this filter.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setUploadSuccessMsg(null);
                      setUploadErrorMsg(null);
                      setEmailOnlySuccess(null);
                      setEmailOnlyError(null);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                      selectedBooking?.id === b.id
                        ? 'bg-emerald-50/50 border-[#0F5132]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900">{b.bookingNumber}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {b.phlebotomistStatus || b.status}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">{b.patientName}</div>
                    <div className="text-slate-500 mt-0.5 truncate">
                      {b.branchName} · {b.scheduledTimeSlot}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between font-mono">
                      <span>{b.collectionType.replace('_', ' ')}</span>
                      <span className="font-bold text-slate-900">PKR {b.totalPkr.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail & Report Release */}
          {selectedBooking ? (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {selectedBooking.bookingNumber}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 pt-1">{selectedBooking.patientName}</h2>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-3">
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedBooking.patientPhone}
                    </span>
                    {selectedBooking.patientEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedBooking.patientEmail}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{selectedBooking.streetAddress || selectedBooking.branchName}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Tariff</div>
                  <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    PKR {selectedBooking.totalPkr.toLocaleString()}
                  </div>
                  {selectedBooking.sampleBarcode && (
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                      Barcode: {selectedBooking.sampleBarcode}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Milestone Buttons */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Update Laboratory Stage (Syncs Live Patient Tracking)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['ACCEPTED', 'DISPATCHED', 'PROCESSING'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedBooking.id, st)}
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-[#0F5132] border border-slate-200 rounded-lg min-h-[38px]"
                    >
                      Mark {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Phlebotomist Assignment Dispatch */}
              {selectedBooking.collectionType === 'HOME_COLLECTION' && selectedBooking.status !== 'CANCELLED' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Bike className="w-4 h-4 text-[#0F5132]" />
                      <span>Assign Field Phlebotomist</span>
                    </span>
                    {selectedBooking.phlebotomistName && (
                      <span className="font-mono text-[11px] text-emerald-800 font-semibold">
                        Assigned: {selectedBooking.phlebotomistName}
                      </span>
                    )}
                  </div>

                  {labRiders.length === 0 ? (
                    <div className="text-[11px] text-slate-500">
                      No registered couriers found for this lab yet. Couriers can register at /phlebotomist.
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedRiderId}
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 min-h-[40px]"
                      >
                        {labRiders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.staffCode ? `(${r.staffCode})` : ''} — {r.phone}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isDispatchingRider}
                        onClick={handleAssignRider}
                        className="px-4 py-2 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-lg font-semibold whitespace-nowrap min-h-[40px] disabled:opacity-50"
                      >
                        {isDispatchingRider ? 'Dispatching...' : 'Assign & Dispatch Rider'}
                      </button>
                    </div>
                  )}

                  {dispatchMsg && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">{dispatchMsg}</div>
                  )}
                  {dispatchError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{dispatchError}</div>
                  )}
                </div>
              )}

              {/* Multi-Parameter PDF Result Publisher & Automated Email Dispatch */}
              <form onSubmit={handleReleasePdfReport} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                      Pathology Workbench · Generate Signed PDF &amp; Email Patient
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Creates verifiable %PDF-1.4 document with SHA-256 checksum &amp; delivers to patient portal + email.
                    </p>
                  </div>
                  <FileText className="w-5 h-5 text-[#0F5132]" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signing Pathologist:</label>
                  <input
                    type="text"
                    required
                    value={pathologistName}
                    onChange={(e) => setPathologistName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Structured Clinical Parameters ({reportParams.length}):
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setReportParams((prev) => [
                          ...prev,
                          { parameter: '', observedValue: '', unit: 'mg/dL', referenceRange: 'Reference', flag: 'NORMAL' },
                        ])
                      }
                      className="text-[11px] font-semibold text-[#0F5132] flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Parameter</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {reportParams.map((param, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1.5 bg-white border border-slate-200 rounded-lg p-2 items-center">
                        <input
                          type="text"
                          value={param.parameter}
                          placeholder="Parameter"
                          onChange={(e) =>
                            setReportParams((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, parameter: e.target.value } : item))
                            )
                          }
                          className="col-span-4 border border-slate-200 rounded px-2 py-1.5 text-[11px] font-medium"
                        />
                        <input
                          type="text"
                          value={param.observedValue}
                          placeholder="Observed"
                          onChange={(e) =>
                            setReportParams((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, observedValue: e.target.value } : item))
                            )
                          }
                          className="col-span-3 border border-slate-200 rounded px-2 py-1.5 font-mono text-[11px] font-bold"
                        />
                        <span className="col-span-2 text-[10px] font-mono text-slate-500 truncate" title={param.referenceRange}>
                          {param.unit || '-'}
                        </span>
                        <select
                          value={param.flag}
                          onChange={(e) =>
                            setReportParams((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, flag: e.target.value as ReportParameter['flag'] } : item
                              )
                            )
                          }
                          className="col-span-3 border border-slate-200 rounded px-1.5 py-1.5 font-mono text-[10px] font-bold bg-slate-50"
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="HIGH">HIGH</option>
                          <option value="LOW">LOW</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Pathologist Notes:</label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Email Recipient (Simultaneous Portal + Email Delivery):
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg p-2.5">
                  <input
                    type="checkbox"
                    checked={sendEmailOnRelease}
                    onChange={(e) => setSendEmailOnRelease(e.target.checked)}
                    className="accent-[#0F5132]"
                  />
                  <span className="text-slate-700 font-medium">
                    Send PDF attachment to patient email at the exact time report is published to Patient Portal
                  </span>
                </label>

                {uploadErrorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{uploadErrorMsg}</div>
                )}
                {uploadSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {uploadSuccessMsg}
                    </span>
                    <a
                      href={apiClient.getReportPdfUrl(selectedBooking.bookingNumber, false, 'lab')}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline flex items-center gap-1 shrink-0"
                    >
                      Open PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Publishing & Dispatching...' : 'Publish Signed PDF & Email Patient'}</span>
                </button>
              </form>

              {/* Lab-Exclusive Email Control for Published Reports */}
              {selectedBooking.reportUrl && (
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#0F5132]" />
                        <span>Lab-Controlled Patient Email Dispatch</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {selectedBooking.emailDispatchedAt
                          ? `Last emailed to patient at ${new Date(selectedBooking.emailDispatchedAt).toLocaleString()}`
                          : 'Signed PDF is live in Patient Portal; send directly to patient email below.'}
                      </p>
                    </div>
                    <a
                      href={apiClient.getReportPdfUrl(selectedBooking.bookingNumber, false, 'lab')}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-[#0F5132] flex items-center gap-1 self-start"
                    >
                      <span>View Signed PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 min-h-[40px]"
                    />
                    <button
                      type="button"
                      disabled={isSendingEmailOnly}
                      onClick={handleSendExistingReportEmail}
                      className="px-4 py-2 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-lg font-semibold whitespace-nowrap min-h-[40px] disabled:opacity-50"
                    >
                      {isSendingEmailOnly ? 'Sending PDF...' : 'Send / Resend PDF to Patient Email'}
                    </button>
                  </div>

                  {emailOnlySuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{emailOnlySuccess}</span>
                    </div>
                  )}
                  {emailOnlyError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{emailOnlyError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
              Select a booking on the left to manage operational stages and publish reports.
            </div>
          )}
        </div>
      )}

      {/* TARIFFS MANAGEMENT (RUNTIME EDITABLE) */}
      {activeSubTab === 'TARIFFS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#0F5132]" />
                <span>Live Published Tariffs — {operatorLab?.name}</span>
              </h2>
              <p className="text-xs text-slate-500">Updates persist to database and reflect immediately in Patient Marketplace.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Published Rate</th>
                  <th className="py-3 px-4">Discounted</th>
                  <th className="py-3 px-4">TAT (Hrs)</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labPricings.map((pr) => {
                  const test = tests.find((t) => t.id === pr.testId);
                  const isEditing = editingPricingId === pr.id;
                  return (
                    <tr key={pr.id}>
                      <td className="py-3 px-4 font-mono font-bold">{test?.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{test?.name}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPriceVal}
                            onChange={(e) => setEditPriceVal(e.target.value)}
                            className="w-24 border border-slate-300 rounded px-2 py-1"
                          />
                        ) : (
                          `PKR ${pr.pricePkr.toLocaleString()}`
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#0F5132]">
                        {pr.discountedPricePkr ? `PKR ${pr.discountedPricePkr.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editTatVal}
                            onChange={(e) => setEditTatVal(e.target.value)}
                            className="w-16 border border-slate-300 rounded px-2 py-1"
                          />
                        ) : (
                          `${pr.statedTurnaroundHours}h`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveTariff(pr.id)}
                              className="px-2.5 py-1 bg-[#0F5132] text-white rounded font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPricingId(null)}
                              className="px-2 py-1 text-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPricingId(pr.id);
                              setEditPriceVal(String(pr.pricePkr));
                              setEditTatVal(String(pr.statedTurnaroundHours));
                            }}
                            className="text-[#0F5132] font-semibold hover:underline"
                          >
                            Edit Rate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeSubTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Orders</span>
            <div className="text-3xl font-bold font-mono text-slate-900 mt-2 tabular-nums">{bookings.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <span className="text-xs font-semibold text-slate-500 uppercase">Signed PDFs Published</span>
            <div className="text-3xl font-bold font-mono text-[#0F5132] mt-2 tabular-nums">{completedCount}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gross Lab Volume</span>
            <div className="text-3xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
              PKR {grossRevenuePkr.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
