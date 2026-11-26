import React, { useMemo, useState } from 'react';
import { Check, Download, Lock, Search, ShieldCheck, X } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { ROLE_PERMISSION_MATRIX } from '../lib/rbac';
import { exportRowsToCsv } from '../lib/analytics';

const COMPLIANCE_CONTROLS = [
  {
    title: 'Zero Voter Profiling & Persuasion Scoring',
    detail: 'All analytics compute aggregate geographic coverage, incident response, and operational readiness. No individual voter dossiers or predictive scoring models exist.',
  },
  {
    title: 'Strict PII Isolation & Firestore Rules',
    detail: 'Sensitive contact fields are isolated under /users/{uid}/private/info with verified-email enforcement and default-deny Firestore security rules.',
  },
  {
    title: 'Immutable Audit Logging',
    detail: 'Audit logs are append-only in Firestore (update and delete permanently denied) capturing actor UID, role, timestamp, entity, and before/after transitions.',
  },
  {
    title: 'Fact vs. Allegation & Non-INEC Attribution',
    detail: 'Incidents enforce Unverified Report / Allegation / Verified Fact separation, and campaign submissions are explicitly labeled Campaign-Reported Data.',
  },
  {
    title: 'Consent-Verified Communications & Location',
    detail: 'GPS check-in sharing is strictly opt-in per submission with visible disclosure; external communications require verified recipient opt-in consent.',
  },
];

export const SecurityAuditView: React.FC = () => {
  const { auditLogs, currentUser, firebaseSyncActive } = useCampaign();

  const [tab, setTab] = useState<'audit' | 'rbac' | 'compliance'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('All');

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return auditLogs.filter((l) => {
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, searchTerm]);

  const filteredRoles = useMemo(
    () =>
      ROLE_PERMISSION_MATRIX.filter(
        (r) => scopeFilter === 'All' || r.scope === scopeFilter
      ),
    [scopeFilter]
  );

  const handleExportAuditCsv = () => {
    const csv = exportRowsToCsv(
      ['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Entity ID', 'Summary', 'Source'],
      filteredLogs.map((l) => [
        l.timestamp,
        l.actorName,
        l.actorRole,
        l.action,
        l.entity,
        l.entityId,
        l.summary,
        l.source,
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Security, RBAC & Audit Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            21-role permission architecture, geographic scoping enforcement, immutable audit logs, and ethical compliance safeguards.
          </p>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span>
            Session: <strong>{currentUser.role}</strong> ·{' '}
            {firebaseSyncActive ? 'Verified Cloud Auth' : 'Demo Evaluation Mode'}
          </span>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'audit' as const, label: `Immutable Audit Log (${auditLogs.length})` },
          { id: 'rbac' as const, label: `21-Role Permission Matrix` },
          { id: 'compliance' as const, label: 'Data Protection & Non-Profiling Controls' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === item.id
                ? 'bg-slate-900 text-white dark:bg-slate-700'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'audit' && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Filter immutable audit logs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search action, actor, entity, or summary..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleExportAuditCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" /> Export Audit CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/70 dark:bg-slate-900/50">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Actor & Role</th>
                  <th className="py-2.5 px-4 font-semibold">Action / Entity</th>
                  <th className="py-2.5 px-4 font-semibold">Operational Summary</th>
                  <th className="py-2.5 px-4 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{log.actorName}</div>
                      <div className="text-[11px] text-slate-500">{log.actorRole}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {log.entity} · {log.entityId}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      {log.summary}
                      {log.previousValue && log.newValue && (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {log.previousValue} → {log.newValue}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      {log.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rbac' && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Showing {filteredRoles.length} of {ROLE_PERMISSION_MATRIX.length} configured enterprise campaign roles.
            </div>
            <select
              aria-label="Filter roles by geographic scope"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Geographic Scopes</option>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="LGA">LGA</option>
              <option value="Ward">Ward</option>
              <option value="Assigned Unit">Assigned Unit</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/70 dark:bg-slate-900/50">
                  <th className="py-2.5 px-4 font-semibold">Role</th>
                  <th className="py-2.5 px-4 font-semibold">Geo Scope</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Read</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Write</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Approve</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Export</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Admin</th>
                  <th className="py-2.5 px-4 font-semibold">Responsibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRoles.map((r) => (
                  <tr
                    key={r.role}
                    className={
                      currentUser.role === r.role
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    }
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.role}
                      {currentUser.role === r.role && (
                        <span className="ml-2 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {r.scope}
                    </td>
                    {[r.read, r.write, r.approve, r.exportData, r.admin].map((allowed, i) => (
                      <td key={i} className="py-2.5 px-3 text-center">
                        {allowed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 inline" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 inline" />
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 max-w-sm">
                      {r.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPLIANCE_CONTROLS.map((ctrl) => (
            <div
              key={ctrl.title}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-2"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {ctrl.title}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ctrl.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
