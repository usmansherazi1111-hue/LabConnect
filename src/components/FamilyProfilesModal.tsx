/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, FamilyMember } from '../context/AuthContext';
import { Users, UserPlus, CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';
import { AnimatedModal, LC_EASE } from './ui/MotionPrimitives';
import { AnimatePresence, motion } from 'motion/react';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!user) return null;

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
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6 space-y-5 pb-safe">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFE8] text-[#174C3C] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
                Family Health Passport
              </span>
              <h3 className="text-lg font-bold text-[#202A27]">Family &amp; Dependent Profiles</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737D78] hover:text-[#202A27] p-2 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
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
              ? 'bg-[#E8EFE8]/70 border-[#174C3C]'
              : 'bg-white hover:bg-[#F8F8F3] border-[#DCE4DE]'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#202A27] text-sm">{user.name}</span>
              <span className="text-[11px] font-mono text-[#737D78]">· Self (Primary)</span>
            </div>
            {activeFamilyMember === null && (
              <span className="text-[11px] font-semibold text-[#174C3C] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Target
              </span>
            )}
          </div>
          <div className="text-xs text-[#737D78] mt-1 font-mono">
            {user.phone} · {user.area}
          </div>
        </div>

        {/* Existing Family Members List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#737D78] uppercase tracking-wider">
            <span>Linked Dependents ({user.familyMembers.length})</span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="text-[#174C3C] hover:text-[#28745B] font-semibold flex items-center gap-1.5 text-xs normal-case"
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
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-[#E8EFE8]/70 border-[#174C3C]'
                      : 'bg-white hover:bg-[#F8F8F3] border-[#DCE4DE]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#202A27]">{member.name}</span>
                      <span className="text-[11px] text-[#737D78]">
                        · {member.relationship} · <span className="font-mono text-[#174C3C]">{member.bloodGroup}</span>
                      </span>
                    </div>
                    {member.notes && <div className="text-[11px] text-[#737D78] truncate">{member.notes}</div>}
                    <div className="text-[10px] text-[#737D78]/80 font-mono">
                      Consent logged: {new Date(member.consentGrantedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="text-[11px] font-semibold text-[#174C3C] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                    {confirmDeleteId === member.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeFamilyMember(member.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-lg text-[10px] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(member.id);
                        }}
                        title="Remove dependent profile"
                        className="text-[#737D78] hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADD FAMILY MEMBER FORM */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: LC_EASE }}
              onSubmit={handleAddSubmit}
              className="overflow-hidden"
            >
              <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[#202A27] text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#174C3C]" />
                  <span>Register Family Member</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Parveen Bibi"
                      className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1">Relationship</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value as FamilyMember['relationship'])}
                      className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2.5 text-[#202A27]"
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

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as FamilyMember['gender'])}
                      className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2 text-[#202A27]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2 font-mono text-[#202A27]"
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
                    <label className="block font-semibold text-[#202A27] mb-1">Birth Date</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2 text-[#202A27] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#202A27] mb-1">Chronic Conditions / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Hypertension, Diabetes, Thyroid medication"
                    className="w-full bg-white border border-[#DCE4DE] rounded-lg p-2.5 text-[#202A27]"
                  />
                </div>

                <div className="p-3 bg-amber-50/75 border border-amber-200 rounded-lg">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consentConfirmed}
                      onChange={(e) => setConsentConfirmed(e.target.checked)}
                      className="mt-0.5 rounded accent-[#174C3C]"
                    />
                    <span className="text-[11px] text-amber-950 font-medium leading-relaxed">
                      <strong>Legal Healthcare Consent (Punjab):</strong> I confirm explicit permission from this family member to book tests and access diagnostic reports.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3.5 py-2 text-[#737D78] hover:text-[#202A27] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name || !consentConfirmed}
                    className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-lg font-semibold disabled:opacity-45 transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Confirm & Link Profile'}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </AnimatedModal>
  );
};
