import React, { useMemo, useState } from 'react';
import { Download, FileJson, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCampaign } from '../context/CampaignContext';
import { exportRowsToCsv } from '../lib/analytics';

const REPORT_TEMPLATES = [
  'Daily Campaign Operations Report',
  'Situation-Room Executive Report',
  'Field Activity & Check-In Report',
  'Incident Response Report',
  'Call Center Performance Report',
  'Campaign Events Execution Report',
  'Logistics & Inventory Report',
  'Agent Deployment Report',
  'Geographic Coverage Report (37 States / 774 LGAs)',
  'Election-Day Operations Report (Campaign-Reported)',
] as const;

export const ReportsAnalyticsView: React.FC = () => {
  const {
    branding,
    metrics,
    stateSummaries,
    incidents,
    calls,
    personnel,
    tasks,
    events,
    logisticsRequests,
  } = useCampaign();

  const [selectedReport, setSelectedReport] = useState<(typeof REPORT_TEMPLATES)[number]>(
    REPORT_TEMPLATES[0]
  );

  const activeStateChartData = useMemo(
    () =>
      Object.values(stateSummaries)
        .filter((s) => s.personnelAssigned > 0 || s.openIncidents > 0 || s.reportsSubmitted > 0)
        .sort((a, b) => b.personnelAssigned - a.personnelAssigned)
        .slice(0, 10),
    [stateSummaries]
  );

  const incidentSeverityData = useMemo(
    () => [
      { name: 'Critical', value: incidents.filter((i) => i.severity === 'critical').length, color: '#B91C1C' },
      { name: 'High', value: incidents.filter((i) => i.severity === 'high').length, color: '#D97706' },
      { name: 'Medium', value: incidents.filter((i) => i.severity === 'medium').length, color: '#0D9488' },
      { name: 'Low', value: incidents.filter((i) => i.severity === 'low').length, color: '#64748B' },
    ],
    [incidents]
  );

  const handleExportCsv = () => {
    const csv = exportRowsToCsv(
      ['Report', 'Candidate', 'Generated At', 'Total Personnel', 'Agents Checked In', 'Open Incidents', 'Total Calls', 'Pending Tasks'],
      [
        [
          selectedReport,
          branding.candidateName,
          new Date().toISOString(),
          metrics.totalPersonnel,
          metrics.agentsCheckedIn,
          metrics.openIncidents,
          metrics.callsTotal,
          metrics.pendingTasks,
        ],
      ]
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      reportType: selectedReport,
      campaignName: branding.campaignName,
      candidateName: branding.candidateName,
      generatedAt: new Date().toISOString(),
      policyNotice: 'Aggregate operational campaign analytics only. Not official INEC data.',
      metrics,
      counts: {
        personnel: personnel.length,
        incidents: incidents.length,
        calls: calls.length,
        tasks: tasks.length,
        events: events.length,
        logisticsRequests: logisticsRequests.length,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Operational Analytics & Executive Reporting
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregate operational analytics computed live from campaign records · Export CSV, JSON, or Print/PDF
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileJson className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Selector & Printable Executive Brief Header */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-[11px] font-mono text-slate-500">{branding.campaignName}</div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedReport}</h3>
            <div className="text-xs text-slate-500 mt-0.5">
              Candidate: {branding.candidateName} · HQ: {branding.headquarters}
            </div>
          </div>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value as (typeof REPORT_TEMPLATES)[number])}
            aria-label="Select executive report template"
            className="no-print px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
          >
            {REPORT_TEMPLATES.map((tpl) => (
              <option key={tpl} value={tpl}>{tpl}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-500">Registered Personnel</div>
            <div className="text-lg font-bold font-mono tabular-nums">{metrics.totalPersonnel}</div>
          </div>
          <div>
            <div className="text-slate-500">States with Active Staff</div>
            <div className="text-lg font-bold font-mono tabular-nums">
              {metrics.statesWithActivePersonnel} / 37
            </div>
          </div>
          <div>
            <div className="text-slate-500">Incident Resolution</div>
            <div className="text-lg font-bold font-mono tabular-nums">
              {metrics.resolvedIncidents} Resolved / {metrics.openIncidents} Open
            </div>
          </div>
          <div>
            <div className="text-slate-500">Call Center Resolution</div>
            <div className="text-lg font-bold font-mono tabular-nums">
              {calls.filter((c) => c.status === 'Resolved').length} / {calls.length} Calls
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <h3 className="text-xs font-bold mb-3">Top Active States — Deployment & Reporting Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeStateChartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="stateCode" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="personnelAssigned" name="Personnel" fill={branding.primaryColor} radius={[3, 3, 0, 0]} />
                <Bar dataKey="reportsSubmitted" name="Field Reports" fill="#0D9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="openIncidents" name="Open Incidents" fill="#B91C1C" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
          <h3 className="text-xs font-bold mb-3">Incident Severity Distribution</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentSeverityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {incidentSeverityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
            {incidentSeverityData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
