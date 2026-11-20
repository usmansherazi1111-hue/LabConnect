/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DATABASE_ENTITIES } from '../data/requirementsData';
import { DatabaseEntity } from '../types';
import { Database, Network, Key, Layers, ShieldCheck, Cpu } from 'lucide-react';
import { AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { motion, AnimatePresence } from 'motion/react';

export const ArchitectureViewer: React.FC = () => {
  const [selectedEntityName, setSelectedEntityName] = useState<string>('bookings');
  const [activeTab, setActiveTab] = useState<'SYSTEM_TOPOLOGY' | 'RELATIONAL_ERD' | 'SQL_SCHEMA'>('SYSTEM_TOPOLOGY');

  const selectedEntity = DATABASE_ENTITIES.find((e) => e.table === selectedEntityName) || DATABASE_ENTITIES[0];

  const generateSqlDdl = (entity: DatabaseEntity) => {
    const cols = entity.columns
      .map(
        (c) =>
          `  ${c.name.padEnd(24)} ${c.type.padEnd(28)} ${c.constraints}${
            c.references ? ` REFERENCES ${c.references}` : ''
          }`
      )
      .join(',\n');
    return `CREATE TABLE ${entity.table} (\n${cols}\n);`;
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono font-semibold text-[#087F8C] uppercase tracking-wider mb-1">
            <span>Phase 0 Architecture &amp; Engineering</span>
            <span className="text-[#C8DDD7]" aria-hidden="true">·</span>
            <span>Modular Monolith &amp; Data Layer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172C32] tracking-tight">
            System Architecture &amp; Database ERD
          </h1>
          <p className="text-xs sm:text-sm text-[#556B70] mt-1.5 max-w-3xl leading-relaxed">
            Normalized relational database schema with strict foreign-key integrity, explicit data provenance
            fields, audit logging, and single-port deployment on Express + Vite.
          </p>
        </div>

        <AnimatedTabBar
          layoutId="arch-viewer-subtabs"
          activeId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: 'SYSTEM_TOPOLOGY', label: 'Topology' },
            { id: 'RELATIONAL_ERD', label: 'ERD Explorer' },
            { id: 'SQL_SCHEMA', label: 'PostgreSQL DDL' },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: SYSTEM TOPOLOGY */}
        {activeTab === 'SYSTEM_TOPOLOGY' && (
          <motion.div
            key="ARCH_TOPOLOGY"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6 min-w-0"
          >
            <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#172C32] mb-1.5 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#087F8C] shrink-0" />
                <span>Multi-Portal Monolith Architecture Diagram</span>
              </h2>
              <p className="text-xs text-[#556B70] mb-5">
                Four isolated client portals sharing a secure Node.js Express backend with RBAC tenant isolation middleware.
              </p>

              {/* Scrollable ASCII System Architecture Layout constrained within parent */}
              <div className="lc-gradient-midnight text-[#D9E9E5] rounded-2xl p-4 sm:p-6 font-mono text-[11px] sm:text-xs max-w-full overflow-x-auto leading-relaxed border border-[#087F8C]/35">
                <pre className="w-max min-w-full">{`┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     CLIENT USER EXPERIENCE                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │     PATIENT PORTAL       │  │   LABORATORY SAAS OPS    │  │   ADMIN & PHC CONSOLE    │   │
│  │  - Test Search & Filters │  │  - Booking Intake Queue  │  │  - PHC Licence Audit     │   │
│  │  - Price Comparison      │  │  - Phlebotomy Dispatch   │  │  - Commission Ledger     │   │
│  │  - Home Sample Booking   │  │  - PDF Report Upload     │  │  - Verified Badge Gate   │   │
│  │  - Health Passport       │  │  - Tariff Management     │  │  - Audit Log Monitor     │   │
│  └────────────┬─────────────┘  └────────────┬─────────────┘  └────────────┬─────────────┘   │
│               │                             │                             │                 │
│  ┌────────────┴─────────────────────────────┴─────────────────────────────┴──────────────┐  │
│  │           ISOLATED PORTAL ROUTER & AUTH CONTEXT (REACT 19 + TAILWIND)                 │  │
│  └──────────────────────────────────────────┬────────────────────────────────────────────┘  │
└─────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                              │ HTTPS / REST / HMAC Session + Strict RBAC
┌─────────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                NODE.JS / EXPRESS CORE ENGINE                                │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Security & Gateway Middleware: Rate Limiter, Scrypt Auth, Input Validation, RBAC      │  │
│  └───────────────────┬──────────────────────┬──────────────────────┬─────────────────────┘  │
│                      │                      │                      │                        │
│         ┌────────────▼────────┐    ┌────────▼────────────┐   ┌─────▼──────────────────┐     │
│         │ Marketplace Service │    │ Booking & Logistics │   │ LabConnect AI Layer    │     │
│         │ - Lahore Directory  │    │ - Concurrency Lock  │   │ - Gemini 2.5 Flash     │     │
│         │ - Verified Tariffs  │    │ - Phlebotomist Route│   │ - Urdu Report Explainer│     │
│         │ - Synonym Engine    │    │ - Report Matching   │   │ - Clinical Guardrails  │     │
│         └────────────┬────────┘    └────────┬────────────┘   └─────┬──────────────────┘     │
│                      │                      │                      │                        │
│  ┌───────────────────▼──────────────────────▼──────────────────────▼─────────────────────┐  │
│  │ RELATIONAL DATA REPOSITORY (Normalized Persistent Storage Engine)                     │  │
│  │ - laboratories, laboratory_branches, diagnostic_tests, laboratory_test_prices         │  │
│  │ - users, patients, family_members, bookings, booking_items, diagnostic_reports       │  │
│  │ - Immutable audit_logs, commissions, and Punjab Healthcare Commission (PHC) audits    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘`}</pre>
              </div>
            </div>

            {/* Architecture Principles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-[#D9E9E5] text-[#073B43] flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#172C32] text-sm mb-1">Tenant &amp; Object-Level Isolation</h3>
                <p className="text-xs text-[#556B70] leading-relaxed">
                  Every laboratory query strictly enforces{' '}
                  <code className="font-mono text-[#087F8C] font-semibold">WHERE lab_id = :sessionLabId</code>.
                  Reports are verified via SHA-256 checksums and scoped session authorization.
                </p>
              </div>

              <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-[#B9ED69]/50 text-[#172C32] flex items-center justify-center mb-3">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#172C32] text-sm mb-1">Lahore Provenance Schema</h3>
                <p className="text-xs text-[#556B70] leading-relaxed">
                  Test prices contain provenance audit fields:{' '}
                  <code className="font-mono text-[#087F8C] font-semibold">verified_by</code>,{' '}
                  <code className="font-mono text-[#087F8C] font-semibold">last_confirmed_at</code>, and{' '}
                  <code className="font-mono text-[#087F8C] font-semibold">data_source</code>, anchored on Chughtai,
                  SKMCH, IDC, and Excel Labs.
                </p>
              </div>

              <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl lc-gradient-ai border border-[#A5B9FF]/50 text-[#073B43] flex items-center justify-center mb-3">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#172C32] text-sm mb-1">Server-Side GenAI Security</h3>
                <p className="text-xs text-[#556B70] leading-relaxed">
                  All LabConnect Intelligence calls invoke{' '}
                  <code className="font-mono text-[#087F8C] font-semibold">@google/genai</code> server-side.
                  API keys are never exposed to the browser bundle.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: RELATIONAL ERD EXPLORER */}
        {activeTab === 'RELATIONAL_ERD' && (
          <motion.div
            key="ARCH_ERD"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0"
          >
            {/* Entity List */}
            <div className="lg:col-span-4 min-w-0 bg-white border border-[#D9E9E5] rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#556B70] px-2 py-1 mb-1">
                Database Tables ({DATABASE_ENTITIES.length})
              </div>
              {DATABASE_ENTITIES.map((entity) => {
                const isSelected = entity.table === selectedEntityName;
                return (
                  <button
                    key={entity.table}
                    type="button"
                    onClick={() => setSelectedEntityName(entity.table)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#D9E9E5]/65 text-[#073B43] font-bold border border-[#087F8C]'
                        : 'hover:bg-[#F3F7F4] text-[#172C32] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Database className="w-3.5 h-3.5 text-[#087F8C] shrink-0" />
                      <span className="font-mono truncate">{entity.table}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#556B70] shrink-0">
                      {entity.columns.length} cols
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table Details */}
            <div className="lg:col-span-8 min-w-0 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-[#D9E9E5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold font-mono text-[#172C32] truncate">
                    {selectedEntity.table}
                  </h2>
                  <p className="text-xs text-[#556B70] mt-1">{selectedEntity.description}</p>
                </div>
                <span className="text-xs font-mono bg-[#F3F7F4] border border-[#D9E9E5] text-[#073B43] px-2.5 py-1 rounded-lg self-start sm:self-center shrink-0 font-semibold">
                  Entity: {selectedEntity.name}
                </span>
              </div>

              <div className="overflow-x-auto border border-[#D9E9E5] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F7F4] text-[#556B70] font-semibold uppercase tracking-wider border-b border-[#D9E9E5]">
                    <tr>
                      <th className="py-2.5 px-3">Column Name</th>
                      <th className="py-2.5 px-3">Data Type</th>
                      <th className="py-2.5 px-3">Constraints</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E9E5] font-mono text-[11px]">
                    {selectedEntity.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-[#F3F7F4]/60">
                        <td className="py-2.5 px-3 font-bold text-[#172C32] flex items-center gap-1.5 whitespace-nowrap">
                          {col.isPrimaryKey && <Key className="w-3 h-3 text-[#087F8C] shrink-0" />}
                          {col.isForeignKey && <Network className="w-3 h-3 text-[#073B43] shrink-0" />}
                          <span>{col.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[#556B70] whitespace-nowrap">{col.type}</td>
                        <td className="py-2.5 px-3 text-[#556B70]">
                          <span className="bg-[#F3F7F4] border border-[#D9E9E5] px-1.5 py-0.5 rounded text-[10px]">
                            {col.constraints}
                          </span>
                          {col.references && (
                            <span className="block text-[10px] text-[#087F8C] mt-0.5">
                              → {col.references}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#556B70] font-sans text-xs min-w-[200px]">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedEntity.relationships.length > 0 && (
                <div className="bg-[#F3F7F4] p-4 rounded-xl border border-[#D9E9E5] space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[#556B70] tracking-wider">
                    Relational Cardinality &amp; Dependencies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntity.relationships.map((rel, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono bg-white border border-[#D9E9E5] text-[#073B43] px-2.5 py-1 rounded-lg"
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: POSTGRESQL DDL GENERATOR */}
        {activeTab === 'SQL_SCHEMA' && (
          <motion.div
            key="ARCH_SQL"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6 min-w-0"
          >
            <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#172C32]">PostgreSQL DDL Migration Scripts</h2>
                  <p className="text-xs text-[#556B70]">
                    Ready-to-execute schema definitions with constraints, indexes, and foreign keys.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#073B43] bg-[#D9E9E5] px-2.5 py-1 rounded-lg font-semibold self-start sm:self-center">
                  PostgreSQL 15+ Compatible
                </span>
              </div>

              <div className="lc-gradient-midnight text-[#B9ED69] p-5 sm:p-6 rounded-2xl font-mono text-xs max-w-full overflow-x-auto leading-relaxed border border-[#087F8C]/35 space-y-6">
                {DATABASE_ENTITIES.map((entity) => (
                  <div key={entity.table}>
                    <div className="text-[#21D4C2]/80">-- Table: {entity.name} ({entity.description})</div>
                    <pre className="text-[#F3F7F4]">{generateSqlDdl(entity)}</pre>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
