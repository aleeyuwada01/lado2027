import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES } from '../data/nigeriaGeo';
import { exportRowsToCsv } from '../lib/analytics';

export const PollingCoverageView: React.FC = () => {
  const { geoUnits, personnel, assignAgentToGeoUnit, metrics, setActiveModule } = useCampaign();
  const [stateFilter, setStateFilter] = useState('All');
  const [gapOnly, setGapOnly] = useState(false);

  const agents = useMemo(() => personnel.filter((p) => p.isFieldAgent), [personnel]);

  const filteredUnits = useMemo(
    () =>
      geoUnits.filter((u) => {
        if (stateFilter !== 'All' && u.stateCode !== stateFilter) return false;
        if (gapOnly && u.assignedAgentId) return false;
        return true;
      }),
    [geoUnits, stateFilter, gapOnly]
  );

  const handleExport = () => {
    const csv = exportRowsToCsv(
      ['State', 'LGA', 'Ward', 'Polling Unit', 'Code', 'Source Label', 'Assigned Agent', 'Checked In'],
      filteredUnits.map((u) => {
        const agent = agents.find((a) => a.id === u.assignedAgentId);
        return [
          u.stateCode,
          u.lga,
          u.ward,
          u.pollingUnitName,
          u.pollingUnitCode,
          u.sourceLabel,
          agent?.fullName || 'UNASSIGNED',
          agent?.checkedIn ? 'Yes' : 'No',
        ];
      })
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polling_unit_operational_coverage.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Polling Unit Operational Coverage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Neutral operational coverage tracking: polling units with and without assigned campaign reporting agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModule('geographic-ops')}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Import Official PU Dataset
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white rounded-md"
          >
            <Download className="w-3.5 h-3.5" /> Export Coverage CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Tracked Polling Units</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">{metrics.pollingUnitsTotal}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Assigned Units</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {metrics.pollingUnitsAssigned}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Unassigned Coverage Gaps</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {metrics.pollingUnitsUnassigned}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-3.5">
          <div className="text-[11px] text-slate-500">Agents Checked In</div>
          <div className="text-xl font-bold font-mono tabular-nums mt-1">
            {metrics.agentsCheckedIn} / {metrics.registeredAgents}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={gapOnly}
            onChange={(e) => setGapOnly(e.target.checked)}
          />
          <span>Show Unassigned Coverage Gaps Only</span>
        </label>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          aria-label="Filter polling units by state"
          className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md"
        >
          <option value="All">All States</option>
          {NIGERIA_STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Coverage Matrix Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Polling Unit & Code</th>
                <th className="py-2.5 px-3 font-semibold">State / LGA / Ward</th>
                <th className="py-2.5 px-3 font-semibold">Dataset Source</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Reporting Agent</th>
                <th className="py-2.5 px-4 font-semibold text-right">Check-In Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No polling units match the current filter.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const agent = agents.find((a) => a.id === u.assignedAgentId);
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{u.pollingUnitName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{u.pollingUnitCode}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.stateCode} / {u.lga} · {u.ward}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">{u.sourceLabel}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={u.assignedAgentId || ''}
                          aria-label={`Assign agent to ${u.pollingUnitName}`}
                          onChange={(e) => assignAgentToGeoUnit(u.id, e.target.value || undefined)}
                          className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1"
                        >
                          <option value="">-- Unassigned Gap --</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.fullName} ({a.stateCode}/{a.lga})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {!agent ? (
                          <span className="text-red-700 dark:text-red-400 font-medium">Coverage Gap</span>
                        ) : agent.checkedIn ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Checked In</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">Pending Check-In</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
