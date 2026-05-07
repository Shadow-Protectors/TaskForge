import { useMemo } from 'react'

export default function Heatmap({ completions }) {
  // Generate dates for the last 52 weeks
  const grid = useMemo(() => {
    const weeks = []
    const today = new Date()
    
    // Start from 364 days ago (52 weeks)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 363)
    
    // Align to the start of that week (Sunday = 0)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    let current = new Date(startDate)
    for (let w = 0; w < 52; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split('T')[0]
        const count = completions.filter(c => c.date === dateStr).length
        
        week.push({
          date: dateStr,
          count,
          intensity: count === 0 ? 0 : Math.min(count, 4) // max intensity at 4+ habits
        })
        
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [completions])

  const intensityColors = [
    'bg-slate-100 dark:bg-slate-800/50',
    'bg-violet-200 dark:bg-violet-900/30',
    'bg-violet-400 dark:bg-violet-700/60',
    'bg-violet-600 dark:bg-violet-500/80',
    'bg-violet-800 dark:bg-violet-400',
  ]

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          Yearly Activity
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
          <span>Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${color}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {grid.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} completions`}
                  className={`w-2.5 h-2.5 rounded-sm transition-colors duration-300 ${intensityColors[day.intensity]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
        <span>1 year ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}
