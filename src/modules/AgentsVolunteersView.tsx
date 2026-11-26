import React, { useMemo, useState } from 'react';
import { Download, Plus, Search, UserCheck } from 'lucide-react';
import { z } from 'zod';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import { exportRowsToCsv } from '../lib/analytics';
import { canAccessState } from '../lib/rbac';
import type { PersonnelRecord, RoleName } from '../types/campaign';

const registrationSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  phone: z.string().min(7, 'Valid contact phone number is required.'),
  stateCode: z.string().min(2),
  lga: z.string().min(2, 'Select a valid LGA.'),
  supervisor: z.string().min(2, 'Supervisor name is required.'),
});

export const AgentsVolunteersView: React.FC = () => {
  const {
    branding,
    personnel,
    addPersonnel,
    updatePersonnelAssignment,
    departments,
    currentUser,
  } = useCampaign();

  const [tab, setTab] = useState<'all' | 'agents' | 'volunteers'>('all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    role: 'Polling Unit Agent' as RoleName,
    orgLevel: 'Polling Unit' as PersonnelRecord['orgLevel'],
    department: departments[2] || 'Field Operations',
    stateCode: 'KT',
    lga: 'Katsina',
    ward: '',
    supervisor: 'Sadiq Umar Matazu',
    phone: '',
    trainingStatus: 'Scheduled' as PersonnelRecord['trainingStatus'],
    isVolunteer: false,
    isFieldAgent: true,
  });

  const scopedPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      if (!canAccessState(currentUser, p.stateCode)) return false;
      if (tab === 'agents' && !p.isFieldAgent) return false;
      if (tab === 'volunteers' && !p.isVolunteer) return false;
      if (stateFilter !== 'All' && p.stateCode !== stateFilter) return false;
      const q = search.trim().toLowerCase();
      if (
        q &&
        !p.fullName.toLowerCase().includes(q) &&
        !p.lga.toLowerCase().includes(q) &&
        !p.role.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [personnel, currentUser, tab, stateFilter, search]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || 'Invalid registration details.');
      return;
    }
    addPersonnel({
      fullName: form.fullName.trim(),
      role: form.role,
      orgLevel: form.orgLevel,
      department: form.department,
      stateCode: form.stateCode,
      lga: form.lga,
      ward: form.ward.trim() || undefined,
      supervisor: form.supervisor.trim(),
      phone: form.phone.trim(),
      status: 'Active',
      trainingStatus: form.trainingStatus,
      checkedIn: false,
      isVolunteer: form.isVolunteer,
      isFieldAgent: form.isFieldAgent,
      isDemo: false,
    });
    setForm({ ...form, fullName: '', phone: '', ward: '' });
    setShowForm(false);
  };

  const handleExport = () => {
    const csv = exportRowsToCsv(
      ['Name', 'Role', 'Department', 'State', 'LGA', 'Supervisor', 'Training', 'Status', 'Checked In'],
      scopedPersonnel.map((p) => [
        p.fullName,
        p.role,
        p.department,
        p.stateCode,
        p.lga,
        p.supervisor,
        p.trainingStatus,
        p.status,
        p.checkedIn ? 'Yes' : 'No',
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_agents_volunteers_deployment.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lgasForSelected = STATE_BY_CODE[form.stateCode]?.lgas ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Agent & Volunteer Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register, train, deploy, and track field agents and volunteers across Nigerian administrative units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" /> Export Deployment CSV
          </button>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> Register Personnel
          </button>
        </div>
      </div>

      {/* Registration Drawer/Form */}
      {showForm && (
        <form
          onSubmit={handleRegister}
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4"
        >
          <h3 className="text-sm font-bold">New Agent / Volunteer Registration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 ..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as RoleName;
                  setForm({
                    ...form,
                    role,
                    isVolunteer: role === 'Volunteer',
                    isFieldAgent: role === 'Polling Unit Agent' || role === 'Field Supervisor',
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="Polling Unit Agent">Polling Unit Agent</option>
                <option value="Field Supervisor">Field Supervisor</option>
                <option value="Ward Coordinator">Ward Coordinator</option>
                <option value="LGA Coordinator">LGA Coordinator</option>
                <option value="State Coordinator">State Coordinator</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assigned State</label>
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
              <label className="block text-xs font-medium mb-1">Assigned LGA</label>
              <select
                value={form.lga}
                onChange={(e) => setForm({ ...form, lga: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {lgasForSelected.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Supervisor *</label>
              <input
                type="text"
                value={form.supervisor}
                onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Save Registration
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          {(
            [
              ['all', `All Personnel (${personnel.length})`],
              ['agents', `Field Agents (${personnel.filter((p) => p.isFieldAgent).length})`],
              ['volunteers', `Volunteers (${personnel.filter((p) => p.isVolunteer).length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                tab === key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role, LGA..."
              className="bg-transparent text-xs focus:outline-none w-44"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label="Filter personnel by state"
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md"
          >
            <option value="All">All States</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Personnel</th>
                <th className="py-2.5 px-3 font-semibold">Role & Department</th>
                <th className="py-2.5 px-3 font-semibold">Geography</th>
                <th className="py-2.5 px-3 font-semibold">Supervisor</th>
                <th className="py-2.5 px-3 font-semibold">Training</th>
                <th className="py-2.5 px-3 font-semibold">Deployment</th>
                <th className="py-2.5 px-4 font-semibold text-right">Check-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scopedPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No personnel match your current role scope or filter criteria.
                  </td>
                </tr>
              ) : (
                scopedPersonnel.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{p.phone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{p.role}</div>
                      <div className="text-[11px] text-slate-500">{p.department}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-500 mr-1">{p.stateCode}</span>
                      {p.lga}
                      {p.ward && <div className="text-[11px] text-slate-500">{p.ward}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{p.supervisor}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={p.trainingStatus}
                        aria-label={`Training status for ${p.fullName}`}
                        onChange={(e) =>
                          updatePersonnelAssignment(p.id, {
                            trainingStatus: e.target.value as PersonnelRecord['trainingStatus'],
                          })
                        }
                        className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5"
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Not Started">Not Started</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={p.status}
                        aria-label={`Deployment status for ${p.fullName}`}
                        onChange={(e) =>
                          updatePersonnelAssignment(p.id, {
                            status: e.target.value as PersonnelRecord['status'],
                          })
                        }
                        className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5"
                      >
                        <option value="Deployed">Deployed</option>
                        <option value="Active">Active</option>
                        <option value="Standby">Standby</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => updatePersonnelAssignment(p.id, { checkedIn: !p.checkedIn })}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          p.checkedIn
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {p.checkedIn ? 'Checked In' : 'Mark Checked In'}
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
