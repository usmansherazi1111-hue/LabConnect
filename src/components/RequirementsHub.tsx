/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SPECIFICATION_DOCS, REQUIREMENTS_CATALOGUE, CONTRADICTIONS_AND_MISSING_REQUIREMENTS } from '../data/requirementsData';
import { RequirementItem } from '../types';
import { Search, Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { AnimatedModal, AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { motion, AnimatePresence } from 'motion/react';

export const RequirementsHub: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('DOC-01-PRD');
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'TRACEABILITY_MATRIX' | 'CONTRADICTIONS_ANALYSIS'>('DOCUMENTS');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedReq, setSelectedReq] = useState<RequirementItem | null>(null);

  const selectedDoc = SPECIFICATION_DOCS.find((d) => d.id === selectedDocId) || SPECIFICATION_DOCS[0];

  const filteredRequirements = REQUIREMENTS_CATALOGUE.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || req.module === moduleFilter;
    const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
    return matchesSearch && matchesModule && matchesPriority;
  });

  const handleExportMarkdown = () => {
    const content = `# LABCONNECT — PHASE 0 PRODUCT & SOFTWARE SPECIFICATIONS
Generated on: ${new Date().toISOString()}
Target Market: Lahore, Punjab, Pakistan

${SPECIFICATION_DOCS.map((doc) => `## ${doc.title}\n\n${doc.contentMarkdown}\n\n---\n`).join('\n')}

# REQUIREMENTS TRACEABILITY MATRIX
${REQUIREMENTS_CATALOGUE.map(
  (r) =>
    `### [${r.id}] ${r.title}\n- Module: ${r.module} | Priority: ${r.priority} | Phase: ${r.responsiblePhase}\n- Description: ${r.description}\n- Acceptance Criteria:\n${r.acceptanceCriteria.map((c) => `  * ${c}`).join('\n')}\n- Security: ${r.securityImplications}\n- Test Case: ${r.testCaseRef}\n`
).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabConnect_Phase0_Specifications_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Page Header */}
      <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono font-semibold text-[#087F8C] uppercase tracking-wider mb-1">
            <span>Phase 0 Deliverable</span>
            <span className="text-[#C8DDD7]" aria-hidden="true">·</span>
            <span>Product Definition &amp; Requirements</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172C32] tracking-tight">
            Requirements &amp; Architecture Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#556B70] mt-1.5 max-w-3xl leading-relaxed">
            Formal Phase 0 baseline covering Product Requirements (PRD), Software Specifications (SRS),
            Business Modeling (BRD), normalized database schema, STRIDE threat models, and
            Requirements Traceability Matrix with 50+ unique requirement identifiers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white lc-gradient-ocean hover:brightness-110 rounded-xl transition-all shadow-xs min-h-[42px]"
          >
            <Download className="w-4 h-4 text-[#21D4C2]" />
            <span>Export Specs (.MD)</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Nav Controls */}
      <AnimatedTabBar
        layoutId="req-hub-subtabs"
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'DOCUMENTS', label: 'Specifications', count: SPECIFICATION_DOCS.length },
          { id: 'TRACEABILITY_MATRIX', label: 'Traceability Matrix', count: REQUIREMENTS_CATALOGUE.length },
          { id: 'CONTRADICTIONS_ANALYSIS', label: 'Policy Resolutions', count: CONTRADICTIONS_AND_MISSING_REQUIREMENTS.length },
        ]}
      />

      <AnimatePresence mode="wait">
        {/* TAB 1: SPECIFICATION DOCUMENTS */}
        {activeTab === 'DOCUMENTS' && (
          <motion.div
            key="TAB_DOCS"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Document Sidebar */}
            <div className="lg:col-span-4 min-w-0 bg-white border border-[#D9E9E5] rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#556B70] px-2 py-1">
                Phase 0 Formal Deliverables
              </div>
              <div className="space-y-1.5 max-h-[420px] lg:max-h-[640px] overflow-y-auto pr-1">
                {SPECIFICATION_DOCS.map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#D9E9E5]/65 text-[#073B43] font-semibold border border-[#087F8C]'
                          : 'hover:bg-[#F3F7F4] text-[#172C32] border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#172C32] leading-snug">{doc.title}</div>
                        <div className="text-[#556B70] mt-1 line-clamp-1">{doc.summary}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#087F8C] shrink-0">
                        v{doc.version.split('-')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Document Reader */}
            <div className="lg:col-span-8 min-w-0 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-8">
              <div className="border-b border-[#D9E9E5] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono font-bold text-[#087F8C] bg-[#D9E9E5]/60 px-2.5 py-0.5 rounded-lg">
                    {selectedDoc.id}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#172C32] mt-2 break-words">
                    {selectedDoc.title}
                  </h2>
                  <p className="text-xs text-[#556B70] mt-1">{selectedDoc.summary}</p>
                </div>
                <div className="text-left sm:text-right text-xs text-[#087F8C] font-mono font-semibold shrink-0">
                  Status: Verified Approved
                </div>
              </div>

              <div className="max-w-full overflow-x-auto text-xs sm:text-sm leading-relaxed">
                <pre className="whitespace-pre-wrap break-words font-sans text-[#172C32] bg-transparent p-0 border-0 max-w-full">
                  {selectedDoc.contentMarkdown}
                </pre>
              </div>

              {selectedDoc.relatedRequirementIds.length > 0 && (
                <div className="mt-8 pt-4 border-t border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-semibold text-[#556B70] shrink-0">Traceable Requirement IDs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.relatedRequirementIds.map((rid) => (
                      <button
                        key={rid}
                        type="button"
                        onClick={() => {
                          setSearchTerm(rid);
                          setActiveTab('TRACEABILITY_MATRIX');
                        }}
                        className="text-xs font-mono bg-[#F3F7F4] hover:bg-[#D9E9E5] text-[#073B43] px-2.5 py-1 rounded-lg border border-[#C8DDD7] transition-colors"
                      >
                        {rid}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: TRACEABILITY MATRIX */}
        {activeTab === 'TRACEABILITY_MATRIX' && (
          <motion.div
            key="TAB_MATRIX"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6 min-w-0"
          >
            <div className="bg-white border border-[#D9E9E5] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-full max-w-md">
                  <Search className="w-4 h-4 text-[#087F8C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by ID (AUTH-001, PAT-001) or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white min-h-[40px]"
                  />
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-[#087F8C] hover:text-[#073B43] shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#556B70] font-medium">Module:</span>
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="text-xs bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl px-2.5 py-2 text-[#172C32]"
                  >
                    <option value="ALL">All Modules</option>
                    <option value="AUTH">AUTH (Identity &amp; RBAC)</option>
                    <option value="PAT">PAT (Patient Discovery)</option>
                    <option value="LAB">LAB (Laboratory SaaS)</option>
                    <option value="BOOK">BOOK (Booking &amp; Logistics)</option>
                    <option value="REPORT">REPORT (Reports &amp; Health Passport)</option>
                    <option value="AI">AI (Intelligence &amp; Safety)</option>
                    <option value="SEC">SEC (Security &amp; Privacy)</option>
                    <option value="ADMIN">ADMIN (PHC &amp; Compliance)</option>
                    <option value="COMMERCIAL">COMMERCIAL (Subscriptions &amp; Ledger)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#556B70] font-medium">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-xs bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl px-2.5 py-2 text-[#172C32]"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="P0_CRITICAL">P0 (Critical Launch Blocker)</option>
                    <option value="P1_HIGH">P1 (High Priority)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F7F4] border-b border-[#D9E9E5] text-[#556B70] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-28">ID</th>
                      <th className="py-3 px-4 w-32">Module</th>
                      <th className="py-3 px-4">Title &amp; Description</th>
                      <th className="py-3 px-4 w-32">Priority</th>
                      <th className="py-3 px-4 w-24">Phase</th>
                      <th className="py-3 px-4 w-28">Status</th>
                      <th className="py-3 px-4 w-28">Test Ref</th>
                      <th className="py-3 px-4 w-16 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E9E5]">
                    {filteredRequirements.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedReq(req)}
                        className="hover:bg-[#F3F7F4]/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#073B43]">{req.id}</td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-mono bg-[#D9E9E5]/65 text-[#073B43] px-2 py-0.5 rounded-md font-semibold">
                            {req.module}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172C32]">{req.title}</div>
                          <div className="text-[#556B70] line-clamp-1 mt-0.5">{req.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                              req.priority === 'P0_CRITICAL'
                                ? 'bg-[#FF927E]/25 text-[#9C2A1A] border-[#FF927E]'
                                : 'bg-[#A5B9FF]/30 text-[#073B43] border-[#A5B9FF]/60'
                            }`}
                          >
                            {req.priority === 'P0_CRITICAL' ? 'P0 Critical' : 'P1 High'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#556B70]">Phase {req.responsiblePhase}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-mono font-semibold text-[#087F8C]">
                            {req.status === 'IN_PROGRESS' ? 'Phase 0 Ready' : 'Planned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#556B70]">{req.testCaseRef}</td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-[#087F8C] inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredRequirements.length === 0 && (
                <div className="py-12 text-center text-[#556B70] text-xs">
                  No requirements match your active filter criteria.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: CONTRADICTIONS & POLICY RESOLUTIONS */}
        {activeTab === 'CONTRADICTIONS_ANALYSIS' && (
          <motion.div
            key="TAB_CONTRADICTIONS"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6 min-w-0"
          >
            <div className="bg-[#A5B9FF]/20 border border-[#A5B9FF]/60 rounded-2xl p-5 text-[#172C32] text-xs space-y-2">
              <div className="font-bold text-sm text-[#073B43] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#087F8C]" />
                <span>Phase 0 Regulatory &amp; Operational Conflict Analysis</span>
              </div>
              <p className="text-[#172C32]/90 leading-relaxed">
                All ambiguous or conflicting business and legal rules for the Pakistani diagnostic ecosystem have been
                analyzed, reconciled, and documented with explicit operational decisions prior to implementation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CONTRADICTIONS_AND_MISSING_REQUIREMENTS.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#D9E9E5] rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#087F8C]">{item.id}</span>
                      <span className="text-[10px] font-mono font-bold text-[#172C32] bg-[#B9ED69]/55 px-2 py-0.5 rounded-md">
                        RESOLVED
                      </span>
                    </div>
                    <h3 className="font-bold text-[#172C32] text-sm mb-2">{item.topic}</h3>
                    <div className="text-xs text-[#556B70] bg-[#F3F7F4] p-3 rounded-xl border border-[#D9E9E5]">
                      <span className="font-bold text-[#172C32]">Problem Analysis: </span>
                      {item.analysis}
                    </div>
                  </div>

                  <div className="text-xs text-[#073B43] bg-[#D9E9E5]/65 p-3.5 rounded-xl border border-[#087F8C]/25">
                    <span className="font-bold text-[#073B43]">Architectural Resolution: </span>
                    {item.resolution}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requirement Details Modal */}
      <AnimatedModal isOpen={Boolean(selectedReq)} onClose={() => setSelectedReq(null)} maxWidthClass="max-w-2xl">
        {selectedReq && (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-[#D9E9E5] pb-4 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#073B43] bg-[#D9E9E5] px-2.5 py-0.5 rounded-lg">
                    {selectedReq.id}
                  </span>
                  <span className="text-xs font-mono text-[#556B70]">Module: {selectedReq.module}</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#172C32] mt-2">{selectedReq.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-[#556B70] hover:text-[#172C32] text-sm font-semibold p-1.5"
                aria-label="Close requirement specification"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="font-bold text-[#556B70] uppercase tracking-wider text-[10px] mb-1">Description</div>
                <p className="text-[#172C32] leading-relaxed bg-[#F3F7F4] p-3.5 rounded-xl border border-[#D9E9E5]">
                  {selectedReq.description}
                </p>
              </div>

              <div>
                <div className="font-bold text-[#556B70] uppercase tracking-wider text-[10px] mb-1">
                  Acceptance Criteria (Mandatory Pass Gates)
                </div>
                <ul className="space-y-1.5 list-disc pl-5 text-[#172C32]">
                  {selectedReq.acceptanceCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-bold text-[#556B70] uppercase tracking-wider text-[10px] mb-1">
                  Security &amp; Threat Defense
                </div>
                <div className="bg-[#FF927E]/20 text-[#172C32] p-3.5 rounded-xl border border-[#FF927E]">
                  {selectedReq.securityImplications}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D9E9E5] text-[#556B70]">
                <div>
                  <span className="text-[10px] uppercase font-semibold">Responsible Phase:</span>
                  <div className="font-mono font-bold text-[#172C32]">Phase {selectedReq.responsiblePhase}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold">Automated Test Case:</span>
                  <div className="font-mono font-bold text-[#172C32]">{selectedReq.testCaseRef}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-5 py-2.5 lc-gradient-ocean text-white rounded-xl text-xs font-semibold hover:brightness-110"
              >
                Close Specification
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};
