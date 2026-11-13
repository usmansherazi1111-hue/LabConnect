/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DATABASE_ENTITIES } from '../data/requirementsData';
import { DatabaseEntity } from '../types';
import { Database, Network, Key, Layers, Server, ShieldCheck, Cpu, Code } from 'lucide-react';

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
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <span>Phase 0 Architecture & Engineering</span>
            <span aria-hidden="true">·</span>
            <span>Modular Monolith & PostgreSQL Data Layer</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            System Architecture & Database ERD
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Normalized relational database schema with strict foreign-key integrity, explicit data provenance 
            fields, audit logging, and single-port deployment on Express + Vite.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('SYSTEM_TOPOLOGY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'SYSTEM_TOPOLOGY'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Topology
          </button>
          <button
            onClick={() => setActiveTab('RELATIONAL_ERD')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'RELATIONAL_ERD'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Relational ERD Explorer
          </button>
          <button
            onClick={() => setActiveTab('SQL_SCHEMA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'SQL_SCHEMA'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PostgreSQL DDL
          </button>
        </div>
      </div>

      {/* VIEW 1: SYSTEM TOPOLOGY */}
      {activeTab === 'SYSTEM_TOPOLOGY' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-800" />
              <span>Multi-Portal Monolith Architecture Diagram</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Three unified client portals sharing a secure Node.js Express backend with tenant isolation middleware.
            </p>

            {/* ASCII System Architecture Layout */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-6 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              <pre>{`┌─────────────────────────────────────────────────────────────────────────────────────────────┐
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
│  │           UNIFIED APPLICATION SHELL & ACTOR SWITCHER (REACT 19 + TAILWIND)             │  │
│  └──────────────────────────────────────────┬────────────────────────────────────────────┘  │
└─────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                              │ HTTPS / REST / Bearer JWT + Strict CSRF
┌─────────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                NODE.JS / EXPRESS CORE ENGINE                                │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Security & Gateway Middleware: Rate Limiter, Argon2id Auth, Zod Validation, RBAC     │  │
│  └───────────────────┬──────────────────────┬──────────────────────┬─────────────────────┘  │
│                      │                      │                      │                        │
│         ┌────────────▼────────┐    ┌────────▼────────────┐   ┌─────▼──────────────────┐     │
│         │ Marketplace Service │    │ Booking & Logistics │   │ LabConnect AI Layer    │     │
│         │ - Lahore Directory  │    │ - Concurrency Lock  │   │ - Gemini 3.8 Flash     │     │
│         │ - Verified Tariffs  │    │ - Phlebotomist Route│   │ - Urdu Report Explainer│     │
│         │ - Synonym Engine    │    │ - Report Matching   │   │ - Clinical Guardrails  │     │
│         └────────────┬────────┘    └────────┬────────────┘   └─────┬──────────────────┘     │
│                      │                      │                      │                        │
│  ┌───────────────────▼──────────────────────▼──────────────────────▼─────────────────────┐  │
│  │ RELATIONAL DATA REPOSITORY (PostgreSQL Storage Engine)                                │  │
│  │ - laboratories, laboratory_branches, diagnostic_tests, laboratory_test_prices         │  │
│  │ - users, patients, family_members, bookings, booking_items, diagnostic_reports       │  │
│  │ - Immutable audit_logs, commissions, and Punjab Healthcare Commission (PHC) audits    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘`}</pre>
            </div>
          </div>

          {/* Architecture Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Tenant & Object-Level Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every laboratory query strictly enforces <code className="font-mono text-emerald-700">WHERE lab_id = :sessionLabId</code>. 
                Reports are accessed via short-lived 15-minute signed URLs; direct object references are strictly prohibited.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Lahore Provenance Schema</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test prices contain provenance audit fields: <code className="font-mono text-emerald-700">verified_by</code>, 
                <code className="font-mono text-emerald-700">last_confirmed_at</code>, and <code className="font-mono text-emerald-700">data_source</code>, 
                anchored on Chughtai Lab, SKMCH, IDC, and Excel Labs.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Server-Side GenAI Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All LabConnect Intelligence calls invoke <code className="font-mono text-emerald-700">@google/genai</code> server-side 
                with <code className="font-mono text-emerald-700">gemini-3.8-flash</code>. API keys are never exposed to the client bundle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RELATIONAL ERD EXPLORER */}
      {activeTab === 'RELATIONAL_ERD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Entity List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 py-1 mb-2">
              Database Tables ({DATABASE_ENTITIES.length})
            </div>
            {DATABASE_ENTITIES.map((entity) => {
              const isSelected = entity.table === selectedEntityName;
              return (
                <button
                  key={entity.table}
                  onClick={() => setSelectedEntityName(entity.table)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{entity.table}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{entity.columns.length} cols</span>
                </button>
              );
            })}
          </div>

          {/* Table Details */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-mono text-slate-900">{selectedEntity.table}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedEntity.description}</p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                Entity: {selectedEntity.name}
              </span>
            </div>

            {/* Columns Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Constraints</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {selectedEntity.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        {col.isPrimaryKey && <Key className="w-3 h-3 text-amber-500 shrink-0" />}
                        {col.isForeignKey && <Network className="w-3 h-3 text-emerald-600 shrink-0" />}
                        <span>{col.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{col.type}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {col.constraints}
                        </span>
                        {col.references && (
                          <span className="block text-[10px] text-emerald-700 mt-0.5">
                            → {col.references}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans text-xs">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Foreign Key Relationships */}
            {selectedEntity.relationships.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Relational Cardinality & Dependencies
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEntity.relationships.map((rel, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded shadow-2xs"
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: POSTGRESQL DDL GENERATOR */}
      {activeTab === 'SQL_SCHEMA' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">PostgreSQL DDL Migration Scripts</h2>
                <p className="text-xs text-slate-500">
                  Ready-to-execute schema definitions with constraints, indexes, and foreign keys.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                PostgreSQL 15+ Compatible
              </span>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-6 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 space-y-6">
              {DATABASE_ENTITIES.map((entity) => (
                <div key={entity.table}>
                  <div className="text-slate-500">-- Table: {entity.name} ({entity.description})</div>
                  <pre>{generateSqlDdl(entity)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
