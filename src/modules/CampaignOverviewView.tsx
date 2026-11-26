import React from 'react';
import { ArrowRight, Calendar, Settings, ShieldCheck, UserCheck } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';

export const CampaignOverviewView: React.FC = () => {
  const {
    branding,
    metrics,
    zoneSummaries,
    events,
    announcements,
    setActiveModule,
    setSetupWizardOpen,
  } = useCampaign();

  return (
    <div className="space-y-6">
      {/* Candidate Identity & Official Branding Header */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
        <div
          className="h-24 w-full relative"
          style={{
            background: branding.bannerDataUrl
              ? `url(${branding.bannerDataUrl}) center/cover no-repeat`
              : `linear-gradient(90deg, #0B1324 0%, ${branding.primaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
          <div className="absolute bottom-3 right-4 text-[11px] font-mono text-white/80">
            {branding.electionType} · {branding.electionYear}
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6 items-start">
          {/* Portrait Placeholder or Uploaded Official Portrait */}
          <div className="shrink-0 -mt-14 relative z-10">
            {branding.portraitDataUrl ? (
              <img
                src={branding.portraitDataUrl}
                alt={branding.candidateName}
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-md object-cover object-top border-2 border-white dark:border-slate-900 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-md bg-slate-900 border-2 border-white dark:border-slate-800 flex flex-col items-center justify-center text-center p-2 shadow-md">
                <span className="text-xl font-bold font-display text-white">YLDM</span>
                <span className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Official Portrait Placeholder
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {branding.candidateName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {branding.campaignName} · Party: {branding.partyAffiliation}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSetupWizardOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  <Settings className="w-3.5 h-3.5" /> Configure Branding & Assets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModule('situation-room')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Open Situation Room <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Slogan: {branding.slogan}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {branding.biography}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-500">
              <span>HQ: {branding.headquarters}</span>
              <span aria-hidden="true">·</span>
              <span>Contact: {branding.contactEmail}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{branding.contactPhone}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Readiness Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="text-xs text-slate-500">National Administrative Footprint</div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {metrics.statesWithActivePersonnel} / 37 States
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.lgasCoveredCount} of {metrics.totalLgas} verified LGAs staffed
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="text-xs text-slate-500">Field Agent Check-In Rate</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {metrics.registeredAgents > 0
              ? `${Math.round((metrics.agentsCheckedIn / metrics.registeredAgents) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.agentsCheckedIn} checked in out of {metrics.registeredAgents} deployed
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="text-xs text-slate-500">Report Verification Ratio</div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1">
            {metrics.verifiedFieldReports} Verified
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.pendingFieldReports} submissions awaiting verification desk
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <div className="text-xs text-slate-500">Data Ethics & Compliance</div>
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Operational Analytics Only
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Consent-based contacts · Zero voter profiling
          </div>
        </div>
      </div>

      {/* Geopolitical Zone Readiness Matrix & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Geopolitical Zone Operational Readiness
            </h3>
            <button
              type="button"
              onClick={() => setActiveModule('geographic-ops')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Drill Down Geography
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Zone</th>
                  <th className="py-2.5 px-3 font-semibold text-right">States</th>
                  <th className="py-2.5 px-3 font-semibold text-right">LGAs</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Personnel</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Checked In</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Open Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {zoneSummaries.map((z) => (
                  <tr key={z.zone} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{z.zone}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{z.statesCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{z.lgasTotal}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{z.personnel}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {z.agentsCheckedIn}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {z.openIncidents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule & Recent Announcements */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold">Upcoming Campaign Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('events')}
                className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                All Events
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.slice(0, 3).map((evt) => (
                <div key={evt.id} className="p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{evt.title}</span>
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">{evt.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {evt.eventType} · {evt.venue} ({evt.stateCode}/{evt.lga}) · Est. {evt.estimatedAttendance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold">Latest HQ Announcements</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('communications')}
                className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Comms Center
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3.5 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">{ann.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ann.scope}: {ann.targetValue} · Read {ann.readCount}/{ann.targetRecipients}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
