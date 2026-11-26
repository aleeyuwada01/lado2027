import React, { useMemo, useState } from 'react';
import { MapPin, Search, X, ArrowRight } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { searchNigeriaGeography } from '../data/nigeriaGeo';
import type { NavModuleId } from '../types/campaign';

const MODULE_INDEX: Array<{ id: NavModuleId; label: string; group: string }> = [
  { id: 'situation-room', label: 'Executive Situation Room', group: 'Command' },
  { id: 'katsina-simulator', label: 'Katsina INEC & Victory Simulator', group: 'Command' },
  { id: 'voter-sentiment', label: 'Voter Sentiment Intelligence Hub', group: 'Command' },
  { id: 'campaign-overview', label: 'Campaign Overview', group: 'Command' },
  { id: 'geographic-ops', label: 'Geographic Operations', group: 'Geography & Field' },
  { id: 'field-ops', label: 'Field Operations & Mobile PWA', group: 'Geography & Field' },
  { id: 'agents-volunteers', label: 'Agent & Volunteer Management', group: 'Geography & Field' },
  { id: 'call-center', label: 'Call Center & Contact Desk', group: 'Response' },
  { id: 'incidents', label: 'Incident Management', group: 'Response' },
  { id: 'events', label: 'Campaign Events & Schedule', group: 'Operations' },
  { id: 'logistics', label: 'Logistics & Transportation', group: 'Operations' },
  { id: 'organization', label: 'Campaign Organization', group: 'Operations' },
  { id: 'polling-coverage', label: 'Polling Unit Coverage', group: 'Election Ops' },
  { id: 'election-day', label: 'Election-Day Operations', group: 'Election Ops' },
  { id: 'reports-analytics', label: 'Reports & Analytics', group: 'Intelligence' },
  { id: 'communications', label: 'Communications & Announcements', group: 'Intelligence' },
  { id: 'media-monitoring', label: 'Media Monitoring', group: 'Intelligence' },
  { id: 'documents', label: 'Campaign Documents', group: 'Governance' },
  { id: 'tasks', label: 'Tasks & Workflow', group: 'Governance' },
  { id: 'security-audit', label: 'Security & Audit', group: 'Governance' },
  { id: 'settings-admin', label: 'Settings & Administration', group: 'Governance' },
];

export const CommandSearchModal: React.FC = () => {
  const {
    commandSearchOpen,
    setCommandSearchOpen,
    setActiveModule,
    setSelectedStateCode,
    incidents,
    personnel,
    tasks,
  } = useCampaign();
  const [queryText, setQueryText] = useState('');

  const results = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const modules = MODULE_INDEX.filter(
      (m) => !q || m.label.toLowerCase().includes(q) || m.group.toLowerCase().includes(q)
    ).slice(0, 6);
    const geo = q ? searchNigeriaGeography(q).slice(0, 8) : [];
    const matchedIncidents = q
      ? incidents
          .filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.refCode.toLowerCase().includes(q) ||
              i.lga.toLowerCase().includes(q)
          )
          .slice(0, 4)
      : [];
    const matchedPersonnel = q
      ? personnel
          .filter(
            (p) =>
              p.fullName.toLowerCase().includes(q) ||
              p.role.toLowerCase().includes(q) ||
              p.lga.toLowerCase().includes(q)
          )
          .slice(0, 4)
      : [];
    const matchedTasks = q
      ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 3)
      : [];

    return { modules, geo, matchedIncidents, matchedPersonnel, matchedTasks };
  }, [queryText, incidents, personnel, tasks]);

  if (!commandSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 pt-8 sm:pt-20 px-3 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandSearchOpen(false);
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-3.5 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search states, 774 LGAs, modules, incidents..."
            aria-label="Global command search query"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandSearchOpen(false)}
            aria-label="Close command search"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70dvh] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {results.geo.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-slate-500">
                Nigeria Administrative Geography
              </p>
              <div className="space-y-0.5">
                {results.geo.map((item, idx) => (
                  <button
                    key={`${item.stateCode}-${item.lgaName || 'state'}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedStateCode(item.stateCode);
                      setActiveModule('geographic-ops');
                      setCommandSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span className="font-medium">
                        {item.type === 'LGA' ? `${item.lgaName} LGA` : `${item.stateName} State`}
                      </span>
                      <span className="text-slate-400">· {item.stateName} · {item.zone}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.matchedIncidents.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-slate-500">Incidents</p>
              {results.matchedIncidents.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => {
                    setActiveModule('incidents');
                    setCommandSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="truncate text-slate-800 dark:text-slate-200">
                    <span className="font-mono text-slate-500 mr-2">{inc.refCode}</span>
                    {inc.title}
                  </span>
                  <span className="text-slate-500 shrink-0 ml-2">{inc.status}</span>
                </button>
              ))}
            </div>
          )}

          {results.matchedPersonnel.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-slate-500">Personnel & Agents</p>
              {results.matchedPersonnel.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveModule('agents-volunteers');
                    setCommandSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{p.fullName}</span>
                  <span className="text-slate-500">{p.role} · {p.stateCode}/{p.lga}</span>
                </button>
              ))}
            </div>
          )}

          {results.matchedTasks.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1.5 text-[11px] font-semibold text-slate-500">Tasks</p>
              {results.matchedTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveModule('tasks');
                    setCommandSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-800 dark:text-slate-200">{t.title}</span>
                  <span className="text-slate-500">{t.status}</span>
                </button>
              ))}
            </div>
          )}

          <div className="p-3">
            <p className="px-2 pb-1.5 text-[11px] font-semibold text-slate-500">Platform Modules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {results.modules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(m.id);
                    setCommandSearchOpen(false);
                  }}
                  className="flex items-center justify-between px-2.5 py-2 text-left text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <span>{m.label}</span>
                  <span className="text-[11px] text-slate-400">{m.group}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
