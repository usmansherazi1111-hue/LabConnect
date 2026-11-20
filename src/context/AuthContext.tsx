/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { UserRole } from '../types';
import {
  apiClient,
  AuthScope,
  getStoredToken,
  setStoredToken,
  getStoredUserSnapshot,
  setStoredUserSnapshot,
} from '../api/client';
import { auth, googleProvider } from '../lib/firebase';
import { getCloudUserProfile, upsertCloudUserProfile } from '../lib/cloudStore';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Sibling' | 'Other';
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  dateOfBirth: string;
  consentGrantedAt: string;
  notes?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  staffCode?: string;
  labId?: string;
  branchId?: string;
  area: string;
  familyMembers: FamilyMember[];
  createdAt: string;
}

function normalizePakistaniPhone(raw: string): string {
  const cleaned = (raw || '').trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('03')) return '+92' + cleaned.slice(1);
  if (cleaned.startsWith('923')) return '+' + cleaned;
  if (/^3\d{9}$/.test(cleaned)) return '+92' + cleaned;
  return cleaned;
}

interface AuthContextType {
  authReady: boolean;
  patientUser: AuthUser | null;
  labUser: AuthUser | null;
  phlebUser: AuthUser | null;
  adminUser: AuthUser | null;
  activeFamilyMember: FamilyMember | null;
  setActiveFamilyMember: (member: FamilyMember | null) => void;
  signInWithGoogle: (
    portal: 'patient' | 'lab' | 'phlebotomist',
    meta?: { labId?: string; branchId?: string; staffCode?: string; fullName?: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  sendPhoneSmsOtp: (
    phone: string,
    recaptchaContainerId: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyPhoneSmsOtp: (
    code: string,
    portal: 'patient' | 'lab' | 'phlebotomist',
    extra?: { name?: string; email?: string; labId?: string; branchId?: string; staffCode?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (
    email: string,
    portal: 'patient' | 'lab' | 'phlebotomist'
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyEmailOtp: (params: {
    email: string;
    otp: string;
    portal: 'patient' | 'lab' | 'phlebotomist';
    name?: string;
    phone?: string;
    labId?: string;
    branchId?: string;
    staffCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOtp: (
    phone: string,
    otp: string,
    name?: string,
    email?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updatePatientProfile: (data: { name?: string; email?: string; area?: string }) => Promise<{ success: boolean; error?: string }>;
  loginLabStaff: (
    email: string,
    password: string,
    labId: string,
    branchId: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerLabStaff: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    labId: string;
    branchId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginPhlebotomist: (
    staffCode: string,
    phone: string,
    cnicLast4: string,
    labId?: string,
    branchId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerPhlebotomist: (data: {
    fullName: string;
    staffCode: string;
    phone: string;
    cnicLast4: string;
    labId: string;
    branchId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setupAdmin: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  addFamilyMember: (data: {
    name: string;
    relationship: FamilyMember['relationship'];
    gender: FamilyMember['gender'];
    bloodGroup: string;
    dateOfBirth: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  removeFamilyMember: (id: string) => Promise<void>;
  logoutScope: (scope: AuthScope) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [patientUser, setPatientUser] = useState<AuthUser | null>(null);
  const [labUser, setLabUser] = useState<AuthUser | null>(null);
  const [phlebUser, setPhlebUser] = useState<AuthUser | null>(null);
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [activeFamilyMember, setActiveFamilyMember] = useState<FamilyMember | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const applyPortalSession = (
    scope: AuthScope,
    user: AuthUser,
    sessionToken?: string | null
  ) => {
    if (sessionToken) setStoredToken(sessionToken, scope);
    setStoredUserSnapshot(user, scope);
    if (scope === 'patient') setPatientUser(user);
    else if (scope === 'lab') setLabUser(user);
    else if (scope === 'phlebotomist') setPhlebUser(user);
    else if (scope === 'admin') setAdminUser(user);
  };

  useEffect(() => {
    const isRoleValidForScope = (scope: AuthScope, role: UserRole) => {
      if (scope === 'patient') return role === 'PATIENT';
      if (scope === 'lab') return role === 'LAB_ADMIN';
      if (scope === 'phlebotomist') return role === 'PHLEBOTOMIST';
      if (scope === 'admin') return role === 'SUPER_ADMIN' || role === 'PHC_INSPECTOR';
      return false;
    };

    const scopes: { scope: AuthScope; setter: React.Dispatch<React.SetStateAction<AuthUser | null>> }[] = [
      { scope: 'patient', setter: setPatientUser },
      { scope: 'lab', setter: setLabUser },
      { scope: 'phlebotomist', setter: setPhlebUser },
      { scope: 'admin', setter: setAdminUser },
    ];

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return;
      const snapshotPatient = getStoredUserSnapshot('patient');
      if (snapshotPatient && snapshotPatient.id === fbUser.uid) {
        setPatientUser(snapshotPatient);
      }
      const snapshotPhleb = getStoredUserSnapshot('phlebotomist');
      if (snapshotPhleb && snapshotPhleb.id === fbUser.uid) {
        setPhlebUser(snapshotPhleb);
      }
    });

    Promise.all(
      scopes.map(async ({ scope, setter }) => {
        const hasToken = Boolean(getStoredToken(scope));
        const snapshot = getStoredUserSnapshot(scope);
        if (!hasToken && !snapshot) return;
        try {
          const res = await apiClient.getCurrentUser(scope);
          if (res.success && res.user && isRoleValidForScope(scope, res.user.role)) {
            setter(res.user);
            setStoredUserSnapshot(res.user, scope);
          } else if (snapshot && isRoleValidForScope(scope, snapshot.role) && auth.currentUser) {
            setter(snapshot);
          } else {
            setStoredToken(null, scope);
            setStoredUserSnapshot(null, scope);
          }
        } catch {
          if (snapshot && isRoleValidForScope(scope, snapshot.role) && auth.currentUser) {
            setter(snapshot);
          }
        }
      })
    ).finally(() => {
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const finalizeFirebaseUserSession = async (
    portal: 'patient' | 'lab' | 'phlebotomist',
    firebaseUser: NonNullable<typeof auth.currentUser>,
    meta?: { labId?: string; branchId?: string; staffCode?: string; fullName?: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const idToken = await firebaseUser.getIdToken();

    // Sync profile to Cloud Firestore for Patient and Phlebotomist portals (always-on APK + Web)
    let cloudUser: AuthUser | null = null;
    if (portal === 'patient' || portal === 'phlebotomist') {
      try {
        const existing = await getCloudUserProfile(firebaseUser.uid).catch(() => null);
        const defaultName =
          meta?.fullName?.trim() ||
          firebaseUser.displayName ||
          existing?.name ||
          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'LabConnect User');
        const resolvedCode =
          meta?.staffCode?.trim().toUpperCase() ||
          existing?.staffCode ||
          (portal === 'phlebotomist' ? `MOTO-${firebaseUser.uid.slice(0, 4).toUpperCase()}` : undefined);

        cloudUser = await upsertCloudUserProfile({
          uid: firebaseUser.uid,
          name: portal === 'phlebotomist' && !defaultName.includes('(') && resolvedCode
            ? `${defaultName} (${resolvedCode})`
            : defaultName,
          email: firebaseUser.email || existing?.email || undefined,
          phone: meta?.phone || firebaseUser.phoneNumber || existing?.phone || undefined,
          role: portal === 'phlebotomist' ? 'PHLEBOTOMIST' : 'PATIENT',
          labId: meta?.labId || existing?.labId || (portal === 'phlebotomist' ? 'lab-chughtai' : undefined),
          branchId: meta?.branchId || existing?.branchId || (portal === 'phlebotomist' ? 'c-branch-jailrd' : undefined),
          staffCode: resolvedCode,
          area: existing?.area || 'Lahore, Punjab',
          familyMembers: existing?.familyMembers || [],
        });
      } catch (err) {
        console.warn('[CloudStore] Profile sync fallback:', err);
      }
    }

    // Exchange Firebase ID token with Express RBAC backend if online
    const backendRes = await apiClient.exchangeFirebaseToken({
      idToken,
      portal,
      labId: meta?.labId,
      branchId: meta?.branchId,
      staffCode: meta?.staffCode,
      fullName: meta?.fullName || firebaseUser.displayName || undefined,
      phone: meta?.phone || firebaseUser.phoneNumber || undefined,
    });

    if (backendRes.success && backendRes.user && backendRes.sessionToken) {
      const mergedUser: AuthUser = cloudUser
        ? { ...backendRes.user, familyMembers: cloudUser.familyMembers.length ? cloudUser.familyMembers : backendRes.user.familyMembers }
        : backendRes.user;
      applyPortalSession(portal, mergedUser, backendRes.sessionToken);
      return { success: true };
    }

    if (backendRes.error && !backendRes.networkError) {
      return { success: false, error: backendRes.error };
    }

    // Always-on Cloud Firestore session when backend container is offline (e.g. standalone APK)
    if (cloudUser) {
      applyPortalSession(portal, cloudUser, `firebase:${firebaseUser.uid}`);
      return { success: true };
    }

    // Minimal fallback for lab user only if Express is temporarily restarting
    if (portal === 'lab') {
      return {
        success: false,
        error: backendRes.error || 'Branch Lead Console server is offline. Please ensure the web server is running.',
      };
    }

    const fallbackUser: AuthUser = {
      id: firebaseUser.uid,
      name: meta?.fullName || firebaseUser.displayName || firebaseUser.email || 'Verified User',
      phone: meta?.phone || firebaseUser.phoneNumber || '+923000000000',
      email: firebaseUser.email || '',
      role: portal === 'phlebotomist' ? 'PHLEBOTOMIST' : 'PATIENT',
      labId: meta?.labId,
      branchId: meta?.branchId,
      staffCode: meta?.staffCode,
      area: 'Lahore, Punjab',
      familyMembers: [],
      createdAt: new Date().toISOString(),
    };
    applyPortalSession(portal, fallbackUser, `firebase:${firebaseUser.uid}`);
    return { success: true };
  };

  const signInWithGoogle = async (
    portal: 'patient' | 'lab' | 'phlebotomist',
    meta?: { labId?: string; branchId?: string; staffCode?: string; fullName?: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return await finalizeFirebaseUserSession(portal, cred.user, meta);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Google sign-in popup was closed before completing.' };
      }
      if (code === 'auth/popup-blocked') {
        return { success: false, error: 'Browser blocked the Google Sign-In popup. Allow popups or use Real-Time Email OTP.' };
      }
      if (code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'This domain is not yet allowlisted in Firebase Auth. Use Real-Time Email OTP or authorize the domain in Firebase Console.',
        };
      }
      return { success: false, error: err?.message || 'Google authentication failed.' };
    }
  };

  const sendPhoneSmsOtp = async (
    phone: string,
    recaptchaContainerId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const normalized = normalizePakistaniPhone(phone);
    if (!/^\+923\d{9}$/.test(normalized)) {
      return {
        success: false,
        error: 'Enter a valid Pakistani mobile number (03XX XXXXXXX or +92 3XX XXXXXXX).',
      };
    }

    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
      });
      recaptchaVerifierRef.current = verifier;

      const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
      confirmationResultRef.current = confirmation;
      return {
        success: true,
        message: `Real-time 6-digit SMS code dispatched to ${normalized}.`,
      };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error:
            'Phone SMS Auth is not yet enabled in Firebase Console (Authentication -> Sign-in method -> Phone). Use Google Sign-In or Email OTP meanwhile.',
        };
      }
      if (code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many SMS OTP requests. Please wait a few minutes.' };
      }
      return {
        success: false,
        error: err?.message || 'Unable to send real-time SMS verification code.',
      };
    }
  };

  const verifyPhoneSmsOtp = async (
    code: string,
    portal: 'patient' | 'lab' | 'phlebotomist',
    extra?: { name?: string; email?: string; labId?: string; branchId?: string; staffCode?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Enter the 6-digit SMS verification code.' };
    }
    if (!confirmationResultRef.current) {
      return { success: false, error: 'No active SMS verification session. Request a new code.' };
    }
    try {
      const cred = await confirmationResultRef.current.confirm(cleanCode);
      confirmationResultRef.current = null;
      return await finalizeFirebaseUserSession(portal, cred.user, {
        fullName: extra?.name,
        labId: extra?.labId,
        branchId: extra?.branchId,
        staffCode: extra?.staffCode,
      });
    } catch (err: any) {
      const errCode = err?.code || '';
      if (errCode === 'auth/invalid-verification-code') {
        return { success: false, error: 'Incorrect 6-digit SMS verification code.' };
      }
      if (errCode === 'auth/code-expired') {
        return { success: false, error: 'Verification code expired. Request a new SMS code.' };
      }
      return { success: false, error: err?.message || 'SMS verification failed.' };
    }
  };

  const sendEmailOtp = async (email: string, portal: 'patient' | 'lab' | 'phlebotomist') => {
    return await apiClient.sendEmailOtp(email, portal);
  };

  const verifyEmailOtp = async (params: {
    email: string;
    otp: string;
    portal: 'patient' | 'lab' | 'phlebotomist';
    name?: string;
    phone?: string;
    labId?: string;
    branchId?: string;
    staffCode?: string;
  }) => {
    const res = await apiClient.verifyEmailOtp(params);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession(params.portal, res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Email code verification failed' };
  };

  const sendOtp = async (phone: string) => {
    const res = await apiClient.sendOtp(phone);
    if (res.success) return res;
    return {
      success: false,
      error: res.error || 'SMS service unavailable. Try Google Sign-In or Firebase SMS verification.',
    };
  };

  const verifyOtp = async (phone: string, otp: string, name?: string, email?: string) => {
    const res = await apiClient.verifyOtp(phone, otp, name, email);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('patient', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'OTP verification failed' };
  };

  const updatePatientProfile = async (data: { name?: string; email?: string; area?: string }) => {
    const res = await apiClient.updatePatientProfile(data);
    if (res.success && res.user) {
      setPatientUser(res.user);
      setStoredUserSnapshot(res.user, 'patient');
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update profile' };
  };

  const loginLabStaff = async (email: string, password: string, labId: string, branchId: string) => {
    const res = await apiClient.loginLabStaff(email, password, labId, branchId);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('lab', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Laboratory sign-in failed' };
  };

  const registerLabStaff = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    labId: string;
    branchId: string;
  }) => {
    const res = await apiClient.registerLabStaff(data);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('lab', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Laboratory staff registration failed' };
  };

  const loginPhlebotomist = async (staffCode: string, phone: string, cnicLast4: string, labId?: string, branchId?: string) => {
    const res = await apiClient.loginPhlebotomist(staffCode, phone, cnicLast4, labId, branchId);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('phlebotomist', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Courier authentication failed' };
  };

  const registerPhlebotomist = async (data: {
    fullName: string;
    staffCode: string;
    phone: string;
    cnicLast4: string;
    labId: string;
    branchId: string;
  }) => {
    const res = await apiClient.registerPhlebotomist(data);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('phlebotomist', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Courier registration failed' };
  };

  const loginAdmin = async (email: string, password: string) => {
    const res = await apiClient.loginAdmin(email, password);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('admin', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Admin authentication failed' };
  };

  const setupAdmin = async (name: string, email: string, password: string) => {
    const res = await apiClient.setupFirstAdmin(name, email, password);
    if (res.success && res.user && res.sessionToken) {
      applyPortalSession('admin', res.user, res.sessionToken);
      return { success: true };
    }
    return { success: false, error: res.error || 'Admin setup failed' };
  };

  const addFamilyMember = async (data: {
    name: string;
    relationship: FamilyMember['relationship'];
    gender: FamilyMember['gender'];
    bloodGroup: string;
    dateOfBirth: string;
    notes?: string;
  }) => {
    const res = await apiClient.addFamilyMember(data);
    if (res.success && res.familyMembers && patientUser) {
      const updated = { ...patientUser, familyMembers: res.familyMembers };
      setPatientUser(updated);
      setStoredUserSnapshot(updated, 'patient');
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to add family member' };
  };

  const removeFamilyMember = async (id: string) => {
    const res = await apiClient.removeFamilyMember(id);
    if (res.success && res.familyMembers && patientUser) {
      const updated = { ...patientUser, familyMembers: res.familyMembers };
      setPatientUser(updated);
      setStoredUserSnapshot(updated, 'patient');
      if (activeFamilyMember?.id === id) {
        setActiveFamilyMember(null);
      }
    }
  };

  const logoutScope = async (scope: AuthScope) => {
    await apiClient.logout(scope);
    if (scope === 'patient' || scope === 'phlebotomist') {
      await firebaseSignOut(auth).catch(() => {});
    }
    if (scope === 'patient') {
      setPatientUser(null);
      setActiveFamilyMember(null);
    } else if (scope === 'lab') {
      setLabUser(null);
    } else if (scope === 'phlebotomist') {
      setPhlebUser(null);
    } else if (scope === 'admin') {
      setAdminUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authReady,
        patientUser,
        labUser,
        phlebUser,
        adminUser,
        activeFamilyMember,
        setActiveFamilyMember,
        signInWithGoogle,
        sendPhoneSmsOtp,
        verifyPhoneSmsOtp,
        sendEmailOtp,
        verifyEmailOtp,
        sendOtp,
        verifyOtp,
        updatePatientProfile,
        loginLabStaff,
        registerLabStaff,
        loginPhlebotomist,
        registerPhlebotomist,
        loginAdmin,
        setupAdmin,
        addFamilyMember,
        removeFamilyMember,
        logoutScope,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
