import React, { useMemo, useState } from 'react';
import { ExternalLink, Newspaper, Plus, Radio, Search, ShieldCheck } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import { canPerformAction } from '../lib/rbac';
import type { MediaItem } from '../types/campaign';

const CLASSIFICATIONS: MediaItem['classification'][] = [
  'Confirmed Reporting',
  'Public Statement',
  'Commentary',
  'Unverified Information',
];

const REVIEW_STATUSES: MediaItem['reviewStatus'][] = [
  'Pending Review',
  'Reviewed',
  'Flagged for Comms',
];

export const MediaMonitoringView: React.FC = () => {
  const {
    branding,
    mediaSources,
    mediaItems,
    addMediaItem,
    updateMediaReviewStatus,
    currentUser,
  } = useCampaign();

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [reviewFilter, setReviewFilter] = useState<string>('All');
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    headline: '',
    sourceName: mediaSources[0]?.name || 'Authorized Public Press',
    sourceUrl: 'https://',
    classification: 'Unverified Information' as MediaItem['classification'],
    topic: 'Campaign Outreach',
    stateCode: 'KT',
    summary: '',
  });

  const canWrite = canPerformAction(currentUser, 'write');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return mediaItems.filter((item) => {
      if (classFilter !== 'All' && item.classification !== classFilter) return false;
      if (reviewFilter !== 'All' && item.reviewStatus !== reviewFilter) return false;
      if (!q) return true;
      return (
        item.headline.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [mediaItems, searchTerm, classFilter, reviewFilter]);

  const handleLogMedia = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.headline.trim().length < 6) {
      setFormError('Headline must be at least 6 characters.');
      return;
    }
    if (form.summary.trim().length < 12) {
      setFormError('Brief neutral summary must be at least 12 characters.');
      return;
    }
    const cleanUrl = form.sourceUrl.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      setFormError('Source URL must begin with https:// or http://');
      return;
    }

    addMediaItem({
      headline: form.headline.trim(),
      sourceName: form.sourceName.trim() || 'Authorized Public Feed',
      sourceUrl: cleanUrl || 'https://example.org',
      classification: form.classification,
      topic: form.topic.trim() || 'General Coverage',
      stateCode: form.stateCode,
      reviewStatus: 'Pending Review',
      summary: form.summary.trim(),
      isDemo: false,
    });

    setForm({
      headline: '',
      sourceName: mediaSources[0]?.name || 'Authorized Public Press',
      sourceUrl: 'https://',
      classification: 'Unverified Information',
      topic: 'Campaign Outreach',
      stateCode: 'KT',
      summary: '',
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Public Media Monitoring
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized public press, official broadcasts, and RSS coverage tracking with strict verification classification.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> Log Public Media Item
          </button>
        )}
      </div>

      {/* Compliance Guardrail */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white">Public Information Scope Only:</strong>{' '}
          This module logs only publicly published press articles, official broadcasts, and campaign press statements. Private account scraping, covert surveillance, and individual citizen profiling are strictly excluded.
        </div>
      </div>

      {/* Classification Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CLASSIFICATIONS.map((cls) => {
          const count = mediaItems.filter((m) => m.classification === cls).length;
          return (
            <div
              key={cls}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4"
            >
              <div className="text-xs text-slate-500">{cls}</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log New Media Form */}
      {showAdd && (
        <form
          onSubmit={handleLogMedia}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Log Authorized Public Media Record
          </h3>
          {formError && (
            <div className="text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20 px-3 py-2 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="media-headline" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Headline *
              </label>
              <input
                id="media-headline"
                type="text"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Enter exact published headline..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="media-source" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Public Source Name
              </label>
              <input
                id="media-source"
                type="text"
                value={form.sourceName}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="media-url" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Public Source URL
              </label>
              <input
                id="media-url"
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="media-class" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Verification Classification
              </label>
              <select
                id="media-class"
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value as MediaItem['classification'] })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="media-state" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State Focus
                </label>
                <select
                  id="media-state"
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st.code} value={st.code}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="media-topic" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic
                </label>
                <input
                  id="media-topic"
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="media-summary" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Neutral Operational Summary *
              </label>
              <textarea
                id="media-summary"
                rows={3}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Summarize key factual points without speculation..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Save Media Record
            </button>
          </div>
        </form>
      )}

      {/* Main Split: Feed + Authorized Public Sources */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Feed */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Search media monitoring feed"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search headlines, sources, topics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
              />
            </div>
            <select
              aria-label="Filter by classification"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Classifications</option>
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filter by review status"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
            >
              <option value="All">All Review States</option>
              {REVIEW_STATUSES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-xs text-slate-500">
                No public media records match the current filter.
              </div>
            ) : (
              filtered.map((item) => (
                <article
                  key={item.id}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-semibold ${
                          item.classification === 'Confirmed Reporting'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : item.classification === 'Unverified Information'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.classification}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.sourceName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{STATE_BY_CODE[item.stateCode]?.name || item.stateCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.topic}</span>
                      {item.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 dark:text-amber-400 font-medium">DEMO DATA</span>
                        </>
                      )}
                    </div>
                    <span className="font-mono tabular-nums">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                    <Newspaper className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{item.headline}</span>
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 font-mono">
                      <ExternalLink className="w-3 h-3" /> {item.sourceUrl}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Review:</span>
                      <select
                        aria-label={`Review status for ${item.headline}`}
                        value={item.reviewStatus}
                        disabled={!canWrite}
                        onChange={(e) =>
                          updateMediaReviewStatus(
                            item.id,
                            e.target.value as MediaItem['reviewStatus']
                          )
                        }
                        className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-60"
                      >
                        {REVIEW_STATUSES.map((rs) => (
                          <option key={rs} value={rs}>{rs}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Public Sources Registry */}
        <aside className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 h-fit space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-400" /> Authorized Public Sources
            </h3>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {mediaSources.filter((s) => s.active).length} active
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mediaSources.map((src) => (
              <div key={src.id} className="py-3 first:pt-0 last:pb-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{src.name}</span>
                  <span className={src.active ? 'text-emerald-700 dark:text-emerald-400 text-[11px]' : 'text-slate-400 text-[11px]'}>
                    {src.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{src.type}</div>
                <div className="text-[11px] font-mono text-slate-400 truncate">{src.url}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
