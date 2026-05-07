import WeekGrid from '../components/week/WeekGrid'

export default function WeekPage({ habits, completions, onToggle }) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Sunday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Saturday

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Weekly Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-600 inline-block" /> Missed
          </span>
        </div>
      </div>

      <div className="glass-card-solid p-4">
        <WeekGrid habits={habits} completions={completions} onToggle={onToggle} />
      </div>

      {/* Week summary */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {habits.map(h => {
            const weekDates = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart)
              d.setDate(weekStart.getDate() + i)
              return d.toISOString().split('T')[0]
            })
            const done = weekDates.filter(d =>
              completions.some(c => c.habit_id === h.id && c.date === d)
            ).length
            return (
              <div key={h.id} className="glass-card-solid p-3 flex items-center gap-3 animate-fade-in">
                <span className="text-xl">{h.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{h.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${(done / 7) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{done}/7</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
