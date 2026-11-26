import React, { useMemo, useState } from 'react';
import { CheckCircle2, Megaphone, Plus, Send, ShieldCheck } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import { canPerformAction } from '../lib/rbac';
import type { Announcement } from '../types/campaign';

const SCOPES: Announcement['scope'][] = ['National HQ', 'Department', 'State', 'LGA', 'Ward'];
const CHANNELS: Announcement['channels'][number][] = ['In-App', 'Email', 'SMS', 'WhatsApp'];
const PRIORITIES: Announcement['priority'][] = ['Standard', 'Priority', 'Urgent'];

export const CommunicationsView: React.FC = () => {
  const {
    branding,
    announcements,
    publishAnnouncement,
    departments,
    personnel,
    currentUser,
  } = useCampaign();

  const [showCompose, setShowCompose] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    body: '',
    scope: 'National HQ' as Announcement['scope'],
    targetValue: 'All Authorized Personnel',
    stateForLga: 'KT',
    channels: ['In-App'] as Announcement['channels'],
    priority: 'Standard' as Announcement['priority'],
    consentVerified: true,
  });

  const canWrite = canPerformAction(currentUser, 'write');

  const filtered = useMemo(
    () =>
      announcements.filter((a) => {
        if (scopeFilter !== 'All' && a.scope !== scopeFilter) return false;
        if (priorityFilter !== 'All' && a.priority !== priorityFilter) return false;
        return true;
      }),
    [announcements, scopeFilter, priorityFilter]
  );

  const totalRecipientsReached = useMemo(
    () => announcements.reduce((sum, a) => sum + a.readCount, 0),
    [announcements]
  );
  const totalTargeted = useMemo(
    () => announcements.reduce((sum, a) => sum + a.targetRecipients, 0),
    [announcements]
  );
  const overallReadPct =
    totalTargeted > 0 ? Math.round((totalRecipientsReached / totalTargeted) * 100) : 0;

  const toggleChannel = (ch: Announcement['channels'][number]) => {
    setForm((prev) => {
      const exists = prev.channels.includes(ch);
      const next = exists ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch];
      return { ...prev, channels: next };
    });
  };

  const estimateTargetCount = (): number => {
    if (form.scope === 'National HQ') return Math.max(personnel.length, 12);
    if (form.scope === 'Department') {
      return Math.max(personnel.filter((p) => p.department === form.targetValue).length, 4);
    }
    if (form.scope === 'State') {
      return Math.max(personnel.filter((p) => p.stateCode === form.targetValue).length, 5);
    }
    return Math.max(personnel.filter((p) => p.lga === form.targetValue).length, 3);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (form.title.trim().length < 5) {
      setFormError('Broadcast headline must be at least 5 characters.');
      return;
    }
    if (form.body.trim().length < 12) {
      setFormError('Operational message body must be at least 12 characters.');
      return;
    }
    if (form.channels.length === 0) {
      setFormError('Select at least one authorized delivery channel.');
      return;
    }
    const usesExternalChannel = form.channels.some((c) => c !== 'In-App');
    if (usesExternalChannel && !form.consentVerified) {
      setFormError('External SMS, Email, or WhatsApp dispatch requires verified opt-in consent.');
      return;
    }

    publishAnnouncement({
      title: form.title.trim(),
      body: form.body.trim(),
      scope: form.scope,
      targetValue: form.targetValue.trim() || form.scope,
      channels: form.channels,
      priority: form.priority,
      authorName: currentUser.displayName,
      targetRecipients: estimateTargetCount(),
      consentVerified: form.consentVerified,
      isDemo: false,
    });

    setForm({
      title: '',
      body: '',
      scope: 'National HQ',
      targetValue: 'All Authorized Personnel',
      stateForLga: 'KT',
      channels: ['In-App'],
      priority: 'Standard',
      consentVerified: true,
    });
    setShowCompose(false);
  };

  const lgasForSelectedState = STATE_BY_CODE[form.stateForLga]?.lgas ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Communications & Announcements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scoped operational directives across HQ, departments, states, LGAs, and wards with verified opt-in consent enforcement.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCompose((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> New Operational Broadcast
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Published Broadcasts</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {announcements.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Logged to immutable audit trail</div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Urgent Directives</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {announcements.filter((a) => a.priority === 'Urgent').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">High-priority command alerts</div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Average Read Acknowledgement</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {overallReadPct}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1">
            {totalRecipientsReached} / {totalTargeted} recipients
          </div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Consent Compliance</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            100%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized staff & opt-in channels only</div>
        </div>
      </div>

      {/* Consent Compliance Policy Notice */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white">Consent-First Dispatch Policy:</strong>{' '}
          Internal directives are routed strictly to authorized campaign personnel, registered volunteers, and verified opt-in contacts. Unsolicited mass voter messaging and automated political profiling are disabled by policy.
        </div>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <form
          onSubmit={handlePublish}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Compose Scoped Campaign Broadcast
            </h3>
            <span className="text-[11px] text-slate-500">
              Author: {currentUser.displayName} ({currentUser.role})
            </span>
          </div>

          {formError && (
            <div className="text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20 px-3 py-2 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="comm-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Announcement Headline *
              </label>
              <input
                id="comm-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., North-West State Coordinators Briefing Schedule"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="comm-priority" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                id="comm-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="comm-scope" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Distribution Scope
              </label>
              <select
                id="comm-scope"
                value={form.scope}
                onChange={(e) => {
                  const nextScope = e.target.value as Announcement['scope'];
                  let nextTarget = 'All Authorized Personnel';
                  if (nextScope === 'Department') nextTarget = departments[0] || 'Field Operations';
                  if (nextScope === 'State') nextTarget = 'KT';
                  if (nextScope === 'LGA') nextTarget = STATE_BY_CODE[form.stateForLga]?.lgas[0] || 'Katsina';
                  if (nextScope === 'Ward') nextTarget = 'Designated Ward Units';
                  setForm({ ...form, scope: nextScope, targetValue: nextTarget });
                }}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {form.scope === 'LGA' && (
              <div>
                <label htmlFor="comm-state-for-lga" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State for LGA Target
                </label>
                <select
                  id="comm-state-for-lga"
                  value={form.stateForLga}
                  onChange={(e) => {
                    const code = e.target.value;
                    setForm({
                      ...form,
                      stateForLga: code,
                      targetValue: STATE_BY_CODE[code]?.lgas[0] || '',
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st.code} value={st.code}>{st.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={form.scope === 'LGA' ? '' : 'md:col-span-2'}>
              <label htmlFor="comm-target" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              {form.scope === 'Department' ? (
                <select
                  id="comm-target"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : form.scope === 'State' ? (
                <select
                  id="comm-target"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                  ))}
                </select>
              ) : form.scope === 'LGA' ? (
                <select
                  id="comm-target"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {lgasForSelectedState.map((lga) => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="comm-target"
                  type="text"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="comm-body" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Operational Message *
            </label>
            <textarea
              id="comm-body"
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Provide clear operational instructions, deadlines, and contact desk references..."
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Delivery Channels
              </div>
              <div className="flex flex-wrap gap-3">
                {CHANNELS.map((ch) => (
                  <label key={ch} className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.channels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                      className="rounded border-slate-300"
                    />
                    {ch}
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consentVerified}
                  onChange={(e) => setForm({ ...form, consentVerified: e.target.checked })}
                  className="rounded border-slate-300"
                />
                I confirm all external recipients are registered campaign personnel or verified opt-in contacts.
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-md"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Send className="w-3.5 h-3.5" /> Publish Directive
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label htmlFor="comm-scope-filter" className="text-slate-500">Scope:</label>
          <select
            id="comm-scope-filter"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Scopes</option>
            {SCOPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label htmlFor="comm-priority-filter" className="text-slate-500 ml-2">Priority:</label>
          <select
            id="comm-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-500">
          Showing {filtered.length} of {announcements.length} broadcasts
        </span>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-xs text-slate-500">
            No announcements match the selected filters.
          </div>
        ) : (
          filtered.map((ann) => {
            const readPct =
              ann.targetRecipients > 0
                ? Math.min(100, Math.round((ann.readCount / ann.targetRecipients) * 100))
                : 0;
            return (
              <article
                key={ann.id}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`font-semibold ${
                          ann.priority === 'Urgent'
                            ? 'text-red-700 dark:text-red-400'
                            : ann.priority === 'Priority'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {ann.scope}: {ann.targetValue}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Channels: {ann.channels.join(', ')}</span>
                      {ann.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 dark:text-amber-400 font-medium">DEMO DATA</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-slate-400 shrink-0" />
                      {ann.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {new Date(ann.createdAt).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">By {ann.authorName}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {ann.body}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ann.consentVerified ? 'Opt-in consent verified' : 'Internal in-app only'}</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-64">
                    <span className="text-slate-500 shrink-0">Read Receipts</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${readPct}%`, backgroundColor: branding.primaryColor }}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                      {ann.readCount}/{ann.targetRecipients} ({readPct}%)
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
