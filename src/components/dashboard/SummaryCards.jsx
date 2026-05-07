import { useMemo } from 'react'
import { calculateStreak, calculateCompletionRate } from '../../hooks/useStreak'
import { getLastNDates } from '../../hooks/useCompletions'

export default function SummaryCards({ habits, completions }) {
  const today = new Date().toISOString().split('T')[0]
  const last7 = getLastNDates(7)

  const stats = useMemo(() => {
    const completedToday = habits.filter(h =>
      completions.some(c => c.habit_id === h.id && c.date === today)
    ).length

    // Average completion rate across all habits for last 7 days
    let totalRate = 0
    habits.forEach(h => {
      const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
      totalRate += calculateCompletionRate(dates, last7)
    })
    const avgRate = habits.length > 0 ? Math.round(totalRate / habits.length) : 0

    // Best streak among all habits
    let bestStreak = 0
    habits.forEach(h => {
      const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
      const s = calculateStreak(dates)
      if (s > bestStreak) bestStreak = s
    })

    return { completedToday, total: habits.length, avgRate, bestStreak }
  }, [habits, completions, today])

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="metric-card animate-fade-in" style={{ animationDelay: '0ms' }}>
        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
          {stats.completedToday}
          <span className="text-base font-normal text-slate-400">/{stats.total}</span>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">Done today</div>
        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: stats.total > 0 ? `${(stats.completedToday / stats.total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="metric-card animate-fade-in" style={{ animationDelay: '80ms' }}>
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {stats.avgRate}<span className="text-base font-normal text-slate-400">%</span>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">7-day rate</div>
        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.avgRate}%` }}
          />
        </div>
      </div>

      <div className="metric-card animate-fade-in" style={{ animationDelay: '160ms' }}>
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
          {stats.bestStreak}
          <span className="text-lg">🔥</span>
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">Best streak</div>
        <div className="mt-2 text-xs text-slate-400">
          {stats.total} habit{stats.total !== 1 ? 's' : ''} tracked
        </div>
      </div>
    </div>
  )
}
