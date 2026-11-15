/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  message?: string;
}

const DEFAULT_REMOTE_API_ORIGIN = 'https://ais-pre-5ndgusrg7sr7hfv5zj7cpl-31159737384.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    return DEFAULT_REMOTE_API_ORIGIN;
  }
  return '';
}

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export type AuthScope = 'patient' | 'lab' | 'phlebotomist' | 'admin';

export function getScopeFromPath(pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/patient'): AuthScope {
  if (pathname.startsWith('/lab')) return 'lab';
  if (pathname.startsWith('/phlebotomist')) return 'phlebotomist';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'patient';
}

export function getStoredToken(scope?: AuthScope): string | null {
  if (typeof window === 'undefined') return null;
  const target = scope || getScopeFromPath();
  return window.sessionStorage.getItem(`lc_token_${target}`);
}

export function setStoredToken(token: string | null, scope?: AuthScope): void {
  if (typeof window === 'undefined') return;
  const target = scope || getScopeFromPath();
  if (token) {
    window.sessionStorage.setItem(`lc_token_${target}`, token);
  } else {
    window.sessionStorage.removeItem(`lc_token_${target}`);
  }
}

function authHeaders(extra: Record<string, string> = {}, scope?: AuthScope): Record<string, string> {
  const token = getStoredToken(scope);
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const apiClient = {
  async getHealth() {
    const res = await fetch(apiUrl('/api/health'));
    return res.json();
  },

  async getCatalog() {
    const res = await fetch(apiUrl('/api/catalog'));
    return res.json();
  },

  async getLaboratories() {
    const res = await fetch(apiUrl('/api/laboratories'));
    return res.json();
  },

  async getTests() {
    const res = await fetch(apiUrl('/api/tests'));
    return res.json();
  },

  async getPricing(labId?: string, testId?: string) {
    const query = new URLSearchParams();
    if (labId) query.set('labId', labId);
    if (testId) query.set('testId', testId);
    const res = await fetch(apiUrl(`/api/pricing?${query.toString()}`));
    return res.json();
  },

  async updatePricing(
    pricingId: string,
    updates: { pricePkr?: number; discountedPricePkr?: number | null; statedTurnaroundHours?: number }
  ) {
    const res = await fetch(apiUrl(`/api/pricing/${encodeURIComponent(pricingId)}`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getLabBranches(labId: string) {
    const res = await fetch(apiUrl(`/api/laboratories/${encodeURIComponent(labId)}/branches`));
    return res.json();
  },

  async getBookings(params?: { status?: string; branchId?: string }, scope?: AuthScope) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.branchId) query.set('branchId', params.branchId);
    const res = await fetch(apiUrl(`/api/bookings?${query.toString()}`), {
      headers: authHeaders({}, scope),
    });
    return res.json();
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
    const res = await fetch(apiUrl('/api/bookings'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(bookingData),
    });
    return res.json();
  },

  async getBookingTracking(bookingNumber: string, phoneLast4?: string, scope?: AuthScope) {
    const query = phoneLast4 ? `?phoneLast4=${encodeURIComponent(phoneLast4)}` : '';
    const res = await fetch(apiUrl(`/api/bookings/${encodeURIComponent(bookingNumber)}/tracking${query}`), {
      headers: authHeaders({}, scope),
    });
    return res.json();
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
    const res = await fetch(apiUrl(`/api/bookings/${encodeURIComponent(id)}/status`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ status, phlebotomistName, ...extra }),
    });
    return res.json();
  },

  async rescheduleBooking(id: string, scheduledDate: string, scheduledTimeSlot: string, scope: AuthScope = 'patient') {
    const res = await fetch(apiUrl(`/api/bookings/${encodeURIComponent(id)}/reschedule`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ scheduledDate, scheduledTimeSlot }),
    });
    return res.json();
  },

  async cancelBooking(id: string, reason?: string, scope: AuthScope = 'patient') {
    const res = await fetch(apiUrl(`/api/bookings/${encodeURIComponent(id)}/cancel`), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async getLabPhlebotomists() {
    const res = await fetch(apiUrl('/api/lab/phlebotomists'), {
      headers: authHeaders({}, 'lab'),
    });
    return res.json();
  },

  async assignPhlebotomist(bookingId: string, phlebotomistId: string) {
    const res = await fetch(apiUrl(`/api/bookings/${encodeURIComponent(bookingId)}/assign-phlebotomist`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify({ phlebotomistId }),
    });
    return res.json();
  },

  async getReviews(labId?: string) {
    const query = labId ? `?labId=${encodeURIComponent(labId)}` : '';
    const res = await fetch(apiUrl(`/api/reviews${query}`));
    return res.json();
  },

  async submitReview(data: {
    bookingNumber: string;
    rating: number;
    punctualityRating: number;
    turnaroundRating: number;
    comment: string;
  }) {
    const res = await fetch(apiUrl('/api/reviews'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getReports(scope?: AuthScope) {
    const res = await fetch(apiUrl('/api/reports'), {
      headers: authHeaders({}, scope),
    });
    return res.json();
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
    const res = await fetch(apiUrl('/api/reports/upload'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(reportData),
    });
    return res.json();
  },

  getReportPdfUrl(bookingNumber: string, download = false, scope?: AuthScope): string {
    const token = getStoredToken(scope);
    const params = new URLSearchParams();
    if (download) params.set('download', '1');
    if (token) params.set('token', token);
    return apiUrl(`/api/reports/${encodeURIComponent(bookingNumber)}/pdf?${params.toString()}`);
  },

  async sendReportEmail(bookingNumber: string, recipientEmail?: string, scope?: AuthScope) {
    const res = await fetch(apiUrl(`/api/reports/${encodeURIComponent(bookingNumber)}/email`), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ recipientEmail }),
    });
    return res.json();
  },

  async explainReport(params: {
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
  }) {
    const res = await fetch(apiUrl('/api/ai/explain'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getNotifications(scope: AuthScope) {
    const res = await fetch(apiUrl('/api/notifications'), {
      headers: authHeaders({}, scope),
    });
    return res.json();
  },

  async markNotificationsRead(scope: AuthScope, notificationId?: string) {
    const res = await fetch(apiUrl('/api/notifications/read'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, scope),
      body: JSON.stringify({ notificationId }),
    });
    return res.json();
  },

  async updateLabBranch(branchId: string, updates: { operatingHours?: string; homeCollectionFeePkr?: number }) {
    const res = await fetch(apiUrl(`/api/lab/branches/${encodeURIComponent(branchId)}`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'lab'),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getLabSettlements() {
    const res = await fetch(apiUrl('/api/lab/settlements'), {
      headers: authHeaders({}, 'lab'),
    });
    return res.json();
  },

  // Patient Auth & Profile
  async sendOtp(phone: string) {
    const res = await fetch(apiUrl('/api/auth/otp/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async verifyOtp(phone: string, otp: string, name?: string, email?: string) {
    const res = await fetch(apiUrl('/api/auth/otp/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name, email }),
    });
    return res.json();
  },

  async updatePatientProfile(data: { name?: string; email?: string; area?: string }) {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addFamilyMember(data: {
    name: string;
    relationship: string;
    gender: string;
    bloodGroup: string;
    dateOfBirth: string;
    notes?: string;
  }) {
    const res = await fetch(apiUrl('/api/auth/family'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'patient'),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async removeFamilyMember(familyId: string) {
    const res = await fetch(apiUrl(`/api/auth/family/${encodeURIComponent(familyId)}`), {
      method: 'DELETE',
      headers: authHeaders({}, 'patient'),
    });
    return res.json();
  },

  // Institutional Staff Auth
  async loginLabStaff(email: string, password: string, labId: string, branchId: string) {
    const res = await fetch(apiUrl('/api/auth/lab/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, labId, branchId }),
    });
    return res.json();
  },

  async registerLabStaff(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    labId: string;
    branchId: string;
  }) {
    const res = await fetch(apiUrl('/api/auth/lab/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Phlebotomist Auth
  async loginPhlebotomist(staffCode: string, phone: string, labId?: string, branchId?: string) {
    const res = await fetch(apiUrl('/api/auth/phlebotomist/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffCode, phone, labId, branchId }),
    });
    return res.json();
  },

  async registerPhlebotomist(data: {
    fullName: string;
    staffCode: string;
    phone: string;
    cnicLast4: string;
    labId: string;
    branchId: string;
  }) {
    const res = await fetch(apiUrl('/api/auth/phlebotomist/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // PHC Admin Auth & Console
  async getAdminStatus() {
    const res = await fetch(apiUrl('/api/auth/admin/status'));
    return res.json();
  },

  async setupFirstAdmin(name: string, email: string, password: string) {
    const res = await fetch(apiUrl('/api/auth/admin/setup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  async loginAdmin(email: string, password: string) {
    const res = await fetch(apiUrl('/api/auth/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async getAdminOverview() {
    const res = await fetch(apiUrl('/api/admin/overview'), {
      headers: authHeaders({}, 'admin'),
    });
    return res.json();
  },

  async toggleLabVerification(labId: string) {
    const res = await fetch(apiUrl(`/api/admin/labs/${encodeURIComponent(labId)}/verify`), {
      method: 'POST',
      headers: authHeaders({}, 'admin'),
    });
    return res.json();
  },

  async updateLabSubscription(labId: string, subscriptionTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE') {
    const res = await fetch(apiUrl(`/api/admin/labs/${encodeURIComponent(labId)}/subscription`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'admin'),
      body: JSON.stringify({ subscriptionTier }),
    });
    return res.json();
  },

  async settleLabPayout(labId: string, deductSaasFee = false) {
    const res = await fetch(apiUrl('/api/admin/settlements/settle'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }, 'admin'),
      body: JSON.stringify({ labId, deductSaasFee }),
    });
    return res.json();
  },

  getAuditCsvUrl(): string {
    const token = getStoredToken('admin');
    return apiUrl(`/api/admin/audit/export${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  },

  async getCurrentUser(scope: AuthScope) {
    const res = await fetch(apiUrl('/api/auth/me'), {
      headers: authHeaders({}, scope),
    });
    return res.json();
  },

  async logout(scope?: AuthScope) {
    setStoredToken(null, scope);
    const res = await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    return res.json();
  },
};
