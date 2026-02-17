'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ContentPlan {
  id: string;
  title: string;
  description: string | null;
  keyword: string | null;
  status: string;
  priority: string;
  plannedDate: string | null;
  assignedTo: string | null;
  articleId: string | null;
  notes: string | null;
  color: string;
}

const STATUSES = [
  { value: 'idea', label: 'Nápady', color: 'bg-gray-100' },
  { value: 'planned', label: 'Naplánováno', color: 'bg-blue-100' },
  { value: 'in_progress', label: 'V práci', color: 'bg-yellow-100' },
  { value: 'ready', label: 'Připraveno', color: 'bg-green-100' },
  { value: 'published', label: 'Publikováno', color: 'bg-emerald-100' },
];

const PRIORITIES = [
  { value: 'low', label: 'Nízká', color: 'text-gray-500' },
  { value: 'medium', label: 'Střední', color: 'text-yellow-600' },
  { value: 'high', label: 'Vysoká', color: 'text-red-600' },
];

export default function PlannerPage() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    keyword: '',
    status: 'idea',
    priority: 'medium',
    plannedDate: '',
    notes: '',
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/planner');
      const data = await res.json();
      setPlans(data);
    } catch {
      toast.error('Nepodařilo se načíst plány');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreatePlan = async () => {
    if (!newPlan.title.trim()) {
      toast.error('Zadejte název');
      return;
    }

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });

      if (!res.ok) throw new Error('Chyba při vytváření');

      toast.success('Plán vytvořen');
      setShowNewForm(false);
      setNewPlan({ title: '', description: '', keyword: '', status: 'idea', priority: 'medium', plannedDate: '', notes: '' });
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (planId: string, newStatus: string) => {
    try {
      await fetch(`/api/planner/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
      );
    } catch {
      toast.error('Nepodařilo se aktualizovat stav');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Smazat tento plán?')) return;
    try {
      await fetch(`/api/planner/${planId}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plán smazán');
    } catch {
      toast.error('Nepodařilo se smazat plán');
    }
  };

  // Calendar helpers
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getPlansForDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return plans.filter((p) => p.plannedDate?.startsWith(dateStr));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Planner</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Kalendář
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            + Nový plán
          </button>
        </div>
      </div>

      {/* New Plan Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nový obsahový plán</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newPlan.title}
                onChange={(e) => setNewPlan((p) => ({ ...p, title: e.target.value }))}
                placeholder="Název tématu *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
                placeholder="Popis"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
              <input
                type="text"
                value={newPlan.keyword}
                onChange={(e) => setNewPlan((p) => ({ ...p, keyword: e.target.value }))}
                placeholder="Klíčové slovo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newPlan.priority}
                  onChange={(e) => setNewPlan((p) => ({ ...p, priority: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newPlan.plannedDate}
                  onChange={(e) => setNewPlan((p) => ({ ...p, plannedDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <textarea
                value={newPlan.notes}
                onChange={(e) => setNewPlan((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Poznámky"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Zrušit
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Načítání...</div>
      ) : view === 'kanban' ? (
        /* Kanban Board */
        <div className="grid grid-cols-5 gap-4 overflow-x-auto">
          {STATUSES.map((status) => {
            const statusPlans = plans.filter((p) => p.status === status.value);
            return (
              <div key={status.value} className={`${status.color} rounded-xl p-3 min-h-[400px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{status.label}</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {statusPlans.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-1">{plan.title}</p>
                      {plan.keyword && (
                        <p className="text-xs text-primary-600 mb-1">KW: {plan.keyword}</p>
                      )}
                      {plan.plannedDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(plan.plannedDate).toLocaleDateString('cs-CZ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs font-medium ${
                            PRIORITIES.find((p) => p.value === plan.priority)?.color || ''
                          }`}
                        >
                          {PRIORITIES.find((p) => p.value === plan.priority)?.label}
                        </span>
                        <div className="flex gap-1">
                          {STATUSES.filter((s) => s.value !== plan.status)
                            .slice(0, 2)
                            .map((s) => (
                              <button
                                key={s.value}
                                onClick={() => handleUpdateStatus(plan.id, s.value)}
                                className="text-xs px-1.5 py-0.5 bg-gray-100 rounded hover:bg-gray-200"
                                title={`Přesunout do: ${s.label}`}
                              >
                                {s.label.slice(0, 3)}
                              </button>
                            ))}
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-xs px-1.5 py-0.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11);
                  setCalendarYear(calendarYear - 1);
                } else {
                  setCalendarMonth(calendarMonth - 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              &larr;
            </button>
            <h2 className="text-lg font-semibold">
              {new Date(calendarYear, calendarMonth).toLocaleString('cs-CZ', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              onClick={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500">
                {day}
              </div>
            ))}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
            ))}
            {calendarDays.map((day) => {
              const dayPlans = getPlansForDay(day);
              const isToday =
                day === now.getDate() &&
                calendarMonth === now.getMonth() &&
                calendarYear === now.getFullYear();
              return (
                <div
                  key={day}
                  className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
                >
                  <span
                    className={`text-xs font-medium ${isToday ? 'text-primary-600' : 'text-gray-500'}`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 truncate"
                        title={plan.title}
                      >
                        {plan.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
