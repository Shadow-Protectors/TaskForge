import { useState } from 'react'
import confetti from 'canvas-confetti'
import { calculateStreak, calculateLongestStreak } from '../../hooks/useStreak'

export default function HabitCard({ habit, completions, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const habitDates = completions.filter(c => c.habit_id === habit.id).map(c => c.date)
  const isCompletedToday = habitDates.includes(today)
  const streak = calculateStreak(habitDates)

  const longestStreak = calculateLongestStreak(habitDates)

  const handleToggle = () => {
    if (!isCompletedToday) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#f43f5e']
      })
    }
    onToggle(habit.id, today)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${habit.name}"? This will also remove all completions.`)) return
    setDeleting(true)
    await onDelete(habit.id)
  }

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 animate-fade-in
        ${isCompletedToday
          ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-700/40'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
        }`}
    >
      {/* Checkbox */}
      <button
        id={`complete-habit-${habit.id}`}
        onClick={handleToggle}
        aria-label={`Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'complete'}`}
        className={`habit-checkbox ${isCompletedToday ? 'habit-checkbox-done' : 'hover:border-violet-400'}`}
        style={{ 
          backgroundColor: isCompletedToday ? habit.color || '#8b5cf6' : 'transparent',
          borderColor: isCompletedToday ? habit.color || '#8b5cf6' : undefined
        }}
      >
        {isCompletedToday && (
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Emoji */}
      <span className="text-2xl flex-shrink-0">{habit.emoji || '✅'}</span>

      {/* Name + streak */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate transition-colors ${
            isCompletedToday ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'
          }`}>
            {habit.name}
          </p>
          {habit.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
              {habit.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {streak > 0 && (
            <span className="streak-badge" style={{ backgroundColor: `${habit.color}15`, color: habit.color }}>
              🔥 {streak}d
            </span>
          )}
          {longestStreak > 0 && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span className="text-amber-500">🏆</span> {longestStreak}d best
            </span>
          )}
        </div>
      </div>

      {/* Actions (shown on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          id={`edit-habit-${habit.id}`}
          onClick={() => onEdit(habit)}
          aria-label={`Edit ${habit.name}`}
          className="btn-ghost p-2 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          id={`delete-habit-${habit.id}`}
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${habit.name}`}
          className="btn-danger p-2 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
