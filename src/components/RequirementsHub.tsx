/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SPECIFICATION_DOCS, REQUIREMENTS_CATALOGUE, CONTRADICTIONS_AND_MISSING_REQUIREMENTS } from '../data/requirementsData';
import { RequirementItem, RequirementModule, PriorityLevel } from '../types';
import { Search, Download, CheckCircle, ShieldAlert, FileText, ChevronRight, Filter, AlertTriangle, Layers, ExternalLink } from 'lucide-react';

export const RequirementsHub: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('DOC-01-PRD');
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'TRACEABILITY_MATRIX' | 'CONTRADICTIONS_ANALYSIS'>('DOCUMENTS');
  
  // Traceability filters
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
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>Phase 0 Deliverable</span>
            <span aria-hidden="true">·</span>
            <span>Product Definition & Requirements Finalization</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Requirements & Architecture Hub
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Formal Phase 0 baseline covering Product Requirements (PRD), Software Specifications (SRS), 
            Business Modeling (BRD), normalized database schema, STRIDE threat models, and 
            Requirements Traceability Matrix with 50+ unique requirement identifiers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F5132] rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Phase 0 Specs (.MD)</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Nav Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
            activeTab === 'DOCUMENTS'
              ? 'bg-white border-t border-x border-slate-200 text-[#0F5132] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Specification Documents (20 Documents)
        </button>
        <button
          onClick={() => setActiveTab('TRACEABILITY_MATRIX')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'TRACEABILITY_MATRIX'
              ? 'bg-white border-t border-x border-slate-200 text-[#0F5132] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Requirements Traceability Matrix</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded">
            {REQUIREMENTS_CATALOGUE.length} IDs
          </span>
        </button>
        <button
          onClick={() => setActiveTab('CONTRADICTIONS_ANALYSIS')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'CONTRADICTIONS_ANALYSIS'
              ? 'bg-white border-t border-x border-slate-200 text-[#0F5132] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Contradictions & Policy Resolutions</span>
          <span className="text-xs bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded">
            3 Resolved
          </span>
        </button>
      </div>

      {/* TAB 1: SPECIFICATION DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Document Sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
              Phase 0 Formal Deliverables
            </div>
            <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1">
              {SPECIFICATION_DOCS.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 leading-tight">{doc.title}</div>
                      <div className="text-slate-500 mt-1 line-clamp-1">{doc.summary}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">v{doc.version.split('-')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Document Reader */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
            <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedDoc.id}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">{selectedDoc.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedDoc.summary}</p>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono">
                Status: Verified Approved
              </div>
            </div>

            {/* Document Markdown Content */}
            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4">
              <pre className="whitespace-pre-wrap font-sans text-slate-800 bg-transparent p-0 border-0 overflow-x-auto">
                {selectedDoc.contentMarkdown}
              </pre>
            </div>

            {/* Linked Requirement Tags */}
            {selectedDoc.relatedRequirementIds.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Traceable Requirement IDs:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.relatedRequirementIds.map((rid) => (
                    <button
                      key={rid}
                      onClick={() => {
                        setSearchTerm(rid);
                        setActiveTab('TRACEABILITY_MATRIX');
                      }}
                      className="text-xs font-mono bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                    >
                      {rid}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRACEABILITY MATRIX */}
      {activeTab === 'TRACEABILITY_MATRIX' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by ID (AUTH-001, PAT-001) or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Module:</span>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800"
                >
                  <option value="ALL">All Modules</option>
                  <option value="AUTH">AUTH (Identity & RBAC)</option>
                  <option value="PAT">PAT (Patient Discovery)</option>
                  <option value="LAB">LAB (Laboratory SaaS)</option>
                  <option value="BOOK">BOOK (Booking & Logistics)</option>
                  <option value="REPORT">REPORT (Reports & Health Passport)</option>
                  <option value="AI">AI (Intelligence & Safety)</option>
                  <option value="SEC">SEC (Security & Privacy)</option>
                  <option value="ADMIN">ADMIN (PHC & Compliance)</option>
                  <option value="COMMERCIAL">COMMERCIAL (Subscriptions & Ledger)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="P0_CRITICAL">P0 (Critical Launch Blocker)</option>
                  <option value="P1_HIGH">P1 (High Priority)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Traceability Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-28">ID</th>
                    <th className="py-3 px-4 w-32">Module</th>
                    <th className="py-3 px-4">Title & Description</th>
                    <th className="py-3 px-4 w-28">Priority</th>
                    <th className="py-3 px-4 w-24">Phase</th>
                    <th className="py-3 px-4 w-28">Status</th>
                    <th className="py-3 px-4 w-28">Test Ref</th>
                    <th className="py-3 px-4 w-20 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequirements.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{req.id}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {req.module}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.title}</div>
                        <div className="text-slate-500 line-clamp-1 mt-0.5">{req.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            req.priority === 'P0_CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {req.priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">Phase {req.responsiblePhase}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono text-slate-600">
                          {req.status === 'IN_PROGRESS' ? 'Phase 0 Ready' : 'Planned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{req.testCaseRef}</td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRequirements.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No requirements match your active filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTRADICTIONS & POLICY RESOLUTIONS */}
      {activeTab === 'CONTRADICTIONS_ANALYSIS' && (
        <div className="space-y-6">
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 text-amber-950 text-xs space-y-2">
            <div className="font-semibold text-sm text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Phase 0 Regulatory & Operational Conflict Analysis</span>
            </div>
            <p>
              In accordance with Section 3 of the Master Instructions, all ambiguous or conflicting business 
              and legal rules for the Pakistani diagnostic ecosystem have been analyzed, reconciled, and documented 
              with explicit operational decisions prior to code implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTRADICTIONS_AND_MISSING_REQUIREMENTS.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-600">{item.id}</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      RESOLVED
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">{item.topic}</h3>
                  <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-semibold text-slate-700">Problem Analysis: </span>
                    {item.analysis}
                  </div>
                </div>

                <div className="text-xs text-emerald-950 bg-emerald-50/80 p-3 rounded-lg border border-emerald-200">
                  <span className="font-bold text-[#0F5132]">Architectural Resolution: </span>
                  {item.resolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirement Details Modal Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#0F5132] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {selectedReq.id}
                  </span>
                  <span className="text-xs font-mono text-slate-500">Module: {selectedReq.module}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedReq.title}</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Description
                </div>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedReq.description}
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Acceptance Criteria (Mandatory Pass Gates)
                </div>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-800">
                  {selectedReq.acceptanceCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Security & Threat Defense
                </div>
                <div className="bg-rose-50 text-rose-950 p-3 rounded-lg border border-rose-200">
                  {selectedReq.securityImplications}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-slate-600">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Responsible Phase:</span>
                  <div className="font-mono font-semibold text-slate-800">Phase {selectedReq.responsiblePhase}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Automated Test Case:</span>
                  <div className="font-mono font-semibold text-slate-800">{selectedReq.testCaseRef}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
