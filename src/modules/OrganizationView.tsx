import React, { useState } from 'react';
import { Building2, Plus, Users } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';

const ORG_LEVELS: Array<'HQ' | 'State' | 'Senatorial' | 'LGA' | 'Ward' | 'Polling Unit'> = [
  'HQ',
  'State',
  'Senatorial',
  'LGA',
  'Ward',
  'Polling Unit',
];

export const OrganizationView: React.FC = () => {
  const { branding, departments, addDepartment, personnel } = useCampaign();
  const [newDept, setNewDept] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const filteredPersonnel = personnel.filter(
    (p) => selectedLevel === 'All' || p.orgLevel === selectedLevel
  );

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Campaign Organization & Command Structure
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configurable multi-tier command hierarchy from National HQ through State, Senatorial, LGA, Ward, and Polling Unit desks.
        </p>
      </div>

      {/* Command Hierarchy Tiers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ORG_LEVELS.map((lvl) => {
          const count = personnel.filter((p) => p.orgLevel === lvl).length;
          const active = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(active ? 'All' : lvl)}
              className={`p-3.5 rounded-md border text-left transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-800 dark:border-emerald-700'
                  : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div className={`text-[11px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>{lvl} Tier</div>
              <div className="text-xl font-bold font-mono tabular-nums mt-1">{count}</div>
              <div className={`text-[10px] mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                assigned staff
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Departments Directorate */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold">Campaign Directorates ({departments.length})</h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newDept.trim()) {
                addDepartment(newDept.trim());
                setNewDept('');
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="Add new campaign department..."
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {departments.map((dept) => {
              const count = personnel.filter((p) => p.department === dept).length;
              return (
                <div key={dept} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{dept}</span>
                  <span className="font-mono text-slate-500 tabular-nums">{count} staff</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organizational Chain Roster */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold">
                Organizational Reporting Chain ({selectedLevel === 'All' ? 'All Tiers' : `${selectedLevel} Tier`})
              </h3>
            </div>
            {selectedLevel !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedLevel('All')}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Show All
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Member</th>
                  <th className="py-2.5 px-3 font-semibold">Tier / Role</th>
                  <th className="py-2.5 px-3 font-semibold">Reports To</th>
                  <th className="py-2.5 px-4 font-semibold">Geographic Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPersonnel.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{p.fullName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] text-slate-500 mr-1.5">{p.orgLevel}</span>
                      {p.role}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{p.supervisor}</td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {p.stateCode} / {p.lga}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
