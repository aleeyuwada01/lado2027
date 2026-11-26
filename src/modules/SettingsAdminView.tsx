import React, { useState } from 'react';
import {
  Activity,
  BellRing,
  Check,
  Database,
  LogIn,
  MapPin,
  Palette,
  RefreshCw,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { AdminGeographyWardsTab } from '../components/AdminGeographyWardsTab';

type AdminTabId = 'wards' | 'branding' | 'operations' | 'alerts';

export const SettingsAdminView: React.FC = () => {
  const {
    branding,
    updateBranding,
    alertRules,
    toggleAlertRule,
    hasDemoData,
    clearDemoData,
    reseedDemoData,
    setSetupWizardOpen,
    currentUser,
    firebaseSyncActive,
    signInWithGoogle,
  } = useCampaign();

  const [activeTab, setActiveTab] = useState<AdminTabId>('wards');
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    campaignName: branding.campaignName,
    candidateName: branding.candidateName,
    electionType: branding.electionType,
    electionYear: branding.electionYear,
    headquarters: branding.headquarters,
    partyAffiliation: branding.partyAffiliation,
    slogan: branding.slogan,
    biography: branding.biography,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    contactEmail: branding.contactEmail,
    contactPhone: branding.contactPhone,
    website: branding.website,
  });

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      campaignName: draft.campaignName.trim() || branding.campaignName,
      candidateName: draft.candidateName.trim() || branding.candidateName,
      electionType: draft.electionType.trim(),
      electionYear: draft.electionYear.trim(),
      headquarters: draft.headquarters.trim(),
      partyAffiliation: draft.partyAffiliation.trim(),
      slogan: draft.slogan.trim(),
      biography: draft.biography.trim(),
      primaryColor: draft.primaryColor,
      accentColor: draft.accentColor,
      contactEmail: draft.contactEmail.trim(),
      contactPhone: draft.contactPhone.trim(),
      website: draft.website.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleImageUpload = (
    field: 'portraitDataUrl' | 'campaignLogoDataUrl' | 'partyLogoDataUrl' | 'bannerDataUrl',
    file: File | undefined
  ) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateBranding({ [field]: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In was cancelled.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Settings, States & Wards Directory & Administration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Browse States, all 34 Katsina Local Governments & 361 INEC Wards, manage campaign branding, cloud sync, and operational alert rules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSetupWizardOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <Sliders className="w-3.5 h-3.5" /> Launch Setup Wizard
        </button>
      </div>

      {/* Admin Navigation Tabs (Clean 2x2 grid on mobile, horizontal strip on sm+) */}
      <div
        role="tablist"
        aria-label="Administration sections"
        className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-1.5 pb-2 sm:pb-1 border-b border-slate-200 dark:border-slate-800"
      >
        {(
          [
            {
              id: 'wards' as AdminTabId,
              label: 'States, LGAs & Wards',
              shortLabel: 'States & Wards',
              badge: '34 KT LGAs · 361 Wards',
              icon: MapPin,
            },
            {
              id: 'branding' as AdminTabId,
              label: 'Campaign Branding',
              shortLabel: 'Branding',
              badge: null,
              icon: Palette,
            },
            {
              id: 'operations' as AdminTabId,
              label: 'Operations & Sync',
              shortLabel: 'Ops & Sync',
              badge: null,
              icon: Database,
            },
            {
              id: 'alerts' as AdminTabId,
              label: 'Alert Rules',
              shortLabel: 'Alert Rules',
              badge: `${alertRules.filter((r) => r.enabled).length} active`,
              icon: BellRing,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 min-h-[40px] rounded-lg sm:rounded-b-none sm:rounded-t-lg text-xs font-semibold border sm:border-0 sm:border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-[#0D5C38] text-[#0D5C38] dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                  : 'border-slate-200/80 dark:border-slate-800 sm:border-transparent text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 sm:bg-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: States, LGAs & Wards Directory */}
      {activeTab === 'wards' && <AdminGeographyWardsTab />}

      {/* Tab 3: Operations, Auth & Live Cloud Sync + Election-Day Mode + Demo Dataset Manager */}
      {activeTab === 'operations' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cloud Auth Card */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloud Authentication & Sync
            </h3>
            <span
              className={`text-[11px] font-semibold ${
                firebaseSyncActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {firebaseSyncActive ? 'Cloud Live' : 'Local Demo'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Sign in with Google to persist campaign configuration, incidents, field reports, and immutable audit logs to Firestore.
          </p>
          <div
            className="text-[11px] text-slate-500 font-mono truncate"
            title={currentUser.email}
          >
            User: {currentUser.email}
          </div>
          {authError && <p className="text-[11px] text-red-600">{authError}</p>}
          {!currentUser.isAuthenticated ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in with Google
            </button>
          ) : (
            <div className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md">
              <Check className="w-3.5 h-3.5" /> Verified Cloud Sync Active
            </div>
          )}
        </div>

        {/* Election-Day Mode Card */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" /> Election-Day Mode
            </h3>
            <span
              className={`text-[11px] font-semibold ${
                branding.electionDayMode ? 'text-red-700 dark:text-red-400' : 'text-slate-500'
              }`}
            >
              {branding.electionDayMode ? 'ACTIVE' : 'Standby'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Activates high-frequency situation room protocols, prioritized incident escalation, and campaign-reported polling unit verification workflows.
          </p>
          <button
            type="button"
            onClick={() => updateBranding({ electionDayMode: !branding.electionDayMode })}
            className={`w-full px-3 py-2 text-xs font-semibold rounded-md border transition-colors ${
              branding.electionDayMode
                ? 'bg-red-700 text-white border-red-700 hover:bg-red-800'
                : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {branding.electionDayMode ? 'Deactivate Election-Day Mode' : 'Activate Election-Day Mode'}
          </button>
        </div>

        {/* Demo Data Manager Card */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" /> Demo Dataset Controls
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {hasDemoData ? 'Demo Loaded' : 'Production Clean'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Remove all clearly labeled DEMO DATA records before live campaign deployment, or reseed sample records for training.
          </p>

          {!confirmClearDemo ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasDemoData}
                onClick={() => setConfirmClearDemo(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Demo Data
              </button>
              <button
                type="button"
                onClick={reseedDemoData}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reseed Demo
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 space-y-2">
              <div className="text-[11px] font-semibold text-red-800 dark:text-red-300">
                Confirm clearing all DEMO DATA records? Live records are preserved.
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearDemoData();
                    setConfirmClearDemo(false);
                  }}
                  className="px-3 py-1 text-[11px] font-semibold bg-red-700 text-white rounded"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearDemo(false)}
                  className="px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Tab 2: Campaign Branding Studio */}
      {activeTab === 'branding' && (
      <form
        onSubmit={handleSaveBranding}
        className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" /> Campaign Identity & Branding Studio
            </h3>
            <p className="text-[11px] text-slate-500">
              Party affiliation, slogan, logos, and candidate portrait remain configurable placeholders until authorized campaign assets are entered or uploaded.
            </p>
          </div>
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Settings Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="set-candidate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Candidate Full Name
            </label>
            <input
              id="set-candidate"
              type="text"
              value={draft.candidateName}
              onChange={(e) => setDraft({ ...draft, candidateName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="set-campname" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaign Organization Title
            </label>
            <input
              id="set-campname"
              type="text"
              value={draft.campaignName}
              onChange={(e) => setDraft({ ...draft, campaignName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="set-party" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Party Affiliation (Configurable Placeholder)
            </label>
            <input
              id="set-party"
              type="text"
              value={draft.partyAffiliation}
              onChange={(e) => setDraft({ ...draft, partyAffiliation: e.target.value })}
              placeholder="Not Yet Configured — Enter Official Party"
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="set-slogan" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Official Campaign Slogan (Configurable Placeholder)
            </label>
            <input
              id="set-slogan"
              type="text"
              value={draft.slogan}
              onChange={(e) => setDraft({ ...draft, slogan: e.target.value })}
              placeholder="Enter official approved slogan..."
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="set-hq" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaign Headquarters
            </label>
            <input
              id="set-hq"
              type="text"
              value={draft.headquarters}
              onChange={(e) => setDraft({ ...draft, headquarters: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="set-primary" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="set-primary"
                  type="color"
                  value={draft.primaryColor}
                  onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                  className="h-8 w-10 rounded border border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {draft.primaryColor}
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="set-accent" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="set-accent"
                  type="color"
                  value={draft.accentColor}
                  onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                  className="h-8 w-10 rounded border border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {draft.accentColor}
                </span>
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="set-bio" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Official Candidate Biography / Campaign Overview
            </label>
            <textarea
              id="set-bio"
              rows={2}
              value={draft.biography}
              onChange={(e) => setDraft({ ...draft, biography: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Media Asset Uploaders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          {(
            [
              { key: 'portraitDataUrl', label: 'Candidate Portrait' },
              { key: 'campaignLogoDataUrl', label: 'Campaign Logo' },
              { key: 'partyLogoDataUrl', label: 'Party Logo' },
              { key: 'bannerDataUrl', label: 'Header Banner' },
            ] as const
          ).map((asset) => {
            const currentUrl = branding[asset.key];
            return (
              <div
                key={asset.key}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.label}</span>
                  {currentUrl && (
                    <button
                      type="button"
                      onClick={() => updateBranding({ [asset.key]: null })}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {currentUrl ? (
                  <img
                    src={currentUrl}
                    alt={asset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-20 object-cover rounded border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-full h-20 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400">
                    Configurable Placeholder
                  </div>
                )}
                <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Upload className="w-3 h-3" /> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleImageUpload(asset.key, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Save Campaign Branding
          </button>
        </div>
      </form>
      )}

      {/* Tab 4: Configurable Operational Alert Rules */}
      {activeTab === 'alerts' && (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-500" /> Automated Alert & Escalation Rules
          </h3>
          <p className="text-[11px] text-slate-500">
            Control real-time notification routing and SLA escalation timers across the Situation Room.
          </p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {alertRules.map((rule) => (
            <div key={rule.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {rule.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  Trigger: {rule.triggerType} · Recipients: {rule.recipients} · Channels: {rule.channels.join(', ')} · SLA: {rule.escalationMinutes} min
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={rule.enabled}
                aria-label={`Toggle alert rule ${rule.name}`}
                onClick={() => toggleAlertRule(rule.id)}
                className={`px-3 py-1 text-[11px] font-semibold rounded border transition-colors ${
                  rule.enabled
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
