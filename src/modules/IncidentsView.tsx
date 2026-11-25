import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, ShieldAlert } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import {
  getAllowedNextIncidentStatuses,
  INCIDENT_WORKFLOW_ORDER,
  PERMISSION_BY_ROLE,
} from '../lib/rbac';
import { NigeriaMap } from '../components/NigeriaMap';
import type {
  IncidentCategory,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
  IncidentVerification,
} from '../types/campaign';

const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'Operational issue',
  'Personnel assistance',
  'Logistics failure',
  'Communication outage',
  'Safety concern',
  'Event disruption',
  'Equipment issue',
  'Infrastructure issue',
  'Report discrepancy',
  'General emergency',
  'Other',
];

export const IncidentsView: React.FC = () => {
  const {
    branding,
    incidents,
    createIncident,
    updateIncident,
    departments,
    currentUser,
    stateSummaries,
    selectedStateCode,
    setSelectedStateCode,
  } = useCampaign();

  const [showCreate, setShowCreate] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [actionNote, setActionNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Operational issue' as IncidentCategory,
    severity: 'medium' as IncidentSeverity,
    verificationStatus: 'Unverified Report' as IncidentVerification,
    stateCode: 'KT',
    lga: 'Katsina',
    ward: '',
    assignedTeam: departments[4] || 'Incident Response & Safety',
    assignedSupervisor: 'Situation Room Director',
    description: '',
  });

  const isAdmin = PERMISSION_BY_ROLE[currentUser.role]?.admin ?? false;

  const filtered = useMemo(
    () =>
      incidents.filter((i) => {
        if (severityFilter !== 'All' && i.severity !== severityFilter) return false;
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;
        return true;
      }),
    [incidents, severityFilter, statusFilter]
  );

  const selectedIncident: IncidentRecord | undefined =
    incidents.find((i) => i.id === selectedIncidentId) ?? filtered[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 5) {
      setFormError('Incident title must be at least 5 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      setFormError('Detailed incident description is required (minimum 10 characters).');
      return;
    }
    createIncident({
      title: form.title.trim(),
      category: form.category,
      severity: form.severity,
      status: 'New',
      verificationStatus: form.verificationStatus,
      stateCode: form.stateCode,
      lga: form.lga,
      ward: form.ward.trim() || 'Unspecified Ward',
      description: form.description.trim(),
      reporterName: currentUser.displayName,
      reporterUid: currentUser.uid,
      assignedTeam: form.assignedTeam,
      assignedSupervisor: form.assignedSupervisor,
      isDemo: false,
    });
    setForm({ ...form, title: '', ward: '', description: '' });
    setShowCreate(false);
  };

  const lgas = STATE_BY_CODE[form.stateCode]?.lgas ?? [];
  const nextStatuses = selectedIncident
    ? getAllowedNextIncidentStatuses(selectedIncident.status, isAdmin)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Incident Management & Response Command
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            7-stage workflow (New → Closed) · Strict separation between Verified Facts, Unverified Reports, and Allegations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowMap((m) => !m)}
            className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            {showMap ? 'Hide Incident Map' : 'Show Incident Map'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((s) => !s)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0 text-xs font-semibold text-white rounded-md whitespace-nowrap"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> Log Incident
          </button>
        </div>
      </div>

      {/* Incident KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Total Logged</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">{incidents.length}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Open Incidents</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
            {incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Critical / High Priority</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {incidents.filter((i) => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'Resolved' && i.status !== 'Closed').length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Verified Facts vs Unverified</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">
            {incidents.filter((i) => i.verificationStatus === 'Verified Fact').length} /{' '}
            {incidents.filter((i) => i.verificationStatus !== 'Verified Fact').length}
          </div>
        </div>
      </div>

      {showMap && (
        <NigeriaMap
          stateSummaries={stateSummaries}
          selectedStateCode={selectedStateCode}
          onSelectState={setSelectedStateCode}
          layer="incidents"
          compact
        />
      )}

      {/* Create Incident Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold">Report Operational Incident</h3>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Never present an unverified incident as established fact
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Incident Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Objective summary of the operational incident"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as IncidentCategory })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Verification Classification</label>
              <select
                value={form.verificationStatus}
                onChange={(e) => setForm({ ...form, verificationStatus: e.target.value as IncidentVerification })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="Unverified Report">Unverified Report</option>
                <option value="Allegation">Allegation</option>
                <option value="Verified Fact">Verified Fact (Evidence Confirmed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assigned Team</label>
              <select
                value={form.assignedTeam}
                onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">State</label>
              <select
                value={form.stateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({ ...form, stateCode: code, lga: STATE_BY_CODE[code]?.lgas[0] || '' });
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">LGA</label>
              <select
                value={form.lga}
                onChange={(e) => setForm({ ...form, lga: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {lgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ward / Location</label>
              <input
                type="text"
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Incident Details & Immediate Impact *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            />
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Submit Incident to Command Queue
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs text-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Split Workspace: Incident List + Workflow Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold">Incident Queue ({filtered.length})</span>
            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                aria-label="Filter incidents by severity"
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="All">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter incidents by status"
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="All">All Statuses</option>
                {INCIDENT_WORKFLOW_ORDER.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((inc) => {
              const active = selectedIncident?.id === inc.id;
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`w-full text-left p-4 space-y-1 transition-colors ${
                    active
                      ? 'bg-slate-100/90 dark:bg-slate-800/70'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-slate-500">{inc.refCode} · {inc.category}</span>
                    <span
                      className={`font-semibold uppercase ${
                        inc.severity === 'critical'
                          ? 'text-red-700 dark:text-red-400'
                          : inc.severity === 'high'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {inc.severity} · {inc.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">{inc.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {inc.stateCode}/{inc.lga} · Verification: <strong>{inc.verificationStatus}</strong> · Team: {inc.assignedTeam}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Incident Inspector & Workflow Actions */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
          {!selectedIncident ? (
            <div className="text-xs text-slate-500 py-10 text-center">Select an incident to inspect timeline and actions.</div>
          ) : (
            <>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">{selectedIncident.refCode}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedIncident.title}
                </h3>
                <div className="text-[11px] text-slate-500 mt-1">
                  {selectedIncident.stateCode} / {selectedIncident.lga} · {selectedIncident.ward} · Reporter: {selectedIncident.reporterName}
                </div>
              </div>

              {/* Explicit Fact vs Unverified Distinction Notice */}
              <div
                className={`p-3 rounded-md border text-xs flex items-start gap-2 ${
                  selectedIncident.verificationStatus === 'Verified Fact'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                }`}
              >
                {selectedIncident.verificationStatus === 'Verified Fact' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">Classification: {selectedIncident.verificationStatus}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {selectedIncident.verificationStatus === 'Verified Fact'
                      ? 'Corroborated by field supervisor or documentary evidence.'
                      : 'Pending independent field corroboration. Do not treat as confirmed fact.'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedIncident.description}
              </p>

              {/* Workflow Advancement Panel */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold">Workflow Action & Verification Update</div>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter action note or resolution evidence before updating..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />

                <div className="flex flex-wrap gap-1.5">
                  {nextStatuses.map((nextSt) => (
                    <button
                      key={nextSt}
                      type="button"
                      onClick={() => {
                        updateIncident(selectedIncident.id, {
                          status: nextSt,
                          resolutionNotes: nextSt === 'Resolved' ? actionNote : undefined,
                          note: actionNote.trim() || `Transitioned workflow to ${nextSt}`,
                        });
                        setActionNote('');
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-900 dark:bg-slate-700 text-white rounded hover:opacity-90"
                    >
                      Move to {nextSt}
                    </button>
                  ))}
                  {selectedIncident.verificationStatus !== 'Verified Fact' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateIncident(selectedIncident.id, {
                          verificationStatus: 'Verified Fact',
                          note: actionNote.trim() || 'Corroborated and elevated to Verified Fact.',
                        });
                        setActionNote('');
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-medium text-white rounded"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Verify Fact
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Incident Timeline ({selectedIncident.timeline.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedIncident.timeline.map((t) => (
                    <div key={t.id} className="text-[11px] p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200/70 dark:border-slate-800">
                      <div className="flex items-center justify-between font-medium">
                        <span>{t.actor} → {t.status}</span>
                        <span className="font-mono text-slate-400">{t.timestamp.slice(11, 16)}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{t.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
