import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  Send,
  X,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { KATSINA_INEC_LGAS } from '../data/katsinaInecData';
import type { IncidentCategory, IncidentSeverity } from '../types/campaign';

export type QuickCommandTab = 'incident' | 'field-report' | 'dispatch';

interface QuickCommandModalProps {
  open: boolean;
  initialTab?: QuickCommandTab;
  onClose: () => void;
}

export const QuickCommandModal: React.FC<QuickCommandModalProps> = ({
  open,
  initialTab = 'incident',
  onClose,
}) => {
  const { currentUser, createIncident, submitFieldReport, publishAnnouncement } = useCampaign();
  const [tab, setTab] = useState<QuickCommandTab>(initialTab);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Sync tab whenever modal opens with a specific requested tab
  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSavedMessage(null);
    }
  }, [open, initialTab]);

  // Incident form state
  const [incLga, setIncLga] = useState<string>('Katsina');
  const [incTitle, setIncTitle] = useState<string>('');
  const [incCategory, setIncCategory] = useState<IncidentCategory>('Logistics failure');
  const [incSeverity, setIncSeverity] = useState<IncidentSeverity>('high');
  const [incDesc, setIncDesc] = useState<string>('');

  // Field report form state
  const [repLga, setRepLga] = useState<string>('Funtua');
  const [repWard, setRepWard] = useState<string>('Sabon Gari');
  const [repType, setRepType] = useState<
    'Routine Situation' | 'Polling Unit Opening' | 'Accreditation Update' | 'Logistics Status' | 'Community Engagement'
  >('Community Engagement');
  const [repSummary, setRepSummary] = useState<string>('');

  // Dispatch / Announcement state
  const [dispTitle, setDispTitle] = useState<string>('');
  const [dispAudience, setDispAudience] = useState<string>('All 34 Katsina LGA Coordinators');
  const [dispPriority, setDispPriority] = useState<'Standard' | 'Priority' | 'Urgent'>('Urgent');
  const [dispMessage, setDispMessage] = useState<string>('');

  if (!open) return null;

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim()) return;
    createIncident({
      title: incTitle.trim(),
      category: incCategory,
      severity: incSeverity,
      status: 'New',
      verificationStatus: 'Unverified Report',
      stateCode: 'KT',
      lga: incLga,
      ward: 'Central Ward',
      description: incDesc.trim() || `Logged via Quick Command for ${incLga} LGA.`,
      reporterName: currentUser.displayName,
      reporterUid: currentUser.uid,
      assignedTeam: 'Katsina Rapid Response',
      assignedSupervisor: 'Situation Room Desk',
    });
    setIncTitle('');
    setIncDesc('');
    setSavedMessage(`Incident logged for ${incLga} LGA and pushed to the Situation Room feed.`);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repSummary.trim()) return;
    submitFieldReport({
      reportType: repType,
      stateCode: 'KT',
      lga: repLga,
      ward: repWard.trim() || 'Central Ward',
      pollingUnit: `${repLga} Primary Unit`,
      summary: repSummary.trim(),
      dataLabel: 'Campaign-Reported Data',
      status: 'Submitted',
      submitterName: currentUser.displayName,
      submitterUid: currentUser.uid,
    });
    setRepSummary('');
    setSavedMessage(`Field report recorded for ${repLga} LGA (${repWard || 'Central Ward'}).`);
  };

  const handleSubmitDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispTitle.trim() || !dispMessage.trim()) return;
    publishAnnouncement({
      title: dispTitle.trim(),
      body: dispMessage.trim(),
      scope: 'State',
      targetValue: dispAudience,
      channels: ['In-App', 'SMS'],
      priority: dispPriority,
      authorName: currentUser.displayName,
      targetRecipients: 34,
      consentVerified: true,
    });
    setDispTitle('');
    setDispMessage('');
    setSavedMessage(`Campaign dispatch broadcast to ${dispAudience}.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Campaign Command"
      data-testid="quick-command-modal"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white font-display">
              Quick Campaign Action
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Log field intelligence or dispatch coordinators without leaving your view.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick action dialog"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Clean Action Tabs */}
        <div className="px-5 pt-3.5 pb-2 grid grid-cols-3 gap-1.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
          {(
            [
              { id: 'incident', label: 'Incident', icon: AlertTriangle },
              { id: 'field-report', label: 'Field Report', icon: ClipboardList },
              { id: 'dispatch', label: 'Dispatch', icon: Megaphone },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSavedMessage(null);
                }}
                className={`min-h-[40px] px-2.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-[#0D5C38] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {savedMessage && (
            <div
              data-testid="quick-command-success"
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{savedMessage}</div>
            </div>
          )}

          {tab === 'incident' && (
            <form onSubmit={handleSubmitIncident} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qc-inc-lga" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Katsina LGA
                  </label>
                  <select
                    id="qc-inc-lga"
                    value={incLga}
                    onChange={(e) => setIncLga(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {KATSINA_INEC_LGAS.map((lga) => (
                      <option key={lga.id} value={lga.name}>
                        {lga.name} ({lga.zone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="qc-inc-severity" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    id="qc-inc-severity"
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as IncidentSeverity)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="critical">Critical — Immediate Escalation</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="qc-inc-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="qc-inc-category"
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value as IncidentCategory)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Logistics failure">Logistics failure</option>
                  <option value="Operational issue">Operational issue</option>
                  <option value="Safety concern">Safety concern</option>
                  <option value="Personnel assistance">Personnel assistance</option>
                  <option value="Communication outage">Communication outage</option>
                  <option value="Equipment issue">Equipment issue</option>
                </select>
              </div>

              <div>
                <label htmlFor="qc-inc-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Title
                </label>
                <input
                  id="qc-inc-title"
                  type="text"
                  required
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder="e.g., Delayed mobilization bus arrival at Funtua central ward"
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              <div>
                <label htmlFor="qc-inc-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details & Action Needed
                </label>
                <textarea
                  id="qc-inc-desc"
                  rows={3}
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Brief operational details for the rapid response desk..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-xl transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Log Incident to Situation Room
              </button>
            </form>
          )}

          {tab === 'field-report' && (
            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qc-rep-lga" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Katsina LGA
                  </label>
                  <select
                    id="qc-rep-lga"
                    value={repLga}
                    onChange={(e) => setRepLga(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {KATSINA_INEC_LGAS.map((lga) => (
                      <option key={lga.id} value={lga.name}>
                        {lga.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="qc-rep-ward" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ward Name
                  </label>
                  <input
                    id="qc-rep-ward"
                    type="text"
                    value={repWard}
                    onChange={(e) => setRepWard(e.target.value)}
                    placeholder="e.g., Wakilin Gabas I"
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="qc-rep-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Report Type
                </label>
                <select
                  id="qc-rep-type"
                  value={repType}
                  onChange={(e) => setRepType(e.target.value as typeof repType)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Community Engagement">Community Engagement</option>
                  <option value="Routine Situation">Routine Situation</option>
                  <option value="Polling Unit Opening">Polling Unit Opening</option>
                  <option value="Accreditation Update">Accreditation Update</option>
                  <option value="Logistics Status">Logistics Status</option>
                </select>
              </div>

              <div>
                <label htmlFor="qc-rep-summary" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Observation Summary
                </label>
                <textarea
                  id="qc-rep-summary"
                  required
                  rows={3}
                  value={repSummary}
                  onChange={(e) => setRepSummary(e.target.value)}
                  placeholder="Summarize turnout, ward mobilization progress, or ground feedback..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-xl transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Submit Field Report
              </button>
            </form>
          )}

          {tab === 'dispatch' && (
            <form onSubmit={handleSubmitDispatch} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qc-disp-audience" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    id="qc-disp-audience"
                    value={dispAudience}
                    onChange={(e) => setDispAudience(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="All 34 Katsina LGA Coordinators">All 34 Katsina LGA Coordinators</option>
                    <option value="Katsina South (Funtua) Teams">Katsina South (Funtua) Teams</option>
                    <option value="Katsina Central Ward Leaders">Katsina Central Ward Leaders</option>
                    <option value="Katsina North (Daura) Teams">Katsina North (Daura) Teams</option>
                    <option value="All Polling Unit Agents">All Polling Unit Agents</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="qc-disp-priority" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="qc-disp-priority"
                    value={dispPriority}
                    onChange={(e) => setDispPriority(e.target.value as 'Standard' | 'Priority' | 'Urgent')}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Urgent">Urgent Command Directive</option>
                    <option value="Priority">Priority Update</option>
                    <option value="Standard">Standard Campaign Update</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="qc-disp-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Directive Headline
                </label>
                <input
                  id="qc-disp-title"
                  type="text"
                  required
                  value={dispTitle}
                  onChange={(e) => setDispTitle(e.target.value)}
                  placeholder="e.g., Evening Ward Mobilization Check-In Reminder"
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="qc-disp-msg" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Directive Message
                </label>
                <textarea
                  id="qc-disp-msg"
                  required
                  rows={3}
                  value={dispMessage}
                  onChange={(e) => setDispMessage(e.target.value)}
                  placeholder="Clear, actionable instructions for ward and LGA coordinators..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast Campaign Dispatch
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
