import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Flag,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { KATSINA_INEC_LGAS } from '../data/katsinaInecData';
import { aggregateEc8aCollation, validateEc8aSheet } from '../lib/ec8aCollation';
import { createDefaultSimulationConfig, runKatsinaSimulation } from '../lib/electionSimulator';
import { t } from '../lib/i18n';
import { canPerformAction, PERMISSION_BY_ROLE } from '../lib/rbac';
import type { FieldReportStatus } from '../types/campaign';

export const ElectionDayView: React.FC = () => {
  const {
    branding,
    updateBranding,
    fieldReports,
    reviewFieldReport,
    ec8aResults,
    submitEc8aResult,
    verifyEc8aResult,
    flagEc8aResult,
    metrics,
    currentUser,
    language,
  } = useCampaign();

  const [activeTab, setActiveTab] = useState<'ec8a' | 'queue'>('ec8a');
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const canToggleMode = PERMISSION_BY_ROLE[currentUser.role]?.approve ?? false;
  const canWrite = canPerformAction(currentUser, 'write');

  // Form EC8A Sheet Capture State
  const [showEc8aForm, setShowEc8aForm] = useState(false);
  const [lgaId, setLgaId] = useState('katsina');
  const [wardName, setWardName] = useState(KATSINA_INEC_LGAS[0]?.wards[0]?.name || 'Central');
  const [puCode, setPuCode] = useState('');
  const [puName, setPuName] = useState('');
  const [accredited, setAccredited] = useState(550);
  const [pdpVotes, setPdpVotes] = useState(340);
  const [apcVotes, setApcVotes] = useState(145);
  const [adcVotes, setAdcVotes] = useState(35);
  const [otherVotes, setOtherVotes] = useState(8);
  const [rejectedVotes, setRejectedVotes] = useState(6);
  const [photoRef, setPhotoRef] = useState('');
  const [ec8aBanner, setEc8aBanner] = useState<string | null>(null);

  const selectedLga = useMemo(
    () => KATSINA_INEC_LGAS.find((l) => l.id === lgaId) ?? KATSINA_INEC_LGAS[0],
    [lgaId]
  );

  const liveSheetCheck = useMemo(
    () =>
      validateEc8aSheet({
        accreditedVoters: accredited,
        pdpVotes,
        apcVotes,
        adcVotes,
        otherVotes,
        rejectedVotes,
      }),
    [accredited, pdpVotes, apcVotes, adcVotes, otherVotes, rejectedVotes]
  );

  const defaultSim = useMemo(
    () => runKatsinaSimulation(createDefaultSimulationConfig()),
    []
  );

  const collation = useMemo(
    () => aggregateEc8aCollation(ec8aResults, defaultSim),
    [ec8aResults, defaultSim]
  );

  const filteredReports = fieldReports.filter(
    (r) => statusFilter === 'All' || r.status === statusFilter
  );

  const handleReview = (id: string, nextStatus: FieldReportStatus) => {
    const notes = reviewNotesMap[id] || `Status updated to ${nextStatus} by Verification Desk.`;
    reviewFieldReport(id, nextStatus, notes);
    setReviewNotesMap((prev) => ({ ...prev, [id]: '' }));
  };

  const handleSubmitEc8a = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    const created = submitEc8aResult({
      stateCode: 'KT',
      lgaId: selectedLga.id,
      lgaName: selectedLga.name,
      wardName: wardName || selectedLga.wards[0]?.name || 'Central Ward',
      pollingUnitCode: puCode.trim() || `${selectedLga.inecCode}/01/001`,
      pollingUnitName: puName.trim() || `${selectedLga.name} Primary Unit`,
      accreditedVoters: Number(accredited) || 0,
      pdpVotes: Number(pdpVotes) || 0,
      apcVotes: Number(apcVotes) || 0,
      adcVotes: Number(adcVotes) || 0,
      otherVotes: Number(otherVotes) || 0,
      rejectedVotes: Number(rejectedVotes) || 0,
      sheetPhotoRef: photoRef.trim() || `EC8A-${selectedLga.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      submittedBy: currentUser.displayName,
      isDemo: false,
    });
    setPuCode('');
    setPuName('');
    setPhotoRef('');
    setShowEc8aForm(false);
    setEc8aBanner(
      created.status === 'Discrepancy Flagged'
        ? `${created.refCode} logged with automatic OVER-VOTING flag (${created.flagReason}).`
        : `${created.refCode} submitted for reviewer verification (${selectedLga.name}).`
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-700 dark:text-red-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t(language, 'electionDayTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t(language, 'electionDaySubtitle')}</p>
        </div>

        <button
          type="button"
          disabled={!canToggleMode}
          onClick={() => updateBranding({ electionDayMode: !branding.electionDayMode })}
          className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors disabled:opacity-40 ${
            branding.electionDayMode
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-slate-900 dark:bg-emerald-700 text-white hover:opacity-90'
          }`}
        >
          {branding.electionDayMode
            ? 'Deactivate Election-Day Operating Mode'
            : 'Activate Election-Day Operating Mode'}
        </button>
      </div>

      {/* Mandatory Non-INEC Attribution Banner */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 rounded-md flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">
            Strict Source Attribution Policy — Campaign-Reported Data Only (Not Official INEC Results)
          </strong>
          <p className="mt-0.5 leading-relaxed">
            Figures and Form EC8A tallies captured here are internal party-agent submissions for audit and operational coordination. Never misrepresent internal collation as official INEC published results.
          </p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('ec8a')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold border whitespace-nowrap shrink-0 ${
            activeTab === 'ec8a'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-700 dark:border-emerald-600'
              : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {t(language, 'ec8aTabCollation')} ({ec8aResults.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold border whitespace-nowrap shrink-0 ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-700 dark:border-emerald-600'
              : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {t(language, 'ec8aTabQueue')} ({fieldReports.length})
        </button>
      </div>

      {ec8aBanner && (
        <div className="px-4 py-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span>{ec8aBanner}</span>
          <button
            type="button"
            onClick={() => setEc8aBanner(null)}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB A: FORM EC8A COLLATION LEDGER & 25% SPREAD */}
      {activeTab === 'ec8a' && (
        <div className="space-y-5">
          {/* Collation KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Captured EC8A Sheets</div>
              <div className="text-xl font-bold font-mono tabular-nums mt-1">
                {collation.sheetsCaptured}
              </div>
              <div className="text-[10px] text-slate-500">
                {collation.verifiedSheets} verified · {collation.pendingSheets} pending
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">PDP Collation Total</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                {collation.pdpVotes.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-emerald-600">
                {collation.pdpSharePct}% valid share
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">APC / ADC Totals</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {collation.apcVotes.toLocaleString()} / {collation.adcVotes.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Margin: +{collation.marginPdpOverApc.toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">25% LGA Spread (Sampled)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-sky-700 dark:text-sky-400 mt-1">
                {collation.lgasMeeting25Pct} / {collation.lgasReported} LGAs
              </div>
              <div className="text-[10px] text-slate-500">Target: &gt;=23/34 LGAs @ 25%</div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5 col-span-2 lg:col-span-1">
              <div className="text-[11px] text-slate-500">Over-Voting / Audit Alerts</div>
              <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
                {collation.flaggedSheets}
              </div>
              <div className="text-[10px] text-slate-500">Auto-flagged vs BVAS accredited</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Projected Simulator Margin:{' '}
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                +{defaultSim.marginOverRunnerUp.toLocaleString()}
              </span>{' '}
              ({defaultSim.pdpLgasWon}/34 LGAs, {defaultSim.pdpSharePct}%)
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setShowEc8aForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t(language, 'ec8aSubmitBtn')}
              </button>
            )}
          </div>

          {/* Capture Form EC8A Sheet */}
          {showEc8aForm && canWrite && (
            <form
              onSubmit={handleSubmitEc8a}
              className="bg-white dark:bg-[#111827] border border-emerald-300 dark:border-emerald-800 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Capture Polling Unit Form EC8A Tally</h3>
                <button
                  type="button"
                  onClick={() => setShowEc8aForm(false)}
                  className="text-xs text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  aria-label="Select Katsina LGA"
                  value={lgaId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setLgaId(nextId);
                    const found = KATSINA_INEC_LGAS.find((l) => l.id === nextId);
                    setWardName(found?.wards[0]?.name || '');
                  }}
                  className="px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {KATSINA_INEC_LGAS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.zone})
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Select Ward"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {selectedLga.wards.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={puCode}
                  onChange={(e) => setPuCode(e.target.value)}
                  placeholder="PU Code (e.g. 20/21/05/018)"
                  className="px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />

                <input
                  type="text"
                  value={puName}
                  onChange={(e) => setPuName(e.target.value)}
                  placeholder="Polling Unit Name..."
                  className="px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <label className="text-[11px] font-medium space-y-1">
                  <span>BVAS Accredited</span>
                  <input
                    type="number"
                    min={0}
                    value={accredited}
                    onChange={(e) => setAccredited(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium space-y-1 text-emerald-700 dark:text-emerald-400">
                  <span>PDP Votes</span>
                  <input
                    type="number"
                    min={0}
                    value={pdpVotes}
                    onChange={(e) => setPdpVotes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-emerald-300 dark:border-emerald-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium space-y-1 text-sky-700 dark:text-sky-400">
                  <span>APC Votes</span>
                  <input
                    type="number"
                    min={0}
                    value={apcVotes}
                    onChange={(e) => setApcVotes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium space-y-1 text-amber-700 dark:text-amber-400">
                  <span>ADC Votes</span>
                  <input
                    type="number"
                    min={0}
                    value={adcVotes}
                    onChange={(e) => setAdcVotes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium space-y-1">
                  <span>Others</span>
                  <input
                    type="number"
                    min={0}
                    value={otherVotes}
                    onChange={(e) => setOtherVotes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium space-y-1">
                  <span>Rejected</span>
                  <input
                    type="number"
                    min={0}
                    value={rejectedVotes}
                    onChange={(e) => setRejectedVotes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </label>
              </div>

              {liveSheetCheck.hasOverVoting && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  <strong>Over-Voting Warning:</strong> Total cast votes (
                  {liveSheetCheck.totalCastVotes}) exceeds BVAS accredited voters ({accredited}) by +
                  {liveSheetCheck.overVotesBy}. Submitting will auto-flag this sheet for audit.
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <input
                  type="text"
                  value={photoRef}
                  onChange={(e) => setPhotoRef(e.target.value)}
                  placeholder="Optional Form EC8A photo reference or SHA256..."
                  className="flex-1 px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Save EC8A Result
                </button>
              </div>
            </form>
          )}

          {/* EC8A Sheets Ledger Table */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/60">
                    <th className="py-2.5 px-3">Ref / Polling Unit</th>
                    <th className="py-2.5 px-3">LGA / Ward</th>
                    <th className="py-2.5 px-3 text-right">Accredited</th>
                    <th className="py-2.5 px-3 text-right">PDP</th>
                    <th className="py-2.5 px-3 text-right">APC</th>
                    <th className="py-2.5 px-3 text-right">ADC</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ec8aResults.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">
                          {row.refCode} · {row.pollingUnitCode}
                        </div>
                        <div className="text-[11px] text-slate-500">{row.pollingUnitName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium">{row.lgaName}</div>
                        <div className="text-[11px] text-slate-500">{row.wardName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.accreditedVoters}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {row.pdpVotes}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.apcVotes}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.adcVotes}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : row.status === 'Discrepancy Flagged'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.flagReason && (
                          <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 max-w-[200px]">
                            {row.flagReason}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        {canToggleMode && row.status !== 'Verified' && (
                          <button
                            type="button"
                            onClick={() => verifyEc8aResult(row.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[32px] text-[11px] font-semibold text-white rounded bg-emerald-700 hover:bg-emerald-600"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </button>
                        )}
                        {canToggleMode && row.status !== 'Discrepancy Flagged' && (
                          <button
                            type="button"
                            onClick={() =>
                              flagEc8aResult(row.id, 'Flagged for recount against physical duplicate EC8A.')
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[32px] text-[11px] font-medium border border-red-300 text-red-700 dark:text-red-300 dark:border-red-800 rounded"
                          >
                            <Flag className="w-3 h-3" /> Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: SUBMISSION VERIFICATION PIPELINE */}
      {activeTab === 'queue' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Agents Checked In</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                {metrics.agentsCheckedIn}/{metrics.registeredAgents}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Total Reports Logged</div>
              <div className="text-xl font-bold font-mono tabular-nums mt-1">{fieldReports.length}</div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Awaiting Verification</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
                {metrics.pendingFieldReports}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Verified Submissions</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                {metrics.verifiedFieldReports}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
              <div className="text-[11px] text-slate-500">Unassigned PU Gaps</div>
              <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
                {metrics.pollingUnitsUnassigned}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold">
                  Submission Verification Queue (Submitted → Pending Review → Under Verification → Verified / Rejected)
                </h3>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter submissions by verification status"
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="All">All Submissions</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Verified">Verified</option>
                <option value="Requires Clarification">Requires Clarification</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.map((rep) => (
                <div key={rep.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{rep.refCode}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {rep.reportType} · {rep.stateCode}/{rep.lga} · {rep.ward}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        {rep.dataLabel}
                      </span>
                      <span
                        className={`font-semibold ${
                          rep.status === 'Verified'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : rep.status === 'Rejected'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">{rep.summary}</p>
                  <div className="text-[11px] text-slate-500">
                    Unit: {rep.pollingUnit} · Submitter: {rep.submitterName}
                    {rep.reviewerName &&
                      ` · Reviewer: ${rep.reviewerName} (${rep.reviewNotes || 'Verified'})`}
                  </div>

                  {rep.status !== 'Verified' && rep.status !== 'Rejected' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={reviewNotesMap[rep.id] || ''}
                        onChange={(e) =>
                          setReviewNotesMap((prev) => ({ ...prev, [rep.id]: e.target.value }))
                        }
                        placeholder="Reviewer verification notes..."
                        className="w-full sm:flex-1 sm:min-w-[200px] px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleReview(rep.id, 'Under Verification')}
                        className="px-2.5 py-1.5 text-[11px] font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Under Verification
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(rep.id, 'Requires Clarification')}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded"
                      >
                        Request Clarification
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(rep.id, 'Verified')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white rounded"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify Submission
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
