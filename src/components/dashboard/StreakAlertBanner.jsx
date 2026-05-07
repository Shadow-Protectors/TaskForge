import { useMemo } from 'react'
import { STREAK_ALERT_HOUR } from '../../config/constants'
import { calculateStreak } from '../../hooks/useStreak'

export default function StreakAlertBanner({ habits, completions }) {
  const now = new Date()
  const currentHour = now.getHours()
  const today = now.toISOString().split('T')[0]

  const atRisk = useMemo(() => {
    if (currentHour < STREAK_ALERT_HOUR) return []

    return habits.filter(h => {
      const completedToday = completions.some(c => c.habit_id === h.id && c.date === today)
      if (completedToday) return false
      const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
      const streak = calculateStreak(dates)
      return streak > 0 // only show if they have an existing streak to lose
    })
  }, [habits, completions, currentHour, today])

  if (atRisk.length === 0) return null

  return (
    <div className="animate-slide-down bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
        <div className="min-w-0">
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            You&apos;re about to break your streak on:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {atRisk.map(h => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50"
              >
                <span>{h.emoji}</span>
                <span>{h.name}</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Complete them now to keep your streak alive! 🔥
          </p>
        </div>
      </div>
    </div>
  )
}
