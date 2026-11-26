import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';

export const SetupWizardModal: React.FC = () => {
  const {
    setupWizardOpen,
    setSetupWizardOpen,
    branding,
    updateBranding,
    departments,
    addDepartment,
    clearDemoData,
  } = useCampaign();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    campaignName: branding.campaignName,
    candidateName: branding.candidateName,
    electionType: branding.electionType,
    electionYear: branding.electionYear,
    headquarters: branding.headquarters,
    partyAffiliation: branding.partyAffiliation,
    slogan: branding.slogan,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    contactEmail: branding.contactEmail,
    contactPhone: branding.contactPhone,
    geographicScope: 'All 36 States & FCT (774 LGAs)',
    newDepartment: '',
    clearDemoOnFinish: false,
  });

  if (!setupWizardOpen) return null;

  const handleAssetUpload = (
    field: 'portraitDataUrl' | 'campaignLogoDataUrl' | 'partyLogoDataUrl',
    file: File | undefined
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateBranding({ [field]: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = () => {
    updateBranding({
      campaignName: form.campaignName.trim() || branding.campaignName,
      candidateName: form.candidateName.trim() || branding.candidateName,
      electionType: form.electionType.trim(),
      electionYear: form.electionYear.trim(),
      headquarters: form.headquarters.trim(),
      partyAffiliation: form.partyAffiliation.trim(),
      slogan: form.slogan.trim(),
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      setupCompleted: true,
    });
    if (form.clearDemoOnFinish) {
      clearDemoData();
    }
    setSetupWizardOpen(false);
    setStep(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Campaign Administrator Setup Wizard"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSetupWizardOpen(false);
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Campaign Initial Setup Wizard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 4 · Configure identity, official assets, departments, and operational scope
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSetupWizardOpen(false)}
            aria-label="Close setup wizard"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={form.campaignName}
                  onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  value={form.candidateName}
                  onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Party Affiliation (Supply Official Value)
                </label>
                <input
                  type="text"
                  value={form.partyAffiliation}
                  onChange={(e) => setForm({ ...form, partyAffiliation: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Election Type
                </label>
                <select
                  value={form.electionType}
                  onChange={(e) => setForm({ ...form, electionType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option>Gubernatorial Campaign</option>
                  <option>Presidential Campaign</option>
                  <option>Senatorial Campaign</option>
                  <option>General Campaign Operations</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Election Year
                </label>
                <input
                  type="text"
                  value={form.electionYear}
                  onChange={(e) => setForm({ ...form, electionYear: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Headquarters Address
                </label>
                <input
                  type="text"
                  value={form.headquarters}
                  onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official Campaign Slogan
                </label>
                <input
                  type="text"
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{form.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      className="w-9 h-9 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{form.accentColor}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {(
                  [
                    ['portraitDataUrl', 'Candidate Portrait'],
                    ['campaignLogoDataUrl', 'Campaign Logo'],
                    ['partyLogoDataUrl', 'Party Emblem'],
                  ] as const
                ).map(([field, label]) => (
                  <label
                    key={field}
                    className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center"
                  >
                    <Upload className="w-4 h-4 text-slate-400 mb-1.5" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {branding[field] ? 'Uploaded (Replace)' : 'Upload PNG/JPG'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(field, e.target.files?.[0])}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Geographic Operational Scope
                </label>
                <select
                  value={form.geographicScope}
                  onChange={(e) => setForm({ ...form, geographicScope: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option>All 36 States & FCT (774 LGAs)</option>
                  <option>Katsina State Focus (34 LGAs) + National Liaison</option>
                  <option>North-West Geopolitical Zone (7 States / 186 LGAs)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Departments ({departments.length} configured)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={form.newDepartment}
                    onChange={(e) => setForm({ ...form, newDepartment: e.target.value })}
                    placeholder="Add custom campaign directorate..."
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (form.newDepartment.trim()) {
                        addDepartment(form.newDepartment.trim());
                        setForm({ ...form, newDepartment: '' });
                      }
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-700 rounded-md whitespace-nowrap"
                  >
                    Add Department
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {departments.map((d) => (
                    <div key={d} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Official Campaign Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    HQ Situation Room Hotline
                  </label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.clearDemoOnFinish}
                  onChange={(e) => setForm({ ...form, clearDemoOnFinish: e.target.checked })}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white mb-0.5">
                    Clear DEMO DATA upon completion
                  </strong>
                  Removes all sample personnel, incidents, calls, and demo polling units so you can onboard live campaign records immediately.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Check className="w-4 h-4" /> Save Campaign Configuration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
