/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, FamilyMember } from '../context/AuthContext';
import { Users, UserPlus, CheckCircle2, AlertCircle, Trash2, ShieldCheck, Heart } from 'lucide-react';

interface FamilyProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyProfilesModal: React.FC<FamilyProfilesModalProps> = ({ isOpen, onClose }) => {
  const { patientUser: user, activeFamilyMember, setActiveFamilyMember, addFamilyMember, removeFamilyMember } = useAuth();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('Father');
  const [gender, setGender] = useState<FamilyMember['gender']>('Male');
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [dateOfBirth, setDateOfBirth] = useState<string>('1960-01-01');
  const [notes, setNotes] = useState<string>('');
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentConfirmed) {
      setErrorMsg('You must confirm explicit consent to manage diagnostic records on behalf of this family member.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await addFamilyMember({
      name,
      relationship,
      gender,
      bloodGroup,
      dateOfBirth,
      notes,
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsAdding(false);
      setName('');
      setNotes('');
      setConsentConfirmed(false);
    } else {
      setErrorMsg(res.error || 'Failed to add family member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Phase 2 · Family Health Passport
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Family & Dependent Profiles
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Patient Status Card */}
        <div
          onClick={() => setActiveFamilyMember(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFamilyMember === null
              ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
              <span className="text-[10px] font-mono font-bold bg-[#0F5132] text-white px-2 py-0.5 rounded">
                Self (Primary)
              </span>
            </div>
            {activeFamilyMember === null && (
              <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Booking Target
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {user.phone} · {user.area}
          </div>
        </div>

        {/* Existing Family Members List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <span>Linked Family Dependents ({user.familyMembers.length})</span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Family Member</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {user.familyMembers.map((member) => {
              const isSelected = activeFamilyMember?.id === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => setActiveFamilyMember(member)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{member.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {member.relationship}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {member.bloodGroup}
                      </span>
                    </div>
                    {member.notes && <div className="text-[11px] text-slate-500">{member.notes}</div>}
                    <div className="text-[10px] text-slate-400 font-mono">
                      Consent logged: {new Date(member.consentGrantedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFamilyMember(member.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADD FAMILY MEMBER FORM */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#0F5132]" />
              <span>Register Family Member</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Parveen Bibi"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship:</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as FamilyMember['relationship'])}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child / Dependent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as FamilyMember['gender'])}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group:</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth:</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chronic Conditions / Medical Notes (Optional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Hypertension, Diabetes, Thyroid medication"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>

            {/* Explicit Legal Consent Checkbox (AUTH-003) */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span className="text-[11px] text-amber-950 font-medium">
                  <strong>Legal Healthcare Consent (Punjab):</strong> I confirm that I have obtained explicit permission from this family member to book tests and access their diagnostic reports.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name || !consentConfirmed}
                className="px-4 py-2 bg-[#0F5132] text-white rounded-lg font-semibold hover:bg-emerald-800 disabled:bg-slate-300"
              >
                {isSubmitting ? 'Saving...' : 'Confirm & Link Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
