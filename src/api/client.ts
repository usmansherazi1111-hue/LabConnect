/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { auth } from '../lib/firebase';
import {
  DEFAULT_LABORATORIES,
  DEFAULT_TESTS,
  DEFAULT_PRICINGS,
  DEFAULT_REVIEW_SUMMARIES,
} from '../lib/defaultCatalog';
import {
  getCloudCatalog,
  getCloudReviews,
  getCloudBookingsForPatient,
  getCloudBookingsForCourier,
  createCloudBooking,
  rescheduleCloudBooking,
  cancelCloudBooking,
  updateCloudBookingStatus,
  getCloudReportsForPatient,
  submitCloudReview,
  getCloudNotifications,
  markCloudNotificationRead,
  deleteCloudNotification,
  upsertCloudUserProfile,
  getCloudUserProfile,
  updateCloudFamilyMembers,
} from '../lib/cloudStore';
import { generateClientPathologyPdfBlob } from '../lib/pdfGenerator';
import { DiagnosticReportRecord, MockBooking } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  message?: string;
}

export type AppFlavor = 'web' | 'patient' | 'courier';

export function getAppFlavor(): AppFlavor {
  const raw = (import.meta.env.VITE_APP_FLAVOR || 'web').trim().toLowerCase();
  if (raw === 'patient') return 'patient';
  if (raw === 'courier') return 'courier';
  return 'web';
}

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return '';
}

function hasBackendOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) {
    return Boolean(getApiBaseUrl());
  }
  return true;
}

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export type AuthScope = 'patient' | 'lab' | 'phlebotomist' | 'admin';

export function getScopeFromPath(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/patient'
): AuthScope {
  const flavor = getAppFlavor();
  if (flavor === 'courier') return 'phlebotomist';
  if (flavor === 'patient') return 'patient';
  if (pathname.startsWith('/lab')) return 'lab';
  if (pathname.startsWith('/phlebotomist')) return 'phlebotomist';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'patient';
}

function tokenStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return Capacitor.isNativePlatform() ? window.localStorage : window.sessionStorage;
}

export function getStoredToken(scope?: AuthScope): string | null {
  const storage = tokenStorage();
  if (!storage) return null;
  const target = scope || getScopeFromPath();
  return storage.getItem(`lc_token_${target}`);
}

export function setStoredToken(token: string | null, scope?: AuthScope): void {
  const storage = tokenStorage();
  if (!storage) return;
  const target = scope || getScopeFromPath();
  if (token) {
    storage.setItem(`lc_token_${target}`, token);
  } else {
    storage.removeItem(`lc_token_${target}`);
  }
}

export function getStoredUserSnapshot(scope: AuthScope): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`lc_user_${scope}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUserSnapshot(user: any | null, scope: AuthScope): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(`lc_user_${scope}`, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(`lc_user_${scope}`);
    }
  } catch {
    // ignore storage quota
  }
}

function authHeaders(extra: Record<string, string> = {}, scope?: AuthScope): Record<string, string> {
  const token = getStoredToken(scope);
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface SafeFetchResult<T = any> {
  ok: boolean;
  networkError: boolean;
  status: number;
  data: T | null;
}

async function safeJsonFetch<T = any>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 7000
): Promise<SafeFetchResult<T>> {
  if (!hasBackendOrigin()) {
    return { ok: false, networkError: true, status: 0, data: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl(path), { ...init, signal: controller.signal });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return { ok: false, networkError: true, status: res.status, data: null };
    }
    const json = (await res.json()) as T;
    return { ok: res.ok, networkError: false, status: res.status, data: json };
  } catch {
    return { ok: false, networkError: true, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const apiClient = {
  async getHealth() {
    const res = await safeJsonFetch('/api/health');
    if (res.data) return res.data;
    return {
      status: 'CLOUD_ACTIVE',
      city: 'Lahore, Punjab, Pakistan',
      timestamp: new Date().toISOString(),
    };
  },

  async getAuthConfig() {
    const res = await safeJsonFetch('/api/auth/config');
    if (res.data) return res.data;
    return {
      success: true,
      googleOAuthEnabled: true,
      emailOtpSmtpEnabled: false,
      smsGatewayEnabled: false,
    };
  },

  async getCatalog() {
    const res = await safeJsonFetch('/api/catalog');
    if (res.ok && res.data?.success) return res.data;

    try {
      const cloud = await getCloudCatalog();
      return { success: true, data: cloud };
    } catch {
      return {
        success: true,
        data: {
          laboratories: DEFAULT_LABORATORIES,
          tests: DEFAULT_TESTS,
          pricings: DEFAULT_PRICINGS,
          reviewSummaries: DEFAULT_REVIEW_SUMMARIES,
        },
      };
    }
  },

  async getLaboratories() {
    const res = await safeJsonFetch('/api/laboratories');
    if (res.ok && res.data?.success) return res.data;
    const cloud = await getCloudCatalog();
    return { success: true, count: cloud.laboratories.length, data: cloud.laboratories };
  },

  async getTests() {
    const res = await safeJsonFetch('/api/tests');
    if (res.ok && res.data?.success) return res.data;
    const cloud = await getCloudCatalog();
    return { success: true, count: cloud.tests.length, data: cloud.tests };
  },

  async getPricing(labId?: string, testId?: string) {
    const query = new URLSearchParams();
    if (labId) query.set('labId', labId);
    if (testId) query.set('testId', testId);
    const res = await safeJsonFetch(`/api/pricing?${query.toString()}`);
    if (res.ok && res.data?.success) return res.data;

    const cloud = await getCloudCatalog();
    let list = cloud.pricings;
    if (labId) list = list.filter((p) => p.labId === labId);
    if (testId) list = list.filter((p) => p.testId === testId);
    return { success: true, count: list.length, data: list };
  },

  async createCustomTestPanel(
    payload: {
      code: string;
      name: string;
      category: 'HEMATOLOGY' | 'ENDOCRINOLOGY' | 'BIOCHEMISTRY' | 'INFECTIOUS_DISEASE' | 'CARDIOLOGY' | 'VITAMINS';
      sampleType: 'Whole Blood (EDTA)' | 'Serum (Plain/Gel)' | 'Plasma (Fluoride)' | 'Midstream Urine';
      fastingHours: number;
      preparationInstructions?: string;
      commonNormalRange: string;
      initialPricePkr?: number;
      discountedPricePkr?: number;
      statedTurnaroundHours?: number;
      labId?: string;
    },
    scope: AuthScope = 'lab'
  ) {
    const res = await safeJsonFetch('/api/tests', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify(payload),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async createPricing(payload: {
    testId: string;
    pricePkr: number;
    discountedPricePkr?: number;
    statedTurnaroundHours: number;
    labId?: string;
  }) {
    const res = await safeJsonFetch('/api/pricing', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(payload),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async updatePricing(
    pricingId: string,
    updates: { pricePkr?: number; discountedPricePkr?: number | null; statedTurnaroundHours?: number }
  ) {
    const res = await safeJsonFetch(`/api/pricing/${encodeURIComponent(pricingId)}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(updates),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async deletePricing(pricingId: string) {
    const res = await safeJsonFetch(`/api/pricing/${encodeURIComponent(pricingId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, 'lab'),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async getLabBranches(labId: string) {
    const res = await safeJsonFetch(`/api/laboratories/${encodeURIComponent(labId)}/branches`);
    if (res.ok && res.data?.success) return res.data;
    const lab = DEFAULT_LABORATORIES.find((l) => l.id === labId);
    if (!lab) return { success: false, error: 'Laboratory not found' };
    return { success: true, labId: lab.id, labName: lab.name, branches: lab.branches };
  },

  async getBookings(params?: { status?: string; branchId?: string }, scope?: AuthScope) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.branchId) query.set('branchId', params.branchId);
    const res = await safeJsonFetch(`/api/bookings?${query.toString()}`, {
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: true, data: [] };

    try {
      const resolvedScope = scope || getScopeFromPath();
      const rows =
        resolvedScope === 'phlebotomist'
          ? await getCloudBookingsForCourier(
              uid,
              auth.currentUser?.phoneNumber || undefined,
              auth.currentUser?.email || undefined
            )
          : await getCloudBookingsForPatient(uid);
      return { success: true, data: rows };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to load bookings from cloud' };
    }
  },

  async createBooking(bookingData: {
    patientName: string;
    familyMemberId?: string;
    patientPhone: string;
    patientEmail: string;
    patientArea: string;
    streetAddress?: string;
    labId: string;
    branchId: string;
    testIds: string[];
    collectionType: 'HOME_COLLECTION' | 'BRANCH_VISIT';
    scheduledDate: string;
    scheduledTimeSlot: string;
    fastingAcknowledged?: boolean;
  }) {
    const res = await safeJsonFetch('/api/bookings', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(bookingData),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      return { success: false, error: 'Please sign in with Google or OTP to confirm your booking.' };
    }
    try {
      const created = await createCloudBooking(uid, bookingData);
      return { success: true, data: created, message: `Booking ${created.bookingNumber} confirmed.` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to save booking' };
    }
  },

  async getBookingTracking(bookingNumber: string, phoneLast4?: string, scope?: AuthScope) {
    const query = phoneLast4 ? `?phoneLast4=${encodeURIComponent(phoneLast4)}` : '';
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(bookingNumber)}/tracking${query}`, {
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, error: 'Sign in to inspect live sample tracking.' };

    try {
      const bookings = await getCloudBookingsForPatient(uid);
      const bk = bookings.find(
        (b) => b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase()
      );
      if (!bk) return { success: false, error: `Booking ${bookingNumber} not found in your account.` };
      const lab = DEFAULT_LABORATORIES.find((l) => l.id === bk.labId);
      const branch = lab?.branches.find((br) => br.id === bk.branchId);
      return {
        success: true,
        data: {
          booking: bk,
          labName: lab?.name || 'Verified Laboratory',
          phcLicence: lab?.phcLicence,
          branchName: bk.branchName || branch?.name,
          branchAddress: bk.branchAddress || branch?.address,
          trackingEvents: bk.trackingEvents || [],
          reportAvailable: Boolean(bk.reportUrl || bk.status === 'COMPLETED'),
          reportPdfUrl: bk.reportUrl,
          emailDispatchedAt: bk.emailDispatchedAt,
        },
      };
    } catch {
      return { success: false, error: 'Unable to fetch booking tracking.' };
    }
  },

  async updateBookingStatus(
    id: string,
    status: string,
    phlebotomistName?: string,
    extra?: {
      phlebotomistStatus?: string;
      sampleBarcode?: string;
      coldChainTempCelsius?: number;
      fastingConfirmed?: boolean;
    },
    scope?: AuthScope
  ) {
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ status, phlebotomistName, ...extra }),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      try {
        const updated = await updateCloudBookingStatus(
          id,
          status as MockBooking['status'],
          phlebotomistName || auth.currentUser.displayName || 'Field Courier',
          extra as any
        );
        return { success: true, data: updated };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unable to update cloud order' };
      }
    }
    return { success: false, error: 'Unable to update booking status' };
  },

  async rescheduleBooking(id: string, scheduledDate: string, scheduledTimeSlot: string, scope: AuthScope = 'patient') {
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(id)}/reschedule`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ scheduledDate, scheduledTimeSlot }),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      try {
        const updated = await rescheduleCloudBooking(id, scheduledDate, scheduledTimeSlot);
        return { success: true, data: updated };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to reschedule booking' };
      }
    }
    return { success: false, error: 'Unable to reschedule booking' };
  },

  async cancelBooking(id: string, reason?: string, scope: AuthScope = 'patient') {
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ reason }),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      try {
        const updated = await cancelCloudBooking(id, reason);
        return { success: true, data: updated };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel booking' };
      }
    }
    return { success: false, error: 'Unable to cancel booking' };
  },

  async deleteBooking(id: string, scope: AuthScope = 'patient') {
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders({}, scope),
    });
    return res.data || { success: false, error: 'Server unavailable' };
  },

  async getLabPhlebotomists() {
    const res = await safeJsonFetch('/api/lab/phlebotomists', {
      headers: authHeaders({}, 'lab'),
    });
    return res.data || { success: true, data: [] };
  },

  async assignPhlebotomist(bookingId: string, phlebotomistId: string) {
    const res = await safeJsonFetch(`/api/bookings/${encodeURIComponent(bookingId)}/assign-phlebotomist`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify({ phlebotomistId }),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async getReviews(labId?: string) {
    const query = labId ? `?labId=${encodeURIComponent(labId)}` : '';
    const res = await safeJsonFetch(`/api/reviews${query}`, {
      headers: authHeaders({}, 'patient'),
    });
    if (res.ok && res.data?.success) return res.data;
    const reviews = await getCloudReviews(labId);
    return { success: true, data: reviews };
  },

  async submitReview(data: {
    bookingNumber: string;
    rating: number;
    punctualityRating: number;
    turnaroundRating: number;
    comment: string;
  }) {
    const res = await safeJsonFetch('/api/reviews', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, error: 'Please sign in first to submit a verified review.' };
    try {
      const bookings = await getCloudBookingsForPatient(uid);
      const bk = bookings.find((b) => b.bookingNumber === data.bookingNumber);
      const created = await submitCloudReview(
        uid,
        auth.currentUser?.displayName || bk?.patientName || 'Verified Patient',
        {
          labId: bk?.labId || 'lab-chughtai',
          ...data,
        }
      );
      return { success: true, data: created };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to submit review' };
    }
  },

  async deleteReview(reviewId: string, scope: AuthScope = 'patient') {
    const res = await safeJsonFetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, scope),
    });
    return res.data || { success: false, error: 'Server unavailable' };
  },

  async getReports(scope?: AuthScope) {
    const res = await safeJsonFetch('/api/reports', {
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: true, data: [] };
    try {
      const rows = await getCloudReportsForPatient(uid);
      return { success: true, data: rows };
    } catch {
      return { success: true, data: [] };
    }
  },

  async uploadReport(reportData: {
    bookingNumber: string;
    fileName?: string;
    pathologistName?: string;
    clinicalNotes?: string;
    parameters?: {
      parameter: string;
      observedValue: string;
      unit: string;
      referenceRange: string;
      flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
    }[];
    sendEmailToPatient?: boolean;
    recipientEmailOverride?: string;
  }) {
    const res = await safeJsonFetch('/api/reports/upload', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(reportData),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async fetchReportPdfBlob(
    bookingNumber: string,
    download = false,
    scope?: AuthScope,
    fallbackReport?: DiagnosticReportRecord
  ): Promise<Blob> {
    if (hasBackendOrigin()) {
      try {
        const query = download ? '?download=1' : '';
        const res = await fetch(apiUrl(`/api/reports/${encodeURIComponent(bookingNumber)}/pdf${query}`), {
          headers: authHeaders({}, scope),
        });
        if (res.ok && res.headers.get('content-type')?.includes('pdf')) {
          return res.blob();
        }
      } catch {
        // fallback to client PDF synthesis below
      }
    }

    if (fallbackReport) {
      const lab = DEFAULT_LABORATORIES.find((l) => l.id === fallbackReport.labId);
      return generateClientPathologyPdfBlob(fallbackReport, lab);
    }

    if (auth.currentUser) {
      const reports = await getCloudReportsForPatient(auth.currentUser.uid).catch(() => []);
      const found = reports.find((r) => r.bookingNumber === bookingNumber);
      if (found) {
        const lab = DEFAULT_LABORATORIES.find((l) => l.id === found.labId);
        return generateClientPathologyPdfBlob(found, lab);
      }
    }

    throw new Error('Clinical PDF report not yet published for this booking.');
  },

  async sendReportEmail(bookingNumber: string, recipientEmail?: string, scope?: AuthScope) {
    const res = await safeJsonFetch(`/api/reports/${encodeURIComponent(bookingNumber)}/email`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ recipientEmail }),
    });
    return res.data || { success: false, error: 'Email dispatch service is currently offline.' };
  },

  async explainReport(
    params: {
      testName: string;
      testValue: string;
      referenceRange: string;
      language: 'EN' | 'UR';
      parameters?: {
        parameter: string;
        observedValue: string;
        unit: string;
        referenceRange: string;
        flag: string;
      }[];
    },
    scope: AuthScope = 'patient'
  ) {
    const res = await safeJsonFetch(
      '/api/ai/explain',
      {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
        body: JSON.stringify(params),
      },
      10000
    );
    if (!res.networkError && res.data) return res.data;

    // Resilient structured summary when AI proxy endpoint is offline on standalone APK
    const flagged = (params.parameters || []).filter((p) => p.flag !== 'NORMAL');
    const summaryEn = flagged.length
      ? `${params.testName}: ${flagged.map((f) => `${f.parameter} (${f.observedValue} ${f.unit}, ref ${f.referenceRange})`).join('; ')} appears outside the standard reference interval. Other parameters remain within expected limits.`
      : `${params.testName}: Observed value (${params.testValue}) aligns with reference range (${params.referenceRange}).`;
    const summaryUr = flagged.length
      ? `${params.testName} کی رپورٹ میں ${flagged.map((f) => `${f.parameter} (${f.observedValue})`).join('، ')} عام حد سے مختلف ہے۔ برائے مہربانی مستند ڈاکٹر سے مشورہ کریں۔`
      : `${params.testName} کے نتائج (${params.testValue}) عمومی حوالہ جاتی حد (${params.referenceRange}) کے مطابق ہیں۔`;

    return {
      success: true,
      model: 'clinical-reference-summary',
      explanation: params.language === 'UR' ? summaryUr : summaryEn,
      disclaimer: 'Educational summary only. Please consult a licensed physician for clinical interpretation.',
    };
  },

  async getNotifications(scope: AuthScope) {
    const res = await safeJsonFetch('/api/notifications', {
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;

    const uid = auth.currentUser?.uid;
    if (!uid) return { success: true, data: [], unreadCount: 0 };
    try {
      const cloud = await getCloudNotifications(uid);
      return { success: true, ...cloud };
    } catch {
      return { success: true, data: [], unreadCount: 0 };
    }
  },

  async markNotificationsRead(scope: AuthScope, notificationId?: string) {
    const res = await safeJsonFetch('/api/notifications/read', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ notificationId }),
    });
    if (!res.networkError && res.data) return res.data;
    if (auth.currentUser) {
      await markCloudNotificationRead(auth.currentUser.uid, notificationId).catch(() => {});
    }
    return { success: true };
  },

  async deleteNotification(notificationId: string, scope: AuthScope) {
    const res = await safeJsonFetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;
    await deleteCloudNotification(notificationId).catch(() => {});
    return { success: true };
  },

  async clearReadNotifications(scope: AuthScope) {
    const res = await safeJsonFetch('/api/notifications?scope=read', {
      method: 'DELETE',
      headers: authHeaders({}, scope),
    });
    return res.data || { success: true };
  },

  async updateLabBranch(branchId: string, updates: { operatingHours?: string; homeCollectionFeePkr?: number }) {
    const res = await safeJsonFetch(`/api/lab/branches/${encodeURIComponent(branchId)}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(updates),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async createLabBranch(payload: {
    name: string;
    area: string;
    address: string;
    phone?: string;
    operatingHours?: string;
    homeCollectionFeePkr: number;
    labId?: string;
  }) {
    const res = await safeJsonFetch('/api/lab/branches', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(payload),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async deleteLabBranch(branchId: string) {
    const res = await safeJsonFetch(`/api/lab/branches/${encodeURIComponent(branchId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, 'lab'),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  async getLabSettlements() {
    const res = await safeJsonFetch('/api/lab/settlements', {
      headers: authHeaders({}, 'lab'),
    });
    return res.data || { success: false, error: 'Laboratory backend unavailable.' };
  },

  // Firebase ID Token -> Backend RBAC Session Exchange
  async exchangeFirebaseToken(payload: {
    idToken: string;
    portal: 'patient' | 'lab' | 'phlebotomist';
    labId?: string;
    branchId?: string;
    staffCode?: string;
    fullName?: string;
    phone?: string;
  }) {
    const res = await safeJsonFetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data || { success: false, networkError: res.networkError };
  },

  // Real-Time Email OTP
  async sendEmailOtp(email: string, portal: 'patient' | 'lab' | 'phlebotomist') {
    const res = await safeJsonFetch('/api/auth/email-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, portal }),
    });
    return (
      res.data || {
        success: false,
        error: 'Email verification service unreachable. Use Sign in with Google above.',
      }
    );
  },

  async verifyEmailOtp(payload: {
    email: string;
    otp: string;
    portal: 'patient' | 'lab' | 'phlebotomist';
    name?: string;
    phone?: string;
    labId?: string;
    branchId?: string;
    staffCode?: string;
  }) {
    const res = await safeJsonFetch('/api/auth/email-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return (
      res.data || {
        success: false,
        error: 'Unable to verify email code right now. Please try Sign in with Google.',
      }
    );
  },

  // Patient SMS Auth & Profile
  async sendOtp(phone: string) {
    const res = await safeJsonFetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.data || { success: false, networkError: res.networkError };
  },

  async verifyOtp(phone: string, otp: string, name?: string, email?: string) {
    const res = await safeJsonFetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name, email }),
    });
    return res.data || { success: false, networkError: res.networkError };
  },

  async updatePatientProfile(data: { name?: string; email?: string; area?: string }) {
    const res = await safeJsonFetch('/api/auth/profile', {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      const updated = await upsertCloudUserProfile({
        uid: auth.currentUser.uid,
        name: data.name || auth.currentUser.displayName || 'Patient User',
        email: data.email || auth.currentUser.email || undefined,
        phone: auth.currentUser.phoneNumber || undefined,
        area: data.area,
        role: 'PATIENT',
      });
      setStoredUserSnapshot(updated, 'patient');
      return { success: true, user: updated };
    }
    return { success: false, error: 'Unable to update profile' };
  },

  async addFamilyMember(data: {
    name: string;
    relationship: string;
    gender: string;
    bloodGroup: string;
    dateOfBirth: string;
    notes?: string;
  }) {
    const res = await safeJsonFetch('/api/auth/family', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      const profile = await getCloudUserProfile(auth.currentUser.uid);
      const nextList = [
        ...(profile?.familyMembers || []),
        {
          id: `fam-${Date.now()}`,
          name: data.name.trim(),
          relationship: data.relationship as any,
          gender: data.gender as any,
          bloodGroup: data.bloodGroup,
          dateOfBirth: data.dateOfBirth,
          consentGrantedAt: new Date().toISOString(),
          notes: data.notes,
        },
      ];
      await updateCloudFamilyMembers(auth.currentUser.uid, nextList);
      return { success: true, familyMembers: nextList };
    }
    return { success: false, error: 'Unable to add family member' };
  },

  async removeFamilyMember(familyId: string) {
    const res = await safeJsonFetch(`/api/auth/family/${encodeURIComponent(familyId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, 'patient'),
    });
    if (!res.networkError && res.data) return res.data;

    if (auth.currentUser) {
      const profile = await getCloudUserProfile(auth.currentUser.uid);
      const nextList = (profile?.familyMembers || []).filter((m) => m.id !== familyId);
      await updateCloudFamilyMembers(auth.currentUser.uid, nextList);
      return { success: true, familyMembers: nextList };
    }
    return { success: false, error: 'Unable to remove family member' };
  },

  // Institutional Staff Auth
  async loginLabStaff(email: string, password: string, labId: string, branchId: string) {
    const res = await safeJsonFetch('/api/auth/lab/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, labId, branchId }),
    });
    return res.data || { success: false, error: 'Laboratory backend unreachable. Use Google Sign-In or retry.' };
  },

  async registerLabStaff(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    labId: string;
    branchId: string;
  }) {
    const res = await safeJsonFetch('/api/auth/lab/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.data || { success: false, error: 'Laboratory backend unreachable. Use Google Sign-In or retry.' };
  },

  // Phlebotomist Auth
  async loginPhlebotomist(staffCode: string, phone: string, cnicLast4: string, labId?: string, branchId?: string) {
    const res = await safeJsonFetch('/api/auth/phlebotomist/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffCode, phone, cnicLast4, labId, branchId }),
    });
    return (
      res.data || {
        success: false,
        error: 'Dispatch server unreachable. Sign in with Google or Phone SMS OTP below.',
      }
    );
  },

  async registerPhlebotomist(data: {
    fullName: string;
    staffCode: string;
    phone: string;
    cnicLast4: string;
    labId: string;
    branchId: string;
  }) {
    const res = await safeJsonFetch('/api/auth/phlebotomist/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (
      res.data || {
        success: false,
        error: 'Dispatch server unreachable. Register using Google or Phone SMS OTP below.',
      }
    );
  },

  // PHC Admin Auth & Console (Strictly Password-Only)
  async getAdminStatus() {
    const res = await safeJsonFetch('/api/auth/admin/status');
    return res.data || { success: true, setupRequired: false };
  },

  async setupFirstAdmin(name: string, email: string, password: string) {
    const res = await safeJsonFetch('/api/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async loginAdmin(email: string, password: string) {
    const res = await safeJsonFetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async getAdminOverview() {
    const res = await safeJsonFetch('/api/admin/overview', {
      headers: authHeaders({}, 'admin'),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async toggleLabVerification(labId: string) {
    const res = await safeJsonFetch(`/api/admin/labs/${encodeURIComponent(labId)}/verify`, {
      method: 'POST',
      headers: authHeaders({}, 'admin'),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async updateLabSubscription(labId: string, subscriptionTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE') {
    const res = await safeJsonFetch(`/api/admin/labs/${encodeURIComponent(labId)}/subscription`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'admin'),
      body: JSON.stringify({ subscriptionTier }),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async createAdminLab(payload: {
    name: string;
    phcLicence: string;
    accreditation?: string;
    tagline?: string;
    contactEmail?: string;
    contactPhone?: string;
    subscriptionTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    hqBranchName: string;
    hqArea: string;
    hqAddress: string;
    hqOperatingHours?: string;
    hqHomeCollectionFeePkr: number;
  }) {
    const res = await safeJsonFetch('/api/admin/labs', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'admin'),
      body: JSON.stringify(payload),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async deleteLab(labId: string) {
    const res = await safeJsonFetch(`/api/admin/labs/${encodeURIComponent(labId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, 'admin'),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async getAdminUsers() {
    const res = await safeJsonFetch('/api/admin/users', {
      headers: authHeaders({}, 'admin'),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async deleteAdminUser(userId: string) {
    const res = await safeJsonFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: authHeaders({}, 'admin'),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async settleLabPayout(labId: string, deductSaasFee = false) {
    const res = await safeJsonFetch('/api/admin/settlements/settle', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'admin'),
      body: JSON.stringify({ labId, deductSaasFee }),
    });
    return res.data || { success: false, error: 'Admin service unreachable' };
  },

  async downloadAuditCsv(): Promise<void> {
    const res = await fetch(apiUrl('/api/admin/audit/export'), {
      headers: authHeaders({}, 'admin'),
    });
    if (!res.ok) throw new Error('Unable to export audit log');
    const blob = await res.blob();
    triggerBlobDownload(blob, 'labconnect_audit_logs.csv');
  },

  async downloadBackupSnapshot(): Promise<void> {
    const res = await fetch(apiUrl('/api/admin/backup/snapshot'), {
      headers: authHeaders({}, 'admin'),
    });
    if (!res.ok) throw new Error('Unable to export backup snapshot');
    const blob = await res.blob();
    triggerBlobDownload(blob, 'labconnect_sanitized_backup.json');
  },

  async getCurrentUser(scope: AuthScope) {
    const res = await safeJsonFetch('/api/auth/me', {
      headers: authHeaders({}, scope),
    });
    if (!res.networkError && res.data) return res.data;

    // On mobile APK or sleeping web backend, restore verified Firebase/snapshot session seamlessly
    const cached = getStoredUserSnapshot(scope);
    if (cached && (auth.currentUser || getStoredToken(scope))) {
      return { success: true, user: cached };
    }
    return { success: false, error: 'Session unavailable' };
  },

  async logout(scope?: AuthScope) {
    const target = scope || getScopeFromPath();
    const headers = authHeaders({}, target);
    setStoredToken(null, target);
    setStoredUserSnapshot(null, target);
    if (hasBackendOrigin()) {
      await safeJsonFetch('/api/auth/logout', { method: 'POST', headers }, 3000);
    }
    return { success: true };
  },
};
