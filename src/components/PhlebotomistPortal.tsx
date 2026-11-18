/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MockBooking, LahoreLaboratory, DiagnosticTest } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  MapPin,
  Phone,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  QrCode,
  Navigation,
  FileCheck,
  UserPlus,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { AnimatedTabBar, LC_EASE, SkeletonBlock } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import { AnimatePresence, motion } from 'motion/react';

export const PhlebotomistPortal: React.FC = () => {
  const { authReady, phlebUser, loginPhlebotomist, registerPhlebotomist } = useAuth();

  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);

  // Auth Form State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [staffCode, setStaffCode] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regCnicLast4, setRegCnicLast4] = useState<string>('');
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-chughtai');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('c-branch-jailrd');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Field Operations State
  const [coldBoxTemp, setColdBoxTemp] = useState<number>(4.2);
  const [assignedBookings, setAssignedBookings] = useState<MockBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<MockBooking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [fastingVerified, setFastingVerified] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    apiClient
      .getCatalog()
      .then((res) => {
        if (res.success && res.data) {
          setLaboratories(res.data.laboratories || []);
          setTests(res.data.tests || []);
        }
      })
      .catch((err) => console.error('Failed to fetch catalog:', err));
  }, []);

  const fetchPhlebotomistQueue = useCallback(async () => {
    if (!phlebUser) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getBookings({}, 'phlebotomist');
      if (res.success && Array.isArray(res.data)) {
        setAssignedBookings(res.data);
        if (res.data.length > 0) {
          setActiveBooking((prev) => res.data.find((b: MockBooking) => b.id === prev?.id) || res.data[0]);
        } else {
          setActiveBooking(null);
        }
      }
    } catch (err) {
      console.error('Failed to load rider queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [phlebUser]);

  useEffect(() => {
    if (phlebUser) {
      fetchPhlebotomistQueue();
    } else {
      setAssignedBookings([]);
      setActiveBooking(null);
    }
  }, [phlebUser, fetchPhlebotomistQueue]);

  const currentLabObj = laboratories.find((l) => l.id === selectedLabId);
  const availableBranches = currentLabObj?.branches || [];

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (regCnicLast4.trim().length !== 4) {
      setLoginError('Enter the last 4 digits of your registered CNIC.');
      return;
    }
    setIsLoggingIn(true);
    const res = await loginPhlebotomist(
      staffCode.trim(),
      staffPhone.trim(),
      regCnicLast4.trim(),
      selectedLabId,
      selectedBranchId
    );
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await registerPhlebotomist({
      fullName: regFullName.trim(),
      staffCode: staffCode.trim(),
      phone: staffPhone.trim(),
      cnicLast4: regCnicLast4.trim(),
      labId: selectedLabId,
      branchId: selectedBranchId,
    });
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Courier registration failed');
    }
  };

  const handleStatusTransition = async (
    bookingId: string,
    newStatus: MockBooking['status'],
    courierStatus: NonNullable<MockBooking['phlebotomistStatus']>,
    barcode?: string
  ) => {
    setActionError(null);
    setActionSuccess(null);

    if (courierStatus === 'SAMPLE_COLLECTED' && !fastingVerified) {
      setActionError('Please verify patient fasting status before confirming blood draw.');
      return;
    }
    if (courierStatus === 'SAMPLE_COLLECTED' && (!barcode || barcode.trim().length < 6)) {
      setActionError('Scan or enter a 6+ character Vacutainer Barcode before sealing specimen.');
      return;
    }
    if (coldBoxTemp < 2.0 || coldBoxTemp > 8.0) {
      setActionError(`Cold-chain violation (${coldBoxTemp}°C). Must be strictly 2.0°C – 8.0°C.`);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiClient.updateBookingStatus(
        bookingId,
        newStatus,
        phlebUser?.name,
        {
          phlebotomistStatus: courierStatus,
          sampleBarcode: barcode || barcodeInput || undefined,
          coldChainTempCelsius: coldBoxTemp,
          fastingConfirmed: fastingVerified,
        },
        'phlebotomist'
      );

      if (res.success && res.data) {
        setActionSuccess(`Live patient tracker updated: ${courierStatus.replace(/_/g, ' ')}`);
        setAssignedBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
        setActiveBooking(res.data);
        if (courierStatus === 'SAMPLE_COLLECTED') {
          setBarcodeInput('');
          setFastingVerified(false);
        }
      } else {
        setActionError(res.error || 'Failed to update status');
      }
    } catch {
      setActionError('Network error updating courier status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!authReady) {
    return <AuthSessionLoader label="Verifying Phlebotomist route session..." />;
  }

  if (!phlebUser) {
    return (
      <PortalAuthShell
        portalTag="Phlebotomist Field Courier App"
        headline="Cold-Chain Home Sampling & Dispatch"
        subheadline="Sign in with your verified rider code and registered mobile number to access assigned Lahore stops, scan vacutainer barcodes, and log 2.0°C–8.0°C box temperatures."
        icon={<Bike className="w-4 h-4" />}
        highlights={[
          {
            label: 'Insulated Carrier Monitoring',
            value: '2.0°C – 8.0°C Enforced',
            meta: 'Live Log',
            icon: <Thermometer className="w-4 h-4" />,
          },
          {
            label: 'Vacutainer Sealing',
            value: '6+ Char Barcode & Fasting Check',
            meta: 'Chain',
            icon: <QrCode className="w-4 h-4" />,
          },
          {
            label: 'Lahore Street Dispatch',
            value: 'Branch-Assigned Route Stops',
            meta: 'GPS Ready',
            icon: <Navigation className="w-4 h-4" />,
          },
        ]}
        checklist={[
          'Scoped strictly to your assigned laboratory hub',
          'Real-time status synced directly to patient tracker',
          'Tamper-safe chain-of-custody specimen timestamps',
        ]}
        footerNote="Lahore Field Dispatch Portal"
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
            Courier Authentication
          </span>
          <h2 className="text-2xl font-bold text-[#202A27] tracking-tight">
            {authTab === 'SIGN_IN' ? 'Phlebotomist Sign In' : 'Register Field Agent'}
          </h2>
          <p className="text-xs text-[#737D78]">
            Authenticate with your Rider Staff Code, 4-digit CNIC suffix, and registered +92 mobile number.
          </p>
        </div>

        <AnimatedTabBar
          layoutId="phleb-auth-tab"
          activeId={authTab}
          onChange={(t) => {
            setAuthTab(t);
            setLoginError(null);
          }}
          className="w-full grid grid-cols-2"
          items={[
            { id: 'SIGN_IN', label: 'Courier Sign In' },
            { id: 'SIGN_UP', label: 'Register Agent' },
          ]}
        />

        <AuthErrorBanner message={loginError} />

        <AnimatePresence mode="wait">
          <motion.form
            key={authTab}
            initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            onSubmit={authTab === 'SIGN_IN' ? handleStaffLogin : handleStaffRegister}
            className="space-y-3.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">Parent Laboratory</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setSelectedLabId(nid);
                    const lab = laboratories.find((l) => l.id === nid);
                    if (lab && lab.branches.length > 0) setSelectedBranchId(lab.branches[0].id);
                  }}
                  className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                >
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </div>
              {availableBranches.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#202A27] mb-1.5">Dispatch Hub</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                  >
                    {availableBranches.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.name} ({br.area})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {authTab === 'SIGN_UP' && (
              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Usman Ali"
                  className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">Rider Staff Code</label>
                <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                  <QrCode className="w-4 h-4 text-[#737D78] shrink-0" />
                  <input
                    type="text"
                    required
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="MOTO-04"
                    className="w-full bg-transparent px-2.5 py-2.5 font-mono font-semibold text-[#202A27] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">CNIC Last 4 Digits</label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={regCnicLast4}
                  onChange={(e) => setRegCnicLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 font-mono text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">Registered Mobile (+92)</label>
              <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                <Phone className="w-4 h-4 text-[#737D78] shrink-0" />
                <input
                  type="text"
                  required
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full bg-transparent px-2.5 py-2.5 font-mono text-[#202A27] focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[46px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authTab === 'SIGN_UP' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {isLoggingIn
                  ? 'Verifying Courier...'
                  : authTab === 'SIGN_IN'
                  ? 'Open Field Route'
                  : 'Register & Activate Courier'}
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-3 border-t border-[#E8EFE8] text-[11px] text-[#737D78]">
          All home collection samples require mandatory fasting confirmation and 2.0°C–8.0°C thermal verification.
        </div>
      </PortalAuthShell>
    );
  }

  const riderLab = laboratories.find((l) => l.id === phlebUser.labId);
  const riderBranch = riderLab?.branches.find((b) => b.id === phlebUser.branchId) || riderLab?.branches[0];
  const isTempSafe = coldBoxTemp >= 2.0 && coldBoxTemp <= 8.0;
  const tempMeterPct = Math.max(5, Math.min(95, (coldBoxTemp / 10) * 100));

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* Rider Workspace Header + Cold Box Meter */}
      <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold text-[#28745B] uppercase tracking-wider mb-1">
            {riderLab?.name} · {phlebUser.staffCode || 'COURIER'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202A27]">{phlebUser.name}</h1>
          <p className="text-xs text-[#737D78] mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#28745B]" />
            <span>Dispatch Hub: {riderBranch ? `${riderBranch.name}, ${riderBranch.address}` : phlebUser.area}</span>
          </p>
        </div>

        <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-3.5 flex items-center justify-between gap-4 min-w-[270px]">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2.5 rounded-xl ${isTempSafe ? 'bg-[#E8EFE8] text-[#174C3C]' : 'bg-rose-100 text-rose-800'}`}>
              <Thermometer className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-[#737D78] uppercase font-semibold">
                <span>Cold Box</span>
                <span className={isTempSafe ? 'text-[#28745B]' : 'text-rose-700'}>
                  {isTempSafe ? '2–8°C Safe' : 'Out of Range'}
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-[#202A27] tabular-nums">
                {coldBoxTemp.toFixed(1)}°C
              </div>
              <div className="mt-1 h-1.5 bg-white border border-[#DCE4DE] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isTempSafe ? 'bg-[#28745B]' : 'bg-rose-600'}`}
                  style={{ width: `${tempMeterPct}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setColdBoxTemp(+(2.6 + Math.random() * 3.8).toFixed(1))}
            className="px-3.5 py-2 bg-white hover:bg-[#E8EFE8] border border-[#DCE4DE] rounded-xl text-xs font-semibold text-[#174C3C] min-h-[40px] shrink-0 transition-colors"
          >
            Read Sensor
          </button>
        </div>
      </div>

      {/* Queue + Thumb-Friendly Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#202A27]">
              Assigned Home Pickups ({assignedBookings.length})
            </h2>
            <button
              type="button"
              onClick={fetchPhlebotomistQueue}
              className="text-xs text-[#174C3C] hover:text-[#28745B] font-semibold flex items-center gap-1"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoading && assignedBookings.length === 0 ? (
            <div className="space-y-2">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
          ) : assignedBookings.length === 0 ? (
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-8 text-center text-xs text-[#737D78]">
              No home sampling pickups assigned for {riderLab?.name || 'your laboratory'} right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedBookings.map((b) => {
                const isSelected = activeBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveBooking(b);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    className={`border rounded-xl p-4 cursor-pointer text-xs space-y-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#E8EFE8]/70 border-[#174C3C]'
                        : 'bg-white border-[#DCE4DE] hover:bg-[#F8F8F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#202A27]">{b.patientName}</span>
                      <span className="font-mono text-[10px] font-semibold text-[#174C3C]">
                        {b.phlebotomistStatus || b.status}
                      </span>
                    </div>
                    <div className="font-mono text-[#737D78]">
                      {b.bookingNumber} · {b.scheduledTimeSlot}
                    </div>
                    <div className="text-[#737D78] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#28745B]" />
                      <span>{b.streetAddress || b.patientArea}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {activeBooking ? (
              <motion.div
                key={activeBooking.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-4 gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#174C3C]">{activeBooking.bookingNumber}</span>
                    <h2 className="text-xl font-bold text-[#202A27] mt-0.5">{activeBooking.patientName}</h2>
                    <p className="text-xs text-[#737D78] mt-1">
                      {activeBooking.streetAddress || activeBooking.patientArea}
                    </p>
                  </div>
                  <a
                    href={`tel:${activeBooking.patientPhone}`}
                    className="px-4 py-2.5 bg-[#E8EFE8] hover:bg-[#DCE7DC] border border-[#28745B]/25 text-[#174C3C] rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[44px] shrink-0 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Patient</span>
                  </a>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#737D78] uppercase tracking-wider mb-2">
                    Specimens Ordered
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeBooking.testIds.map((tid) => {
                      const t = tests.find((item) => item.id === tid);
                      return (
                        <span
                          key={tid}
                          className="text-xs bg-[#F8F8F3] border border-[#DCE4DE] px-3 py-1.5 rounded-xl font-medium text-[#202A27]"
                        >
                          {t ? `${t.name} (${t.sampleType})` : tid}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {actionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}
                {actionSuccess && (
                  <div className="p-3 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'EN_ROUTE')}
                    disabled={isUpdating}
                    className={`p-4 rounded-xl border text-left text-xs min-h-[56px] transition-colors active:scale-[0.99] ${
                      activeBooking.phlebotomistStatus === 'EN_ROUTE'
                        ? 'bg-[#E8EFE8] border-[#174C3C]'
                        : 'bg-white border-[#DCE4DE] hover:border-[#174C3C]'
                    }`}
                  >
                    <div className="font-bold text-[#202A27] flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-[#174C3C]" />
                      <span>1. Mark En Route</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'ARRIVED')}
                    disabled={isUpdating}
                    className={`p-4 rounded-xl border text-left text-xs min-h-[56px] transition-colors active:scale-[0.99] ${
                      activeBooking.phlebotomistStatus === 'ARRIVED'
                        ? 'bg-[#E8EFE8] border-[#174C3C]'
                        : 'bg-white border-[#DCE4DE] hover:border-[#174C3C]'
                    }`}
                  >
                    <div className="font-bold text-[#202A27] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>2. Arrived at Door</span>
                    </div>
                  </button>
                </div>

                <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 space-y-3 text-xs">
                  <div className="font-bold text-[#202A27] flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#174C3C]" />
                    <span>3. Fasting Check &amp; Vacutainer Barcode</span>
                  </div>
                  <label className="flex items-start gap-2.5 bg-white border border-[#DCE4DE] p-3 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fastingVerified}
                      onChange={(e) => setFastingVerified(e.target.checked)}
                      className="mt-0.5 accent-[#174C3C]"
                    />
                    <span className="text-xs text-[#202A27]">
                      Confirmed patient fasting status and tube patient ID label match.
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="VAC-LHR-98214"
                      className="flex-1 bg-white border border-[#DCE4DE] rounded-xl p-2.5 font-mono text-[#202A27] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setBarcodeInput(`VAC-LHR-${Math.floor(10000 + Math.random() * 90000)}`)}
                      className="px-3.5 py-2 bg-[#E8EFE8] hover:bg-[#DCE7DC] rounded-xl font-semibold text-[#174C3C] min-h-[44px] transition-colors"
                    >
                      Scan / Gen
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusTransition(activeBooking.id, 'SAMPLE_COLLECTED', 'SAMPLE_COLLECTED', barcodeInput)
                    }
                    disabled={isUpdating}
                    className="w-full py-3 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[48px] transition-colors active:scale-[0.98]"
                  >
                    Confirm Sample Collected &amp; Sealed ({coldBoxTemp.toFixed(1)}°C)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'IN_TRANSIT')}
                    disabled={isUpdating}
                    className={`p-4 rounded-xl border text-left text-xs min-h-[56px] transition-colors active:scale-[0.99] ${
                      activeBooking.phlebotomistStatus === 'IN_TRANSIT'
                        ? 'bg-[#E8EFE8] border-[#174C3C]'
                        : 'bg-white border-[#DCE4DE] hover:border-[#174C3C]'
                    }`}
                  >
                    <div className="font-bold text-[#202A27] flex items-center gap-2">
                      <Bike className="w-4 h-4 text-[#174C3C]" />
                      <span>4. In Cold-Chain Transit</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'RECEIVED_AT_LAB')}
                    disabled={isUpdating}
                    className={`p-4 rounded-xl border text-left text-xs min-h-[56px] transition-colors active:scale-[0.99] ${
                      activeBooking.phlebotomistStatus === 'RECEIVED_AT_LAB'
                        ? 'bg-[#E8EFE8] border-[#174C3C]'
                        : 'bg-white border-[#DCE4DE] hover:border-[#174C3C]'
                    }`}
                  >
                    <div className="font-bold text-[#202A27] flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#28745B]" />
                      <span>5. Handed Over to Lab Desk</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-[#DCE4DE] rounded-2xl p-12 text-center text-xs text-[#737D78]">
                Select a pickup stop from the list to execute collection checkpoints.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
