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
} from 'lucide-react';

export const PhlebotomistPortal: React.FC = () => {
  const { phlebUser, loginPhlebotomist, registerPhlebotomist } = useAuth();

  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);

  // Auth Form State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [staffCode, setStaffCode] = useState<string>('MOTO-04');
  const [staffPhone, setStaffPhone] = useState<string>('+92 321 4455667');
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
    setIsLoggingIn(true);
    const res = await loginPhlebotomist(staffCode.trim(), staffPhone.trim(), selectedLabId, selectedBranchId);
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

  if (!phlebUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto">
              <Bike className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Phlebotomist Field Sign In</h1>
            <p className="text-xs text-slate-500">
              Verified home sampling riders · Cold-chain 2°C–8°C route console
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
              Courier Sign In
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
              Register Agent
            </button>
          </div>

          <form onSubmit={authTab === 'SIGN_IN' ? handleStaffLogin : handleStaffRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Laboratory & Hub:</label>
              <div className="space-y-2">
                <select
                  value={selectedLabId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setSelectedLabId(nid);
                    const lab = laboratories.find((l) => l.id === nid);
                    if (lab && lab.branches.length > 0) setSelectedBranchId(lab.branches[0].id);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                >
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
                {availableBranches.length > 0 && (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  >
                    {availableBranches.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.name} ({br.area})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {authTab === 'SIGN_UP' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name:</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Usman Ali"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            )}

            <div className={authTab === 'SIGN_UP' ? 'grid grid-cols-2 gap-2.5' : ''}>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rider Staff Code:</label>
                <input
                  type="text"
                  required
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  placeholder="MOTO-04"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-semibold text-slate-800"
                />
              </div>
              {authTab === 'SIGN_UP' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNIC Last 4:</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={regCnicLast4}
                    onChange={(e) => setRegCnicLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="4819"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Mobile (+92):</label>
              <input
                type="text"
                required
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-[#0F5132] text-white rounded-xl font-semibold hover:bg-emerald-800 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {authTab === 'SIGN_UP' && <UserPlus className="w-4 h-4" />}
              <span>{isLoggingIn ? 'Verifying...' : authTab === 'SIGN_IN' ? 'Open Field Route' : 'Register & Activate'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <span className="font-semibold text-slate-700 block">Quick Fill Verified Field Couriers:</span>
            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGN_IN');
                setStaffCode('MOTO-04');
                setStaffPhone('+92 321 4455667');
                setSelectedLabId('lab-chughtai');
                setSelectedBranchId('c-branch-jailrd');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex justify-between font-mono"
            >
              <span>MOTO-04 (Ahmad Raza · Chughtai)</span>
              <span className="text-[#0F5132] font-semibold">Fill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('SIGN_IN');
                setStaffCode('MOTO-09');
                setStaffPhone('+92 333 1122334');
                setSelectedLabId('lab-idc');
                setSelectedBranchId('idc-branch-shadman');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex justify-between font-mono"
            >
              <span>MOTO-09 (Tariq Javed · IDC)</span>
              <span className="text-[#0F5132] font-semibold">Fill</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const riderLab = laboratories.find((l) => l.id === phlebUser.labId);
  const riderBranch = riderLab?.branches.find((b) => b.id === phlebUser.branchId) || riderLab?.branches[0];

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* Rider Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            {riderLab?.name} · {phlebUser.staffCode || 'COURIER'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{phlebUser.name}</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Dispatch Hub: {riderBranch ? `${riderBranch.name}, ${riderBranch.address}` : phlebUser.area}</span>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${coldBoxTemp >= 2 && coldBoxTemp <= 8 ? 'bg-emerald-100 text-[#0F5132]' : 'bg-rose-100 text-rose-800'}`}>
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Cold Box Temp</div>
              <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">{coldBoxTemp.toFixed(1)}°C</div>
            </div>
          </div>
          <button
            onClick={() => setColdBoxTemp(+(2.6 + Math.random() * 3.8).toFixed(1))}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0F5132] min-h-[36px]"
          >
            Read Sensor
          </button>
        </div>
      </div>

      {/* Queue + Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Assigned Home Pickups ({assignedBookings.length})
            </h2>
            <button onClick={fetchPhlebotomistQueue} className="text-xs text-[#0F5132] font-semibold flex items-center gap-1">
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {assignedBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
              No home sampling pickups assigned for {riderLab?.name || 'your laboratory'} right now.
            </div>
          ) : (
            assignedBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setActiveBooking(b);
                  setActionError(null);
                  setActionSuccess(null);
                }}
                className={`bg-white border rounded-xl p-4 cursor-pointer text-xs space-y-1.5 ${
                  activeBooking?.id === b.id ? 'border-[#0F5132] ring-1 ring-[#0F5132]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{b.patientName}</span>
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {b.phlebotomistStatus || b.status}
                  </span>
                </div>
                <div className="font-mono text-slate-500">
                  {b.bookingNumber} · {b.scheduledTimeSlot}
                </div>
                <div className="text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span>{b.streetAddress || b.patientArea}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-7">
          {activeBooking ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#0F5132]">{activeBooking.bookingNumber}</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeBooking.patientName}</h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeBooking.streetAddress || activeBooking.patientArea}
                  </p>
                </div>
                <a
                  href={`tel:${activeBooking.patientPhone}`}
                  className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-[#0F5132] rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">Specimens Ordered:</div>
                <div className="flex flex-wrap gap-2">
                  {activeBooking.testIds.map((tid) => {
                    const t = tests.find((item) => item.id === tid);
                    return (
                      <span key={tid} className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
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
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'EN_ROUTE')}
                  disabled={isUpdating}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F5132] text-left text-xs min-h-[54px]"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#0F5132]" />
                    <span>1. Mark En Route</span>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'ARRIVED')}
                  disabled={isUpdating}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F5132] text-left text-xs min-h-[54px]"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>2. Arrived at Door</span>
                  </div>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#0F5132]" />
                  <span>3. Fasting Check & Vacutainer Barcode</span>
                </div>
                <label className="flex items-start gap-2 bg-white border border-slate-200 p-2.5 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastingVerified}
                    onChange={(e) => setFastingVerified(e.target.checked)}
                    className="mt-0.5 accent-[#0F5132]"
                  />
                  <span className="text-[11px] text-slate-700">
                    Confirmed patient fasting status and tube patient ID label match.
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="VAC-LHR-98214"
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setBarcodeInput(`VAC-LHR-${Math.floor(10000 + Math.random() * 90000)}`)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-700"
                  >
                    Scan / Gen
                  </button>
                </div>
                <button
                  onClick={() =>
                    handleStatusTransition(activeBooking.id, 'SAMPLE_COLLECTED', 'SAMPLE_COLLECTED', barcodeInput)
                  }
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold min-h-[42px]"
                >
                  Confirm Sample Collected & Sealed ({coldBoxTemp.toFixed(1)}°C)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'IN_TRANSIT')}
                  disabled={isUpdating}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F5132] text-left text-xs min-h-[54px]"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-[#0F5132]" />
                    <span>4. In Cold-Chain Transit</span>
                  </div>
                </button>
                <button
                  onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'RECEIVED_AT_LAB')}
                  disabled={isUpdating}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F5132] text-left text-xs min-h-[54px]"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span>5. Handed Over to Lab Desk</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
              Select a pickup stop from the list to execute collection checkpoints.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
