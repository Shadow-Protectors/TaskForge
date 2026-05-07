import { useState } from 'react'
import SummaryCards from '../components/dashboard/SummaryCards'
import StreakAlertBanner from '../components/dashboard/StreakAlertBanner'
import HabitCard from '../components/dashboard/HabitCard'
import HabitForm from '../components/dashboard/HabitForm'

export default function TodayPage({ habits, completions, loading, onAddHabit, onUpdateHabit, onDeleteHabit, onToggle }) {
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  const handleSave = async (name, emoji) => {
    if (editingHabit) {
      await onUpdateHabit(editingHabit.id, name, emoji)
    } else {
      await onAddHabit(name, emoji)
    }
  }

  const openEdit = (habit) => {
    setEditingHabit(habit)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingHabit(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading your habits…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Streak alert */}
      <StreakAlertBanner habits={habits} completions={completions} />

      {/* Metric summary */}
      <SummaryCards habits={habits} completions={completions} />

      {/* Habit list header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Today&apos;s Habits</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          id="add-habit-btn"
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Habit
        </button>
      </div>

      {/* Habit list */}
      {habits.length === 0 ? (
        <div className="text-center py-16 glass-card-solid animate-fade-in">
          <p className="text-5xl mb-4">🌱</p>
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">No habits yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs mx-auto">
            Start building positive routines. Add your first habit to get going!
          </p>
          <button
            id="add-first-habit-btn"
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Add your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completions={completions}
              onToggle={onToggle}
              onEdit={openEdit}
              onDelete={onDeleteHabit}
            />
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <HabitForm
          habit={editingHabit}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
