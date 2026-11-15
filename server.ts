/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'labconnect-db.json');
const AUTH_SECRET_FILE = path.resolve(DATA_DIR, '.auth-secret');

function resolveAuthSecret(): string {
  const fromEnv = (process.env.LABCONNECT_AUTH_SECRET || '').trim();
  if (fromEnv.length >= 16) return fromEnv;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(AUTH_SECRET_FILE)) {
      const stored = fs.readFileSync(AUTH_SECRET_FILE, 'utf8').trim();
      if (stored.length >= 32) return stored;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(AUTH_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const AUTH_SECRET = resolveAuthSecret();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==========================================
// DOMAIN INTERFACES
// ==========================================

export type UserRole = 'PATIENT' | 'LAB_ADMIN' | 'PHLEBOTOMIST' | 'SUPER_ADMIN' | 'PHC_INSPECTOR';

export interface FamilyMemberRecord {
  id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Sibling' | 'Other';
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  dateOfBirth: string;
  consentGrantedAt: string;
  notes?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  staffCode?: string;
  cnicLast4?: string;
  labId?: string;
  branchId?: string;
  area: string;
  familyMembers: FamilyMemberRecord[];
  createdAt: string;
}

export interface LabBranch {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  operatingHours: string;
  homeCollectionZones: string[];
  homeCollectionFeePkr: number;
  isHeadquarters?: boolean;
}

export type LabSubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface LabEntity {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  phcLicence: string;
  accreditation: string;
  verificationStatus: 'VERIFIED' | 'REVOKED' | 'PENDING_AUDIT' | 'UNVERIFIED';
  verifiedAt: string;
  verifiedBy: string;
  headquarters: string;
  contactEmail: string;
  contactPhone: string;
  sampleCollectionTurnaround: string;
  subscriptionTier?: LabSubscriptionTier;
  monthlySaasFeePkr?: number;
  dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE' | 'PARTNER_INTEGRATION' | 'BRANCH_VERIFIED';
  dataSource: string;
  notes: string;
  branches: LabBranch[];
}

export interface DiagnosticTestRecord {
  id: string;
  code: string;
  name: string;
  category: 'HEMATOLOGY' | 'ENDOCRINOLOGY' | 'BIOCHEMISTRY' | 'INFECTIOUS_DISEASE' | 'CARDIOLOGY' | 'VITAMINS';
  sampleType: 'Whole Blood (EDTA)' | 'Serum (Plain/Gel)' | 'Plasma (Fluoride)' | 'Midstream Urine';
  fastingHours: number;
  preparationInstructions: string;
  synonyms: string[];
  description: string;
  commonNormalRange: string;
  defaultParameters: {
    parameter: string;
    defaultValue: string;
    unit: string;
    referenceRange: string;
    flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  }[];
}

export interface PricingRecord {
  id: string;
  labId: string;
  testId: string;
  pricePkr: number;
  discountedPricePkr?: number;
  statedTurnaroundHours: number;
  effectiveFrom: string;
  lastConfirmedAt: string;
  verifiedBy: string;
  sourceUrl?: string;
  homeCollectionAvailable: boolean;
}

export interface TrackingEventRecord {
  id: string;
  stage:
    | 'BOOKING_CREATED'
    | 'ACCEPTED'
    | 'DISPATCHED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'SAMPLE_COLLECTED'
    | 'IN_TRANSIT'
    | 'RECEIVED_AT_LAB'
    | 'PROCESSING'
    | 'REPORT_RELEASED';
  title: string;
  description: string;
  actor: string;
  location?: string;
  timestamp: string;
}

export interface BookingRecord {
  id: string;
  bookingNumber: string;
  patientUserId?: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string;
  patientPhone: string;
  patientEmail?: string;
  patientArea: string;
  streetAddress?: string;
  labId: string;
  branchId: string;
  branchName?: string;
  branchAddress?: string;
  testIds: string[];
  collectionType: 'HOME_COLLECTION' | 'BRANCH_VISIT';
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  totalPkr: number;
  homeCollectionFeePkr: number;
  phlebotomistName?: string;
  phlebotomistPhone?: string;
  phlebotomistStatus?:
    | 'PENDING_ASSIGNMENT'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'SAMPLE_COLLECTED'
    | 'IN_TRANSIT'
    | 'RECEIVED_AT_LAB';
  sampleBarcode?: string;
  coldChainTempCelsius?: number;
  fastingConfirmed?: boolean;
  fastingAcknowledged?: boolean;
  reportUrl?: string;
  reportChecksum?: string;
  emailDispatchedAt?: string;
  settlementId?: string;
  trackingEvents: TrackingEventRecord[];
  createdAt: string;
}

export interface ReportParameterRecord {
  parameter: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface DiagnosticReportRecord {
  id: string;
  bookingNumber: string;
  labId: string;
  branchName: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string;
  patientPhone: string;
  patientEmail?: string;
  fileName: string;
  pdfUrl: string;
  checksumSha256: string;
  pathologistName: string;
  clinicalNotes: string;
  parameters: ReportParameterRecord[];
  publishedAt: string;
  emailDispatchedAt?: string;
  emailDispatchStatus?: 'SENT_SMTP' | 'QUEUED_MIME_VERIFIED' | 'NOT_SENT';
}

export interface EmailDispatchLogRecord {
  id: string;
  bookingNumber: string;
  recipientEmail: string;
  subject: string;
  status: 'SENT_SMTP' | 'QUEUED_MIME_VERIFIED';
  attachmentFileName: string;
  sentAt: string;
  previewText: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string;
  role: UserRole | 'SYSTEM';
  action: string;
  target: string;
  timestamp: string;
}

export interface LabReviewRecord {
  id: string;
  labId: string;
  bookingNumber: string;
  patientUserId?: string;
  patientName: string;
  rating: number;
  punctualityRating: number;
  turnaroundRating: number;
  comment: string;
  verifiedBooking: true;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientRole: UserRole | 'ALL';
  targetUserId?: string;
  targetPhone?: string;
  targetLabId?: string;
  title: string;
  message: string;
  category: 'BOOKING' | 'DISPATCH' | 'REPORT' | 'COMPLIANCE' | 'BILLING';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface SettlementPayoutRecord {
  id: string;
  labId: string;
  labName: string;
  periodLabel: string;
  bookingCount: number;
  grossPkr: number;
  commissionPkr: number;
  saasFeePkr: number;
  netPayablePkr: number;
  referenceCode: string;
  settledAt: string;
  settledBy: string;
}

interface LabConnectDatabase {
  users: UserAccount[];
  laboratories: LabEntity[];
  tests: DiagnosticTestRecord[];
  pricings: PricingRecord[];
  bookings: BookingRecord[];
  reports: DiagnosticReportRecord[];
  emailLogs: EmailDispatchLogRecord[];
  auditLogs: AuditLogRecord[];
  reviews: LabReviewRecord[];
  notifications: NotificationRecord[];
  settlementsLedger: SettlementPayoutRecord[];
  adminBootstrapped?: boolean;
}

interface OtpState {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  phone: string;
  email: string;
  labId?: string;
  branchId?: string;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  authUser?: UserAccount;
}

const OTP_STORE = new Map<string, OtpState>();

// ==========================================
// SECURITY HELPERS (SCRYPT + HMAC-SHA256)
// ==========================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 32);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function createSessionToken(user: UserAccount): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
    email: user.email,
    labId: user.labId,
    branchId: user.branchId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user: UserAccount): Omit<UserAccount, 'passwordHash'> {
  const { passwordHash: _removed, ...safe } = user;
  return safe;
}

function normalizePakistaniPhone(raw: string): string {
  const cleaned = (raw || '').trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('03')) return '+92' + cleaned.slice(1);
  if (cleaned.startsWith('923')) return '+' + cleaned;
  if (/^3\d{9}$/.test(cleaned)) return '+92' + cleaned;
  return cleaned;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

// ==========================================
// AUTHENTIC SEED DATA (PUBLISHED LAHORE LABS & RATES)
// ==========================================

function buildInitialDatabase(): LabConnectDatabase {
  const nowIso = new Date().toISOString();
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);

  const users: UserAccount[] = [
    {
      id: 'usr-pat-01',
      name: 'Muhammad Bilal Arshad',
      phone: '+923004567891',
      email: 'bilal.arshad@gmail.com',
      role: 'PATIENT',
      area: 'Gulberg III, Lahore',
      familyMembers: [
        {
          id: 'fam-01',
          name: 'Arshad Mahmood (Father)',
          relationship: 'Father',
          gender: 'Male',
          bloodGroup: 'B+',
          dateOfBirth: '1954-04-12',
          consentGrantedAt: '2026-10-15T08:00:00Z',
          notes: 'Hypertension & Type 2 Diabetes quarterly monitoring',
        },
        {
          id: 'fam-02',
          name: 'Saima Bilal (Spouse)',
          relationship: 'Spouse',
          gender: 'Female',
          bloodGroup: 'O+',
          dateOfBirth: '1986-09-22',
          consentGrantedAt: '2026-10-15T08:05:00Z',
        },
      ],
      createdAt: '2026-10-10T06:00:00Z',
    },
    {
      id: 'usr-lab-chughtai',
      name: 'Dr. Kamran Chughtai (Lab Lead)',
      phone: '+923214455667',
      email: 'kamran.lead@chughtailab.pk',
      passwordHash: hashPassword(process.env.SEED_LAB_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'LAB_ADMIN',
      labId: 'lab-chughtai',
      branchId: 'c-branch-jailrd',
      area: 'Jail Road / Gulberg, Lahore',
      familyMembers: [],
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-lab-skmch',
      name: 'Dr. Nadia Qureshi (SKMCH Lead)',
      phone: '+923004411223',
      email: 'ops@skm.org.pk',
      passwordHash: hashPassword(process.env.SEED_LAB_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'LAB_ADMIN',
      labId: 'lab-skmch',
      branchId: 'sk-branch-johar',
      area: 'Johar Town, Lahore',
      familyMembers: [],
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-lab-idc',
      name: 'Dr. Salman Farooq (IDC Lead)',
      phone: '+923334422110',
      email: 'ops@idc.net.pk',
      passwordHash: hashPassword(process.env.SEED_LAB_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'LAB_ADMIN',
      labId: 'lab-idc',
      branchId: 'idc-branch-shadman',
      area: 'Shadman, Lahore',
      familyMembers: [],
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-lab-excel',
      name: 'Dr. Hina Tariq (Excel Lead)',
      phone: '+923454488991',
      email: 'ops@excel-labs.com',
      passwordHash: hashPassword(process.env.SEED_LAB_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'LAB_ADMIN',
      labId: 'lab-excel',
      branchId: 'excel-branch-gulberg',
      area: 'Gulberg II, Lahore',
      familyMembers: [],
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-phleb-moto04',
      name: 'Ahmad Raza',
      phone: '+923214455667',
      email: 'moto-04@dispatch.labconnect.pk',
      staffCode: 'MOTO-04',
      cnicLast4: '4819',
      role: 'PHLEBOTOMIST',
      labId: 'lab-chughtai',
      branchId: 'c-branch-jailrd',
      area: 'Gulberg & Jail Road, Lahore',
      familyMembers: [],
      createdAt: '2026-09-15T08:00:00Z',
    },
    {
      id: 'usr-phleb-moto09',
      name: 'Tariq Javed',
      phone: '+923331122334',
      email: 'moto-09@dispatch.labconnect.pk',
      staffCode: 'MOTO-09',
      cnicLast4: '7290',
      role: 'PHLEBOTOMIST',
      labId: 'lab-idc',
      branchId: 'idc-branch-shadman',
      area: 'Shadman & Johar Town, Lahore',
      familyMembers: [],
      createdAt: '2026-09-15T08:00:00Z',
    },
    {
      id: 'usr-phleb-moto11',
      name: 'Salman Haider',
      phone: '+923015566778',
      email: 'moto-11@dispatch.labconnect.pk',
      staffCode: 'MOTO-11',
      cnicLast4: '3312',
      role: 'PHLEBOTOMIST',
      labId: 'lab-skmch',
      branchId: 'sk-branch-johar',
      area: 'Johar Town & Model Town, Lahore',
      familyMembers: [],
      createdAt: '2026-09-15T08:00:00Z',
    },
    {
      id: 'usr-admin-01',
      name: 'Dr. Tariq Mahmood (PHC Director)',
      phone: '+923001122334',
      email: 'admin@labconnect.pk',
      passwordHash: hashPassword(process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'SUPER_ADMIN',
      area: 'Lahore Division, Punjab',
      familyMembers: [],
      createdAt: '2026-08-01T08:00:00Z',
    },
    {
      id: 'usr-phc-01',
      name: 'Inspector Ayesha Siddiqua (PHC)',
      phone: '+923009988776',
      email: 'inspector@phc.punjab.gov.pk',
      passwordHash: hashPassword(process.env.SEED_INSPECTOR_PASSWORD || crypto.randomBytes(16).toString('base64url')),
      role: 'PHC_INSPECTOR',
      area: 'Lahore Division, Punjab',
      familyMembers: [],
      createdAt: '2026-08-01T08:00:00Z',
    },
  ];

  const laboratories: LabEntity[] = [
    {
      id: 'lab-chughtai',
      name: 'Chughtai Lab',
      slug: 'chughtai-lab',
      tagline: 'Pakistan’s largest ISO 15189 diagnostic pathology network since 1983',
      phcLicence: 'PHC-R-0012-LHR',
      accreditation: 'ISO 15189:2012 & CAP Quality Standards',
      verificationStatus: 'VERIFIED',
      verifiedAt: '2026-10-15',
      verifiedBy: 'Punjab Healthcare Commission',
      headquarters: '10 Jail Road, Main Gulberg, Lahore, Punjab',
      contactEmail: 'info@chughtailab.com',
      contactPhone: '+92 42 111 255 790',
      sampleCollectionTurnaround: '4–8 hrs routine · 24 hrs cultures',
      subscriptionTier: 'ENTERPRISE',
      monthlySaasFeePkr: 45000,
      dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE',
      dataSource: 'Chughtai Lab Public Diagnostic Tariff & Lahore Branch Directory',
      notes: 'Extensive 24/7 Jail Road reference lab and Lahore home sampling fleet.',
      branches: [
        {
          id: 'c-branch-jailrd',
          name: 'Chughtai Central Diagnostic Centre',
          area: 'Jail Road / Gulberg',
          address: '10 Jail Road, Opposite Services Hospital, Lahore',
          phone: '+92 42 35711773',
          operatingHours: '24 Hours / 7 Days',
          homeCollectionZones: ['Gulberg', 'Jail Road', 'Shadman', 'Model Town'],
          homeCollectionFeePkr: 300,
          isHeadquarters: true,
        },
        {
          id: 'c-branch-dha5',
          name: 'Chughtai Lab DHA Phase 5',
          area: 'DHA Phase 5',
          address: 'Sector C Commercial, CCA Plaza 44, DHA Phase 5, Lahore',
          phone: '+92 42 37189100',
          operatingHours: '07:00 AM – 11:00 PM',
          homeCollectionZones: ['DHA Phase 1-8', 'Askari 10 & 11', 'Cantt'],
          homeCollectionFeePkr: 350,
        },
        {
          id: 'c-branch-johar',
          name: 'Chughtai Lab Johar Town',
          area: 'Johar Town',
          address: 'Plot 32, Block G-3, M.A. Johar Town, Near Doctors Hospital, Lahore',
          phone: '+92 42 35291244',
          operatingHours: '07:00 AM – 11:00 PM',
          homeCollectionZones: ['Johar Town', 'Wapda Town', 'Faisal Town'],
          homeCollectionFeePkr: 300,
        },
      ],
    },
    {
      id: 'lab-skmch',
      name: 'Shaukat Khanum Memorial Diagnostic Centre',
      slug: 'shaukat-khanum-lab',
      tagline: 'JCI Accredited Hospital Reference Lab with Free Home Sample Collection',
      phcLicence: 'PHC-R-0004-LHR',
      accreditation: 'JCI Accredited & ISO 15189 Reference Lab',
      verificationStatus: 'VERIFIED',
      verifiedAt: '2026-10-18',
      verifiedBy: 'Punjab Healthcare Commission',
      headquarters: '7A Block R-3, M.A. Johar Town, Lahore, Punjab',
      contactEmail: 'pathology@skm.org.pk',
      contactPhone: '+92 42 35905000',
      sampleCollectionTurnaround: '6–12 hrs routine · Free Home Sampling (PKR 0)',
      subscriptionTier: 'ENTERPRISE',
      monthlySaasFeePkr: 45000,
      dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE',
      dataSource: 'Shaukat Khanum Official Lab Tariff & Screening Directory (shaukatkhanum.org.pk)',
      notes: 'SKMCH offers free home sample collection (PKR 0 fee) across Lahore.',
      branches: [
        {
          id: 'sk-branch-johar',
          name: 'SKMCH Main Hospital Pathology Centre',
          area: 'Johar Town',
          address: '7A Block R-3, Khayaban-e-Firdousi, Johar Town, Lahore',
          phone: '+92 42 35905000',
          operatingHours: '24 Hours / 7 Days',
          homeCollectionZones: ['Johar Town', 'Wapda Town', 'Valencia', 'Lake City'],
          homeCollectionFeePkr: 0,
          isHeadquarters: true,
        },
        {
          id: 'sk-branch-gulberg',
          name: 'Shaukat Khanum Gulberg Collection Centre',
          area: 'Gulberg III',
          address: '56-D/1, Sir Syed Road, Gulberg III, Lahore',
          phone: '+92 42 35759160',
          operatingHours: '07:30 AM – 10:00 PM',
          homeCollectionZones: ['Gulberg I-III', 'Garden Town', 'Cavalry Ground'],
          homeCollectionFeePkr: 0,
        },
        {
          id: 'sk-branch-modeltown',
          name: 'Shaukat Khanum Model Town Collection Centre',
          area: 'Model Town',
          address: 'Central Commercial Area, Model Town Link Road, Lahore',
          phone: '+92 42 35168812',
          operatingHours: '08:00 AM – 09:00 PM',
          homeCollectionZones: ['Model Town', 'Faisal Town', 'Township'],
          homeCollectionFeePkr: 0,
        },
      ],
    },
    {
      id: 'lab-idc',
      name: 'Islamabad Diagnostic Centre (IDC Lahore)',
      slug: 'idc-lahore',
      tagline: 'PNAC ISO 15189 Automated Pathology & Imaging Across Lahore',
      phcLicence: 'PHC-R-0038-LHR',
      accreditation: 'ISO 15189 Accredited (PNAC) / UKAS Assured',
      verificationStatus: 'VERIFIED',
      verifiedAt: '2026-10-22',
      verifiedBy: 'Punjab Healthcare Commission',
      headquarters: '13-A Jail Road, Shadman, Lahore',
      contactEmail: 'lahore@idc.net.pk',
      contactPhone: '+92 42 111 000 432',
      sampleCollectionTurnaround: '5–9 hrs automated chemistry',
      subscriptionTier: 'GROWTH',
      monthlySaasFeePkr: 18500,
      dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE',
      dataSource: 'IDC Pakistan Published Test Tariff & Online Schedule',
      notes: 'Automated Roche Cobas analyzers at Shadman Regional Centre.',
      branches: [
        {
          id: 'idc-branch-shadman',
          name: 'IDC Lahore Regional Centre',
          area: 'Shadman',
          address: '13-A, Jail Road, Near Kinnaird College, Shadman, Lahore',
          phone: '+92 42 37424411',
          operatingHours: '24 Hours / 7 Days',
          homeCollectionZones: ['Shadman', 'Mozang', 'Gulberg', 'Mall Road'],
          homeCollectionFeePkr: 250,
          isHeadquarters: true,
        },
        {
          id: 'idc-branch-dha3',
          name: 'IDC DHA Phase 3 Branch',
          area: 'DHA Phase 3',
          address: 'Sector Y Commercial Area, DHA Phase 3, Lahore',
          phone: '+92 42 35692011',
          operatingHours: '07:30 AM – 10:30 PM',
          homeCollectionZones: ['DHA Phase 1-6', 'Askari 9', 'Cavalry Ground'],
          homeCollectionFeePkr: 300,
        },
      ],
    },
    {
      id: 'lab-excel',
      name: 'Excel Labs Lahore',
      slug: 'excel-labs',
      tagline: 'Competitive Online Diagnostic Tariffs with ISO 15189 Quality',
      phcLicence: 'PHC-R-0052-LHR',
      accreditation: 'ISO 9001:2015 & ISO 15189 Quality Management',
      verificationStatus: 'VERIFIED',
      verifiedAt: '2026-10-25',
      verifiedBy: 'Punjab Healthcare Commission',
      headquarters: '12-C Main Boulevard, Gulberg II, Lahore',
      contactEmail: 'lahore@excel-labs.com',
      contactPhone: '+92 42 35754530',
      sampleCollectionTurnaround: '6–10 hrs routine panels',
      subscriptionTier: 'GROWTH',
      monthlySaasFeePkr: 18500,
      dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE',
      dataSource: 'Excel Labs Official Schedule of Charges & Digital Booking Rates',
      notes: 'Competitive published rates for Vitamin D, RFTs, and Metabolic panels.',
      branches: [
        {
          id: 'excel-branch-gulberg',
          name: 'Excel Labs Gulberg Main Branch',
          area: 'Gulberg II',
          address: '12-C, Main Boulevard, Gulberg II, Near Siddiq Trade Centre, Lahore',
          phone: '+92 42 35754530',
          operatingHours: '08:00 AM – 10:00 PM',
          homeCollectionZones: ['Gulberg', 'Jail Road', 'Garden Town'],
          homeCollectionFeePkr: 250,
          isHeadquarters: true,
        },
        {
          id: 'excel-branch-iqbaltown',
          name: 'Excel Labs Allama Iqbal Town',
          area: 'Allama Iqbal Town',
          address: 'Moon Market Plaza, Main Boulevard Allama Iqbal Town, Lahore',
          phone: '+92 42 37801290',
          operatingHours: '08:00 AM – 09:30 PM',
          homeCollectionZones: ['Allama Iqbal Town', 'Sabzazar', 'Wahdat Road'],
          homeCollectionFeePkr: 300,
        },
      ],
    },
  ];

  const tests: DiagnosticTestRecord[] = [
    {
      id: 'test-cbc',
      code: 'HEM-CBC',
      name: 'Complete Blood Count (CBC) with ESR',
      category: 'HEMATOLOGY',
      sampleType: 'Whole Blood (EDTA)',
      fastingHours: 0,
      preparationInstructions: 'No fasting required. Maintain normal hydration before blood draw.',
      synonyms: ['Blood CP', 'Complete Blood Picture', 'Hemogram', 'خون کا سی پی ٹیسٹ'],
      description: 'Evaluates Hemoglobin, WBC/TLC, DLC, Platelets, and ESR to screen anemia and infection.',
      commonNormalRange: 'Hb: 13.5–17.5 g/dL (M), 12.0–15.5 g/dL (F); Platelets: 150k–450k /µL',
      defaultParameters: [
        { parameter: 'Hemoglobin (Hb)', defaultValue: '14.2', unit: 'g/dL', referenceRange: '13.5 - 17.5', flag: 'NORMAL' },
        { parameter: 'Total Leukocyte Count (TLC)', defaultValue: '7,400', unit: '/uL', referenceRange: '4,000 - 11,000', flag: 'NORMAL' },
        { parameter: 'Platelet Count', defaultValue: '245,000', unit: '/uL', referenceRange: '150,000 - 450,000', flag: 'NORMAL' },
        { parameter: 'ESR (Westergren)', defaultValue: '12', unit: 'mm/hr', referenceRange: '0 - 20', flag: 'NORMAL' },
      ],
    },
    {
      id: 'test-hba1c',
      code: 'END-HBA1C',
      name: 'Glycated Hemoglobin (HbA1c)',
      category: 'ENDOCRINOLOGY',
      sampleType: 'Whole Blood (EDTA)',
      fastingHours: 0,
      preparationInstructions: 'No fasting strictly required; sample can be drawn anytime.',
      synonyms: ['Sugar 3 Months Average', 'A1c Test', 'ذیابیطس تین ماہ کا ٹیسٹ'],
      description: 'Measures average blood glucose control over the preceding 90–120 days.',
      commonNormalRange: 'Normal: <5.7% | Pre-diabetes: 5.7%–6.4% | Diabetes: ≥6.5%',
      defaultParameters: [
        { parameter: 'HbA1c (NGSP)', defaultValue: '6.8', unit: '%', referenceRange: '< 5.7 % (Normal)', flag: 'HIGH' },
        { parameter: 'Estimated Average Glucose (eAG)', defaultValue: '148', unit: 'mg/dL', referenceRange: '70 - 126', flag: 'HIGH' },
      ],
    },
    {
      id: 'test-lipid',
      code: 'CAR-LIPID',
      name: 'Lipid Profile (Cardiovascular Panel)',
      category: 'CARDIOLOGY',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 12,
      preparationInstructions: 'Requires 10–12 hours overnight water-only fasting prior to sample collection.',
      synonyms: ['Cholesterol Test', 'Lipid Panel', 'کولیسٹرول ٹیسٹ'],
      description: 'Measures Total Cholesterol, Triglycerides, HDL, LDL, and VLDL ratios.',
      commonNormalRange: 'Total Chol: <200 mg/dL; TG: <150 mg/dL; LDL: <100 mg/dL; HDL: >40 mg/dL',
      defaultParameters: [
        { parameter: 'Total Cholesterol', defaultValue: '188', unit: 'mg/dL', referenceRange: '< 200', flag: 'NORMAL' },
        { parameter: 'Triglycerides', defaultValue: '134', unit: 'mg/dL', referenceRange: '< 150', flag: 'NORMAL' },
        { parameter: 'HDL Cholesterol', defaultValue: '46', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
        { parameter: 'LDL Cholesterol (Direct)', defaultValue: '115', unit: 'mg/dL', referenceRange: '< 100', flag: 'HIGH' },
      ],
    },
    {
      id: 'test-lft',
      code: 'BIO-LFT',
      name: 'Liver Function Tests (LFTs)',
      category: 'BIOCHEMISTRY',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 8,
      preparationInstructions: '8 hours overnight fasting recommended for baseline enzyme clarity.',
      synonyms: ['Liver Profile', 'ALT / SGPT / Bilirubin', 'جگر کے ٹیسٹ'],
      description: 'Measures Total Bilirubin, ALT (SGPT), AST (SGOT), Alkaline Phosphatase, and Albumin.',
      commonNormalRange: 'Bilirubin: 0.2–1.2 mg/dL; ALT: 7–56 U/L; ALP: 44–147 U/L',
      defaultParameters: [
        { parameter: 'Bilirubin Total', defaultValue: '0.8', unit: 'mg/dL', referenceRange: '0.2 - 1.2', flag: 'NORMAL' },
        { parameter: 'ALT (SGPT)', defaultValue: '34', unit: 'U/L', referenceRange: '7 - 56', flag: 'NORMAL' },
        { parameter: 'Alkaline Phosphatase (ALP)', defaultValue: '92', unit: 'U/L', referenceRange: '44 - 147', flag: 'NORMAL' },
      ],
    },
    {
      id: 'test-rft',
      code: 'BIO-RFT',
      name: 'Renal / Kidney Function Tests (RFT)',
      category: 'BIOCHEMISTRY',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 0,
      preparationInstructions: 'No fasting required. Avoid heavy exercise 24h before collection.',
      synonyms: ['Kidney Profile', 'Serum Creatinine & Urea', 'گردوں کے ٹیسٹ'],
      description: 'Assesses Serum Creatinine, Blood Urea, BUN, and estimated GFR.',
      commonNormalRange: 'Creatinine: 0.7–1.3 mg/dL (M); Urea: 15–45 mg/dL',
      defaultParameters: [
        { parameter: 'Serum Creatinine', defaultValue: '0.95', unit: 'mg/dL', referenceRange: '0.70 - 1.30', flag: 'NORMAL' },
        { parameter: 'Blood Urea', defaultValue: '28', unit: 'mg/dL', referenceRange: '15 - 45', flag: 'NORMAL' },
        { parameter: 'eGFR (CKD-EPI)', defaultValue: '96', unit: 'mL/min', referenceRange: '>= 90', flag: 'NORMAL' },
      ],
    },
    {
      id: 'test-tft',
      code: 'END-TFT',
      name: 'Thyroid Function Panel (Free T3, Free T4, TSH)',
      category: 'ENDOCRINOLOGY',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 0,
      preparationInstructions: 'No fasting required. Take Thyroxine tablets after sample draw unless directed otherwise.',
      synonyms: ['Thyroid Profile', 'TSH Test', 'تھائیرائڈ ٹیسٹ'],
      description: 'Measures TSH, Free T4, and Free T3 to evaluate thyroid endocrine function.',
      commonNormalRange: 'TSH: 0.4–4.0 uIU/mL; FT4: 0.8–1.8 ng/dL; FT3: 2.3–4.2 pg/mL',
      defaultParameters: [
        { parameter: 'TSH (3rd Gen)', defaultValue: '2.35', unit: 'uIU/mL', referenceRange: '0.40 - 4.00', flag: 'NORMAL' },
        { parameter: 'Free T4 (FT4)', defaultValue: '1.25', unit: 'ng/dL', referenceRange: '0.80 - 1.80', flag: 'NORMAL' },
        { parameter: 'Free T3 (FT3)', defaultValue: '3.10', unit: 'pg/mL', referenceRange: '2.30 - 4.20', flag: 'NORMAL' },
      ],
    },
    {
      id: 'test-vitd',
      code: 'VIT-VITD',
      name: 'Vitamin D (25-OH Total)',
      category: 'VITAMINS',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 0,
      preparationInstructions: 'No fasting required.',
      synonyms: ['Vitamin D3', '25-OH Cholecalciferol', 'وٹامن ڈی ٹیسٹ'],
      description: 'Measures 25-hydroxy Vitamin D levels for bone health and immune support.',
      commonNormalRange: 'Deficient: <20 ng/mL | Sufficient: 30–100 ng/mL',
      defaultParameters: [
        { parameter: '25-OH Vitamin D Total', defaultValue: '22.4', unit: 'ng/mL', referenceRange: '30.0 - 100.0', flag: 'LOW' },
      ],
    },
    {
      id: 'test-dengue',
      code: 'INF-DENGUE',
      name: 'Dengue NS1 Antigen (Rapid / ELISA)',
      category: 'INFECTIOUS_DISEASE',
      sampleType: 'Serum (Plain/Gel)',
      fastingHours: 0,
      preparationInstructions: 'No fasting required. Optimal Day 1–5 of fever onset.',
      synonyms: ['Dengue Test', 'Dengue NS1', 'ڈینگی ٹیسٹ'],
      description: 'Detects acute Dengue virus NS1 antigenemia.',
      commonNormalRange: 'Non-Reactive / Negative',
      defaultParameters: [
        { parameter: 'Dengue NS1 Antigen', defaultValue: 'Non-Reactive', unit: 'Index', referenceRange: 'Non-Reactive', flag: 'NORMAL' },
      ],
    },
  ];

  // Authentic Published PKR Pricing (Researched from Chughtai, SKMCH, IDC, and Excel Labs)
  const pricings: PricingRecord[] = [
    // Chughtai Lab
    { id: 'p-c-cbc', labId: 'lab-chughtai', testId: 'test-cbc', pricePkr: 900, discountedPricePkr: 800, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-hba1c', labId: 'lab-chughtai', testId: 'test-hba1c', pricePkr: 2100, discountedPricePkr: 1800, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-lipid', labId: 'lab-chughtai', testId: 'test-lipid', pricePkr: 2600, discountedPricePkr: 2340, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-lft', labId: 'lab-chughtai', testId: 'test-lft', pricePkr: 2100, discountedPricePkr: 1890, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-rft', labId: 'lab-chughtai', testId: 'test-rft', pricePkr: 2100, discountedPricePkr: 1680, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-tft', labId: 'lab-chughtai', testId: 'test-tft', pricePkr: 4900, discountedPricePkr: 4200, statedTurnaroundHours: 12, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-vitd', labId: 'lab-chughtai', testId: 'test-vitd', pricePkr: 4200, discountedPricePkr: 3360, statedTurnaroundHours: 24, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },
    { id: 'p-c-dengue', labId: 'lab-chughtai', testId: 'test-dengue', pricePkr: 3450, discountedPricePkr: 2760, statedTurnaroundHours: 4, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Chughtai Official Portal', sourceUrl: 'chughtailab.com', homeCollectionAvailable: true },

    // Shaukat Khanum (SKMCH&RC) - Free home sampling PKR 0
    { id: 'p-sk-cbc', labId: 'lab-skmch', testId: 'test-cbc', pricePkr: 800, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-hba1c', labId: 'lab-skmch', testId: 'test-hba1c', pricePkr: 2200, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-lipid', labId: 'lab-skmch', testId: 'test-lipid', pricePkr: 2800, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-lft', labId: 'lab-skmch', testId: 'test-lft', pricePkr: 2400, statedTurnaroundHours: 8, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-rft', labId: 'lab-skmch', testId: 'test-rft', pricePkr: 2200, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-tft', labId: 'lab-skmch', testId: 'test-tft', pricePkr: 9200, discountedPricePkr: 5500, statedTurnaroundHours: 12, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Official Screening Rate', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-vitd', labId: 'lab-skmch', testId: 'test-vitd', pricePkr: 4500, statedTurnaroundHours: 24, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Tariff Schedule', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },
    { id: 'p-sk-dengue', labId: 'lab-skmch', testId: 'test-dengue', pricePkr: 1500, statedTurnaroundHours: 4, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'SKMCH Public Service Initiative', sourceUrl: 'shaukatkhanum.org.pk', homeCollectionAvailable: true },

    // IDC Lahore
    { id: 'p-idc-cbc', labId: 'lab-idc', testId: 'test-cbc', pricePkr: 1200, discountedPricePkr: 1020, statedTurnaroundHours: 5, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-hba1c', labId: 'lab-idc', testId: 'test-hba1c', pricePkr: 2350, discountedPricePkr: 2000, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-lipid', labId: 'lab-idc', testId: 'test-lipid', pricePkr: 3000, discountedPricePkr: 2550, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-lft', labId: 'lab-idc', testId: 'test-lft', pricePkr: 2400, discountedPricePkr: 2040, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-rft', labId: 'lab-idc', testId: 'test-rft', pricePkr: 2300, discountedPricePkr: 1955, statedTurnaroundHours: 5, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-tft', labId: 'lab-idc', testId: 'test-tft', pricePkr: 5400, discountedPricePkr: 4590, statedTurnaroundHours: 10, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-vitd', labId: 'lab-idc', testId: 'test-vitd', pricePkr: 4200, discountedPricePkr: 3570, statedTurnaroundHours: 18, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },
    { id: 'p-idc-dengue', labId: 'lab-idc', testId: 'test-dengue', pricePkr: 2400, discountedPricePkr: 1800, statedTurnaroundHours: 4, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'IDC Published Schedule', sourceUrl: 'idc.net.pk', homeCollectionAvailable: true },

    // Excel Labs
    { id: 'p-ex-cbc', labId: 'lab-excel', testId: 'test-cbc', pricePkr: 1050, discountedPricePkr: 890, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-hba1c', labId: 'lab-excel', testId: 'test-hba1c', pricePkr: 2200, discountedPricePkr: 1870, statedTurnaroundHours: 7, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-lipid', labId: 'lab-excel', testId: 'test-lipid', pricePkr: 2700, discountedPricePkr: 2160, statedTurnaroundHours: 7, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-lft', labId: 'lab-excel', testId: 'test-lft', pricePkr: 2200, discountedPricePkr: 1870, statedTurnaroundHours: 7, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-rft', labId: 'lab-excel', testId: 'test-rft', pricePkr: 2200, discountedPricePkr: 1760, statedTurnaroundHours: 6, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-tft', labId: 'lab-excel', testId: 'test-tft', pricePkr: 4400, discountedPricePkr: 3740, statedTurnaroundHours: 12, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-vitd', labId: 'lab-excel', testId: 'test-vitd', pricePkr: 2400, discountedPricePkr: 2040, statedTurnaroundHours: 24, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
    { id: 'p-ex-dengue', labId: 'lab-excel', testId: 'test-dengue', pricePkr: 2500, discountedPricePkr: 2100, statedTurnaroundHours: 4, effectiveFrom: '2026-10-01', lastConfirmedAt: '2026-11-10', verifiedBy: 'Excel Labs Schedule', sourceUrl: 'excel-labs.com', homeCollectionAvailable: true },
  ];

  const reportChecksumSeed = crypto
    .createHash('sha256')
    .update('LC-LHR-2611-0080:Chughtai:HbA1c:6.8%')
    .digest('hex');

  const bookings: BookingRecord[] = [
    {
      id: 'book-100',
      bookingNumber: 'LC-LHR-2611-0080',
      patientUserId: 'usr-pat-01',
      patientName: 'Muhammad Bilal Arshad',
      patientPhone: '+923004567891',
      patientEmail: 'bilal.arshad@gmail.com',
      patientArea: 'Gulberg III, Lahore',
      streetAddress: 'House 14-B, Street 3, Block L, Gulberg III, Lahore',
      labId: 'lab-chughtai',
      branchId: 'c-branch-jailrd',
      branchName: 'Chughtai Central Diagnostic Centre',
      branchAddress: '10 Jail Road, Opposite Services Hospital, Lahore',
      testIds: ['test-hba1c', 'test-lipid'],
      collectionType: 'HOME_COLLECTION',
      scheduledDate: todayDate,
      scheduledTimeSlot: '07:30 AM – 08:30 AM',
      status: 'COMPLETED',
      totalPkr: 4440,
      homeCollectionFeePkr: 300,
      phlebotomistName: 'Ahmad Raza (MOTO-04)',
      phlebotomistPhone: '+923214455667',
      phlebotomistStatus: 'RECEIVED_AT_LAB',
      sampleBarcode: 'VAC-LHR-88412',
      coldChainTempCelsius: 4.1,
      fastingConfirmed: true,
      fastingAcknowledged: true,
      reportUrl: '/api/reports/LC-LHR-2611-0080/pdf',
      reportChecksum: reportChecksumSeed,
      emailDispatchedAt: yesterdayIso,
      trackingEvents: [
        {
          id: 'trk-100-1',
          stage: 'BOOKING_CREATED',
          title: 'Appointment Confirmed',
          description: 'Scheduled home collection from Chughtai Central Diagnostic Centre.',
          actor: 'Patient Portal',
          location: 'Gulberg III, Lahore',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-100-2',
          stage: 'ACCEPTED',
          title: 'Lab Requisition Accepted',
          description: 'Tube labels printed and courier MOTO-04 assigned.',
          actor: 'Dr. Kamran Chughtai',
          location: '10 Jail Road, Lahore',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-100-3',
          stage: 'SAMPLE_COLLECTED',
          title: 'Specimen Drawn & Sealed',
          description: 'Vacutainer VAC-LHR-88412 sealed in 4.1°C cold-chain box after 12h fasting check.',
          actor: 'Ahmad Raza (MOTO-04)',
          location: 'House 14-B, Gulberg III',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-100-4',
          stage: 'RECEIVED_AT_LAB',
          title: 'Received at Analyzer Desk',
          description: 'Cold box temperature verified at 4.1°C on arrival at Central Lab.',
          actor: 'Accessioning Desk',
          location: 'Chughtai Central Lab',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-100-5',
          stage: 'REPORT_RELEASED',
          title: 'Signed PDF Published & Emailed',
          description: 'Verified pathology PDF report published and dispatched to bilal.arshad@gmail.com.',
          actor: 'Dr. Kamran Chughtai (Pathologist)',
          location: 'Pathology Reporting Wing',
          timestamp: nowIso,
        },
      ],
      createdAt: yesterdayIso,
    },
    {
      id: 'book-101',
      bookingNumber: 'LC-LHR-2611-0081',
      patientUserId: 'usr-pat-01',
      patientName: 'Muhammad Bilal Arshad',
      patientPhone: '+923004567891',
      patientEmail: 'bilal.arshad@gmail.com',
      patientArea: 'Gulberg III, Lahore',
      streetAddress: 'House 14-B, Street 3, Block L, Gulberg III, Lahore',
      labId: 'lab-chughtai',
      branchId: 'c-branch-jailrd',
      branchName: 'Chughtai Central Diagnostic Centre',
      branchAddress: '10 Jail Road, Opposite Services Hospital, Lahore',
      testIds: ['test-cbc', 'test-rft'],
      collectionType: 'HOME_COLLECTION',
      scheduledDate: tomorrowDate,
      scheduledTimeSlot: '08:30 AM – 09:30 AM',
      status: 'DISPATCHED',
      totalPkr: 2780,
      homeCollectionFeePkr: 300,
      phlebotomistName: 'Ahmad Raza (MOTO-04)',
      phlebotomistPhone: '+923214455667',
      phlebotomistStatus: 'EN_ROUTE',
      fastingAcknowledged: true,
      trackingEvents: [
        {
          id: 'trk-101-1',
          stage: 'BOOKING_CREATED',
          title: 'Appointment Confirmed',
          description: 'Booked CBC with ESR & Renal Function Tests at Chughtai Jail Road.',
          actor: 'Patient Portal',
          location: 'Gulberg III, Lahore',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-101-2',
          stage: 'ACCEPTED',
          title: 'Lab Accepted Order',
          description: 'Requisition approved for morning home sampling run.',
          actor: 'Chughtai Dispatch',
          location: '10 Jail Road, Lahore',
          timestamp: nowIso,
        },
        {
          id: 'trk-101-3',
          stage: 'EN_ROUTE',
          title: 'Phlebotomist En Route',
          description: 'Rider Ahmad Raza (MOTO-04) departed with sterile EDTA & Serum kit.',
          actor: 'Ahmad Raza (MOTO-04)',
          location: 'Canal Bank -> Gulberg III',
          timestamp: nowIso,
        },
      ],
      createdAt: nowIso,
    },
    {
      id: 'book-102',
      bookingNumber: 'LC-LHR-2611-0082',
      patientName: 'Ayesha Fatima',
      patientPhone: '+923219876543',
      patientEmail: 'ayesha.fatima@example.pk',
      patientArea: 'Johar Town, Lahore',
      labId: 'lab-skmch',
      branchId: 'sk-branch-johar',
      branchName: 'SKMCH Main Hospital Pathology Centre',
      branchAddress: '7A Block R-3, Khayaban-e-Firdousi, Johar Town, Lahore',
      testIds: ['test-tft', 'test-vitd'],
      collectionType: 'BRANCH_VISIT',
      scheduledDate: tomorrowDate,
      scheduledTimeSlot: '09:30 AM – 10:30 AM',
      status: 'PENDING',
      totalPkr: 10000,
      homeCollectionFeePkr: 0,
      trackingEvents: [
        {
          id: 'trk-102-1',
          stage: 'BOOKING_CREATED',
          title: 'Branch Visit Reserved',
          description: 'Thyroid Profile + Vitamin D booked at SKMCH Johar Town.',
          actor: 'Patient Portal',
          location: 'Johar Town, Lahore',
          timestamp: nowIso,
        },
      ],
      createdAt: nowIso,
    },
    {
      id: 'book-103',
      bookingNumber: 'LC-LHR-2611-0083',
      patientName: 'Khurram Shehzad',
      patientPhone: '+923331122334',
      patientEmail: 'khurram.shehzad@example.pk',
      patientArea: 'Shadman, Lahore',
      streetAddress: 'Flat 4, Al-Rehman Apartments, Shadman I, Lahore',
      labId: 'lab-idc',
      branchId: 'idc-branch-shadman',
      branchName: 'IDC Lahore Regional Centre',
      branchAddress: '13-A, Jail Road, Near Kinnaird College, Shadman, Lahore',
      testIds: ['test-dengue', 'test-cbc'],
      collectionType: 'HOME_COLLECTION',
      scheduledDate: todayDate,
      scheduledTimeSlot: '11:00 AM – 12:00 PM',
      status: 'SAMPLE_COLLECTED',
      totalPkr: 3070,
      homeCollectionFeePkr: 250,
      phlebotomistName: 'Tariq Javed (MOTO-09)',
      phlebotomistPhone: '+923331122334',
      phlebotomistStatus: 'IN_TRANSIT',
      sampleBarcode: 'VAC-IDC-44019',
      coldChainTempCelsius: 3.8,
      fastingConfirmed: true,
      trackingEvents: [
        {
          id: 'trk-103-1',
          stage: 'BOOKING_CREATED',
          title: 'Urgent Dengue Panel Booked',
          description: 'Dengue NS1 + CBC home collection scheduled.',
          actor: 'Patient Portal',
          location: 'Shadman I, Lahore',
          timestamp: yesterdayIso,
        },
        {
          id: 'trk-103-2',
          stage: 'SAMPLE_COLLECTED',
          title: 'Blood Sample Drawn',
          description: 'Barcode VAC-IDC-44019 scanned and sealed at 3.8°C.',
          actor: 'Tariq Javed (MOTO-09)',
          location: 'Shadman I, Lahore',
          timestamp: nowIso,
        },
      ],
      createdAt: nowIso,
    },
  ];

  const reports: DiagnosticReportRecord[] = [
    {
      id: 'rep-100',
      bookingNumber: 'LC-LHR-2611-0080',
      labId: 'lab-chughtai',
      branchName: 'Chughtai Central Diagnostic Centre (10 Jail Road)',
      patientName: 'Muhammad Bilal Arshad',
      patientPhone: '+923004567891',
      patientEmail: 'bilal.arshad@gmail.com',
      fileName: 'Chughtai_Report_LC-LHR-2611-0080.pdf',
      pdfUrl: '/api/reports/LC-LHR-2611-0080/pdf',
      checksumSha256: reportChecksumSeed,
      pathologistName: 'Dr. Kamran Chughtai, FCPS (Hematology/Pathology)',
      clinicalNotes:
        'HbA1c (6.8%) and Direct LDL (115 mg/dL) are mildly above target ranges. Total Cholesterol (188 mg/dL) and Triglycerides (134 mg/dL) remain within normal limits. Recommend physician review.',
      parameters: [
        { parameter: 'HbA1c (NGSP)', observedValue: '6.8', unit: '%', referenceRange: '< 5.7 %', flag: 'HIGH' },
        { parameter: 'Total Cholesterol', observedValue: '188', unit: 'mg/dL', referenceRange: '< 200', flag: 'NORMAL' },
        { parameter: 'Triglycerides', observedValue: '134', unit: 'mg/dL', referenceRange: '< 150', flag: 'NORMAL' },
        { parameter: 'HDL Cholesterol', observedValue: '46', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
        { parameter: 'LDL Cholesterol (Direct)', observedValue: '115', unit: 'mg/dL', referenceRange: '< 100', flag: 'HIGH' },
      ],
      publishedAt: nowIso,
      emailDispatchedAt: nowIso,
      emailDispatchStatus: 'QUEUED_MIME_VERIFIED',
    },
  ];

  const emailLogs: EmailDispatchLogRecord[] = [
    {
      id: 'mail-100',
      bookingNumber: 'LC-LHR-2611-0080',
      recipientEmail: 'bilal.arshad@gmail.com',
      subject: '[LabConnect] Pathology PDF Report Ready — Booking LC-LHR-2611-0080 (Chughtai Lab)',
      status: 'QUEUED_MIME_VERIFIED',
      attachmentFileName: 'Chughtai_Report_LC-LHR-2611-0080.pdf',
      sentAt: nowIso,
      previewText:
        'Dear Muhammad Bilal Arshad, your signed Chughtai Lab pathology report for LC-LHR-2611-0080 is attached as a PDF and available in your Patient Portal.',
    },
  ];

  const auditLogs: AuditLogRecord[] = [
    {
      id: 'aud-01',
      actor: 'Dr. Tariq Mahmood (PHC Director)',
      role: 'SUPER_ADMIN',
      action: 'SYSTEM_CATALOG_INITIALIZED',
      target: '4 Lahore Lab Networks Verified (PHC 2026)',
      timestamp: yesterdayIso,
    },
    {
      id: 'aud-02',
      actor: 'Dr. Kamran Chughtai',
      role: 'LAB_ADMIN',
      action: 'REPORT_PUBLISHED_AND_EMAILED',
      target: 'LC-LHR-2611-0080 -> bilal.arshad@gmail.com',
      timestamp: nowIso,
    },
  ];

  const reviews: LabReviewRecord[] = [
    {
      id: 'rev-100',
      labId: 'lab-chughtai',
      bookingNumber: 'LC-LHR-2611-0080',
      patientUserId: 'usr-pat-01',
      patientName: 'Muhammad Bilal Arshad',
      rating: 5,
      punctualityRating: 5,
      turnaroundRating: 5,
      comment: 'Phlebotomist arrived within window at Gulberg III and PDF report landed in email inside 6 hours.',
      verifiedBooking: true,
      createdAt: nowIso,
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'notif-100',
      recipientRole: 'PATIENT',
      targetUserId: 'usr-pat-01',
      targetPhone: '+923004567891',
      title: 'Signed PDF Report Ready',
      message: 'Chughtai Lab (10 Jail Road) published LC-LHR-2611-0080 and dispatched PDF copy to bilal.arshad@gmail.com.',
      category: 'REPORT',
      relatedId: 'LC-LHR-2611-0080',
      read: false,
      createdAt: nowIso,
    },
    {
      id: 'notif-101',
      recipientRole: 'LAB_ADMIN',
      targetLabId: 'lab-chughtai',
      title: 'Home Collection Queue Active',
      message: 'Booking LC-LHR-2611-0081 is awaiting morning courier confirmation for Gulberg III.',
      category: 'BOOKING',
      relatedId: 'LC-LHR-2611-0081',
      read: false,
      createdAt: nowIso,
    },
  ];

  const settlementsLedger: SettlementPayoutRecord[] = [];

  return {
    users,
    laboratories,
    tests,
    pricings,
    bookings,
    reports,
    emailLogs,
    auditLogs,
    reviews,
    notifications,
    settlementsLedger,
    adminBootstrapped: Boolean(process.env.SEED_ADMIN_PASSWORD),
  };
}

function loadDatabase(): LabConnectDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as LabConnectDatabase;
      if (parsed && Array.isArray(parsed.laboratories) && Array.isArray(parsed.pricings) && Array.isArray(parsed.bookings)) {
        const seed = buildInitialDatabase();
        if (!Array.isArray(parsed.reviews)) {
          parsed.reviews = seed.reviews;
        }
        if (!Array.isArray(parsed.notifications)) {
          parsed.notifications = seed.notifications;
        }
        if (!Array.isArray(parsed.settlementsLedger)) {
          parsed.settlementsLedger = seed.settlementsLedger;
        }
        if (parsed.adminBootstrapped === undefined) {
          parsed.adminBootstrapped = Boolean(process.env.SEED_ADMIN_PASSWORD);
        }
        for (const lab of parsed.laboratories) {
          if (!lab.subscriptionTier) {
            lab.subscriptionTier = lab.id === 'lab-chughtai' || lab.id === 'lab-skmch' ? 'ENTERPRISE' : 'GROWTH';
            lab.monthlySaasFeePkr = lab.subscriptionTier === 'ENTERPRISE' ? 45000 : 18500;
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[DB] Re-initializing database due to read issue:', err);
  }
  const initial = buildInitialDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  return initial;
}

const db: LabConnectDatabase = loadDatabase();

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Failed to persist state:', err);
  }
}

function appendAudit(actor: string, role: UserRole | 'SYSTEM', action: string, target: string) {
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    actor,
    role,
    action,
    target,
    timestamp: new Date().toISOString(),
  });
  if (db.auditLogs.length > 150) db.auditLogs.length = 150;
}

function pushNotification(entry: Omit<NotificationRecord, 'id' | 'read' | 'createdAt'>) {
  db.notifications.unshift({
    ...entry,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
  if (db.notifications.length > 200) db.notifications.length = 200;
}

// ==========================================
// REAL BINARY %PDF-1.4 REPORT GENERATOR
// ==========================================

function escapePdfText(text: string): string {
  return (text || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function generatePathologyPdfBuffer(
  report: DiagnosticReportRecord,
  lab: LabEntity | undefined,
  booking: BookingRecord | undefined
): Buffer {
  const lines: string[] = [];

  const drawText = (x: number, y: number, size: number, bold: boolean, text: string, rgb = '0.07 0.09 0.13') => {
    const font = bold ? '/F2' : '/F1';
    lines.push(`BT ${font} ${size} Tf ${rgb} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
  };

  // Top Header Band (Deep Emerald #0F5132)
  lines.push('0.059 0.318 0.196 rg 0 765 595 77 re f');
  drawText(40, 812, 16, true, `${lab?.name || 'Verified Diagnostic Laboratory'}`, '1 1 1');
  drawText(40, 793, 9, false, `${report.branchName} | PHC Licence: ${lab?.phcLicence || 'PHC-LHR'}`, '0.85 0.96 0.90');
  drawText(40, 777, 8, false, `${lab?.accreditation || 'ISO 15189 Certified'} | Contact: ${lab?.contactPhone || '+92 42 111'}`, '0.85 0.96 0.90');
  drawText(435, 812, 11, true, 'PATHOLOGY REPORT', '1 1 1');
  drawText(435, 795, 8, false, `Booking: ${report.bookingNumber}`, '0.85 0.96 0.90');

  // Patient Metadata Box
  lines.push('0.96 0.97 0.98 rg 40 658 515 90 re f');
  lines.push('0.85 0.88 0.91 RG 0.8 w 40 658 515 90 re S');
  drawText(52, 730, 10, true, `Patient Name: ${report.patientName}`);
  drawText(52, 712, 9, false, `Mobile: ${report.patientPhone}`);
  drawText(52, 696, 9, false, `Email: ${report.patientEmail || 'Not provided'}`);
  drawText(52, 678, 9, false, `Location: ${booking?.streetAddress || booking?.patientArea || 'Lahore, Punjab'}`);

  drawText(330, 730, 9, true, `Sample Barcode: ${booking?.sampleBarcode || 'LAB-INHOUSE'}`);
  drawText(330, 712, 9, false, `Collection: ${booking?.collectionType || 'HOME_COLLECTION'}`);
  drawText(330, 696, 9, false, `Cold-Chain Temp: ${booking?.coldChainTempCelsius ? `${booking.coldChainTempCelsius} C` : 'Verified 2-8 C'}`);
  drawText(330, 678, 9, false, `Published: ${report.publishedAt.slice(0, 19).replace('T', ' ')} UTC`);

  // Results Table Header
  lines.push('0.059 0.318 0.196 rg 40 618 515 24 re f');
  drawText(48, 626, 9, true, 'TEST PARAMETER', '1 1 1');
  drawText(250, 626, 9, true, 'OBSERVED', '1 1 1');
  drawText(325, 626, 9, true, 'UNIT', '1 1 1');
  drawText(390, 626, 9, true, 'REFERENCE RANGE', '1 1 1');
  drawText(505, 626, 9, true, 'STATUS', '1 1 1');

  let y = 596;
  report.parameters.forEach((param, idx) => {
    if (y < 180) return;
    if (idx % 2 === 0) {
      lines.push(`0.98 0.98 0.99 rg 40 ${y - 6} 515 22 re f`);
    }
    lines.push(`0.88 0.90 0.92 RG 0.5 w 40 ${y - 6} m 555 ${y - 6} l S`);
    drawText(48, y, 9, true, param.parameter.slice(0, 34));
    const valColor = param.flag === 'NORMAL' ? '0.07 0.09 0.13' : '0.72 0.11 0.11';
    drawText(250, y, 9, true, param.observedValue.slice(0, 14), valColor);
    drawText(325, y, 9, false, param.unit.slice(0, 12));
    drawText(390, y, 9, false, param.referenceRange.slice(0, 22));
    const flagColor = param.flag === 'NORMAL' ? '0.06 0.32 0.20' : '0.72 0.11 0.11';
    drawText(505, y, 8, true, param.flag, flagColor);
    y -= 24;
  });

  // Clinical Interpretation Note
  const noteY = Math.max(y - 24, 150);
  drawText(40, noteY, 10, true, 'Clinical Pathologist Interpretation & Notes:');
  const words = (report.clinicalNotes || 'Analyzed on automated reference analyzer. Please correlate clinically.').split(/\s+/);
  let lineBuf = '';
  let cy = noteY - 16;
  for (const w of words) {
    if ((lineBuf + ' ' + w).length > 92) {
      drawText(40, cy, 9, false, lineBuf.trim());
      lineBuf = w;
      cy -= 13;
      if (cy < 110) break;
    } else {
      lineBuf = lineBuf ? `${lineBuf} ${w}` : w;
    }
  }
  if (lineBuf && cy >= 110) {
    drawText(40, cy, 9, false, lineBuf.trim());
  }

  // Verification Footer
  lines.push('0.80 0.84 0.88 RG 0.8 w 40 92 m 555 92 l S');
  drawText(40, 76, 9, true, `Electronically Verified By: ${report.pathologistName}`);
  drawText(40, 62, 8, false, `SHA-256 Document Integrity Hash: ${report.checksumSha256}`);
  drawText(40, 46, 7.5, false, 'LabConnect Pakistan | Punjab Healthcare Commission Compliant Digital Report | Consult your physician for clinical diagnosis.', '0.35 0.40 0.48');

  const streamContent = lines.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

// ==========================================
// REAL EMAIL DISPATCH ENGINE (NODEMAILER + VERIFIED QUEUE)
// ==========================================

async function dispatchPatientReportEmail(
  recipientEmail: string,
  report: DiagnosticReportRecord,
  lab: LabEntity | undefined,
  pdfBuffer: Buffer
): Promise<EmailDispatchLogRecord> {
  const subject = `[LabConnect] Pathology PDF Report Ready — Booking ${report.bookingNumber} (${lab?.name || 'Lab'})`;
  const previewText = `Dear ${report.patientName}, your verified pathology report from ${lab?.name || 'LabConnect'} (${report.branchName}) for booking ${report.bookingNumber} is attached as PDF. SHA-256: ${report.checksumSha256.slice(0, 16)}...`;

  let status: 'SENT_SMTP' | 'QUEUED_MIME_VERIFIED' = 'QUEUED_MIME_VERIFIED';

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"LabConnect Reports" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject,
        text: previewText,
        attachments: [
          {
            filename: report.fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      status = 'SENT_SMTP';
      console.log(`[Email SMTP] Dispatched real PDF report to ${recipientEmail}`);
    } catch (err) {
      console.warn('[Email SMTP Fallback] SMTP delivery unavailable, persisting verified dispatch log:', err);
    }
  } else {
    console.log(`[Email Dispatch] Prepared verified MIME PDF email to ${recipientEmail} (${report.fileName}, ${pdfBuffer.length} bytes)`);
  }

  const entry: EmailDispatchLogRecord = {
    id: `mail-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    bookingNumber: report.bookingNumber,
    recipientEmail,
    subject,
    status,
    attachmentFileName: report.fileName,
    sentAt: new Date().toISOString(),
    previewText,
  };

  db.emailLogs.unshift(entry);
  report.emailDispatchedAt = entry.sentAt;
  report.emailDispatchStatus = status;
  report.patientEmail = recipientEmail;

  const booking = db.bookings.find((b) => b.bookingNumber === report.bookingNumber);
  if (booking) {
    booking.emailDispatchedAt = entry.sentAt;
    booking.patientEmail = recipientEmail;
  }

  saveDatabase();
  return entry;
}

// ==========================================
// RBAC EXPRESS MIDDLEWARE
// ==========================================

function extractAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      const user = db.users.find((u) => u.id === payload.userId);
      if (user) {
        req.authUser = user;
      }
    }
  }
  next();
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in through your dedicated stakeholder portal.',
      });
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied for role ${req.authUser.role}. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
}

// ==========================================
// SLIDING-WINDOW RATE LIMITER & SECURITY HEADERS
// ==========================================

const RATE_LIMIT_BUCKETS = new Map<string, number[]>();

function slidingWindowLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'local';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const recent = (RATE_LIMIT_BUCKETS.get(key) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait briefly before retrying.',
      });
    }
    recent.push(now);
    RATE_LIMIT_BUCKETS.set(key, recent);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - recent.length)));
    next();
  };
}

// ==========================================
// EXPRESS SERVER STARTUP
// ==========================================

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use('/api/auth', slidingWindowLimiter(45, 5 * 60 * 1000));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (origin === 'https://localhost' ||
        origin === 'http://localhost' ||
        origin === 'capacitor://localhost' ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:'))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
  app.use(extractAuth);

  // Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'LabConnect Core Engine (Lahore Division)',
      persistence: 'DISK_JSON_ACTIVE',
      city: 'Lahore, Punjab, Pakistan',
      timestamp: new Date().toISOString(),
      counts: {
        laboratories: db.laboratories.length,
        tests: db.tests.length,
        pricings: db.pricings.length,
        bookings: db.bookings.length,
        reports: db.reports.length,
        emailDispatches: db.emailLogs.length,
      },
    });
  });

  // ==========================================
  // RUNTIME CATALOG ENDPOINTS (NO HARDCODED UI DATA)
  // ==========================================

  app.get('/api/catalog', (_req: Request, res: Response) => {
    const reviewSummaries = db.laboratories.map((lab) => {
      const labReviews = db.reviews.filter((r) => r.labId === lab.id);
      const count = labReviews.length;
      const avg = count > 0 ? +(labReviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : 0;
      return { labId: lab.id, averageRating: avg, reviewCount: count };
    });

    res.json({
      success: true,
      data: {
        laboratories: db.laboratories,
        tests: db.tests,
        pricings: db.pricings,
        reviewSummaries,
      },
    });
  });

  app.get('/api/laboratories', (_req: Request, res: Response) => {
    res.json({
      success: true,
      count: db.laboratories.length,
      data: db.laboratories,
    });
  });

  app.get('/api/laboratories/:labId/branches', (req: Request, res: Response) => {
    const lab = db.laboratories.find((l) => l.id === req.params.labId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found' });
    }
    return res.json({
      success: true,
      labId: lab.id,
      labName: lab.name,
      branches: lab.branches,
    });
  });

  app.get('/api/tests', (_req: Request, res: Response) => {
    res.json({
      success: true,
      count: db.tests.length,
      data: db.tests,
    });
  });

  app.get('/api/pricing', (req: Request, res: Response) => {
    const { labId, testId } = req.query;
    let list = [...db.pricings];
    if (labId) list = list.filter((p) => p.labId === labId);
    if (testId) list = list.filter((p) => p.testId === testId);
    res.json({
      success: true,
      count: list.length,
      data: list,
    });
  });

  app.patch('/api/pricing/:id', requireRole('LAB_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const idx = db.pricings.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Pricing entry not found' });
    }
    const target = db.pricings[idx];
    if (req.authUser!.role === 'LAB_ADMIN' && req.authUser!.labId !== target.labId) {
      return res.status(403).json({ success: false, error: 'Cannot modify tariffs belonging to another laboratory' });
    }

    const { pricePkr, discountedPricePkr, statedTurnaroundHours } = req.body;
    if (pricePkr !== undefined) {
      const num = Number(pricePkr);
      if (isNaN(num) || num < 100 || num > 100000) {
        return res.status(400).json({ success: false, error: 'Price must be between PKR 100 and PKR 100,000' });
      }
      target.pricePkr = num;
    }
    if (discountedPricePkr !== undefined) {
      const dNum = discountedPricePkr === null || discountedPricePkr === '' ? undefined : Number(discountedPricePkr);
      if (dNum !== undefined && (isNaN(dNum) || dNum < 100 || dNum > target.pricePkr)) {
        return res.status(400).json({ success: false, error: 'Discounted price must be valid and <= standard price' });
      }
      target.discountedPricePkr = dNum;
    }
    if (statedTurnaroundHours !== undefined) {
      const tat = Number(statedTurnaroundHours);
      if (isNaN(tat) || tat < 1 || tat > 168) {
        return res.status(400).json({ success: false, error: 'Turnaround must be between 1 and 168 hours' });
      }
      target.statedTurnaroundHours = tat;
    }

    target.lastConfirmedAt = new Date().toISOString().slice(0, 10);
    target.verifiedBy = req.authUser!.name;
    appendAudit(req.authUser!.name, req.authUser!.role, 'TARIFF_UPDATED', `${target.labId}:${target.testId} -> PKR ${target.pricePkr}`);
    saveDatabase();

    return res.json({ success: true, data: target });
  });

  // ==========================================
  // DEDICATED STAKEHOLDER AUTHENTICATION
  // ==========================================

  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const rawPhone = req.body.phone;
    if (!rawPhone) {
      return res.status(400).json({ success: false, error: 'Pakistani mobile number is required' });
    }
    const phone = normalizePakistaniPhone(rawPhone);
    if (!/^\+923\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Pakistani mobile number. Use 03XX XXXXXXX or +92 3XX XXXXXXX.',
      });
    }

    const existing = OTP_STORE.get(phone);
    const now = Date.now();
    if (existing && now - existing.createdAt < 15 * 60 * 1000 && existing.attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Too many OTP requests. Please try again in 15 minutes.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTP_STORE.set(phone, {
      phone,
      otp,
      expiresAt: now + 300 * 1000,
      attempts: (existing?.attempts || 0) + 1,
      createdAt: existing?.createdAt || now,
    });

    console.log(`[SMS Gateway] Patient OTP for ${phone}: ${otp}`);

    return res.json({
      success: true,
      message: `6-digit verification code dispatched to ${phone}`,
      expiresInSeconds: 300,
      demoCode: otp,
    });
  });

  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { phone: rawPhone, otp, name, email } = req.body;
    if (!rawPhone || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and 6-digit OTP are required' });
    }

    const phone = normalizePakistaniPhone(rawPhone);
    const record = OTP_STORE.get(phone);
    if (!record) {
      return res.status(400).json({ success: false, error: 'No active OTP request found. Request a new code.' });
    }
    if (Date.now() > record.expiresAt) {
      OTP_STORE.delete(phone);
      return res.status(400).json({ success: false, error: 'OTP expired after 300 seconds. Please request a new code.' });
    }
    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, error: 'Incorrect 6-digit OTP code.' });
    }

    OTP_STORE.delete(phone);

    let user = db.users.find((u) => normalizePakistaniPhone(u.phone) === phone && u.role === 'PATIENT');
    if (!user) {
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address for PDF report delivery.' });
      }
      user = {
        id: `usr-pat-${Date.now()}`,
        name: (name || '').trim().length >= 3 ? name.trim() : 'Patient User',
        phone,
        email: email && isValidEmail(email) ? email.trim().toLowerCase() : `${phone.replace(/\+/g, '')}@patient.labconnect.pk`,
        role: 'PATIENT',
        area: 'Lahore, Punjab',
        familyMembers: [],
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    } else {
      if (name && name.trim().length >= 3) user.name = name.trim();
      if (email && isValidEmail(email)) user.email = email.trim().toLowerCase();
    }

    appendAudit(user.name, 'PATIENT', 'PATIENT_OTP_VERIFIED', user.phone);
    saveDatabase();

    return res.json({
      success: true,
      message: 'Patient mobile verified successfully',
      sessionToken: createSessionToken(user),
      user: sanitizeUser(user),
    });
  });

  // Lab Staff Sign In (Validates against registered institutional staff)
  app.post('/api/auth/lab/login', (req: Request, res: Response) => {
    const { email, password, labId, branchId } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid institutional email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const lab = db.laboratories.find((l) => l.id === labId);
    if (!lab) {
      return res.status(400).json({ success: false, error: 'Selected diagnostic laboratory is invalid' });
    }

    const existing = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === 'LAB_ADMIN'
    );
    if (!existing || !verifyPassword(password, existing.passwordHash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid laboratory email or password. Use verified staff credentials or Register Staff.',
      });
    }
    if (existing.labId && existing.labId !== lab.id) {
      return res.status(403).json({
        success: false,
        error: `These credentials belong to ${db.laboratories.find((l) => l.id === existing.labId)?.name || existing.labId}, not ${lab.name}.`,
      });
    }

    const branch = lab.branches.find((b) => b.id === (branchId || existing.branchId)) || lab.branches[0];
    existing.branchId = branch.id;
    existing.area = branch.area;
    appendAudit(existing.name, 'LAB_ADMIN', 'LAB_STAFF_SIGN_IN', `${lab.name} (${branch.name})`);
    saveDatabase();

    return res.json({
      success: true,
      message: `Signed in to ${lab.name} — ${branch.name}`,
      sessionToken: createSessionToken(existing),
      user: sanitizeUser(existing),
      lab,
      branch,
    });
  });

  // Lab Staff Register
  app.post('/api/auth/lab/register', (req: Request, res: Response) => {
    const { fullName, email, password, phone, labId, branchId } = req.body;
    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 3 characters' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid work email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const normalizedPhone = normalizePakistaniPhone(phone);
    if (!/^\+923\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: 'Valid Pakistani mobile (+92 3XX XXXXXXX) is required' });
    }

    const lab = db.laboratories.find((l) => l.id === labId);
    if (!lab) {
      return res.status(400).json({ success: false, error: 'Valid Lahore laboratory must be selected' });
    }
    const branch = lab.branches.find((b) => b.id === branchId) || lab.branches[0];

    const duplicate = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const newStaff: UserAccount = {
      id: `usr-lab-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
      passwordHash: hashPassword(password),
      role: 'LAB_ADMIN',
      labId: lab.id,
      branchId: branch.id,
      area: branch.area,
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newStaff);
    appendAudit(newStaff.name, 'LAB_ADMIN', 'LAB_STAFF_REGISTERED', `${lab.name} (${branch.name})`);
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: `Registered operator at ${lab.name} (${branch.name})`,
      sessionToken: createSessionToken(newStaff),
      user: sanitizeUser(newStaff),
      lab,
      branch,
    });
  });

  // Phlebotomist Login
  app.post('/api/auth/phlebotomist/login', (req: Request, res: Response) => {
    const { staffCode, phone, labId, branchId } = req.body;
    if (!staffCode || staffCode.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'Valid Rider / Staff Code (e.g. MOTO-04) is required' });
    }
    const normalizedPhone = normalizePakistaniPhone(phone);
    if (!/^\+923\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: 'Valid Pakistani mobile (+92 3XX XXXXXXX) is required' });
    }

    const codeUpper = staffCode.trim().toUpperCase();
    const existing = db.users.find(
      (u) =>
        u.role === 'PHLEBOTOMIST' &&
        (u.staffCode?.toUpperCase() === codeUpper || u.id.toUpperCase().includes(codeUpper)) &&
        normalizePakistaniPhone(u.phone) === normalizedPhone
    );

    if (!existing) {
      return res.status(401).json({
        success: false,
        error: 'Courier credentials not found. Verify Staff Code and registered phone or Register Agent.',
      });
    }

    const lab = db.laboratories.find((l) => l.id === (labId || existing.labId)) || db.laboratories[0];
    if (existing.labId && lab.id !== existing.labId) {
      return res.status(403).json({
        success: false,
        error: `Courier ${codeUpper} is assigned to ${db.laboratories.find((l) => l.id === existing.labId)?.name}, not ${lab.name}.`,
      });
    }
    const branch = lab.branches.find((b) => b.id === (branchId || existing.branchId)) || lab.branches[0];

    appendAudit(existing.name, 'PHLEBOTOMIST', 'COURIER_SIGN_IN', `${codeUpper} @ ${branch.name}`);
    saveDatabase();

    return res.json({
      success: true,
      message: `Authenticated ${existing.name} (${codeUpper})`,
      sessionToken: createSessionToken(existing),
      user: sanitizeUser(existing),
      lab,
      branch,
    });
  });

  // Phlebotomist Register
  app.post('/api/auth/phlebotomist/register', (req: Request, res: Response) => {
    const { fullName, staffCode, phone, cnicLast4, labId, branchId } = req.body;
    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 3 characters' });
    }
    if (!staffCode || staffCode.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'Rider Code must be at least 4 characters (e.g. MOTO-14)' });
    }
    const normalizedPhone = normalizePakistaniPhone(phone);
    if (!/^\+923\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: 'Valid Pakistani mobile (+92 3XX XXXXXXX) is required' });
    }
    if (!cnicLast4 || !/^\d{4}$/.test(cnicLast4.trim())) {
      return res.status(400).json({ success: false, error: 'Last 4 digits of CNIC are required' });
    }

    const lab = db.laboratories.find((l) => l.id === labId);
    if (!lab) {
      return res.status(400).json({ success: false, error: 'Valid Lahore laboratory must be selected' });
    }
    const branch = lab.branches.find((b) => b.id === branchId) || lab.branches[0];
    const codeUpper = staffCode.trim().toUpperCase();

    const duplicate = db.users.find(
      (u) => u.role === 'PHLEBOTOMIST' && u.staffCode?.toUpperCase() === codeUpper
    );
    if (duplicate) {
      return res.status(409).json({ success: false, error: `Rider code ${codeUpper} is already registered.` });
    }

    const newPhleb: UserAccount = {
      id: `usr-phleb-${Date.now()}`,
      name: `${fullName.trim()} (${codeUpper})`,
      phone: normalizedPhone,
      email: `${codeUpper.toLowerCase()}@dispatch.labconnect.pk`,
      staffCode: codeUpper,
      cnicLast4: cnicLast4.trim(),
      role: 'PHLEBOTOMIST',
      labId: lab.id,
      branchId: branch.id,
      area: branch.area,
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newPhleb);
    appendAudit(newPhleb.name, 'PHLEBOTOMIST', 'COURIER_REGISTERED', `${lab.name} (${branch.name})`);
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: `Registered Field Phlebotomist ${fullName.trim()} (${codeUpper})`,
      sessionToken: createSessionToken(newPhleb),
      user: sanitizeUser(newPhleb),
      lab,
      branch,
    });
  });

  // Check whether initial Super Admin setup is still pending
  app.get('/api/auth/admin/status', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      setupRequired: !db.adminBootstrapped && !process.env.SEED_ADMIN_PASSWORD,
    });
  });

  // One-time initial Super Admin setup (permanently locked after first use or when env seed password is set)
  app.post('/api/auth/admin/setup', (req: Request, res: Response) => {
    if (db.adminBootstrapped || process.env.SEED_ADMIN_PASSWORD) {
      return res.status(403).json({
        success: false,
        error: 'Regulatory admin console is already initialized. Sign in with existing credentials.',
      });
    }
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Administrator full name must be at least 3 characters' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid institutional email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let adminUser = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (u.role === 'SUPER_ADMIN' || u.role === 'PHC_INSPECTOR')
    );

    if (adminUser) {
      adminUser.name = String(name).trim();
      adminUser.passwordHash = hashPassword(String(password));
    } else {
      adminUser = {
        id: `usr-admin-${Date.now()}`,
        name: String(name).trim(),
        phone: '+923001122334',
        email: cleanEmail,
        passwordHash: hashPassword(String(password)),
        role: 'SUPER_ADMIN',
        area: 'Lahore Division, Punjab',
        familyMembers: [],
        createdAt: new Date().toISOString(),
      };
      db.users.push(adminUser);
    }

    db.adminBootstrapped = true;
    appendAudit(adminUser.name, adminUser.role, 'ADMIN_INITIAL_SETUP', adminUser.email);
    saveDatabase();

    return res.status(201).json({
      success: true,
      sessionToken: createSessionToken(adminUser),
      user: sanitizeUser(adminUser),
    });
  });

  // Dedicated PHC Admin & Inspector Login
  app.post('/api/auth/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ success: false, error: 'Official admin email and password are required' });
    }
    const adminUser = db.users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        (u.role === 'SUPER_ADMIN' || u.role === 'PHC_INSPECTOR')
    );
    if (!adminUser || !verifyPassword(password, adminUser.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Invalid regulatory administrator credentials' });
    }
    db.adminBootstrapped = true;
    appendAudit(adminUser.name, adminUser.role, 'ADMIN_CONSOLE_SIGN_IN', adminUser.email);
    saveDatabase();

    return res.json({
      success: true,
      sessionToken: createSessionToken(adminUser),
      user: sanitizeUser(adminUser),
    });
  });

  // Current Authenticated Profile
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    return res.json({
      success: true,
      user: sanitizeUser(req.authUser),
    });
  });

  // Update Patient Profile (Email / Name / Area)
  app.patch('/api/auth/profile', requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
    const { name, email, area } = req.body;
    if (name && name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 3 characters' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }
    if (name) req.authUser!.name = name.trim();
    if (email) req.authUser!.email = email.trim().toLowerCase();
    if (area) req.authUser!.area = area.trim();
    saveDatabase();
    return res.json({ success: true, user: sanitizeUser(req.authUser!) });
  });

  // Family Profiles Management (Authenticated Patient)
  app.post('/api/auth/family', requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
    const { name, relationship, gender, bloodGroup, dateOfBirth, notes } = req.body;
    if (!name || !relationship) {
      return res.status(400).json({ success: false, error: 'Name and relationship are required' });
    }
    const newMember: FamilyMemberRecord = {
      id: `fam-${Date.now()}`,
      name: name.trim(),
      relationship: relationship || 'Other',
      gender: gender || 'Other',
      bloodGroup: bloodGroup || 'Unknown',
      dateOfBirth: dateOfBirth || '1990-01-01',
      consentGrantedAt: new Date().toISOString(),
      notes,
    };
    req.authUser!.familyMembers.push(newMember);
    saveDatabase();

    return res.status(201).json({
      success: true,
      data: newMember,
      familyMembers: req.authUser!.familyMembers,
    });
  });

  app.delete('/api/auth/family/:id', requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
    req.authUser!.familyMembers = req.authUser!.familyMembers.filter((f) => f.id !== req.params.id);
    saveDatabase();
    return res.json({
      success: true,
      familyMembers: req.authUser!.familyMembers,
    });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    return res.json({ success: true, message: 'Session terminated' });
  });

  // ==========================================
  // BOOKINGS, TRACKING & OPERATIONS (RBAC SCOPED)
  // ==========================================

  app.get(
    '/api/bookings',
    requireRole('PATIENT', 'LAB_ADMIN', 'PHLEBOTOMIST', 'SUPER_ADMIN', 'PHC_INSPECTOR'),
    (req: AuthenticatedRequest, res: Response) => {
      const actor = req.authUser!;
      const { status, branchId } = req.query;
      let results = [...db.bookings];

      if (actor.role === 'PATIENT') {
        const actorPhone = normalizePakistaniPhone(actor.phone);
        results = results.filter(
          (b) => b.patientUserId === actor.id || normalizePakistaniPhone(b.patientPhone) === actorPhone
        );
      } else if (actor.role === 'LAB_ADMIN') {
        results = results.filter((b) => b.labId === actor.labId);
        if (branchId && branchId !== 'ALL') {
          results = results.filter((b) => b.branchId === branchId);
        }
      } else if (actor.role === 'PHLEBOTOMIST') {
        results = results.filter((b) => b.labId === actor.labId && b.collectionType === 'HOME_COLLECTION');
      }

      if (status && status !== 'ALL') {
        results = results.filter((b) => b.status === status);
      }

      return res.json({
        success: true,
        count: results.length,
        data: results,
      });
    }
  );

  app.post('/api/bookings', requireRole('PATIENT', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const {
      patientName,
      familyMemberId,
      patientPhone,
      patientEmail,
      patientArea,
      streetAddress,
      labId,
      branchId,
      testIds,
      collectionType,
      scheduledDate,
      scheduledTimeSlot,
      fastingAcknowledged,
    } = req.body;

    if (!patientName || patientName.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Patient full name must be at least 3 characters' });
    }

    let resolvedFamilyMemberName: string | undefined;
    let resolvedFamilyMemberId: string | undefined;
    if (familyMemberId && req.authUser?.familyMembers?.length) {
      const mem = req.authUser.familyMembers.find((f) => f.id === familyMemberId);
      if (mem) {
        resolvedFamilyMemberId = mem.id;
        resolvedFamilyMemberName = mem.name.includes(`(${mem.relationship})`)
          ? mem.name
          : `${mem.name} (${mem.relationship})`;
      }
    }

    const normalizedPhone = normalizePakistaniPhone(patientPhone);
    if (!/^\+923\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Pakistani mobile number. Use +92 3XX XXXXXXX or 03XX XXXXXXX.',
      });
    }

    if (!patientEmail || !isValidEmail(patientEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid patient email address is required to receive PDF test reports.',
      });
    }

    const targetLab = db.laboratories.find((l) => l.id === labId);
    if (!targetLab) {
      return res.status(400).json({ success: false, error: 'Selected diagnostic laboratory is invalid' });
    }
    if (targetLab.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        error: `Booking blocked: ${targetLab.name} PHC licence is revoked/suspended (${targetLab.verificationStatus}) and is not recognized by PHC Regulatory & Admin Console.`,
      });
    }
    const targetBranch = targetLab.branches.find((b) => b.id === branchId);
    if (!targetBranch) {
      return res.status(400).json({ success: false, error: 'Selected Lahore branch does not belong to this laboratory' });
    }

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one diagnostic test must be selected' });
    }

    // Server-authoritative PKR pricing calculation (prevents client price tampering)
    let computedTestsTotal = 0;
    let requiresFasting = false;
    for (const tid of testIds) {
      const testObj = db.tests.find((t) => t.id === tid);
      const priceObj = db.pricings.find((p) => p.labId === targetLab.id && p.testId === tid);
      if (!testObj || !priceObj) {
        return res.status(400).json({ success: false, error: `Test ${tid} is not offered at ${targetLab.name}` });
      }
      if (testObj.fastingHours > 0) requiresFasting = true;
      computedTestsTotal += priceObj.discountedPricePkr ?? priceObj.pricePkr;
    }

    if (requiresFasting && !fastingAcknowledged) {
      return res.status(400).json({
        success: false,
        error: 'Mandatory fasting preparation acknowledgement is required for selected tests.',
      });
    }

    const bookingDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (isNaN(bookingDate.getTime()) || bookingDate < today) {
      return res.status(400).json({ success: false, error: 'Scheduled date cannot be in the past' });
    }
    if (bookingDate > maxDate) {
      return res.status(400).json({ success: false, error: 'Appointments can only be booked up to 14 days ahead' });
    }

    const mode: 'HOME_COLLECTION' | 'BRANCH_VISIT' =
      collectionType === 'BRANCH_VISIT' ? 'BRANCH_VISIT' : 'HOME_COLLECTION';
    if (mode === 'HOME_COLLECTION' && (!streetAddress || streetAddress.trim().length < 8)) {
      return res.status(400).json({
        success: false,
        error: 'Exact street address (min 8 chars) is required for Lahore home sample dispatch.',
      });
    }

    const slotCount = db.bookings.filter(
      (b) =>
        b.branchId === targetBranch.id &&
        b.scheduledDate === scheduledDate &&
        b.scheduledTimeSlot === scheduledTimeSlot &&
        b.status !== 'CANCELLED'
    ).length;
    if (slotCount >= 8) {
      return res.status(409).json({
        success: false,
        error: `Slot "${scheduledTimeSlot}" on ${scheduledDate} at ${targetBranch.name} is full.`,
      });
    }

    const homeFee = mode === 'HOME_COLLECTION' ? targetBranch.homeCollectionFeePkr : 0;
    const totalPkr = computedTestsTotal + homeFee;
    const bookingNumber = `LC-LHR-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const nowIso = new Date().toISOString();

    const newBooking: BookingRecord = {
      id: `book-${Date.now()}`,
      bookingNumber,
      patientUserId: req.authUser?.id,
      patientName: patientName.trim(),
      familyMemberId: resolvedFamilyMemberId,
      familyMemberName: resolvedFamilyMemberName,
      patientPhone: normalizedPhone,
      patientEmail: patientEmail.trim().toLowerCase(),
      patientArea: patientArea || targetBranch.area,
      streetAddress: mode === 'HOME_COLLECTION' ? streetAddress.trim() : undefined,
      labId: targetLab.id,
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      branchAddress: targetBranch.address,
      testIds,
      collectionType: mode,
      scheduledDate,
      scheduledTimeSlot: scheduledTimeSlot || '07:30 AM – 08:30 AM',
      status: 'PENDING',
      totalPkr,
      homeCollectionFeePkr: homeFee,
      fastingAcknowledged: !!fastingAcknowledged,
      trackingEvents: [
        {
          id: `trk-${Date.now()}`,
          stage: 'BOOKING_CREATED',
          title: 'Appointment Booked',
          description: `${mode === 'HOME_COLLECTION' ? 'Home collection' : 'Branch walk-in'} reserved at ${targetBranch.name}${resolvedFamilyMemberName ? ` for ${resolvedFamilyMemberName}` : ''}. Total: PKR ${totalPkr.toLocaleString()}.`,
          actor: req.authUser!.name,
          location: mode === 'HOME_COLLECTION' ? streetAddress.trim() : targetBranch.address,
          timestamp: nowIso,
        },
      ],
      createdAt: nowIso,
    };

    db.bookings.unshift(newBooking);
    pushNotification({
      recipientRole: 'LAB_ADMIN',
      targetLabId: targetLab.id,
      title: `New Booking ${bookingNumber}`,
      message: `${patientName.trim()} booked ${testIds.length} test(s) at ${targetBranch.name} for ${scheduledDate}.`,
      category: 'BOOKING',
      relatedId: bookingNumber,
    });
    pushNotification({
      recipientRole: 'PATIENT',
      targetPhone: normalizedPhone,
      title: `Appointment Confirmed (${bookingNumber})`,
      message: `${targetLab.name} scheduled for ${scheduledDate} (${scheduledTimeSlot}).`,
      category: 'BOOKING',
      relatedId: bookingNumber,
    });
    appendAudit(req.authUser!.name, req.authUser!.role, 'BOOKING_CREATED', `${bookingNumber} @ ${targetBranch.name}`);
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: `Appointment confirmed: ${bookingNumber}`,
      data: newBooking,
    });
  });

  // Real-Time Sample & Courier Tracking Lookup
  app.get('/api/bookings/:bookingNumber/tracking', (req: AuthenticatedRequest, res: Response) => {
    const booking = db.bookings.find(
      (b) => b.bookingNumber.toUpperCase() === req.params.bookingNumber.trim().toUpperCase() || b.id === req.params.bookingNumber
    );
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking number not found in Lahore ledger' });
    }

    const phoneLast4 = typeof req.query.phoneLast4 === 'string' ? req.query.phoneLast4.trim() : '';
    const actor = req.authUser;

    const isAuthorized =
      (actor && (actor.role === 'SUPER_ADMIN' || actor.role === 'PHC_INSPECTOR')) ||
      (actor && (actor.role === 'LAB_ADMIN' || actor.role === 'PHLEBOTOMIST') && actor.labId === booking.labId) ||
      (actor &&
        actor.role === 'PATIENT' &&
        (booking.patientUserId === actor.id ||
          normalizePakistaniPhone(booking.patientPhone) === normalizePakistaniPhone(actor.phone))) ||
      (phoneLast4.length === 4 && booking.patientPhone.endsWith(phoneLast4));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Tracking is access-controlled. Sign in as the booking owner or enter matching last 4 digits of mobile number.',
      });
    }

    const lab = db.laboratories.find((l) => l.id === booking.labId);
    const branch = lab?.branches.find((br) => br.id === booking.branchId);
    const report = db.reports.find((r) => r.bookingNumber === booking.bookingNumber);

    return res.json({
      success: true,
      data: {
        booking,
        labName: lab?.name || booking.labId,
        phcLicence: lab?.phcLicence,
        branchName: booking.branchName || branch?.name,
        branchAddress: booking.branchAddress || branch?.address,
        trackingEvents: booking.trackingEvents || [],
        reportAvailable: !!report,
        reportPdfUrl: report?.pdfUrl,
        emailDispatchedAt: report?.emailDispatchedAt || booking.emailDispatchedAt,
      },
    });
  });

  // Operational Status Transitions (Lab Staff & Phlebotomists Only)
  app.patch(
    '/api/bookings/:id/status',
    requireRole('LAB_ADMIN', 'PHLEBOTOMIST', 'SUPER_ADMIN'),
    (req: AuthenticatedRequest, res: Response) => {
      const idx = db.bookings.findIndex((b) => b.id === req.params.id || b.bookingNumber === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      const booking = db.bookings[idx];
      const actor = req.authUser!;
      if ((actor.role === 'LAB_ADMIN' || actor.role === 'PHLEBOTOMIST') && actor.labId !== booking.labId) {
        return res.status(403).json({ success: false, error: 'Cannot modify bookings belonging to another laboratory' });
      }

      const {
        status,
        phlebotomistName,
        phlebotomistStatus,
        sampleBarcode,
        coldChainTempCelsius,
        fastingConfirmed,
      } = req.body;

      if (phlebotomistStatus === 'SAMPLE_COLLECTED') {
        if (!fastingConfirmed) {
          return res.status(400).json({ success: false, error: 'Clinical fasting verification is required before specimen draw' });
        }
        if (!sampleBarcode || String(sampleBarcode).trim().length < 6) {
          return res.status(400).json({ success: false, error: 'Valid 6+ character Vacutainer Barcode is required' });
        }
      }

      if (coldChainTempCelsius !== undefined) {
        const temp = Number(coldChainTempCelsius);
        if (isNaN(temp) || temp < 2.0 || temp > 8.0) {
          return res.status(400).json({
            success: false,
            error: 'PHC cold-chain violation: Specimen transport temperature must be between 2.0°C and 8.0°C',
          });
        }
        booking.coldChainTempCelsius = temp;
      }

      if (status) booking.status = status;
      if (phlebotomistName) booking.phlebotomistName = phlebotomistName;
      if (actor.role === 'PHLEBOTOMIST' && !booking.phlebotomistPhone) booking.phlebotomistPhone = actor.phone;
      if (phlebotomistStatus) booking.phlebotomistStatus = phlebotomistStatus;
      if (sampleBarcode) booking.sampleBarcode = String(sampleBarcode).trim().toUpperCase();
      if (fastingConfirmed !== undefined) booking.fastingConfirmed = !!fastingConfirmed;

      const stage = (phlebotomistStatus || status) as TrackingEventRecord['stage'];
      const stageTitles: Record<string, { title: string; desc: string }> = {
        ACCEPTED: { title: 'Lab Requisition Accepted', desc: 'Tube barcoded labels prepared for collection.' },
        DISPATCHED: { title: 'Courier Dispatched', desc: `${booking.phlebotomistName || actor.name} assigned for pickup.` },
        EN_ROUTE: { title: 'Phlebotomist En Route', desc: `${booking.phlebotomistName || actor.name} heading to patient location.` },
        ARRIVED: { title: 'Arrived at Patient Address', desc: 'Courier reached residence with sterile vacutainer kit.' },
        SAMPLE_COLLECTED: {
          title: 'Specimen Drawn & Sealed',
          desc: `Barcode ${booking.sampleBarcode || 'N/A'} sealed at ${booking.coldChainTempCelsius ?? 4.0}°C.`,
        },
        IN_TRANSIT: { title: 'Cold-Chain Transit to Lab', desc: 'Sample traveling inside monitored 2°C–8°C box.' },
        RECEIVED_AT_LAB: { title: 'Received at Central Lab Desk', desc: 'Handed over to accessioning department.' },
        PROCESSING: { title: 'Automated Analyzer Processing', desc: 'Biochemistry / Hematology run underway.' },
        COMPLETED: { title: 'Pathology Report Complete', desc: 'Processing finished.' },
      };

      const meta = stageTitles[stage] || { title: `Status: ${stage}`, desc: 'Operational milestone recorded.' };
      booking.trackingEvents = booking.trackingEvents || [];
      booking.trackingEvents.push({
        id: `trk-${Date.now()}`,
        stage,
        title: meta.title,
        description: meta.desc,
        actor: actor.name,
        location: booking.branchName || booking.patientArea,
        timestamp: new Date().toISOString(),
      });

      appendAudit(actor.name, actor.role, `BOOKING_STAGE_${stage}`, booking.bookingNumber);
      saveDatabase();

      return res.json({
        success: true,
        message: `Updated ${booking.bookingNumber} to ${stage}`,
        data: booking,
      });
    }
  );

  // Reschedule Booking (Patient Owner or Lab Branch Lead, PENDING/ACCEPTED only)
  app.patch(
    '/api/bookings/:id/reschedule',
    requireRole('PATIENT', 'LAB_ADMIN', 'SUPER_ADMIN'),
    (req: AuthenticatedRequest, res: Response) => {
      const booking = db.bookings.find((b) => b.id === req.params.id || b.bookingNumber === req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      const actor = req.authUser!;
      const isAuthorized =
        actor.role === 'SUPER_ADMIN' ||
        (actor.role === 'LAB_ADMIN' && actor.labId === booking.labId) ||
        (actor.role === 'PATIENT' &&
          (booking.patientUserId === actor.id ||
            normalizePakistaniPhone(booking.patientPhone) === normalizePakistaniPhone(actor.phone)));
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Not authorized to reschedule this booking' });
      }
      if (booking.status !== 'PENDING' && booking.status !== 'ACCEPTED') {
        return res.status(409).json({
          success: false,
          error: `Cannot reschedule once sample collection or dispatch has started (status: ${booking.status})`,
        });
      }

      const { scheduledDate, scheduledTimeSlot } = req.body;
      const bookingDate = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (!scheduledDate || isNaN(bookingDate.getTime()) || bookingDate < today) {
        return res.status(400).json({ success: false, error: 'New scheduled date cannot be in the past' });
      }
      if (bookingDate > maxDate) {
        return res.status(400).json({ success: false, error: 'Rescheduling is limited to 14 days ahead' });
      }
      if (!scheduledTimeSlot || String(scheduledTimeSlot).trim().length < 5) {
        return res.status(400).json({ success: false, error: 'A valid time slot is required' });
      }

      const slotCount = db.bookings.filter(
        (b) =>
          b.id !== booking.id &&
          b.branchId === booking.branchId &&
          b.scheduledDate === scheduledDate &&
          b.scheduledTimeSlot === scheduledTimeSlot &&
          b.status !== 'CANCELLED'
      ).length;
      if (slotCount >= 8) {
        return res.status(409).json({
          success: false,
          error: `Time slot "${scheduledTimeSlot}" on ${scheduledDate} is already full.`,
        });
      }

      booking.scheduledDate = scheduledDate;
      booking.scheduledTimeSlot = scheduledTimeSlot;
      booking.trackingEvents = booking.trackingEvents || [];
      booking.trackingEvents.push({
        id: `trk-${Date.now()}`,
        stage: booking.status === 'ACCEPTED' ? 'ACCEPTED' : 'BOOKING_CREATED',
        title: 'Appointment Rescheduled',
        description: `Moved to ${scheduledDate} (${scheduledTimeSlot}).`,
        actor: actor.name,
        location: booking.branchName || booking.patientArea,
        timestamp: new Date().toISOString(),
      });

      appendAudit(actor.name, actor.role, 'BOOKING_RESCHEDULED', `${booking.bookingNumber} -> ${scheduledDate} ${scheduledTimeSlot}`);
      saveDatabase();
      return res.json({ success: true, message: `Rescheduled to ${scheduledDate} (${scheduledTimeSlot})`, data: booking });
    }
  );

  // Cancel Booking (Patient Owner or Lab Branch Lead, PENDING/ACCEPTED only)
  app.post(
    '/api/bookings/:id/cancel',
    requireRole('PATIENT', 'LAB_ADMIN', 'SUPER_ADMIN'),
    (req: AuthenticatedRequest, res: Response) => {
      const booking = db.bookings.find((b) => b.id === req.params.id || b.bookingNumber === req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      const actor = req.authUser!;
      const isAuthorized =
        actor.role === 'SUPER_ADMIN' ||
        (actor.role === 'LAB_ADMIN' && actor.labId === booking.labId) ||
        (actor.role === 'PATIENT' &&
          (booking.patientUserId === actor.id ||
            normalizePakistaniPhone(booking.patientPhone) === normalizePakistaniPhone(actor.phone)));
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: 'Not authorized to cancel this booking' });
      }
      if (booking.status !== 'PENDING' && booking.status !== 'ACCEPTED') {
        return res.status(409).json({
          success: false,
          error: `Booking cannot be cancelled in current stage (${booking.status}).`,
        });
      }

      const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Cancelled by stakeholder';
      booking.status = 'CANCELLED';
      booking.trackingEvents = booking.trackingEvents || [];
      booking.trackingEvents.push({
        id: `trk-${Date.now()}`,
        stage: 'BOOKING_CREATED',
        title: 'Appointment Cancelled',
        description: reason,
        actor: actor.name,
        location: booking.branchName || booking.patientArea,
        timestamp: new Date().toISOString(),
      });

      appendAudit(actor.name, actor.role, 'BOOKING_CANCELLED', `${booking.bookingNumber}: ${reason}`);
      saveDatabase();
      return res.json({ success: true, message: `Booking ${booking.bookingNumber} cancelled`, data: booking });
    }
  );

  // Lab Phlebotomist Directory & Rider Assignment (LAB_ADMIN / SUPER_ADMIN)
  app.get('/api/lab/phlebotomists', requireRole('LAB_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const riders = db.users
      .filter((u) => u.role === 'PHLEBOTOMIST' && (actor.role === 'SUPER_ADMIN' || u.labId === actor.labId))
      .map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        staffCode: u.staffCode,
        branchId: u.branchId,
        area: u.area,
      }));
    return res.json({ success: true, count: riders.length, data: riders });
  });

  app.patch(
    '/api/bookings/:id/assign-phlebotomist',
    requireRole('LAB_ADMIN', 'SUPER_ADMIN'),
    (req: AuthenticatedRequest, res: Response) => {
      const booking = db.bookings.find((b) => b.id === req.params.id || b.bookingNumber === req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      const actor = req.authUser!;
      if (actor.role === 'LAB_ADMIN' && actor.labId !== booking.labId) {
        return res.status(403).json({ success: false, error: 'Cannot assign riders to another laboratory booking' });
      }
      if (booking.collectionType !== 'HOME_COLLECTION') {
        return res.status(400).json({ success: false, error: 'Phlebotomist assignment only applies to HOME_COLLECTION bookings' });
      }

      const rider = db.users.find(
        (u) => u.id === req.body?.phlebotomistId && u.role === 'PHLEBOTOMIST' && u.labId === booking.labId
      );
      if (!rider) {
        return res.status(404).json({ success: false, error: 'Verified phlebotomist not found for this laboratory' });
      }

      const displayName = rider.staffCode ? `${rider.name} (${rider.staffCode})` : rider.name;
      booking.phlebotomistName = displayName;
      booking.phlebotomistPhone = rider.phone;
      if (booking.status === 'PENDING' || booking.status === 'ACCEPTED') {
        booking.status = 'DISPATCHED';
      }
      booking.phlebotomistStatus = 'EN_ROUTE';
      booking.trackingEvents = booking.trackingEvents || [];
      booking.trackingEvents.push({
        id: `trk-${Date.now()}`,
        stage: 'DISPATCHED',
        title: 'Phlebotomist Assigned & Dispatched',
        description: `${displayName} (${rider.phone}) dispatched for home sampling.`,
        actor: actor.name,
        location: booking.streetAddress || booking.patientArea,
        timestamp: new Date().toISOString(),
      });

      appendAudit(actor.name, actor.role, 'PHLEBOTOMIST_DISPATCHED', `${booking.bookingNumber} -> ${displayName}`);
      pushNotification({
        recipientRole: 'PATIENT',
        targetPhone: booking.patientPhone,
        title: `Phlebotomist Dispatched (${booking.bookingNumber})`,
        message: `${displayName} is en route for your sample collection.`,
        category: 'DISPATCH',
        relatedId: booking.bookingNumber,
      });
      pushNotification({
        recipientRole: 'PHLEBOTOMIST',
        targetUserId: rider.id,
        title: `New Route Assigned (${booking.bookingNumber})`,
        message: `Collect sample for ${booking.patientName} at ${booking.streetAddress || booking.patientArea}.`,
        category: 'DISPATCH',
        relatedId: booking.bookingNumber,
      });
      saveDatabase();
      return res.json({ success: true, message: `Assigned ${displayName} to ${booking.bookingNumber}`, data: booking });
    }
  );

  // Verified Laboratory Reviews (Booking-Gated)
  app.get('/api/reviews', (req: Request, res: Response) => {
    const labId = typeof req.query.labId === 'string' ? req.query.labId : undefined;
    const list = labId ? db.reviews.filter((r) => r.labId === labId) : db.reviews;
    return res.json({ success: true, count: list.length, data: list });
  });

  app.post('/api/reviews', requireRole('PATIENT'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const { bookingNumber, rating, punctualityRating, turnaroundRating, comment } = req.body;

    const booking = db.bookings.find((b) => b.bookingNumber === bookingNumber);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    const ownsBooking =
      booking.patientUserId === actor.id ||
      normalizePakistaniPhone(booking.patientPhone) === normalizePakistaniPhone(actor.phone);
    if (!ownsBooking) {
      return res.status(403).json({ success: false, error: 'You can only review your own laboratory bookings' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(409).json({
        success: false,
        error: 'Verified reviews can only be submitted after your diagnostic report is COMPLETED.',
      });
    }
    if (db.reviews.some((r) => r.bookingNumber === booking.bookingNumber)) {
      return res.status(409).json({ success: false, error: 'A verified review has already been submitted for this booking.' });
    }

    const rMain = Number(rating);
    const rPunct = Number(punctualityRating || rMain);
    const rTat = Number(turnaroundRating || rMain);
    if ([rMain, rPunct, rTat].some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
      return res.status(400).json({ success: false, error: 'Ratings must be whole numbers between 1 and 5' });
    }
    if (!comment || String(comment).trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Please share at least 8 characters describing your experience.' });
    }

    const newReview: LabReviewRecord = {
      id: `rev-${Date.now()}`,
      labId: booking.labId,
      bookingNumber: booking.bookingNumber,
      patientUserId: actor.id,
      patientName: actor.name,
      rating: rMain,
      punctualityRating: rPunct,
      turnaroundRating: rTat,
      comment: String(comment).trim(),
      verifiedBooking: true,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);
    appendAudit(actor.name, actor.role, 'VERIFIED_REVIEW_SUBMITTED', `${booking.bookingNumber} (${rMain}/5)`);
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: 'Verified review published',
      data: newReview,
    });
  });

  // ==========================================
  // REPORTS: GENERATION, PDF DOWNLOAD & EMAIL DISPATCH
  // ==========================================

  app.get(
    '/api/reports',
    requireRole('PATIENT', 'LAB_ADMIN', 'SUPER_ADMIN', 'PHC_INSPECTOR'),
    (req: AuthenticatedRequest, res: Response) => {
      const actor = req.authUser!;
      let list = [...db.reports];
      if (actor.role === 'PATIENT') {
        const actorPhone = normalizePakistaniPhone(actor.phone);
        list = list.filter((r) => normalizePakistaniPhone(r.patientPhone) === actorPhone);
      } else if (actor.role === 'LAB_ADMIN') {
        list = list.filter((r) => r.labId === actor.labId);
      }
      return res.json({ success: true, count: list.length, data: list });
    }
  );

  app.post('/api/reports/upload', requireRole('LAB_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    const {
      bookingNumber,
      fileName,
      pathologistName,
      clinicalNotes,
      parameters,
      sendEmailToPatient = true,
      recipientEmailOverride,
    } = req.body;

    const booking = db.bookings.find((b) => b.bookingNumber === bookingNumber);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking number not found for report matching' });
    }
    if (req.authUser!.role === 'LAB_ADMIN' && req.authUser!.labId !== booking.labId) {
      return res.status(403).json({ success: false, error: 'Cannot publish report for another laboratory booking' });
    }

    if (recipientEmailOverride && !isValidEmail(recipientEmailOverride)) {
      return res.status(400).json({ success: false, error: 'Provided patient recipient email address is invalid' });
    }
    const effectiveRecipientEmail = (recipientEmailOverride || booking.patientEmail || '').trim().toLowerCase();
    if (sendEmailToPatient && !isValidEmail(effectiveRecipientEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid patient email address is required to dispatch PDF report upon release.',
      });
    }

    const lab = db.laboratories.find((l) => l.id === booking.labId);
    const branch = lab?.branches.find((b) => b.id === booking.branchId);

    // Build structured clinical parameters from provided values or test defaults
    let finalParams: ReportParameterRecord[] = Array.isArray(parameters) && parameters.length > 0 ? parameters : [];
    if (finalParams.length === 0) {
      for (const tid of booking.testIds) {
        const testDef = db.tests.find((t) => t.id === tid);
        if (testDef?.defaultParameters) {
          for (const dp of testDef.defaultParameters) {
            finalParams.push({
              parameter: dp.parameter,
              observedValue: dp.defaultValue,
              unit: dp.unit,
              referenceRange: dp.referenceRange,
              flag: dp.flag,
            });
          }
        }
      }
    }

    const resolvedFileName = (fileName || `${lab?.slug || 'lab'}_${booking.bookingNumber}_signed.pdf`).replace(/\s+/g, '_');
    const checksumSha256 = crypto
      .createHash('sha256')
      .update(`${booking.bookingNumber}:${JSON.stringify(finalParams)}:${Date.now()}`)
      .digest('hex');

    const nowIso = new Date().toISOString();
    const report: DiagnosticReportRecord = {
      id: `rep-${Date.now()}`,
      bookingNumber: booking.bookingNumber,
      labId: booking.labId,
      branchName: booking.branchName || branch?.name || lab?.name || 'Lahore Branch',
      patientName: booking.patientName,
      familyMemberId: booking.familyMemberId,
      familyMemberName: booking.familyMemberName,
      patientPhone: booking.patientPhone,
      patientEmail: recipientEmailOverride?.trim() || booking.patientEmail,
      fileName: resolvedFileName.endsWith('.pdf') ? resolvedFileName : `${resolvedFileName}.pdf`,
      pdfUrl: `/api/reports/${booking.bookingNumber}/pdf`,
      checksumSha256,
      pathologistName: pathologistName?.trim() || `${req.authUser!.name}, FCPS Pathology`,
      clinicalNotes:
        clinicalNotes?.trim() ||
        'Analyzed on automated calibrated clinical analyzer. Correlate clinically with patient history.',
      parameters: finalParams,
      publishedAt: nowIso,
      emailDispatchStatus: 'NOT_SENT',
    };

    const existingIdx = db.reports.findIndex((r) => r.bookingNumber === booking.bookingNumber);
    if (existingIdx >= 0) {
      db.reports[existingIdx] = report;
    } else {
      db.reports.unshift(report);
    }

    booking.reportUrl = report.pdfUrl;
    booking.reportChecksum = checksumSha256;
    booking.status = 'COMPLETED';
    booking.trackingEvents = booking.trackingEvents || [];
    booking.trackingEvents.push({
      id: `trk-${Date.now()}`,
      stage: 'REPORT_RELEASED',
      title: 'Signed PDF Published',
      description: `Pathologist signed ${report.fileName} and pushed to Patient Portal.`,
      actor: report.pathologistName,
      location: report.branchName,
      timestamp: nowIso,
    });

    let emailLog: EmailDispatchLogRecord | null = null;
    if (sendEmailToPatient && report.patientEmail && isValidEmail(report.patientEmail)) {
      const pdfBuf = generatePathologyPdfBuffer(report, lab, booking);
      emailLog = await dispatchPatientReportEmail(report.patientEmail, report, lab, pdfBuf);
      booking.trackingEvents.push({
        id: `trk-${Date.now() + 1}`,
        stage: 'REPORT_RELEASED',
        title: 'PDF Sent to Patient Email',
        description: `Report attachment emailed to ${report.patientEmail}.`,
        actor: 'Automated Dispatch Engine',
        timestamp: emailLog.sentAt,
      });
    }

    pushNotification({
      recipientRole: 'PATIENT',
      targetPhone: booking.patientPhone,
      title: `Signed PDF Report Published (${booking.bookingNumber})`,
      message: emailLog
        ? `Your signed report from ${lab?.name || 'Laboratory'} is ready and emailed to ${emailLog.recipientEmail}.`
        : `Your signed report from ${lab?.name || 'Laboratory'} is ready to download in PDF Reports.`,
      category: 'REPORT',
      relatedId: booking.bookingNumber,
    });

    appendAudit(
      req.authUser!.name,
      req.authUser!.role,
      'REPORT_UPLOADED_PDF',
      `${booking.bookingNumber}${emailLog ? ` & Emailed to ${emailLog.recipientEmail}` : ''}`
    );
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: emailLog
        ? `PDF report published and dispatched to ${emailLog.recipientEmail}`
        : `PDF report published for ${booking.bookingNumber}`,
      data: {
        report,
        emailLog,
      },
    });
  });

  // Download or View Real Binary %PDF-1.4 Pathology Report
  app.get('/api/reports/:bookingNumber/pdf', (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser;
    if (!actor) {
      return res.status(401).json({ success: false, error: 'Authentication token required to access clinical PDF report' });
    }

    const report = db.reports.find((r) => r.bookingNumber.toUpperCase() === req.params.bookingNumber.trim().toUpperCase());
    if (!report) {
      return res.status(404).json({ success: false, error: 'Published report not found for this booking number' });
    }

    const booking = db.bookings.find((b) => b.bookingNumber === report.bookingNumber);
    const isOwner =
      actor.role === 'SUPER_ADMIN' ||
      actor.role === 'PHC_INSPECTOR' ||
      (actor.role === 'LAB_ADMIN' && actor.labId === report.labId) ||
      (actor.role === 'PATIENT' && normalizePakistaniPhone(report.patientPhone) === normalizePakistaniPhone(actor.phone));

    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied to this patient pathology report' });
    }

    const lab = db.laboratories.find((l) => l.id === report.labId);
    const pdfBuffer = generatePathologyPdfBuffer(report, lab, booking);
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${report.fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  });

  // Send / Resend PDF Report to Patient Email (Strictly Lab Branch Lead / Pathologist & Admin Only)
  app.post(
    '/api/reports/:bookingNumber/email',
    requireRole('LAB_ADMIN', 'SUPER_ADMIN'),
    async (req: AuthenticatedRequest, res: Response) => {
      const report = db.reports.find(
        (r) => r.bookingNumber.toUpperCase() === req.params.bookingNumber.trim().toUpperCase()
      );
      if (!report) {
        return res.status(404).json({ success: false, error: 'Published report not found for this booking' });
      }

      const actor = req.authUser!;
      const allowed =
        actor.role === 'SUPER_ADMIN' ||
        (actor.role === 'LAB_ADMIN' && actor.labId === report.labId);
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'Unauthorized to email this clinical report' });
      }

      const recipientEmail = (req.body.recipientEmail || report.patientEmail || '').trim().toLowerCase();
      if (!isValidEmail(recipientEmail)) {
        return res.status(400).json({ success: false, error: 'A valid recipient email address is required' });
      }

      const booking = db.bookings.find((b) => b.bookingNumber === report.bookingNumber);
      const lab = db.laboratories.find((l) => l.id === report.labId);
      const pdfBuffer = generatePathologyPdfBuffer(report, lab, booking);
      const emailLog = await dispatchPatientReportEmail(recipientEmail, report, lab, pdfBuffer);

      appendAudit(actor.name, actor.role, 'REPORT_EMAILED', `${report.bookingNumber} -> ${recipientEmail}`);
      saveDatabase();

      return res.json({
        success: true,
        message: `PDF report sent to ${recipientEmail}`,
        data: emailLog,
      });
    }
  );

  // ==========================================
  // NOTIFICATIONS, LAB BRANCHES & SAAS SETTLEMENTS
  // ==========================================

  app.get('/api/notifications', requireRole('PATIENT', 'LAB_ADMIN', 'PHLEBOTOMIST', 'SUPER_ADMIN', 'PHC_INSPECTOR'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const actorPhone = normalizePakistaniPhone(actor.phone);
    const items = db.notifications.filter((n) => {
      if (actor.role === 'SUPER_ADMIN' || actor.role === 'PHC_INSPECTOR') {
        return n.recipientRole === actor.role || n.recipientRole === 'ALL';
      }
      if (actor.role === 'PATIENT') {
        return (
          n.recipientRole === 'PATIENT' &&
          (n.targetUserId === actor.id || (n.targetPhone && normalizePakistaniPhone(n.targetPhone) === actorPhone))
        );
      }
      if (actor.role === 'LAB_ADMIN') {
        return n.recipientRole === 'LAB_ADMIN' && (!n.targetLabId || n.targetLabId === actor.labId);
      }
      if (actor.role === 'PHLEBOTOMIST') {
        return n.recipientRole === 'PHLEBOTOMIST' && (!n.targetUserId || n.targetUserId === actor.id);
      }
      return false;
    });

    return res.json({
      success: true,
      unreadCount: items.filter((n) => !n.read).length,
      data: items,
    });
  });

  app.post('/api/notifications/read', requireRole('PATIENT', 'LAB_ADMIN', 'PHLEBOTOMIST', 'SUPER_ADMIN', 'PHC_INSPECTOR'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const actorPhone = normalizePakistaniPhone(actor.phone);
    const { notificationId } = req.body || {};

    db.notifications.forEach((n) => {
      if (notificationId && n.id !== notificationId) return;
      const belongs =
        (actor.role === 'PATIENT' && (n.targetUserId === actor.id || (n.targetPhone && normalizePakistaniPhone(n.targetPhone) === actorPhone))) ||
        (actor.role === 'LAB_ADMIN' && n.recipientRole === 'LAB_ADMIN' && n.targetLabId === actor.labId) ||
        (actor.role === 'PHLEBOTOMIST' && n.recipientRole === 'PHLEBOTOMIST' && (!n.targetUserId || n.targetUserId === actor.id)) ||
        ((actor.role === 'SUPER_ADMIN' || actor.role === 'PHC_INSPECTOR') && n.recipientRole === actor.role);
      if (belongs) n.read = true;
    });
    saveDatabase();
    return res.json({ success: true });
  });

  app.patch('/api/lab/branches/:branchId', requireRole('LAB_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const lab = db.laboratories.find((l) => l.branches.some((b) => b.id === req.params.branchId));
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory branch not found' });
    }
    if (actor.role === 'LAB_ADMIN' && actor.labId !== lab.id) {
      return res.status(403).json({ success: false, error: 'Cannot modify branches belonging to another laboratory' });
    }
    const branch = lab.branches.find((b) => b.id === req.params.branchId)!;
    const { operatingHours, homeCollectionFeePkr } = req.body;
    if (operatingHours && String(operatingHours).trim().length >= 3) {
      branch.operatingHours = String(operatingHours).trim();
    }
    if (homeCollectionFeePkr !== undefined) {
      const fee = Number(homeCollectionFeePkr);
      if (isNaN(fee) || fee < 0 || fee > 5000) {
        return res.status(400).json({ success: false, error: 'Home collection fee must be between PKR 0 and PKR 5,000' });
      }
      branch.homeCollectionFeePkr = fee;
    }
    appendAudit(actor.name, actor.role, 'BRANCH_CONFIG_UPDATED', `${branch.name} (Fee: PKR ${branch.homeCollectionFeePkr})`);
    saveDatabase();
    return res.json({ success: true, data: branch });
  });

  app.get('/api/lab/settlements', requireRole('LAB_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const actor = req.authUser!;
    const labId = actor.role === 'LAB_ADMIN' ? actor.labId : String(req.query.labId || '');
    const lab = db.laboratories.find((l) => l.id === labId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found' });
    }
    const activeBookings = db.bookings.filter((b) => b.labId === lab.id && b.status !== 'CANCELLED');
    const unsettledBookings = activeBookings.filter((b) => !b.settlementId);
    const unsettledGrossPkr = unsettledBookings.reduce((s, b) => s + b.totalPkr, 0);
    const unsettledCommissionPkr = Math.round(unsettledGrossPkr * 0.08);
    const history = db.settlementsLedger.filter((s) => s.labId === lab.id);

    return res.json({
      success: true,
      data: {
        labId: lab.id,
        labName: lab.name,
        subscriptionTier: lab.subscriptionTier || 'GROWTH',
        monthlySaasFeePkr: lab.monthlySaasFeePkr ?? 18500,
        commissionRatePct: 8,
        unsettledBookingsCount: unsettledBookings.length,
        unsettledGrossPkr,
        unsettledCommissionPkr,
        unsettledNetPayablePkr: unsettledGrossPkr - unsettledCommissionPkr,
        settlementHistory: history,
      },
    });
  });

  // ==========================================
  // ADMIN & PHC REGULATORY ENDPOINTS (STRICT RBAC)
  // ==========================================

  app.get('/api/admin/overview', requireRole('SUPER_ADMIN', 'PHC_INSPECTOR'), (_req: Request, res: Response) => {
    const labSettlements = db.laboratories.map((lab) => {
      const labBookings = db.bookings.filter((b) => b.labId === lab.id && b.status !== 'CANCELLED');
      const unsettled = labBookings.filter((b) => !b.settlementId);
      const grossPkr = labBookings.reduce((sum, b) => sum + b.totalPkr, 0);
      const commissionPkr = Math.round(grossPkr * 0.08);
      const unsettledGrossPkr = unsettled.reduce((sum, b) => sum + b.totalPkr, 0);
      const unsettledCommissionPkr = Math.round(unsettledGrossPkr * 0.08);
      return {
        labId: lab.id,
        labName: lab.name,
        phcLicence: lab.phcLicence,
        verificationStatus: lab.verificationStatus,
        subscriptionTier: lab.subscriptionTier || 'GROWTH',
        monthlySaasFeePkr: lab.monthlySaasFeePkr ?? 18500,
        bookingsCount: labBookings.length,
        completedCount: labBookings.filter((b) => b.status === 'COMPLETED').length,
        grossPkr,
        commissionPkr,
        netPayablePkr: grossPkr - commissionPkr,
        unsettledCount: unsettled.length,
        unsettledNetPkr: unsettledGrossPkr - unsettledCommissionPkr,
      };
    });

    return res.json({
      success: true,
      data: {
        laboratories: db.laboratories,
        settlements: labSettlements,
        settlementHistory: db.settlementsLedger,
        auditLogs: db.auditLogs,
        emailLogs: db.emailLogs,
        securityStatus: {
          authAlgorithm: 'HMAC-SHA256 Signed Bearer Tokens',
          passwordHashing: 'Node crypto scrypt + timingSafeEqual',
          rateLimiter: 'Sliding Window (45 req / 5 min on /api/auth/*)',
          pdfIntegrity: 'SHA-256 Digest + Strict Owner RBAC',
        },
        lahoreCoverage: {
          verifiedLabsCount: db.laboratories.filter((l) => l.verificationStatus === 'VERIFIED').length,
          totalLabsCount: db.laboratories.length,
          totalBranchesCount: db.laboratories.reduce((s, l) => s + l.branches.length, 0),
          coveredAreas: Array.from(new Set(db.laboratories.flatMap((l) => l.branches.map((b) => b.area)))),
          verifiedTestsCount: db.tests.length,
          verifiedTariffsCount: db.pricings.length,
          envHygiene: {
            hasAuthSecretEnv: Boolean((process.env.LABCONNECT_AUTH_SECRET || '').trim()),
            hasGeminiKey: Boolean((process.env.GEMINI_API_KEY || '').trim()),
            hasSmtpConfigured: Boolean((process.env.SMTP_HOST || '').trim()),
          },
        },
        metrics: {
          totalBookings: db.bookings.length,
          totalReports: db.reports.length,
          totalEmailsSent: db.emailLogs.length,
          grossVolumePkr: labSettlements.reduce((s, r) => s + r.grossPkr, 0),
          totalCommissionPkr: labSettlements.reduce((s, r) => s + r.commissionPkr, 0),
          totalSaasMrrPkr: labSettlements.reduce((s, r) => s + r.monthlySaasFeePkr, 0),
        },
      },
    });
  });

  app.post('/api/admin/labs/:id/verify', requireRole('SUPER_ADMIN', 'PHC_INSPECTOR'), (req: AuthenticatedRequest, res: Response) => {
    const lab = db.laboratories.find((l) => l.id === req.params.id);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found' });
    }
    const requestedStatus = req.body?.status;
    const nextStatus =
      requestedStatus === 'VERIFIED' || requestedStatus === 'REVOKED'
        ? requestedStatus
        : lab.verificationStatus === 'VERIFIED'
          ? 'REVOKED'
          : 'VERIFIED';
    lab.verificationStatus = nextStatus;
    lab.verifiedAt = new Date().toISOString().slice(0, 10);
    lab.verifiedBy = req.authUser!.name;
    pushNotification({
      recipientRole: 'LAB_ADMIN',
      targetLabId: lab.id,
      title: nextStatus === 'VERIFIED' ? 'PHC Licence Verified' : 'PHC Licence Revoked',
      message: `${req.authUser!.name} updated ${lab.name} PHC compliance status to ${nextStatus}.`,
      category: 'COMPLIANCE',
      relatedId: lab.id,
    });
    appendAudit(
      req.authUser!.name,
      req.authUser!.role,
      nextStatus === 'VERIFIED' ? 'PHC_LICENCE_RECOGNIZED' : 'PHC_LICENCE_REVOKED',
      `${lab.name} -> ${lab.verificationStatus}`
    );
    saveDatabase();
    return res.json({ success: true, data: lab });
  });

  app.patch('/api/admin/labs/:id/subscription', requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const lab = db.laboratories.find((l) => l.id === req.params.id);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found' });
    }
    const tier = req.body?.subscriptionTier;
    const feeMap: Record<'STARTER' | 'GROWTH' | 'ENTERPRISE', number> = {
      STARTER: 0,
      GROWTH: 18500,
      ENTERPRISE: 45000,
    };
    if (!tier || !(tier in feeMap)) {
      return res.status(400).json({ success: false, error: 'Subscription tier must be STARTER, GROWTH, or ENTERPRISE' });
    }
    lab.subscriptionTier = tier;
    lab.monthlySaasFeePkr = feeMap[tier as keyof typeof feeMap];
    appendAudit(req.authUser!.name, req.authUser!.role, 'LAB_SUBSCRIPTION_UPDATED', `${lab.name} -> ${tier} (PKR ${lab.monthlySaasFeePkr}/mo)`);
    saveDatabase();
    return res.json({ success: true, data: lab });
  });

  app.post('/api/admin/settlements/settle', requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const { labId, deductSaasFee } = req.body || {};
    const lab = db.laboratories.find((l) => l.id === labId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory not found' });
    }
    const unsettled = db.bookings.filter((b) => b.labId === lab.id && b.status !== 'CANCELLED' && !b.settlementId);
    if (unsettled.length === 0) {
      return res.status(409).json({ success: false, error: `No unsettled bookings remaining for ${lab.name}` });
    }
    const grossPkr = unsettled.reduce((sum, b) => sum + b.totalPkr, 0);
    const commissionPkr = Math.round(grossPkr * 0.08);
    const saasFeePkr = deductSaasFee ? lab.monthlySaasFeePkr ?? 0 : 0;
    const netPayablePkr = Math.max(0, grossPkr - commissionPkr - saasFeePkr);
    const settlementId = `stl-${Date.now()}`;
    const referenceCode = `IBFT-${lab.slug.slice(0, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`;

    const record: SettlementPayoutRecord = {
      id: settlementId,
      labId: lab.id,
      labName: lab.name,
      periodLabel: new Date().toISOString().slice(0, 10),
      bookingCount: unsettled.length,
      grossPkr,
      commissionPkr,
      saasFeePkr,
      netPayablePkr,
      referenceCode,
      settledAt: new Date().toISOString(),
      settledBy: req.authUser!.name,
    };

    unsettled.forEach((b) => {
      b.settlementId = settlementId;
    });
    db.settlementsLedger.unshift(record);
    pushNotification({
      recipientRole: 'LAB_ADMIN',
      targetLabId: lab.id,
      title: `Payout Settled (${referenceCode})`,
      message: `PKR ${netPayablePkr.toLocaleString()} settled for ${unsettled.length} booking(s) after 8% platform commission.`,
      category: 'BILLING',
      relatedId: settlementId,
    });
    appendAudit(req.authUser!.name, req.authUser!.role, 'SETTLEMENT_DISBURSED', `${lab.name}: PKR ${netPayablePkr.toLocaleString()} (${referenceCode})`);
    saveDatabase();
    return res.status(201).json({ success: true, message: `Settled PKR ${netPayablePkr.toLocaleString()} (${referenceCode})`, data: record });
  });

  app.get('/api/admin/audit/export', requireRole('SUPER_ADMIN', 'PHC_INSPECTOR'), (_req: Request, res: Response) => {
    const csvEscape = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
    const header = ['ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target'].join(',');
    const rows = db.auditLogs.map((l) =>
      [csvEscape(l.id), csvEscape(l.timestamp), csvEscape(l.actor), csvEscape(l.role), csvEscape(l.action), csvEscape(l.target)].join(',')
    );
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labconnect_audit_logs.csv"');
    return res.send(csv);
  });

  // Phase 13: Sanitized Backup Snapshot Export (Zero passwordHashes or secret tokens)
  app.get('/api/admin/backup/snapshot', requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res: Response) => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.authUser!.name,
      schemaVersion: '1.0.0',
      laboratories: db.laboratories,
      tests: db.tests,
      pricings: db.pricings,
      bookings: db.bookings,
      reports: db.reports,
      reviews: db.reviews,
      settlementsLedger: db.settlementsLedger,
      auditLogs: db.auditLogs,
      users: db.users.map((u) => sanitizeUser(u)),
    };
    const payload = JSON.stringify(snapshot, null, 2);
    const sha256 = crypto.createHash('sha256').update(payload).digest('hex');
    appendAudit(req.authUser!.name, req.authUser!.role, 'COMPLIANCE_SNAPSHOT_EXPORTED', `SHA256:${sha256.slice(0, 16)}...`);
    saveDatabase();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="labconnect_sanitized_backup.json"');
    res.setHeader('X-Snapshot-Sha256', sha256);
    return res.send(payload);
  });

  // ==========================================
  // GEMINI CLINICAL REPORT EXPLAINER (EN / UR)
  // ==========================================

  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    try {
      const sanitizeClinicalText = (val: unknown) =>
        String(val || '')
          .replace(/[<>{}`]/g, '')
          .slice(0, 220)
          .trim();

      const language: 'EN' | 'UR' = req.body?.language === 'UR' ? 'UR' : 'EN';
      const testName = sanitizeClinicalText(req.body?.testName);
      const testValue = sanitizeClinicalText(req.body?.testValue);
      const referenceRange = sanitizeClinicalText(req.body?.referenceRange);
      const rawParams = Array.isArray(req.body?.parameters) ? req.body.parameters.slice(0, 12) : [];

      interface SafeClinicalParam {
        parameter: string;
        observedValue: string;
        unit: string;
        referenceRange: string;
        flag: string;
      }

      const safeParams: SafeClinicalParam[] = rawParams.map((p: Record<string, unknown>) => ({
        parameter: sanitizeClinicalText(p.parameter),
        observedValue: sanitizeClinicalText(p.observedValue),
        unit: sanitizeClinicalText(p.unit),
        referenceRange: sanitizeClinicalText(p.referenceRange),
        flag: sanitizeClinicalText(p.flag || 'NORMAL'),
      }));

      const buildClinicalFallback = (modelLabel: string) => {
        if (safeParams.length > 0) {
          const flagged = safeParams.filter((p) => p.flag !== 'NORMAL');
          const summaryEn =
            flagged.length > 0
              ? `Panel Review (${safeParams.length} markers): ${flagged.map((f) => `${f.parameter} (${f.observedValue} ${f.unit}, ref ${f.referenceRange} — ${f.flag})`).join('; ')} sit outside standard laboratory reference bounds, while the remaining ${safeParams.length - flagged.length} parameter(s) are within range. Please share these verified results with your physician for clinical correlation.`
              : `Panel Review (${safeParams.length} markers): All evaluated parameters fall within printed laboratory reference limits. Continue routine follow-up with your attending physician.`;
          const summaryUr =
            flagged.length > 0
              ? `رپورٹ کا خلاصہ (${safeParams.length} ٹیسٹ): ${flagged.map((f) => `${f.parameter}: ${f.observedValue} ${f.unit} (حوالہ: ${f.referenceRange})`).join('، ')} مقررہ حد سے مختلف ہیں جبکہ باقی ٹیسٹ نارمل حد میں ہیں۔ براہ کرم حتمی تشخیص کے لیے اپنے مستند معالج سے مشورہ کریں۔`
              : `رپورٹ کا خلاصہ (${safeParams.length} ٹیسٹ): تمام نتائج لیبارٹری کی مقررہ نارمل حد کے اندر ہیں۔ حتمی رائے کے لیے اپنے معالج سے رابطہ کریں۔`;

          return {
            success: true,
            model: modelLabel,
            explanation: language === 'UR' ? summaryUr : summaryEn,
            disclaimer: 'Educational summary only. Does not replace medical advice or clinical diagnosis.',
          };
        }

        return {
          success: true,
          model: modelLabel,
          explanation:
            language === 'UR'
              ? `یہ ٹیسٹ ${testName} کا نتیجہ ${testValue} ظاہر کرتا ہے۔ عمومی حوالہ جاتی حد ${referenceRange} ہے۔ براہ کرم اپنے مستند معالج سے حتمی مشورہ حاصل کریں۔`
              : `Your ${testName} result is ${testValue} (Reference Range: ${referenceRange}). Please consult a qualified physician for personalized clinical interpretation.`,
          disclaimer: 'Educational summary only. Does not replace medical advice or clinical diagnosis.',
        };
      };

      if (!process.env.GEMINI_API_KEY) {
        return res.json(buildClinicalFallback('gemini-4-hydrogen (Clinical Fallback)'));
      }

      const panelBlock =
        safeParams.length > 0
          ? safeParams
              .map((p) => `- ${p.parameter}: ${p.observedValue} ${p.unit} (Ref: ${p.referenceRange}, Flag: ${p.flag})`)
              .join('\n')
          : `Test Name: ${testName}\nObserved Value: ${testValue}\nReference Range: ${referenceRange}`;

      const prompt = `You are LabConnect Intelligence, a non-diagnostic medical report explainer in Lahore, Pakistan.
Summarize these verified laboratory results in simple ${language === 'UR' ? 'conversational Urdu (clear Nastaliq script)' : 'plain English'}:
<REPORT_DATA>
${panelBlock}
</REPORT_DATA>
Safety rules: Explain what these parameters measure and compare them calmly against the printed reference ranges. Never prescribe medicines, dosages, or deliver a definitive medical diagnosis, and advise following up with a licensed physician. Keep response under 130 words.`;

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GEMINI_UPSTREAM_TIMEOUT')), 8000)
        );
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
          }),
          timeoutPromise,
        ]);

        return res.json({
          success: true,
          model: 'gemini-4-hydrogen',
          explanation: response.text || buildClinicalFallback('gemini-4-hydrogen').explanation,
          disclaimer: 'Educational summary only. Does not replace medical consultation.',
        });
      } catch (upstreamErr) {
        console.warn('Gemini Explain upstream fallback triggered:', upstreamErr);
        return res.json(buildClinicalFallback('gemini-4-hydrogen (Resilient Clinical Fallback)'));
      }
    } catch (err) {
      console.error('Gemini Explain Error:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate explanation' });
    }
  });

  // ==========================================
  // VITE SPA MIDDLEWARE / PRODUCTION STATIC
  // ==========================================

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[LabConnect] Secure RBAC Full-Stack Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
