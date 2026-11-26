import React, { useState } from 'react';
import { Calendar, CheckSquare, Plus, Square } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import type { CampaignEvent } from '../types/campaign';

export const EventsView: React.FC = () => {
  const { branding, events, createEvent, toggleEventChecklistItem, departments, currentUser } = useCampaign();
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    eventType: 'Town Hall' as CampaignEvent['eventType'],
    date: '2026-12-05',
    time: '11:00 WAT',
    stateCode: 'KT',
    lga: 'Katsina',
    venue: '',
    responsibleTeam: departments[6] || 'Events & Mobilization',
    estimatedAttendance: 500,
    budgetNgn: 1500000,
    notes: '',
  });

  const filtered = events.filter((e) => typeFilter === 'All' || e.eventType === typeFilter);
  const lgas = STATE_BY_CODE[form.stateCode]?.lgas ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 4 || !form.venue.trim()) {
      setFormError('Event title and venue are required.');
      return;
    }
    createEvent({
      title: form.title.trim(),
      eventType: form.eventType,
      date: form.date,
      time: form.time,
      stateCode: form.stateCode,
      lga: form.lga,
      venue: form.venue.trim(),
      organizer: currentUser.displayName,
      responsibleTeam: form.responsibleTeam,
      estimatedAttendance: Number(form.estimatedAttendance) || 0,
      budgetNgn: Number(form.budgetNgn) || 0,
      status: 'Planned',
      equipmentRequired: ['PA Sound System', 'Backup Power', 'Accreditation Desk'],
      checklist: [
        { id: `ec-${Date.now()}-1`, item: 'Confirm venue & security clearance', completed: false },
        { id: `ec-${Date.now()}-2`, item: 'Assign logistics & transport convoy', completed: false },
        { id: `ec-${Date.now()}-3`, item: 'Brief volunteer ushers & media crew', completed: false },
      ],
      notes: form.notes.trim(),
      isDemo: false,
    });
    setForm({ ...form, title: '', venue: '', notes: '' });
    setShowCreate(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Events & Operations Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate rallies, town halls, stakeholder meetings, volunteer training, venues, budgets, and readiness checklists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter events by category"
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-md"
          >
            <option value="All">All Event Types</option>
            <option value="Campaign Rally">Campaign Rally</option>
            <option value="Town Hall">Town Hall</option>
            <option value="Community Meeting">Community Meeting</option>
            <option value="Stakeholder Meeting">Stakeholder Meeting</option>
            <option value="Press Event">Press Event</option>
            <option value="Volunteer Training">Volunteer Training</option>
            <option value="Internal Strategy">Internal Strategy</option>
          </select>
          <button
            type="button"
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Event
          </button>
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <h3 className="text-sm font-bold">Schedule New Campaign Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Event Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Event Type</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value as CampaignEvent['eventType'] })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option>Campaign Rally</option>
                <option>Town Hall</option>
                <option>Community Meeting</option>
                <option>Stakeholder Meeting</option>
                <option>Press Event</option>
                <option>Volunteer Training</option>
                <option>Internal Strategy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Time (WAT)</label>
              <input
                type="text"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Venue *</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">State</label>
              <select
                value={form.stateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({ ...form, stateCode: code, lga: STATE_BY_CODE[code]?.lgas[0] || '' });
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">LGA</label>
              <select
                value={form.lga}
                onChange={(e) => setForm({ ...form, lga: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {lgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Est. Attendance / Budget (NGN)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={form.estimatedAttendance}
                  onChange={(e) => setForm({ ...form, estimatedAttendance: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
                <input
                  type="number"
                  value={form.budgetNgn}
                  onChange={(e) => setForm({ ...form, budgetNgn: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Create Event & Checklist
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-xs text-slate-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Event Operations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((evt) => {
          const doneCount = evt.checklist.filter((c) => c.completed).length;
          return (
            <div
              key={evt.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-mono">{evt.date} · {evt.time}</span>
                    <span>· {evt.eventType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{evt.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {evt.venue} ({evt.stateCode}/{evt.lga}) · Lead: {evt.organizer}
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  {evt.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Est. Attendance</div>
                  <div className="font-mono font-semibold tabular-nums">{evt.estimatedAttendance.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Budget Allocation</div>
                  <div className="font-mono font-semibold tabular-nums">₦{evt.budgetNgn.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Readiness</div>
                  <div className="font-mono font-semibold tabular-nums">
                    {doneCount}/{evt.checklist.length} steps
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Operational Checklist
                </div>
                {evt.checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEventChecklistItem(evt.id, item.id)}
                    className="w-full flex items-center gap-2 text-left text-xs py-1 hover:opacity-80"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                      {item.item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
