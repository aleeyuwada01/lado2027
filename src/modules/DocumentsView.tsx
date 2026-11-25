import React, { useMemo, useState } from 'react';
import { Download, FileText, Lock, Plus, Search, Upload } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { canPerformAction } from '../lib/rbac';
import type { CampaignDocument } from '../types/campaign';

const CATEGORIES: CampaignDocument['category'][] = [
  'Operations SOP',
  'Training Manual',
  'Legal & Compliance',
  'Geographic Dataset',
  'Briefing Pack',
  'Logistics Manifest',
];

const ACCESS_LEVELS: CampaignDocument['accessLevel'][] = [
  'All Authorized Staff',
  'Coordinators & Above',
  'Executive Only',
];

export const DocumentsView: React.FC = () => {
  const { branding, documents, addDocument, departments, currentUser } = useCampaign();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showUpload, setShowUpload] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Operations SOP' as CampaignDocument['category'],
    department: departments[0] || 'Executive Secretariat',
    accessLevel: 'Coordinators & Above' as CampaignDocument['accessLevel'],
    version: 'v1.0',
    fileSizeLabel: '1.2 MB PDF',
    summary: '',
  });

  const canWrite = canPerformAction(currentUser, 'write');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return documents.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q)
      );
    });
  }, [documents, searchTerm, categoryFilter]);

  const handleFilePicked = (file: File | undefined) => {
    if (!file) return;
    const kb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'DOC';
    setForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      fileSizeLabel: `${sizeLabel} ${ext}`,
    }));
  };

  const handleRegisterDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 4) {
      setFormError('Document title must be at least 4 characters.');
      return;
    }
    if (form.summary.trim().length < 10) {
      setFormError('Provide a short operational summary (minimum 10 characters).');
      return;
    }
    addDocument({
      title: form.title.trim(),
      category: form.category,
      department: form.department,
      accessLevel: form.accessLevel,
      version: form.version.trim() || 'v1.0',
      uploadedBy: currentUser.displayName,
      fileSizeLabel: form.fileSizeLabel,
      summary: form.summary.trim(),
      isDemo: false,
    });
    setForm({
      title: '',
      category: 'Operations SOP',
      department: departments[0] || 'Executive Secretariat',
      accessLevel: 'Coordinators & Above',
      version: 'v1.0',
      fileSizeLabel: '1.2 MB PDF',
      summary: '',
    });
    setShowUpload(false);
  };

  const handleDownloadBrief = (docItem: CampaignDocument) => {
    const content = [
      `${branding.campaignName}`,
      `Document Title: ${docItem.title}`,
      `Category: ${docItem.category}`,
      `Department: ${docItem.department}`,
      `Version: ${docItem.version}`,
      `Access Control: ${docItem.accessLevel}`,
      `Uploaded By: ${docItem.uploadedBy} on ${docItem.uploadedAt}`,
      `---`,
      docItem.summary,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${docItem.version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Document Vault
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Version-controlled SOPs, training manuals, legal compliance briefs, and geographic datasets with role-based access levels.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> Register Document
          </button>
        )}
      </div>

      {/* Category Counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter((prev) => (prev === cat ? 'All' : cat))}
            className={`text-left p-3 rounded-lg border transition-colors ${
              categoryFilter === cat
                ? 'border-slate-900 dark:border-slate-300 bg-slate-900 text-white dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] opacity-80 truncate">{cat}</div>
            <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
              {documents.filter((d) => d.category === cat).length}
            </div>
          </button>
        ))}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <form
          onSubmit={handleRegisterDocument}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload & Classify Campaign Document
          </h3>
          {formError && (
            <div className="text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20 px-3 py-2 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="doc-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                id="doc-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Ward Coordinator Election-Day Checklist v2.1"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="doc-file" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Attach Source File (Optional)
              </label>
              <label
                htmlFor="doc-file"
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="truncate">{form.fileSizeLabel}</span>
                <input
                  id="doc-file"
                  type="file"
                  className="sr-only"
                  onChange={(e) => handleFilePicked(e.target.files?.[0])}
                />
              </label>
            </div>

            <div>
              <label htmlFor="doc-cat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                id="doc-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CampaignDocument['category'] })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="doc-dept" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owning Department
              </label>
              <select
                id="doc-dept"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="doc-access" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Access Level
                </label>
                <select
                  id="doc-access"
                  value={form.accessLevel}
                  onChange={(e) => setForm({ ...form, accessLevel: e.target.value as CampaignDocument['accessLevel'] })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {ACCESS_LEVELS.map((al) => (
                    <option key={al} value={al}>{al}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="doc-ver" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Version
                </label>
                <input
                  id="doc-ver"
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="doc-summary" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Scope & Revision Notes *
              </label>
              <textarea
                id="doc-summary"
                rows={2}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Describe document purpose, target units, and revision highlights..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Save to Vault
            </button>
          </div>
        </form>
      )}

      {/* Search & List */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[220px] sm:max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search campaign documents"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, department, or summary..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          {categoryFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('All')}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 underline"
            >
              Clear Category Filter ({categoryFilter})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/70 dark:bg-slate-900/50">
                <th className="py-2.5 px-4 font-semibold">Document</th>
                <th className="py-2.5 px-4 font-semibold">Category & Dept</th>
                <th className="py-2.5 px-4 font-semibold">Access Control</th>
                <th className="py-2.5 px-4 font-semibold">Version / Size</th>
                <th className="py-2.5 px-4 font-semibold">Updated</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((docItem) => (
                  <tr key={docItem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{docItem.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {docItem.summary}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{docItem.category}</div>
                      <div className="text-[11px] text-slate-500">{docItem.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          docItem.accessLevel === 'Executive Only'
                            ? 'text-red-700 dark:text-red-400'
                            : docItem.accessLevel === 'Coordinators & Above'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> {docItem.accessLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      <div>{docItem.version}</div>
                      <div className="text-[11px] text-slate-500">{docItem.fileSizeLabel}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="font-mono tabular-nums">{docItem.uploadedAt}</div>
                      <div className="text-[11px]">{docItem.uploadedBy}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadBrief(docItem)}
                        aria-label={`Download manifest for ${docItem.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Download className="w-3 h-3" /> Brief
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
