import React, { useMemo, useState } from 'react';
import { CheckSquare, Columns3, List, Plus, Sparkles } from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES } from '../data/nigeriaGeo';
import { canPerformAction } from '../lib/rbac';
import type { TaskPriority, TaskStatus } from '../types/campaign';

const ALL_STATUSES: TaskStatus[] = [
  'Backlog',
  'Pending',
  'Assigned',
  'In Progress',
  'Awaiting Approval',
  'Blocked',
  'Completed',
  'Cancelled',
];

const KANBAN_COLUMNS: TaskStatus[] = [
  'Pending',
  'Assigned',
  'In Progress',
  'Awaiting Approval',
  'Blocked',
  'Completed',
];

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const TASK_TEMPLATES = [
  {
    name: 'Polling Unit Readiness Verification',
    department: 'Field Operations',
    priority: 'high' as TaskPriority,
    description: 'Confirm agent assignments, ward supervisor contact sheets, and backup power readiness.',
    subtasks: [
      'Confirm accredited agent roster for target LGAs',
      'Verify field supervisor escalation phone tree',
      'Test offline mobile check-in sync with HQ',
    ],
  },
  {
    name: 'State Town Hall Logistics Checklist',
    department: 'Events & Mobilization',
    priority: 'medium' as TaskPriority,
    description: 'Coordinate venue clearance, public address systems, accredited signage, and safety marshals.',
    subtasks: [
      'Confirm venue authorization and capacity',
      'Dispatch audio/staging equipment manifest',
      'Brief volunteer crowd safety stewards',
    ],
  },
  {
    name: 'Call Center Shift Handover Protocol',
    department: 'Call Center & Public Inquiries',
    priority: 'medium' as TaskPriority,
    description: 'Audit open call cases, verify escalated tickets, and confirm incoming shift operator roster.',
    subtasks: [
      'Review all open and escalated inquiry logs',
      'Confirm operator desk headsets and connectivity',
      'Brief incoming supervisor on regional issues',
    ],
  },
];

export const TasksView: React.FC = () => {
  const {
    branding,
    tasks,
    createTask,
    updateTaskStatus,
    toggleTaskSubtask,
    departments,
    currentUser,
  } = useCampaign();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: departments[0] || 'Field Operations',
    supervisor: 'Campaign Manager',
    assigneeName: '',
    stateCode: 'KT',
    priority: 'medium' as TaskPriority,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    subtasksText: '',
  });

  const canWrite = canPerformAction(currentUser, 'write');

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (deptFilter !== 'All' && t.department !== deptFilter) return false;
        return true;
      }),
    [tasks, statusFilter, deptFilter]
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 4) {
      setFormError('Task title must be at least 4 characters.');
      return;
    }
    if (!form.assigneeName.trim()) {
      setFormError('Assign a responsible coordinator or officer.');
      return;
    }

    const subtaskLines = form.subtasksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    createTask({
      title: form.title.trim(),
      description: form.description.trim() || 'Operational workflow item.',
      department: form.department,
      supervisor: form.supervisor.trim() || currentUser.displayName,
      assigneeName: form.assigneeName.trim(),
      stateCode: form.stateCode,
      priority: form.priority,
      status: 'Assigned',
      dueDate: form.dueDate,
      subtasks: subtaskLines.map((label, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        label,
        done: false,
      })),
      isDemo: false,
    });

    setForm({
      title: '',
      description: '',
      department: departments[0] || 'Field Operations',
      supervisor: 'Campaign Manager',
      assigneeName: '',
      stateCode: 'KT',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      subtasksText: '',
    });
    setShowCreate(false);
  };

  const instantiateTemplate = (tpl: (typeof TASK_TEMPLATES)[number]) => {
    createTask({
      title: tpl.name,
      description: tpl.description,
      department: tpl.department,
      supervisor: currentUser.displayName,
      assigneeName: 'State Operations Desk',
      stateCode: 'KT',
      priority: tpl.priority,
      status: 'Pending',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      subtasks: tpl.subtasks.map((label, idx) => ({
        id: `tpl-${Date.now()}-${idx}`,
        label,
        done: false,
      })),
      isDemo: false,
    });
  };

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const blockedCount = tasks.filter((t) => t.status === 'Blocked').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'Completed').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tasks & Operational Workflow
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track departmental execution across 8 workflow stages with subtask checklists and reusable campaign templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#0F172A]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" /> Board
            </button>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Total Tasks</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {tasks.length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {completedCount}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Blocked / Escalated</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-1">
            {blockedCount}
          </div>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500">Open Urgent Tasks</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
            {urgentCount}
          </div>
        </div>
      </div>

      {/* Reusable Campaign Workflow Templates */}
      {canWrite && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Reusable Campaign Task Templates
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TASK_TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="p-3 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">{tpl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{tpl.department} · {tpl.subtasks.length} checklist steps</div>
                </div>
                <button
                  type="button"
                  onClick={() => instantiateTemplate(tpl)}
                  className="self-start text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  + Deploy Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Operational Task</h3>
          {formError && (
            <div className="text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20 px-3 py-2 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="task-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Audit Kano South Ward Coordinator Check-Ins"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-assignee" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assignee *
              </label>
              <input
                id="task-assignee"
                type="text"
                value={form.assigneeName}
                onChange={(e) => setForm({ ...form, assigneeName: e.target.value })}
                placeholder="Coordinator or staff name"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="task-dept" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                id="task-dept"
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
                <label htmlFor="task-state" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State
                </label>
                <select
                  id="task-state"
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {NIGERIA_STATES.map((st) => (
                    <option key={st.code} value={st.code}>{st.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-due" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="task-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Instructions
              </label>
              <textarea
                id="task-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="task-subtasks" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subtasks (one per line)
              </label>
              <textarea
                id="task-subtasks"
                rows={2}
                value={form.subtasksText}
                onChange={(e) => setForm({ ...form, subtasksText: e.target.value })}
                placeholder="Step 1&#10;Step 2"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <select
          aria-label="Filter tasks by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
        >
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter tasks by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-200"
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* View Mode: List vs Kanban */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filtered.map((task) => {
            const doneSubs = task.subtasks.filter((s) => s.done).length;
            return (
              <div
                key={task.id}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`uppercase font-mono font-semibold ${
                          task.priority === 'urgent'
                            ? 'text-red-700 dark:text-red-400'
                            : task.priority === 'high'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{task.department}</span>
                      <span aria-hidden="true">·</span>
                      <span>Assignee: {task.assigneeName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{task.description}</p>
                  </div>

                  <div className="shrink-0">
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      disabled={!canWrite}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-60"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {task.subtasks.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      Checklist ({doneSubs}/{task.subtasks.length})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {task.subtasks.map((st) => (
                        <label
                          key={st.id}
                          className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={st.done}
                            disabled={!canWrite}
                            onChange={() => toggleTaskSubtask(task.id, st.id)}
                            className="rounded border-slate-300"
                          />
                          <span className={st.done ? 'line-through text-slate-400' : ''}>{st.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {KANBAN_COLUMNS.map((colStatus) => {
            const colTasks = filtered.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-50/80 dark:bg-[#0D1425] border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 px-1">
                  <span>{colStatus}</span>
                  <span className="font-mono tabular-nums text-slate-500">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-4">No tasks</div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-2"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.assigneeName} · Due {t.dueDate}
                        </div>
                        <select
                          aria-label={`Move ${t.title} to status`}
                          value={t.status}
                          disabled={!canWrite}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
