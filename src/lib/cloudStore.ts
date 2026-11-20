/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  DEFAULT_LABORATORIES,
  DEFAULT_TESTS,
  DEFAULT_PRICINGS,
  DEFAULT_REVIEW_SUMMARIES,
} from './defaultCatalog';
import {
  DiagnosticReportRecord,
  DiagnosticTest,
  LahoreLaboratory,
  LaboratoryTestPricing,
  LabRatingSummary,
  LabReviewRecord,
  MockBooking,
  NotificationRecord,
  TrackingEvent,
} from '../types';
import type { AuthUser, FamilyMember } from '../context/AuthContext';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string' && val) return val;
  return new Date().toISOString();
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || `id-${Date.now()}`;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function getCloudCatalog(): Promise<{
  laboratories: LahoreLaboratory[];
  tests: DiagnosticTest[];
  pricings: LaboratoryTestPricing[];
  reviewSummaries: LabRatingSummary[];
}> {
  let laboratories = DEFAULT_LABORATORIES;
  let tests = DEFAULT_TESTS;
  let pricings = DEFAULT_PRICINGS;

  try {
    const [labsSnap, testsSnap, pricingsSnap] = await Promise.all([
      getDocs(collection(db, 'laboratories')),
      getDocs(collection(db, 'tests')),
      getDocs(collection(db, 'pricings')),
    ]);
    if (!labsSnap.empty) {
      const cloudLabs = labsSnap.docs.map((d) => d.data() as LahoreLaboratory);
      const map = new Map(DEFAULT_LABORATORIES.map((l) => [l.id, l]));
      cloudLabs.forEach((l) => map.set(l.id, l));
      laboratories = Array.from(map.values());
    }
    if (!testsSnap.empty) {
      const cloudTests = testsSnap.docs.map((d) => d.data() as DiagnosticTest);
      const map = new Map(DEFAULT_TESTS.map((t) => [t.id, t]));
      cloudTests.forEach((t) => map.set(t.id, t));
      tests = Array.from(map.values());
    }
    if (!pricingsSnap.empty) {
      const cloudPricings = pricingsSnap.docs.map((d) => d.data() as LaboratoryTestPricing);
      const map = new Map(DEFAULT_PRICINGS.map((p) => [p.id, p]));
      cloudPricings.forEach((p) => map.set(p.id, p));
      pricings = Array.from(map.values());
    }
  } catch (err) {
    console.warn('[CloudCatalog] Using verified baseline Lahore catalog:', err);
  }

  return {
    laboratories,
    tests,
    pricings,
    reviewSummaries: DEFAULT_REVIEW_SUMMARIES,
  };
}

export async function getCloudReviews(labId?: string): Promise<LabReviewRecord[]> {
  try {
    const q = labId
      ? query(collection(db, 'reviews'), where('labId', '==', labId))
      : collection(db, 'reviews');
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...(data as LabReviewRecord),
        id: d.id,
        createdAt: toIsoString(data.createdAt),
      };
    });
  } catch {
    return [];
  }
}

export async function getCloudUserProfile(uid: string): Promise<AuthUser | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: data.uid || uid,
      name: data.name || 'Patient User',
      phone: data.phone || '',
      email: data.email || '',
      role: data.role || 'PATIENT',
      staffCode: data.staffCode,
      labId: data.labId,
      branchId: data.branchId,
      area: data.area || 'Lahore, Punjab',
      familyMembers: Array.isArray(data.familyMembers) ? (data.familyMembers as FamilyMember[]) : [],
      createdAt: toIsoString(data.createdAt),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function upsertCloudUserProfile(params: {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'PATIENT' | 'PHLEBOTOMIST';
  labId?: string;
  branchId?: string;
  staffCode?: string;
  area?: string;
  familyMembers?: FamilyMember[];
}): Promise<AuthUser> {
  const path = `users/${params.uid}`;
  try {
    const ref = doc(db, 'users', params.uid);
    const snap = await getDoc(ref);
    const cleanName = params.name.trim().length >= 2 ? params.name.trim().slice(0, 100) : 'LabConnect User';

    if (!snap.exists()) {
      const payload = stripUndefined({
        uid: params.uid,
        name: cleanName,
        phone: params.phone || undefined,
        email: params.email || undefined,
        role: params.role,
        labId: params.labId || undefined,
        branchId: params.branchId || undefined,
        staffCode: params.staffCode || undefined,
        area: params.area || 'Lahore, Punjab',
        familyMembers: params.familyMembers || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(ref, payload);
      return {
        id: params.uid,
        name: cleanName,
        phone: params.phone || '',
        email: params.email || '',
        role: params.role,
        labId: params.labId,
        branchId: params.branchId,
        staffCode: params.staffCode,
        area: params.area || 'Lahore, Punjab',
        familyMembers: params.familyMembers || [],
        createdAt: new Date().toISOString(),
      };
    } else {
      const existing = snap.data();
      const updates = stripUndefined({
        name: cleanName || existing.name,
        phone: params.phone ?? existing.phone,
        email: params.email ?? existing.email,
        area: params.area ?? existing.area,
        branchId: params.branchId ?? existing.branchId,
        staffCode: params.staffCode ?? existing.staffCode,
        familyMembers: params.familyMembers ?? existing.familyMembers,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(ref, updates);
      return {
        id: params.uid,
        name: (updates.name as string) || existing.name,
        phone: (updates.phone as string) || '',
        email: (updates.email as string) || '',
        role: existing.role || params.role,
        labId: existing.labId,
        branchId: (updates.branchId as string) || existing.branchId,
        staffCode: (updates.staffCode as string) || existing.staffCode,
        area: (updates.area as string) || 'Lahore, Punjab',
        familyMembers: (updates.familyMembers as FamilyMember[]) || [],
        createdAt: toIsoString(existing.createdAt),
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCloudFamilyMembers(
  uid: string,
  familyMembers: FamilyMember[]
): Promise<FamilyMember[]> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      familyMembers,
      updatedAt: serverTimestamp(),
    });
    return familyMembers;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getCloudBookingsForPatient(uid: string): Promise<MockBooking[]> {
  const path = 'bookings';
  try {
    const q = query(collection(db, path), where('patientUserId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          ...(data as MockBooking),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getCloudBookingsForCourier(
  uid: string,
  phone?: string,
  email?: string
): Promise<MockBooking[]> {
  const path = 'bookings';
  try {
    const queries = [query(collection(db, path), where('phlebotomistUid', '==', uid))];
    if (phone) queries.push(query(collection(db, path), where('phlebotomistPhone', '==', phone)));
    if (email) queries.push(query(collection(db, path), where('phlebotomistEmail', '==', email)));

    const snaps = await Promise.all(queries.map((q) => getDocs(q).catch(() => null)));
    const map = new Map<string, MockBooking>();
    for (const snap of snaps) {
      if (!snap) continue;
      for (const d of snap.docs) {
        const data = d.data();
        map.set(d.id, {
          ...(data as MockBooking),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createCloudBooking(
  uid: string,
  bookingData: {
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
  }
): Promise<MockBooking> {
  const { laboratories, pricings } = await getCloudCatalog();
  const lab = laboratories.find((l) => l.id === bookingData.labId) || laboratories[0];
  const branch = lab.branches.find((b) => b.id === bookingData.branchId) || lab.branches[0];

  const testsSubtotal = bookingData.testIds.reduce((sum, tid) => {
    const p = pricings.find((pr) => pr.labId === lab.id && pr.testId === tid);
    return sum + (p ? p.discountedPricePkr || p.pricePkr : 1200);
  }, 0);
  const homeFee = bookingData.collectionType === 'HOME_COLLECTION' ? branch.homeCollectionFeePkr || 0 : 0;
  const totalPkr = Math.max(50, testsSubtotal + homeFee);

  const id = sanitizeId(`bk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`);
  const bookingNumber = `LC-LHR-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const initialEvents: TrackingEvent[] = [
    {
      id: `evt-${Date.now()}`,
      stage: 'BOOKING_CREATED',
      title: 'Diagnostic Order Confirmed',
      description: `${bookingData.testIds.length} test(s) booked at ${lab.name} (${branch.name})`,
      actor: bookingData.patientName,
      location: bookingData.patientArea,
      timestamp: nowIso,
    },
  ];

  const docData = stripUndefined({
    id,
    bookingNumber,
    patientUserId: uid,
    patientName: bookingData.patientName.trim(),
    familyMemberId: bookingData.familyMemberId,
    patientPhone: bookingData.patientPhone.trim(),
    patientEmail: bookingData.patientEmail.trim(),
    patientArea: bookingData.patientArea.trim(),
    streetAddress: bookingData.streetAddress?.trim(),
    labId: lab.id,
    branchId: branch.id,
    branchName: branch.name,
    branchAddress: branch.address,
    testIds: bookingData.testIds,
    collectionType: bookingData.collectionType,
    scheduledDate: bookingData.scheduledDate,
    scheduledTimeSlot: bookingData.scheduledTimeSlot,
    status: 'PENDING',
    totalPkr,
    homeCollectionFeePkr: homeFee,
    phlebotomistStatus: bookingData.collectionType === 'HOME_COLLECTION' ? 'PENDING_ASSIGNMENT' : undefined,
    fastingAcknowledged: Boolean(bookingData.fastingAcknowledged),
    trackingEvents: initialEvents,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const path = `bookings/${id}`;
  try {
    await setDoc(doc(db, 'bookings', id), docData);
    // Scoped patient confirmation notification
    const notifId = sanitizeId(`notif-${Date.now()}`);
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      targetUid: uid,
      recipientRole: 'PATIENT',
      targetLabId: lab.id,
      title: `Booking ${bookingNumber} Confirmed`,
      message: `${lab.name} (${branch.area}) scheduled for ${bookingData.scheduledDate} (${bookingData.scheduledTimeSlot}).`,
      category: 'BOOKING',
      relatedId: bookingNumber,
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => {});

    return {
      ...(docData as unknown as MockBooking),
      id,
      bookingNumber,
      createdAt: nowIso,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function rescheduleCloudBooking(
  id: string,
  scheduledDate: string,
  scheduledTimeSlot: string
): Promise<MockBooking> {
  const path = `bookings/${id}`;
  try {
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Booking not found');
    const current = snap.data() as MockBooking;
    const events = Array.isArray(current.trackingEvents) ? [...current.trackingEvents] : [];
    events.push({
      id: `evt-${Date.now()}`,
      stage: 'BOOKING_CREATED',
      title: 'Appointment Rescheduled',
      description: `Rescheduled to ${scheduledDate} (${scheduledTimeSlot})`,
      actor: auth.currentUser?.displayName || current.patientName,
      timestamp: new Date().toISOString(),
    });
    await updateDoc(ref, {
      scheduledDate,
      scheduledTimeSlot,
      trackingEvents: events,
      updatedAt: serverTimestamp(),
    });
    return { ...current, id, scheduledDate, scheduledTimeSlot, trackingEvents: events };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function cancelCloudBooking(id: string, reason?: string): Promise<MockBooking> {
  const path = `bookings/${id}`;
  try {
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Booking not found');
    const current = snap.data() as MockBooking;
    const events = Array.isArray(current.trackingEvents) ? [...current.trackingEvents] : [];
    events.push({
      id: `evt-${Date.now()}`,
      stage: 'BOOKING_CREATED',
      title: 'Order Cancelled by Patient',
      description: reason || 'Cancelled prior to sample dispatch',
      actor: current.patientName,
      timestamp: new Date().toISOString(),
    });
    await updateDoc(ref, {
      status: 'CANCELLED',
      trackingEvents: events,
      updatedAt: serverTimestamp(),
    });
    return { ...current, id, status: 'CANCELLED', trackingEvents: events };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateCloudBookingStatus(
  id: string,
  status: MockBooking['status'],
  actorName: string,
  extra?: {
    phlebotomistStatus?: MockBooking['phlebotomistStatus'];
    sampleBarcode?: string;
    coldChainTempCelsius?: number;
    fastingConfirmed?: boolean;
  }
): Promise<MockBooking> {
  const path = `bookings/${id}`;
  try {
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Booking not found');
    const current = snap.data() as MockBooking;
    const events = Array.isArray(current.trackingEvents) ? [...current.trackingEvents] : [];
    const stageMap: Record<string, TrackingEvent['stage']> = {
      EN_ROUTE: 'EN_ROUTE',
      ARRIVED: 'ARRIVED',
      SAMPLE_COLLECTED: 'SAMPLE_COLLECTED',
      IN_TRANSIT: 'IN_TRANSIT',
      RECEIVED_AT_LAB: 'RECEIVED_AT_LAB',
    };
    events.push({
      id: `evt-${Date.now()}`,
      stage: (extra?.phlebotomistStatus && stageMap[extra.phlebotomistStatus]) || 'DISPATCHED',
      title: `Field Checkpoint: ${(extra?.phlebotomistStatus || status).replace(/_/g, ' ')}`,
      description: extra?.sampleBarcode
        ? `Barcode ${extra.sampleBarcode} · Cold Box ${extra.coldChainTempCelsius ?? 4.2}°C`
        : `Updated cold-chain status at ${extra?.coldChainTempCelsius ?? 4.2}°C`,
      actor: actorName,
      location: current.patientArea,
      timestamp: new Date().toISOString(),
    });

    const patch = stripUndefined({
      status,
      phlebotomistStatus: extra?.phlebotomistStatus,
      sampleBarcode: extra?.sampleBarcode,
      coldChainTempCelsius: extra?.coldChainTempCelsius,
      fastingConfirmed: extra?.fastingConfirmed,
      trackingEvents: events,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(ref, patch);
    return {
      ...current,
      ...patch,
      id,
      status,
      trackingEvents: events,
    } as MockBooking;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getCloudReportsForPatient(uid: string): Promise<DiagnosticReportRecord[]> {
  const path = 'reports';
  try {
    const q = query(collection(db, path), where('patientUserId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          ...(data as DiagnosticReportRecord),
          id: d.id,
          publishedAt: toIsoString(data.publishedAt),
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function submitCloudReview(
  uid: string,
  patientName: string,
  data: {
    labId: string;
    bookingNumber: string;
    rating: number;
    punctualityRating: number;
    turnaroundRating: number;
    comment: string;
  }
): Promise<LabReviewRecord> {
  const id = sanitizeId(`rev-${Date.now()}`);
  const path = `reviews/${id}`;
  const docData = {
    id,
    labId: data.labId,
    bookingNumber: data.bookingNumber,
    patientUserId: uid,
    patientName: patientName.slice(0, 100),
    rating: data.rating,
    punctualityRating: data.punctualityRating,
    turnaroundRating: data.turnaroundRating,
    comment: data.comment.trim(),
    verifiedBooking: true,
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'reviews', id), docData);
    return {
      ...(docData as unknown as LabReviewRecord),
      verifiedBooking: true,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getCloudNotifications(uid: string): Promise<{
  data: NotificationRecord[];
  unreadCount: number;
}> {
  const path = 'notifications';
  try {
    const q = query(collection(db, path), where('targetUid', '==', uid));
    const snap = await getDocs(q);
    const list = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          ...(data as NotificationRecord),
          id: d.id,
          createdAt: toIsoString(data.createdAt),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      data: list,
      unreadCount: list.filter((n) => !n.read).length,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function markCloudNotificationRead(uid: string, notificationId?: string): Promise<void> {
  const path = 'notifications';
  try {
    if (notificationId) {
      await updateDoc(doc(db, path, notificationId), { read: true });
      return;
    }
    const { data } = await getCloudNotifications(uid);
    await Promise.all(
      data.filter((n) => !n.read).map((n) => updateDoc(doc(db, path, n.id), { read: true }))
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCloudNotification(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
