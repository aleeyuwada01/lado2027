import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { PERMISSION_BY_ROLE } from '../lib/rbac';
import type { FieldReportStatus } from '../types/campaign';

export const ElectionDayView: React.FC = () => {
  const {
    branding,
    updateBranding,
    fieldReports,
    reviewFieldReport,
    metrics,
    currentUser,
  } = useCampaign();

  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const canToggleMode = PERMISSION_BY_ROLE[currentUser.role]?.approve ?? false;

  const filteredReports = fieldReports.filter(
    (r) => statusFilter === 'All' || r.status === statusFilter
  );

  const handleReview = (id: string, nextStatus: FieldReportStatus) => {
    const notes = reviewNotesMap[id] || `Status updated to ${nextStatus} by Verification Desk.`;
    reviewFieldReport(id, nextStatus, notes);
    setReviewNotesMap((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-700 dark:text-red-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Election-Day Operations & Report Verification Desk
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operational monitoring, agent check-in tracking, and multi-stage submission verification workflow.
          </p>
        </div>

        <button
          type="button"
          disabled={!canToggleMode}
          onClick={() => updateBranding({ electionDayMode: !branding.electionDayMode })}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-40 ${
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
            Figures and observations submitted through this desk are internal campaign operational reports subject to reviewer verification. This platform never fabricates figures, never infers missing polling units, and never presents campaign submissions as official INEC published results.
          </p>
        </div>
      </div>

      {/* Election-Day Operational Metrics */}
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
          <div className="text-[11px] text-slate-500">Verified Campaign Submissions</div>
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

      {/* Verification Pipeline */}
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
                {rep.reviewerName && ` · Reviewer: ${rep.reviewerName} (${rep.reviewNotes || 'Verified'})`}
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
                    className="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
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
    </div>
  );
};
