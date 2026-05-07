import { getCurrentWeekDates } from '../../hooks/useCompletions'
import { DAY_LABELS } from '../../config/constants'

export default function WeekGrid({ habits, completions, onToggle }) {
  const weekDates = getCurrentWeekDates() // Sun–Sat of current week
  const today = new Date().toISOString().split('T')[0]

  const isCompleted = (habitId, date) =>
    completions.some(c => c.habit_id === habitId && c.date === date)

  const isFuture = (date) => date > today

  // Get the day-of-week label and whether it's today
  const dayInfo = weekDates.map(date => {
    const d = new Date(date + 'T00:00:00')
    return {
      date,
      label: DAY_LABELS[d.getDay()],
      isToday: date === today,
      isFuture: date > today,
    }
  })

  if (habits.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-medium">No habits yet</p>
        <p className="text-sm mt-1">Add habits from the Today tab to see the weekly grid</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="min-w-[480px] px-1">
        {/* Header row */}
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '1fr repeat(7, 2.5rem)' }}>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide pl-2">
            Habit
          </div>
          {dayInfo.map(({ date, label, isToday }) => (
            <div
              key={date}
              className={`text-center text-xs font-bold uppercase tracking-wide ${
                isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Habit rows */}
        <div className="space-y-1.5">
          {habits.map((habit, idx) => (
            <div
              key={habit.id}
              className="grid gap-1 items-center animate-fade-in"
              style={{
                gridTemplateColumns: '1fr repeat(7, 2.5rem)',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              {/* Habit name */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
                <span className="text-base flex-shrink-0">{habit.emoji}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{habit.name}</span>
              </div>

              {/* Day cells */}
              {dayInfo.map(({ date, isToday, isFuture }) => {
                const done = isCompleted(habit.id, date)
                return (
                  <button
                    key={date}
                    id={`week-cell-${habit.id}-${date}`}
                    onClick={() => !isFuture && onToggle(habit.id, date)}
                    disabled={isFuture}
                    aria-label={`${habit.name} on ${date}: ${done ? 'completed' : 'not completed'}`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                      ${isFuture
                        ? 'opacity-20 cursor-not-allowed bg-slate-100 dark:bg-slate-700/30'
                        : done
                          ? 'bg-violet-600 shadow-lg shadow-violet-500/30 hover:bg-violet-700'
                          : isToday
                            ? 'bg-slate-100 dark:bg-slate-700 border-2 border-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20'
                            : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {done && (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
