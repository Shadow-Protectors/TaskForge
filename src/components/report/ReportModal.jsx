import { useMemo } from 'react'
import { getLastNDates } from '../../hooks/useCompletions'
import { calculateCompletionRate } from '../../hooks/useStreak'
import { CSV_FILENAME } from '../../config/constants'
import BarChart from './BarChart'

const BAR_COLORS = [
  '#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'
]

export default function ReportModal({ habits, completions, onClose }) {
  const last7 = getLastNDates(7)

  const habitStats = useMemo(() => {
    return habits.map((h, i) => {
      const dates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
      const rate = calculateCompletionRate(dates, last7)
      const completedDays = last7.filter(d => dates.includes(d))
      return { ...h, rate, completedDays, color: BAR_COLORS[i % BAR_COLORS.length] }
    })
  }, [habits, completions])

  const downloadCSV = () => {
    const header = 'habit_name,emoji,date,completed\n'
    const rows = []
    habits.forEach(h => {
      const habitDates = completions.filter(c => c.habit_id === h.id).map(c => c.date)
      last7.forEach(date => {
        const done = habitDates.includes(date) ? 'yes' : 'no'
        rows.push(`"${h.name}","${h.emoji}",${date},${done}`)
      })
    })
    const csv = header + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = CSV_FILENAME
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-in border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Weekly Report</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Last 7 days performance</p>
          </div>
          <button
            id="report-close-btn"
            onClick={onClose}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Close report"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {habitStats.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <p className="text-4xl mb-3">📊</p>
              <p>No habits to report on yet</p>
            </div>
          ) : (
            habitStats.map(h => (
              <div key={h.id} className="glass-card-solid p-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{h.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {h.completedDays.length} of 7 days completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: h.color }}>{h.rate}%</p>
                  </div>
                </div>

                {/* Day bars */}
                <div className="flex items-end gap-2 justify-between">
                  {last7.map(date => {
                    const done = h.completedDays.includes(date)
                    const d = new Date(date + 'T00:00:00')
                    const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]
                    return (
                      <div key={date} className="flex flex-col items-center gap-1">
                        <div
                          className="w-7 rounded-lg transition-all duration-500"
                          style={{
                            height: '32px',
                            backgroundColor: done ? h.color : undefined,
                            opacity: done ? 1 : 0.15,
                          }}
                        />
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{dayLabel}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${h.rate}%`, backgroundColor: h.color }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with CSV download */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            id="download-csv-btn"
            onClick={downloadCSV}
            disabled={habits.length === 0}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
          <button
            onClick={onClose}
            className="btn-secondary px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
