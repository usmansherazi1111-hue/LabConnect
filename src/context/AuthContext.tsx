/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types';
import { apiClient, AuthScope, getStoredToken, setStoredToken } from '../api/client';

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

interface AuthContextType {
  patientUser: AuthUser | null;
  labUser: AuthUser | null;
  phlebUser: AuthUser | null;
  adminUser: AuthUser | null;
  activeFamilyMember: FamilyMember | null;
  setActiveFamilyMember: (member: FamilyMember | null) => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; demoCode?: string; error?: string }>;
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
  const [patientUser, setPatientUser] = useState<AuthUser | null>(null);
  const [labUser, setLabUser] = useState<AuthUser | null>(null);
  const [phlebUser, setPhlebUser] = useState<AuthUser | null>(null);
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [activeFamilyMember, setActiveFamilyMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    const scopes: { scope: AuthScope; setter: React.Dispatch<React.SetStateAction<AuthUser | null>> }[] = [
      { scope: 'patient', setter: setPatientUser },
      { scope: 'lab', setter: setLabUser },
      { scope: 'phlebotomist', setter: setPhlebUser },
      { scope: 'admin', setter: setAdminUser },
    ];

    scopes.forEach(async ({ scope, setter }) => {
      if (!getStoredToken(scope)) return;
      try {
        const res = await apiClient.getCurrentUser(scope);
        if (res.success && res.user) {
          setter(res.user);
        } else {
          setStoredToken(null, scope);
        }
      } catch {
        setStoredToken(null, scope);
      }
    });
  }, []);

  const sendOtp = async (phone: string) => {
    try {
      return await apiClient.sendOtp(phone);
    } catch {
      return { success: false, error: 'Network error sending OTP' };
    }
  };

  const verifyOtp = async (phone: string, otp: string, name?: string, email?: string) => {
    try {
      const res = await apiClient.verifyOtp(phone, otp, name, email);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'patient');
        setPatientUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'OTP verification failed' };
    } catch {
      return { success: false, error: 'Network error verifying OTP' };
    }
  };

  const updatePatientProfile = async (data: { name?: string; email?: string; area?: string }) => {
    try {
      const res = await apiClient.updatePatientProfile(data);
      if (res.success && res.user) {
        setPatientUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to update profile' };
    } catch {
      return { success: false, error: 'Network error updating profile' };
    }
  };

  const loginLabStaff = async (email: string, password: string, labId: string, branchId: string) => {
    try {
      const res = await apiClient.loginLabStaff(email, password, labId, branchId);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'lab');
        setLabUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Laboratory sign-in failed' };
    } catch {
      return { success: false, error: 'Network error signing into Laboratory Portal' };
    }
  };

  const registerLabStaff = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    labId: string;
    branchId: string;
  }) => {
    try {
      const res = await apiClient.registerLabStaff(data);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'lab');
        setLabUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Laboratory staff registration failed' };
    } catch {
      return { success: false, error: 'Network error registering staff' };
    }
  };

  const loginPhlebotomist = async (staffCode: string, phone: string, labId?: string, branchId?: string) => {
    try {
      const res = await apiClient.loginPhlebotomist(staffCode, phone, labId, branchId);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'phlebotomist');
        setPhlebUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Courier authentication failed' };
    } catch {
      return { success: false, error: 'Network error authenticating courier' };
    }
  };

  const registerPhlebotomist = async (data: {
    fullName: string;
    staffCode: string;
    phone: string;
    cnicLast4: string;
    labId: string;
    branchId: string;
  }) => {
    try {
      const res = await apiClient.registerPhlebotomist(data);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'phlebotomist');
        setPhlebUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Courier registration failed' };
    } catch {
      return { success: false, error: 'Network error registering courier' };
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const res = await apiClient.loginAdmin(email, password);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'admin');
        setAdminUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Admin authentication failed' };
    } catch {
      return { success: false, error: 'Network error signing into Admin Console' };
    }
  };

  const setupAdmin = async (name: string, email: string, password: string) => {
    try {
      const res = await apiClient.setupFirstAdmin(name, email, password);
      if (res.success && res.user && res.sessionToken) {
        setStoredToken(res.sessionToken, 'admin');
        setAdminUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Admin setup failed' };
    } catch {
      return { success: false, error: 'Network error initializing Admin Console' };
    }
  };

  const addFamilyMember = async (data: {
    name: string;
    relationship: FamilyMember['relationship'];
    gender: FamilyMember['gender'];
    bloodGroup: string;
    dateOfBirth: string;
    notes?: string;
  }) => {
    try {
      const res = await apiClient.addFamilyMember(data);
      if (res.success && res.familyMembers && patientUser) {
        setPatientUser({ ...patientUser, familyMembers: res.familyMembers });
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to add family member' };
    } catch {
      return { success: false, error: 'Network error adding family member' };
    }
  };

  const removeFamilyMember = async (id: string) => {
    try {
      const res = await apiClient.removeFamilyMember(id);
      if (res.success && res.familyMembers && patientUser) {
        setPatientUser({ ...patientUser, familyMembers: res.familyMembers });
        if (activeFamilyMember?.id === id) {
          setActiveFamilyMember(null);
        }
      }
    } catch (err) {
      console.error('Failed to remove family member:', err);
    }
  };

  const logoutScope = async (scope: AuthScope) => {
    await apiClient.logout(scope);
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
        patientUser,
        labUser,
        phlebUser,
        adminUser,
        activeFamilyMember,
        setActiveFamilyMember,
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
