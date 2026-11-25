import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Headphones, PhoneCall, PhoneIncoming, ShieldAlert } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import { computeCallCenterStats, formatDurationSeconds } from '../lib/analytics';
import type { CallCategory, CallRecord, IncidentSeverity } from '../types/campaign';

const CALL_CATEGORIES: CallCategory[] = [
  'General campaign inquiry',
  'Campaign office inquiry',
  'Volunteer inquiry',
  'Event inquiry',
  'Logistics inquiry',
  'Technical support',
  'Personnel assistance',
  'Safety concern',
  'Incident report',
  'General complaint',
  'Other',
];

export const CallCenterView: React.FC = () => {
  const {
    branding,
    calls,
    callOperators,
    logCall,
    updateCallStatus,
    createTask,
    departments,
    currentUser,
  } = useCampaign();

  const [mode, setMode] = useState<'operator' | 'supervisor'>('operator');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    direction: 'incoming' as 'incoming' | 'outgoing',
    callerName: '',
    callerPhone: '',
    consentRecorded: true,
    category: 'General campaign inquiry' as CallCategory,
    subject: '',
    description: '',
    department: departments[2] || 'Field Operations',
    stateCode: 'KT',
    lga: 'Katsina',
    priority: 'medium' as IncidentSeverity,
    status: 'Open Case' as CallRecord['status'],
    followUpRequired: false,
    escalateImmediately: false,
  });

  const stats = useMemo(
    () => computeCallCenterStats(calls, callOperators),
    [calls, callOperators]
  );

  const filteredCalls = useMemo(
    () => calls.filter((c) => statusFilter === 'All' || c.status === statusFilter),
    [calls, statusFilter]
  );

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (form.subject.trim().length < 4) {
      setFormError('Call subject is required (minimum 4 characters).');
      return;
    }
    if (form.description.trim().length < 8) {
      setFormError('Structured call notes are required (minimum 8 characters).');
      return;
    }

    const finalStatus: CallRecord['status'] = form.escalateImmediately ? 'Escalated' : form.status;
    logCall({
      direction: form.direction,
      callerName: form.callerName.trim() || 'Anonymous / Declined Name',
      callerPhone: form.callerPhone.trim() || 'Not Supplied',
      consentRecorded: form.consentRecorded,
      category: form.category,
      subject: form.subject.trim(),
      description: form.description.trim(),
      operatorName: currentUser.displayName,
      operatorUid: currentUser.uid,
      department: form.department,
      stateCode: form.stateCode,
      lga: form.lga,
      priority: form.priority,
      status: finalStatus,
      handlingSeconds: 180,
      followUpRequired: form.followUpRequired,
      escalatedTo: form.escalateImmediately ? 'Call Center Supervisor' : undefined,
      isDemo: false,
    });

    if (form.followUpRequired) {
      createTask({
        title: `Call Follow-Up: ${form.subject.trim()}`,
        description: `Generated from Call Center (${form.category}). Notes: ${form.description.trim()}`,
        department: form.department,
        supervisor: 'Call Center Supervisor',
        assigneeName: currentUser.displayName,
        stateCode: form.stateCode,
        lga: form.lga,
        priority: form.priority === 'critical' ? 'urgent' : form.priority,
        status: 'Assigned',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        subtasks: [{ id: 'st-call-1', label: 'Complete callback / issue resolution', done: false }],
        isDemo: false,
      });
    }

    setForm({
      ...form,
      callerName: '',
      callerPhone: '',
      subject: '',
      description: '',
      followUpRequired: false,
      escalateImmediately: false,
    });
    setFormSuccess('Call record logged and synchronized with queue dashboard.');
  };

  const lgas = STATE_BY_CODE[form.stateCode]?.lgas ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Call Center & Contact Management Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provider-independent telephony workflow · Voluntary consent logging · Zero voter persuasion profiling
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode('operator')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              mode === 'operator'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Operator Console
          </button>
          <button
            type="button"
            onClick={() => setMode('supervisor')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              mode === 'supervisor'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Supervisor Dashboard
          </button>
        </div>
      </div>

      {/* Live Call Center KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Total Calls</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-500">{stats.incoming} in · {stats.outgoing} out</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Queue Waiting</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
            {stats.waiting}
          </div>
          <div className="text-[11px] text-slate-500">{stats.active} active now</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Active Operators</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">{stats.activeOperators}</div>
          <div className="text-[11px] text-slate-500">{stats.availableOperators} free · {stats.busyOperators} busy</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Avg Handling Time</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">
            {formatDurationSeconds(stats.avgHandlingSeconds)}
          </div>
          <div className="text-[11px] text-slate-500">Computed from logs</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Escalated Cases</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {stats.escalated}
          </div>
          <div className="text-[11px] text-slate-500">{stats.openCases} open cases</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Resolved Cases</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-slate-500">Manual / VoIP ready</div>
        </div>
      </div>

      {mode === 'operator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Call Intake Form */}
          <form
            onSubmit={handleLogCall}
            className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PhoneIncoming className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold">Operator Call Intake & Case Creation</h3>
              </div>
              <span className="text-[11px] text-slate-500">Manual Workflow Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value as 'incoming' | 'outgoing' })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="incoming">Incoming Call</option>
                  <option value="outgoing">Outgoing Callback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as IncidentSeverity })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Caller Name (Voluntary)</label>
                <input
                  type="text"
                  value={form.callerName}
                  onChange={(e) => setForm({ ...form, callerName: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone (Consented)</label>
                <input
                  type="text"
                  value={form.callerPhone}
                  onChange={(e) => setForm({ ...form, callerPhone: e.target.value })}
                  placeholder="+234 ..."
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Call Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CallCategory })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {CALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Concise summary of inquiry or operational request"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Structured Call Notes *</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consentRecorded}
                  onChange={(e) => setForm({ ...form, consentRecorded: e.target.checked })}
                />
                <span>Caller notified of operational logging & privacy compliance</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.followUpRequired}
                  onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
                />
                <span>Create automatic follow-up task for {form.department}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-red-700 dark:text-red-400">
                <input
                  type="checkbox"
                  checked={form.escalateImmediately}
                  onChange={(e) => setForm({ ...form, escalateImmediately: e.target.checked })}
                />
                <span>Escalate immediately to Call Center Supervisor</span>
              </label>
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}
            {formSuccess && <p className="text-xs text-emerald-700 dark:text-emerald-400">{formSuccess}</p>}

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white rounded-md inline-flex items-center justify-center gap-1.5"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Log Call Record
            </button>
          </form>

          {/* Call Log Queue */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold">Active Queue & Call Records ({filteredCalls.length})</h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter calls by status"
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="All">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="Active">Active</option>
                <option value="Open Case">Open Case</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[580px] overflow-y-auto">
              {filteredCalls.map((c) => (
                <div key={c.id} className="p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{c.refCode}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{c.subject}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        c.status === 'Escalated'
                          ? 'text-red-700 dark:text-red-400'
                          : c.status === 'Resolved'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {c.status} · {c.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{c.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>
                      {c.category} · {c.stateCode}/{c.lga} · Operator: {c.operatorName}
                    </span>
                    <div className="flex items-center gap-2">
                      {c.status !== 'Escalated' && c.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => updateCallStatus(c.id, 'Escalated', undefined, 'Call Center Supervisor')}
                          className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-medium hover:underline"
                        >
                          <ShieldAlert className="w-3 h-3" /> Escalate
                        </button>
                      )}
                      {c.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => updateCallStatus(c.id, 'Resolved', 'Resolved by operator desk.')}
                          className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                        >
                          Mark Resolved <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Supervisor Dashboard View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold">Operator Workload & Station Status</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Operator</th>
                  <th className="py-2.5 px-3 font-semibold">Station</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Calls Today</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Avg Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {callOperators.map((op) => (
                  <tr key={op.id}>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{op.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{op.station}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          op.status === 'Available'
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : op.status === 'On Call'
                              ? 'text-amber-700 dark:text-amber-400 font-medium'
                              : 'text-slate-500'
                        }
                      >
                        {op.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{op.callsHandledToday}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatDurationSeconds(op.avgHandlingSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
            <h3 className="text-sm font-bold">VoIP / Telephony Integration Readiness</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This call center uses a provider-independent architecture ready for Asterisk SIP, Twilio Voice, or Africa&apos;s Talking telephony adapters via server-side credentials. Until SIP credentials are configured, operators use the verified manual call-logging workflow with mandatory caller consent notice.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs space-y-1">
              <div className="font-semibold">Data Ethics Enforcement</div>
              <div className="text-slate-500">
                Call records are restricted strictly to campaign operations, inquiries, logistics, and safety coordination. Persuasion profiling and political-belief inference are disabled by policy.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
